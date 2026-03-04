import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Onay kuyruğunu getir
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        let query = supabaseAdmin
            .from('approval_queue')
            .select(`
                *,
                personnel (name, role),
                models (name, code),
                operations (name)
            `)
            .order('created_at', { ascending: false });

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        const approvals = (data || []).map(row => ({
            ...row,
            personnel_name: row.personnel?.name,
            personnel_role: row.personnel?.role,
            model_name: row.models?.name,
            model_code: row.models?.code,
            operation_name: row.operations?.name,
            personnel: undefined, models: undefined, operations: undefined,
        }));

        return NextResponse.json(approvals);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni onay talebi oluştur (operatörden)
export async function POST(request) {
    try {
        const body = await request.json();
        const { personnel_id, model_id, operation_id, photo_path } = body;

        if (!personnel_id || !model_id || !operation_id) {
            return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('approval_queue')
            .insert({
                personnel_id: parseInt(personnel_id),
                model_id: parseInt(model_id),
                operation_id: parseInt(operation_id),
                photo_path: photo_path || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Onay/red güncelle (yöneticiden)
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, status, notes } = body;

        if (!id || !status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('approval_queue')
            .update({
                status,
                notes: notes || '',
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
