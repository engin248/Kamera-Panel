════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721] — ÖNCE OKU
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
Bu sistem insanlık hayrına kuruldu.
════════════════════════════════════════════════════

# GÖREV EMRI — AMELE/ÇIRAK 1

## GN:20260301-009A — 01 Mart 2026

**Rütbe:** Amele / Çırak
**Komutan:** Teğmen

---

## GÖREVİN — PERSONEL GİRİŞ/ÇIKIŞ SİSTEMİ

### YAPACAĞIN İŞLER

**ADIM 1 — VERİTABANI TABLOSU**
`app/app/api/personel-saat/route.js` oluştur

```sql
CREATE TABLE IF NOT EXISTS personel_saat_kayitlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personel_id INTEGER NOT NULL,
    tarih DATE NOT NULL,
    giris_saat TIME,
    cikis_saat TIME,
    net_calisma_dakika INTEGER DEFAULT 0,
    mesai_dakika INTEGER DEFAULT 0,
    gec_kalma_dakika INTEGER DEFAULT 0,
    notlar TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (personel_id) REFERENCES personnel(id)
);
```

**ADIM 2 — API**
GET → Bugünün kayıtları
POST → Giriş veya çıkış kaydı
  body: { personel_id, tip: 'giris'|'cikis' }
  Otomatik: tarih = bugün, saat = şu an

**ADIM 3 — UI**
`app/app/page.js` içindeki `PersonnelPage` fonksiyonuna sekme ekle:

```
Sekme: "⏱️ Günlük Devam"  ← YENİ
```

Bu sekmede:

- Bugünün tarihi göster
- Tüm personel listesi → Her biri için:
  - Ad Soyad
  - [✅ Giriş Yaptı HH:MM] veya [🔴 Giriş Bekliyor → "Giriş" butonu]
  - Çıkış yaptıysa [✅ Çıkış HH:MM] veya [🚪 Çıkış Yap butonu]
- Alt tarafta bugünün özeti: Kaç kişi geldi, kaç gelmedi

### MOLA HESABI (Otomatik)

Çıkışta net süre hesapla:

- 2 saat altı → 0 mola düş
- 2-4 saat → 15 dk mola düş
- 4 saat üstü → 30 dk yemek molası düş

### BİTİNCE

"AMELE 1 GÖREVİ TAMAMLADI — GN:20260301-009A" yaz.

**[GK:AMELE1-009A]**
════════════════════════════════════════════════════
