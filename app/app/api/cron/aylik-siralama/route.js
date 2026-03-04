/**
 * app/app/api/cron/aylik-siralama/route.js
 *
 * CRON ENDPOINT — Manuel veya otomatik tetikleme için
 * ====================================================
 * GET  → Bu ayın sıralamasını kaydet
 * POST → Belirli bir ay/yıl için kaydet (body: {ay, yil})
 *
 * Güvenlik: X-Cron-Secret header kontrolü
 * Cron Key: .env.local'da CRON_SECRET olarak saklanır
 */

import { NextResponse } from 'next/server';
import { aylikSiralamayiKaydet, eksikAyiTamamla } from '@/lib/otomatik-siralama';

const CRON_SECRET = process.env.CRON_SECRET || 'kamera-panel-cron-2026';

function yetkiKontrol(request) {
    const header = request.headers.get('x-cron-secret') || request.headers.get('authorization');
    if (!header) return false;
    const token = header.replace('Bearer ', '');
    return token === CRON_SECRET;
}

// GET — Bu ayı güncelle (Vercel Cron veya otomatik çağrı)
export async function GET(request) {
    if (!yetkiKontrol(request)) {
        return NextResponse.json({ hata: 'Yetkisiz erişim' }, { status: 401 });
    }

    const bugun = new Date();
    const ay = bugun.getMonth() + 1;
    const yil = bugun.getFullYear();

    const sonuc = await aylikSiralamayiKaydet(ay, yil);
    return NextResponse.json({ ...sonuc, ay, yil });
}

// POST — Belirli ay/yıl için kaydet veya eksik ayı tamamla
export async function POST(request) {
    if (!yetkiKontrol(request)) {
        return NextResponse.json({ hata: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const { ay, yil, eksik_ay_kontrol } = body;

        if (eksik_ay_kontrol) {
            await eksikAyiTamamla();
            return NextResponse.json({ basari: true, mesaj: 'Eksik ay kontrolü tamamlandı' });
        }

        if (!ay || !yil) {
            // Cari ay
            const bugun = new Date();
            const sonuc = await aylikSiralamayiKaydet(bugun.getMonth() + 1, bugun.getFullYear());
            return NextResponse.json(sonuc);
        }

        const sonuc = await aylikSiralamayiKaydet(parseInt(ay), parseInt(yil));
        return NextResponse.json(sonuc);
    } catch (err) {
        return NextResponse.json({ basari: false, neden: err.message }, { status: 500 });
    }
}
