/**
 * ⚔️ GN:20260301-012 — FAZ 2 UYGULAMA GÖREVLERİ
 * GN011 raporu ışığında 3 askere uygulama görevi
 * node agent-team/ustegmen-faz2-uygulama.js
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

// Mevcut sesli komut sistemini oku
const pageSnippet = fs.readFileSync(path.resolve(__dirname, '../app/app/page.js'), 'utf8').slice(0, 5000);

const GOREVLER = {
    asker: `⚔️ MK:4721 | ASKER GN:012A | SESLİ KOMUT BOTU TASARIMI

GN011 raporuna göre: Browser Speech API + keyword matching + dokunmatik grid.

Aşağıdaki 10 komutu işleyecek SESLİ KOMUT sistemi için tam JavaScript kodu yaz.
Sistem: Next.js (React), Browser Speech API (mevcut), SQLite backend.

10 KOMUT:
1. "X kişi Y adet tamamladı" → /api/production POST
2. "Model X işlem Y bitti" → /api/production POST
3. "Makine X arızalı" → /api/machines PUT (durum=arizali)
4. "Bugünkü üretim kaç" → /api/production GET cevap ver
5. "X iş başlat" → ProductionPage handleStart trigger
6. "Vardiya değişimi" → alert/bildirim
7. "Makine durumu" → /api/machines GET listele
8. "Üretim raporu" → /api/production GET günlük özet
9. "X giriş yaptı" → /api/personel-saat POST tip:giris
10. "X çıkış yaptı" → /api/personel-saat POST tip:cikis

ÇIKTI: Şu fonksiyonu yaz:
\`\`\`javascript
function parseVoiceCommand(transcript, models, personnel) {
  // transcript: "Ahmet 5 adet tamamladı"
  // return: { action: string, params: object } veya null
}
\`\`\`

Sadece kodu yaz. Açıklama minimum.
Sonuna: ASKER GN:012A TAMAMLANDI`,

    amele1: `⚔️ MK:4721 | AMELE 1 GN:012B | PERSONEL HAFTALIK ÖZET + MAAŞ HESABI

GN011 raporuna göre "Şimdi lazım" olanlar:
1. Haftalık çalışma özeti
2. Otomatik maaş hesabı
3. Uyarı/prim kayıt

Bu 3 özellik için:

A) SQL sorgusu yaz — haftalık özet (personel_id, hafta, toplam_dk, mesai_dk):
\`\`\`sql
SELECT ...
FROM personel_saat_kayitlari
WHERE ... GROUP BY ...
\`\`\`

B) Maaş hesap formülü:
- Net maaş = (toplam_calisma_dk / 60) × saatlik_ucret + prim - kesinti
- Saatlik ücret nerede tutuluyor? (personnel tablosunda daily_wage var → /22 gün → /8 saat = saatlik)
- Mesai: 1.5× saatlik ücret

C) Bu haftalık özet için UI:
- Personel sayfasında "📊 Haftalık Özet" sekmesi
- Tablo: Ad | Bu Hafta Saat | Mesai | Net Maaş Tahmini
- Hangi endpoint? /api/personel-haftalik (GET ?hafta=2026-W09)

Sadece tasarım ver. Sonuna: AMELE 1 GN:012B TAMAMLANDI`,

    amele2: `⚔️ MK:4721 | AMELE 2 GN:012C | FASON FİYAT HESAP MOTORU

GN011 raporuna göre:
- Her model için ayrı fason fiyat
- Kâr/zarar sinyali ilk dikişte
- PDF teklif formu

FORMÜL (genişletilmiş):
Fason Fiyat = (Saatlik Maliyet × Süre_saat) + Malzeme + Nakliye + (× Kâr_marjı%)

Bu motor için API tasarımı yaz:

POST /api/fason-fiyat-hesapla
Body: { model_id, kar_marji_yuzde, ek_malzeme_tl, nakliye_tl }
Response: {
  saatlik_maliyet: X,
  tahmini_sure_saat: Y,
  maliyet_alt: Z,
  fason_fiyat: W,
  kar_zarar_sinyal: "karli" | "zararlı" | "riskli",
  birim_fiyat: (fason_fiyat / toplam_adet)
}

Ayrıca:
- saatlik_maliyet nereden gelecek? (isletme_giderleri tablosundan son ay)
- tahmini_sure_saat nereden? (operations tablosundan standard_time toplamı)

Tam API route.js kodunu yaz.
Sonuna: AMELE 2 GN:012C TAMAMLANDI`
};

async function askGPT(gorev, env) {
    const r = await post('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        { model: 'gpt-4o', messages: [{ role: 'user', content: gorev }], max_tokens: 2500, temperature: 0.2 }
    );
    return r?.choices?.[0]?.message?.content || 'HATA: ' + JSON.stringify(r).slice(0, 200);
}

async function main() {
    console.log('⚔️ GN:012 — FAZ 2 UYGULAMA GÖREVLERİ\n3 askere uygulama görevi gönderiliyor...\n');
    const env = loadEnv();
    const t = Date.now();

    const [a, b, c] = await Promise.allSettled([
        askGPT(GOREVLER.asker, env),
        askGPT(GOREVLER.amele1, env),
        askGPT(GOREVLER.amele2, env)
    ]);

    const rapor = `⚔️ MK:4721 | GN:20260301-012 | FAZ 2 UYGULAMA RAPORU
Süre: ${((Date.now() - t) / 1000).toFixed(1)}s | ${new Date().toISOString()}

## 🔴 ASKER — Sesli Komut parseVoiceCommand() Kodu (GN:012A)

${a.status === 'fulfilled' ? a.value : 'HATA: ' + a.reason}

---

## 🔵 AMELE 1 — Personel Haftalık + Maaş Tasarımı (GN:012B)

${b.status === 'fulfilled' ? b.value : 'HATA: ' + b.reason}

---

## 🟡 AMELE 2 — Fason Fiyat API Kodu (GN:012C)

${c.status === 'fulfilled' ? c.value : 'HATA: ' + c.reason}

---
[GK:USTEGMEN-012]`;

    const dosya = path.join(__dirname, 'ustegmen-rapor-GN012-uygulama.md');
    fs.writeFileSync(dosya, rapor, 'utf8');
    console.log(`✅ GN:012 TAMAMLANDI → ${dosya}`);
}
main().catch(e => console.error('❌', e.message));
