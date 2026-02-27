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

// DELETE — Maliyet kaydı soft-delete
export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const cost = db.prepare('SELECT * FROM cost_entries WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!cost) return NextResponse.json({ error: 'Maliyet kaydı bulunamadı' }, { status: 404 });

        db.prepare("UPDATE cost_entries SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ?").run('Koordinatör', id);
        try { db.prepare('INSERT INTO activity_log (user_name, action, table_name, record_id, record_summary) VALUES (?, ?, ?, ?, ?)').run('Koordinatör', 'SOFT_DELETE', 'cost_entries', id, `Maliyet #${id} soft-delete`); } catch (e) { }

        return NextResponse.json({ success: true, message: 'Maliyet kaydı silindi (geri alınabilir)' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
