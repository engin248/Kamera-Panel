import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        const oldCheck = db.prepare('SELECT * FROM quality_checks WHERE id = ?').get(id);
        if (!oldCheck) return NextResponse.json({ error: 'Kalite kontrol kaydı bulunamadı' }, { status: 404 });

        const { result, defect_type, notes, check_type, changed_by } = body;

        db.prepare(`UPDATE quality_checks SET 
            result = COALESCE(?, result), defect_type = COALESCE(?, defect_type),
            notes = COALESCE(?, notes), check_type = COALESCE(?, check_type) WHERE id = ?
        `).run(result, defect_type, notes, check_type, id);

        const auditInsert = db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)');
        const fieldLabels = { result: 'Sonuç', defect_type: 'Hata Türü', notes: 'Notlar', check_type: 'Kontrol Tipi' };
        const auditTransaction = db.transaction(() => {
            for (const [field, label] of Object.entries(fieldLabels)) {
                const newVal = body[field];
                if (newVal !== undefined && newVal !== null) {
                    const oldVal = String(oldCheck[field] || '');
                    const newValStr = String(newVal);
                    if (oldVal !== newValStr) auditInsert.run('quality_checks', String(id), label, oldVal, newValStr, changed_by || 'admin');
                }
            }
        });
        auditTransaction();

        const check = db.prepare('SELECT * FROM quality_checks WHERE id = ?').get(id);
        return NextResponse.json(check);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const check = db.prepare('SELECT * FROM quality_checks WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!check) return NextResponse.json({ error: 'Kalite kontrolü bulunamadı' }, { status: 404 });

        db.prepare("UPDATE quality_checks SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ?").run('Koordinatör', id);
        db.prepare('INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)')
            .run('quality_checks', String(id), 'SOFT-DELETE', `Sonuç: ${check.result}, Hata: ${check.defect_type || 'Yok'}`, 'SİLİNDİ (geri alınabilir)', 'Koordinatör');
        try { db.prepare('INSERT INTO activity_log (user_name, action, table_name, record_id, record_summary) VALUES (?, ?, ?, ?, ?)').run('Koordinatör', 'SOFT_DELETE', 'quality_checks', id, `Kalite #${id} soft-delete`); } catch (e) { }

        return NextResponse.json({ success: true, message: 'Kalite kontrolü silindi (geri alınabilir)' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
