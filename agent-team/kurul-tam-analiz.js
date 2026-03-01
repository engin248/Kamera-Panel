/**
 * ⚔️ GN:016 — YÖNETİM KURULU 4 ÜYE TAM ANALİZ
 * Orijinal problem + yapılan işler + eksikler + yol haritası
 * GPT + Gemini + Perplexity + DeepSeek paralel
 * node agent-team/kurul-tam-analiz.js
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

// Problem ve çözüm dosyalarını oku
const prob = fs.readFileSync(path.resolve(__dirname, '../PROBLEM-COZUM/01-PROBLEM-TANIMI.md'), 'utf8');
const cozum = fs.readFileSync(path.resolve(__dirname, '../PROBLEM-COZUM/02-KOMUTAN-COZUM-PLANI.md'), 'utf8');

// Yapılan API'leri listele
const yapilanApi = ['uretim-giris', 'personel-saat', 'isletme-gider', 'uretim-ozet', 'fason-fiyat-hesapla', 'personel-haftalik'];
let apiOzet = '';
for (const d of yapilanApi) {
    const p = path.resolve(__dirname, `../app/app/api/${d}/route.js`);
    if (fs.existsSync(p)) apiOzet += `\n- /api/${d}: ✅ Mevcut`;
}

// page.js'deki componentleri listele
const pageKodBas = fs.readFileSync(path.resolve(__dirname, '../app/app/page.js'), 'utf8').split('\n').slice(0, 200).join('\n');

const ANA_PROMPT = `
════════════════════════════════════════
MİSYON [MK:4721] — Engin Bey'in 3 çocuğu için.
Fason tekstil atölyesi dijital yönetim sistemi.
════════════════════════════════════════

## A. KOMUTANIN ANLATTĞI PROBLEM:
${prob.slice(0, 3000)}

## B. KOMUTANIN ÇÖZÜM PLANI:
${cozum.slice(0, 2000)}

## C. ŞU AN YAPILAN İŞLEMLER:
Stack: Next.js 14, SQLite (better-sqlite3), React, Browser Speech API

### Modeller Bölümü:
- Teknik Föy sekmesi (GPT-4o Vision ile fotoğraf okuma)
- Dikim İşlem Sırası sekmesi (sesli ekleme)
- API: model-vision, model-operasyonlar

### Üretim Bölümü:
API'ler:${apiOzet}

### Componentler:
- UretimTabBar: Parti girişi (kim getirdi, beden/aksesuar/kumaş eksiği, parti no, asorti)
- PersonelDevamBar: Günlük giriş/çıkış tıklama + mola hesabı
- IsletmeGiderForm: Aylık gider + saatlik maliyet hesabı
- GunlukHedefBar: Günlük üretim hedef takibi (500 adet)
- PartiBaglantisi: Modele göre parti seçimi
- SesliKomutButonu: Türkçe sesli komut (parseVoiceCommand)
- FasonHesapMini: Fason fiyat hesap UI

---
`;

const GPT_GOREV = ANA_PROMPT + `
SENİN GÖREVİN (GPT — Kod Kalite + Eksik Analiz):

1. Komutanın anlattığı problem ile yapılan işlemleri karşılaştır
2. Hangi problemler çözülmüş? (✅)
3. Hangi problemler çözülmemiş? (❌)
4. Modeller bölümü için eksik neler?
5. Üretim bölümü için eksik neler?
6. Personel bölümü için eksik neler?
7. Maliyet bölümü için eksik neler?

FORMAT: Tablo formatında, ✅/❌/⚠️ ile.
Sonuna: "GPT GN:016 ANALİZ TAMAMLANDI"
`;

const GEMINI_GOREV = ANA_PROMPT + `
SENİN GÖREVİN (Gemini — Mimari + Teknoloji Yol Haritası):

Komutanın hedefi ile mevcut sistemi değerlendirerek:
1. Mevcut teknoloji seçimleri doğru mu? (Next.js, SQLite, Browser Speech API)
2. Browser Speech API yerine daha iyi alternatif var mı? (Whisper? Google STT?)
3. GPT-4o Vision — fotoğraftan işlem sırası okuma için yeterli mi?
4. SQLite — büyüme planı için (birden fazla işletme) yeterli mi?
5. Pazartesi sabahı için kritik olmayan ama yapılması gereken 5 özellik nedir?
6. İleride "diğer işletmelere açılabilir" hedefi için ne değişmeli?

FORMAT: Madde madde, net teknoloji önerisi ile.
Sonuna: "GEMİNİ GN:016 ANALİZ TAMAMLANDI"
`;

const PERPLEXITY_GOREV = ANA_PROMPT + `
SENİN GÖREVİN (Perplexity — Dünya Standartları Araştırma):

Fason tekstil atölyesi yönetim sistemleri için:
1. Dünya'da benzer sistemler var mı? (MES - Manufacturing Execution System)
2. Türk tekstil sektöründe yaygın hangi sistemler kullanılıyor?
3. Ses tanıma (STT) için tekstil ortamında hangi çözümler başarılı?
4. Fason fiyat hesabı için endüstri standardı formül nedir?
5. Personel devam takibi için en pratik yöntem? (RFID? QR? Biometrik?)

Gerçek bilgi, kaynak belirterek.
Sonuna: "PERPLEXİTY GN:016 ARAŞTIRMA TAMAMLANDI"
`;

const DEEPSEEK_GOREV = ANA_PROMPT + `
SENİN GÖREVİN (DeepSeek — Formül + Hesap Doğrulama):

Sistemdeki hesaplamalar doğru mu?

1. Saatlik maliyet formülü: Toplam gider ÷ Toplam çalışma saati = ✅ veya ❌?
2. Fason fiyat formülü: (Saatlik maliyet × süre) + malzeme + nakliye × (1 + kâr%) = Doğru mu?
3. Personel maaş hesabı: (normal_dk/60 × saatlik) + (mesai_dk/60 × saatlik × 1.5) = Doğru mu?
4. Mola hesabı: 2sa→0dk, 4sa→15dk, 4sa+→30dk — Bu Türkiye İş Kanunu'na uygun mu?
5. FPY hesabı: (üretilen - hatalı) / üretilen × 100 — Tekstil sektöründe doğru kullanım mu?
6. OEE hesabı mevcut sistemde nasıl? Eksik parametre var mı?

Her formül için: ✅ Doğru / ❌ Yanlış (düzeltme ile) / ⚠️ Eksik.
Sonuna: "DEEPSEEK GN:016 FORMÜL DOĞRULAMA TAMAMLANDI"
`;

async function askGPT(env) {
    console.log('📝 GPT analiz...');
    const t = Date.now();
    const r = await post('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        { model: 'gpt-4o', messages: [{ role: 'user', content: GPT_GOREV }], max_tokens: 3000, temperature: 0.2 }
    );
    console.log(`   ✅ GPT ${((Date.now() - t) / 1000).toFixed(1)}s`);
    return r?.choices?.[0]?.message?.content || 'HATA';
}

async function askGemini(env) {
    console.log('🧠 Gemini analiz...');
    const t = Date.now();
    const r = await post('generativelanguage.googleapis.com',
        `/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {},
        { contents: [{ parts: [{ text: GEMINI_GOREV }] }], generationConfig: { maxOutputTokens: 3000, temperature: 0.2 } }
    );
    console.log(`   ✅ Gemini ${((Date.now() - t) / 1000).toFixed(1)}s`);
    return r?.candidates?.[0]?.content?.parts?.[0]?.text || 'HATA: ' + JSON.stringify(r).slice(0, 200);
}

async function askPerplexity(env) {
    console.log('🌐 Perplexity araştırma...');
    const t = Date.now();
    const r = await post('api.perplexity.ai', '/chat/completions',
        { 'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}` },
        { model: 'sonar', messages: [{ role: 'user', content: PERPLEXITY_GOREV }], max_tokens: 2000, temperature: 0.2 }
    );
    console.log(`   ✅ Perplexity ${((Date.now() - t) / 1000).toFixed(1)}s`);
    return r?.choices?.[0]?.message?.content || 'HATA';
}

async function askDeepSeek(env) {
    console.log('🤖 DeepSeek formül doğrulama...');
    const t = Date.now();
    const r = await post('api.deepseek.com', '/chat/completions',
        { 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
        { model: 'deepseek-chat', messages: [{ role: 'user', content: DEEPSEEK_GOREV }], max_tokens: 2000, temperature: 0.1 }
    );
    console.log(`   ✅ DeepSeek ${((Date.now() - t) / 1000).toFixed(1)}s`);
    return r?.choices?.[0]?.message?.content || 'HATA';
}

async function main() {
    console.log('\n⚔️ YÖNETİM KURULU 4 ÜYE — MODELLER BÖLÜMÜ TAM ANALİZ');
    console.log('═══════════════════════════════════════════════════');
    console.log('GPT + Gemini + Perplexity + DeepSeek paralel çalışıyor...\n');
    const env = loadEnv();
    const t = Date.now();

    const [gpt, gem, perp, deep] = await Promise.allSettled([
        askGPT(env),
        askGemini(env),
        askPerplexity(env),
        askDeepSeek(env)
    ]);

    const rapor = `⚔️ MK:4721 | GN:016 | YÖNETİM KURULU 4 ÜYE — TAM ANALİZ
${new Date().toLocaleString('tr-TR')} | Süre: ${((Date.now() - t) / 1000).toFixed(1)}s

---

## 📝 GPT — Problem/Çözüm Karşılaştırma + Eksikler

${gpt.status === 'fulfilled' ? gpt.value : '❌ HATA: ' + gpt.reason}

---

## 🧠 GEMİNİ — Mimari + Teknoloji Yol Haritası

${gem.status === 'fulfilled' ? gem.value : '❌ HATA: ' + gem.reason}

---

## 🌐 PERPLEXİTY — Dünya Standartları Araştırma

${perp.status === 'fulfilled' ? perp.value : '❌ HATA: ' + perp.reason}

---

## 🤖 DEEPSEEK — Formül ve Hesap Doğrulama

${deep.status === 'fulfilled' ? deep.value : '❌ HATA: ' + deep.reason}

---

[GK:KURUL-016 | Koordinatör ve Üsteğmen onayına sunulmuştur]`;

    const dosya = path.join(__dirname, 'kurul-tam-analiz-GN016.md');
    fs.writeFileSync(dosya, rapor, 'utf8');
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`✅ 4 ÜYE ANALİZ TAMAMLANDI → ${dosya}`);
    console.log('═══════════════════════════════════════════════════\n');
}
main().catch(e => console.error('❌', e.message));
