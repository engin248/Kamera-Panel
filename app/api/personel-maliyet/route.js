import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const personelId = searchParams.get('personel_id');
        const tarih = searchParams.get('tarih') || new Date().toISOString().split('T')[0];
        const donem = searchParams.get('donem') || 'gunluk'; // gunluk | haftalik | aylik

        const personeller = personelId
            ? db.prepare('SELECT * FROM personnel WHERE id = ? AND deleted_at IS NULL').all(personelId)
            : db.prepare('SELECT * FROM personnel WHERE status = ? AND deleted_at IS NULL ORDER BY name').all('active');

        const sonuc = personeller.map(p => {
            // Maliyet Hesabı
            const brutMaas = p.base_salary || 0;
            const sgk = brutMaas * 0.205; // İşveren SGK payı
            const yol = (p.transport_allowance || 0) * 22; // Günlük × çalışma günü
            const yemek = (p.food_allowance || 0) * 22;
            const tazminat = brutMaas / 12; // Aylık tazminat karşılığı
            const aylikToplamMaliyet = brutMaas + sgk + yol + yemek + tazminat;
            const gunlukMaliyet = aylikToplamMaliyet / 22;
            const saatlikMaliyet = gunlukMaliyet / 9.3; // ~9s 18dk fiili
            const dakikalikMaliyet = saatlikMaliyet / 60;

            // Üretim Verisi
            let uretimSorgu;
            if (donem === 'aylik') {
                const [yil, ay] = tarih.split('-');
                uretimSorgu = db.prepare(`
          SELECT COALESCE(SUM(total_produced),0) as toplam_uretim,
                 COALESCE(SUM(defective_count),0) as toplam_hata,
                 COALESCE(SUM(unit_value),0) as toplam_deger,
                 COALESCE(SUM(net_work_minutes),0) as toplam_sure,
                 COUNT(*) as kayit_sayisi
          FROM production_logs WHERE personnel_id = ? AND deleted_at IS NULL
          AND strftime('%Y-%m', created_at) = ?
        `).get(p.id, `${yil}-${ay.padStart(2, '0')}`);
            } else if (donem === 'haftalik') {
                uretimSorgu = db.prepare(`
          SELECT COALESCE(SUM(total_produced),0) as toplam_uretim,
                 COALESCE(SUM(defective_count),0) as toplam_hata,
                 COALESCE(SUM(unit_value),0) as toplam_deger,
                 COALESCE(SUM(net_work_minutes),0) as toplam_sure,
                 COUNT(*) as kayit_sayisi
          FROM production_logs WHERE personnel_id = ? AND deleted_at IS NULL
          AND DATE(created_at) >= DATE('now','-7 days')
        `).get(p.id);
            } else { // gunluk
                uretimSorgu = db.prepare(`
          SELECT COALESCE(SUM(total_produced),0) as toplam_uretim,
                 COALESCE(SUM(defective_count),0) as toplam_hata,
                 COALESCE(SUM(unit_value),0) as toplam_deger,
                 COALESCE(SUM(net_work_minutes),0) as toplam_sure,
                 COUNT(*) as kayit_sayisi
          FROM production_logs WHERE personnel_id = ? AND deleted_at IS NULL
          AND DATE(created_at) = ?
        `).get(p.id, tarih);
            }

            const urettigi = uretimSorgu?.toplam_deger || 0;
            const donemMaliyet = donem === 'aylik' ? aylikToplamMaliyet : donem === 'haftalik' ? gunlukMaliyet * 5 : gunlukMaliyet;
            const netKatmaDeğer = urettigi - donemMaliyet;
            const primOrani = 0.15; // %15 prim oranı
            const prim = netKatmaDeğer > 0 ? netKatmaDeğer * primOrani : 0;

            return {
                id: p.id, ad: p.name, rol: p.role,
                brutMaas, sgk: Math.round(sgk), yol: Math.round(yol / 22),
                yemek: p.food_allowance || 0, tazminat: Math.round(tazminat),
                aylikToplamMaliyet: Math.round(aylikToplamMaliyet),
                gunlukMaliyet: Math.round(gunlukMaliyet * 100) / 100,
                saatlikMaliyet: Math.round(saatlikMaliyet * 100) / 100,
                dakikalikMaliyet: Math.round(dakikalikMaliyet * 1000) / 1000,
                // Üretim
                toplamUretim: uretimSorgu?.toplam_uretim || 0,
                toplamHata: uretimSorgu?.toplam_hata || 0,
                toplamDeger: Math.round(urettigi * 100) / 100,
                toplamSure: Math.round(uretimSorgu?.toplam_sure || 0),
                // Prim
                donemMaliyet: Math.round(donemMaliyet * 100) / 100,
                netKatmaDeğer: Math.round(netKatmaDeğer * 100) / 100,
                prim: Math.round(prim * 100) / 100,
                fpy: uretimSorgu?.toplam_uretim > 0
                    ? Math.round((1 - (uretimSorgu.toplam_hata / uretimSorgu.toplam_uretim)) * 10000) / 100
                    : 100
            };
        });

        return Response.json(sonuc);
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
