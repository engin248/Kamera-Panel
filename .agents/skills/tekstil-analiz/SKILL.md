---
name: Tekstil Sistemi Uzmanı
description: Kamera-Panel tekstil üretim yönetim sistemi için derin analiz, akademik araştırma ve çok yönlü değerlendirme yapma becerisi
---

# 🏭 Tekstil Sistemi Analiz Uzmanlığı

## Bu Skill Ne Zaman Kullanılır?

Koordinatör yeni bir fikir, özellik veya değişiklik getirdiğinde bu skill devreye girer.
Her fikir, kodlamaya başlamadan önce **akademik tez düzeyinde analiz** edilir.

---

## ANALİZ ÇERÇEVESI

### 1. TEZ (Bu neden doğru?)

- İşletmeye katkısı nedir?
- Çalışan verimliliğine etkisi?
- Adil ücretlendirmeye katkısı?
- Sistemi nasıl iyileştirir?

### 2. ANTİTEZ (Riskler neler?)

- Ne yanlış gidebilir?
- Teknik riskler (DB, API, UI)
- İnsan yönetimi riskleri
- Veri güvenliği riskleri
- Uygulama zorlukları

### 3. DÜNYA GENELİ ARAŞTIRMA

Şu başlıklarda araştır:

- Tekstil sektöründe bu konu nasıl ele alınıyor?
- Benzer sistemler hangi ülkelerde, hangi şirketlerde var?
- Akademik literatürde ne söyleniyor?
- Best practices (en iyi uygulamalar) neler?
- Türkiye tekstil sektörü özelde ne yapıyor?

### 4. TEKNİK ANALİZ

- Etkilenecek dosyalar ve risk seviyesi:

```
DOSYA                  | DEĞİŞİKLİK TÜRÜ     | RİSK SEVİYESİ
lib/db.js              | ALTER TABLE          | 🟡 Orta
api/production/route   | GET/POST genişletme  | 🟢 Düşük
app/page.js            | Yeni UI bölümü       | 🟡 Orta
```

- DB şeması değişikliği gerekiyor mu?
- Yeni API endpoint gerekiyor mu?
- Mevcut kodla çakışma riski var mı?

### 5. ALTERNATİF YOLLAR

Her fikir için en az 2 alternatif sun:

```
SEÇENEK A: [Yol 1]
  ✅ Avantajları
  ❌ Dezavantajları
  ⏱️ Tahmini süre

SEÇENEK B: [Yol 2]
  ✅ Avantajları
  ❌ Dezavantajları
  ⏱️ Tahmini süre
```

### 6. TAVSİYE

Hangi seçenek + neden + önce ne yapılmalı?

---

## SEKTÖR REFERANS NOKTALARI

Tekstil üretiminde bilinen standartlar:

| Konu | Standart/Referans |
|------|-------------------|
| Operatör verimliliği | SAM (Standard Allowed Minutes) |
| Kalite | AQL (Acceptable Quality Level) |
| OEE | Dünya ortalaması %60-65, iyi üretici %75+ |
| İplik hataları | ppm (parts per million) |
| İşlem süreleri | SMV (Standard Minute Value) |
| Makine yetkinlik | Takumi sistemi (Japonya), MYK (Türkiye) |

---

## RAPOR FORMATI

Her analiz sonunda şu formatta sun:

```
════════ ANALİZ RAPORU ════════
Konu: [Başlık]
Tarih: [Tarih]

📌 ÖZET: [2 cümle]

📌 TEZ: [3-5 madde]

📌 ANTİTEZ: [3-5 madde]

📌 DÜNYA GENELİ: [3-5 madde + kaynak]

📌 TEKNİK:
  - Etkilenen dosyalar: [Liste]
  - Risk: 🟢 Düşük / 🟡 Orta / 🔴 Yüksek
  - Süre tahmini: [X saat]

📌 SEÇENEKLER:
  A) [...]
  B) [...]

📌 TAVSİYE: [Net karar önerisi]

Koordinatör onayı bekleniyor.
════════════════════════════════
```
