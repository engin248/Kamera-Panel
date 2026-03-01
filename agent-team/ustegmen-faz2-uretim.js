/**
 * ⚔️ GN:20260301-011 — FAZ 2 GÖREV: ÜRETİM TAKİP BOTU
 * node agent-team/ustegmen-faz2-uretim.js
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

const GOREV = {
    asker: `⚔️ MK:4721 | ASKER GÖREVİ — GN:011A | FAZ 2: ÜRETİM TAKİP BOTU

Görev: Üretim Takip bölümü için SESLİ KOMUT sistemi tasarla.

Şu an sistemde var:
- Üretim Girişi formu (parti kayıt)
- Operator sayfası (iş başlat/bitir/üretim kayıt)
- Personel devam (giriş/çıkış tıklama)

İSTENEN: Sesli komut ile üretim takip.
Örnek sesli komutlar:
"Ahmet 5 adet tamamladı"
"ELBİSE modeli yaka dikişi bitti"
"Makine 3 arızalı"
"Bugünkü üretim kaç?"

SORU 1: Bu 4 komut tipi için hangi NLP yaklaşımı? (regex mi, GPT mi, keyword mi?)
SORU 2: Komut yanıtı sesli mi olsun? (TTS gerekli mi?)
SORU 3: Hangi 10 sesli komut atölyede %80 işi kapsar? Listele.
SORU 4: Sesli komut hatalı anlarsa ne olacak? (onay ekranı mı, düzelt komutu mu?)
SORU 5: Gürültülü ortamda alternatif ne? (dokunmatik buton grid mi?)

Kısa net cevapla. Sonuna: ASKER GN:011A TAMAMLANDI`,

    amele1: `⚔️ MK:4721 | AMELE 1 GÖREVİ — GN:011B | FAZ 2: PERSONEL BOTU

Görev: Personel bölümü için eksik özellikleri belirle.

Şu an var:
- Personel listesi (ad, rol, ücret, beceri)
- Günlük devam tıklama sistemi
- Prim & Üret sayfası

EKSİK mi bunlar:
1. Haftalık çalışma özeti (kim kaç saat çalıştı)
2. Personel performans puanı (üretim/hata oranı)
3. Otomatik maaş hesabı (saat × ücret + prim)
4. İzin talep sistemi
5. Uyarı/prim kayıt

Her biri için: Şimdi mi lazım / 2.fazda mı / hiç gerekmez mi?
Kısa net cevapla. Sonuna: AMELE 1 GN:011B TAMAMLANDI`,

    amele2: `⚔️ MK:4721 | AMELE 2 GÖREVİ — GN:011C | FAZ 2: MALİYET BOTU

Görev: Fason fiyat hesap motoru tasarımı.

Formül: Fason Fiyat = (Saatlik Maliyet × İşlem Süresi) + Kâr Marjı

Veriler:
- Saatlik maliyet: İşletme giderlerinden (yeni eklendi)
- İşlem süresi: Operatör takipten (kayıtlı)
- Kâr marjı: Yönetici belirliyor (%)

SORU 1: Bu formül fason sektöründe doğru mu? Eksik parametre var mı?
SORU 2: Her model için ayrı fason fiyat hesaplanmalı mı?
SORU 3: Müşteriye teklif formu otomatik oluşturulsun mu? (PDF?)
SORU 4: Kâr/zarar sinyali: İlk ürün dikişinde sistem "kârlı/zararlı" uyarısı verse nasıl hesaplamalı?
SORU 5: Rakip fiyat karşılaştırması gerekli mi? (piyasa fiyatı girişi)

Kısa net cevapla. Sonuna: AMELE 2 GN:011C TAMAMLANDI`
};

async function askGPT(gorev, env) {
    const r = await post('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        { model: 'gpt-4o', messages: [{ role: 'user', content: gorev }], max_tokens: 1500, temperature: 0.3 }
    );
    return r?.choices?.[0]?.message?.content || 'HATA';
}

async function main() {
    console.log('⚔️ GN:011 — FAZ 2 GÖREV DAĞITIMI\n3 askere paralel görev gönderiliyor...\n');
    const env = loadEnv();
    const t = Date.now();
    const [a, b, c] = await Promise.allSettled([
        askGPT(GOREV.asker, env),
        askGPT(GOREV.amele1, env),
        askGPT(GOREV.amele2, env)
    ]);
    const rapor = `⚔️ MK:4721 | GN:20260301-011 | FAZ 2 RAPORU
Süre: ${((Date.now() - t) / 1000).toFixed(1)}s | ${new Date().toISOString()}

## 🔴 ASKER — Sesli Komut Sistemi (GN:011A)

${a.status === 'fulfilled' ? a.value : 'HATA: ' + a.reason}

## 🔵 AMELE 1 — Personel Botu (GN:011B)

${b.status === 'fulfilled' ? b.value : 'HATA: ' + b.reason}

## 🟡 AMELE 2 — Maliyet/Fason Botu (GN:011C)

${c.status === 'fulfilled' ? c.value : 'HATA: ' + c.reason}

[GK:USTEGMEN-011]`;

    const dosya = path.join(__dirname, 'ustegmen-rapor-GN011-faz2.md');
    fs.writeFileSync(dosya, rapor, 'utf8');
    console.log(`✅ TAMAMLANDI → ${dosya}`);
}
main().catch(e => console.error('❌', e.message));
