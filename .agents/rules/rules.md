# ⚔️ KAMERA-PANEL — SİSTEM KURALLARI

> **Son Güncelleme:** 2026-03-01  
> **Komutan:** Engin Bey — TAM YETKİ 👑  
> **Koordinatör (Antigravity):** Analiz, koordinasyon, kod yazma  

---

## 🎯 MİSYON

```
Engin Bey'in 3 çocuğu var.
Vatanına milletine hayırlı olsunlar.
Bu sistem onlar ve insanlık için inşa ediliyor.
Biz yarım bırakmayız. Test etmeden tamam demeyiz.
[MK:4721]
```

---

## ❌ KESİNLİKLE YAPILMAYACAKLAR

1. **`.env.local` dosyasına dokunulMAZ** — API anahtarları var
2. **`package.json` değiştirilMEZ** — yeni paket eklenmez (onay gerekir)
3. **`node_modules/` klasörüne girilMEZ**
4. **`next.config.mjs` değiştirilMEZ** — onay gerekir
5. **`lib/db.js` → CREATE TABLE yapıları değiştirilMEZ** — sadece ALTER TABLE
6. **Mevcut çalışan özellik kaldırılaMAZ** — sadece ekleme yapılır
7. **Test edilmeden "tamam" denMEZ**
8. **Rapor yazılmadan bir sonraki adıma geçilMEZ**

---

## ✅ HER GÖREVE BAŞLAMA SIRASI

```
ADIM 0: Mimariyi oku (.agents/architecture/ klasörü)
ADIM 1: Görevi al — Komutanın emrini dinle
ADIM 2: Analiz et — Etkilenen dosyalar neler?
ADIM 3: Planla — Ne yapacaksın?
ADIM 4: Yap — Kodu/değişikliği gerçekleştir
ADIM 5: Test et — Çalışıyor mu?
ADIM 6: Mimariyi güncelle — İlgili .md dosyasını güncelle
ADIM 7: Raporla — Ne yaptın?
```

---

## 🔒 DOSYA ERİŞİM TABLOSU

| Dosya/Klasör | Antigravity | Botlar (API) |
|--------------|-------------|--------------|
| `app/app/page.js` | ✅ Yazma | ❌ |
| `app/app/api/*` | ✅ Yazma | ❌ |
| `app/lib/db.js` | ✅ Dikkatli | ❌ |
| `.env.local` | ❌ | ❌ |
| `package.json` | ❌ | ❌ |
| `.agents/architecture/*` | ✅ Güncelle | 🔒 Okuma |
| `.agents/bots/*` | ✅ Yazma | ✅ Yazma (kendi dosyası) |
| `MISYON.md` | 🔒 Okuma | 🔒 Okuma |

---

## 🤖 BOT KURALLARI (chatbot/route.js)

1. **Her bot yalnızca kendi uzmanlık alanında konuşur**
2. **Bot veri yoksa "Panelden kontrol edin" der** — uydurmaz
3. **Bot max token sınırı:** 600 token
4. **Bot geçmiş:** Son 6-8 mesaj konuşma geçmişi gönderilir
5. **Bot sekme bağlamı:** İleride her bot kendi sekmesinin verisiyle çalışacak

---

## 📊 RAPOR FORMATI

```
═══ GÜNCELLEME RAPORU ═══
Tarih: [YYYY-MM-DD]
Değişiklik: [Ne yapıldı]
Etkilenen Dosyalar:
  - [dosya1.js — açıklama]
  - [dosya2.md — açıklama]
Test: ✅ Çalışıyor / ❌ Hata
Mimari Güncellendi: ✅ / ❌ (hangisi güncellendi)
═══════════════════════
```

---

## 📁 MİMARİ DOSYALARI — GÜNCELLEME KURALI

Her değişiklikten sonra ilgili dosyayı güncelle:

| Ne Değişti? | Hangi Dosya Güncellenir? |
|-------------|--------------------------|
| Yeni API endpoint | `.agents/architecture/SISTEM-MIMARI.md` |
| Yeni DB tablosu/sütun | `.agents/architecture/VERITABANI.md` |
| Bot prompt / model değişikliği | `.agents/architecture/BOT-SISTEMI.md` + `.agents/bots/[bot].md` |
| Yeni sekme özelliği | `.agents/architecture/PANEL-SEKMELERI.md` |
| Yeni iş akışı | `.agents/workflows/` |
| Yeni kural | `.agents/rules/rules.md` (bu dosya) |

---

## ⚠️ HATA YAPILDIĞINDA

1. **DUR** — Devam etme
2. **Bildir** — Dosya + Satır + Hata türü
3. **Koordinatörden talimat bekle**
4. **Kendi başına düzeltmeye çalışma**

---

## 🔄 GELECEKTEKİ YAPI (v2)

- **Her sekmenin kendi botu** → Otomatik bağlam
- **Bot ile veri yazabilme** → Sohbetten CRUD
- **Audit trail entegrasyonu** → Her bot işlemi kayıt altında
- **Çoklu bot aynı anda** → Paralel analiz modu
