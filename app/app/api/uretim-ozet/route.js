import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const tarih = searchParams.get('tarih') || new Date().toISOString().split('T')[0];

        const ozet = db.prepare(`
      SELECT 
        COUNT(*) as kayit_sayisi,
        COALESCE(SUM(total_produced),0) as toplam_uretim,
        COALESCE(SUM(defective_count),0) as toplam_hata,
        COALESCE(AVG(oee_score),0) as ort_oee,
        COALESCE(SUM(unit_value),0) as toplam_deger,
        COUNT(DISTINCT personnel_id) as aktif_personel,
        COUNT(DISTINCT model_id) as farkli_model
      FROM production_logs
      WHERE DATE(created_at) = ? AND deleted_at IS NULL
    `).get(tarih);

        const fpy = ozet.toplam_uretim > 0
            ? ((ozet.toplam_uretim - ozet.toplam_hata) / ozet.toplam_uretim * 100).toFixed(1)
            : 100;

        const hedef = 500;
        const hedef_yuzdesi = Math.min(100, (ozet.toplam_uretim / hedef * 100)).toFixed(0);

        return NextResponse.json({ ...ozet, fpy, hedef, hedef_yuzdesi, tarih });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
