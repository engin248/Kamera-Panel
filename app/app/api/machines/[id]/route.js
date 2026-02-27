import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        // 1. Önce mevcut kaydı al (audit trail için)
        const oldMachine = db.prepare('SELECT * FROM machines WHERE id = ?').get(id);
        if (!oldMachine) {
            return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 });
        }

        const { name, type, brand, model_name, serial_no, location, notes, status, count, changed_by } = body;

        // 2. Güncellemeyi yap
        db.prepare(`UPDATE machines SET
      name = COALESCE(?, name), type = COALESCE(?, type), brand = COALESCE(?, brand),
      model_name = COALESCE(?, model_name), serial_no = COALESCE(?, serial_no),
      location = COALESCE(?, location), notes = COALESCE(?, notes), status = COALESCE(?, status),
      count = COALESCE(?, count) WHERE id = ?
    `).run(name, type, brand, model_name, serial_no, location, notes, status, count ? parseInt(count) : null, id);

        // 3. Değişen alanları audit_trail'e kaydet (SİLİNEMEZ)
        const auditInsert = db.prepare(
            'INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)'
        );

        const fieldLabels = {
            name: 'Makine Adı', type: 'Tip', brand: 'Marka',
            model_name: 'Model', serial_no: 'Seri No', location: 'Konum',
            notes: 'Notlar', status: 'Durum', count: 'Adet'
        };

        const auditTransaction = db.transaction(() => {
            for (const [field, label] of Object.entries(fieldLabels)) {
                const newVal = body[field];
                if (newVal !== undefined && newVal !== null) {
                    const oldVal = String(oldMachine[field] || '');
                    const newValStr = String(newVal);
                    if (oldVal !== newValStr) {
                        auditInsert.run('machines', String(id), label, oldVal, newValStr, changed_by || 'admin');
                    }
                }
            }
        });
        auditTransaction();

        const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(id);
        return NextResponse.json(machine);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const machine = db.prepare('SELECT * FROM machines WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!machine) return NextResponse.json({ error: 'Makina bulunamadı' }, { status: 404 });

        db.prepare("UPDATE machines SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ?").run('Koordinatör', id);
        db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)')
            .run('machines', String(id), 'SOFT-DELETE', `${machine.name} (${machine.type})`, 'SİLİNDİ (geri alınabilir)', 'Koordinatör');
        try { db.prepare('INSERT INTO activity_log (user_name, action, table_name, record_id, record_summary) VALUES (?, ?, ?, ?, ?)').run('Koordinatör', 'SOFT_DELETE', 'machines', id, `${machine.name} soft-delete`); } catch (e) { }

        return NextResponse.json({ success: true, message: 'Makina silindi (geri alınabilir)' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
