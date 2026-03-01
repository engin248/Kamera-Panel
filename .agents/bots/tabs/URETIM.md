# 🔩 ÜRETİM AŞAMASI SEKMESİ — BOT BEYNİ

> **Sekme ID:** `production`
> **Bot:** 🔩 Kamera (Gemini 2.0 Flash)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Üretim botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Günlük üretim verilerini kayıt altına almak.
Kim, hangi modelde, kaç adet, kaç hatalı — anlık takip.
OEE, FPY, takt zamanı gibi verimlilik metrikleri burada hesaplanır.

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

TARZIN: Hızlı, sayı odaklı. Grafik gibi düşün — trend var mı?
DİL: Türkçe. Net/kısa. Max 4-5 cümle.

KURAL: Bugünün verisine odaklan. Trend için haftalık bak.
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

## 📝 BOT GÜNCELLEME KURALI

**Bu dosyayı şu durumlarda güncelle:**

- Yeni production_logs sütunu eklendiyse → DB tablosu güncelle
- Yeni metrik formülü eklendiyse → Metrikler tablosu güncelle
- Yeni özellik eklendiyse → `[x]` yap
- Yeni TODO belirlediyse → `[ ]` ekle
