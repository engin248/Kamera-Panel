import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const { status, received_quantity, defective_count, quality_notes, received_date } = body;
        db.prepare(`UPDATE fason_orders SET
      status = COALESCE(?, status), received_quantity = COALESCE(?, received_quantity),
      defective_count = COALESCE(?, defective_count), quality_notes = COALESCE(?, quality_notes),
      received_date = COALESCE(?, received_date) WHERE id = ?
    `).run(status, received_quantity, defective_count, quality_notes, received_date, id);
        const order = db.prepare('SELECT * FROM fason_orders WHERE id = ?').get(id);
        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        db.prepare('DELETE FROM fason_orders WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
