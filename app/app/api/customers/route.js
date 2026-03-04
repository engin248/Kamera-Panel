import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// GET — Müşteri listesi
// ============================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('customers')
            .select('*')
            .is('deleted_at', null)
            .order('name', { ascending: true });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni müşteri
// ============================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, company, phone, email, address, tax_no, notes } = body;

        if (!name) return NextResponse.json({ error: 'Müşteri adı zorunlu' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('customers')
            .insert({ name, company: company || '', phone: phone || '', email: email || '', address: address || '', tax_no: tax_no || '', notes: notes || '' })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
