import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Çalışma çizelgesi ve aylık çalışma günlerini getir
export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'schedule' | 'workdays'
        const year = searchParams.get('year') || new Date().getFullYear();

        if (type === 'workdays') {
            const workDays = db.prepare(
                'SELECT * FROM monthly_work_days WHERE year = ? ORDER BY month'
            ).all(year);
            return NextResponse.json(workDays);
        }

        // Default: mola çizelgesi
        const schedule = db.prepare(
            'SELECT * FROM work_schedule ORDER BY order_number'
        ).all();
        return NextResponse.json(schedule);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Aylık çalışma günü güncelle veya mola çizelgesi güncelle
export async function PUT(request) {
    try {
        const db = getDb();
        const body = await request.json();

        if (body.type === 'workdays') {
            const { year, month, work_days } = body;
            if (!year || !month || !work_days) {
                return NextResponse.json({ error: 'Yıl, ay ve çalışma günü zorunlu' }, { status: 400 });
            }
            db.prepare(
                'INSERT OR REPLACE INTO monthly_work_days (year, month, work_days) VALUES (?, ?, ?)'
            ).run(year, month, work_days);
            return NextResponse.json({ success: true });
        }

        if (body.type === 'schedule') {
            const { id, name, start_time, end_time } = body;
            if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });
            db.prepare(
                'UPDATE work_schedule SET name = ?, start_time = ?, end_time = ? WHERE id = ?'
            ).run(name, start_time, end_time, id);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Geçersiz tip' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
