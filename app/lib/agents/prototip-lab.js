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

// Prototip Lab LLM (GPT-4o)
const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.2, // Analitik ve deneysel veriler için düşük sıcaklık
});

/**
 * Prototip Laboratuvarı Ajanı:
 * Yeni bir modelin/kumaşın çekme, dönme, renk verme oranlarını geçmiş vektörel hafızadan çeker.
 * Kesimhane için kalıp payı (tolerans) önerir, Yıkama için talimat belirler.
 * 
 * @param {string} kumasCinsi 
 * @param {string} yikamaTipi (ör: 'Ağır enzim', 'Silikon', 'Normal yıkama')
 * @param {string} modelTipi 
 */
export async function analyzePrototypeRisks(kumasCinsi, yikamaTipi, modelTipi) {
    try {
        // 1. Sorguyu vektöre çevir
        const query = `${kumasCinsi} kumaşı ${yikamaTipi} ile yıkandığında çekme, dönme, renk atma oranları nasıldır? kalıp payı ne olmalı?`;
        const queryEmbedding = await embeddings.embedQuery(query);

        // 2. Supabase pgVector Similarity Search (model_memory_embeddings tablosunda)
        let historyContext = "";
        const { data: similarRecords, error } = await supabase.rpc("match_model_memory", {
            query_embedding: queryEmbedding,
            match_threshold: 0.72,
            match_count: 4,
        });

        if (error) {
            console.warn("pgVector RPC missing, using fallback string match", error);
            const { data: regularRecords } = await supabase
                .from("model_memory_embeddings")
                .select("baglam_metni")
                .ilike("kumas_cinsi", `%${kumasCinsi}%`)
                .limit(4);

            if (regularRecords && regularRecords.length > 0) {
                historyContext = regularRecords.map(r => r.baglam_metni).join("\n");
            } else {
                historyContext = "Bu kumaş ve yıkama kombinasyonu için geçmiş AR-GE veya üretim kaydı bulunamadı.";
            }
        } else if (similarRecords && similarRecords.length > 0) {
            historyContext = similarRecords.map(r => r.baglam_metni).join("\n");
        } else {
            historyContext = "Bu kumaş ve yıkama kombinasyonu için geçmiş AR-GE veya üretim kaydı bulunamadı.";
        }

        // 3. Prompt oluştur
        const prompt = `
      Sen Kamera-Panel İmalat Sisteminin 'Prototip Laboratuvarı' kod adlı otonom ajanısın. Görevin kesimhane ve yıkamayı felaketlerden korumak.
      Aşağıda geçmişte yapılmış benzer üretimlerin hafızası (RAG Vektörel Hafıza) verilmiştir:

      [SİSTEM HAFIZASI ARŞİVİ]
      ${historyContext}
      [ARŞİV SONU]

      Kesimhaneye gönderilecek yeni işin detayları:
      - Kumaş Cinsi: ${kumasCinsi}
      - Planlanan Yıkama: ${yikamaTipi}
      - Model Tipi: ${modelTipi}

      GÖREVLER:
      1. Kumaşın bu yıkamada beklenen çekme (en/boy) ve dönme oranını arşivden analiz et. (Eğer arşivde yoksa tekstil mühendisliği genel limitlerine göre tahmin yürüt ama bunun bir "Tahmin" olduğunu belirt).
      2. Modeliste: Kesim kalıplarına yüzde kaç oranında çekme/büyütme payı verilmesi gerektiğini kesin olarak söyle.
      3. Yıkamaya: Renk kanaması veya yırtılma riski var mı? Yıkama talimatında dikkat edilmesi gereken kritik bir uyarı yap.
      
      Yanıtın tamamen teknik, madde madde ve kısa olsun. Paragraflara boğma. Hedef kitle Modelist ve Kesim Şefi.
    `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            hafiza_kullanildi: !historyContext.includes("kaydı bulunamadı"),
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("Prototip Lab Ajanı Hatası:", err);
        return { success: false, error: err.message };
    }
}
