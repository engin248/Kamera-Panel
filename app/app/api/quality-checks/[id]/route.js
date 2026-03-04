import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const QC_FIELDS = ['result', 'defect_type', 'notes', 'check_type', 'photo_path'];

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { data: existing } = await supabaseAdmin.from('quality_checks').select('*').eq('id', id).single();
        if (!existing) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });

        const updateData = {};
        for (const f of QC_FIELDS) {
            if (body[f] !== undefined) updateData[f] = body[f];
        }

        const { data, error } = await supabaseAdmin.from('quality_checks').update(updateData).eq('id', id).select().single();
        if (error) throw error;

        // Audit trail
        try {
            for (const f of Object.keys(updateData)) {
                if (String(existing[f] || '') !== String(updateData[f] || '')) {
                    await supabaseAdmin.from('audit_trail').insert({
                        table_name: 'quality_checks', record_id: parseInt(id), field_name: f,
                        old_value: String(existing[f] || ''), new_value: String(updateData[f] || ''),
                        changed_by: body.changed_by || 'admin',
                    });
                }
            }
        } catch (_) { }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { data: existing } = await supabaseAdmin
            .from('quality_checks').select('id').eq('id', id).is('deleted_at', null).single();
        if (!existing) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });

        const { error } = await supabaseAdmin.from('quality_checks').update({
            deleted_at: new Date().toISOString(), deleted_by: 'admin',
        }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Kalite kontrolü silindi (geri alınabilir)' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
