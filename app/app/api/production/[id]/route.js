import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED_FIELDS = [
    'total_produced', 'defective_count', 'defect_reason', 'defect_source',
    'break_duration_min', 'machine_down_min', 'material_wait_min', 'passive_time_min',
    'quality_score', 'lot_change', 'status', 'end_time',
    'defect_photo', 'defect_classification', 'notes',
    'first_pass_yield', 'oee_score', 'takt_time_ratio', 'unit_value', 'net_work_minutes',
];

// ============================================================
// GET — Tek üretim kaydı (ilişkisel)
// ============================================================
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('production_logs')
            .select(`
                *,
                models (name, code),
                operations (name, unit_price),
                personnel (name, role)
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
        }

        // Düzleştir
        const log = {
            ...data,
            model_name: data.models?.name,
            model_code: data.models?.code,
            operation_name: data.operations?.name,
            unit_price: data.operations?.unit_price,
            personnel_name: data.personnel?.name,
            personnel_role: data.personnel?.role,
            models: undefined, operations: undefined, personnel: undefined,
        };

        return NextResponse.json(log);
    } catch (error) {
        console.error('Production [id] GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// PUT — Üretim kaydını güncelle + otomatik metrik yeniden hesapla
// ============================================================
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updateData = {};
        for (const field of ALLOWED_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
        }

        const { error: updateErr } = await supabaseAdmin
            .from('production_logs')
            .update(updateData)
            .eq('id', id);

        if (updateErr) throw updateErr;

        // Otomatik metrikleri yeniden hesapla
        try {
            const { data: record } = await supabaseAdmin
                .from('production_logs')
                .select('*, operations(unit_price)')
                .eq('id', id)
                .single();

            if (record) {
                const tp = record.total_produced || 0;
                const dc = record.defective_count || 0;
                const fpy = tp > 0 ? ((tp - dc) / tp) * 100 : 100;
                const brk = record.break_duration_min || 0;
                const mch = record.machine_down_min || 0;
                const mat = record.material_wait_min || 0;
                const pas = record.passive_time_min || 0;
                let netWork = 0;
                if (record.end_time && record.start_time) {
                    const totalMin = (new Date(record.end_time) - new Date(record.start_time)) / 60000;
                    netWork = Math.max(0, totalMin - brk - mch - mat - pas);
                }
                const unitVal = (record.operations?.unit_price || 0) * tp;

                await supabaseAdmin
                    .from('production_logs')
                    .update({
                        first_pass_yield: Math.round(fpy * 10) / 10,
                        net_work_minutes: Math.round(netWork * 10) / 10,
                        unit_value: unitVal,
                    })
                    .eq('id', id);
            }
        } catch (e) { /* hesaplama hatası kritik değil */ }

        // Güncel kaydı ilişkisel döndür
        const { data: updated, error: getErr } = await supabaseAdmin
            .from('production_logs')
            .select(`
                *,
                models (name, code),
                operations (name, unit_price),
                personnel (name, role)
            `)
            .eq('id', id)
            .single();

        if (getErr) throw getErr;

        return NextResponse.json({
            ...updated,
            model_name: updated.models?.name,
            model_code: updated.models?.code,
            operation_name: updated.operations?.name,
            unit_price: updated.operations?.unit_price,
            personnel_name: updated.personnel?.name,
            models: undefined, operations: undefined, personnel: undefined,
        });
    } catch (error) {
        console.error('Production PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// DELETE — Soft delete (Personnel ile aynı pattern)
// ============================================================
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const { data: log, error: fetchErr } = await supabaseAdmin
            .from('production_logs')
            .select('id, model_id, personnel_id')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchErr || !log) {
            return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from('production_logs')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: 'Koordinatör',
            })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Üretim kaydı silindi (geri alınabilir)' });
    } catch (error) {
        console.error('Production DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
