import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Üretim kayıtlarını getir (filtrelenebilir)
export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const personnel_id = searchParams.get('personnel_id');

        let query = `
      SELECT pl.*,
        m.name as model_name, m.code as model_code,
        o.name as operation_name, o.order_number, o.unit_price, o.difficulty,
        p.name as personnel_name, p.role as personnel_role, p.daily_wage
      FROM production_logs pl
      JOIN models m ON pl.model_id = m.id
      JOIN operations o ON pl.operation_id = o.id
      JOIN personnel p ON pl.personnel_id = p.id
    `;
        const conditions = [];
        const params = [];

        if (date) {
            conditions.push("DATE(pl.start_time) = ?");
            params.push(date);
        } else if (from) {
            conditions.push("DATE(pl.start_time) >= ?");
            params.push(from);
            if (to) {
                conditions.push("DATE(pl.start_time) <= ?");
                params.push(to);
            }
        }
        if (personnel_id) {
            conditions.push("pl.personnel_id = ?");
            params.push(personnel_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY pl.start_time DESC';

        const logs = db.prepare(query).all(...params);
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni üretim kaydı ekle
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const {
            model_id, operation_id, personnel_id,
            start_time, end_time,
            total_produced, defective_count, defect_reason, defect_source,
            break_duration_min, machine_down_min, material_wait_min, passive_time_min,
            quality_score, lot_change, status
        } = body;

        if (!model_id || !operation_id || !personnel_id || !start_time) {
            return NextResponse.json({ error: 'Model, işlem, personel ve başlangıç saati zorunlu' }, { status: 400 });
        }

        const result = db.prepare(`
      INSERT INTO production_logs (
        model_id, operation_id, personnel_id,
        start_time, end_time,
        total_produced, defective_count, defect_reason, defect_source,
        break_duration_min, machine_down_min, material_wait_min, passive_time_min,
        quality_score, lot_change, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            model_id, operation_id, personnel_id,
            start_time, end_time || null,
            total_produced || 0, defective_count || 0, defect_reason || '', defect_source || 'operator',
            break_duration_min || 0, machine_down_min || 0, material_wait_min || 0, passive_time_min || 0,
            quality_score || 100, lot_change || '', status || 'completed'
        );

        const log = db.prepare(`
      SELECT pl.*,
        m.name as model_name, m.code as model_code,
        o.name as operation_name, o.unit_price,
        p.name as personnel_name
      FROM production_logs pl
      JOIN models m ON pl.model_id = m.id
      JOIN operations o ON pl.operation_id = o.id
      JOIN personnel p ON pl.personnel_id = p.id
      WHERE pl.id = ?
    `).get(result.lastInsertRowid);

        // C10: Ortalama birim süre hesapla ve operations tablosuna yaz
        try {
            const avgResult = db.prepare(`
                SELECT AVG(
                    CASE WHEN total_produced > 0 THEN
                        ((julianday(end_time) - julianday(start_time)) * 86400 - COALESCE(break_duration_min,0)*60 - COALESCE(machine_down_min,0)*60 - COALESCE(material_wait_min,0)*60) / total_produced
                    ELSE NULL END
                ) as avg_time
                FROM production_logs
                WHERE operation_id = ? AND total_produced > 0 AND end_time IS NOT NULL
            `).get(operation_id);
            if (avgResult && avgResult.avg_time) {
                db.prepare('UPDATE operations SET avg_unit_time = ? WHERE id = ?').run(
                    Math.round(avgResult.avg_time * 10) / 10, operation_id
                );
            }
        } catch (e) { /* ortalama hesaplama hatası kritik değil */ }

        return NextResponse.json(log, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
