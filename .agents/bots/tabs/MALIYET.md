# 💰 MALİYET SEKMESİ — BOT BEYNİ

> **Sekme ID:** `costs`
> **Bot:** 📊 Muhasip (GPT-4o-mini)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Maliyet botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Her modelin maliyetini net hesaplamak.
Kumaş, işçilik, genel gider — toplamda bu modelden para kazanıyor muyuz?
Fason fiyatı belirlerken bu verileri kullanırız.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının MALİYET uzmanısın. Adın MUHASİP.

UZMANLIĞIN:
- Model bazlı maliyet analizi
- Kumaş + işçilik + genel gider hesabı
- Fason fiyat önerisi (kar marjı dahil)
- Sipariş bazlı kar/zarar hesabı
- İşletme giderleri analizi
- Karlılık trend analizi

TARZIN: Kesin rakamlar. Yüzde hesapla. Risk varsa UYAR.
DİL: Türkçe. Finansal ama anlaşılır. Max 5-6 cümle.

KURAL: Her cevabı TL cinsinden somut bağla.
```

---

## 📊 VERİTABANI — KULLANILAN TABLOLAR

### `cost_entries` (Maliyet Kalemleri)

| Alan | Açıklama |
|------|----------|
| `model_id` | Hangi model |
| `category` | kumaş / aksesuar / işçilik / genel / diğer |
| `description` | Açıklama |
| `amount` | Birim fiyat (₺) |
| `unit` | metre / adet / kg vb. |
| `quantity` | Miktar |
| `total` | Toplam (amount × quantity) |

### `business_expenses` (İşletme Giderleri)

| Alan | Açıklama |
|------|----------|
| `category` | kira / elektrik / personel / vb. |
| `description` | Açıklama |
| `amount` | Tutar (₺) |
| `year` / `month` | Dönem |
| `is_recurring` | Sabit gider mi? (0/1) |

### İlişkili Tablolar

- `models` → fason_price, total_order (gelir hesabı için)
- `personnel` → base_salary toplamı (işçilik için)
- `production_logs` → unit_value (üretim değeri için)

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/costs` | GET | Model maliyet kalemlerini listele |
| `/api/costs` | POST | Yeni maliyet kalemi ekle |
| `/api/costs/[id]` | DELETE | Kalem sil |
| `/api/expenses` | GET | İşletme giderlerini listele |
| `/api/expenses` | POST | Yeni gider ekle |
| `/api/isletme-gider` | GET | İşletme gider (yeni endpoint) |
| `/api/isletme-gider` | POST | Gider ekle |
| `/api/fason-fiyat-hesapla` | POST | Fason fiyat hesapla |

---

## 🧮 FASON FİYAT HESAPLAMA MANTIĞI

```
POST /api/fason-fiyat-hesapla
{ kar_marji_yuzde: 20, ek_malzeme_tl: 50 }

Hesaplama:
  toplam_iscilik = Σ (operasyon_birim_fiyat × adet)
  toplam_maliyet = toplam_iscilik + ek_malzeme_tl
  fason_fiyat = toplam_maliyet × (1 + kar_marji/100)

Çıktı:
  fason_fiyat: ₺X
  birim_fiyat: ₺X
  kar_zarar_sinyal: "karli" / "zararda"
```

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Model bazlı maliyet giriş formu
- [x] Kategoriler: kumaş, aksesuar, işçilik, genel, diğer
- [x] Miktar × birim fiyat = toplam hesabı
- [x] İşletme giderleri listesi (aylık/yıllık)
- [x] Sabit gider işaretleme
- [x] Fason fiyat hesaplama (FasonHesapMini bileşeni)
- [x] Kar/zarar sinyali (yeşil/kırmızı)
- [x] Soft-delete

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Otomatik maliyet hesaplama (operasyon × birim fiyat toplamı)
- [ ] TODO: Aylık karlılık grafiği
- [ ] TODO: Model bazlı karlılık karşılaştırması
- [ ] TODO: Excel/PDF maliyet raporu çıktısı
- [ ] TODO: Bütçe vs gerçekleşen karşılaştırması

---

## 💬 HIZLI KOMUTLAR (Bot için)

| Soru | Botu Ne Yapacak |
|------|-----------------|
| "Bu modelin toplam maliyeti?" | cost_entries SUM (model bazlı) |
| "Bu ay giderimiz ne kadar?" | business_expenses SUM (ay bazlı) |
| "Fason fiyatı kârlı mı?" | fason_price vs toplam_maliyet karşılaştır |
| "Sabit giderler ne kadar?" | is_recurring=1 toplamı |
| "En pahalı maliyet kalemi?" | amount DESC sırala |

---

## 🔗 CROSS-TAB ENTEGRASYON

| İlişki | Nasıl Bağlı |
|--------|-------------|
| **Modeller** | `model_id` FK — her maliyet kalemi bir modele ait |
| **Üretim** | `unit_value` → production_logs üzerinden maliyet hesabına girer |
| **Personel** | `daily_wage` × gün → personel maliyeti kategorisinde kullanılır |
| **Siparişler** | `unit_price` → fason fiyatı karşılaştırması için |

---

## 🏗️ COMPONENT MİMARİSİ (page.js)

```
MaliyetSekmesi
  ├── FasonHesapModal     → fason birim fiyatı hesapla
  ├── MaliyetKalemiFormu  → POST /api/cost-entries
  ├── IsletmeGiderleri     → GET/POST /api/expenses
  └── KarAnaliziPanel     → GET /api/maliyet-ozet
```

> **Önemlı:** Fason fiyatı = (personel + genel gider + kar) / toplam adet. Hesaplama page.js içinde yapılır.

---

## 🤖 CODING AGENT TALİMATLARI

### Yeni Maliyet Kategorisi Eklemek

1. **DB:** `cost_entries.category` TEXT — yeni kategori adı direkt girilir, migration gerekmez
2. **UI:** `page.js` MaliyetSekmesi içindeki kategori dropdown'una yeni seçenek ekle
3. **API:** `/api/cost-entries/route.js` — mevcut POST yeterli

### Yeni İşletme Gideri Alanı Eklemek

1. `db.js` alterStatements: `ALTER TABLE business_expenses ADD COLUMN yeni_alan`
2. `/api/expenses/route.js` SELECT/POST güncelle
3. `page.js` MaliyetSekmesi'nde form alanı ekle

---

## 🔄 VERİ AKIŞI

```
Form → POST /api/cost-entries (maliyet kalemi)
Form → POST /api/expenses (işletme gideri)
Hesap paneli → GET /api/maliyet-ozet → fason ort./kar mar. hesapla
```

---

## ⚠️ ÖNEMLİ KISITLAMALAR

- `cost_entries` soft-delete: `deleted_at` sütunu var
- Fason fiyatı `models.fason_price` alanından okunur
- KDV ve döviz hesabı şu an yok (ileriye planlı)

---

## 📝 BOT GÜNCELLEME KURALI

**Bu dosyayı şu durumlarda güncelle:**

- Yeni maliyet kategorisi eklendiyse → Tablo güncelle
- Fason hesaplama formülü değiştiyse → Hesaplama mantığı güncelle
- Yeni özellik eklendiyse → `[x]` yap
