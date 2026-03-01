/**
 * GN:018 — YÖNETİM KURULU — MODELLER ÖZELLİK LİSTESİ ONAY
 * 4 üye paralel — eksik/fazla/yanlış tespit
 * node agent-team/kurul-ozellik-onay.js
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

const liste = fs.readFileSync(path.resolve(__dirname, '../MODELLER-OZELLIK-LISTESI.md'), 'utf8');
const prob = fs.readFileSync(path.resolve(__dirname, '../PROBLEM-COZUM/01-PROBLEM-TANIMI.md'), 'utf8').slice(0, 3000);

const BAGLAM = `
════════════════════════════════
MİSYON [MK:4721]
Fason tekstil atölyesi dijital yönetim paneli.
Komutan: Engin Bey (3 çocuk, vatan için)
════════════════════════════════

## KOMUTANIN ANLATIĞI PROBLEM:
${prob}

## ÜSTEĞMENİN HAZIRLIDIĞI MODELLER ÖZELLİK LİSTESİ:
${liste}
`;

const SORU = `
SENİN GÖREVİN: Bu listeyi incele ve şu soruları yanıtla:

1. EKSİK: Tekstil atölyesi modeller bölümünde olması gerekip listede OLMAYAN özellik var mı?
2. FAZLA: Listede olup gereksiz/karmaşık olan madde var mı? (atölye gerçeğine uymayan)
3. YANLIŞ: Yanlış kategorilendirilen veya tekrar eden madde var mı?
4. ÖNCELIK: Pazartesi sabahı ZORUNLU olanlar doğru işaretlenmiş mi?
5. EKLENMESİ GEREKEN: Senin önerdiğin 3 kritik özellik nedir?

FORMAT: Madde madde, kısa net. ✅ Onay / ❌ Sorun / ➕ Ekle
Sonuna imzanı koy.
`;

async function gpt(env) {
    console.log('📝 GPT kontrol...');
    const r = await post('api.openai.com', '/v1/chat/completions',
        { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
        { model: 'gpt-4o', messages: [{ role: 'user', content: BAGLAM + SORU }], max_tokens: 2000, temperature: 0.2 });
    console.log('   ✅ GPT bitti');
    return r?.choices?.[0]?.message?.content || 'HATA';
}
async function gemini(env) {
    console.log('🧠 Gemini kontrol...');
    const r = await post('generativelanguage.googleapis.com',
        `/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`, {},
        { contents: [{ parts: [{ text: BAGLAM + SORU }] }], generationConfig: { maxOutputTokens: 2000, temperature: 0.2 } });
    console.log('   ✅ Gemini bitti');
    return r?.candidates?.[0]?.content?.parts?.[0]?.text || 'HATA: ' + JSON.stringify(r).slice(0, 150);
}
async function perplexity(env) {
    console.log('🌐 Perplexity kontrol...');
    const r = await post('api.perplexity.ai', '/chat/completions',
        { Authorization: `Bearer ${env.PERPLEXITY_API_KEY}` },
        { model: 'sonar', messages: [{ role: 'user', content: BAGLAM + SORU }], max_tokens: 2000, temperature: 0.2 });
    console.log('   ✅ Perplexity bitti');
    return r?.choices?.[0]?.message?.content || 'HATA';
}
async function deepseek(env) {
    console.log('🤖 DeepSeek kontrol...');
    const r = await post('api.deepseek.com', '/chat/completions',
        { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
        { model: 'deepseek-chat', messages: [{ role: 'user', content: BAGLAM + SORU }], max_tokens: 2000, temperature: 0.2 });
    console.log('   ✅ DeepSeek bitti');
    return r?.choices?.[0]?.message?.content || 'HATA';
}

async function main() {
    console.log('\n⚔️ GN:018 — KURUL MODELLER ÖZELLİK LİSTESİ ONAY');
    console.log('4 üye paralel çalışıyor...\n');
    const env = loadEnv();
    const t = Date.now();
    const [g, gem, p, d] = await Promise.allSettled([gpt(env), gemini(env), perplexity(env), deepseek(env)]);
    const rapor = `⚔️ MK:4721 | GN:018 | MODELLER ÖZELLİK LİSTESİ — KURUL ONAYI
${new Date().toLocaleString('tr-TR')} | Süre: ${((Date.now() - t) / 1000).toFixed(1)}s

## 📝 GPT
${g.status === 'fulfilled' ? g.value : '❌ ' + g.reason}

---

## 🧠 GEMİNİ
${gem.status === 'fulfilled' ? gem.value : '❌ ' + gem.reason}

---

## 🌐 PERPLEXİTY
${p.status === 'fulfilled' ? p.value : '❌ ' + p.reason}

---

## 🤖 DEEPSEEK
${d.status === 'fulfilled' ? d.value : '❌ ' + d.reason}

---
[GK:KURUL-018 | Komutan onayına sunulmuştur]`;
    const dosya = path.join(__dirname, 'kurul-ozellik-onay-GN018.md');
    fs.writeFileSync(dosya, rapor, 'utf8');
    console.log(`\n✅ TAMAMLANDI → ${dosya}`);
}
main().catch(e => console.error('❌', e.message));
