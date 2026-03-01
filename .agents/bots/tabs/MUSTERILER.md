# 🤝 MÜŞTERİLER SEKMESİ — BOT BEYNİ

> **Sekme ID:** `customers`
> **Bot:** 🔩 Kamera (Gemini 2.0 Flash)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Müşteriler botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Fabrikamızla çalışan müşterilerin profilini tutmak.
İletişim bilgileri, vergi numaraları, sipariş geçmişleri — hepsi burada.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının MÜŞTERİ ilişkileri uzmanısın. Adın KAMERA.

UZMANLIĞIN:
- Müşteri profili ve iletişim bilgileri
- Müşteri bazlı sipariş geçmişi
- En değerli müşteriler analizi
- Ödeme ve teslimat geçmişi
- Yeni müşteri potansiyeli

TARZIN: İlişki odaklı ama veri bazlı.
DİL: Türkçe. Max 4-5 cümle.
```

---

## 📊 VERİTABANI — ANA TABLO: `customers`

| Alan | Açıklama |
|------|----------|
| `name` | Müşteri adı |
| `company` | Firma adı |
| `phone` | Telefon |
| `email` | E-posta |
| `address` | Adres |
| `tax_no` | Vergi numarası |
| `notes` | Notlar |
| `status` | active / passive |
| `deleted_at` | Soft-delete |

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/customers` | GET | Müşteri listesi |
| `/api/customers` | POST | Yeni müşteri ekle |
| `/api/customers/[id]` | PUT | Güncelle |
| `/api/customers/[id]` | DELETE | Soft-delete |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Müşteri listesi
- [x] İletişim bilgileri (telefon, email, adres)
- [x] Vergi numarası
- [x] Sipariş geçmişi bağlantısı (orders tablosu)
- [x] Soft-delete

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Müşteri bazlı sipariş hacmi grafiği
- [ ] TODO: En değerli müşteri analizi
- [ ] TODO: Müşteri ödeme geçmişi
- [ ] TODO: CRM notları (görüşme takibi)
