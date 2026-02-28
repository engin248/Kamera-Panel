import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');
        let query = 'SELECT * FROM cost_entries';
        const params = [];
        if (model_id) { query += ' WHERE model_id = ?'; params.push(model_id); }
        query += ' ORDER BY created_at DESC';
        const entries = db.prepare(query).all(...params);
        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { model_id, category, description, amount, unit, quantity } = body;
        if (!model_id || !category || !amount) return NextResponse.json({ error: 'Model, kategori ve tutar zorunlu' }, { status: 400 });
        const total = (parseFloat(amount) || 0) * (parseFloat(quantity) || 1);
        const result = db.prepare(`
      INSERT INTO cost_entries (model_id, category, description, amount, unit, quantity, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(model_id, category, description || '', amount, unit || '', quantity || 1, total);
        const entry = db.prepare('SELECT * FROM cost_entries WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
