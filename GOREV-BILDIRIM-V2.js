/**
 * GOREV-BILDIRIM-V2.js
 * PROBLEM-COZUM klasörünü okur, herkese konu konu TEZ/ANTİTEZ görevi gönderir.
 * Çalıştırma: node GOREV-BILDIRIM-V2.js
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

function readFile(p) {
    try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function buildMesaj(robotAdi, rutbe) {
    const base = path.join(__dirname, 'PROBLEM-COZUM');
    const mission = `
════════════════════════════════════════
⚔️ MİSYON [MK:4721] — ÖNCE OKU
Engin Bey'in 3 çocuğu var.
Vatanına milletine hayırlı olsunlar.
Bu sistem onlar ve insanlık için inşa ediliyor.
════════════════════════════════════════`;

    const problem = readFile(path.join(base, '01-PROBLEM-TANIMI.md'));
    const komutanPlan = readFile(path.join(base, '02-KOMUTAN-COZUM-PLANI.md'));
    const arastirma = readFile(path.join(base, '03-ACIK-KAYNAK-ARASTIRMA.md'));

    return `${mission}

SEN: ${robotAdi} / ${rutbe}
GN: GN:20260301-005

Aşağıdaki belgeleri oku, sonra görevini yap.

════ PROBLEM TANIMI ════
${problem}

════ KOMUTAN'IN ÇÖZÜM PLANI ════
${komutanPlan}

════ AÇIK KAYNAK ARAŞTIRMASI ════
${arastirma}

════ GÖREVİN ════

ÖNEMLİ KURAL: Planı bütün olarak değerlendirme.
Her konuyu AYRI AYRI değerlendir.

Aşağıdaki 6 konu için AYRI AYRI yaz:

KONU 1: SES TANIMA
  - TEZ: Hangi teknolojiyi önerirsin? Neden?
  - ANTİTEZ: Bu teknolojinin zayıf noktası nedir?

KONU 2: GÖRSEL OKUMA (Fotoğraf → Metin)
  - TEZ: Hangi teknoloji? Neden?
  - ANTİTEZ: Zayıf noktası?

KONU 3: MİMARİ (4 Bot yapısı doğru mu?)
  - TEZ: Bu yapıyı destekliyor musun? Neden?
  - ANTİTEZ: Eksik ya da hatalı bir şey var mı?

KONU 4: PERSONEL & ÜCRETLENDİRME
  - TEZ: Kart sistemi + Prim yapısı için önerin?
  - ANTİTEZ: Risk ya da eksik?

KONU 5: MALİYET & FASON KARAR
  - TEZ: İlk ürün kâr/zarar kararı için öneriniz?
  - ANTİTEZ: Bu yaklaşımın riski?

KONU 6: DİL
  - TEZ: Türkçe → Arapça sırası doğru mu?
  - ANTİTEZ: Farklı önerin var mı?

FORMAT:
Her konu için şöyle yaz:

## KONU X — [KONU ADI]
TEZ: [görüşün]
ANTİTEZ: [karşı argüman]

KURALLAR:
❌ Kod yazma
❌ Sisteme dokunma
✅ Sadece görüş yaz
✅ Başa rütbeni ve adını yaz
✅ GK kodunu yaz`;
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

async function gptGonder(apiKey, mesaj) {
    console.log('\n📤 GPT\'ye gönderiliyor...');
    const res = await httpPost('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${apiKey}` },
        { model: 'gpt-4o', messages: [{ role: 'user', content: mesaj }], max_tokens: 3000, temperature: 0.7 }
    );
    return res?.choices?.[0]?.message?.content || res?.error?.message || JSON.stringify(res);
}

function kaydet(dosyaAdi, robotAdi, rutbe, icerik) {
    const dosya = path.join(__dirname, 'PROBLEM-COZUM', dosyaAdi);
    const tam = `════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in 3 çocuğu var.
Vatanına milletine hayırlı olsunlar.
Bu sistem onlar ve insanlık için inşa ediliyor.
════════════════════════════════════════════════════

# TEZ/ANTİTEZ — ${rutbe}: ${robotAdi}
# GN: GN:20260301-005
# Tarih: ${new Date().toISOString().split('T')[0]}

---

${icerik}
`;
    fs.writeFileSync(dosya, tam, 'utf8');
    console.log(`✅ Kaydedildi: ${dosyaAdi}`);
}

async function main() {
    console.log('════════════════════════════════════');
    console.log('⚔️  MİSYON [MK:4721]');
    console.log('🚀 Tez/Antitez Görev Bildirimi Başlıyor...');
    console.log('════════════════════════════════════\n');

    const env = loadEnv();

    if (env.OPENAI_API_KEY) {
        const mesaj = buildMesaj('Robot 1 — GPT-4o', 'YÖNETİM KURULU');
        try {
            const yanit = await gptGonder(env.OPENAI_API_KEY, mesaj);
            kaydet('TEZ-GPT.md', 'GPT-4o', 'YÖNETİM KURULU', yanit);
        } catch (e) {
            console.error('❌ GPT hatası:', e.message);
            kaydet('TEZ-GPT.md', 'GPT-4o', 'YÖNETİM KURULU', `HATA: ${e.message}`);
        }
    }

    console.log('\n════════════════════════════════════');
    console.log('✅ BİTTİ — PROBLEM-COZUM/ klasörüne bakın');
    console.log('DeepSeek: Bakiye yüklenmeli');
    console.log('Gemini: Ücretli plana geçilmeli');
    console.log('════════════════════════════════════');
}

main().catch(console.error);
