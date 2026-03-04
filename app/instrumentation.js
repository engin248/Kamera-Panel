/**
 * instrumentation.js
 *
 * Next.js Sunucu Startup — Otomatik Cron Sistemi
 * =============================================
 * Sunucu başladığında çalışır.
 * Her gece 23:30'da bu ayın sıralamasını günceller.
 * Her ay 1'inde 01:00'de eksik ay kontrolü yapar.
 *
 * NOT: Bu dosya proje kökünde (app/) olmalıdır.
 */

export async function register() {
    // Sadece server tarafında çalış
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('[Instrumentation] Otomatik sıralama sistemi başlatılıyor...');

        // node-cron dinamik import (server-only)
        try {
            const cron = await import('node-cron');
            const { aylikSiralamayiKaydet, eksikAyiTamamla } = await import('./lib/otomatik-siralama.js');

            // ── GÜNLÜK GÜNCELLEME: Her gece 23:30 ──
            // Bu ayın sıralamasını günceller
            cron.default.schedule('30 23 * * *', async () => {
                const bugun = new Date();
                const ay = bugun.getMonth() + 1;
                const yil = bugun.getFullYear();
                console.log(`[CronJob] 23:30 çalıştı — ${ay}/${yil} sıralaması güncelleniyor`);
                await aylikSiralamayiKaydet(ay, yil);
            }, { timezone: 'Europe/Istanbul' });

            // ── AYLIK KONTROL: Her ayın 1'i saat 01:00 ──
            // Önceki ayın sıralaması kaydedilmemişse tamamlar
            cron.default.schedule('0 1 1 * *', async () => {
                console.log('[CronJob] Yeni ay başladı — eksik ay kontrolü yapılıyor');
                await eksikAyiTamamla();
            }, { timezone: 'Europe/Istanbul' });

            // ── BAŞLANGIS KONTROLÜ ──
            // Sunucu başladığında eksik ay var mı kontrol et
            setTimeout(async () => {
                try {
                    console.log('[Instrumentation] Başlangıç eksik ay kontrolü...');
                    await eksikAyiTamamla();
                } catch (err) {
                    console.error('[Instrumentation] Başlangıç kontrolü hatası:', err.message);
                }
            }, 5000); // 5 saniye sonra (DB bağlantısı hazır olsun)

            console.log('[Instrumentation] Cron joblar aktif: 23:30 günlük + Ayın 1i 01:00 aylık kontrol');

        } catch (err) {
            // node-cron yüklü değilse uyar ama çökmesini engelle
            console.warn('[Instrumentation] node-cron yüklenemedi:', err.message);
            console.warn('[Instrumentation] Otomatik sıralama devre dışı. "npm install node-cron" ile etkinleştirin.');
        }
    }
}
