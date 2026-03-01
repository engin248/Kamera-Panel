⚔️ MK:4721 | GN:20260301-012 | FAZ 2 UYGULAMA RAPORU
Süre: 7.2s | 2026-03-01T07:31:48.770Z

## 🔴 ASKER — Sesli Komut parseVoiceCommand() Kodu (GN:012A)

```javascript
function parseVoiceCommand(transcript, models, personnel) {
  const lowerTranscript = transcript.toLowerCase();
  const words = lowerTranscript.split(' ');

  if (words.includes('adet') && words.includes('tamamladı')) {
    const person = words[0];
    const count = parseInt(words[1]);
    return { action: '/api/production', method: 'POST', params: { person, count } };
  }

  if (words.includes('işlem') && words.includes('bitti')) {
    const model = words[1];
    const process = words[3];
    return { action: '/api/production', method: 'POST', params: { model, process } };
  }

  if (words.includes('makine') && words.includes('arızalı')) {
    const machine = words[1];
    return { action: '/api/machines', method: 'PUT', params: { machine, status: 'arizali' } };
  }

  if (lowerTranscript === 'bugünkü üretim kaç') {
    return { action: '/api/production', method: 'GET' };
  }

  if (words.includes('iş') && words.includes('başlat')) {
    const task = words[0];
    return { action: 'handleStart', params: { task } };
  }

  if (lowerTranscript === 'vardiya değişimi') {
    return { action: 'alert', params: { message: 'Vardiya değişimi' } };
  }

  if (lowerTranscript === 'makine durumu') {
    return { action: '/api/machines', method: 'GET' };
  }

  if (lowerTranscript === 'üretim raporu') {
    return { action: '/api/production', method: 'GET', params: { summary: 'daily' } };
  }

  if (words.includes('giriş') && words.includes('yaptı')) {
    const person = words[0];
    return { action: '/api/personel-saat', method: 'POST', params: { person, type: 'giris' } };
  }

  if (words.includes('çıkış') && words.includes('yaptı')) {
    const person = words[0];
    return { action: '/api/personel-saat', method: 'POST', params: { person, type: 'cikis' } };
  }

  return null;
}
```
ASKER GN:012A TAMAMLANDI

---

## 🔵 AMELE 1 — Personel Haftalık + Maaş Tasarımı (GN:012B)

A) SQL Sorgusu — Haftalık Özet:

```sql
SELECT 
    personel_id, 
    YEARWEEK(tarih, 1) AS hafta, 
    SUM(TIMESTAMPDIFF(MINUTE, giris_zamani, cikis_zamani)) AS toplam_dk, 
    SUM(CASE WHEN mesai = 1 THEN TIMESTAMPDIFF(MINUTE, giris_zamani, cikis_zamani) ELSE 0 END) AS mesai_dk
FROM 
    personel_saat_kayitlari
WHERE 
    YEARWEEK(tarih, 1) = YEARWEEK(CURDATE(), 1)
GROUP BY 
    personel_id, hafta;
```

B) Maaş Hesap Formülü:

1. Saatlik ücret hesaplama:
   - Saatlik ücret = daily_wage / 22 / 8

2. Net maaş hesaplama:
   - Net maaş = (toplam_calisma_dk / 60) × saatlik_ucret + (mesai_dk / 60) × (1.5 × saatlik_ucret) + prim - kesinti

C) Haftalık Özet için UI Tasarımı:

- **Personel Sayfası**: 
  - Sekme: "📊 Haftalık Özet"
  
- **Tablo Tasarımı**:
  - Sütunlar: 
    - Ad
    - Bu Hafta Saat
    - Mesai
    - Net Maaş Tahmini

- **Endpoint**:
  - GET `/api/personel-haftalik?hafta=2026-W09`

- **UI Özellikleri**:
  - Kullanıcı, personel sayfasında "📊 Haftalık Özet" sekmesine tıkladığında, yukarıdaki tabloyu görür.
  - Tablo, personelin adını, bu hafta çalıştığı toplam saatleri, mesai saatlerini ve net maaş tahminini gösterir.
  - Kullanıcı, belirli bir haftayı seçerek o haftanın özetini görüntüleyebilir.

AMELE 1 GN:012B TAMAMLANDI

---

## 🟡 AMELE 2 — Fason Fiyat API Kodu (GN:012C)

Aşağıda, belirtilen gereksinimlere göre bir API tasarımı ve `route.js` dosyası örneği bulunmaktadır. Bu örnek, fason fiyat hesaplama işlemini gerçekleştiren bir POST endpoint'i içermektedir.

```javascript
const express = require('express');
const router = express.Router();
const db = require('./db'); // Veritabanı bağlantı modülü

// POST /api/fason-fiyat-hesapla
router.post('/api/fason-fiyat-hesapla', async (req, res) => {
  try {
    const { model_id, kar_marji_yuzde, ek_malzeme_tl, nakliye_tl, toplam_adet } = req.body;

    // Saatlik maliyetin hesaplanması
    const saatlikMaliyetResult = await db.query('SELECT saatlik_maliyet FROM isletme_giderleri ORDER BY tarih DESC LIMIT 1');
    const saatlik_maliyet = saatlikMaliyetResult.rows[0].saatlik_maliyet;

    // Tahmini süre saatinin hesaplanması
    const tahminiSureResult = await db.query('SELECT SUM(standard_time) as toplam_sure FROM operations WHERE model_id = $1', [model_id]);
    const tahmini_sure_saat = tahminiSureResult.rows[0].toplam_sure;

    // Maliyet alt hesaplama
    const maliyet_alt = (saatlik_maliyet * tahmini_sure_saat) + ek_malzeme_tl + nakliye_tl;

    // Fason fiyat hesaplama
    const fason_fiyat = maliyet_alt * (1 + kar_marji_yuzde / 100);

    // Kâr/Zarar sinyali belirleme
    let kar_zarar_sinyal = 'riskli';
    if (kar_marji_yuzde > 0) {
      kar_zarar_sinyal = 'karli';
    } else if (kar_marji_yuzde < 0) {
      kar_zarar_sinyal = 'zararlı';
    }

    // Birim fiyat hesaplama
    const birim_fiyat = fason_fiyat / toplam_adet;

    // Yanıt gönderme
    res.json({
      saatlik_maliyet,
      tahmini_sure_saat,
      maliyet_alt,
      fason_fiyat,
      kar_zarar_sinyal,
      birim_fiyat
    });
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'Fason fiyat hesaplanırken bir hata oluştu.' });
  }
});

module.exports = router;

// AMELE 2 GN:012C TAMAMLANDI
```

### Açıklamalar:
- **Veritabanı Sorguları:** `saatlik_maliyet` ve `tahmini_sure_saat` değerleri veritabanından çekilmektedir. `isletme_giderleri` tablosundan son ayın saatlik maliyeti alınırken, `operations` tablosundan ilgili modelin toplam standart süresi hesaplanmaktadır.
- **Fason Fiyat Hesaplama:** Fason fiyat, maliyet altına kâr marjı eklenerek hesaplanır.
- **Kâr/Zarar Sinyali:** Kâr marjına göre sinyal belirlenir.
- **Birim Fiyat:** Toplam adet ��zerinden birim fiyat hesaplanır.
- **Hata Yönetimi:** Hata durumunda 500 hata kodu ile yanıt verilir.

Bu kod, Express.js kullanarak bir API endpoint'i oluşturur ve belirtilen hesaplamaları gerçekleştirir.

---
[GK:USTEGMEN-012]