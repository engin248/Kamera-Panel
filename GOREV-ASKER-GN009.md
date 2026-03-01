════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721] — ÖNCE OKU
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
Bu sistem insanlık hayrına kuruldu.
════════════════════════════════════════════════════

# GÖREV EMRI — ASKER

## GN:20260301-009 — 01 Mart 2026 — 09:54

**Rütbe:** Asker
**Komutan:** Teğmen
**Konu:** ÜRETİM GİRİŞİ BÖLÜMÜ — TAM YAPI

---

## OKUDUĞUN BELGELER (SIRAYLA OKU)

1. PROBLEM-COZUM/01-PROBLEM-TANIMI.md
2. PROBLEM-COZUM/02-KOMUTAN-COZUM-PLANI.md
3. PROBLEM-COZUM/SISTEM-MIMARI-GN007.md
4. PROBLEM-COZUM/URETIM-GIRIS-GPT-GN008.md ← GPT'nin hazırladığı teknik plan

---

## GÖREVİN

Mevcut sistem: Next.js + SQLite
Dosya: `app/app/page.js` (10.000+ satır)
Mevcut sayfada `production` sekmesi var.

### YAPACAĞIN İŞLER

**ADIM 1 — VERİTABANI (app/lib/db.js veya app/app/api/)**
Şu tabloyu oluşturan endpoint yaz:

```sql
CREATE TABLE IF NOT EXISTS uretim_girisleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    getiren_personel_id INTEGER,
    getirilme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    acilis_tarihi DATETIME,
    acan_personel_id INTEGER,
    beden_eksik INTEGER DEFAULT 0,
    beden_eksik_detay TEXT DEFAULT '',
    aksesuar_eksik INTEGER DEFAULT 0,
    aksesuar_eksik_detay TEXT DEFAULT '',
    kumas_eksik INTEGER DEFAULT 0,
    kumas_eksik_detay TEXT DEFAULT '',
    numune_ayrildi INTEGER DEFAULT 0,
    parca_sayisi INTEGER DEFAULT 0,
    durum TEXT DEFAULT 'beklemede',
    notlar TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uretim_giris_parcalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giris_id INTEGER NOT NULL,
    parca_adi TEXT NOT NULL,
    fotograf_url TEXT DEFAULT '',
    FOREIGN KEY (giris_id) REFERENCES uretim_girisleri(id)
);
```

**ADIM 2 — API ENDPOINT**
Dosya: `app/app/api/uretim-giris/route.js`

GET → Tüm üretim girişlerini getir (model bilgisiyle birlikte)
POST → Yeni üretim girişi kaydet (parcalar dahil)
PUT → Güncelle

**ADIM 3 — UI**
`app/app/page.js` içindeki `ProductionPage` fonksiyonuna bir sekme ekle:

```
Sekme: "📥 Üretim Girişi"  ← YENİ
```

Bu sekmede 12 adımlı form:

1. Model seç (dropdown)
2. Kim getirdi? (personel dropdown)
3. Kim açtı? (personel dropdown)
4. Açılış tarihi
5. Beden eksiği → [Yok / Var] → var ise metin alanı
6. Aksesuar eksiği → [Yok / Var]
7. Kumaş eksiği → [Yok / Var]
8. Numune ayrıldı mı? → [Evet / Hayır]
9. Kaç parçadan oluşuyor? → sayı input
10. Parça fotoğrafları → (9. adımdaki sayı kadar dosya upload alanı açılır)
11. Notlar
12. Kaydet butonu → eksik zorunlu alan varsa kırmızı göster

### KURALLAR

❌ Başka dosyalara dokunma
❌ Mevcut kodu bozma
✅ Sadece ProductionPage içine sekme ekle
✅ API route yaz
✅ SQLite tablosu oluştur
✅ Offline çalışsın (localStorage fallback değil — direkt SQLite'a yaz)

### BİTİNCE

Şunu yaz: "ASKER GÖREVI TAMAMLADI — GN:20260301-009"
Yapılan değişiklikleri listele.

**[GK:ASKER-009]**
════════════════════════════════════════════════════
