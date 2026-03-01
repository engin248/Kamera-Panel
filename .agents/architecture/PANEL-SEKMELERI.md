# 🖥️ PANEL SEKMELERİ — ÖZELLİK LİSTESİ

> **Son Güncelleme:** 2026-03-01  
> Bu dosya her özellik değişikliğinde güncellenir.

---

## 👗 MODELLER SEKMESİ (`models`)

**Bot:** 🛠️ Tekniker (DeepSeek)  
**API:** `/api/models`, `/api/model-operasyonlar`

### Özellikler

- [x] Model listesi (kart görünümü)
- [x] Yeni model oluştur (uzun form — tek sayfa scroll)
- [x] Model detay görünümü
- [x] Ön/arka fotoğraf yükleme
- [x] Operasyon tanımlama (dikim, kesim, ütü, nakış, yıkama kategorileri)
- [x] Operasyon zorluk seviyesi (1-10)
- [x] BOM (malzeme listesi) — parça sayısı + detay
- [x] Beden dağılımı (metin formatı — boşlukla)
- [x] Renk sayısı + asorti
- [x] Tela/astar bilgisi
- [x] Dikim operasyon alt tipleri (Düz Makina, Overlok, Reçme)
- [x] Model zorluk puanı
- [x] Fason fiyatı metin + sayı
- [x] Soft-delete (geri getirilebilir)
- [x] Model görsel AI analizi (`/api/model-vision`)
- [ ] **TODO:** Operasyon videosu yükleme (arayüz var, tam entegrasyon bekliyor)
- [ ] **TODO:** Tedarikçi/kumaş bilgisi alanı

---

## 👥 PERSONEL SEKMESİ (`personnel`)

**Bot:** 🔩 Kamera (Gemini)  
**API:** `/api/personnel`, `/api/personel-saat`, `/api/personel-haftalik`

### Özellikler

- [x] Personel listesi (kart + tablo görünümü)
- [x] P1-P11 kriter formu (11 sekme gruplu)
  - P1: Kimlik & Kişisel (doğum, cinsiyet, eğitim, acil kişi...)
  - P2: İş Geçmişi (sözleşme, SGK tarihi, önceki iş...)
  - P3: Ücret (baz maaş, yol, SSK, yemek, kıdem)
  - P4: Beceri (makineler, parmak becerisi, renk algısı)
  - P5: Makine Ayar (tercihli makine, bakım becerisi)
  - P6: Fiziksel (dayanıklılık, göz sağlığı, ISG tarihi)
  - P7: Karakteristik (güvenilirlik, hijyen, sorumluluk)
  - P8-P9: Üretim & İşlemler (günlük ortalama, hata oranı)
  - P10: Gelişim (öğrenme hızı, motivasyon)
  - P11: Performans (operatör sınıfı A/B/C/D, işi sevme skoru)
- [x] Personel fotoğrafı yükleme
- [x] Giriş/çıkış saati takibi
- [x] Haftalık rapor
- [x] Soft-delete
- [x] Sesli giriş (TR + AR)
- [ ] **TODO:** Prim hesabı entegrasyonu
- [ ] **TODO:** SGK/Bordro raporları

---

## 🔩 ÜRETİM AŞAMASI SEKMESİ (`production`)

**Bot:** 🔩 Kamera (Gemini)  
**API:** `/api/production`, `/api/uretim-giris`, `/api/uretim-ozet`

### Özellikler

- [x] Günlük üretim kaydı giriş formu
- [x] Model + Operasyon seçimi
- [x] Personel seçimi
- [x] Üretilen adet + hatalı adet
- [x] Hata nedeni + kaynağı (operatör/makine/malzeme)
- [x] OEE, FPY, Takt zamanı hesaplamaları
- [x] Kalite skoru
- [x] Hata fotoğrafı
- [x] Günlük hedef çubuğu (GunlukHedefBar)
- [x] Üretim parti bağlantısı (PartiBaglantisi)
- [x] Sesli komut ("Ahmet 50 adet tamamladı")
- [x] Üretim özet API
- [x] Soft-delete
- [ ] **TODO:** Vardiya yönetimi

---

## 💰 MALİYET SEKMESİ (`costs`)

**Bot:** 📊 Muhasip (GPT)  
**API:** `/api/costs`, `/api/fason-fiyat-hesapla`

### Özellikler

- [x] Model bazlı maliyet girişi
- [x] Maliyet kategori ayrımı (kumaş, aksesuar, işçilik, genel)
- [x] Fason fiyat hesaplama (kar marjı + ek malzeme)
- [x] Kar/zarar sinyali
- [x] Soft-delete
- [ ] **TODO:** Otomatik maliyet hesaplama (operasyon × birim fiyat)

---

## 📒 RAPOR & ANALİZ SEKMESİ (`muhasebe`)

**Bot:** 📊 Muhasip (GPT)  
**API:** `/api/expenses`, `/api/isletme-gider`

### Özellikler

- [x] İşletme giderleri listesi (ay/yıl bazlı)
- [x] Sabit gider ekleme
- [x] Aylık gider toplamı
- [ ] **TODO:** Gelir-gider grafiği
- [ ] **TODO:** Personel maaş raporu
- [ ] **TODO:** Model bazlı karlılık grafiği

---

## 📋 SİPARİŞLER SEKMESİ (`orders`)

**Bot:** 🔩 Kamera (Gemini)  
**API:** `/api/orders`, `/api/orders/[id]`

### Özellikler

- [x] Sipariş listesi (durum renkli)
- [x] Yeni sipariş (genişletilmiş form — 21 kriter)
  - Ürün fotoğrafı
  - Beden dağılımı + renk detayı
  - Aksesuar, astar, ambalaj
  - Etiket + yıkama talimatı
  - Numune durumu
  - Kalite kriterleri + dikiş detayı
  - Teslimat yöntemi + özel istekler
- [x] Sipariş durum takibi
- [x] Müşteri bağlantısı
- [x] Model bağlantısı
- [x] Soft-delete (silme sebebi kaydı)
- [ ] **TODO:** Sipariş timeline görünümü

---

## ✅ KALİTE KONTROL SEKMESİ (`quality`)

**Bot:** 🛠️ Tekniker (DeepSeek)  
**API:** `/api/quality-checks`

### Özellikler

- [x] Kalite kontrol kaydı (inline/final)
- [x] Sonuç: ok / red / warning
- [x] Hata tipi
- [x] Fotoğraf ekleme
- [x] Personel + model + operasyon bağlantısı
- [x] İlk ürün onay kuyruğu (`/api/approvals`)
- [x] Soft-delete

---

## 🔧 FASON SEKMESİ (`fason`)

**Bot:** 📊 Muhasip (GPT)  
**API:** `/api/fason`, `/api/fason/[id]`

### Özellikler

- [x] Fason tedarikçi listesi
- [x] Fason sipariş kaydı
- [x] Birim fiyat + toplam
- [x] Gönderim / beklenen / alınan tarihleri
- [x] Alınan adet + hatalı adet
- [x] Durum takibi (beklemede/gönderildi/tamamlandi)

---

## 📦 SEVKİYAT SEKMESİ (`shipments`)

**Bot:** 🔩 Kamera (Gemini)  
**API:** `/api/shipments`, `/api/shipments/[id]`

### Özellikler

- [x] Sevkiyat kaydı
- [x] Müşteri + model bağlantısı
- [x] Adet + tarih
- [x] Kargo firması + takip numarası
- [x] Durum (hazır/gönderildi/teslim)

---

## 🏆 PRİM & ÜRET SEKMESİ (`prim`)

**Bot:** 📊 Muhasip (GPT)  
**API:** —

### Özellikler

- [ ] **TODO:** Prim hesaplama motoru
- [ ] **TODO:** Operatör sınıfına göre teşvik
- [ ] **TODO:** Grup prim sistemi

---

## ⚙️ MAKİNELER SEKMESİ (`machines`)

**Bot:** 🛠️ Tekniker (DeepSeek)  
**API:** `/api/machines`, `/api/machines/[id]`

### Özellikler

- [x] Makine listesi
- [x] Marka, model, seri no
- [x] Satın alım + bakım tarihleri
- [x] Alt tip + kategori
- [x] Makine sayısı
- [x] Makine ayar şablonları
- [x] Soft-delete

---

## 🤝 MÜŞTERİLER SEKMESİ (`customers`)

**Bot:** 🔩 Kamera (Gemini)  
**API:** `/api/customers`, `/api/customers/[id]`

### Özellikler

- [x] Müşteri listesi
- [x] İletişim bilgileri (telefon, email, adres)
- [x] Vergi numarası
- [x] Sipariş geçmişi bağlantısı
- [x] Soft-delete

---

## 📈 RAPORLAR SEKMESİ (`reports`)

**Bot:** 📊 Muhasip (GPT)  
**API:** — (çoklu API birleştirme)

### Özellikler

- [ ] **TODO:** Aylık üretim grafiği
- [ ] **TODO:** Personel karşılaştırmalı performans
- [ ] **TODO:** Model karlılık sıralaması
- [ ] **TODO:** Müşteri sipariş geçmişi

---

## 📊 ANA PANEL SEKMESİ (`dashboard`)

**Bot:** 🔩 Kamera (Gemini)  
**API:** `/api/uretim-ozet`

### Özellikler

- [x] Günlük üretim özeti
- [x] Aktif personel sayısı
- [x] Geciken sipariş uyarısı
- [ ] **TODO:** KPI kartları (7 günlük trend)

---

## ⚙️ AYARLAR SEKMESİ (`settings`)

**Bot:** —  
**API:** `/api/auth`, `/api/work-schedule`

### Özellikler

- [x] Mola çizelgesi düzenleme
- [x] Aylık çalışma günleri
- [x] Kullanıcı yönetimi
- [x] Audit trail görüntüleme

---

## 📝 GÜNCELLEME KURALI

Bu dosyayı şu durumlarda güncelle:

- Yeni özellik eklendiyse → `[x]` yap
- Yeni TODO tespit edildiyse → `[ ]` ile ekle
- Yeni sekme eklendiyse → yeni bölüm aç
- Bot değişikliği varsa → üstteki Bot bilgisini güncelle
