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
            quality_score, lot_change, status,
            defect_photo, defect_classification, notes
        } = body;

        if (!model_id || !operation_id || !personnel_id || !start_time) {
            return NextResponse.json({ error: 'Model, işlem, personel ve başlangıç saati zorunlu' }, { status: 400 });
        }

        // Otomatik hesaplamalar
        const tp = total_produced || 0;
        const dc = defective_count || 0;
        const fpy = tp > 0 ? ((tp - dc) / tp) * 100 : 100;

        const brk = break_duration_min || 0;
        const mch = machine_down_min || 0;
        const mat = material_wait_min || 0;
        const pas = passive_time_min || 0;

        let netWork = 0;
        if (end_time && start_time) {
            const totalMin = (new Date(end_time) - new Date(start_time)) / 60000;
            netWork = Math.max(0, totalMin - brk - mch - mat - pas);
        }

        // İşlem birim fiyatı ve değer
        let unitVal = 0;
        try {
            const op = db.prepare('SELECT unit_price FROM operations WHERE id = ?').get(operation_id);
            if (op) unitVal = (op.unit_price || 0) * tp;
        } catch (e) { }

        const result = db.prepare(`
      INSERT INTO production_logs (
        model_id, operation_id, personnel_id,
        start_time, end_time,
        total_produced, defective_count, defect_reason, defect_source,
        break_duration_min, machine_down_min, material_wait_min, passive_time_min,
        quality_score, lot_change, status,
        defect_photo, defect_classification, first_pass_yield,
        oee_score, unit_value, net_work_minutes, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            model_id, operation_id, personnel_id,
            start_time, end_time || null,
            tp, dc, defect_reason || '', defect_source || 'operator',
            brk, mch, mat, pas,
            quality_score || 100, lot_change || '', status || 'completed',
            defect_photo || '', defect_classification || '', Math.round(fpy * 10) / 10,
            0, unitVal, Math.round(netWork * 10) / 10, notes || ''
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
