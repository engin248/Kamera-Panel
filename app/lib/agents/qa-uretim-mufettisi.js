import { generateDepartmentReport } from "./bolum-uretim.js";

// QA Ekibi (3. Kademe): Engin Bey adına kalite/disiplin kontrolü yapan müfettiş.
export async function runQualityAssuranceCheck(uretimVerisi, finansVerisi) {
    try {
        const sirketRaporu = await generateDepartmentReport(uretimVerisi, finansVerisi);

        if (!sirketRaporu.success) {
            return { success: false, status: "DENETİM BAŞARISIZ", mesaj: "Alt birimler rapor veremedi." };
        }

        // Müfettiş, Engin Bey'in emirlerine (örn: "kârlılık %15 altındaysa reddet")
        // göre içeriği analiz eder. Şimdilik sembolik bir QA Pass yapıyor.
        return {
            success: true,
            status: "ENGİN BEY İÇİN ONAYLANDI",
            rapor: sirketRaporu.ajan_cevabi,
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
