import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
        return NextResponse.json(customers);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { name, company, phone, email, address, tax_no, notes } = body;
        if (!name) return NextResponse.json({ error: 'Müşteri adı zorunlu' }, { status: 400 });
        const result = db.prepare(`
      INSERT INTO customers (name, company, phone, email, address, tax_no, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, company || '', phone || '', email || '', address || '', tax_no || '', notes || '');
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
