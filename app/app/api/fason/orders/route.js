import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Fason siparişleri listesi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const provider_id = searchParams.get('provider_id');
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('fason_orders')
            .select(`*, fason_providers (name), models (name, code)`)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (provider_id) query = query.eq('provider_id', parseInt(provider_id));
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;

        const orders = (data || []).map(row => ({
            ...row,
            provider_name: row.fason_providers?.name,
            model_name: row.models?.name,
            model_code: row.models?.code,
            fason_providers: undefined, models: undefined,
        }));

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni fason sipariş
export async function POST(request) {
    try {
        const body = await request.json();
        const { provider_id, model_id, quantity, unit_price, sent_date, expected_date, notes, status } = body;

        if (!provider_id || !model_id || !quantity) {
            return NextResponse.json({ error: 'Fasoncu, model ve adet zorunlu' }, { status: 400 });
        }

        const total_price = (parseFloat(unit_price) || 0) * (parseInt(quantity) || 0);

        const { data, error } = await supabaseAdmin
            .from('fason_orders')
            .insert({
                provider_id: parseInt(provider_id),
                model_id: parseInt(model_id),
                quantity: parseInt(quantity),
                unit_price: parseFloat(unit_price) || 0,
                total_price,
                sent_date: sent_date || null,
                expected_date: expected_date || null,
                notes: notes || '',
                status: status || 'beklemede',
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
