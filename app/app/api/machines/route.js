import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const machines = db.prepare('SELECT * FROM machines ORDER BY created_at DESC').all();
        return NextResponse.json(machines);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { name, type, brand, model_name, serial_no, location, purchase_date, notes, count } = body;
        if (!name || !type) {
            return NextResponse.json({ error: 'Makine adı ve tipi zorunlu' }, { status: 400 });
        }
        const result = db.prepare(`
      INSERT INTO machines (name, type, brand, model_name, serial_no, location, purchase_date, notes, count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, type, brand || '', model_name || '', serial_no || '', location || '', purchase_date || '', notes || '', parseInt(count) || 1);
        const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(machine, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
