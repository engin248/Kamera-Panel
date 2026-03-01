---
description: Her sohbette yapılan değişiklikleri otomatik .md dosyalarına kaydet
---

# 📝 /mimari-guncelle — Otomatik Mimari Güncelleme Workflow'u

> **Bu workflow her sohbet sonunda otomatik çalışır. Sorulmaz.**

---

## NE ZAMAN ÇALIŞIR?

Bu workflow aşağıdaki durumların **herhangi birinde** tetiklenir:

- ✅ Yeni kod yazıldı (page.js, api/*, lib/*)
- ✅ Yeni özellik eklendi
- ✅ Mevcut özellik değiştirildi
- ✅ DB şeması güncellendi (ALTER TABLE / yeni tablo)
- ✅ Bot konfigürasyonu değiştirildi
- ✅ Yeni API endpoint oluşturuldu
- ✅ Engin Bey yeni bir kural söyledi
- ✅ Yeni sekme/panel eklendi

---

## ADIM 1: DEĞİŞİKLİĞİ SINIFLANDIR

Sohbette ne yapıldı?

```
[ ] Sekme özelliği eklendi/değiştirildi  → PANEL-SEKMELERI.md
[ ] API endpoint eklendi/değiştirildi    → SISTEM-MIMARI.md
[ ] DB tablosu/sütun eklendi             → VERITABANI.md
[ ] Bot prompt/model değiştirildi        → BOT-SISTEMI.md + bots/[bot].md
[ ] Yeni bot eklendi                     → BOT-SISTEMI.md + yeni bots/ dosyası
[ ] Yeni kural/workflow eklendi          → rules.md veya yeni workflows/ dosyası
[ ] Genel mimari değişikliği             → SISTEM-MIMARI.md
```

---

## ADIM 2: İLGİLİ DOSYAYI GÜNCELLE

### 🔹 Sekme Özelliği Değişikliği

`PANEL-SEKMELERI.md` dosyasında:

```markdown
# Yeni tamamlanan özellik:
- [x] Özellik adı — (eklendi: 2026-MM-DD)

# Yeni TODO:
- [ ] TODO: Gelecekte yapılacak özellik

# Kaldırılan özellik:
- ~~[x] Kaldırılan özellik~~ — (kaldırıldı: 2026-MM-DD, sebep: ...)
```

### 🔹 API Değişikliği

`SISTEM-MIMARI.md` dosyasında API tablosuna satır ekle:

```markdown
| `/api/yeni-endpoint` | GET, POST | Açıklama |
```

### 🔹 DB Değişikliği

`VERITABANI.md` dosyasında ilgili tabloya sütun ekle:

```markdown
| `yeni_sutun` | TEXT | Açıklama |
```

### 🔹 Bot Değişikliği

`BOT-SISTEMI.md` ve `bots/[bot-adi].md` dosyasında:

- System prompt güncellenirse → Prompt bölümünü değiştir
- AI modeli değişirse → Model satırını güncelle
- Yeni hızlı komut eklendirse → Hızlı Komutlar tablosuna ekle

### 🔹 Yeni Kural

`rules/rules.md` dosyasına kural olarak ekle:

```markdown
## [N]. YENİ KURAL: [Kural başlığı]
[Kural açıklaması]
```

---

## ADIM 3: TARİHİ GÜNCELLE

Değiştirilen her dosyanın üst kısmındaki `> **Son Güncelleme:**` satırını güncelle:

```markdown
> **Son Güncelleme:** 2026-MM-DD
```

---

## ADIM 4: KULLANICIYA BİLDİR

Sohbet yanıtının sonuna şunu ekle:

```
---
✅ Mimari güncellendi:
  📄 PANEL-SEKMELERI.md → [ne eklendi/değişti]
  📄 SISTEM-MIMARI.md   → [ne eklendi/değişti]  (varsa)
  📄 VERITABANI.md      → [ne eklendi/değişti]  (varsa)
```

---

## ADIM 5: GİT'E DAHİL ET

Mimari güncellemeler her zaman kod commit'ine dahil edilir:

```powershell
# Mimari dosyalar otomatik git add -A ile dahil olur
# Commit mesajına eklenir:
git commit -m "[Konu]: [özellik] + mimari güncellendi"
```

---

## 📋 ÖRNEK SENARYO

**Engin Bey:** "Personel sekmesine fotoğraf yükleme ekledik"

**Antigravity:**

1. Kodu yazar (page.js + /api/upload)
2. `PANEL-SEKMELERI.md` açar → `[ ] TODO: Fotoğraf yükleme` → `[x] Personel fotoğrafı yükleme`
3. `SISTEM-MIMARI.md` açar → API tablosuna `/api/upload` satırı ekler (zaten varsa geçer)
4. Yanıtın sonuna ekler:

   ```
   ✅ Mimari güncellendi:
     📄 PANEL-SEKMELERI.md → Personel: fotoğraf yükleme [x] yapıldı
   ```

---

## ⚠️ ASLA YAPILMAYACAKLAR

- ❌ "Mimariyi güncelleyeyim mi?" diye SORMA — kendi başına güncelle
- ❌ Değişikliği bir sonraki sohbete bırakma
- ❌ "Küçük değişiklik" diyerek atlama — her şey kaydedilir
- ❌ Sadece kodu yazıp .md'yi unutma
