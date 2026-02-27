import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        const oldCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
        if (!oldCustomer) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 });

        const { name, company, phone, email, address, tax_no, notes, status, changed_by } = body;

        db.prepare(`UPDATE customers SET
      name = COALESCE(?, name), company = COALESCE(?, company), phone = COALESCE(?, phone),
      email = COALESCE(?, email), address = COALESCE(?, address),
      tax_no = COALESCE(?, tax_no), notes = COALESCE(?, notes), status = COALESCE(?, status) WHERE id = ?
    `).run(name, company, phone, email, address, tax_no, notes, status, id);

        const auditInsert = db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)');
        const fieldLabels = { name: 'Müşteri Adı', company: 'Firma', phone: 'Telefon', email: 'E-posta', address: 'Adres', tax_no: 'Vergi No', notes: 'Notlar', status: 'Durum' };
        const auditTransaction = db.transaction(() => {
            for (const [field, label] of Object.entries(fieldLabels)) {
                const newVal = body[field];
                if (newVal !== undefined && newVal !== null) {
                    const oldVal = String(oldCustomer[field] || '');
                    const newValStr = String(newVal);
                    if (oldVal !== newValStr) auditInsert.run('customers', String(id), label, oldVal, newValStr, changed_by || 'admin');
                }
            }
        });
        auditTransaction();

        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!customer) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 });

        db.prepare("UPDATE customers SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ?").run('Koordinatör', id);
        db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)')
            .run('customers', String(id), 'SOFT-DELETE', `${customer.name} (${customer.company || ''})`, 'SİLİNDİ (geri alınabilir)', 'Koordinatör');
        try { db.prepare('INSERT INTO activity_log (user_name, action, table_name, record_id, record_summary) VALUES (?, ?, ?, ?, ?)').run('Koordinatör', 'SOFT_DELETE', 'customers', id, `${customer.name} soft-delete`); } catch (e) { }

        return NextResponse.json({ success: true, message: 'Müşteri silindi (geri alınabilir)' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
