import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Fason tedarikçi listesi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin.from('fason_providers').select('*').order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni fason tedarikçi
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, company, phone, address, speciality, notes, quality_rating } = body;
        if (!name) return NextResponse.json({ error: 'Fasoncu adı zorunlu' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('fason_providers')
            .insert({ name, company: company || '', phone: phone || '', address: address || '', speciality: speciality || '', notes: notes || '', quality_rating: quality_rating || 5 })
            .select().single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
