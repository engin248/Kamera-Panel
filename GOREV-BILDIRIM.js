/**
 * GOREV-BILDIRIM.js
 * Yönetim Kurulu'na (GPT, DeepSeek, Gemini) otomatik görev bildirimi gönderir.
 * Her birinin planını toplar, dosyalara kaydeder.
 * 
 * Çalıştırma: node GOREV-BILDIRIM.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── ENV YÜKLE ─────────────────────────────────────────────────────────────
function loadEnv() {
    const envPath = path.join(__dirname, '.env.local');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    const env = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length) env[key.trim()] = rest.join('=').trim();
    }
    return env;
}

// ─── BRİFİNG OKU ───────────────────────────────────────────────────────────
function readBriefing() {
    const base = path.join(__dirname, 'SESLI-KOMUT-PLANLAMA');
    const mission = `
════════════════════════════════════
⚔️ MİSYON [MK:4721] — ÖNCE OKU
Engin Bey'in 3 çocuğu var.
Vatanına milletine hayırlı olsunlar.
Bu sistem onlar ve insanlık için inşa ediliyor.
Yarım bırakmayız. Test etmeden tamam demeyiz.
════════════════════════════════════
`;

    const readme = fs.readFileSync(path.join(base, '00-README.md'), 'utf8');
    const briefing = fs.readFileSync(path.join(base, '01-BRIEFING.md'), 'utf8');
    const tegmenPlan = fs.readFileSync(path.join(base, '02-PLAN-TEGMEN.md'), 'utf8');

    return { mission, readme, briefing, tegmenPlan };
}

// ─── GÖREV MESAJI ──────────────────────────────────────────────────────────
function buildGorevMesaji(robotAdi, rutbe, { mission, readme, briefing, tegmenPlan }) {
    return `${mission}

SEN: ${robotAdi} / ${rutbe}
GN: GN:20260301-004

Aşağıdaki belgeleri sırayla oku, sonra kendi planını hazırla.

════ 00-README.md ════
${readme}

════ 01-BRIEFING.md ════
${briefing}

════ 02-PLAN-TEGMEN.md ════
${tegmenPlan}

════ GÖREV ════
Yukarıdaki belgeleri okudun.
Şimdi senin planını hazırla.

Planın şunları MUTLAKA içermeli:
1. TEKNOLOJİ SEÇİMİ: Hangi ses tanıma teknolojisi? Neden?
2. MİMARİ: Sistem nasıl kurulacak?
3. İŞ BÖLÜMÜ: Kim ne yapacak?
4. AŞAMALAR: Önce ne, sonra ne?
5. RİSKLER: Ne yanlış gidebilir?
6. TAVSİYE: En iyi yol nedir?

KURALLAR:
❌ Kod yazma
❌ Sisteme dokunma
✅ Sadece plan yaz
✅ Planının başına rütbeni ve adını yaz
✅ Sonuna GK kodunu yaz

Planını şimdi yaz:`;
}

// ─── HTTP POST (Promise) ────────────────────────────────────────────────────
function httpPost(hostname, path, headers, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname, path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers }
        }, res => {
            let chunks = '';
            res.on('data', d => chunks += d);
            res.on('end', () => {
                try { resolve(JSON.parse(chunks)); }
                catch { resolve({ raw: chunks }); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ─── GPT'YE GÖNDER ─────────────────────────────────────────────────────────
async function gptePlan(apiKey, mesaj) {
    console.log('\n📤 GPT\'ye görev gönderiliyor...');
    const res = await httpPost('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${apiKey}` },
        {
            model: 'gpt-4o',
            messages: [{ role: 'user', content: mesaj }],
            max_tokens: 2000,
            temperature: 0.7
        }
    );
    return res?.choices?.[0]?.message?.content || res?.error?.message || JSON.stringify(res);
}

// ─── DEEPSEEK'E GÖNDER ─────────────────────────────────────────────────────
async function deepseekePlan(apiKey, mesaj) {
    console.log('\n📤 DeepSeek\'e görev gönderiliyor...');
    const res = await httpPost('api.deepseek.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${apiKey}` },
        {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: mesaj }],
            max_tokens: 2000
        }
    );
    return res?.choices?.[0]?.message?.content || res?.error?.message || JSON.stringify(res);
}

// ─── GEMİNİ'YE GÖNDER ─────────────────────────────────────────────────────
async function geminiePlan(apiKey, mesaj) {
    console.log('\n📤 Gemini\'ye görev gönderiliyor...');
    const res = await httpPost('generativelanguage.googleapis.com',
        `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {},
        { contents: [{ parts: [{ text: mesaj }] }] }
    );
    return res?.candidates?.[0]?.content?.parts?.[0]?.text
        || res?.error?.message
        || JSON.stringify(res);
}

// ─── PLANI KAYDET ──────────────────────────────────────────────────────────
function planiKaydet(dosyaAdi, robotAdi, rutbe, icerik) {
    const base = path.join(__dirname, 'SESLI-KOMUT-PLANLAMA');
    const dosyaYolu = path.join(base, dosyaAdi);
    const icerikTam = `════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in 3 çocuğu var.
Vatanına milletine hayırlı olsunlar.
Bu sistem onlar ve insanlık için inşa ediliyor.
════════════════════════════════════════════════════

# PLAN — ${rutbe}: ${robotAdi}
# GN: GN:20260301-004
# Tarih: ${new Date().toISOString().split('T')[0]}
# Durum: ✅ Teslim edildi

---

${icerik}
`;
    fs.writeFileSync(dosyaYolu, icerikTam, 'utf8');
    console.log(`✅ Plan kaydedildi: ${dosyaAdi}`);
}

// ─── ANA FONKSİYON ─────────────────────────────────────────────────────────
async function main() {
    console.log('════════════════════════════════════');
    console.log('⚔️  MİSYON [MK:4721]');
    console.log('Engin Bey\'in 3 çocuğu için çalışıyoruz.');
    console.log('════════════════════════════════════');
    console.log('\n🚀 Yönetim Kurulu Görev Bildirimi Başlıyor...\n');

    const env = loadEnv();
    const belgeler = readBriefing();

    const gorevler = [];

    // ── GPT ──
    if (env.OPENAI_API_KEY) {
        const mesaj = buildGorevMesaji('Robot 1 — GPT-4o', 'YÖNETİM KURULU ÜYESİ', belgeler);
        gorevler.push(
            gptePlan(env.OPENAI_API_KEY, mesaj)
                .then(plan => planiKaydet('03-PLAN-GPT.md', 'GPT-4o', 'YÖNETİM KURULU', plan))
                .catch(e => { console.error('❌ GPT hatası:', e.message); planiKaydet('03-PLAN-GPT.md', 'GPT-4o', 'YÖNETİM KURULU', `HATA: ${e.message}`); })
        );
    } else {
        console.log('⚠️  OPENAI_API_KEY bulunamadı — GPT atlanıyor');
    }

    // ── DEEPSEEK ──
    if (env.DEEPSEEK_API_KEY) {
        const mesaj = buildGorevMesaji('Robot 2 — DeepSeek', 'YÖNETİM KURULU ÜYESİ', belgeler);
        gorevler.push(
            deepseekePlan(env.DEEPSEEK_API_KEY, mesaj)
                .then(plan => planiKaydet('04-PLAN-DEEPSEEK.md', 'DeepSeek', 'YÖNETİM KURULU', plan))
                .catch(e => { console.error('❌ DeepSeek hatası:', e.message); planiKaydet('04-PLAN-DEEPSEEK.md', 'DeepSeek', 'YÖNETİM KURULU', `HATA: ${e.message}`); })
        );
    } else {
        console.log('⚠️  DEEPSEEK_API_KEY bulunamadı — DeepSeek atlanıyor');
    }

    // ── GEMİNİ ──
    if (env.GEMINI_API_KEY) {
        const mesaj = buildGorevMesaji('Robot 3 — Gemini', 'YÖNETİM KURULU ÜYESİ', belgeler);
        gorevler.push(
            geminiePlan(env.GEMINI_API_KEY, mesaj)
                .then(plan => planiKaydet('05-PLAN-GEMINI.md', 'Gemini', 'YÖNETİM KURULU', plan))
                .catch(e => { console.error('❌ Gemini hatası:', e.message); planiKaydet('05-PLAN-GEMINI.md', 'Gemini', 'YÖNETİM KURULU', `HATA: ${e.message}`); })
        );
    } else {
        console.log('⚠️  GEMINI_API_KEY bulunamadı — Gemini atlanıyor');
    }

    await Promise.all(gorevler);

    console.log('\n════════════════════════════════════');
    console.log('✅ TÜM GÖREV BİLDİRİMLERİ TAMAMLANDI');
    console.log('Planlar SESLI-KOMUT-PLANLAMA/ klasöründe');
    console.log('Analiz için Komutan\'a bildirin.');
    console.log('════════════════════════════════════');
}

main().catch(console.error);
