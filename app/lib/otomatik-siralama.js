/**
 * lib/otomatik-siralama.js
 *
 * OTOMATIK AYLIK SIRALAMA SISTEMI — Supabase versiyonu
 * =====================================================
 * SQLite getDb() → supabaseAdmin migrate edildi.
 */

import { supabaseAdmin } from './supabase.js';

export async function aylikSiralamayiKaydet(ay, yil) {
    const log = (msg) => console.log(`[OtomatikSiralama] ${new Date().toISOString()} — ${msg}`);
    log(`${ay}/${yil} sıralaması kaydediliyor...`);

    try {
        const ayStr = String(ay).padStart(2, '0');
        const baslangic = `${yil}-${ayStr}-01T00:00:00`;
        const sonrakiAy = ay === 12 ? 1 : ay + 1;
        const sonrakiYil = ay === 12 ? yil + 1 : yil;
        const bitis = `${sonrakiYil}-${String(sonrakiAy).padStart(2, '0')}-01T00:00:00`;

        // Aktif personel
        const { data: personeller } = await supabaseAdmin
            .from('personnel')
            .select('id, name, base_salary, transport_allowance, food_allowance')
            .eq('status', 'active')
            .is('deleted_at', null);

        if (!personeller?.length) {
            log('Aktif personel bulunamadı.');
            return { basari: false, neden: 'aktif_personel_yok' };
        }

        // Bu aya ait üretim logları
        const { data: uretimLogs } = await supabaseAdmin
            .from('production_logs')
            .select('personnel_id, total_produced, defective_count, unit_value')
            .is('deleted_at', null)
            .gte('start_time', baslangic)
            .lt('start_time', bitis);

        // personnel_id bazında grupla
        const uretimMap = {};
        for (const log of (uretimLogs || [])) {
            const pid = log.personnel_id;
            if (!pid) continue;
            if (!uretimMap[pid]) uretimMap[pid] = { toplam_ciro: 0, toplam_hatali: 0, toplam_uretilen: 0 };
            uretimMap[pid].toplam_uretilen += log.total_produced || 0;
            uretimMap[pid].toplam_hatali += log.defective_count || 0;
            uretimMap[pid].toplam_ciro += (log.unit_value || 0);
        }

        // Sıralama hesapla
        const upsertList = personeller.map(p => {
            const u = uretimMap[p.id] || {};
            const toplam_uretilen = u.toplam_uretilen || 0;
            const toplam_hatali = u.toplam_hatali || 0;
            const hata_orani = toplam_uretilen > 0 ? toplam_hatali / toplam_uretilen : 0;
            const katki_degeri = (u.toplam_ciro || 0) * (1 - hata_orani);
            const brut = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0);
            const maas_maliyeti = brut * 1.225;
            const katki_maas_farki = katki_degeri - maas_maliyeti;
            const prim_tutari = katki_maas_farki > 0 ? parseFloat((katki_maas_farki * 0.15).toFixed(2)) : 0;

            return {
                personel_id: p.id,
                ay: parseInt(ay),
                yil: parseInt(yil),
                toplam_uretilen,
                toplam_hatali,
                fpy_yuzde: toplam_uretilen > 0 ? parseFloat(((toplam_uretilen - toplam_hatali) / toplam_uretilen * 100).toFixed(1)) : 100,
                katki_degeri: parseFloat(katki_degeri.toFixed(2)),
                maas_maliyeti: parseFloat(maas_maliyeti.toFixed(2)),
                katki_maas_farki: parseFloat(katki_maas_farki.toFixed(2)),
                prim_orani: 15,
                prim_tutari,
                onay_durumu: 'hesaplandi',
            };
        });

        // Supabase upsert
        const { error } = await supabaseAdmin
            .from('prim_kayitlari')
            .upsert(upsertList, { onConflict: 'personel_id,ay,yil' });

        if (error) throw error;

        // Karar arşivine log
        try {
            const sirali = [...upsertList].sort((a, b) => b.katki_degeri - a.katki_degeri);
            const ilk3 = sirali.slice(0, 3).map((s, i) => `${i + 1}. Personel #${s.personel_id}: ${Math.round(s.katki_degeri)} ₺`).join(', ');
            await supabaseAdmin.from('karar_arsivi').insert({
                konu: `[OTOMATİK] ${ay}/${yil} Aylık Sıralama Kaydedildi (${upsertList.length} personel)`,
                bolum: 'personel',
                sistem_onerisi: `İlk 3: ${ilk3}`,
            });
        } catch (_) { /* karar_arsivi yoksa devam */ }

        log(`${upsertList.length} personel başarıyla kaydedildi.`);
        return { basari: true, kaydedilen: upsertList.length };

    } catch (err) {
        console.error('[OtomatikSiralama] HATA:', err.message);
        return { basari: false, neden: err.message };
    }
}

export async function eksikAyiTamamla() {
    const bugun = new Date();
    const oncekiAy = bugun.getMonth() === 0 ? 12 : bugun.getMonth();
    const oncekiYil = bugun.getMonth() === 0 ? bugun.getFullYear() - 1 : bugun.getFullYear();

    const { data } = await supabaseAdmin
        .from('prim_kayitlari')
        .select('id', { count: 'exact', head: true })
        .eq('ay', oncekiAy)
        .eq('yil', oncekiYil);

    if (!data || data.length === 0) {
        console.log(`[OtomatikSiralama] ${oncekiAy}/${oncekiYil} kaydı eksik — tamamlanıyor...`);
        await aylikSiralamayiKaydet(oncekiAy, oncekiYil);
    } else {
        console.log(`[OtomatikSiralama] ${oncekiAy}/${oncekiYil} zaten kayıtlı.`);
    }
}

export async function buAyiGuncelle() {
    const bugun = new Date();
    await aylikSiralamayiKaydet(bugun.getMonth() + 1, bugun.getFullYear());
}
