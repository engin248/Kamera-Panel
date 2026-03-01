# ✅ KALİTE KONTROL SEKMESİ — BOT BEYNİ

> **Sekme ID:** `quality`
> **Bot:** 🛠️ Tekniker (DeepSeek Chat)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Kalite Kontrol botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Üretim kalitesini ölçmek ve hataları kayıt altına almak.
İlk ürün onayı, inline kontrol, final kontrol — üç aşamada kaliteyi takip ederiz.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının KALİTE uzmanısın. Adın TEKNİKER.

UZMANLIĞIN:
- Kalite kontrol prosedürleri
- Hata tipleri ve sınıflandırması
- İlk ürün onay süreci
- Inline vs final kontrol farkı
- Hata kaynağı analizi (operatör/makine/malzeme)
- Kalite iyileştirme önerileri

TARZIN: Titiz ve sistematik. Hata gördüğünde analizini yap.
DİL: Türkçe. Teknik ama net. Max 5-6 cümle.

KURAL: Her hata kaydı bir neden içermeli. Çözüm öner.
```

---

## 📊 VERİTABANI — KULLANILAN TABLOLAR

### `quality_checks`

| Alan | Açıklama |
|------|----------|
| `production_log_id` | Hangi üretim kaydı |
| `model_id` | Hangi model |
| `operation_id` | Hangi operasyon |
| `personnel_id` | Kim kontrol etti |
| `check_type` | inline / final / ilk_urun |
| `check_number` | Kaçıncı kontrol |
| `result` | ok / red / warning |
| `defect_type` | Hata tipi |
| `photo_path` | Hata fotoğrafı |
| `notes` | Notlar |
| `checked_by` | Kontrol eden kişi |
| `checked_at` | Kontrol zamanı |

### `approval_queue` (İlk Ürün Onayı)

| Alan | Açıklama |
|------|----------|
| `personnel_id` | Ürünü yapan |
| `model_id` | Hangi model |
| `operation_id` | Hangi operasyon |
| `photo_path` | İlk ürün fotoğrafı |
| `status` | pending / approved / rejected |
| `reviewed_at` | İnceleme zamanı |
| `notes` | Onay/ret notu |

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/quality-checks` | GET | Kalite kontrol listesi |
| `/api/quality-checks` | POST | Yeni kontrol kaydı |
| `/api/approvals` | GET | Onay kuyruğu |
| `/api/approvals` | POST | Onay talebi oluştur |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Kalite kontrol kaydı (inline/final)
- [x] Sonuç: ok / red / warning
- [x] Hata tipi kategorisi
- [x] Fotoğraf ekleme
- [x] Personel + Model + Operasyon bağlantısı
- [x] İlk ürün onay kuyruğu
- [x] Soft-delete

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Hata tipi frekans grafiği
- [ ] TODO: Personel bazlı hata oranı karşılaştırması
- [ ] TODO: Kalite kontrol QR barkod sistemi
- [ ] TODO: Otomatik hata sınıflandırma (AI)
- [ ] TODO: Müşteri kalite raporu

---

## 💬 HIZLI KOMUTLAR (Bot için)

| Soru | Botu Ne Yapacak |
|------|-----------------|
| "Bu hafta kaç hata kaydı var?" | quality_checks sayısı |
| "En sık hata tipi?" | defect_type GROUP BY |
| "Onay bekleyen var mı?" | approval_queue status='pending' |
| "Red oranı en yüksek operasyon?" | result='red' + operation GROUP BY |
