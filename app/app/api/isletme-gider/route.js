import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

function ensureTable(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS isletme_giderleri (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ay INTEGER NOT NULL,
            yil INTEGER NOT NULL,
            elektrik REAL DEFAULT 0,
            su REAL DEFAULT 0,
            kira REAL DEFAULT 0,
            yakit REAL DEFAULT 0,
            diger REAL DEFAULT 0,
            toplam_calisma_saati REAL DEFAULT 0,
            toplam_personel_maliyeti REAL DEFAULT 0,
            saatlik_maliyet REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ay, yil)
        );
    `);
}

export async function GET(request) {
    try {
        const db = getDb();
        ensureTable(db);
        const { searchParams } = new URL(request.url);
        const ay = searchParams.get('ay');
        const yil = searchParams.get('yil');

        if (ay && yil) {
            const row = db.prepare('SELECT * FROM isletme_giderleri WHERE ay=? AND yil=?').get(ay, yil);
            return NextResponse.json(row || {});
        }

        const rows = db.prepare('SELECT * FROM isletme_giderleri ORDER BY yil DESC, ay DESC LIMIT 12').all();
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        ensureTable(db);
        const body = await request.json();
        const { ay, yil, elektrik, su, kira, yakit, diger, toplam_calisma_saati, toplam_personel_maliyeti } = body;

        if (!ay || !yil) return NextResponse.json({ error: 'Ay ve yıl gerekli' }, { status: 400 });

        const toplamGider = (elektrik || 0) + (su || 0) + (kira || 0) + (yakit || 0) + (diger || 0) + (toplam_personel_maliyeti || 0);
        const saatlik = toplam_calisma_saati > 0 ? toplamGider / toplam_calisma_saati : 0;

        db.prepare(`
            INSERT INTO isletme_giderleri 
            (ay, yil, elektrik, su, kira, yakit, diger, toplam_calisma_saati, toplam_personel_maliyeti, saatlik_maliyet)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(ay, yil) DO UPDATE SET
            elektrik=excluded.elektrik, su=excluded.su, kira=excluded.kira,
            yakit=excluded.yakit, diger=excluded.diger,
            toplam_calisma_saati=excluded.toplam_calisma_saati,
            toplam_personel_maliyeti=excluded.toplam_personel_maliyeti,
            saatlik_maliyet=excluded.saatlik_maliyet
        `).run(ay, yil, elektrik || 0, su || 0, kira || 0, yakit || 0, diger || 0,
            toplam_calisma_saati || 0, toplam_personel_maliyeti || 0, saatlik);

        return NextResponse.json({ success: true, saatlik_maliyet: saatlik.toFixed(2) });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
