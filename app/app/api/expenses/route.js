import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — İşletme giderlerini getir
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
        const month = searchParams.get('month');

        let query = supabaseAdmin
            .from('business_expenses')
            .select('*')
            .eq('year', year)
            .is('deleted_at', null)
            .order('month', { ascending: false })
            .order('category');

        if (month) {
            query = query.eq('month', parseInt(month));
        }

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni gider ekle
export async function POST(request) {
    try {
        const body = await request.json();
        const { category, description, amount, year, month, is_recurring } = body;

        if (!category || !amount || !year || !month) {
            return NextResponse.json({ error: 'Kategori, tutar, yıl ve ay zorunlu' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('business_expenses')
            .insert({ category, description: description || '', amount, year, month, is_recurring: is_recurring || false })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Gider güncelle
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, category, description, amount, is_recurring } = body;

        if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });

        const updateData = {};
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description;
        if (amount !== undefined) updateData.amount = amount;
        if (is_recurring !== undefined) updateData.is_recurring = is_recurring;

        const { data, error } = await supabaseAdmin
            .from('business_expenses')
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

// DELETE — Gider soft-delete
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('business_expenses')
            .update({ deleted_at: new Date().toISOString(), deleted_by: 'admin' })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Gider silindi (geri alınabilir)' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
