import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Belirli bir kayıt için düzeltme geçmişini getir
export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const tableName = searchParams.get('table');
        const recordId = searchParams.get('record_id');

        // Tüm tabloların geçmişini getir (filtre yoksa)
        if (!tableName && !recordId) {
            const all = db.prepare(
                'SELECT * FROM audit_trail ORDER BY changed_at DESC LIMIT 200'
            ).all();
            return NextResponse.json(all);
        }

        if (!tableName || !recordId) {
            return NextResponse.json({ error: 'table ve record_id zorunlu' }, { status: 400 });
        }

        const history = db.prepare(
            'SELECT * FROM audit_trail WHERE table_name = ? AND record_id = ? ORDER BY changed_at DESC'
        ).all(tableName, recordId);

        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Düzeltme kaydı ekle (5 saat kuralı ile)
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { table_name, record_id, changes, changed_by, force_log } = body;

        // changes = [{ field_name, old_value, new_value }]
        // Eski format desteği (tek alan)
        const changeList = changes || [{
            field_name: body.field_name,
            old_value: body.old_value,
            new_value: body.new_value
        }];

        if (!table_name || !record_id) {
            return NextResponse.json({ error: 'table_name ve record_id zorunlu' }, { status: 400 });
        }

        // 5 SAAT KURALI: Kaydın oluşturulma zamanını kontrol et
        let withinGracePeriod = false;
        if (!force_log) {
            try {
                const record = db.prepare(
                    `SELECT created_at FROM ${table_name} WHERE id = ?`
                ).get(record_id);

                if (record && record.created_at) {
                    const createdAt = new Date(record.created_at);
                    const now = new Date();
                    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
                    withinGracePeriod = hoursDiff < 5;
                }
            } catch (e) {
                // Tablo bulunamazsa loglama yap
                withinGracePeriod = false;
            }
        }

        let loggedCount = 0;

        if (!withinGracePeriod) {
            // 5 saatten sonra: TÜM değişiklikleri kaydet
            const ins = db.prepare(
                'INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)'
            );

            for (const change of changeList) {
                if (change.old_value !== change.new_value) {
                    ins.run(
                        table_name,
                        record_id,
                        change.field_name,
                        String(change.old_value ?? ''),
                        String(change.new_value ?? ''),
                        changed_by || 'admin'
                    );
                    loggedCount++;
                }
            }
        }

        return NextResponse.json({
            logged: loggedCount,
            within_grace_period: withinGracePeriod,
            message: withinGracePeriod
                ? 'İlk 5 saat içinde — düzeltme kaydedilmedi (normal kurulum süresi)'
                : `${loggedCount} düzeltme kaydedildi`
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
