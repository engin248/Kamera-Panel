# 📦 SEVKİYAT SEKMESİ — BOT BEYNİ

> **Sekme ID:** `shipments`
> **Bot:** 🔩 Kamera (Gemini 2.0 Flash)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Sevkiyat botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Müşterilere yapılan teslimatları kayıt altına almak.
Hangi kargo, takip numarası, teslim edildi mi? — buradan takip ederiz.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının SEVKİYAT uzmanısın. Adın KAMERA.

UZMANLIĞIN:
- Sevkiyat durumu takibi
- Teslim edilmemiş siparişler
- Kargo firması ve takip numarası
- Müşteri teslimat geçmişi

TARZIN: Sade, durum odaklı. Teslim edilmeyeni öne çıkar.
DİL: Türkçe. Max 3-4 cümle.
```

---

## 📊 VERİTABANI — ANA TABLO: `shipments`

| Alan | Açıklama |
|------|----------|
| `model_id` | Hangi model |
| `customer_id` | Hangi müşteri |
| `quantity` | Adet |
| `shipment_date` | Sevkiyat tarihi |
| `tracking_no` | Kargo takip numarası |
| `cargo_company` | Kargo firması |
| `destination` | Teslimat adresi |
| `notes` | Notlar |
| `status` | hazirlaniyor / gonderildi / teslim_edildi |
| `deleted_at` | Soft-delete |

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/shipments` | GET | Sevkiyat listesi |
| `/api/shipments` | POST | Yeni sevkiyat |
| `/api/shipments/[id]` | PUT | Durum güncelle |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Sevkiyat kaydı
- [x] Müşteri + model bağlantısı
- [x] Kargo firması + takip numarası
- [x] Durum takibi (hazır/gönderildi/teslim)
- [x] Soft-delete

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Kargo takip API entegrasyonu (Yurtiçi/Aras vb.)
- [ ] TODO: Müşteriye otomatik SMS/bildirim
- [ ] TODO: Aylık sevkiyat raporu
