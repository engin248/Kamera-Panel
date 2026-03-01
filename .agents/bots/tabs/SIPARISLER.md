# 📋 SİPARİŞLER SEKMESİ — BOT BEYNİ

> **Sekme ID:** `orders`
> **Bot:** 🔩 Kamera (Gemini 2.0 Flash)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Siparişler botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Müşterilerden gelen siparişleri takip etmek.
Hangi müşteri, hangi model, kaç adet, ne zaman teslim — hepsi burada.
Geciken siparişleri anında görürüz.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının SİPARİŞ uzmanısın. Adın KAMERA.

UZMANLIĞIN:
- Aktif sipariş takibi ve durumu
- Teslimat tarihi ve gecikme uyarısı
- Müşteri bazlı sipariş geçmişi
- Sipariş önceliklendirme (acil/normal/düşük)
- Sipariş-model-üretim bağlantısı
- Kalite kriterleri ve özel talepler

TARZIN: Hızlı ve uyarı odaklı. Geciken varsa VUR.
DİL: Türkçe. Tablo gibi düşün. Max 4-5 cümle.

KURAL: Geciken siparişleri her zaman önce belirt.
```

---

## 📊 VERİTABANI — ANA TABLO: `orders`

| Alan | Açıklama |
|------|----------|
| `order_no` | Sipariş numarası |
| `customer_id` / `customer_name` | Müşteri |
| `model_id` / `model_name` | Model |
| `quantity` | Adet |
| `unit_price` / `total_price` | Fiyat |
| `delivery_date` | Teslimat tarihi |
| `priority` | acil / normal / düşük |
| `status` | siparis_alindi → uretimde → tamamlandi → iptal |
| `fabric_type` / `color` / `sizes` | Kumaş/renk/beden |
| `product_image` | Ürün fotoğrafı |
| `size_distribution` | Beden dağılımı |
| `color_details` | Renk detayı |
| `accessories` | Aksesuar |
| `lining_info` | Astar bilgisi |
| `packaging` | Ambalaj |
| `label_info` | Etiket |
| `washing_instructions` | Yıkama talimatı |
| `sample_status` | Numune durumu |
| `quality_criteria` | Kalite kriterleri |
| `stitch_details` | Dikiş detayları |
| `delivery_method` | Teslimat yöntemi |
| `special_requests` | Özel istekler |
| `deleted_at` | Soft-delete |

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/orders` | GET | Tüm aktif siparişleri listele |
| `/api/orders` | POST | Yeni sipariş ekle |
| `/api/orders/[id]` | GET | Tek sipariş detayı |
| `/api/orders/[id]` | PUT | Sipariş güncelle |
| `/api/orders/[id]` | DELETE | Soft-delete (silme sebebi kayıt) |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Sipariş listesi (durum renkli — açık/teslim/gecikmiş)
- [x] Genişletilmiş sipariş formu (21 kriter alanı)
- [x] Ürün fotoğrafı yükleme
- [x] Beden dağılımı + renk detayı
- [x] Aksesuar, astar, ambalaj, etiket bilgisi
- [x] Yıkama talimatı
- [x] Numune durumu takibi
- [x] Kalite kriterleri + dikiş detayı
- [x] Teslimat yöntemi + özel istekler
- [x] Müşteri bağlantısı (customer_id)
- [x] Model bağlantısı (model_id)
- [x] Geciken sipariş uyarısı
- [x] Soft-delete + silme sebebi kaydı
- [x] Sipariş öncelik sistemi (acil/normal/düşük)

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Sipariş timeline görünümü (Gantt tipi)
- [ ] TODO: Otomatik müşteri bildirimi
- [ ] TODO: Sipariş bazlı üretim ilerleme yüzdesi
- [ ] TODO: Toplu sipariş güncelleme

---

## 💬 HIZLI KOMUTLAR (Bot için)

| Soru | Botu Ne Yapacak |
|------|-----------------|
| "Geciken sipariş var mı?" | delivery_date < bugün olanları listele |
| "Bu hafta teslim edilecekler?" | Bu haftaki delivery_date'leri bul |
| "En acil sipariş hangisi?" | priority='acil' + en yakın tarih |
| "Müşteri X'in siparişi nerede?" | customer_name filtrele + status |
| "Numune bekleyen sipariş?" | sample_status kontrol et |

---

## 📝 BOT GÜNCELLEME KURALI

**Bu dosyayı şu durumlarda güncelle:**

- Siparişe yeni alan eklendiyse → DB tablosu güncelle
- Sipariş bot prompt değiştiyse → System prompt güncelle
- Yeni özellik eklendiyse → `[x]` yap
- Yeni TODO belirlediyse → `[ ]` ekle
