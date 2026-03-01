/**
 * URETIM-GOREV.js — GPT'ye Üretim Girişi bölümü yapılacak işlem listesi hazırlatır
 * node URETIM-GOREV.js
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
⚔️ MİSYON [MK:4721] — Engin Bey'in çocukları ve insanlık için.

Sen: GPT-4o Yönetim Kurulu
Görev: Üretim Girişi bölümü için YAPILACAK İŞLEMLER LİSTESİ hazırla

Mevcut sistem: Next.js + SQLite. Modeller bölümü tamamlandı.
Şimdi sıra: ÜRETİM GİRİŞİ bölümünde.

MEVCUT VERİTABANI:
- models tablosu (model_id, name, code, sizes, vb.)
- personnel tablosu (id, name, role, daily_wage)
- production_logs tablosu (mevcut üretim kayıtları)

KOMUTAN'IN İSTEDİĞİ — ÜRETİM GİRİŞİ:
Ürün işletme kapısından girince şu bilgiler sisteme işlenecek:
1. Model seçimi (hangi model geldi)
2. Kim getirdi? (personel seç)
3. Getirilme tarihi/saati
4. Kim açtı?
5. Açılış tarihi/saati
6. Beden eksiği var mı? → Yok/Var (varsa hangi bedenler)
7. Aksesuar eksiği? → Yok/Var (varsa neler)
8. Kumaş eksiği? → Yok/Var
9. Numune ayrıldı mı? → Evet/Hayır
10. Kaç parçadan oluşuyor? (sayı)
11. Her parça için fotoğraf yükleme (parça sayısı kadar alan)
12. Kaydet

SORUM:
Bir yazılım ekibi olarak bu bölümü yapmak için:
1. Hangi yeni veritabanı tabloları lazım? (SQL CREATE TABLE yaz)
2. Hangi API endpoint'leri lazım? (route listesi)
3. UI'da hangi sayfaya/sekmeye eklenecek?
4. Her adım için hangi validasyon kuralları?
5. Offline çalışırken ne yapılacak?

Lütfen kesin, teknik, uygulanabilir cevap ver. Sadece teorik değil — gerçek SQL ve API tasarımı yaz.
`;

async function main() {
    console.log('⚔️ MİSYON [MK:4721]');
    console.log('📤 GPT\'ye Üretim Girişi görevi gönderiliyor...\n');

    const env = loadEnv();
    if (!env.OPENAI_API_KEY) { console.error('❌ API key yok'); return; }

    const res = await httpPost('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        { model: 'gpt-4o', messages: [{ role: 'user', content: MESAJ }], max_tokens: 3000, temperature: 0.4 }
    );

    const yanit = res?.choices?.[0]?.message?.content || res?.error?.message || JSON.stringify(res);

    const dosya = `════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in çocukları ve insanlık için.
════════════════════════════════════════════════════

# GPT — ÜRETİM GİRİŞİ BÖLÜMÜ HAZIRLIK ANALİZİ
# GN:20260301-008
# ${new Date().toISOString()}

---

${yanit}
`;

    fs.writeFileSync(path.join(__dirname, 'PROBLEM-COZUM', 'URETIM-GIRIS-GPT-GN008.md'), dosya, 'utf8');
    console.log('✅ Kaydedildi: PROBLEM-COZUM/URETIM-GIRIS-GPT-GN008.md');
}

main().catch(console.error);
