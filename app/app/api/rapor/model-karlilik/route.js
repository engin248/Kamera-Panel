import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/rapor/model-karlilik?ay=3&yil=2026
 * Her model için: gelir, maliyet, kar marjı, üretim adedi
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

        // Model bazlı üretim verileri
        const { data: logs } = await supabaseAdmin
            .from('production_logs')
            .select(`model_id, total_produced, defective_count, unit_value, first_pass_yield, net_work_minutes, models(name, code, fason_price)`)
            .is('deleted_at', null)
            .not('model_id', 'is', null)
            .gte('start_time', `${baslangic}T00:00:00Z`)
            .lt('start_time', `${bitis}T00:00:00Z`);

        // ✅ GÖREV 5: Aylık toplam işçilik maliyeti
        const { data: personeller } = await supabaseAdmin
            .from('personnel')
            .select('base_salary, transport_allowance, food_allowance')
            .eq('status', 'active').is('deleted_at', null);

        const toplamIscilikAylik = (personeller || []).reduce((s, p) => {
            const brut = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0);
            return s + brut + brut * 0.225;
        }, 0);
        // Saatlik maliyet = aylık / (22 iş günü × 9 saat × 60 dakika)
        const saatlikMaliyet = toplamIscilikAylik / (22 * 9 * 60) || 0;

        // Model bazlı maliyet
        const { data: maliyetler } = await supabaseAdmin
            .from('cost_entries')
            .select('model_id, total')
            .is('deleted_at', null)
            .not('model_id', 'is', null);

        const maliyetMap = {};
        (maliyetler || []).forEach(m => {
            maliyetMap[m.model_id] = (maliyetMap[m.model_id] || 0) + (m.total || 0);
        });

        // Model bazlı sipariş geliri
        const { data: siparisler } = await supabaseAdmin
            .from('orders')
            .select('model_id, total_price')
            .is('deleted_at', null)
            .in('status', ['tamamlandi', 'teslim_edildi'])
            .not('model_id', 'is', null)
            .gte('updated_at', `${baslangic}T00:00:00Z`)
            .lt('updated_at', `${bitis}T00:00:00Z`);

        const sipMap = {};
        (siparisler || []).forEach(s => { sipMap[s.model_id] = (sipMap[s.model_id] || 0) + (s.total_price || 0); });

        // Gruplama
        const modelMap = {};
        for (const log of (logs || [])) {
            const mid = log.model_id;
            if (!modelMap[mid]) {
                modelMap[mid] = {
                    model_id: mid, model_adi: log.models?.name, model_kodu: log.models?.code,
                    fason_price: log.models?.fason_price || 0,
                    toplam_uretim: 0, toplam_hata: 0, toplam_ciro: 0, fpy_sum: 0, fpy_count: 0,
                    toplam_net_dakika: 0, // ✅ GÖREV 5: İşçilik zamanı
                };
            }
            modelMap[mid].toplam_uretim += log.total_produced || 0;
            modelMap[mid].toplam_hata += log.defective_count || 0;
            modelMap[mid].toplam_ciro += log.unit_value || 0;
            modelMap[mid].toplam_net_dakika += log.net_work_minutes || 0;
            if (log.first_pass_yield) { modelMap[mid].fpy_sum += log.first_pass_yield; modelMap[mid].fpy_count++; }
        }

        const sonuclar = Object.values(modelMap).map(u => {
            const hammadde = maliyetMap[u.model_id] || 0;
            const siparis_gelir = sipMap[u.model_id] || u.toplam_ciro || 0;
            const fason_gider = u.fason_price * u.toplam_uretim;
            // ✅ GÖREV 5: İşçilik maliyeti = toplam çalışma dakikası × saatlik dakika mali
            const iscilik_gider = u.toplam_net_dakika * saatlikMaliyet;
            const toplam_maliyet = hammadde + fason_gider + iscilik_gider;
            const kar = siparis_gelir - toplam_maliyet;
            const kar_marji = siparis_gelir > 0 ? (kar / siparis_gelir) * 100 : 0;
            const hata_orani = u.toplam_uretim > 0 ? (u.toplam_hata / u.toplam_uretim) * 100 : 0;
            const ort_fpy = u.fpy_count > 0 ? u.fpy_sum / u.fpy_count : 100;

            return {
                model_id: u.model_id, model_adi: u.model_adi, model_kodu: u.model_kodu,
                toplam_uretim: u.toplam_uretim, toplam_hata: u.toplam_hata,
                hata_yuzdesi: parseFloat(hata_orani.toFixed(1)), fpy: parseFloat(ort_fpy.toFixed(1)),
                siparis_gelir: parseFloat(siparis_gelir.toFixed(2)),
                hammadde_maliyet: parseFloat(hammadde.toFixed(2)),
                fason_gider: parseFloat(fason_gider.toFixed(2)),
                iscilik_gider: parseFloat(iscilik_gider.toFixed(2)), // ✅ GÖREV 5
                toplam_maliyet: parseFloat(toplam_maliyet.toFixed(2)),
                kar: parseFloat(kar.toFixed(2)), kar_marji: parseFloat(kar_marji.toFixed(1)),
                durum: kar_marji >= 20 ? 'iyi' : kar_marji >= 10 ? 'orta' : 'risk',
            };
        }).sort((a, b) => b.kar - a.kar);

        return NextResponse.json({
            ay, yil, modeller: sonuclar,
            ozet: {
                toplam_model: sonuclar.length,
                karli_model: sonuclar.filter(m => m.kar > 0).length,
                riskli_model: sonuclar.filter(m => m.durum === 'risk').length,
                toplam_kar: parseFloat(sonuclar.reduce((t, m) => t + m.kar, 0).toFixed(2)),
            }
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
