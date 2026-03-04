import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ORDER_FIELDS = [
    'customer_id', 'customer_name', 'model_id', 'model_name',
    'quantity', 'unit_price', 'delivery_date', 'priority',
    'fabric_type', 'color', 'sizes', 'notes', 'status',
];

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { data: existing } = await supabaseAdmin.from('orders').select('*').eq('id', id).single();
        if (!existing) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });

        const updateData = {};
        for (const f of ORDER_FIELDS) {
            if (body[f] !== undefined) updateData[f] = body[f];
        }

        // total_price yeniden hesapla
        const qty = body.quantity !== undefined ? parseFloat(body.quantity) : existing.quantity;
        const price = body.unit_price !== undefined ? parseFloat(body.unit_price) : existing.unit_price;
        updateData.total_price = (qty || 0) * (price || 0);

        const { error } = await supabaseAdmin.from('orders').update(updateData).eq('id', id);
        if (error) throw error;

        // Audit trail
        try {
            const changedBy = body.changed_by || 'admin';
            for (const f of Object.keys(updateData)) {
                if (String(existing[f] || '') !== String(updateData[f] || '')) {
                    await supabaseAdmin.from('audit_trail').insert({
                        table_name: 'orders', record_id: parseInt(id), field_name: f,
                        old_value: String(existing[f] || ''), new_value: String(updateData[f] || ''),
                        changed_by: changedBy,
                    });
                }
            }
        } catch (_) { }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const reason = body.reason || 'Sebep belirtilmedi';
        const deletedBy = body.deleted_by || 'admin';

        const { data: existing } = await supabaseAdmin
            .from('orders').select('id').eq('id', id).is('deleted_at', null).single();
        if (!existing) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });

        const { error } = await supabaseAdmin.from('orders').update({
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy,
        }).eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Sipariş arşivlendi' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
