import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    // Muhasip için GPT-4o idealdir çünkü sayısal hesaplamalarda en iyisidir.
    modelName: "gpt-4o",
    temperature: 0.1, // Finansal kararlarda minimum halüsinasyon, maksimum netlik
});

/**
 * Muhasip Ajanı: Fason fiyatı, personel yevmiyesi ve günlük üretimi alıp 
 * finansal riskleri ve günlük operasyonel kâr/zararı hesaplar.
 * @param {object} finansalVeriler - Maliyet hesabı için gereken veriler
 */
export async function analyzeFinancialRisk(finansalVeriler) {
    try {
        const {
            fasonFiyat,
            gunlukUretimAdedi,
            personelToplamMaliyet,
            digerGiderler
        } = finansalVeriler;

        // Gerçekleşen ciro
        const ciro = fasonFiyat * gunlukUretimAdedi;
        const toplamGider = personelToplamMaliyet + (digerGiderler || 0);
        const netKar = ciro - toplamGider;
        const karMarji = ciro > 0 ? (netKar / ciro) * 100 : 0;

        const prompt = `
      Sen Kamera-Panel İmalat Sisteminin 'Finans ve Maliyet Uzmanı' (eski adıyla Muhasip) kod adlı finansal yapay zeka ajanısın.
      Görevin atölyenin maliyet verilerini analiz edip Kurucuya (Engin Bey'e) net, tavizsiz ve acımasız finansal raporlar sunmaktır.

      [GÜNLÜK VERİLER]
      - Birim Fason Fiyatı: ${fasonFiyat} TL
      - Günlük Üretilen Miktar: ${gunlukUretimAdedi} Adet
      - Üretimden Doğan Ciro: ${ciro} TL
      - Günlük Personel Maliyeti: ${personelToplamMaliyet} TL
      - Diğer (Elektrik/Yemek) Ek Maliyetler: ${digerGiderler || 0} TL

      [OTOMATİK HESAPLANAN]
      - Net Kâr/Zarar: ${netKar} TL
      - Kâr Marjı: %${karMarji.toFixed(2)}

      GÖREV & KURALLAR:
      1. Bu rakamlara bakarak bugünkü operasyonun zararlı mı yoksa kârlı mı olduğunu "Evet/Hayır" netliğiyle özetle.
      2. Eğer kâr marjı %15'in altındaysa kırmızı alarm ver ve "Birim fason fiyatı düşük" VEYA "Personel üretimi (hızı) düşük, zarar yazıyor" teşhisi koy.
      3. Atölyenin finansını düzeltmek için Muhasip gözüyle Engin Bey'e operasyonel (satır başları halinde 2 kısa madde) tavsiye ver.

      Cevabını gereksiz laf kalabalığı yapmadan, doğrudan finans dilinde ve net ver.
    `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            ciro,
            netKar,
            karMarji,
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("Muhasip Agent Hatası:", err);
        return { success: false, error: err.message };
    }
}
