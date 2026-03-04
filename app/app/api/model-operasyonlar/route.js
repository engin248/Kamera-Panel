import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Model işlem sırası
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');
        if (!model_id) return NextResponse.json({ error: 'model_id gerekli' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('model_islem_sirasi')
            .select('*')
            .eq('model_id', parseInt(model_id))
            .order('sira_no', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — İşlem sırası kaydet (toplu veya tekil)
export async function POST(request) {
    try {
        const body = await request.json();
        const { model_id, islemler } = body;
        if (!model_id) return NextResponse.json({ error: 'model_id gerekli' }, { status: 400 });

        if (islemler && Array.isArray(islemler)) {
            // Önce sil, sonra yeniden ekle
            await supabaseAdmin.from('model_islem_sirasi').delete().eq('model_id', parseInt(model_id));

            const insertList = islemler.map((islem, idx) => ({
                model_id: parseInt(model_id),
                sira_no: islem.sira_no || idx + 1,
                islem_adi: islem.islem_adi || '',
                makine_tipi: islem.makine_tipi || '',
                zorluk_derecesi: islem.zorluk_derecesi || 3,
                tahmini_sure_dk: islem.tahmini_sure_dk || 0,
                nasil_yapilir: islem.nasil_yapilir || '',
            }));

            const { error } = await supabaseAdmin.from('model_islem_sirasi').insert(insertList);
            if (error) throw error;

            const { data: saved } = await supabaseAdmin.from('model_islem_sirasi').select('*').eq('model_id', parseInt(model_id)).order('sira_no');
            return NextResponse.json({ success: true, islemler: saved });
        }

        // Tekil kayıt
        const { sira_no, islem_adi, makine_tipi, zorluk_derecesi, tahmini_sure_dk, nasil_yapilir } = body;
        const { data, error } = await supabaseAdmin
            .from('model_islem_sirasi')
            .insert({ model_id: parseInt(model_id), sira_no, islem_adi, makine_tipi: makine_tipi || '', zorluk_derecesi: zorluk_derecesi || 3, tahmini_sure_dk: tahmini_sure_dk || 0, nasil_yapilir: nasil_yapilir || '' })
            .select().single();

        if (error) throw error;
        return NextResponse.json({ success: true, id: data.id }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — İşlem sil
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const model_id = searchParams.get('model_id');

        if (id) {
            await supabaseAdmin.from('model_islem_sirasi').delete().eq('id', id);
        } else if (model_id) {
            await supabaseAdmin.from('model_islem_sirasi').delete().eq('model_id', parseInt(model_id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
