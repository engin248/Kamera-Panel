# 📋 KAMERA-PANEL — İŞ PLANI (Supabase Migration + Sistem Tamamlama)

> **Oluşturma:** 2026-03-03  
> **Yöntem:** Her konu tamamlanınca `[ ]` → `[x]` kapatılır  
> **Bilgi:** Her aşama sonrası rapor verilir  

---

## 🔴 AŞAMA 1 — KRİTİK API GEÇİŞLERİ (Supabase)

*Önce bunlar — sistemin çekirdeği bunlar*

- [ ] **1.1** `production/route.js` → Supabase'e çevir + test
- [ ] **1.2** `production/[id]/route.js` → Supabase + test
- [ ] **1.3** `orders/route.js` + `orders/[id]/route.js` → Supabase + test
- [ ] **1.4** `customers/route.js` + `customers/[id]/route.js` → Supabase + test
- [ ] **1.5** `fason/route.js` + `fason/orders/route.js` + `fason/orders/[id]/route.js` → Supabase + test
- [ ] **1.6** `shipments/route.js` + `shipments/[id]/route.js` → Supabase + test
- [ ] **1.7** `quality-checks/route.js` + `quality-checks/[id]/route.js` → Supabase + test
- [ ] **1.8** `prim/route.js` → Supabase + test

---

## 🟡 AŞAMA 2 — DESTEK API GEÇİŞLERİ (Supabase)

*1. Aşama bittikten sonra*

- [ ] **2.1** `personel-saat/route.js` → Supabase + test
- [ ] **2.2** `work-schedule/route.js` → Supabase + test
- [ ] **2.3** `uretim-giris/route.js` → Supabase + test
- [ ] **2.4** `uretim-ozet/route.js` → Supabase + test
- [ ] **2.5** `audit-trail/route.js` → Supabase + test
- [ ] **2.6** `expenses/route.js` → Supabase + test
- [ ] **2.7** `personel-haftalik/route.js` → Supabase + test
- [ ] **2.8** `personel/sgk/route.js` → Supabase + test
- [ ] **2.9** `approvals/route.js` → Supabase + test
- [ ] **2.10** `model-operasyonlar/route.js` → Supabase + test (veya sil, yeni operations route ile aynı mı kontrol et)
- [ ] **2.11** `auth/login/route.js` → Supabase users tablosuna bağla

---

## 🟡 AŞAMA 3 — RAPOR API GEÇİŞLERİ (Supabase)

- [ ] **3.1** `rapor/ay-muhasebe/route.js` → Supabase + test
- [ ] **3.2** `rapor/model-karlilik/route.js` → Supabase + test
- [ ] **3.3** `rapor/karar-arsivi/route.js` → Supabase + test
- [ ] **3.4** `rapor/prim-onay/route.js` → Supabase + test
- [ ] **3.5** `rapor/sirala-kaydet/route.js` → Supabase + test

---

## 🟡 AŞAMA 4 — EKSİK TABLOLAR (Supabase SQL)

- [ ] **4.1** `uretim_giris` tablosu — Supabase'de YOK, SQL yaz ve uygula
- [ ] **4.2** `katki_degeri_tutari` alanı — production_logs'a doğru yazılıyor mu test et
- [ ] **4.3** `SUPABASE-SEMA.md` güncelle — güncel değil (models hâlâ SQLite gösteriyor)

---

## 🟢 AŞAMA 5 — PRİM MOTORU (SİSTEMİN ADALET MOTORU)

- [ ] **5.1** Prim formülünü tek standartta birleştir (BOLUM-URETIM-FASON.md vs SISTEM-GENEL.md)
- [ ] **5.2** `/api/prim` → Supabase + aylık prim hesaplama
- [ ] **5.3** Prim Özeti ekranı — personel kendi verisini görsün
- [ ] **5.4** Prim Onay akışı — Yönetici onaylar, kayıt audit_trail'e gider
- [ ] **5.5** `prim_kayitlari` tablosuna ay sonu otomatik yazma

---

## 🟢 AŞAMA 6 — KALİTE & KALIP SİSTEMİ

- [ ] **6.1** `quality-checks` API Supabase canlı test
- [ ] **6.2** İlk ürün onay kuyruğu — 3 adet → onay → üretime geç
- [ ] **6.3** Hata analiz özeti raporu (haftalık grafik)

---

## 🟢 AŞAMA 7 — BOT SİSTEMİ (chatbot)

- [ ] **7.1** `chatbot/route.js` → Supabase'den canlı veri okusun (şu an SQLite)
- [ ] **7.2** Kamera botu — üretim verisi soruları cevaplasın
- [ ] **7.3** Muhasip botu — maliyet/prim soruları

---

## 🔵 AŞAMA 8 — YENİ MODÜLLER (4 Birim İş Planı)

- [ ] **8.1** İmalat bölümü — sistem tasarımı
- [ ] **8.2** Mağaza bölümü — sistem tasarımı
- [ ] **8.3** Yapay Zeka Ofisi — çapraz analiz motoru
- [ ] **8.4** Sesli komut sistemi — ses → yazı → onay → kayıt akışı

---

## ✅ TAMAMLANANLAR

- [x] `personnel` → Supabase (4 kayıt canlı, test OK)
- [x] `models/route.js` → Supabase (test OK)
- [x] `models/[id]/route.js` → Supabase
- [x] `models/[id]/operations/route.js` → Supabase
- [x] `machines/route.js` → Supabase (test OK, boş dizi)
- [x] `costs/route.js` + `costs/[id]/route.js` → Supabase
- [x] `isletme-gider/route.js` → Supabase
- [x] `rapor/ay-ozet/route.js` → Supabase
- [x] `rapor/personel-verimlilik/route.js` → Supabase
- [x] 22 Supabase tablosu SQL hazır ve uygulandı
- [x] GEMİNİ YAPILAN İŞLEMLER klasörü — 11 MD dosyası (tam dokümantasyon)
- [x] Sistem çapraz analiz raporu hazırlandı

---

## 📊 İLERLEME

| Aşama | Toplam | Tamamlanan | Yüzde |
|---|---|---|---|
| Aşama 1 — Kritik API | 8 | 0 | 0% |
| Aşama 2 — Destek API | 11 | 0 | 0% |
| Aşama 3 — Rapor API | 5 | 0 | 0% |
| Aşama 4 — Eksik Tablolar | 3 | 0 | 0% |
| Aşama 5 — Prim Motoru | 5 | 0 | 0% |
| Aşama 6 — Kalite | 3 | 0 | 0% |
| Aşama 7 — Bot | 3 | 0 | 0% |
| Tamamlananlar | 10 | 10 | 100% |
| **TOPLAM** | **48** | **10** | **%21** |
