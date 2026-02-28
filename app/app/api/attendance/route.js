import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');           // 2026-02-28
        const personnel_id = searchParams.get('personnel_id');
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let query = `
      SELECT a.*, p.name as personnel_name, p.role, p.daily_wage,
             p.work_start, p.work_end
      FROM attendance a
      JOIN personnel p ON a.personnel_id = p.id
      WHERE 1=1
    `;
        const params = [];

        if (date) { query += ` AND a.date = ?`; params.push(date); }
        if (personnel_id) { query += ` AND a.personnel_id = ?`; params.push(personnel_id); }
        if (year && month) {
            query += ` AND strftime('%Y', a.date) = ? AND strftime('%m', a.date) = ?`;
            params.push(String(year), String(month).padStart(2, '0'));
        }

        query += ` ORDER BY a.date DESC, p.name ASC`;

        const records = db.prepare(query).all(...params);
        return NextResponse.json(records);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const {
            personnel_id, date, clock_in, clock_out,
            status = 'present', absence_reason, notes,
            break_minutes = 0, overtime_minutes = 0
        } = body;

        if (!personnel_id || !date) {
            return NextResponse.json({ error: 'personnel_id ve date zorunlu' }, { status: 400 });
        }

        // Toplam çalışma dakikasını hesapla
        let total_work_minutes = 0;
        let late_minutes = 0;
        let early_leave_minutes = 0;

        // Personelin standart mesai saatlerini al
        const person = db.prepare('SELECT work_start, work_end FROM personnel WHERE id = ?').get(personnel_id);

        if (clock_in && clock_out) {
            const inTime = new Date(`${date}T${clock_in.includes('T') ? clock_in.split('T')[1] : clock_in}`);
            const outTime = new Date(`${date}T${clock_out.includes('T') ? clock_out.split('T')[1] : clock_out}`);
            const rawMinutes = (outTime - inTime) / 60000;
            total_work_minutes = Math.max(0, rawMinutes - break_minutes);

            // Geç kalma hesabı
            if (person?.work_start && clock_in) {
                const scheduledIn = new Date(`${date}T${person.work_start}:00`);
                const actualIn = new Date(`${date}T${clock_in.includes('T') ? clock_in.split('T')[1].substring(0, 8) : clock_in}`);
                late_minutes = Math.max(0, (actualIn - scheduledIn) / 60000);
            }

            // Erken çıkma hesabı
            if (person?.work_end && clock_out) {
                const scheduledOut = new Date(`${date}T${person.work_end}:00`);
                const actualOut = new Date(`${date}T${clock_out.includes('T') ? clock_out.split('T')[1].substring(0, 8) : clock_out}`);
                early_leave_minutes = Math.max(0, (scheduledOut - actualOut) / 60000);
                overtime_minutes = Math.max(0, (actualOut - scheduledOut) / 60000);
            }
        }

        // UPSERT — aynı gün tekrar kayıt gelirse güncelle
        const existing = db.prepare('SELECT id FROM attendance WHERE personnel_id = ? AND date = ?').get(personnel_id, date);

        if (existing) {
            db.prepare(`
        UPDATE attendance SET
          clock_in = COALESCE(?, clock_in),
          clock_out = COALESCE(?, clock_out),
          total_work_minutes = ?,
          break_minutes = ?,
          overtime_minutes = ?,
          late_minutes = ?,
          early_leave_minutes = ?,
          status = ?,
          absence_reason = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE personnel_id = ? AND date = ?
      `).run(clock_in || null, clock_out || null, total_work_minutes, break_minutes,
                overtime_minutes, late_minutes, early_leave_minutes,
                status, absence_reason || null, notes || null, personnel_id, date);

            return NextResponse.json({ success: true, action: 'updated', id: existing.id });
        } else {
            const result = db.prepare(`
        INSERT INTO attendance (personnel_id, date, clock_in, clock_out, total_work_minutes,
          break_minutes, overtime_minutes, late_minutes, early_leave_minutes,
          status, absence_reason, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(personnel_id, date, clock_in || null, clock_out || null, total_work_minutes,
                break_minutes, overtime_minutes, late_minutes, early_leave_minutes,
                status, absence_reason || null, notes || null);

            return NextResponse.json({ success: true, action: 'created', id: result.lastInsertRowid });
        }
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        db.prepare('DELETE FROM attendance WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
