import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o", // Otonom raporlama ve geniş analiz için
    temperature: 0.1, // Saha gerçekleri için düşük halüsinasyon
});

/**
 * Kamera Ajanı (Operasyon Şefi): 
 * Günlük atölye üretim temposunu analiz eder. "Kim, nerede, ne hızda çalışıyor" 
 * sorularını yanıtlar ve darboğaz (bottleneck) tespiti yapar.
 * @param {object} operasyonVerisi - Günlük çalışan sayısı, üretim hedefleri vs.
 */
export async function analyzeOperationalTempo(operasyonVerisi) {
    try {
        const {
            gunlukUretimHedefi,
            gecerliUretimAdedi,
            calisanPersonelSayisi,
            calisilanSaat,
            aktifModel
        } = operasyonVerisi;

        const uretimHizi = (gecerliUretimAdedi / calisilanSaat).toFixed(2); // Saatlik üretim hızı (parça/saat)

        // Yetersiz personel/hedef sapması hesaplanması
        const saatlikHedef = gunlukUretimHedefi / 9; // Standart 9 saat mesai
        const tempoAcigi = gecerliUretimAdedi < (saatlikHedef * calisilanSaat);

        const prompt = `
      Sen Kamera-Panel İmalat Sisteminin 'Üretim Sorumlusu Asistanı Agent' (eski adıyla Kamera) kod adlı atölye operasyon koordinatörüsün (yapay zeka).
      Sahadaki anlık üretim hızını, personel eksiğini ve gün sonu üretim hedefinin tutup tutmayacağını analiz etmelisin.

      [SAHA VERİLERİ]
      - Üretilen Model: ${aktifModel}
      - Hedeflenen Günlük Sayı: ${gunlukUretimHedefi} Adet
      - Şu Ana Kadar Çıkan Ürün: ${gecerliUretimAdedi} Adet
      - Sahadaki Aktif Çalışan: ${calisanPersonelSayisi} Kişi
      - Geçen Mesai Süresi: ${calisilanSaat} Saat

      [SİSTEM HESAPLAMALARI]
      - Şu anki Hızınız: Saatte ${uretimHizi} ürün çıkıyor.
      - Mesai sonuna kadar hedefin tutma ihtimali: ${tempoAcigi ? "Çok Düşük (Kapasite Yetersiz)" : "Normal / Hedef İçinde"}

      GÖREV & KURALLAR:
      1. Senden atölye patronuna (Engin Bey'e) kısa, askeri bir operasyon raporu vermeni istiyorum.
      2. Mevcut hıza (${uretimHizi}/saat) ve çalışan işçi sayısına bakarak "Ustalar yavaş çalışıyor", "Saha mükemmel işliyor" veya "Darboğaz var" tespiti yap.
      3. Hedefin tutması için ${tempoAcigi ? 'saatte X ürün daha çıkarmalısınız veya mesaiye kalınmalı' : 'böyle devam edilebilir'} şeklinde net, 2 maddelik bir saha emri/tavsiyesi ver.

      Lafı dolandırmadan doğrudan, kendinden emin bir Şef gibi konuş.
    `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            uretimHizi,
            tempoAcigi,
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("Kamera Agent Hatası:", err);
        return { success: false, error: err.message };
    }
}
