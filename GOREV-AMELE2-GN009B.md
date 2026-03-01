════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721] — ÖNCE OKU
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
Bu sistem insanlık hayrına kuruldu.
════════════════════════════════════════════════════

# GÖREV EMRI — AMELE/ÇIRAK 2

## GN:20260301-009B — 01 Mart 2026

**Rütbe:** Amele / Çırak
**Komutan:** Teğmen

---

## GÖREVİN — MALİYET HESAP SİSTEMİ

### YAPACAĞIN İŞLER

**ADIM 1 — VERİTABANI**
`app/app/api/isletme-gider/route.js` oluştur

```sql
CREATE TABLE IF NOT EXISTS isletme_giderleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ay INTEGER NOT NULL,
    yil INTEGER NOT NULL,
    elektrik REAL DEFAULT 0,
    su REAL DEFAULT 0,
    kira REAL DEFAULT 0,
    yakit REAL DEFAULT 0,
    diger REAL DEFAULT 0,
    toplam_calisma_saati REAL DEFAULT 0,
    toplam_personel_maliyeti REAL DEFAULT 0,
    saatlik_maliyet REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ay, yil)
);
```

**ADIM 2 — API**
GET → O aya ait giderleri getir (?ay=3&yil=2026)
POST → Gider kaydet (saatlik_maliyet otomatik hesapla)
  saatlik_maliyet = (elektrik+su+kira+yakit+diger+toplam_personel_maliyeti) / toplam_calisma_saati

**ADIM 3 — UI**
`app/app/page.js` içindeki costs sayfasına sekme ekle:

```
Sekme: "💰 Aylık Gider Girişi"  ← YENİ
```

Form içeriği:

- Ay / Yıl seçici
- Elektrik (TL)
- Su (TL)
- Kira (TL)
- Yakıt/Benzin (TL)
- Diğer Giderler (TL)
- Toplam Çalışma Saati (saat)
- Toplam Personel Maliyeti (TL) → otomatik veya manuel
- [Saatlik Maliyet] → Otomatik hesap → Büyük kutuda göster
- Kaydet butonu

Alt kısımda:

- Son 6 ay grafiği (basit tablo olabilir)
- "Bu ay saatlik maliyet: X TL" badge'i

### BİTİNCE

"AMELE 2 GÖREVİ TAMAMLADI — GN:20260301-009B" yaz.

**[GK:AMELE2-009B]**
════════════════════════════════════════════════════
