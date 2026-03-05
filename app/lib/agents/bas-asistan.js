import { runQualityAssuranceCheck } from "./qa-uretim-mufettisi.js";

/**
 * 4. Kademe: BAŞ ASİSTAN AJANI (Engin Bey'in Sağ Kolu)
 * Engin Bey'in emri -> Asistan -> Müfettişler (QA) -> Bölüm Sorumluları -> Birim Uzmanları (Ajanlar).
 * Daha sonra cevap aynı zincirle yukarı taşınır.
 */
export async function basAsistanEmriYurut(emirTipi, veriler) {
    try {
        let sonRapor = "";

        if (emirTipi === "ÜRETİM_DURUM_RAPORU_İSTE") {
            // Asistan, Üretim departmanı müfettişine ("Emri yerine getirin") der.
            const qaSonucu = await runQualityAssuranceCheck(veriler.uretim, veriler.finans);

            if (qaSonucu.success) {
                sonRapor = qaSonucu.rapor;
            } else {
                sonRapor = "Engin Bey, müfettişler alt birimlerde sorun tespit etti. Emir tamamlanamadı.";
            }
        }

        return {
            success: true,
            asistanCevabi: `Engin Bey; Baş Asistanınız olarak emrinizi Müfettişlere ilettim. İş denetlendi ve onaylandı. \n\n[MÜFETTİŞ RAPORU]:\n${sonRapor}`
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
