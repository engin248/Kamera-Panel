# ⚔️ KAMERA-PANEL — SİSTEM KURALLARI

> **Son Güncelleme:** 2026-03-01  
> **Komutan:** Engin Bey — TAM YETKİ 👑  

---

## 🔴 KURAL #0 — OTOMATİK MİMARİ GÜNCELLEME (EN YÜKSEK ÖNCELİK)

> **Bu kural hiçbir zaman atlanamaz. İstisna yoktur.**

**Her sohbette yeni bir özellik eklendiğinde, değiştirildiğinde veya kaldırıldığında:**  
Antigravity, kullanıcıdan sormadan ve onay beklemeden ilgili `.md` dosyasını günceller.

### 📋 Otomatik Güncelleme Tablosu

| Sohbette Ne Oldu? | Hangi Dosya Güncellenir? | Nasıl? |
|-------------------|--------------------------|--------|
| Yeni sekme özelliği eklendi | `PANEL-SEKMELERI.md` | `[ ]` → `[x]` veya yeni satır ekle |
| Yeni TODO tespit edildi | `PANEL-SEKMELERI.md` | `[ ] TODO: ...` olarak ekle |
| Yeni API endpoint oluşturuldu | `SISTEM-MIMARI.md` | API tablosuna satır ekle |
| Yeni DB tablosu/sütun eklendi | `VERITABANI.md` | İlgili tabloya sütun ekle |
| Bot prompt değiştirildi | `BOT-SISTEMI.md` + `bots/[bot].md` | Prompt bölümünü güncelle |
| Yeni bot eklendi | `BOT-SISTEMI.md` + `bots/` | Yeni bot dosyası oluştur |
| Sekme-bot eşleşmesi değişti | `BOT-SISTEMI.md` | Eşleşme haritasını güncelle |
| Yeni kural belirlendi | `rules/rules.md` | Kural olarak ekle |
| Yeni iş akışı tanımlandı | `workflows/` | Yeni .md dosyası oluştur |
| Mevcut özellik kaldırıldı | `PANEL-SEKMELERI.md` | `[x]` → `~~[x]~~` + not ekle |
| Teknoloji/paket değişikliği | `SISTEM-MIMARI.md` | Teknik yığın tablosunu güncelle |
| Yeni kullanıcı rolü/kuralı | `SISTEM-MIMARI.md` | Yetki tablosunu güncelle |

### ⚡ UYGULAMA KURALI

```
1. Sohbet sırasında değişiklik yapıldı
2. Kod/API/DB değişikliği tamamlandı
3. → Antigravity ANINDA ilgili .md dosyasını günceller
4. → Kullanıcıya "✅ Mimari güncellendi: [dosya adı]" bilgisi verilir
5. → Git commit'e mimari güncelleme dahil edilir
```

**YASAK:**

- ❌ "Mimariyi güncelleyeyim mi?" diye sormak
- ❌ Bir sonraki sohbete bırakmak
- ❌ Küçük değişikliği önemsiz saymak — her şey kaydedilir

---

## 🟡 KURAL #1 — SEKME BAĞLAMI (HER YANITA EKLENİR)

> **Bu kural her sohbette otomatik uygulanır.**

Antigravity her görev yanıtının **en başına** şu bloğu ekler:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 AKTİF SEKME: [emoji] [Sekme Adı]
🤖 UZMAN BOT:   [Bot Adı]
📅 Tarih:       [YYYY-MM-DD]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Sekme Tespiti — Öncelik Sırası

1. Kullanıcının açık dosyasına bak (örn. `MODELLER.md` açıksa → Modeller)
2. Kullanıcının isteğindeki anahtar kelimelere bak
3. Önceki sohbet bağlamına bak

### Sekme → Bot Eşleşmesi

| Sekme | Bot |
|-------|-----|
| 👗 Modeller, ✅ Kalite, ⚙️ Makineler | 🛠️ Tekniker |
| 👥 Personel, 🔩 Üretim, 📋 Siparişler, 📦 Sevkiyat, 🤝 Müşteriler, 📊 Ana Panel | 📹 Kamera |
| 💰 Maliyet, 📒 Rapor & Analiz, 🔧 Fason, 🏆 Prim | 💼 Muhasip |
| 📈 Raporlar (piyasa) | 🔍 Kaşif |
| 🤖 Bot, 🏗️ Mimari | — (Koordinatör) |

### Sohbet Adlandırma Kuralı

Yeni bir göreve başlarken sohbet başlığı önerisi:

```
[Sekme]: [Görev özeti — max 5 kelime]
Örnek: "Modeller: Parça listesi export"
Örnek: "Personel: Prim hesaplama düzeltme"
Örnek: "Bot: Kamera prompt güncelleme"
```

**YASAK:**

- ❌ Sekme bilgisi olmadan yanıt vermek (görev yanıtlarında)
- ❌ Yanlış bot seçimi yapmak

---

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

1. **🔴 `git push` ASLA OTOMATİK YAPILMAZ** — Her push öncesi Engin Bey'e mutlaka sorulur
   - ✅ `git add` → otomatik
   - ✅ `git commit` → otomatik
   - 🔴 `git push` → **ÖNCE SOR, ONAY GELİNCE YAP**
2. **`.env.local` dosyasına dokunulMAZ** — API anahtarları var
3. **`package.json` değiştirilMEZ** — yeni paket eklenmez (onay gerekir)
4. **`node_modules/` klasörüne girilMEZ**
5. **`next.config.mjs` değiştirilMEZ** — onay gerekir
6. **`lib/db.js` → CREATE TABLE yapıları değiştirilMEZ** — sadece ALTER TABLE
7. **Mevcut çalışan özellik kaldırılaMAZ** — sadece ekleme yapılır
8. **Test edilmeden "tamam" denMEZ**
9. **Rapor yazılmadan bir sonraki adıma geçilMEZ**

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
