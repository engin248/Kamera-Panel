import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(request) {
    try {
        const db = getDb();
        const { model_id, kar_marji_yuzde = 20, ek_malzeme_tl = 0, nakliye_tl = 0, toplam_adet = 1 } = await request.json();
        // GN015 validasyon
        if (toplam_adet <= 0) return NextResponse.json({ error: 'toplam_adet sıfırdan büyük olmalı' }, { status: 400 });
        if (kar_marji_yuzde < -100) return NextResponse.json({ error: 'Geçersiz kâr marjı' }, { status: 400 });
        const db2 = db;
        const gider = db2.prepare('SELECT saatlik_maliyet FROM isletme_giderleri ORDER BY yil DESC, ay DESC LIMIT 1').get();
        const saatlik_maliyet = gider?.saatlik_maliyet || 0;
        const sureler = model_id ? db.prepare("SELECT COALESCE(SUM(COALESCE(standard_time_max,standard_time_min,0)),0) as toplam FROM operations WHERE model_id=?").get(model_id) : { toplam: 0 };
        const tahmini_sure_saat = (sureler?.toplam || 0) / 3600;
        const iscilik = saatlik_maliyet * tahmini_sure_saat;
        const maliyet_alt = iscilik + ek_malzeme_tl + nakliye_tl;
        const fason_fiyat = maliyet_alt * (1 + kar_marji_yuzde / 100);
        const birim_fiyat = toplam_adet > 0 ? fason_fiyat / toplam_adet : fason_fiyat;
        const kar_zarar_sinyal = kar_marji_yuzde >= 20 ? 'karli' : kar_marji_yuzde >= 10 ? 'riskli' : 'zararlı';
        return NextResponse.json({ saatlik_maliyet: saatlik_maliyet.toFixed(2), tahmini_sure_saat: tahmini_sure_saat.toFixed(2), maliyet_alt: maliyet_alt.toFixed(2), fason_fiyat: fason_fiyat.toFixed(2), birim_fiyat: birim_fiyat.toFixed(2), kar_zarar_sinyal });
    } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
