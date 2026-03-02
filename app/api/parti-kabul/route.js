import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const modelId = searchParams.get('model_id');
        let rows;
        if (modelId) {
            rows = db.prepare(`SELECT pk.*, m.name as model_adi FROM parti_kabul pk LEFT JOIN models m ON pk.model_id = m.id WHERE pk.model_id = ? AND pk.deleted_at IS NULL ORDER BY pk.created_at DESC`).all(modelId);
        } else {
            rows = db.prepare(`SELECT pk.*, m.name as model_adi FROM parti_kabul pk LEFT JOIN models m ON pk.model_id = m.id WHERE pk.deleted_at IS NULL ORDER BY pk.created_at DESC LIMIT 50`).all();
        }
        return Response.json(rows);
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const {
            model_id, firma_adi, getiren_personel_id, kabul_eden_id,
            gelis_tarihi, arac_plaka, tasima_tipi, toplam_adet,
            beden_listesi, parca_listesi, parca_eksik, parca_eksik_not,
            beden_eksik, beden_eksik_not, dugme_var, dugme_adet,
            fermuar_var, fermuar_tip, etiket_geldi, yikama_talimati_geldi,
            hang_tag_geldi, aksesuar_not, kabul_durum, foto_url, notlar
        } = body;

        if (!firma_adi) return Response.json({ error: 'Firma adı zorunlu' }, { status: 400 });

        const result = db.prepare(`
      INSERT INTO parti_kabul (
        model_id, firma_adi, getiren_personel_id, kabul_eden_id,
        gelis_tarihi, arac_plaka, tasima_tipi, toplam_adet,
        beden_listesi, parca_listesi, parca_eksik, parca_eksik_not,
        beden_eksik, beden_eksik_not, dugme_var, dugme_adet,
        fermuar_var, fermuar_tip, etiket_geldi, yikama_talimati_geldi,
        hang_tag_geldi, aksesuar_not, kabul_durum, foto_url, notlar
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
            model_id || null, firma_adi, getiren_personel_id || null, kabul_eden_id || null,
            gelis_tarihi || new Date().toISOString(), arac_plaka || '', tasima_tipi || 'kendi_araci',
            toplam_adet || 0, JSON.stringify(beden_listesi || []), JSON.stringify(parca_listesi || []),
            parca_eksik ? 1 : 0, parca_eksik_not || '', beden_eksik ? 1 : 0, beden_eksik_not || '',
            dugme_var ? 1 : 0, dugme_adet || 0, fermuar_var ? 1 : 0, fermuar_tip || '',
            etiket_geldi ? 1 : 0, yikama_talimati_geldi ? 1 : 0, hang_tag_geldi ? 1 : 0,
            aksesuar_not || '', kabul_durum || 'tam', foto_url || '', notlar || ''
        );

        return Response.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'id zorunlu' }, { status: 400 });
        db.prepare(`UPDATE parti_kabul SET deleted_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
        return Response.json({ success: true });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
