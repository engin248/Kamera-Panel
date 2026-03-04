import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Prim onay listesi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ay = parseInt(searchParams.get('ay') || new Date().getMonth() + 1);
        const yil = parseInt(searchParams.get('yil') || new Date().getFullYear());

        const { data, error } = await supabaseAdmin
            .from('prim_kayitlari')
            .select(`*, personnel (name, position, base_salary, transport_allowance, food_allowance)`)
            .eq('ay', ay).eq('yil', yil)
            .order('katki_degeri', { ascending: false });

        if (error) throw error;

        const primler = (data || []).map(r => ({
            ...r,
            personel_ad: r.personnel?.name,
            pozisyon: r.personnel?.position,
            base_salary: r.personnel?.base_salary,
            personnel: undefined,
        }));

        const ozet = {
            toplam: primler.length,
            hesaplandi: primler.filter(p => p.onay_durumu === 'hesaplandi').length,
            onaylandi: primler.filter(p => p.onay_durumu === 'onaylandi').length,
            odendi: primler.filter(p => p.onay_durumu === 'odendi').length,
            toplam_prim_tutari: primler.reduce((t, p) => t + (p.prim_tutari || 0), 0),
        };

        return NextResponse.json({ ay, yil, primler, ozet });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — Prim onayla
export async function POST(request) {
    try {
        const body = await request.json();
        const { personel_id, ay, yil, aksiyon, onaylayan_id } = body;

        if (aksiyon === 'onayla') {
            const { error } = await supabaseAdmin
                .from('prim_kayitlari')
                .update({ onay_durumu: 'onaylandi', onaylayan_id: onaylayan_id || null, onay_tarihi: new Date().toISOString() })
                .eq('personel_id', parseInt(personel_id)).eq('ay', ay).eq('yil', yil);
            if (error) throw error;
            return NextResponse.json({ success: true, mesaj: 'Prim onaylandı' });
        }

        return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT — Ödendi işareti
export async function PUT(request) {
    try {
        const body = await request.json();
        const { personel_id, ay, yil, odeme_tarihi } = body;

        const { error } = await supabaseAdmin
            .from('prim_kayitlari')
            .update({ onay_durumu: 'odendi', odeme_tarihi: odeme_tarihi || new Date().toISOString().split('T')[0] })
            .eq('personel_id', parseInt(personel_id)).eq('ay', ay).eq('yil', yil)
            .eq('onay_durumu', 'onaylandi');

        if (error) throw error;
        return NextResponse.json({ success: true, mesaj: 'Ödeme kaydedildi' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
