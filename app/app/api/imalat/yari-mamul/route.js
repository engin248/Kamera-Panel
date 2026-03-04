import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Yarı mamul stok durumu
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');
        const siparis_id = searchParams.get('siparis_id');

        let query = supabaseAdmin
            .from('yari_mamul_stok')
            .select('*, models(name, code)')
            .order('tarih', { ascending: false });

        if (model_id) query = query.eq('model_id', parseInt(model_id));
        if (siparis_id) query = query.eq('siparis_id', parseInt(siparis_id));

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Yarı mamul stok hareketi kaydet
export async function POST(request) {
    try {
        const body = await request.json();
        const { model_id, siparis_id, faz_kaynak, faz_hedef, adet, kaydeden_id, notlar } = body;

        if (!model_id || !faz_kaynak || !faz_hedef || !adet) {
            return NextResponse.json(
                { error: 'model_id, faz_kaynak, faz_hedef ve adet zorunlu' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('yari_mamul_stok')
            .insert({
                model_id: parseInt(model_id),
                siparis_id: siparis_id ? parseInt(siparis_id) : null,
                faz_kaynak,
                faz_hedef,
                adet: parseInt(adet),
                kaydeden_id: kaydeden_id ? parseInt(kaydeden_id) : null,
                notlar: notlar || '',
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
