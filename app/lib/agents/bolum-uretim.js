import { ChatOpenAI } from "@langchain/openai";
import { analyzeOperationalTempo } from "./kamera.js";
import { analyzeFinancialRisk } from "./muhasip.js";
import { analyzeModelRisk } from "./tekniker.js";

const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.1,
});

/**
 * 2. Kademe: Üretim Bölümü Sorumlusu (Departman Müdürü)
 * Görevi: Sadece kendi altındaki 1. kademe (Pencere) ajanlarından veri toplamak
 * ve bu verileri sentezleyerek üst kurula (Müfettişler ve Baş Asistan'a) 
 * "Üretim Departmanı Durum Raporu" sunmaktır.
 */
export async function generateDepartmentReport(uretimVerisi, finansVerisi) {
    try {
        // 1. Kendi altındaki askerlerden (Birim Ajanlarından) raporları topla
        const bantRaporu = await analyzeOperationalTempo(uretimVerisi);
        const yevmiyeRaporu = await analyzeFinancialRisk(finansVerisi);

        // 2. Kendi Sentezini Yap
        const prompt = `
      Sen Kamera-Panel Sisteminde "Üretim Bölümü Sorumlusu" olan (2. Kademe) Yönetici Ajansın.
      Senin askerlerin olan "Bant Şefi Ajanı" ve "Finans Uzmanı Ajanı" sahadan şu raporları getirdi:

      [BANT ŞEFİNİN RAPORU]
      ${bantRaporu.success ? bantRaporu.ajan_cevabi : "Veri yok."}

      [FİNANS UZMANININ RAPORU]
      ${yevmiyeRaporu.success ? yevmiyeRaporu.ajan_cevabi : "Veri yok."}

      Görev: Bu iki raporu oku ve üst makama (Müfettişlere ve Baş Asistana) sunulmak üzere
      "ÜRETİM DEPARTMANI GÜNLÜK ÖZETİ" hazırla. Rapor kısa, askeri bir dille yazılmalı ve
      atölyedeki kârlılık/hız problemini net bir şekilde teşhis etmelidir.
    `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            ajan_cevabi: response.content
        };
    } catch (err) {
        console.error("Üretim Bölüm Sorumlusu Hatası:", err);
        return { success: false, error: err.message };
    }
}
