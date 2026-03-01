/**
 * ⚔️ ÜSTEĞMEN GÖREV EMRİ — GN:20260301-010
 * 
 * Sistem: agent-team/kurul-*.js ile aynı kanal
 * Üsteğmen (Ben/Antigravity) → 3 Askere görev gönderir
 * 
 * Kullanım: node agent-team/ustegmen-gorev-ver.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// .env.local oku
function loadEnv() {
    const p = path.resolve(__dirname, '../.env.local');
    const lines = fs.readFileSync(p, 'utf8').split('\n');
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

// Mevcut kod durumunu oku
const pageJs = fs.readFileSync(path.resolve(__dirname, '../app/app/page.js'), 'utf8');

// ====================================================
// ASKER GÖREVİ — Üretim Girişi incelemesi + eksik analizi
// ====================================================
const ASKER_GOREV = `
⚔️ MİSYON [MK:4721] — Engin Bey'in 3 çocuğu için. Vatan ve insanlık hayrına.

# ASKER GÖREVİ — GN:20260301-010A
Rütbe: Asker (Analist)
Komutan: Üsteğmen (Antigravity)

## GÖREVİN

Aşağıdaki kod bölümü yeni eklenen UretimTabBar componentidir.
Bu component Üretim Takip sayfasında çalışmakta.

Kodun ilk ${pageJs.indexOf('// ========== PERSONEL DEVAM BARI')} karakterini inceleme — sadece UretimTabBar'ı analiz et.

## SORULAR — HER BİRİNE CEVAP VER

1. Formda eksik olan ZORUNLU alan var mı? (Örnek: Üretim partisi numarası, Asorti bilgisi)
2. Parça fotoğrafı yükleme mantıklı mı? Yoksa sadece parça sayısı yeterli mi?
3. "Kim getirdi / Kim açtı" seçimi yerine başka bir yöntem öneriyor musun?
4. Eksik kontrol (beden/aksesuar/kumaş) mantığı doğru mu?
5. Formu doldururken en çok zaman kaybettiren adım hangisi?
6. Bu formu doldurmak kaç dakika sürer? Kabul edilebilir mi?
7. Offline çalışma için ek önerin var mı?

## FORMAT
Her soruya kısa, net, teknik cevap ver.
Sonuna: "ASKER GN:010A ANALİZ TAMAMLANDI" yaz.
`;

// ====================================================
// AMELE 1 GÖREVİ — PersonelDevamBar incelemesi
// ====================================================
const AMELE1_GOREV = `
⚔️ MİSYON [MK:4721] — Engin Bey'in 3 çocuğu için. Vatan ve insanlık hayrına.

# AMELE 1 GÖREVİ — GN:20260301-010B
Rütbe: Amele/Çırak (Analist)
Komutan: Üsteğmen (Antigravity)

## GÖREVİN

PersonelDevamBar componenti Personel sayfasında tıklama ile giriş/çıkış kaydını yönetiyor.

## SORULAR — HER BİRİNE CEVAP VER

1. Giriş/çıkış tıklama sistemi atölye şartlarında çalışır mı? (Kirli el, acele, tablet eksik durumları)
2. QR okutma sistemi ne zaman eklenmeli? (Şimdi mi, 2. fazda mı?)
3. Mola süresi hesabı (2sa→0dk, 4sa→15dk, 4sa+→30dk) doğru mu? Atölye gerçeğine uyuyor mu?
4. Geç kalma hesabı (08:00 başlangıç) düzeltilmeli mi?
5. Çalışan kayıt silebilir mi? Kim yetkili olmalı?
6. Fazla mesai sınırı olmalı mı? (max kaç saat?)
7. Haftalık/aylık raporlama için hangi veriler kritik?

## FORMAT
Her soruya kısa, net cevap ver.
Sonuna: "AMELE 1 GN:010B ANALİZ TAMAMLANDI" yaz.
`;

// ====================================================
// AMELE 2 GÖREVİ — IsletmeGiderForm incelemesi
// ====================================================
const AMELE2_GOREV = `
⚔️ MİSYON [MK:4721] — Engin Bey'in 3 çocuğu için. Vatan ve insanlık hayrına.

# AMELE 2 GÖREVİ — GN:20260301-010C
Rütbe: Amele/Çırak (Analist)
Komutan: Üsteğmen (Antigravity)

## GÖREVİN

IsletmeGiderForm componenti Maliyet Analizi sayfasında aylık gider girişi ve saatlik maliyet hesabı yapıyor.

## SORULAR — HER BİRİNE CEVAP VER

1. Fason atölye için hangi gider kalemleri eksik? (Örnek: İplik, iğne, baskı kalıbı, taşeron)
2. Saatlik maliyet hesabı: (tüm giderler / toplam çalışma saati) — bu formül doğru mu?
3. Toplam çalışma saatini otomatik çekmeli miyiz? (personel-saat tablosundan)
4. KDV dahil/hariç ayrımı gerekli mi?
5. Gider kalemlerini ay içinde güncellemek gerekirse ne olacak? (Revizyon sistemi)
6. Hangi 3 rakam yöneticinin her gün görmesi gerekiyor? (Dashboard için)
7. Fason fiyat hesabı: Saatlik maliyet + kâr marjı = fason fiyat — bu mantık eklensin mi?

## FORMAT
Her soruya kısa, net cevap ver.
Sonuna: "AMELE 2 GN:010C ANALİZ TAMAMLANDI" yaz.
`;

async function askGPT(gorev, rütbe, env) {
    console.log(`\n📡 ${rütbe} → GPT'ye gönderiliyor...`);
    const res = await httpPost('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        {
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'Sen bir tekstil üretim yönetim sistemi analisti ve askeri disiplin içinde çalışan bir kurul üyesisin. Sorulan her soruya kısa, net, uygulanabilir cevap verirsin.' },
                { role: 'user', content: gorev }
            ],
            max_tokens: 2000,
            temperature: 0.3
        }
    );
    return res?.choices?.[0]?.message?.content || 'HATA: ' + JSON.stringify(res).slice(0, 200);
}

async function main() {
    console.log('⚔️ ÜSTEĞMEN GÖREV EMRİ — GN:20260301-010');
    console.log('══════════════════════════════════════════');
    console.log('🎯 3 Askere paralel görev gönderiliyor...\n');

    const env = loadEnv();
    if (!env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY bulunamadı .env.local dosyasında');
        process.exit(1);
    }

    const baslangic = Date.now();

    // 3 askere paralel görev gönder
    const [askerSonuc, amele1Sonuc, amele2Sonuc] = await Promise.allSettled([
        askGPT(ASKER_GOREV, '🔴 ASKER (Üretim Girişi)', env),
        askGPT(AMELE1_GOREV, '🔵 AMELE 1 (Personel Saat)', env),
        askGPT(AMELE2_GOREV, '🟡 AMELE 2 (Maliyet)', env)
    ]);

    const sure = ((Date.now() - baslangic) / 1000).toFixed(1);
    const tarih = new Date().toISOString();

    const asker = askerSonuc.status === 'fulfilled' ? askerSonuc.value : 'HATA: ' + askerSonuc.reason;
    const amele1 = amele1Sonuc.status === 'fulfilled' ? amele1Sonuc.value : 'HATA: ' + amele1Sonuc.reason;
    const amele2 = amele2Sonuc.status === 'fulfilled' ? amele2Sonuc.value : 'HATA: ' + amele2Sonuc.reason;

    const rapor = `════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
════════════════════════════════════════════════════

# ÜSTEĞMEN GÖREV RAPORU — GN:20260301-010
## Tarih: ${tarih}
## Süre: ${sure} saniye

---

## 🔴 ASKER RAPORU — Üretim Girişi Analizi (GN:010A)

${asker}

---

## 🔵 AMELE 1 RAPORU — Personel Saat Analizi (GN:010B)

${amele1}

---

## 🟡 AMELE 2 RAPORU — Maliyet Analizi (GN:010C)

${amele2}

---

## 📋 ÜSTEĞMEN NOTU

3 askerin analizi tamamlandı.
Komutanın/Koordinatörün onayına sunulmuştur.
Onay gelince düzeltmeler uygulanacak.

[GK:USTEGMEN-010]
════════════════════════════════════════════════════
`;

    const raporDosya = path.join(__dirname, `ustegmen-rapor-GN010-${new Date().toISOString().split('T')[0]}.md`);
    fs.writeFileSync(raporDosya, rapor, 'utf8');

    console.log('\n══════════════════════════════════════════');
    console.log('✅ 3 ASKER GÖREVİ TAMAMLANDI');
    console.log(`⏱️  Süre: ${sure} saniye`);
    console.log(`📄 Rapor: ${raporDosya}`);
    console.log('══════════════════════════════════════════\n');
    console.log('👉 Raporu okuyun ve onay verin.');
}

main().catch(err => {
    console.error('❌ HATA:', err.message);
    process.exit(1);
});
