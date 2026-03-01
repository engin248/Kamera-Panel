/**
 * URETIM-ANALIZ.js — 6 konuyu GPT'ye analiz ettirir
 * node URETIM-ANALIZ.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

function loadEnv() {
    const lines = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8').split('\n');
    const env = {};
    for (const line of lines) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const [k, ...v] = t.split('=');
        if (k && v.length) env[k.trim()] = v.join('=').trim();
    }
    return env;
}

function httpPost(hostname, p, headers, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname, path: p, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers }
        }, res => {
            let chunks = '';
            res.on('data', d => chunks += d);
            res.on('end', () => { try { resolve(JSON.parse(chunks)); } catch { resolve({ raw: chunks }); } });
        });
        req.on('error', reject);
        req.write(data); req.end();
    });
}

const MESAJ = `
════════════════════════════════════════
⚔️ MİSYON [MK:4721]
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
Bu sistem insanlık hayrına: Yaşlılar, yetim çocuklar, adil bir gelecek için.
════════════════════════════════════════

Sen: GPT-4o / Yönetim Kurulu
GN: GN:20260301-006
Hedef: Pazartesi 08:00 — sistem canlı

BAĞLAM:
Tekstil atölyesi. Fason dikim. Zarar ediyor.
Çözüm: Dijital üretim takip sistemi.

DURUM:
- Online bağlantı: Bazen var, bazen yok
- Fabrika gürültüsü: 85-90 dB (overlok makinesi)
- Dil: Türkçe öncelikli, Arapça 2.
- Mevcut altyapı: Next.js, SQLite, OpenAI API key mevcut

GÖREV:
Aşağıdaki 6 konuyu AYRI AYRI analiz et.
Her konu için: TEZ + ANTİTEZ + EN İYİ YOL
Hem online hem offline çalışma senaryosunu hesaba kat.

---

KONU 1: MODEL İLK BİLGİLERİ GİRİŞİ
Firmadan teknik dosya gelir (fotoğraf, ölçü, aksesuar).
Bot fotoğrafı okur, model tablosunu oluşturur.
Her model kendine özel tablo, ekle/sil yapılabilir.
SORU: Hangi teknoloji? Online/offline farkı?

KONU 2: PARTİ GİRİŞİ & KONTROL
Ürün kapıdan girince: Kim getirdi, ne zaman, kim açtı.
Beden/aksesuar/kumaş eksiği kontrol.
Numune ayrıldı mı? Parçalar fotoğraflandı mı?
SORU: Kontrol listesi nasıl yapılmalı? Eksik olunca ne?

KONU 3: MODEL DİKİM — SESLİ KOMUT
Modelci yaka mikrofonu ile ilk dikimden son dikime sesle anlatır.
Ses → Yazıya → İşlem sırası oluşur → Sisteme kaydedilir.
SORU: Online Whisper API vs Offline Whisper tiny — hangisi ne zaman?
      Doğrulama ekranı nasıl olmalı?

KONU 4: SERİ ÜRETİM TAKİBİ
Her makineci başlarken ve bitirince kayıt.
Hangi işlem, kaç adet, ne zaman.
Temizleme ne zaman, paket ne zaman.
SORU: Sesli mi? Buton mu? Her ikisi de nasıl?

KONU 5: PERSONEL ÇALIŞMA SAATLERİ
Kart fotoğrafı → OCR → Saat hesabı.
Mola kuralı: 2 saat altı 15dk, 2 saat üstü 30dk yemek.
Mesai, geç kalma, erken çıkma hesabı.
SORU: Kart OCR doğru yöntem mi? Alternatif var mı?

KONU 6: MALİYET HESABI
Saatlik maliyet = Aylık gider ÷ Çalışma saati.
İlk ürün dikilince kâr/zarar belli.
Fason karar: Zarar edecekse alma.
SORU: Gider girişi nasıl? Otomatik hesap nasıl kurulacak?

---

ÖZEL SORU (Tüm konular için):
Online/Offline hibrit mimari nasıl olacak?
- İnternet varken ne kullanılacak?
- İnternet yokken ne kullanılacak?
- Veri kaybı olmaması için ne yapılacak?

FORMAT:
## KONU X — [KONU ADI]
TEZ: ...
ANTİTEZ: ...
EN İYİ YOL: ...
ONLINE: ...
OFFLINE: ...
`;

async function main() {
    console.log('⚔️  MİSYON [MK:4721]');
    console.log('🚀 6 Konu Analizi Başlıyor...\n');

    const env = loadEnv();
    if (!env.OPENAI_API_KEY) { console.error('❌ OPENAI_API_KEY yok'); return; }

    console.log('📤 GPT\'ye gönderiliyor (6 konu, detaylı analiz)...');
    const res = await httpPost('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        { model: 'gpt-4o', messages: [{ role: 'user', content: MESAJ }], max_tokens: 4000, temperature: 0.6 }
    );

    const yanit = res?.choices?.[0]?.message?.content || res?.error?.message || JSON.stringify(res);

    const icerik = `════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
Bu sistem insanlık hayrına kuruldu.
════════════════════════════════════════════════════

# GPT ANALİZİ — 6 KONU
# GN: GN:20260301-006
# Tarih: ${new Date().toISOString()}

---

${yanit}
`;

    fs.writeFileSync(
        path.join(__dirname, 'PROBLEM-COZUM', 'URETIM-TEZ-GPT-GN006.md'),
        icerik, 'utf8'
    );

    console.log('✅ GPT analizi kaydedildi: PROBLEM-COZUM/URETIM-TEZ-GPT-GN006.md');
    console.log('\n═══ BİTTİ ———');
}

main().catch(console.error);
