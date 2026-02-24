import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');
        let query = `SELECT qc.*, m.name as model_name, m.code as model_code FROM quality_checks qc LEFT JOIN models m ON qc.model_id = m.id`;
        const params = [];
        if (model_id) { query += ' WHERE qc.model_id = ?'; params.push(model_id); }
        query += ' ORDER BY qc.checked_at DESC';
        const checks = db.prepare(query).all(...params);
        return NextResponse.json(checks);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { production_log_id, model_id, operation_id, personnel_id, check_type, check_number, result, defect_type, photo_path, notes, checked_by } = body;
        if (!result) {
            return NextResponse.json({ error: 'Kontrol sonucu zorunlu' }, { status: 400 });
        }
        const r = db.prepare(`
      INSERT INTO quality_checks (production_log_id, model_id, operation_id, personnel_id, check_type, check_number, result, defect_type, photo_path, notes, checked_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(production_log_id || null, model_id || null, operation_id || null, personnel_id || null, check_type || 'inline', check_number || 1, result, defect_type || '', photo_path || '', notes || '', checked_by || '');
        const check = db.prepare('SELECT * FROM quality_checks WHERE id = ?').get(r.lastInsertRowid);
        return NextResponse.json(check, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
