import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const d = new Date();
        const haftaBaslangic = searchParams.get('baslangic') || new Date(d.setDate(d.getDate() - d.getDay() + 1)).toISOString().split('T')[0];
        const haftaSonu = new Date(new Date(haftaBaslangic).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const kayitlar = db.prepare(`
      SELECT psk.personel_id, p.name as ad, p.daily_wage,
        SUM(psk.net_calisma_dakika) as toplam_dk,
        SUM(psk.mesai_dakika) as mesai_dk,
        COUNT(psk.id) as gun_sayisi
      FROM personel_saat_kayitlari psk
      JOIN personnel p ON p.id = psk.personel_id
      WHERE psk.tarih BETWEEN ? AND ?
      GROUP BY psk.personel_id ORDER BY p.name
    `).all(haftaBaslangic, haftaSonu);
        const sonuc = kayitlar.map(k => {
            const saatlik = (k.daily_wage || 0) / 8;
            const normal = (k.toplam_dk || 0) / 60;
            const mesai = (k.mesai_dk || 0) / 60;
            return { ...k, saatlik_ucret: saatlik.toFixed(2), normal_saat: normal.toFixed(1), mesai_saat: mesai.toFixed(1), net_maas: (normal * saatlik + mesai * saatlik * 1.5).toFixed(2) };
        });
        return NextResponse.json({ baslangic: haftaBaslangic, bitis: haftaSonu, personel: sonuc });
    } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
