import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// PUT — Maliyet kaydını güncelle (total otomatik hesaplama)
// ============================================================
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { category, description, amount, unit, quantity } = body;

        const updateData = {};
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description;
        if (unit !== undefined) updateData.unit = unit;

        // Tutar veya miktar değiştiyse → total yeniden hesapla
        if (amount !== undefined || quantity !== undefined) {
            // Mevcut kaydı al
            const { data: current } = await supabaseAdmin
                .from('cost_entries')
                .select('amount, quantity')
                .eq('id', id)
                .single();

            const newAmount = amount !== undefined ? parseFloat(amount) : (current?.amount || 0);
            const newQty = quantity !== undefined ? parseFloat(quantity) : (current?.quantity || 1);

            updateData.amount = newAmount;
            updateData.quantity = newQty;
            updateData.total = newAmount * newQty;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('cost_entries')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Costs PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// DELETE — Soft delete
// ============================================================
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const { data: cost, error: fetchErr } = await supabaseAdmin
            .from('cost_entries')
            .select('id')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchErr || !cost) {
            return NextResponse.json({ error: 'Maliyet kaydı bulunamadı' }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from('cost_entries')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: 'Koordinatör',
            })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Maliyet kaydı silindi (geri alınabilir)' });
    } catch (error) {
        console.error('Costs DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
