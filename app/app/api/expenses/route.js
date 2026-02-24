import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — İşletme giderlerini getir
export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
        const month = searchParams.get('month');

        let query = 'SELECT * FROM business_expenses WHERE year = ?';
        const params = [year];
        if (month) {
            query += ' AND month = ?';
            params.push(parseInt(month));
        }
        query += ' ORDER BY month DESC, category, created_at DESC';

        const expenses = db.prepare(query).all(...params);
        return NextResponse.json(expenses);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni gider ekle
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { category, description, amount, year, month, is_recurring } = body;

        if (!category || !amount || !year || !month) {
            return NextResponse.json({ error: 'Kategori, tutar, yıl ve ay zorunlu' }, { status: 400 });
        }

        const result = db.prepare(
            'INSERT INTO business_expenses (category, description, amount, year, month, is_recurring) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(category, description || '', amount, year, month, is_recurring ? 1 : 0);

        const expense = db.prepare('SELECT * FROM business_expenses WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Gider güncelle
export async function PUT(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { id, category, description, amount, is_recurring } = body;

        if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });

        db.prepare(
            'UPDATE business_expenses SET category = COALESCE(?, category), description = COALESCE(?, description), amount = COALESCE(?, amount), is_recurring = COALESCE(?, is_recurring) WHERE id = ?'
        ).run(category, description, amount, is_recurring !== undefined ? (is_recurring ? 1 : 0) : undefined, id);

        const expense = db.prepare('SELECT * FROM business_expenses WHERE id = ?').get(id);
        return NextResponse.json(expense);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Gider sil
export async function DELETE(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });
        db.prepare('DELETE FROM business_expenses WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
