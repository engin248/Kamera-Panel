import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

function ensureTable(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS personel_saat_kayitlari (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            personel_id INTEGER NOT NULL,
            tarih DATE NOT NULL,
            giris_saat TEXT,
            cikis_saat TEXT,
            net_calisma_dakika INTEGER DEFAULT 0,
            mesai_dakika INTEGER DEFAULT 0,
            gec_kalma_dakika INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (personel_id) REFERENCES personnel(id)
        );
    `);
}

function hesaplaMola(dakika) {
    if (dakika <= 120) return 0;
    if (dakika <= 240) return 15;
    return 30;
}

export async function GET(request) {
    try {
        const db = getDb();
        ensureTable(db);
        const { searchParams } = new URL(request.url);
        const tarih = searchParams.get('tarih') || new Date().toISOString().split('T')[0];

        const rows = db.prepare(`
            SELECT psk.*, p.name as personel_adi, p.role as gorev
            FROM personel_saat_kayitlari psk
            JOIN personnel p ON p.id = psk.personel_id
            WHERE psk.tarih = ?
            ORDER BY psk.personel_id
        `).all(tarih);

        const tumPersonel = db.prepare(
            "SELECT id, name, role FROM personnel WHERE deleted_at IS NULL ORDER BY name"
        ).all();

        return NextResponse.json({ kayitlar: rows, personel: tumPersonel });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        ensureTable(db);
        const { personel_id, tip } = await request.json();
        const simdi = new Date();
        const tarih = simdi.toISOString().split('T')[0];
        const saat = simdi.toTimeString().split(' ')[0].substring(0, 5);

        const mevcut = db.prepare(
            'SELECT * FROM personel_saat_kayitlari WHERE personel_id=? AND tarih=?'
        ).get(personel_id, tarih);

        if (tip === 'giris') {
            if (mevcut) {
                db.prepare('UPDATE personel_saat_kayitlari SET giris_saat=? WHERE id=?')
                    .run(saat, mevcut.id);
            } else {
                db.prepare(
                    'INSERT INTO personel_saat_kayitlari (personel_id, tarih, giris_saat) VALUES (?,?,?)'
                ).run(personel_id, tarih, saat);
            }
        } else if (tip === 'cikis' && mevcut?.giris_saat) {
            const [gh, gm] = mevcut.giris_saat.split(':').map(Number);
            const [ch, cm] = saat.split(':').map(Number);
            const toplamDk = (ch * 60 + cm) - (gh * 60 + gm);
            const molaDk = hesaplaMola(toplamDk);
            const netDk = Math.max(0, toplamDk - molaDk);
            const mesaiDk = Math.max(0, (gh * 60 + gm + netDk) - (17 * 60 + 30));
            const gecDk = Math.max(0, (gh * 60 + gm) - (8 * 60));

            db.prepare(`
                UPDATE personel_saat_kayitlari 
                SET cikis_saat=?, net_calisma_dakika=?, mesai_dakika=?, gec_kalma_dakika=?
                WHERE id=?
            `).run(saat, netDk, mesaiDk, gecDk, mevcut.id);
        }

        return NextResponse.json({ success: true, saat });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
