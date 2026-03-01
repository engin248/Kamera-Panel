import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

/**
 * POST /api/voice-command
 * Sesli komuttan parse edilmiş veriyi alır, production_logs'a kaydeder.
 *
 * Body: {
 *   transcript: string,       // Ham ses → yazı metni
 *   parsed: {                 // Frontend'de parse edilmiş veri
 *     personnel_id: number,
 *     model_id: number,
 *     operation_id: number,
 *     size: string,
 *     color: string,
 *     action: 'start' | 'complete',
 *     total_produced: number  // Sadece complete'de
 *   }
 * }
 */
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { transcript, parsed } = body;

        if (!parsed || !parsed.personnel_id || !parsed.model_id || !parsed.operation_id) {
            return NextResponse.json({
                error: 'Personel, model veya işlem tanımlanamadı. Lütfen tekrar söyleyin.',
                transcript
            }, { status: 400 });
        }

        const now = new Date().toISOString();

        if (parsed.action === 'start') {
            // Başlangıç kaydı — end_time yok, status = 'in_progress'
            const result = db.prepare(`
                INSERT INTO production_logs (
                    model_id, operation_id, personnel_id,
                    start_time, status, notes
                ) VALUES (?, ?, ?, ?, 'in_progress', ?)
            `).run(
                parsed.model_id,
                parsed.operation_id,
                parsed.personnel_id,
                now,
                `Sesli komut: "${transcript}"`
            );

            const log = db.prepare(`
                SELECT pl.*, m.name as model_name, m.code as model_code,
                       o.name as operation_name, p.name as personnel_name
                FROM production_logs pl
                JOIN models m ON pl.model_id = m.id
                JOIN operations o ON pl.operation_id = o.id
                JOIN personnel p ON pl.personnel_id = p.id
                WHERE pl.id = ?
            `).get(result.lastInsertRowid);

            return NextResponse.json({
                success: true,
                action: 'started',
                log_id: result.lastInsertRowid,
                message: `✅ Kayıt başlatıldı: ${log.personnel_name} — ${log.operation_name}`,
                log
            }, { status: 201 });
        }

        if (parsed.action === 'complete') {
            // Tamamlama — en son 'in_progress' kaydı bul ve güncelle
            const activeLog = db.prepare(`
                SELECT id, start_time FROM production_logs
                WHERE personnel_id = ? AND operation_id = ? AND model_id = ?
                  AND status = 'in_progress' AND deleted_at IS NULL
                ORDER BY start_time DESC LIMIT 1
            `).get(parsed.personnel_id, parsed.operation_id, parsed.model_id);

            if (!activeLog) {
                return NextResponse.json({
                    error: 'Aktif kayıt bulunamadı. Önce "başladım" komutunu verin.',
                    transcript
                }, { status: 404 });
            }

            const tp = parsed.total_produced || 0;
            const fpy = tp > 0 ? 100 : 0;

            // Birim fiyat hesapla
            let unitVal = 0;
            try {
                const op = db.prepare('SELECT unit_price FROM operations WHERE id = ?').get(parsed.operation_id);
                if (op) unitVal = (op.unit_price || 0) * tp;
            } catch (e) { }

            // Net çalışma süresi
            const totalMin = (new Date(now) - new Date(activeLog.start_time)) / 60000;
            const netWork = Math.round(Math.max(0, totalMin) * 10) / 10;

            db.prepare(`
                UPDATE production_logs SET
                    end_time = ?, total_produced = ?, status = 'completed',
                    first_pass_yield = ?, unit_value = ?, net_work_minutes = ?,
                    notes = notes || ?
                WHERE id = ?
            `).run(
                now, tp, fpy, unitVal, netWork,
                ` | Tamamlama: "${transcript}"`,
                activeLog.id
            );

            const log = db.prepare(`
                SELECT pl.*, m.name as model_name, m.code as model_code,
                       o.name as operation_name, p.name as personnel_name
                FROM production_logs pl
                JOIN models m ON pl.model_id = m.id
                JOIN operations o ON pl.operation_id = o.id
                JOIN personnel p ON pl.personnel_id = p.id
                WHERE pl.id = ?
            `).get(activeLog.id);

            return NextResponse.json({
                success: true,
                action: 'completed',
                log_id: activeLog.id,
                message: `✅ Tamamlandı: ${log.personnel_name} — ${tp} adet — ${log.operation_name}`,
                log
            });
        }

        return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET /api/voice-command/personnel
 * Sesli komut için personel, model ve işlem listelerini döner
 */
export async function GET() {
    try {
        const db = getDb();
        const personnel = db.prepare(
            'SELECT id, name, role FROM personnel WHERE deleted_at IS NULL ORDER BY name'
        ).all();
        const models = db.prepare(
            'SELECT id, name, code FROM models WHERE deleted_at IS NULL ORDER BY code'
        ).all();
        const operations = db.prepare(
            'SELECT id, name, machine_type FROM operations WHERE deleted_at IS NULL ORDER BY name'
        ).all();

        return NextResponse.json({ personnel, models, operations });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
