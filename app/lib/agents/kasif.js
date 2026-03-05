import { ChatOpenAI } from "@langchain/openai";

// Kaşif ajanı vizyoner olduğu için 'gpt-4o' (veya ilerde Perplexity API) kullanması daha sağlıklıdır.
// Temperature'ı biraz daha yüksek (0.4) tutarak trend araştırmasında (Ar-Ge) hafif yaratıcılık/analiz bırakıyoruz.
const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.4,
});

/**
 * Kaşif Ajanı (Ar-Ge & Vizyon & Pazar Analizi): 
 * Dış piyasayı, sektör trendlerini ve global piyasayı analiz eder. "Bu tarz bir üretim mantıklı mı?" 
 * sorusuna cevap vererek sermayeyi korur.
 * (Not: İleriki aşamalarda doğrudan web araması (Perplexity/SerpAPI) ile birleştirilecektir).
 * @param {object} argeVerisi - Kullanıcının analiz etmek istediği ürün/Pazar fikri
 */
export async function analyzeMarketTrend(argeVerisi) {
    try {
        const {
            urunTipi,
            kumasCinsi,
            hedefKitle,
            sezon
        } = argeVerisi;

        const prompt = `
      Sen Kamera-Panel Sisteminin 'Ar-Ge ve Trend Uzmanı' (eski adıyla Kâşif) kod adlı pazar araştırma zekasısın (Agent).
      Patronun (Engin Bey) yeni bir koleksiyon veya fason üretim fikrini yatırım öncesi sana danışıyor.
      Amacın: Atölyenin parasını sokağa atmaması için riskleri açıkça belirtmek veya trendlere göre onaylamak.

      [DÜŞÜNÜLEN YATIRIM/ÜRETİM PLANI]
      - Ürün Cinsiyeti/Tipi: ${urunTipi}
      - Kullanılacak Kategori/Kumaş: ${kumasCinsi}
      - Hedef Müşteri Kitlesi: ${hedefKitle}
      - Pazara Giriş Sezonu: ${sezon}

      GÖREV & KURALLAR:
      1. Bu kumaş ve ürün tipinin global piyasalarda (özellikle Avrupa ve e-ticaret sitelerinde) mevcut trendi nedir? "Düşüşte mi", "Altın çağını mı yaşıyor"?
      2. Bu ürünü dikerken atölyenin karşılaşabileceği fason maliyet zorlukları veya kumaş defo riskleri var mı? (Bilgi birikimine dayanarak).
      3. Atölye'ye bu kıyafeti / trendi daha inovatif ve katma değerli satması için (Örn: "Düğmelerini şundan yapın" gibi) 1 adet "Tasarım/Ar-Ge Zekası Önerisi" sun.

      Cevabını resmi, akademik fakat aynı zamanda tekstil patronunun dilinden anlayacak netlikte, 3 kısa paragraf halinde sun.
    `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("Kaşif Agent Hatası:", err);
        return { success: false, error: err.message };
    }
}
