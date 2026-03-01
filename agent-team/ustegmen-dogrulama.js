/**
 * ⚔️ GN:014 — KOD DOĞRULAMA + ASKER RAPOR KONTROLÜ
 * GPT → Yapılan işleri kontrol et, hata bul, rapor ver
 * node agent-team/ustegmen-dogrulama.js
 */
const fs = require('fs'), path = require('path'), https = require('https');

function loadEnv() {
    const lines = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8').split('\n');
    const env = {};
    for (const l of lines) { const t = l.trim(); if (!t || t.startsWith('#')) continue; const [k, ...v] = t.split('='); if (k) env[k.trim()] = v.join('=').trim(); }
    return env;
}
function post(host, p, hdrs, body) {
    return new Promise((res, rej) => {
        const d = JSON.stringify(body);
        const r = https.request({ hostname: host, path: p, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), ...hdrs } }, rs => { let c = ''; rs.on('data', x => c += x); rs.on('end', () => { try { res(JSON.parse(c)); } catch { res({ raw: c }); } }); });
        r.on('error', rej); r.write(d); r.end();
    });
}

// Yapılan 3 API dosyasını oku
const apiDosyalar = ['uretim-giris', 'personel-saat', 'isletme-gider', 'uretim-ozet', 'fason-fiyat-hesapla', 'personel-haftalik'];
let apiKodlari = '';
for (const d of apiDosyalar) {
    const p = path.resolve(__dirname, `../app/app/api/${d}/route.js`);
    if (fs.existsSync(p)) { apiKodlari += `\n\n### /api/${d}/route.js\n\`\`\`javascript\n${fs.readFileSync(p, 'utf8')}\n\`\`\``; }
}

// page.js'den ilgili componentleri çıkar (satır 1-500)
const pageKod = fs.readFileSync(path.resolve(__dirname, '../app/app/page.js'), 'utf8').split('\n').slice(0, 500).join('\n');

const GOREVLER = {
    asker: `⚔️ ASKER DOĞRULAMA GÖREVİ — GN:014A
Sen kodu inceleyen kalite kontrol uzmanısın.

Aşağıdaki API kodlarını incele. Her biri için:
1. Hata var mı? (SQL hataları, eksik import, tip uyumsuzluğu)
2. better-sqlite3 ile uyumlu mu? (.prepare().get() / .all() / .run() kullanımı doğru mu?)
3. Tablo oluşturma (CREATE TABLE IF NOT EXISTS) doğru mu?
4. Edge case var mı? (null değer, boş istek body, eksik alan)

API KODLARI:
${apiKodlari}

Her API için kısa kontrol raporu ver:
✅ veya ❌ ve neden.
Sonuna: ASKER GN:014A DOĞRULAMA TAMAMLANDI`,

    amele1: `⚔️ AMELE 1 RAPOR GÖREVİ — GN:014B
Sen modeller bölümündeki ve personel devam sistemindeki yaptığın işleri raporlayacaksın.

Görev: Aşağıdaki componentleri incele, nasıl çalıştıklarını açıkla:

component kodları (page.js satır 1-500):
${pageKod}

Rapor formatı:
1. GunlukHedefBar — ne iş yapıyor, veri nereden geliyor, hata riski var mı?
2. PartiBaglantisi — ne iş yapıyor, hangi endpoint, çalışır mı?
3. SesliKomutButonu + parseVoiceCommand — hangi komutları anlıyor, eksik var mı?
4. UretimTabBar/PersonelDevamBar/IsletmeGiderForm — kısa özet

Sonuna: AMELE 1 GN:014B RAPOR TAMAMLANDI`,

    amele2: `⚔️ AMELE 2 PERFORMANS GÖREVİ — GN:014C
Sen sistemin performans ve UX kalitesini değerlendiriyorsun.

Aşağıdaki bölümleri değerlendir:
1. Üretim Girişi formu (13 alan) — kullanıcı ne kadar sürede doldurur? Basitleştir mi?
2. Personel devam tıklama sistemi — atölyede gerçekçi mi?
3. Sesli komut — gürültülü ortamda sorunlar neler?
4. Günlük hedef bar — 500 adet sabit mi yoksa ayarlanabilir mi olmalı?
5. Fason fiyat hesap — saatlik maliyet 0 olunca ne göstermeli?

Her madde için: 
- Mevcut durum
- Sorun var mı
- Öneri (uygulanabilir, basit)

Sonuna: AMELE 2 GN:014C PERFORMANS TAMAMLANDI`
};

async function askGPT(gorev, env) {
    const r = await post('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        { model: 'gpt-4o', messages: [{ role: 'user', content: gorev }], max_tokens: 2000, temperature: 0.2 }
    );
    return r?.choices?.[0]?.message?.content || 'HATA: ' + JSON.stringify(r).slice(0, 200);
}

async function main() {
    console.log('⚔️ GN:014 — KOD DOĞRULAMA + RAPOR KONTROLÜ\n3 kontrol paralel çalışıyor...\n');
    const env = loadEnv();
    const t = Date.now();
    const [a, b, c] = await Promise.allSettled([
        askGPT(GOREVLER.asker, env),
        askGPT(GOREVLER.amele1, env),
        askGPT(GOREVLER.amele2, env)
    ]);
    const rapor = `⚔️ MK:4721 | GN:014 | KOD DOĞRULAMA RAPORU
${new Date().toISOString()} | Süre: ${((Date.now() - t) / 1000).toFixed(1)}s

## 🔴 ASKER — API Kod Doğrulama (GN:014A)
${a.status === 'fulfilled' ? a.value : 'HATA: ' + a.reason}

---

## 🔵 AMELE 1 — Component Raporu (GN:014B)
${b.status === 'fulfilled' ? b.value : 'HATA: ' + b.reason}

---

## 🟡 AMELE 2 — Performans & UX (GN:014C)
${c.status === 'fulfilled' ? c.value : 'HATA: ' + c.reason}

---
[GK:USTEGMEN-014]`;

    const dosya = path.join(__dirname, 'ustegmen-rapor-GN014-dogrulama.md');
    fs.writeFileSync(dosya, rapor, 'utf8');
    console.log(`✅ GN:014 TAMAMLANDI → ${dosya}`);
}
main().catch(e => console.error('❌', e.message));
