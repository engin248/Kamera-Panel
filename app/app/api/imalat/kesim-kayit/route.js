import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST — Gerçek kesim verisi gir (fire hesaplama dahil)
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            plan_id, gercek_adet, fire_adet,
            kullanilan_metre, fire_nedeni, kaydeden_id
        } = body;

        if (!plan_id || gercek_adet === undefined) {
            return NextResponse.json({ error: 'plan_id ve gercek_adet zorunlu' }, { status: 400 });
        }

        // Fire yüzdesi otomatik hesapla
        const fireAdet = fire_adet || 0;
        const kesilenMetre = kullanilan_metre || 0;
        const fireMetre = kesilenMetre > 0 ? (fireAdet / (gercek_adet + fireAdet)) * kesilenMetre : 0;
        const fireYuzde = kesilenMetre > 0 ? (fireMetre / kesilenMetre) * 100 : 0;

        const { data, error } = await supabaseAdmin
            .from('kesim_kayitlari')
            .insert({
                plan_id: parseInt(plan_id),
                gercek_adet: parseInt(gercek_adet),
                fire_adet: fireAdet,
                kullanilan_metre: kesilenMetre,
                fire_metre: Math.round(fireMetre * 100) / 100,
                fire_yuzde: Math.round(fireYuzde * 100) / 100,
                fire_nedeni: fire_nedeni || '',
                kaydeden_id: kaydeden_id ? parseInt(kaydeden_id) : null,
            })
            .select()
            .single();

        if (error) throw error;

        // Planı 'kesimde' → 'tamamlandı' yap
        await supabaseAdmin
            .from('kesim_planlari')
            .update({ durum: 'tamamlandı' })
            .eq('id', parseInt(plan_id));

        // Fire %3 uyarısı
        const uyari = fireYuzde > 3 ? `⚠️ Fire oranı %${fireYuzde.toFixed(1)} — Limit aşıldı!` : null;

        return NextResponse.json({ success: true, kayit: data, fire_yuzde: fireYuzde, uyari }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// GET — Kesim kayıtları (plan bazında)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const plan_id = searchParams.get('plan_id');

        let query = supabaseAdmin
            .from('kesim_kayitlari')
            .select(`*, kesim_planlari(plan_tarihi, toplam_adet, models(name, code))`)
            .order('created_at', { ascending: false });

        if (plan_id) query = query.eq('plan_id', parseInt(plan_id));

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
