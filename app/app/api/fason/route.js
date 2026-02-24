import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const providers = db.prepare('SELECT * FROM fason_providers ORDER BY created_at DESC').all();
        return NextResponse.json(providers);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { name, company, phone, address, speciality, notes } = body;
        if (!name) return NextResponse.json({ error: 'Fasoncu adı zorunlu' }, { status: 400 });
        const result = db.prepare(`
      INSERT INTO fason_providers (name, company, phone, address, speciality, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, company || '', phone || '', address || '', speciality || '', notes || '');
        const provider = db.prepare('SELECT * FROM fason_providers WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(provider, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
