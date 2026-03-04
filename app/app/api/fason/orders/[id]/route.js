import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const FASON_ORDER_FIELDS = ['status', 'received_quantity', 'defective_count', 'quality_notes', 'received_date', 'quality_rating'];

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updateData = {};
        for (const f of FASON_ORDER_FIELDS) {
            if (body[f] !== undefined) updateData[f] = body[f];
        }

        const { data, error } = await supabaseAdmin
            .from('fason_orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { data: existing } = await supabaseAdmin
            .from('fason_orders').select('id').eq('id', id).is('deleted_at', null).single();
        if (!existing) return NextResponse.json({ error: 'Fason sipariş bulunamadı' }, { status: 404 });

        const { error } = await supabaseAdmin.from('fason_orders').update({
            deleted_at: new Date().toISOString(), deleted_by: 'admin',
        }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Fason sipariş silindi (geri alınabilir)' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
