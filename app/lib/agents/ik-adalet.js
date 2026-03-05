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

// İK (Adalet Terazisi) Ajanı (GPT-4o)
const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.1, // Adalet terazisi şaşmasın diye düşük halüsinasyon, net matematik
});

/**
 * İK / Personel Ajanı (Adalet Terazisi):
 * Bir model üretilirken bantta çalışan operatörün hedefini, gerçekleşen sayısını ve hatasını alır.
 * Eski "benzer zorluktaki" modellerin üretim ortalamasını vektörel hafızadan bularak adil bir prim önerir.
 * 
 * @param {string} personelAdi 
 * @param {string} operasyonAdi (Ör: Etek Reçme, Yaka Takma)
 * @param {number} hedeflenenAdet 
 * @param {number} uretilenAdet 
 * @param {number} hataliAdet 
 * @param {boolean} isMonthlyCheckpoint (Varsayılan false) Ajanın sadece ay sonu uyanmasını tetikler
 */
export async function evaluatePersonnelPerformance(personelAdi, operasyonAdi, hedeflenenAdet, uretilenAdet, hataliAdet, kumasCinsi, isMonthlyCheckpoint = false) {
    try {
        // [API MALİYET KALKANI]: Başarı Hesaplama Altyapısı (Standart Matematik, LLM Yok)
        const basariOrani = hedeflenenAdet > 0 ? (uretilenAdet / hedeflenenAdet) * 100 : 0;
        const hataOrani = uretilenAdet > 0 ? (hataliAdet / uretilenAdet) * 100 : 0;

        // EĞER AY SONU (CHECKPOINT) DEĞİLSE, API'YE GİTME (SIFIR MALİYET)
        if (!isMonthlyCheckpoint) {
            return {
                success: true,
                hafiza_kullanildi: false,
                performans_metrikleri: { basariOrani: basariOrani.toFixed(1), hataOrani: hataOrani.toFixed(1) },
                ajan_cevabi: `[GÜNLÜK SQL KAYDI]: ${personelAdi} personeli başarısı: %${basariOrani.toFixed(1)}, Fire Oranı: %${hataOrani.toFixed(1)}. (Matematiksel log alındı. LLM API çağrılmadı, maliyet $0).`
            };
        }

        // SADECE "AYLIK PRİM ÇIKARILACAĞI ZAMAN" AJAN UYANIR VE GEÇMİŞ HAFIZAYA (RAG) BAKAR
        // 1. Sorguyu vektöre çevir - Daha önce aynı kumaşta benzer operasyonu kaç kişi kaç adet yapmış?
        const query = `${kumasCinsi} kumaşında ${operasyonAdi} operasyonunda günlük ortalama ne kadar çıkıyordu, fire oranı neydi?`;
        const queryEmbedding = await embeddings.embedQuery(query);

        // 2. Supabase pgVector Search
        let historyContext = "";
        const { data: similarRecords, error } = await supabase.rpc("match_model_memory", {
            query_embedding: queryEmbedding,
            match_threshold: 0.65, // Benzerlik biraz düşük olabilir çünkü "Etek Reçme" yerine "Reçme" geçmiş olabilir.
            match_count: 5,
        });

        if (error) {
            console.warn("pgVector RPC missing, using fallback string match", error);
            const { data: regularRecords } = await supabase
                .from("model_memory_embeddings")
                .select("baglam_metni")
                .ilike("baglam_metni", `%${operasyonAdi}%`)
                .limit(5);

            if (regularRecords && regularRecords.length > 0) {
                historyContext = regularRecords.map(r => r.baglam_metni).join("\n");
            } else {
                historyContext = "Bu operasyon türü veya kumaş için hafızada net bir geçmiş performans verisi yok.";
            }
        } else if (similarRecords && similarRecords.length > 0) {
            historyContext = similarRecords.map(r => r.baglam_metni).join("\n");
        } else {
            historyContext = "Bu operasyon türü veya kumaş için hafızada net bir geçmiş performans verisi yok.";
        }

        // 3. Prompt oluştur
        const prompt = `
      Sen Kamera-Panel İmalat Sisteminin 'Personel, Puantaj ve Prim - Adalet Terazisi' kod adlı otonom ajanısın. 
      Görevin Atölye Şefi Engin Bey'e adam kayırmacılık olmadan sistemin verilerine dayanarak adaleti sağlaması için objektif rapor sunmak.
      
      Aşağıda bu operasyonla ilgili Atölyenin geçmiş üretim hafızası (RAG Vektörel Hafıza) verilmiştir (Kumaş zorluğu, aynı işlem vs):
      [SİSTEM HAFIZASI ARŞİVİ]
      ${historyContext}
      [ARŞİV SONU]

      Bugün değerlendirilecek olan personelin verileri:
      - Personel: ${personelAdi}
      - Yaptığı İş: ${operasyonAdi} (${kumasCinsi} kumaşında)
      - Hedeflenen / Bant İhtiyacı: ${hedeflenenAdet} adet
      - Gerçekte Diktiği/Ürettiği: ${uretilenAdet} adet (Başarı Oranı: %${basariOrani.toFixed(1)})
      - Hatalı/Defolu Çıkan: ${hataliAdet} adet (Fire Oranı: %${hataOrani.toFixed(1)})

      GÖREVLER (Müfettiş Tonuyla, kısa ve madde madde):
      1. Arşive bak: Bu kumaş cinsinde bu tarz bir operasyon genel olarak zor mudur? Kolay mıdır? Personele verilen hedef adil miydi?
      2. Matematiksel olarak personelin performansını değerlendir: Hedefi aşmış mı? Hatalı mal çıkarma (Fire) oranı kabul edilebilir sınırlar (Genelde maks %2) içinde mi?
      3. Prim Kararı: Personelin bugünkü performansına göre maaşına prim (bonus) yansıtılmalı mı, yoksa yevmiyesinden kesinti mi yapılmalı veya uyarılmalı mı? (Net ve tek cümlelik yargı kararı ver, "Engin Bey'in takdiri" deme).
      4. Personelin günlüğüne yazılması gereken motivasyon veya ihtar notunu iliştir.
    `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            hafiza_kullanildi: !historyContext.includes("geçmiş performans verisi yok"),
            performans_metrikleri: { basariOrani: basariOrani.toFixed(1), hataOrani: hataOrani.toFixed(1) },
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("İK (Adalet) Ajanı Hatası:", err);
        return { success: false, error: err.message };
    }
}
