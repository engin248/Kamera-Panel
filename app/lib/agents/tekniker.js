import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

// Supabase İstemcisi
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Embeddings model
const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
});

// Tekniker LLM (GPT-4o)
const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.2, // Analitik ve net kararlar
});

/**
 * Tekniker Ajanı: Geçmiş üretim verilerini "model_memory_embeddings" tablosundan okuyarak 
 * yeni modelin (BOM) kârlılık ve risk oranlarını analiz eder.
 * @param {string} kumasCinsi 
 * @param {number} hedeflenenFasonKari 
 * @param {string} modelTipi 
 */
export async function analyzeModelRisk(kumasCinsi, hedeflenenFasonKari, modelTipi) {
    try {
        // 1. Sorguyu vektöre çevir
        const query = `${kumasCinsi} kumaşında ${modelTipi} üretimi yapıldığında ortalama fire ve kâr nedir?`;
        const queryEmbedding = await embeddings.embedQuery(query);

        // 2. Supabase pgVector Similarity Search (RPC ile veya normal arama ile Fallback)
        const { data: similarRecords, error } = await supabase.rpc("match_model_memory", {
            query_embedding: queryEmbedding,
            match_threshold: 0.70, // Benzerlik eşiği (Kumaş cinside benzerlerini bulmak için)
            match_count: 5,        // En yakın 5 tecrübe
        });

        let historyContext = "";

        if (error) {
            // Eğer pgVector RPC fonksiyonu henüz yazılmadıysa (fallback), düz LIKE araması ile okur
            console.warn("pgVector RPC missing, using fallback string match", error);
            const { data: regularRecords } = await supabase
                .from("model_memory_embeddings")
                .select("baglam_metni, fire_orani, karlilik_orani")
                .ilike("kumas_cinsi", `%${kumasCinsi}%`)
                .limit(5);

            if (regularRecords && regularRecords.length > 0) {
                historyContext = regularRecords.map(r => r.baglam_metni).join("\n");
            } else {
                historyContext = "Bu kumaş türünde geçmiş sistem hafızasında üretim veya fire kaydı bulunamadı.";
            }
        } else if (similarRecords && similarRecords.length > 0) {
            historyContext = similarRecords.map(r => r.baglam_metni).join("\n");
        } else {
            historyContext = "Bu kumaş türünde geçmiş sistem hafızasında üretim veya fire kaydı bulunamadı.";
        }

        // 3. LangChain Prompt'u oluştur
        const prompt = `
      Sen Kamera-Panel İmalat Sisteminin 'Modelist ve Bant Şefi' (eski adıyla Tekniker) kod adlı yapay zeka ajanısın.
      Aşağıda geçmişte atölyenin sahip olduğu üretim hafızası (RAG Vektörel Hafıza Verisi) verilmiştir:

      [SİSTEM HAFIZASI ARŞİVİ]
      ${historyContext}
      [ARŞİV SONU]

      Şimdi Atölye Şefi (Engin Bey) senden yeni bir modelin reçetesini (BOM) onaylamanı istiyor:
      - Kumaş Cinsi: ${kumasCinsi}
      - Model Tipi: ${modelTipi}
      - Hedeflenen Kar Oranı: %${hedeflenenFasonKari}

      GÖREV & KURALLAR:
      1. Kumaş cinsine göre sistem hafızasında (yukarıdaki arşivde) uyarı verecek bir fire oranı veya tecrübe varsa, şefe acilen bildir. (Geçmişte bu kumaş bizi zarara uğrattı mı?)
      2. Hedeflenen kâr oranı (%${hedeflenenFasonKari}), geçmişte yaşanan fire potansiyeline göre "kurtarır durumda mı"? Risk varsa fason fiyatında (kârlılıkta) yüzde kaçlık artış yapılmasını önerirsin?
      3. Üretim bandı ustalarına vereceğin mekanik, iplik veya dikim tekniği tavsiyesi var mı?

      Cevabını doğrudan konuya girerek, kısa, net (paragraflar halinde değil 3 maddede) ve operasyonel, zeki bir Mimar/Tekniker gibi ver.
    `;

        // 4. LLM'den yanıt al
        const response = await llm.invoke(prompt);

        return {
            success: true,
            hafiza_kullanildi: historyContext !== "Bu kumaş türünde geçmiş sistem hafızasında üretim veya fire kaydı bulunamadı.",
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("Tekniker Agent Hatası:", err);
        return { success: false, error: err.message };
    }
}
