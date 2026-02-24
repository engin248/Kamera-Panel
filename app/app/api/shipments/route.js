import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const shipments = db.prepare(`
      SELECT s.*, m.name as model_name, m.code as model_code, c.name as customer_name
      FROM shipments s
      JOIN models m ON s.model_id = m.id
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
    `).all();
        return NextResponse.json(shipments);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { model_id, customer_id, quantity, shipment_date, tracking_no, cargo_company, destination, notes, status } = body;
        if (!model_id || !quantity) return NextResponse.json({ error: 'Model ve adet zorunlu' }, { status: 400 });
        const result = db.prepare(`
      INSERT INTO shipments (model_id, customer_id, quantity, shipment_date, tracking_no, cargo_company, destination, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(model_id, customer_id || null, quantity, shipment_date || '', tracking_no || '', cargo_company || '', destination || '', notes || '', status || 'hazirlaniyor');
        const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(shipment, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
