import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/rapor/fire-maliyet?ay=3&yil=2026
 * ✅ GÖREV 9: Fire Maliyet Raporu
 * Üretimde defective_count > 0 olan kayıtları fire maliyeti bazında raporlar
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ay = parseInt(searchParams.get('ay') || new Date().getMonth() + 1);
        const yil = parseInt(searchParams.get('yil') || new Date().getFullYear());

        const ayStr = String(ay).padStart(2, '0');
        const baslangic = `${yil}-${ayStr}-01`;
        const sonrakiAy = ay === 12 ? 1 : ay + 1;
        const sonrakiYil = ay === 12 ? yil + 1 : yil;
        const bitis = `${sonrakiYil}-${String(sonrakiAy).padStart(2, '0')}-01`;

        // Hatalı üretim kayıtlarını çek
        const { data: logs, error } = await supabaseAdmin
            .from('production_logs')
            .select(`
                id, model_id, personnel_id, total_produced, defective_count,
                unit_value, defect_reason, defect_classification, start_time,
                models(name, code),
                personnel(name, role)
            `)
            .is('deleted_at', null)
            .gt('defective_count', 0)
            .gte('start_time', `${baslangic}T00:00:00Z`)
            .lt('start_time', `${bitis}T00:00:00Z`)
            .order('start_time', { ascending: false });

        if (error) throw error;

        // Fire tutarı hesapla: hatalı adet × (unit_value / toplam üretim)
        const satirlar = (logs || []).map(r => {
            const birimDeger = r.total_produced > 0
                ? (r.unit_value || 0) / r.total_produced
                : 0;
            const fire_tutar = r.defective_count * birimDeger;
            const fire_yuzde = r.total_produced > 0
                ? Math.round((r.defective_count / r.total_produced) * 1000) / 10
                : 0;

            return {
                kayit_id: r.id,
                tarih: r.start_time?.split('T')[0],
                model_id: r.model_id,
                model: r.models?.name,
                model_kodu: r.models?.code,
                personel_id: r.personnel_id,
                personel: r.personnel?.name,
                personel_rol: r.personnel?.role,
                toplam_uretim: r.total_produced,
                fire_adet: r.defective_count,
                fire_yuzde,
                fire_tutar: Math.round(fire_tutar * 100) / 100,
                neden: r.defect_reason || '',
                siniflandirma: r.defect_classification || '',
            };
        });

        // Model bazında grupla
        const modelBazinda = {};
        const personelBazinda = {};

        for (const r of satirlar) {
            // Model grubu
            if (!modelBazinda[r.model_id]) {
                modelBazinda[r.model_id] = {
                    model_id: r.model_id,
                    model: r.model,
                    toplam_fire_adet: 0,
                    toplam_fire_tutar: 0,
                    kayit_sayisi: 0,
                };
            }
            modelBazinda[r.model_id].toplam_fire_adet += r.fire_adet;
            modelBazinda[r.model_id].toplam_fire_tutar += r.fire_tutar;
            modelBazinda[r.model_id].kayit_sayisi++;

            // Personel grubu
            if (r.personel_id && !personelBazinda[r.personel_id]) {
                personelBazinda[r.personel_id] = {
                    personel_id: r.personel_id,
                    personel: r.personel,
                    rol: r.personel_rol,
                    toplam_fire_adet: 0,
                    toplam_fire_tutar: 0,
                };
            }
            if (r.personel_id) {
                personelBazinda[r.personel_id].toplam_fire_adet += r.fire_adet;
                personelBazinda[r.personel_id].toplam_fire_tutar += r.fire_tutar;
            }
        }

        const toplamFireAdet = satirlar.reduce((t, r) => t + r.fire_adet, 0);
        const toplamFireTutar = satirlar.reduce((t, r) => t + r.fire_tutar, 0);

        return NextResponse.json({
            ay, yil,
            ozet: {
                toplam_kayit: satirlar.length,
                toplam_fire_adet: toplamFireAdet,
                toplam_fire_tutar: Math.round(toplamFireTutar * 100) / 100,
                ortalama_fire_yuzde: satirlar.length > 0
                    ? Math.round(satirlar.reduce((t, r) => t + r.fire_yuzde, 0) / satirlar.length * 10) / 10
                    : 0,
            },
            model_bazinda: Object.values(modelBazinda)
                .map(m => ({ ...m, toplam_fire_tutar: Math.round(m.toplam_fire_tutar * 100) / 100 }))
                .sort((a, b) => b.toplam_fire_tutar - a.toplam_fire_tutar),
            personel_bazinda: Object.values(personelBazinda)
                .map(p => ({ ...p, toplam_fire_tutar: Math.round(p.toplam_fire_tutar * 100) / 100 }))
                .sort((a, b) => b.toplam_fire_tutar - a.toplam_fire_tutar),
            detay: satirlar,
        });
    } catch (err) {
        console.error('Fire maliyet raporu hatası:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
