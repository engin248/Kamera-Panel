import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// ====================================================
// /api/model-operasyonlar — Model İşlem Sırası
// GET /api/model-operasyonlar?model_id=X → İşlemleri getir
// POST → Yeni işlem ekle
// DELETE → İşlem sil
// ====================================================

// Tabloyu oluştur (ilk çalıştırmada)
function ensureTable(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS model_islem_sirasi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id INTEGER NOT NULL,
            sira_no INTEGER NOT NULL,
            islem_adi TEXT NOT NULL,
            makine_tipi TEXT DEFAULT '',
            zorluk_derecesi INTEGER DEFAULT 3,
            tahmini_sure_dk INTEGER DEFAULT 0,
            nasil_yapilir TEXT DEFAULT '',
            ses_kayit_url TEXT DEFAULT '',
            video_url TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (model_id) REFERENCES models(id)
        )
    `);
}

export async function GET(request) {
    try {
        const db = getDb();
        ensureTable(db);
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');

        if (!model_id) {
            return NextResponse.json({ error: 'model_id gerekli' }, { status: 400 });
        }

        const islemler = db.prepare(`
            SELECT * FROM model_islem_sirasi 
            WHERE model_id = ? 
            ORDER BY sira_no ASC
        `).all(model_id);

        return NextResponse.json(islemler);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        ensureTable(db);
        const body = await request.json();
        const { model_id, islemler } = body;

        if (!model_id) {
            return NextResponse.json({ error: 'model_id gerekli' }, { status: 400 });
        }

        // Toplu kayıt (mevcut sırayı sil, yeniden yaz)
        if (islemler && Array.isArray(islemler)) {
            const deleteStmt = db.prepare('DELETE FROM model_islem_sirasi WHERE model_id = ?');
            const insertStmt = db.prepare(`
                INSERT INTO model_islem_sirasi 
                (model_id, sira_no, islem_adi, makine_tipi, zorluk_derecesi, tahmini_sure_dk, nasil_yapilir)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const transaction = db.transaction(() => {
                deleteStmt.run(model_id);
                islemler.forEach((islem, idx) => {
                    insertStmt.run(
                        model_id,
                        islem.sira_no || idx + 1,
                        islem.islem_adi || '',
                        islem.makine_tipi || '',
                        islem.zorluk_derecesi || 3,
                        islem.tahmini_sure_dk || 0,
                        islem.nasil_yapilir || ''
                    );
                });
            });

            transaction();
            const saved = db.prepare('SELECT * FROM model_islem_sirasi WHERE model_id = ? ORDER BY sira_no').all(model_id);
            return NextResponse.json({ success: true, islemler: saved });
        }

        // Tekil kayıt
        const { sira_no, islem_adi, makine_tipi, zorluk_derecesi, tahmini_sure_dk, nasil_yapilir } = body;
        const result = db.prepare(`
            INSERT INTO model_islem_sirasi 
            (model_id, sira_no, islem_adi, makine_tipi, zorluk_derecesi, tahmini_sure_dk, nasil_yapilir)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(model_id, sira_no, islem_adi, makine_tipi || '', zorluk_derecesi || 3, tahmini_sure_dk || 0, nasil_yapilir || '');

        return NextResponse.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const model_id = searchParams.get('model_id');

        if (id) {
            db.prepare('DELETE FROM model_islem_sirasi WHERE id = ?').run(id);
        } else if (model_id) {
            db.prepare('DELETE FROM model_islem_sirasi WHERE model_id = ?').run(model_id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
