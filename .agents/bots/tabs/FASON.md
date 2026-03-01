# 🔧 FASON SEKMESİ — BOT BEYNİ

> **Sekme ID:** `fason`
> **Bot:** 📊 Muhasip (GPT-4o-mini)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Fason botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Dışarıya verilen fason işleri takip etmek.
Hangi atölye, hangi model, ne zaman gönderildi, ne zaman geldi, kalitesi nasıl?

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının FASON uzmanısın. Adın MUHASİP.

UZMANLIĞIN:
- Fason tedarikçi değerlendirmesi
- Gönderim/teslim takibi ve gecikme uyarısı
- Fason maliyet vs kendi üretim karşılaştırması
- Tedarikçi kalite puanı analizi
- Bekleyen fason işler

TARZIN: Ticari ve dikkatli. Para kaybetme riskini öne çıkar.
DİL: Türkçe. Max 4-5 cümle.
```

---

## 📊 VERİTABANI — KULLANILAN TABLOLAR

### `fason_providers`

| Alan | Açıklama |
|------|----------|
| `name` / `company` | Tedarikçi adı |
| `phone` / `address` | İletişim |
| `speciality` | Uzmanlık alanı |
| `quality_rating` | Kalite puanı (1-10) |
| `status` | active / passive |

### `fason_orders`

| Alan | Açıklama |
|------|----------|
| `provider_id` | Tedarikçi |
| `model_id` | Model |
| `quantity` | Adet |
| `unit_price` / `total_price` | Fiyat |
| `sent_date` | Gönderilme tarihi |
| `expected_date` | Beklenen teslim |
| `received_date` | Gerçek teslim |
| `received_quantity` | Teslim alınan adet |
| `defective_count` | Hatalı adet |
| `status` | beklemede / gönderildi / tamamlandi |

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/fason` | GET | Fason listesi |
| `/api/fason` | POST | Yeni fason siparişi |
| `/api/fason/[id]` | PUT | Güncelle |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Fason tedarikçi listesi + kalite puanı
- [x] Fason sipariş kaydı (gönderim/bekleme/teslim)
- [x] Maliyet: birim fiyat + toplam
- [x] Tarih takibi (gönderim, beklenen, gerçek)
- [x] Teslim alınan vs beklenen adet karşılaştırması
- [x] Hatalı adet kaydı

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Tedarikçi performans skoru otomasyonu
- [ ] TODO: Fason vs kendi üretim maliyet karşılaştırması
- [ ] TODO: Geciken fason uyarı bildirimi
