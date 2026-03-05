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

// Fason Ajanı (GPT-4o)
const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.1, // Net ve katı bir denetmen mantığı
});

/**
 * Fason (Yan Sanayi) Ajanı:
 * Dışarıya gönderilen işlerin (Paskara, Baskı, Nakış vb.) risk analizini yapar.
 * Hangi fasoncunun daha az sorun çıkardığını hafızadan bularak iş dağıtımında karar desteği sunar.
 * 
 * @param {string} islemTipi (Baskı, Nakış, Paskara vb.)
 * @param {string} kumasCinsi 
 * @param {string} secilenFasoncu Fasoncunun adı (Eğer boş bırakılırsa ajandan "Kim daha iyi?" önerisi istenir)
 */
export async function evaluateSubcontractor(islemTipi, kumasCinsi, secilenFasoncu = "") {
    try {
        // 1. Sorguyu vektöre çevir
        const query = secilenFasoncu
            ? `${secilenFasoncu} adlı fasoncunun ${kumasCinsi} kumaşında yaptığı ${islemTipi} işleminde geçmişteki fireleri, gecikmeleri veya kalite sorunları nelerdir?`
            : `${kumasCinsi} kumaşı için ${islemTipi} işlemi yaptıracağız, geçmişte hangi fasoncularda ne gibi kalite sorunları, fireler yaşandı? Kim daha güvenilir?`;

        const queryEmbedding = await embeddings.embedQuery(query);

        // 2. Supabase pgVector Similarity Search
        let historyContext = "";
        const { data: similarRecords, error } = await supabase.rpc("match_model_memory", {
            query_embedding: queryEmbedding,
            match_threshold: 0.70,
            match_count: 5,
        });

        if (error) {
            console.warn("pgVector RPC missing, using fallback string match", error);
            const { data: regularRecords } = await supabase
                .from("model_memory_embeddings")
                .select("baglam_metni")
                .ilike("baglam_metni", `%${islemTipi}%`)
                .limit(5);

            if (regularRecords && regularRecords.length > 0) {
                historyContext = regularRecords.map(r => r.baglam_metni).join("\n");
            } else {
                historyContext = "Bu işlem, kumaş cinsi veya fasoncu için geçmiş hafızada bir vukuat veya performans kaydı bulunamadı.";
            }
        } else if (similarRecords && similarRecords.length > 0) {
            historyContext = similarRecords.map(r => r.baglam_metni).join("\n");
        } else {
            historyContext = "Bu işlem, kumaş cinsi veya fasoncu için geçmiş hafızada bir vukuat veya performans kaydı bulunamadı.";
        }

        // 3. Prompt oluştur
        const prompt = `
      Sen Kamera-Panel İmalat Sisteminin 'Fason ve Yan Sanayi Denetmeni' kod adlı otonom ajanısın. Görevin kaliteyi korumak ve dışarı gönderilen işlerde atölyenin zarar etmesini engellemek.
      Aşağıda fason işlemlerle ilgili sistemin hafızası (RAG Vektörel Hafıza) verilmiştir:

      [SİSTEM HAFIZASI ARŞİVİ]
      ${historyContext}
      [ARŞİV SONU]

      Kesimhaneden çıkan işlerin kalite kontrolü için değerlendirdiğin operasyon:
      - Yapılacak İşlem: ${islemTipi}
      - Kumaş Cinsi: ${kumasCinsi}
      - Planlanan Fasoncu (Varsa): ${secilenFasoncu || "Belirtilmedi, senin birini tavsiye etmen veya genel riskleri söylemen bekleniyor."}

      GÖREVLER:
      1. Eğer bir Fasoncu belirtilmişse (${secilenFasoncu}), hafızadaki kayıtları tarayıp bu firmanın bu tip kumaş veya işlemlerindeki vukuat/gecikme sicilini doğrudan Atölye Şefi'nin (Engin Bey'in) yüzüne söyle. Riskli mi, güvenilir mi?
      2. Eğer fasoncu belirtilmemişse, hafızadaki (bu kumaştaki ${islemTipi}) kayıtlara dayanarak en az riskli/firesiz atlatılan işlemi kimin yaptığını öner.
      3. ${kumasCinsi} kumaşına ${islemTipi} yapılırken dikkat edilmesi gereken en kritik teknik detayı (erime, büzülme, iplik atması vb.) tek cümleyle yapıştır.
      
      Yanıtın tamamen müfettiş diliyle, kısa, vurucu ve acımasız olsun. "Karar Engin Bey'e aittir" deme, bir denetmen gibi onay/red tonunda bilgi ver.
    `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            hafiza_kullanildi: !historyContext.includes("kaydı bulunamadı"),
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("Fason Ajanı Hatası:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Fason (Yan Sanayi) Ajanı - Teslim Süreci Bildirimi
 * Gelen mallardaki fire/kalite sorunlarını kalıcı vektörel hafızaya kazır.
 * Böylece bir sonraki "evaluateSubcontractor" çağrısında bu kayıt hatırlanır.
 */
export async function reportSubcontractorLoss(fasoncuAd, modelAd, gidenAdet, gelenAdet, fireAdet, kumasCinsi, kaliteNotu) {
    try {
        const fireOran = (fireAdet / gidenAdet) * 100;

        let degerlendirme = "Başarılı";
        if (fireOran > 5) degerlendirme = "Kritik Fire";
        else if (fireOran > 2) degerlendirme = "Kabul edilebilir ancak riskli";

        const memoryText = `Fason Performans Raporu: ${fasoncuAd}. ${modelAd} modeli (${kumasCinsi} kumaş) için ${gidenAdet} adet iş gönderildi. ${gelenAdet} adet teslim alındı. Toplam ${fireAdet} adet fire/defolu ürün çıktı. (Fire Oranı: %${fireOran.toFixed(1)}). Değerlendirme: ${degerlendirme}. Ek Not: ${kaliteNotu || "Yok"}`;

        const embedding = await embeddings.embedQuery(memoryText);

        const { error } = await supabase.from('model_memory_embeddings').insert({
            model_id: "00000000-0000-0000-0000-000000000000",
            baglam_metni: memoryText,
            vektor_verisi: embedding,
            ekleyen_ajan: "Fason Ajanı",
            cozum_var_mi: fireOran <= 2
        });

        if (error) throw error;

        // LLM'den bu rapora kısaca sert bir Fason Denetmen yorumu alalım
        const prompt = `
        Sen Fason Yan Sanayi Denetmeni yapay zeka ajanısın.
        Aşağıdaki fason teslimat raporunu sistem hafızasına kaydettim:
        "${memoryText}"
        Bu teslime dair İmalat Müdürüne (Engin Bey'e) 2 cümlelik, net, acımasız ve tavsiye niteliğinde bir yorum ver.
        `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("Fason Raporlama Hatası:", err);
        return { success: false, error: err.message };
    }
}
