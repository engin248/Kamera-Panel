import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Personel SGK kayıtları
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const personel_id = searchParams.get('personel_id');
        const ay = searchParams.get('ay');
        const yil = searchParams.get('yil');

        if (!personel_id) return NextResponse.json({ error: 'personel_id zorunlu' }, { status: 400 });

        let query = supabaseAdmin
            .from('personel_sgk')
            .select(`*, personnel (name)`)
            .eq('personel_id', parseInt(personel_id))
            .order('yil', { ascending: false })
            .order('ay', { ascending: false });

        if (ay && yil) {
            query = query.eq('ay', parseInt(ay)).eq('yil', parseInt(yil));
        }

        const { data, error } = await query;
        if (error) throw error;

        const kayitlar = (data || []).map(r => ({ ...r, personel_adi: r.personnel?.name, personnel: undefined }));
        const toplam_odenen = kayitlar.reduce((t, k) => t + (k.odenen_tutar || 0), 0);
        return NextResponse.json({ kayitlar, toplam_odenen });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — SGK kaydı ekle/güncelle
export async function POST(request) {
    try {
        const body = await request.json();
        const { personel_id, ay, yil, odenen_tutar, notlar } = body;

        if (!personel_id || !ay || !yil || odenen_tutar === undefined) {
            return NextResponse.json({ error: 'personel_id, ay, yil, odenen_tutar zorunlu' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('personel_sgk')
            .upsert({
                personel_id: parseInt(personel_id),
                ay: parseInt(ay),
                yil: parseInt(yil),
                odenen_tutar: parseFloat(odenen_tutar),
                notlar: notlar || null,
            }, { onConflict: 'personel_id,ay,yil' });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE — SGK kaydı sil
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

        const { error } = await supabaseAdmin.from('personel_sgk').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
