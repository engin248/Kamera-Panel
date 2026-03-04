import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// GET — Sevkiyat listesi
// ============================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const model_id = searchParams.get('model_id');

        let query = supabaseAdmin
            .from('shipments')
            .select(`*, models (name, code), customers (name)`)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (model_id) query = query.eq('model_id', parseInt(model_id));

        const { data, error } = await query;
        if (error) throw error;

        const shipments = (data || []).map(row => ({
            ...row,
            model_name: row.models?.name,
            model_code: row.models?.code,
            customer_name: row.customers?.name,
            models: undefined, customers: undefined,
        }));

        return NextResponse.json(shipments);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni sevkiyat
// ============================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { model_id, customer_id, quantity, shipment_date, tracking_no, cargo_company, destination, notes, status } = body;

        if (!model_id || !quantity) {
            return NextResponse.json({ error: 'Model ve adet zorunlu' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('shipments')
            .insert({
                model_id: parseInt(model_id),
                customer_id: customer_id || null,
                quantity: parseInt(quantity),
                shipment_date: shipment_date || null,
                tracking_no: tracking_no || '',
                cargo_company: cargo_company || '',
                destination: destination || '',
                notes: notes || '',
                status: status || 'hazirlaniyor',
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
