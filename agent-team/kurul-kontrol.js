/**
 * ⚔️ GN:015 — YÖNETİM KURULU TAM KONTROL
 * GPT + Gemini + Perplexity paralel — yapılan işleri doğrula
 * node agent-team/kurul-kontrol.js
 */
const fs = require('fs'), path = require('path'), https = require('https');

function loadEnv() {
    const lines = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8').split('\n');
    const env = {};
    for (const l of lines) { const t = l.trim(); if (!t || t.startsWith('#')) continue; const [k, ...v] = t.split('='); if (k) env[k.trim()] = v.join('=').trim(); }
    return env;
}

function httpPost(hostname, p, headers, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname, path: p, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers }
        }, res => {
            let c = '';
            res.on('data', d => c += d);
            res.on('end', () => { try { resolve(JSON.parse(c)); } catch { resolve({ raw: c }); } });
        });
        req.on('error', reject); req.write(data); req.end();
    });
}

// Yapılan tüm API dosyalarını oku
const apiDosyalar = ['uretim-giris', 'personel-saat', 'isletme-gider', 'uretim-ozet', 'fason-fiyat-hesapla', 'personel-haftalik'];
let apiKodlari = '';
for (const d of apiDosyalar) {
    const p = path.resolve(__dirname, `../app/app/api/${d}/route.js`);
    if (fs.existsSync(p)) {
        apiKodlari += `\n\n### /api/${d}\n\`\`\`js\n${fs.readFileSync(p, 'utf8').slice(0, 3000)}\n\`\`\``;
    }
}

// Yapılan componentler (page.js satır 1-600)
const pageKod = fs.readFileSync(path.resolve(__dirname, '../app/app/page.js'), 'utf8').split('\n').slice(0, 600).join('\n');

const KONTROL_PROMPT = `
Sen bir tekstil üretim yönetim sistemi için yapılan kodları inceleyen kalite kontrol uzmanısın.

Sistem: Next.js 14 App Router, SQLite (better-sqlite3), React hooks
Proje: Kamera-Panel — Fason tekstil atölyesi yönetim paneli

## YAPILAN İŞLER (kontrol edilecek):

### 1. API'ler:
${apiKodlari}

### 2. React Componentler (page.js ilk 600 satır):
\`\`\`js
${pageKod}
\`\`\`

## KONTROL LİSTESİ — HER MADDEYİ CEVAPLA:

**A. API KALİTE KONTROLÜ:**
1. Her API'de better-sqlite3 doğru mu? (.prepare, .get, .all, .run)
2. CREATE TABLE IF NOT EXISTS var mı (yeni tablolar için)?
3. NULL/undefined kontrolü yapılmış mı?
4. HTTP method kontrolü doğru mu? (GET/POST/PUT ayrımı)
5. JSON yanıt formatı tutarlı mı?

**B. COMPONENT KALİTE KONTROLÜ:**
1. GunlukHedefBar: /api/uretim-ozet doğru kullanılmış mı?
2. PartiBaglantisi: Model seçilince parti listesi filtreleniyor mu?
3. parseVoiceCommand: Türkçe karakterler (ş,ı,ö,ü,ç,ğ) regex'te problem var mı?
4. UretimTabBar: Form submit POST doğru mu?
5. PersonelDevamBar: Giriş/çıkış tip değerleri 'giris'/'cikis' doğru mu?

**C. KRİTİK HATALAR:**
Varsa listele: ❌ [dosya/fonksiyon] — [hata açıklaması] — [düzeltme]

**D. EKSİK OLAN:**
Pazartesi sabahı üretim başlayacak. Ne eksik?

FORMAT: ✅ / ❌ / ⚠️ ile kısa net cevap.
`;

async function askGPT(env) {
    console.log('📝 GPT kontrol başlıyor...');
    const t = Date.now();
    const r = await httpPost('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        { model: 'gpt-4o', messages: [{ role: 'user', content: KONTROL_PROMPT }], max_tokens: 3000, temperature: 0.1 }
    );
    console.log(`   ✅ GPT ${((Date.now() - t) / 1000).toFixed(1)}s`);
    return r?.choices?.[0]?.message?.content || 'HATA: ' + JSON.stringify(r).slice(0, 200);
}

async function askGemini(env) {
    console.log('🧠 Gemini kontrol başlıyor...');
    const t = Date.now();
    const r = await httpPost('generativelanguage.googleapis.com',
        `/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {},
        { contents: [{ parts: [{ text: KONTROL_PROMPT }] }], generationConfig: { maxOutputTokens: 3000, temperature: 0.1 } }
    );
    console.log(`   ✅ Gemini ${((Date.now() - t) / 1000).toFixed(1)}s`);
    return r?.candidates?.[0]?.content?.parts?.[0]?.text || 'HATA: ' + JSON.stringify(r).slice(0, 200);
}

async function askPerplexity(env) {
    if (!env.PERPLEXITY_API_KEY) return 'PERPLEXITY_API_KEY yok — atlandı';
    console.log('🌐 Perplexity kontrol başlıyor...');
    const t = Date.now();
    const r = await httpPost('api.perplexity.ai', '/chat/completions',
        { 'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}` },
        { model: 'sonar', messages: [{ role: 'user', content: KONTROL_PROMPT }], max_tokens: 2000, temperature: 0.1 }
    );
    console.log(`   ✅ Perplexity ${((Date.now() - t) / 1000).toFixed(1)}s`);
    return r?.choices?.[0]?.message?.content || 'HATA: ' + JSON.stringify(r).slice(0, 200);
}

async function main() {
    console.log('\n⚔️ YÖNETİM KURULU TAM KOD KONTROLÜ — GN:015');
    console.log('══════════════════════════════════════════');
    console.log('GPT + Gemini + Perplexity paralel kontrol...\n');
    const env = loadEnv();
    const t = Date.now();

    const [gpt, gem, perp] = await Promise.allSettled([
        askGPT(env),
        askGemini(env),
        askPerplexity(env)
    ]);

    const rapor = `⚔️ MK:4721 | GN:015 | YÖNETİM KURULU TAM KONTROL
${new Date().toISOString()} | Süre: ${((Date.now() - t) / 1000).toFixed(1)}s

## 📝 GPT — Kod Kalite Kontrolü

${gpt.status === 'fulfilled' ? gpt.value : 'HATA: ' + gpt.reason}

---

## 🧠 GEMİNİ — Teknik Doğrulama

${gem.status === 'fulfilled' ? gem.value : 'HATA: ' + gem.reason}

---

## 🌐 PERPLEXİTY — Standart Uyum

${perp.status === 'fulfilled' ? perp.value : 'HATA: ' + perp.reason}

---
[GK:KURUL-015 | Koordinatör onayına sunulmuştur]`;

    const dosya = path.join(__dirname, 'kurul-kontrol-GN015.md');
    fs.writeFileSync(dosya, rapor, 'utf8');
    console.log('\n══════════════════════════════════════════');
    console.log(`✅ KURUL KONTROLÜ TAMAMLANDI → ${dosya}`);
}
main().catch(e => console.error('❌', e.message));
