import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        // Get existing order for audit
        const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!existing) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });

        const fields = ['customer_id', 'customer_name', 'model_id', 'model_name', 'quantity', 'unit_price', 'delivery_date', 'priority', 'fabric_type', 'color', 'sizes', 'notes', 'status', 'product_image', 'model_description', 'size_distribution', 'color_details', 'accessories', 'lining_info', 'packaging', 'label_info', 'washing_instructions', 'sample_status', 'quality_criteria', 'stitch_details', 'delivery_method', 'special_requests'];

        const updates = [];
        const values = [];

        for (const f of fields) {
            if (body[f] !== undefined) {
                updates.push(`${f} = ?`);
                values.push(body[f]);

                // Audit trail for each changed field
                if (existing[f] !== body[f]) {
                    try {
                        db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)').run(
                            'orders', id, f, String(existing[f] || ''), String(body[f] || ''), body.changed_by || 'admin'
                        );
                    } catch { }
                }
            }
        }

        // Recalculate total_price
        const newQty = body.quantity !== undefined ? parseFloat(body.quantity) : existing.quantity;
        const newPrice = body.unit_price !== undefined ? parseFloat(body.unit_price) : existing.unit_price;
        updates.push('total_price = ?');
        values.push((newQty || 0) * (newPrice || 0));

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const reason = body.reason || 'Sebep belirtilmedi';
        const deletedBy = body.deleted_by || 'admin';
        const now = new Date().toISOString();

        // Sipariş var mı?
        const existing = db.prepare('SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!existing) return NextResponse.json({ error: 'Sipariş bulunamadı veya zaten arşivlendi' }, { status: 404 });

        // Soft delete — hiçbir veri silinmiyor, sadece işaretleniyor
        db.prepare('UPDATE orders SET deleted_at = ?, deleted_by = ?, delete_reason = ? WHERE id = ?')
            .run(now, deletedBy, reason, id);

        // Audit trail'e de kaydet
        try {
            db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)')
                .run('orders', id, 'deleted_at', '', now, deletedBy);
            db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)')
                .run('orders', id, 'delete_reason', '', reason, deletedBy);
        } catch { }

        return NextResponse.json({ success: true, message: 'Sipariş arşivlendi. Kalıcı olarak silinemez.' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
