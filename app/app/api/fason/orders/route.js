import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const orders = db.prepare(`
      SELECT fo.*, fp.name as provider_name, m.name as model_name, m.code as model_code
      FROM fason_orders fo
      JOIN fason_providers fp ON fo.provider_id = fp.id
      JOIN models m ON fo.model_id = m.id
      ORDER BY fo.created_at DESC
    `).all();
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { provider_id, model_id, quantity, unit_price, sent_date, expected_date, status } = body;
        if (!provider_id || !model_id || !quantity) return NextResponse.json({ error: 'Fasoncu, model ve adet zorunlu' }, { status: 400 });
        const total_price = (parseFloat(unit_price) || 0) * (parseInt(quantity) || 0);
        const result = db.prepare(`
      INSERT INTO fason_orders (provider_id, model_id, quantity, unit_price, total_price, sent_date, expected_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(provider_id, model_id, quantity, unit_price || 0, total_price, sent_date || '', expected_date || '', status || 'beklemede');
        const order = db.prepare('SELECT * FROM fason_orders WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
