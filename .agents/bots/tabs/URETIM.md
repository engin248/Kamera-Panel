# 🔩 ÜRETİM AŞAMASI SEKMESİ — BOT BEYNİ

> **Sekme ID:** `production`
> **Bot:** 🔩 Kamera (Gemini 2.0 Flash)
> **Son Güncelleme:** 2026-03-03
> **Bu dosya:** Üretim botu için tek bilgi kaynağı

---

## ⚠️ ANTİGRAVİTY ANALİZ NOTU (2026-03-03)

| # | Eksik | Önem | Düzeltime |
|---|-------|------|----------|
| 1 | `unit_value` alanı var ama prim hesabına bağlı değil | Kritik | TODO eklendi |
| 2 | 5. pencere için veri akışı tanımsız | Yüksek | Cross-tab güncellendi |
| 3 | Vardiya yönetimi modulu eksik (şu an TODO durumunda) | Orta | Mevcut |
| 4 | Bot prompt Katkı Değeri hesabı bilmiyor | Yüksek | Prompt güncellendi |
| 5 | Supabase geçiş hazırlığı yok | Yüksek | TODO eklendi |

---

## 🎯 BU SEKMENİN AMACI

Günlük üretim verilerini kayıt altına almak.
Kim, hangi modelde, kaç adet, kaç hatalı — anlık takip.
OEE, FPY, takt zamanı gibi verimlilik metrikleri burada hesaplanır.

**Vizyon Prensibi:** Bu sekme prim sisteminin ham verisini üretir.
Girilen `unit_value` ve `total_produced` bilgisi Katkı Değeri hesabının temelidir.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının ÜRETİM ANALİSTİSİN. Adın KAMERA.

UZMANLIĞIN:
- Günlük üretim takibi (adet, hata, süre)
- OEE (Overall Equipment Effectiveness) analizi
- FPY (First Pass Yield) — ilk geçiş verimi
- Takt zamanı hesabı
- Vardiya bazlı üretim karşılaştırması
- Hangi personelin nerede sıkıştığını tespit etme
- Günlük hedef vs gerçek üretim
- **KATKI DEĞERİ HESABI:** SUM(toplam_adet x birim_deger x (1 - hata_orani)) — Prim temelidir
- Prim analizi (Katkı Değeri hesabı)

TARZIN: Hızlı, sayı odaklı. Grafik gibi düşün — trend var mı?
DİL: Türkçe. Net/kısa. Max 4-5 cümle.

KURAL: Bugünün verisine odaklan. Trend için haftalık bak.
KURAL: Prim hesabı için unit_value doğru girilmeli olduğunu hatırlat.
```

---

## 📊 VERİTABANI — KULLANILAN TABLOLAR

### Ana Tablo: `production_logs`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `model_id` | FK | Hangi model |
| `operation_id` | FK | Hangi operasyon |
| `personnel_id` | FK | Hangi personel |
| `start_time` | DATETIME | Başlangıç |
| `end_time` | DATETIME | Bitiş |
| `total_produced` | INTEGER | Üretilen adet |
| `defective_count` | INTEGER | Hatalı adet |
| `defect_reason` | TEXT | Hata nedeni |
| `defect_source` | TEXT | operator / machine / material |
| `defect_photo` | TEXT | Hata fotoğrafı |
| `defect_classification` | TEXT | Hata sınıfı |
| `oee_score` | REAL | OEE % (0-100) |
| `first_pass_yield` | REAL | FPY % (0-100) |
| `takt_time_ratio` | REAL | Takt zamanı oranı |
| `quality_score` | REAL | Kalite puanı |
| `unit_value` | REAL | Birim değer (₺) |
| `net_work_minutes` | REAL | Net çalışma suresi (dk) |
| `notes` | TEXT | Notlar |

### İlişkili Tablolar

- `models` → Hangi modelden bahsediyoruz
- `operations` → Hangi operasyonda
- `personnel` → Kim yaptı
- `uretim_giris` → Parti kayıtları

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/production` | GET | Üretim loglarını listele |
| `/api/production` | POST | Yeni üretim kaydı ekle |
| `/api/uretim-ozet` | GET | Günlük özet (hedef, FPY, OEE) |
| `/api/uretim-giris` | GET | Parti listesi |
| `/api/uretim-giris` | POST | Yeni parti oluştur |
| `/api/personel-saat` | POST | Giriş/çıkış kaydı |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Günlük üretim giriş formu
- [x] Model + Operasyon + Personel seçimi
- [x] Üretilen adet + hatalı adet girişi
- [x] Hata nedeni ve kaynağı (operatör/makine/malzeme)
- [x] OEE, FPY, takt zamanı otomatik hesaplama
- [x] Kalite skoru
- [x] Hata fotoğrafı yükleme
- [x] Günlük hedef çubuğu (GunlukHedefBar bileşeni)
- [x] Üretim parti bağlantısı (PartiBaglantisi bileşeni)
- [x] Sesli komut: "Ahmet 50 adet tamamladı"
- [x] Sesli komut: "Mehmet giriş yaptı / çıkış yaptı"
- [x] Üretim özetini görme (/api/uretim-ozet)
- [x] Soft-delete

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Vardiya yönetimi modülü
- [ ] TODO: Saatlik üretim grafiği (canlı)
- [ ] TODO: Personel bazlı benchmark karşılaştırması
- [ ] TODO: Otomatik hata sınıflandırma (AI ile)
- [ ] TODO: Üretim tahmin motoru (bir sonraki vardiya)
- [ ] **TODO (KRİTİK): Katkı Değeri ÷zeti hesapla** — her personel için aylık SUM(adet x birim_deger x (1-hata_%)) tablosu
- [ ] **TODO (KRİTİK): unit_value doğrulama** — giriş yapılırken birim değer yoksa uyarı ver
- [ ] TODO: Supabase geçiş — `production_logs` ve `uretim_giris` tabloları
- [ ] TODO: 5. Pencere (Rapor) için günlük/aylık veri özeti API end-point

---

## 📐 METRİKLER TANIMI

| Metrik | Formül | İdeal Değer |
|--------|--------|-------------|
| OEE | Kullanılabilirlik × Performans × Kalite | > %85 |
| FPY | (Toplam - Hatalı) / Toplam × 100 | > %95 |
| Takt Zamanı Oranı | Gerçek süre / Standart süre | ≈ 1.0 |
| Kalite Skoru | (1 - hata_oranı) × 100 | > %95 |

---

## 💬 HIZLI KOMUTLAR (Bot için)

| Soru | Botu Ne Yapacak |
|------|-----------------|
| "Bugün kaç adet üretildi?" | total_produced toplamı |
| "En çok hata nerede?" | defect_reason + personel analizi |
| "OEE ortalaması ne kadar?" | oee_score ortalaması |
| "Günlük hedefe ulaştık mı?" | /api/uretim-ozet verisi |
| "En verimli vardiya hangisi?" | start_time'a göre gruplama |

---

## 🔗 CROSS-TAB ENTEGRASYON

| İlişki | Tablo | Nasıl Bağlı |
|--------|-------|-------------|
| **Modeller** | `models` | Hangi modeli üretiyoruz — `model_id` FK |
| **Personel** | `personnel` | Kim çalışıyor — `personnel_id` FK |
| **Siparişler** | `orders` | Hangi sipariş için üretim yapılıyor |
| **Kalite** | `quality_checks` | FPY/OEE skorları kalite sekmesini besler |
| **Maliyet** | `cost_entries` | `unit_value` → maliyet analizine gider |
| **5. Pencere (Rapor)** | `production_logs` | Günlük/aylık verimlilik özeti + Katkı Değeri |

---

## 🏗️ COMPONENT MİMARİSİ (page.js)

```
UretimAsamasiSekmesi   → Ana sekme bileşeni
  ├── GunlukHedefBar       → /api/uretim-ozet verisi, hedef çubuğu
  ├── PartiBaglantisi      → /api/uretim-giris parti listesi
  ├── UretimGirisFormu     → production_logs POST formu
  │     ├── Model/Op/Personel seçimi (dropdown)
  │     ├── Üretilen/Hatalı adet girişi
  │     └── OEE/FPY otomatik hesaplama
  └── SesliKomutButonu     → parseVoiceCommand() ile doğal dil komutu
```

> **ÖNEMLİ:** page.js TEK DOSYA (12k+ satır). Tüm bileşenler inline fonksiyon.

---

## 🤖 CODING AGENT TALİMATLARI

### Yeni Üretim Metriği Eklemek

1. **DB:** `db.js` → alterStatements'a `ALTER TABLE production_logs ADD COLUMN yeni_metrik REAL DEFAULT 0` ekle
2. **API GET:** `/api/production/route.js` SELECT sorgusuna alan ekle  
3. **API POST:** `/api/uretim-ozet/route.js` veya `/api/production/route.js` POST'ta hesapla  
4. **UI:** `page.js` içinde `UretimAsamasiSekmesi` fonksiyonuna yeni input/display ekle
5. **Form state:** `useState` içindeki form objesine alan ekle

### Sesli Komut Eklemek

1. `parseVoiceCommand()` fonksiyonunu bul (page.js ~satır 300)
2. Yeni regex pattern ekle
3. `handleVoiceCommand()` içine case ekle

---

## 🔄 VERİ AKIŞI

```
Tablet/Form
  → POST /api/production (production_logs kaydı)
  → GET /api/uretim-ozet?tarih=YYYY-MM-DD (GunlukHedefBar)
  → GET /api/personel-saat (giriş/çıkış takibi)
  → UI: OEE/FPY/Takt otomatik hesaplanır ve gösterilir
```

---

## ⚠️ ÖNEMLİ KISITLAMALAR

- `page.js` inline bileşenler — ayrı dosya yok
- `production_logs` soft-delete: `deleted_at` sütunu var
- OEE/FPY hesabı → API'de değil, formda JavaScript ile anlık hesaplanır
- Sesli komut sadece Chrome/Edge'de çalışır

---

## 📝 BOT GÜNCELLEME KURALI

**Bu dosyayı şu durumlarda güncelle:**

- Yeni production_logs sütunu eklendiyse → Tablo güncelle
- Yeni metrik formülü eklendiyse → Metrikler tablosu güncelle
- Yeni özellik eklendiyse → `[x]` yap
- Yeni TODO belirlediyse → `[ ]` ekle
