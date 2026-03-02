import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const modelId = searchParams.get('model_id');
        const limit = searchParams.get('limit') || 30;
        let rows;
        if (modelId) {
            rows = db.prepare(`SELECT ak.*, p.name as kontrol_eden_adi FROM ara_kontrol ak LEFT JOIN personnel p ON ak.kontrol_eden_id = p.id WHERE ak.model_id = ? ORDER BY ak.created_at DESC LIMIT ?`).all(modelId, limit);
        } else {
            rows = db.prepare(`SELECT ak.*, p.name as kontrol_eden_adi FROM ara_kontrol ak LEFT JOIN personnel p ON ak.kontrol_eden_id = p.id ORDER BY ak.created_at DESC LIMIT ?`).all(limit);
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
            parti_id, model_id, kontrol_eden_id, istasyon,
            sira_no, beden, adet, hatali, foto_url,
            numune_foto_url, ai_uyum_skoru, onay, ret_nedeni, notlar
        } = body;

        const result = db.prepare(`
      INSERT INTO ara_kontrol (
        parti_id, model_id, kontrol_eden_id, istasyon,
        sira_no, beden, adet, hatali, foto_url,
        numune_foto_url, ai_uyum_skoru, onay, ret_nedeni, notlar, tarih
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,DATE('now'))
    `).run(
            parti_id || null, model_id || null, kontrol_eden_id || null,
            istasyon || 'Dikim', sira_no || null, beden || '',
            adet || 0, hatali || 0, foto_url || '',
            numune_foto_url || '', ai_uyum_skoru || null,
            onay ? 1 : 0, ret_nedeni || '', notlar || ''
        );

        return Response.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
