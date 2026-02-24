import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Tüm personeli getir
export async function GET() {
    try {
        const db = getDb();
        const personnel = db.prepare('SELECT * FROM personnel ORDER BY name').all();
        return NextResponse.json(personnel);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni personel ekle
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { name, role, daily_wage, skill_level, machines, skills, language, work_start, work_end, start_date,
            base_salary, transport_allowance, ssk_cost, food_allowance, compensation,
            technical_mastery, speed_level, quality_level, discipline_level, versatility_level, position, department } = body;

        if (!name) {
            return NextResponse.json({ error: 'Personel adı zorunlu' }, { status: 400 });
        }

        // Günlük ücret hesapla: Toplam aylık maliyet / Aylık çalışma günü
        let calculatedDailyWage = daily_wage || 0;
        const totalMonthly = (base_salary || 0) + (transport_allowance || 0) + (ssk_cost || 0) + (food_allowance || 0) + (compensation || 0);
        if (totalMonthly > 0) {
            const now = new Date();
            const monthRow = db.prepare('SELECT work_days FROM monthly_work_days WHERE year = ? AND month = ?').get(now.getFullYear(), now.getMonth() + 1);
            const workDays = monthRow?.work_days || 22;
            calculatedDailyWage = Math.round((totalMonthly / workDays) * 100) / 100;
        }

        const result = db.prepare(`
      INSERT INTO personnel (name, role, daily_wage, skill_level, machines, skills, language, work_start, work_end, start_date,
        base_salary, transport_allowance, ssk_cost, food_allowance, compensation,
        technical_mastery, speed_level, quality_level, discipline_level, versatility_level, position, department)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            name, role || 'duz_makineci', calculatedDailyWage,
            skill_level || 'orta', machines || '', skills || '',
            language || 'tr', work_start || '08:00', work_end || '19:00',
            start_date || new Date().toISOString().split('T')[0],
            base_salary || 0, transport_allowance || 0, ssk_cost || 0,
            food_allowance || 0, compensation || 0,
            technical_mastery || 'operator', speed_level || 'normal',
            quality_level || 'standart', discipline_level || 'guvenilir',
            versatility_level || '1-2', position || role || 'duz_makineci', department || ''
        );

        const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(person, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
