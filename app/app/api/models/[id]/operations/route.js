import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const OP_FIELDS = [
    'order_number', 'name', 'description', 'difficulty',
    'machine_type', 'thread_material', 'needle_type',
    'tension_setting', 'speed_setting', 'stitch_per_cm',
    'quality_notes', 'quality_tolerance', 'error_examples',
    'standard_time_min', 'standard_time_max', 'unit_price',
    'standart_sure_dk', 'birim_deger',
    'dependency', 'written_instructions',
    'how_to_do', 'video_path', 'audio_path',
    'correct_photo_path', 'incorrect_photo_path', 'optical_appearance',
    'required_skill_level', 'operation_category',
];

function sanitizeOp(data, modelId) {
    const out = { model_id: parseInt(modelId) };
    for (const f of OP_FIELDS) {
        if (data[f] !== undefined) out[f] = data[f];
    }
    return out;
}

// GET — Modele ait operasyonlar
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('operations')
            .select('*')
            .eq('model_id', id)
            .order('order_number', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Operations GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni operasyon ekle
export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'Operasyon adı zorunlu' }, { status: 400 });
        }

        // model var mı?
        const { data: model } = await supabaseAdmin
            .from('models')
            .select('id')
            .eq('id', id)
            .single();
        if (!model) return NextResponse.json({ error: 'Model bulunamadı' }, { status: 404 });

        // Sıra numarası yoksa en sona ekle
        if (!body.order_number) {
            const { count } = await supabaseAdmin
                .from('operations')
                .select('*', { count: 'exact', head: true })
                .eq('model_id', id);
            body.order_number = (count || 0) + 1;
        }

        const insertData = sanitizeOp(body, id);

        const { data, error } = await supabaseAdmin
            .from('operations')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;

        // models.total_operations güncelle
        try {
            const { count } = await supabaseAdmin
                .from('operations')
                .select('*', { count: 'exact', head: true })
                .eq('model_id', id);
            await supabaseAdmin.from('models').update({ total_operations: count || 0 }).eq('id', id);
        } catch (_) { }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Operations POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Operasyon güncelle
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const opId = searchParams.get('opId');
        if (!opId) return NextResponse.json({ error: 'opId gerekli' }, { status: 400 });

        const body = await request.json();
        const updateData = {};
        for (const f of OP_FIELDS) {
            if (body[f] !== undefined) updateData[f] = body[f];
        }

        const { data, error } = await supabaseAdmin
            .from('operations')
            .update(updateData)
            .eq('id', opId)
            .eq('model_id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Operations PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Operasyon sil (hard delete — cascade ile models silinince de temizlenir)
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const opId = searchParams.get('opId');
        if (!opId) return NextResponse.json({ error: 'opId gerekli' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('operations')
            .delete()
            .eq('id', opId)
            .eq('model_id', id);

        if (error) throw error;

        // Sıra numaralarını güncelle
        try {
            const { data: remaining } = await supabaseAdmin
                .from('operations')
                .select('id')
                .eq('model_id', id)
                .order('order_number', { ascending: true });

            if (remaining) {
                for (let i = 0; i < remaining.length; i++) {
                    await supabaseAdmin.from('operations')
                        .update({ order_number: i + 1 })
                        .eq('id', remaining[i].id);
                }
            }

            const { count } = await supabaseAdmin
                .from('operations')
                .select('*', { count: 'exact', head: true })
                .eq('model_id', id);
            await supabaseAdmin.from('models').update({ total_operations: count || 0 }).eq('id', id);
        } catch (_) { }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Operations DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
