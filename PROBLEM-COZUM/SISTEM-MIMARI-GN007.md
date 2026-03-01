════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
Yaşlı huzurlu, çocuk kaygısız. Bunun için kuruyoruz.
════════════════════════════════════════════════════

# 📋 TAM ANALİZ SONUCU + SİSTEM MİMARİSİ + GÖREV DAGITIMI

## GN:20260301-007 — PAZARTESİ 08:00 HEDEFİ

---

## BÖLÜM 1 — ANALİZ SONUCU (Teğmen + GPT Karşılaştırması)

### KONU 1 — MODEL GİRİŞİ

```
PROBLEM   : Firmadan gelen teknik dosya sisteme girmiyor
GPT DİYOR : EasyOCR (ücretsiz ama zayıf) kullan
TEĞMEN DİY: GPT-4o Vision daha iyi, API zaten var
KARAR     : GPT-4o Vision
NEDEN     : El yazısı, eğri baskı, düşük kalite fotoğrafı okur
            EasyOCR okuyamaz
MALİYET   : ~0.30 TL/model → Ayda 20 model → 6 TL/ay
OFFLINE   : Manuel form (mevcut, çalışıyor)
```

### KONU 2 — PARTİ GİRİŞİ

```
PROBLEM   : Parti gelince eksik kontrol yapılmıyor, kayıt tutulmuyor
GPT DİYOR : Barkod/RFID (pahalı, gereksiz karmaşık)
TEĞMEN DİY: 10 adımlı zorunlu form — atlayamazsan geçemezsin
KARAR     : 10 adımlı form (Teğmen haklı)
NEDEN     : RFID altyapı maliyeti yüksek, form daha hızlı kurulur
MALİYET   : 0 TL
OFFLINE   : SQLite'a yazar, internet gelmeden çalışır
```

### KONU 3 — MODEL DİKİM / SESLİ KOMUT

```
PROBLEM   : Modelci ilk dikimi anlatamıyor, işlem sırası kayıt altına alınamıyor
GPT DİYOR : Whisper tiny (offline) ile başla, online ile devam
TEĞMEN DİY: Browser Speech API sistemde ZATEN VAR, kullan
KARAR     : Browser Speech API → yetmezse Whisper API
NEDEN     : 0 saat kurulum, mevcut kod, 0 maliyet
MALİYET   : 0 TL (Browser) / max 20 TL/ay (Whisper)
DONANIM   : Yaka mikrofonu şart — gürültü meselesi yazılım değil donanım
```

### KONU 4 — SERİ ÜRETİM TAKİBİ

```
PROBLEM   : Kim ne zaman başladı, bitirdi, kaç adet — kayıt yok
GPT DİYOR : Ses + Buton birlikte
TEĞMEN DİY: Mevcut operator sayfasını genişlet — sıfırdan yazmaya gerek yok
KARAR     : Mevcut kod genişletilir (ikisi hemfikir)
MALİYET   : 0 TL
SÜRE      : 3-4 saat (sıfırdan değil, genişletme)
```

### KONU 5 — PERSONEL SAATLERİ

```
PROBLEM   : Giriş/çıkış, mesai, mola takip edilmiyor
GPT DİYOR : Kart OCR (hatalı olabilir)
TEĞMEN DİY: Önce basit tıklama → Sonra QR
KARAR     : Tıklama sistemi (Teğmen haklı)
NEDEN     : OCR kötü ışıkta hata verir, tıklama anında çalışır
MALİYET   : 0 TL
SÜRE      : 2 saat
```

### KONU 6 — MALİYET HESABI

```
PROBLEM   : Ürün maliyeti bilinmiyor, fason kâr/zarar belirsiz
GPT DİYOR : Otomatik hesap (ikisi aynı)
TEĞMEN DİY: Gider formu + SQL otomatik + Fason karar ekranı
KARAR     : İkisi hemfikir
MALİYET   : 0 TL
SÜRE      : 4 saat
```

---

## BÖLÜM 2 — SİSTEM MİMARİSİ

```
┌─────────────────────────────────────────────┐
│              KULLANICI EKRANI               │
│  Tablet / Bilgisayar / Telefon (Chrome)     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           NEXT.JS UYGULAMA                  │
│                                             │
│  /model-giris    → Bot 1 (Model Bot)        │
│  /parti-giris    → Bot 2 (Üretim Bot)      │
│  /operator       → Bot 2 (Üretim Bot)      │
│  /personel       → Bot 3 (Personel Bot)    │
│  /maliyet        → Bot 4 (Maliyet Bot)     │
└──────────┬───────────────────┬──────────────┘
           │                   │
┌──────────▼──────┐  ┌────────▼────────────┐
│   SQLite DB     │  │   DIŞ SERVİSLER     │
│  (Her zaman)    │  │  (İnternet varsa)   │
│                 │  │                     │
│  models         │  │  GPT-4o Vision      │
│  particiler     │  │  (Model okuma)      │
│  production_logs│  │                     │
│  personel_saat  │  │  Browser Speech API │
│  giderler       │  │  (Sesli komut)      │
└─────────────────┘  └─────────────────────┘

İNTERNET YOKSA: Sadece SQLite, sistem çalışmaya devam eder
İNTERNET VARSA: API'ler devreye girer, daha akıllı çalışır
```

---

## BÖLÜM 3 — KİM NE YAPACAK (GÖREV DAGITIMI)

### 🔴 AMELE 1 — PARTI GİRİŞİ & SERİ ÜRETİM BOTUNU YAZAR

```
Görev     : KONU 2 + KONU 4
Ne yapacak: /parti-giris sayfası (10 adımlı form)
            Mevcut /operator sayfasına temizleme/paket ekler
Süre      : 8-9 saat
Teknoloji : Next.js, SQLite, mevcut API
```

### 🔵 AMELE 2 — PERSONEL & MALİYET BOTUNU YAZAR

```
Görev     : KONU 5 + KONU 6
Ne yapacak: /personel sayfasına giriş/çıkış tıklama sistemi
            /maliyet sayfasına gider formu + otomatik hesap
Süre      : 6 saat
Teknoloji : Next.js, SQLite, SQL hesaplama
```

### 🟢 AMELE 3 — MODEL GİRİŞİ & SESLİ KOMUT BOTUNU YAZAR

```
Görev     : KONU 1 + KONU 3
Ne yapacak: /model-giris fotoğraf yükleme + GPT-4o Vision okuma
            Mevcut sesli komut hook'unu işlem sırası kaydına bağlar
Süre      : 9 saat
Teknoloji : Next.js, GPT-4o Vision API, Browser Speech API
```

### 🟡 TEĞMEN — KOORDİNASYON + TEST

```
Görev     : 3 amele arasında koordinasyon
            Her tamamlanan parçayı test eder
            Hata varsa çözer
            Veritabanı şemasını belirler (hepsi aynı DB'yi kullanıyor)
```

---

## BÖLÜM 4 — VERİTABANI ŞEMASI (Yeni tablolar)

```sql
-- Yeni tablolar (mevcut sisteme ek)

parti_girisleri
  id, model_id, getiren_id, acilis_tarihi, kim_acti
  beden_eksik, aksesuar_eksik, kumas_eksik
  numune_ayrildi, parca_sayisi, durum

parca_fotograflari
  id, parti_id, parca_adi, fotograf_yolu

islem_sirasi (model dikim)
  id, model_id, sira_no, islem_adi, nasil_yapilir, ses_kayit_yolu

personel_saat
  id, personel_id, tarih, giris_saat, cikis_saat
  net_sure, mesai_dakika, tur (normal/cumartesi/fazla)

isletme_giderleri
  id, ay, yil, elektrik, su, kira, diger
  toplam_saat, saatlik_maliyet
```

---

## BÖLÜM 5 — ÇALIŞMA TAKVIMI

```
ŞİMDİ — 12:00  : Teğmen DB şemasını yazar (2 saat)
12:00 — 20:00  : Amele 1+2+3 paralel çalışır (8 saat)
20:00 — 23:00  : Test ve hata düzeltme (3 saat)
23:00 — 08:00  : Son cilalama ve yedek (9 saat)
PAZARTESİ 08:00: SİSTEM CANLI
```

---

## ⚠️ ONAY BEKLİYORUM

Bu belge Komutan'ın onayına sunulmuştur.
Onay verildiğinde:

1. Teğmen DB şemasını yazar
2. Her ameleye görevi verilir
3. Paralel çalışma başlar

**[GK:MIMARI-007]**
════════════════════════════════════════════════════
