import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// PUT — Maliyet kaydını güncelle
export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        const allowedFields = ['category', 'description', 'amount', 'unit', 'quantity', 'total'];
        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(body[field]);
            }
        }

        // Recalculate total if amount or quantity changed
        if (body.amount !== undefined || body.quantity !== undefined) {
            const current = db.prepare('SELECT * FROM cost_entries WHERE id = ?').get(id);
            if (current) {
                const newAmount = body.amount !== undefined ? parseFloat(body.amount) : current.amount;
                const newQuantity = body.quantity !== undefined ? parseFloat(body.quantity) : current.quantity;
                const newTotal = newAmount * newQuantity;
                if (!updates.includes('total = ?')) {
                    updates.push('total = ?');
                    values.push(newTotal);
                }
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
        }

        values.push(id);
        db.prepare(`UPDATE cost_entries SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM cost_entries WHERE id = ?').get(id);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Maliyet kaydını sil
export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        db.prepare('DELETE FROM cost_entries WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
