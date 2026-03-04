import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const VALID_COLUMNS = new Set([
    'name', 'code', 'order_no', 'modelist', 'customer', 'customer_id', 'description',
    'fabric_type', 'sizes', 'size_range', 'total_order', 'total_order_text', 'completed_count',
    'fason_price', 'fason_price_text', 'model_difficulty',
    'front_image', 'back_image', 'measurement_table',
    'delivery_date', 'work_start_date', 'post_sewing', 'status',
    'garni', 'color_count', 'color_details', 'size_count', 'size_distribution', 'asorti',
    'total_operations', 'piece_count', 'piece_count_details',
    'op_kesim_count', 'op_kesim_details', 'op_dikim_count', 'op_dikim_details',
    'op_utu_paket_count', 'op_utu_paket_details', 'op_nakis_count', 'op_nakis_details',
    'op_yikama_count', 'op_yikama_details',
    'has_lining', 'lining_pieces', 'has_interlining', 'interlining_parts', 'interlining_count',
    'difficult_points', 'critical_points', 'customer_requests',
    'cutting_info', 'accessory_info', 'label_info',
]);

const DATE_FIELDS = ['delivery_date', 'work_start_date'];
const JSON_FIELDS = ['measurement_table'];

function sanitizeData(data) {
    const out = {};
    for (const [k, v] of Object.entries(data)) {
        if (!VALID_COLUMNS.has(k)) continue;
        if (DATE_FIELDS.includes(k)) { out[k] = v === '' ? null : v; continue; }
        if (JSON_FIELDS.includes(k) && typeof v === 'string') {
            try { out[k] = JSON.parse(v); } catch { out[k] = v; }
            continue;
        }
        out[k] = v;
    }
    return out;
}

// GET — Tek model + operasyonları
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const { data: model, error: mErr } = await supabaseAdmin
            .from('models')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (mErr || !model) return NextResponse.json({ error: 'Model bulunamadı' }, { status: 404 });

        const { data: operations } = await supabaseAdmin
            .from('operations')
            .select('*')
            .eq('model_id', id)
            .order('order_number', { ascending: true });

        return NextResponse.json({ ...model, operations: operations || [] });
    } catch (error) {
        console.error('Models [id] GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Model güncelle
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { data: oldModel, error: fetchErr } = await supabaseAdmin
            .from('models')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchErr || !oldModel) return NextResponse.json({ error: 'Model bulunamadı' }, { status: 404 });

        const updateData = sanitizeData(body);
        if (!Object.keys(updateData).length) return NextResponse.json(oldModel);

        const { data: updated, error } = await supabaseAdmin
            .from('models')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Audit trail
        const changed_by = body.changed_by || 'admin';
        try {
            const auditRows = Object.keys(updateData)
                .filter(f => String(oldModel[f] ?? '') !== String(updateData[f] ?? ''))
                .map(f => ({
                    table_name: 'models',
                    record_id: parseInt(id),
                    field_name: f,
                    old_value: String(oldModel[f] ?? ''),
                    new_value: String(updateData[f] ?? ''),
                    changed_by,
                }));
            if (auditRows.length) {
                await supabaseAdmin.from('audit_trail').insert(auditRows);
            }
        } catch (_) { }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Models PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Soft delete
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const { data: model, error: fetchErr } = await supabaseAdmin
            .from('models')
            .select('id, name, code')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchErr || !model) return NextResponse.json({ error: 'Model bulunamadı' }, { status: 404 });

        const { error } = await supabaseAdmin
            .from('models')
            .update({ deleted_at: new Date().toISOString(), deleted_by: 'admin' })
            .eq('id', id);

        if (error) throw error;

        try {
            await supabaseAdmin.from('audit_trail').insert({
                table_name: 'models',
                record_id: parseInt(id),
                field_name: 'SOFT-DELETE',
                old_value: `${model.name} (${model.code})`,
                new_value: 'SİLİNDİ',
                changed_by: 'admin',
            });
        } catch (_) { }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Models DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
