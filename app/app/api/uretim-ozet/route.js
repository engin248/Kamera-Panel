import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Günlük üretim özeti
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const tarih = searchParams.get('tarih') || new Date().toISOString().split('T')[0];

        const startOfDay = `${tarih}T00:00:00.000Z`;
        const endOfDay = `${tarih}T23:59:59.999Z`;

        const { data: logs, error } = await supabaseAdmin
            .from('production_logs')
            .select('total_produced, defective_count, oee_score, unit_value, personnel_id, model_id')
            .is('deleted_at', null)
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay);

        if (error) throw error;

        const rows = logs || [];
        const kayit_sayisi = rows.length;
        const toplam_uretim = rows.reduce((s, r) => s + (r.total_produced || 0), 0);
        const toplam_hata = rows.reduce((s, r) => s + (r.defective_count || 0), 0);
        const ort_oee = kayit_sayisi > 0 ? rows.reduce((s, r) => s + (r.oee_score || 0), 0) / kayit_sayisi : 0;
        const toplam_deger = rows.reduce((s, r) => s + (r.unit_value || 0), 0);
        const aktif_personel = new Set(rows.map(r => r.personnel_id)).size;
        const farkli_model = new Set(rows.map(r => r.model_id)).size;

        const fpy = toplam_uretim > 0
            ? ((toplam_uretim - toplam_hata) / toplam_uretim * 100).toFixed(1)
            : '100.0';

        // ✅ GÖREV 7: Günlük hedef sistem_ayarlari tablosundan dinamik çekilir
        let hedef = 500;
        try {
            const { data: ayar } = await supabaseAdmin
                .from('sistem_ayarlari')
                .select('deger')
                .eq('anahtar', 'gunluk_hedef')
                .maybeSingle();
            if (ayar?.deger) hedef = parseInt(ayar.deger) || 500;
        } catch (_) { /* tablo yoksa 500 kullan */ }
        const hedef_yuzdesi = Math.min(100, (toplam_uretim / hedef * 100)).toFixed(0);

        return NextResponse.json({
            kayit_sayisi, toplam_uretim, toplam_hata, ort_oee: Math.round(ort_oee * 10) / 10,
            toplam_deger: Math.round(toplam_deger * 100) / 100, aktif_personel, farkli_model,
            fpy, hedef, hedef_yuzdesi, tarih,
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
