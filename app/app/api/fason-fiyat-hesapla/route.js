import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST — Fason fiyat hesapla
export async function POST(request) {
    try {
        const { model_id, kar_marji_yuzde = 20, ek_malzeme_tl = 0, nakliye_tl = 0, toplam_adet = 1 } = await request.json();

        if (toplam_adet <= 0) return NextResponse.json({ error: 'toplam_adet sıfırdan büyük olmalı' }, { status: 400 });
        if (kar_marji_yuzde < -100) return NextResponse.json({ error: 'Geçersiz kâr marjı' }, { status: 400 });

        // İşletme saatlik maliyeti (business_expenses tablosundan ayın toplam gideri / çalışma saati)
        const { data: giderler } = await supabaseAdmin
            .from('business_expenses')
            .select('amount')
            .is('deleted_at', null)
            .eq('year', new Date().getFullYear())
            .eq('month', new Date().getMonth() + 1);

        const aylikToplamGider = (giderler || []).reduce((s, g) => s + (g.amount || 0), 0);
        // Varsayım: ayda 22 gün × 9 saat = 198 saat
        const saatlik_maliyet = aylikToplamGider > 0 ? aylikToplamGider / 198 : 0;

        // Model operasyon süreleri
        let tahmini_sure_saat = 0;
        if (model_id) {
            const { data: ops } = await supabaseAdmin
                .from('operations')
                .select('standard_time_max, standard_time_min')
                .eq('model_id', parseInt(model_id));

            const toplam_sn = (ops || []).reduce((s, o) => s + (o.standard_time_max || o.standard_time_min || 0), 0);
            tahmini_sure_saat = toplam_sn / 3600;
        }

        const iscilik = saatlik_maliyet * tahmini_sure_saat;
        const maliyet_alt = iscilik + ek_malzeme_tl + nakliye_tl;
        const fason_fiyat = maliyet_alt * (1 + kar_marji_yuzde / 100);
        const birim_fiyat = toplam_adet > 0 ? fason_fiyat / toplam_adet : fason_fiyat;
        const kar_zarar_sinyal = kar_marji_yuzde >= 20 ? 'karli' : kar_marji_yuzde >= 10 ? 'riskli' : 'zararlı';

        return NextResponse.json({
            saatlik_maliyet: saatlik_maliyet.toFixed(2),
            tahmini_sure_saat: tahmini_sure_saat.toFixed(2),
            maliyet_alt: maliyet_alt.toFixed(2),
            fason_fiyat: fason_fiyat.toFixed(2),
            birim_fiyat: birim_fiyat.toFixed(2),
            kar_zarar_sinyal,
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
