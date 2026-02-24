import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Onay kuyruğunu getir
export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        const approvals = db.prepare(`
            SELECT aq.*,
                p.name as personnel_name, p.role as personnel_role,
                m.name as model_name, m.code as model_code,
                o.name as operation_name
            FROM approval_queue aq
            JOIN personnel p ON aq.personnel_id = p.id
            JOIN models m ON aq.model_id = m.id
            JOIN operations o ON aq.operation_id = o.id
            ${status !== 'all' ? 'WHERE aq.status = ?' : ''}
            ORDER BY aq.created_at DESC
        `).all(...(status !== 'all' ? [status] : []));

        return NextResponse.json(approvals);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni onay talebi oluştur (operatörden)
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { personnel_id, model_id, operation_id, photo_path } = body;

        if (!personnel_id || !model_id || !operation_id) {
            return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 });
        }

        const result = db.prepare(`
            INSERT INTO approval_queue (personnel_id, model_id, operation_id, photo_path)
            VALUES (?, ?, ?, ?)
        `).run(personnel_id, model_id, operation_id, photo_path || null);

        return NextResponse.json({ id: result.lastInsertRowid, status: 'pending' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Onay/red güncelle (yöneticiden)
export async function PUT(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { id, status, notes } = body;

        if (!id || !status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
        }

        db.prepare(`
            UPDATE approval_queue SET status = ?, reviewed_at = CURRENT_TIMESTAMP, notes = ?
            WHERE id = ?
        `).run(status, notes || '', id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
