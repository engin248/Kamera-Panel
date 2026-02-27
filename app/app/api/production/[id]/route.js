import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Tek üretim kaydı getir
export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const log = db.prepare(`
            SELECT pl.*, m.name as model_name, m.code as model_code,
                o.name as operation_name, o.unit_price,
                p.name as personnel_name
            FROM production_logs pl
            JOIN models m ON pl.model_id = m.id
            JOIN operations o ON pl.operation_id = o.id
            JOIN personnel p ON pl.personnel_id = p.id
            WHERE pl.id = ?
        `).get(id);
        if (!log) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
        return NextResponse.json(log);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Üretim kaydını güncelle
export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        const allowedFields = [
            'total_produced', 'defective_count', 'defect_reason', 'defect_source',
            'break_duration_min', 'machine_down_min', 'material_wait_min', 'passive_time_min',
            'quality_score', 'lot_change', 'status', 'end_time'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(body[field]);
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
        }

        values.push(id);
        db.prepare(`UPDATE production_logs SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updated = db.prepare(`
            SELECT pl.*, m.name as model_name, o.name as operation_name, p.name as personnel_name
            FROM production_logs pl
            JOIN models m ON pl.model_id = m.id
            JOIN operations o ON pl.operation_id = o.id
            JOIN personnel p ON pl.personnel_id = p.id
            WHERE pl.id = ?
        `).get(id);

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Üretim kaydı soft-delete
export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const log = db.prepare('SELECT * FROM production_logs WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!log) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });

        db.prepare("UPDATE production_logs SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ?").run('Koordinatör', id);
        try { db.prepare('INSERT INTO activity_log (user_name, action, table_name, record_id, record_summary) VALUES (?, ?, ?, ?, ?)').run('Koordinatör', 'SOFT_DELETE', 'production_logs', id, `Üretim #${id} soft-delete`); } catch (e) { }

        return NextResponse.json({ success: true, message: 'Üretim kaydı silindi (geri alınabilir)' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
