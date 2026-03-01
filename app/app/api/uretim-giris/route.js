import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

function ensureTables(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS uretim_girisleri (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id INTEGER NOT NULL,
            getiren_personel_id INTEGER,
            getirilme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
            acilis_tarihi DATETIME,
            acan_personel_id INTEGER,
            beden_eksik INTEGER DEFAULT 0,
            beden_eksik_detay TEXT DEFAULT '',
            aksesuar_eksik INTEGER DEFAULT 0,
            aksesuar_eksik_detay TEXT DEFAULT '',
            kumas_eksik INTEGER DEFAULT 0,
            kumas_eksik_detay TEXT DEFAULT '',
            numune_ayrildi INTEGER DEFAULT 0,
            parca_sayisi INTEGER DEFAULT 0,
            durum TEXT DEFAULT 'beklemede',
            notlar TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (model_id) REFERENCES models(id)
        );
        CREATE TABLE IF NOT EXISTS uretim_giris_parcalar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            giris_id INTEGER NOT NULL,
            parca_adi TEXT NOT NULL,
            fotograf_url TEXT DEFAULT '',
            FOREIGN KEY (giris_id) REFERENCES uretim_girisleri(id)
        );
    `);
}

export async function GET() {
    try {
        const db = getDb();
        ensureTables(db);
        const rows = db.prepare(`
            SELECT ug.*, 
                m.name as model_adi, m.code as model_kodu,
                p1.name as getiren_adi,
                p2.name as acan_adi
            FROM uretim_girisleri ug
            LEFT JOIN models m ON m.id = ug.model_id
            LEFT JOIN personnel p1 ON p1.id = ug.getiren_personel_id
            LEFT JOIN personnel p2 ON p2.id = ug.acan_personel_id
            ORDER BY ug.created_at DESC
        `).all();
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        ensureTables(db);
        const body = await request.json();
        const {
            model_id, getiren_personel_id, acilis_tarihi, acan_personel_id,
            beden_eksik, beden_eksik_detay, aksesuar_eksik, aksesuar_eksik_detay,
            kumas_eksik, kumas_eksik_detay, numune_ayrildi, parca_sayisi,
            notlar, parcalar
        } = body;

        if (!model_id) return NextResponse.json({ error: 'Model seçilmedi' }, { status: 400 });

        const result = db.prepare(`
            INSERT INTO uretim_girisleri 
            (model_id, getiren_personel_id, acilis_tarihi, acan_personel_id,
             beden_eksik, beden_eksik_detay, aksesuar_eksik, aksesuar_eksik_detay,
             kumas_eksik, kumas_eksik_detay, numune_ayrildi, parca_sayisi, notlar)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
            model_id, getiren_personel_id || null, acilis_tarihi || null, acan_personel_id || null,
            beden_eksik ? 1 : 0, beden_eksik_detay || '',
            aksesuar_eksik ? 1 : 0, aksesuar_eksik_detay || '',
            kumas_eksik ? 1 : 0, kumas_eksik_detay || '',
            numune_ayrildi ? 1 : 0, parca_sayisi || 0, notlar || ''
        );

        const girisId = result.lastInsertRowid;

        if (parcalar && Array.isArray(parcalar)) {
            const pStmt = db.prepare(
                'INSERT INTO uretim_giris_parcalar (giris_id, parca_adi, fotograf_url) VALUES (?,?,?)'
            );
            parcalar.forEach(p => pStmt.run(girisId, p.parca_adi || '', p.fotograf_url || ''));
        }

        return NextResponse.json({ success: true, id: girisId }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { id, durum, ...rest } = body;
        if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
        db.prepare('UPDATE uretim_girisleri SET durum=? WHERE id=?').run(durum || 'tamamlandi', id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
