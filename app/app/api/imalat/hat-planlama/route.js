import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Hat planları listesi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');
        const aktif = searchParams.get('aktif');

        let query = supabaseAdmin
            .from('hat_planlamasi')
            .select(`*, models (name, code)`)
            .order('created_at', { ascending: false });

        if (model_id) query = query.eq('model_id', parseInt(model_id));
        if (aktif !== null && aktif !== undefined) query = query.eq('aktif', aktif === 'true');

        const { data, error } = await query;
        if (error) throw error;

        const hatlar = (data || []).map(h => ({
            ...h,
            model_adi: h.models?.name,
            model_kodu: h.models?.code,
            models: undefined,
        }));

        return NextResponse.json(hatlar);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Yeni hat planı oluştur
export async function POST(request) {
    try {
        const body = await request.json();
        const { model_id, hat_adi, personel_listesi, gun_hedefi, baslangic_tarihi, bitis_tarihi, notlar } = body;

        if (!model_id || !hat_adi) {
            return NextResponse.json({ error: 'model_id ve hat_adi zorunlu' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('hat_planlamasi')
            .insert({
                model_id: parseInt(model_id),
                hat_adi,
                personel_listesi: personel_listesi || [],
                gun_hedefi: gun_hedefi || 0,
                baslangic_tarihi: baslangic_tarihi || null,
                bitis_tarihi: bitis_tarihi || null,
                notlar: notlar || '',
                aktif: true,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT — Hat güncelle (personel listesi, hedef, durum)
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

        const ALLOWED = ['hat_adi', 'personel_listesi', 'gun_hedefi', 'aktif', 'baslangic_tarihi', 'bitis_tarihi', 'notlar'];
        const updateData = { updated_at: new Date().toISOString() };
        for (const f of ALLOWED) {
            if (updates[f] !== undefined) updateData[f] = updates[f];
        }

        const { data, error } = await supabaseAdmin
            .from('hat_planlamasi')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
