import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        const oldShipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
        if (!oldShipment) return NextResponse.json({ error: 'Sevkiyat bulunamadı' }, { status: 404 });

        const { status, tracking_no, notes, changed_by } = body;

        db.prepare(`UPDATE shipments SET
      status = COALESCE(?, status), tracking_no = COALESCE(?, tracking_no),
      notes = COALESCE(?, notes) WHERE id = ?
    `).run(status, tracking_no, notes, id);

        const auditInsert = db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)');
        const fieldLabels = { status: 'Durum', tracking_no: 'Takip No', notes: 'Notlar' };
        const auditTransaction = db.transaction(() => {
            for (const [field, label] of Object.entries(fieldLabels)) {
                const newVal = body[field];
                if (newVal !== undefined && newVal !== null) {
                    const oldVal = String(oldShipment[field] || '');
                    const newValStr = String(newVal);
                    if (oldVal !== newValStr) auditInsert.run('shipments', String(id), label, oldVal, newValStr, changed_by || 'admin');
                }
            }
        });
        auditTransaction();

        const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
        return NextResponse.json(shipment);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
        if (shipment) {
            db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)')
                .run('shipments', String(id), 'SİLME İŞLEMİ', JSON.stringify({ tracking: shipment.tracking_no, status: shipment.status }), 'SİLİNDİ', 'admin');
        }
        db.prepare('DELETE FROM shipments WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
