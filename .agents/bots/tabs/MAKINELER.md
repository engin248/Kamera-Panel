# ⚙️ MAKİNELER SEKMESİ — BOT BEYNİ

> **Sekme ID:** `machines`
> **Bot:** 🛠️ Tekniker (DeepSeek Chat)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Makineler botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Fabrikadaki tüm makinelerin envanterini ve bakım takibini yönetmek.
Hangi makine nerede, bakımı ne zaman, ayar şablonları neler?

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının MAKİNE uzmanısın. Adın TEKNİKER.

UZMANLIĞIN:
- Makine envanteri ve durumu
- Bakım planlaması ve geciken bakımlar
- Makine başına üretim kapasitesi
- Ayar şablonları (kumaş tipi / iş tipi bazlı)
- Arıza analizi ve önleme

TARZIN: Teknik ve titiz. Bakım gecikmesini öne çıkar.
DİL: Türkçe. Max 4-5 cümle.
```

---

## 📊 VERİTABANI — KULLANILAN TABLOLAR

### `machines`

| Alan | Açıklama |
|------|----------|
| `name` | Makine adı |
| `type` | Tip (düz makina / overlok / reçme vb.) |
| `brand` / `model_name` | Marka + model |
| `serial_no` | Seri numarası |
| `location` | Konum (atölye içinde) |
| `purchase_date` | Satın alım tarihi |
| `last_maintenance` | Son bakım tarihi |
| `next_maintenance` | Sonraki bakım tarihi |
| `status` | active / maintenance / broken |
| `sub_type` | Alt tip |
| `count` | Adet |
| `category` | Kategori |

### `machine_settings` (Ayar Şablonları)

| Alan | Açıklama |
|------|----------|
| `machine_id` | Makine |
| `operation_name` | İş tipi |
| `fabric_type` | Kumaş türü |
| `needle_type` | İğne tipi |
| `tension_upper/lower` | Üst/alt iplik gerginliği |
| `speed_setting` | Hız ayarı |
| `thread_type` | İplik tipi |
| `presser_foot` | Baskı ayağı |

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/machines` | GET | Makine listesi |
| `/api/machines` | POST | Yeni makine ekle |
| `/api/machines/[id]` | PUT | Güncelle |
| `/api/machines/[id]` | DELETE | Soft-delete |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Makine listesi (tip, marka, durum)
- [x] Satın alım + son bakım + sonraki bakım tarihleri
- [x] Makine alt tipi ve kategori
- [x] Makine adedi
- [x] Makine ayar şablonları
- [x] Soft-delete

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Bakım tarihi geçmiş makineler için uyarı
- [ ] TODO: Makine başına üretim verimi özeti
- [ ] TODO: QR ile makine takip sistemi
- [ ] TODO: Arıza kayıt defteri
