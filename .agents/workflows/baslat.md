---
description: Yeni bir geliştirme görevi başlatmak — analiz et, planla, uygula, mimariyi güncelle
---

# 🚀 /baslat — Görev Başlatma Workflow'u

// turbo-all

---

## ADIM 0-A: AKTİF SEKMEYİ TESPİT ET

**Her göreve başlarken ilk yapılacak şey budur.**

Kullanıcının isteğinden ve açık dosyalardan hangi sekmeyle çalışıldığını belirle:

| Sekme Adı | ID | Bot |
|-----------|-----|-----|
| 👗 Modeller | `models` | 🛠️ Tekniker |
| 👥 Personel | `personnel` | 📹 Kamera |
| 🔩 Üretim | `production` | 📹 Kamera |
| 💰 Maliyet | `costs` | 💼 Muhasip |
| 📒 Rapor & Analiz | `muhasebe` | 💼 Muhasip |
| 📋 Siparişler | `orders` | 📹 Kamera |
| ✅ Kalite | `quality` | 🛠️ Tekniker |
| 🔧 Fason | `fason` | 💼 Muhasip |
| 📦 Sevkiyat | `shipments` | 📹 Kamera |
| 🏆 Prim | `prim` | 💼 Muhasip |
| ⚙️ Makineler | `machines` | 🛠️ Tekniker |
| 🤝 Müşteriler | `customers` | 📹 Kamera |
| 📈 Raporlar | `reports` | 🔍 Kaşif |
| 📊 Ana Panel | `dashboard` | 📹 Kamera |
| 🤖 Bot Sistemi | `bot` | — |
| 🏗️ Mimari | `architecture` | — |

Tespit ettikten sonra **ilk yanıtının en başına** şunu yaz:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 AKTİF SEKME: [emoji] [Sekme Adı]
🤖 UZMAN BOT:   [Bot Adı]
📅 Tarih:       [YYYY-MM-DD]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **Sohbet başlığı önerisi:** `[Sekme]: [Görev özeti]`
> Örnek: `Modeller: Parça listesi PDF export`
> Örnek: `Personel: Prim hesaplama düzeltme`

---

## ADIM 0-B: MİMARİYİ OKU

Göreve başlamadan önce ilgili dosyaları oku:

```
.agents/architecture/SISTEM-MIMARI.md   → Genel yapı
.agents/architecture/BOT-SISTEMI.md     → Bot entegrasyonu
.agents/architecture/VERITABANI.md      → DB şeması
.agents/architecture/PANEL-SEKMELERI.md → Sekme özellikleri
```

---

## ADIM 1: GÖREVİ YAPILANDIR

Koordinatörün fikrinden şunu çıkar:

```
GÖREV: [Ne yapılacak — 1 cümle]
KAPSAM: [Hangi dosyalar etkilenecek]
AMAÇ: [Bu neden yapılıyor — işletme değeri]
MİMARİ ETKİSİ: [Hangi .md dosyaları güncellenecek]
```

---

## ADIM 2: AKADEMİK ANALİZ

```
📌 TEZ: Bu fikir neden doğru?
   → Artıları, faydaları

📌 ANTİTEZ: Riskleri neler?
   → Eksileri, dikkat edilecekler

📌 TEKNİK ANALİZ:
   → DB değişikliği var mı? (yeni sütun/tablo)
   → API değişikliği var mı? (yeni endpoint/metot)
   → UI değişikliği var mı? (hangi sekme)
   → Bot değişikliği var mı? (prompt/model)

📌 TAVSİYE: En doğru yol hangisi?
```

---

## ADIM 3: PLANLAMA

```
GÖREV #1: [Ne yapılacak]
  Dosyalar: [Hangi dosyalar]
  Süre: [Tahmini]

GÖREV #2: ...
```

---

## ADIM 4: UYGULA

Görevi gerçekleştir.

---

## ADIM 5: TEST ET

// turbo

```powershell
# Sunucu çalışıyor mu?
curl -s http://localhost:3000/api/models | python -c "import sys,json; d=json.load(sys.stdin); print(f'Models OK: {len(d)} kayit')" 2>&1
curl -s http://localhost:3000/api/personnel | python -c "import sys,json; d=json.load(sys.stdin); print(f'Personnel OK: {len(d)} kayit')" 2>&1
```

---

## ADIM 6: MİMARİ GÜNCELLE

Değişikliğe göre ilgili .md dosyasını güncelle:

| Ne Değişti? | Güncelle |
|-------------|----------|
| Yeni API | `SISTEM-MIMARI.md` → API tablosu |
| Yeni DB sütun | `VERITABANI.md` → İlgili tablo |
| Bot değişikliği | `BOT-SISTEMI.md` + `bots/[bot].md` |
| Sekme özelliği | `PANEL-SEKMELERI.md` |

---

## ADIM 7: GİT

// turbo

```powershell
cd C:\Users\Admin\Desktop\Kamera-Panel
git add -A
git status
```

Commit mesajı formatı:

```
[Sekme]: [Ne yapıldı — kısa]

Örnek: Personel: P11 operatör sınıfı alanı eklendi
Örnek: Modeller: Arka fotoğraf yükleme düzeltildi
Örnek: Bot: Kamera system prompt güncellendi
```

```powershell
git commit -m "[Mesaj]"
git push origin main
```

---

## ADIM 8: RAPORLA

```
═══ GÜNCELLEME RAPORU ═══
Tarih: [YYYY-MM-DD]
Değişiklik: [Ne yapıldı]
Etkilenen Dosyalar: [liste]
Test: ✅ Çalışıyor
Mimari Güncellendi: ✅ [hangi dosya]
═══════════════════════
```
