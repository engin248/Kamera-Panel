# 📋 KAMERA-PANEL — TAM KAPSAMLI İŞ PLANI
>
> **Tarih:** 2026-03-03 | **Toplam Görev:** ~200+ | **Tamamlanan:** ~12

---

## ✅ TAMAMLANANLAR

### Supabase Geçişi

- [x] personnel API + test (4 kayıt canlı)
- [x] models/route.js → Supabase
- [x] models/[id]/route.js → Supabase
- [x] models/[id]/operations/route.js → Supabase
- [x] machines/route.js → Supabase + test
- [x] costs/route.js + costs/[id]/route.js → Supabase
- [x] isletme-gider/route.js → Supabase
- [x] rapor/ay-ozet/route.js → Supabase
- [x] rapor/personel-verimlilik/route.js → Supabase

### Veritabanı

- [x] 22 Supabase tablosu SQL hazır + uygulandı
- [x] RLS politikaları tüm tablolar için uygulandı
- [x] models: 56 kolon, operations: 29 kolon doğrulandı

### Dokümantasyon

- [x] GEMİNİ YAPILAN İŞLEMLER klasörü (12 MD dosyası)

---

## 🔴 BLOK A — SUPABASE GEÇİŞ (API KATMANI)

*Her API için: okunuyor → Supabase yazılıyor → test edilip kapatılıyor*

### A1. Üretim

- [ ] production/route.js GET → Supabase
- [ ] production/route.js POST → Supabase (OEE/FPY hesaplama dahil)
- [ ] production/[id]/route.js GET → Supabase
- [ ] production/[id]/route.js PUT → Supabase
- [ ] production/[id]/route.js DELETE (soft) → Supabase
- [ ] production'dan sonra models.completed_count otomatik güncelleme → test
- [ ] production'dan sonra personnel performans otomatik güncelleme → test
- [ ] unit_value = operations.unit_price × total_produced → doğrulama testi
- [ ] katki_degeri_tutari = birim_deger × total_produced → doğrulama testi

### A2. Siparişler

- [ ] orders/route.js GET (liste + filtre) → Supabase
- [ ] orders/route.js POST → Supabase
- [ ] orders/[id]/route.js GET → Supabase
- [ ] orders/[id]/route.js PUT → Supabase
- [ ] orders/[id]/route.js DELETE (soft) → Supabase
- [ ] orders ↔ customers FK bağlantı testi
- [ ] orders ↔ models FK bağlantı testi

### A3. Müşteriler

- [ ] customers/route.js GET → Supabase
- [ ] customers/route.js POST → Supabase
- [ ] customers/[id]/route.js GET → Supabase
- [ ] customers/[id]/route.js PUT → Supabase
- [ ] customers/[id]/route.js DELETE (soft) → Supabase

### A4. Fason

- [ ] fason/route.js GET + POST → Supabase (fason_providers)
- [ ] fason/orders/route.js GET + POST → Supabase (fason_orders)
- [ ] fason/orders/[id]/route.js GET + PUT + DELETE → Supabase
- [ ] fason FK: provider_id → fason_providers, model_id → models testi
- [ ] fason-fiyat-hesapla/route.js → Supabase verisiyle hesaplama testi

### A5. Sevkiyat

- [ ] shipments/route.js GET + POST → Supabase
- [ ] shipments/[id]/route.js GET + PUT + DELETE → Supabase
- [ ] shipments ↔ customers + models FK testi

### A6. Kalite Kontrol

- [ ] quality-checks/route.js GET + POST → Supabase
- [ ] quality-checks/[id]/route.js GET + PUT + DELETE → Supabase
- [ ] quality-checks ↔ production_logs FK testi
- [ ] İlk ürün onay: check_number = 1,2,3 → onay kuyruğuna düşüyor mu?

### A7. Prim

- [ ] prim/route.js GET → Supabase (prim_kayitlari oku)
- [ ] prim/route.js POST → Supabase (hesaplanmış prim kaydet)
- [ ] Prim formülü: katki_degeri - maas_maliyeti > 0 ise prim → test
- [ ] Aynı ay-yıl-personel tekrar kaydı UNIQUE constraint testi

### A8. Onay Kuyruğu

- [ ] approvals/route.js GET + POST + PUT → Supabase (approval_queue)
- [ ] Onay akışı: pending → approved/rejected → audit_trail kaydı

---

## 🟡 BLOK B — DESTEK API GEÇİŞLERİ

### B1. Personel Saati

- [ ] personel-saat/route.js GET → Supabase (personel_saat tablosu)
- [ ] personel-saat/route.js POST → Supabase (giriş/çıkış kaydı)
- [ ] Günlük net çalışma dakikası hesaplama testi

### B2. Haftalık Personel

- [ ] personel-haftalik/route.js → Supabase
- [ ] 7 günlük özet: devam, üretim, hata → toplam testi

### B3. Çalışma Takvimi

- [ ] work-schedule/route.js GET + POST + PUT + DELETE → Supabase
- [ ] monthly_work_days GET + POST → Supabase

### B4. Üretim Girişi (Parti/Lot)

- [ ] uretim_giris tablosu → Supabase SQL YAZ + uygula (EKSİK!)
- [ ] uretim-giris/route.js → Supabase + test
- [ ] Lot değişim kaydı (lot_changes JSON) → test

### B5. Üretim Özet

- [ ] uretim-ozet/route.js → Supabase + test
- [ ] Günlük üretim özeti hesaplama testi

### B6. SGK ve Maaş

- [ ] personel/sgk/route.js → Supabase + test
- [ ] SGK hesaplama: base_salary × 0.205 → doğrulama

### B7. Audit Trail

- [ ] audit-trail/route.js → Supabase (audit_trail tablosu)
- [ ] Her models PUT → audit kayıt testi
- [ ] Her personnel PUT → audit kayıt testi

### B8. Giderler

- [ ] expenses/route.js → Supabase + test (business_expenses ile fark var mı kontrol)

### B9. Makine Bakım

- [ ] machines/[id]/route.js PUT (bakım tarihi güncelleme) → test
- [ ] next_maintenance geçtiyse uyarı → test

### B10. Model Operasyonlar (ESKİ ROUTE)

- [ ] model-operasyonlar/route.js → sil mi yoksa Supabase mi? (models/[id]/operations ile çakışıyor mu kontrol)

---

## 🟡 BLOK C — RAPOR API GEÇİŞLERİ

- [ ] rapor/ay-muhasebe/route.js → Supabase + test
- [ ] rapor/model-karlilik/route.js → Supabase + test
- [ ] rapor/karar-arsivi/route.js → Supabase (karar_arsivi tablosu) + test
- [ ] rapor/prim-onay/route.js → Supabase (prim onay listesi) + test
- [ ] rapor/sirala-kaydet/route.js → Supabase + test

---

## 🟡 BLOK D — ÖZEL SERVİSLER

### D1. Dosya Yükleme

- [ ] upload/route.js → hata fotoğrafı yükleme çalışıyor mu test
- [ ] model ön/arka fotoğraf yükleme → test
- [ ] operasyon doğru/yanlış fotoğraf yükleme → test
- [ ] video_path kaydı → test
- [ ] audio_path kaydı → test

### D2. AI Vision

- [ ] model-vision/route.js → foto → otomatik bilgi çıkarımı test

### D3. Sesli Komut

- [ ] voice-command/route.js → ses → yazıya çevirme test
- [ ] Onay akışı: yazı kullanıcıya gösteriliyor mu?
- [ ] KURAL: onaysız ses komutu sisteme gitmiyor mu?

### D4. Admin

- [ ] admin/route.js → neler yapıyor? → analiz + test

### D5. AI Kurul

- [ ] ai-kurul/route.js → karar önerisi üretiyor mu test

---

## 🟢 BLOK E — PRİM MOTORU (SİSTEMİN ADALET MOTORU)

- [ ] Prim formülü BOLUM-URETIM-FASON ile SISTEM-GENEL çelişkisini çöz → tek formül belirle
- [ ] Katki Degeri = SUM(uretilen × birim_deger × (1 - hata_orani)) → hesaplama testi
- [ ] Maas Maliyeti = base_salary + yol + yemek + SGK → hesaplama testi
- [ ] Fazla Deger = Katki - Maas → pozitif mi negatif mi testi
- [ ] Prim = Fazla Deger × Prim Orani (sadece pozitifse) → testi
- [ ] prim_kayitlari aylık otomatik kayıt
- [ ] Personel kendi primini görüyor mu → UI testi
- [ ] Yönetici toplu prim raporu → UI testi
- [ ] Prim onay: hesaplandi → onaylandi → odendi akışı testi
- [ ] Ödenen prim geri alınamaz → sistem koruması testi

---

## 🟢 BLOK F — PENCERE/SEKME TESTLER (UI)

### F1. Modeller Penceresi

- [ ] Model listesi → kart görünümü çalışıyor mu?
- [ ] Arama (model adı / kodu) → çalışıyor mu?
- [ ] Filtre: Müşteri, Durum, Zorluk → çalışıyor mu?
- [ ] Yeni model ekleme formu → tüm alanlar kaydoluyor mu?
- [ ] Model kodu UNIQUE kontrolü → hata mesajı geliyor mu?
- [ ] Ön/arka fotoğraf yükleme → çalışıyor mu?
- [ ] Ölçü tablosu (JSONB) → kaydediliyor mu, okunuyor mu?
- [ ] Operasyon ekleme → sıra numarası otomatik artıyor mu?
- [ ] Operasyon silme → sıra yeniden düzenleniyor mu?
- [ ] total_operations sayacı güncelleniyor mu?
- [ ] Model soft-delete → listeden kayboluyor mu?
- [ ] Model klonlama → çalışıyor mu?

### F2. Personel Penceresi

- [ ] Personel listesi → 4 personel geliyor ✅
- [ ] Kart görünümü: foto avatar, isim, sınıf, bölüm → doğru mu?
- [ ] P1-P11 tüm alanlar kaydoluyor mu?
- [ ] Beceri/makine seçimi (coklu) → kaydoluyor mu?
- [ ] Devam takibi → giriş/çıkış saati kaydı → test
- [ ] Şifre/PIN → portal_pin kaydı → test
- [ ] Verimlilik skorları (production'dan): daily_avg_output, error_rate, efficiency_score → otomatik güncelleniyor mu?
- [ ] Prim özeti sayfası → görünüyor mu?
- [ ] Personel soft-delete → liste güncelleniyor mu?

### F3. Üretim Aşaması Penceresi (ANA ÇALIŞMA EKRANI)

- [ ] Personel dropdown → bugün aktif personel geliyor mu?
- [ ] Model dropdown → aktif modeller geliyor mu?
- [ ] Operasyon dropdown → seçilen modelin operasyonları geliyor mu?
- [ ] Üretim kaydı formu → tüm alanlar kaydoluyor mu?
- [ ] OEE otomatik hesaplama → doğru mu?
- [ ] FPY otomatik hesaplama → doğru mu?
- [ ] Hata adedi > üretilen → hata uyarısı geliyor mu?
- [ ] Hata türü seçimi (coklu) → kaydoluyor mu?
- [ ] Hata fotoğrafı yükleme → çalışıyor mu?
- [ ] Canlı üretim tablosu → kayıt sonrası güncelleniyor mu?
- [ ] models.completed_count → kayıt sonrası artıyor mu?
- [ ] Kayıt düzenleme (PUT) → çalışıyor mu?
- [ ] Kayıt silme (soft-delete) → çalışıyor mu?

### F4. Parti/Lot Yönetimi

- [ ] uretim_giris tablosu Supabase'de var mı? (EKSİK!)
- [ ] Yeni parti oluşturma → kaydoluyor mu?
- [ ] Parti listesi → durum/ilerleme görünüyor mu?
- [ ] Lot değişimi kayıt → sebep seçimi + kaydoluyor mu?
- [ ] Geciken partiler kırmızı uyarı → çalışıyor mu?

### F5. Kalite Kontrol

- [ ] Kalite kontrol kaydı formu → çalışıyor mu?
- [ ] Sonuç: GEÇTI / REDDEDİLDİ / UYARI → kaydoluyor mu?
- [ ] Hata fotoğrafı (çoklu) → yükleniyor mu?
- [ ] İlk ürün onay kuyruğu (3 adet) → kuyruğa düşüyor mu?
- [ ] Onay / Red işlemi → üretim devam mı, durdurma mı?
- [ ] Hata analiz özeti grafiği → veri geliyor mu?

### F6. Fason

- [ ] Tedarikçi listesi → geliyor mu?
- [ ] Fason sipariş oluşturma → kaydoluyor mu?
- [ ] Durum güncelleme: beklemede→gönderildi→tamamlandı → çalışıyor mu?
- [ ] Kalite değerlendirme (1-5) → kaydoluyor mu?

### F7. Maliyet

- [ ] Model bazlı maliyet girişi → kaydoluyor mu?
- [ ] total = amount × quantity otomatik hesaplama → doğru mu?
- [ ] Maliyet özeti (model başına) → geliyor mu?
- [ ] İşletme giderleri → ay/yıl bazında geliyor mu?
- [ ] Kar marjı hesaplama → doğru mu?

### F8. Prim ve Üret (PENCERE YAPILMADI - KRİTİK)

- [ ] Prim ve Üret sekmesi UI YOK → oluşturulacak
- [ ] Personel prim kartelası → her personel için ayrı
- [ ] Formül açıklaması gösterimi
- [ ] Geçen aya kıyaslama
- [ ] Yönetici toplu prim raporu

### F9. Raporlar

- [ ] Günlük rapor → veriler doğru mu?
- [ ] Haftalık üretim çizgi grafiği → çalışıyor mu?
- [ ] Personel performans tablosu → sıralama doğru mu?
- [ ] Aylık prim hesaplamaları → gösteriliyor mu?
- [ ] Karar karşılaştırma raporu → sistem önerisi vs yapılan → çalışıyor mu?
- [ ] PDF export → çalışıyor mu?

---

## 🟢 BLOK G — BOT SİSTEMİ

- [ ] chatbot/route.js → Supabase canlı veri okusun
- [ ] Kamera botu (Gemini 2.0 Flash) → üretim soruları cevaplıyor mu?
- [ ] Muhasip botu (GPT-4o-mini) → maliyet/prim soruları
- [ ] Tekniker botu (DeepSeek) → model/operasyon soruları
- [ ] Kaşif botu (Perplexity) → piyasa araştırması
- [ ] Bot cevap → veri yoksa "panelden kontrol edin" diyip uydurmıyor mu?
- [ ] Bot geçmiş: son 6-8 mesaj gönderiliyor mu?
- [ ] Bot max token 600 → aşıyor mu?
- [ ] Sesli komut → ses→yazı→onay→kayıt akışı

---

## 🟢 BLOK H — GÜVENLİK & YETKİ

- [ ] auth/login/route.js → Supabase users tablosuna bağla
- [ ] Rol bazlı erişim: koordinator / ustabasi / kaliteci / operator / muhasip
- [ ] operator: sadece tablet ekranı görmeli → kontrol
- [ ] personel: sadece kendi portalı → kontrol
- [ ] koordinator: her şeye erişim → kontrol
- [ ] Yetkisiz erişim → engelleniyor + audit_trail'e kaydediliyor mu?
- [ ] RLS politikaları personel için (kendi prim verisini görsün) → test
- [ ] .env.local güvenliği → Service Role Key sızıyor mu? → kontrol

---

## 🟢 BLOK I — ENTEGRASYON & ÇAPRAZ KONTROL

- [ ] models → operations cascade delete test
- [ ] production_logs → models.completed_count otomatik güncelleme
- [ ] production_logs → personnel performans otomatik güncelleme
- [ ] prim_kayitlari → production_logs veriyle tutarlılık testi
- [ ] kar_zarar_ozet → business_expenses + production_logs toplamları testi
- [ ] karar_arsivi → sistem önerisi kaydediliyor mu?
- [ ] audit_trail → her önemli değişiklik kaydediliyor mu?

---

## 🔵 BLOK J — PERFORMANS & ALTYAPI

- [ ] production_logs indeksleri aktif mi? (model_id, personnel_id, start_time)
- [ ] models indeksleri aktif mi? (code, status, created_at)
- [ ] 100+ üretim kaydında GET yavaşlıyor mu? → limit/pagination testi
- [ ] Supabase bağlantı hatası durumunda → hata mesajı gösteriliyor mu?
- [ ] dev server port çakışması sorunu → sabit port belirlenmeli

---

## 🔵 BLOK K — VERİ GÖÇECEĞİ (SQLITE → SUPABASE)

- [ ] Mevcut SQLite verisi var mı? → kontrol et
- [ ] Mevcut modeller SQLite'da mı? → Supabase'e aktar
- [ ] Mevcut üretim kayıtları SQLite'da mı? → Supabase'e aktar
- [ ] Mevcut müşteri kayıtları SQLite'da mı? → Supabase'e aktar
- [ ] Mevcut sipariş kayıtları SQLite'da mı? → Supabase'e aktar
- [ ] Veri aktarım sonrası tutarlılık kontrolü

---

## 🔵 BLOK L — MİMARİ DOKUMANLAR (GÜNCELLEME)

- [ ] SUPABASE-SEMA.md → SQLite gösterimleri güncelle
- [ ] SISTEM-MIMARI.md API tablosu → yeni endpointler ekle
- [ ] VERITABANI.md → Supabase geçiş durumlarını güncelle
- [ ] BOLUM-URETIM-FASON.md → Yapılan işlemleri işaretle
- [ ] BOT-SISTEMI.md → chatbot durumu güncelle
- [ ] IS-PLANI-PLATFORMLAR.md → durum güncelle

---

## 🔵 BLOK M — 4 BİRİM GENİŞLEME (SONRA)

- [ ] İmalat bölümü sistem tasarımı → BOLUM-IMALAT.md doldur
- [ ] İmalat: hangi personel şu an ne yapıyor? → gerçek zamanlı takip
- [ ] İmalat: dışarıdaki personel nerede? → konum entegrasyonu
- [ ] İmalat: iş kuyruğu → sıradaki görev sistemi
- [ ] Mağaza bölümü sistem tasarımı → BOLUM-MAGAZA.md doldur
- [ ] Mağaza: stok takip
- [ ] Mağaza: satış kaydı
- [ ] Yapay Zeka Ofisi → tüm bölümlerin verisini çapraz analiz
- [ ] Sistem kendi verisiyle öğrenme motoru → karar_arsivi + kar_zarar_ozet
- [ ] Sistem → insan yokken de çalışır hale gelsin (Başarı Kriteri #1)

---

## 📊 GERÇEK İLERLEME TABLOSU

| Blok | Konu | Toplam | Biten | % |
|---|---|---|---|---|
| Tamamlananlar | — | 12 | 12 | 100% |
| A | Üretim+Sipariş+Fason+Kalite API | 45 | 0 | 0% |
| B | Destek API | 22 | 0 | 0% |
| C | Rapor API | 5 | 0 | 0% |
| D | Özel servisler | 12 | 0 | 0% |
| E | Prim motoru | 10 | 0 | 0% |
| F | Pencere/UI testleri | 55 | 1 | 2% |
| G | Bot sistemi | 8 | 0 | 0% |
| H | Güvenlik/yetki | 8 | 0 | 0% |
| I | Entegrasyon testleri | 8 | 0 | 0% |
| J | Performans | 5 | 0 | 0% |
| K | Veri göçü | 6 | 0 | 0% |
| L | Mimari güncelleme | 6 | 0 | 0% |
| M | 4 Birim genişleme | 10 | 0 | 0% |
| **TOPLAM** | | **212** | **13** | **%6** |
