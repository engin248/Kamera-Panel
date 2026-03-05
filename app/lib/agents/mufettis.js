import { ChatOpenAI } from "@langchain/openai";
import { supabaseAdmin } from '@/lib/supabase';

// Müfettiş Ajan, daha mantıksal sorgular yaptığı için gpt-4o kullanması idealdir, 
// ancak token tasarrufu için o1-mini veya gpt-4o-mini de tercih edilebilir.
const auditorLLM = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o-mini", // Token optimizasyonu için mini model
    temperature: 0.1, // Kesin ve net denetim, sıfır halüsinasyon
});

/**
 * MÜFETTİŞ AJAN (FETİH)
 * Sistemde son yapılan log işlemlerini topluca alır ve 5'li süzgeçten geçirir.
 */
export async function auditRecentTransactions(transactionLogs) {
    if (!transactionLogs || transactionLogs.length === 0) {
        return { success: true, evaluations: [] };
    }

    try {
        const prompt = `
      Sen "47 Sil Baştan 01" Fason Tekstil Fabrikasının baş denetçisi "FETİH" kod adlı Müfettiş Ajansın.
      Aşağıda sistemdeki bölüm şefleri (veya insanlar) tarafından veritabanında yapılmış son işlemlerin (logların) bir listesi var.

      GÖREV: Her bir işlemi aşağıdaki 5 süzgeçten (kriterden) geçir ve analiz et:
      1. DOĞRU MU?: İşlemin kendisinde mantıksal bir doğruluk var mı?
      2. YANLIŞ MI?: Sisteme zarar verebilecek, bariz hatalı bir hamle mi?
      3. EKSİK Mİ / FAZLA MI?: Atlanmış bir parametre, bilgi veya gereksiz bir ekleme var mı?
      4. İSTENİLEN GİBİ Mİ?: İşletme kurallarına uygun mu?
      5. OPTİMİZASYON (Nasıl daha iyi olurdu?): Bu işlem işletmeyi ileri taşımak için nasıl daha akıllıca yapılabilirdi?

      SON İŞLEMLER (JSON):
      ${JSON.stringify(transactionLogs, null, 2)}

      KURAL: 
      - Kısa ve öz konuş.
      - Sadece problemli, hatalı veya geliştirilebilecek işlemlere "Alarm" (Sarı Kart) ver.
      - Her işleme sırayla dön. 
      - Yanıt formatın net olsun (İşlem ID, Durum: Başarılı/Uyarı/Hata, Nedeni, Optimizasyon Önerisi).
    `;

        const response = await auditorLLM.invoke(prompt);

        return {
            success: true,
            raw_audit_report: response.content,
            audited_count: transactionLogs.length
        };

    } catch (err) {
        console.error("Müfettiş (Auditor) Agent Hatası:", err);
        return { success: false, error: err.message };
    }
}
