# 📊 RAPOR & ANALİZ — Supabase Entegrasyonu Tam Dokümantasyon

> **Tarih:** 2026-03-03  
> **Durum:** ✅ API Supabase'e geçirildi  
> **API Dosyaları:** `rapor/ay-ozet/route.js`, `rapor/personel-verimlilik/route.js`

---

## 1. NE YAPILDI

Rapor & Analiz modülü 6 sekmeden oluşur. Bu sohbette:

1. `rapor/ay-ozet` API'si — SQLite'dan Supabase'e geçirildi (gereksiz JOIN temizlendi)
2. `rapor/personel-verimlilik` API'si — Supabase versiyonu yazıldı (prim motoru dahil)
3. `kar_zarar_ozet`, `karar_arsivi` tabloları tasarlandı ve Supabase'e uygulandı
4. Rapor/ay-ozet'te gereksiz `operations(unit_price)` join kaldırıldı — `unit_value` direkt kullanıldı

---

## 2. SUPABASE TABLOLAR

### `kar_zarar_ozet`

```sql
CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
    id                    BIGSERIAL PRIMARY KEY,
    ay                    INTEGER NOT NULL CHECK (ay BETWEEN 1 AND 12),
    yil                   INTEGER NOT NULL,
    toplam_gelir          REAL DEFAULT 0,
    hammadde_gider        REAL DEFAULT 0,
    iscilik_gider         REAL DEFAULT 0,
    fason_gider           REAL DEFAULT 0,
    sabit_gider           REAL DEFAULT 0,
    prim_gider            REAL DEFAULT 0,
    brut_kar              REAL DEFAULT 0,
    net_kar               REAL DEFAULT 0,
    kar_marji_yuzde       REAL DEFAULT 0,
    toplam_uretim_adedi   INTEGER DEFAULT 0,
    ortalama_fpy          REAL DEFAULT 0,
    ortalama_oee          REAL DEFAULT 0,
    durum                 TEXT DEFAULT 'taslak' CHECK (durum IN ('taslak','onaylandi','kapandi')),
    onaylayan_id          BIGINT,
    onay_tarihi           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ay, yil)
);
```

### `karar_arsivi`

```sql
CREATE TABLE IF NOT EXISTS karar_arsivi (
    id               BIGSERIAL PRIMARY KEY,
    tarih            DATE NOT NULL DEFAULT CURRENT_DATE,
    konu             TEXT NOT NULL,
    bolum            TEXT DEFAULT 'uretim',
    sistem_onerisi   TEXT,
    oneri_detay      JSONB,               -- Sistem önerisinin detayı (JSON)
    yapilan_karar    TEXT,
    yapilan_detay    JSONB,               -- Yapılan kararın detayı (JSON)
    sonuc            TEXT,
    sonuc_sayisal    REAL,
    sistem_mi_dogru  BOOLEAN,             -- Sistem önerisi doğru çıktı mı?
    ogrenim_notu     TEXT,
    sorumlu_id       BIGINT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API — `rapor/ay-ozet`

**GET /api/rapor/ay-ozet?ay=3&yil=2026**

```javascript
// 1. Production logs (o ay)
const uretimLogs = await supabaseAdmin
  .from('production_logs')
  .select('total_produced, defective_count, first_pass_yield, oee_score, unit_value, personnel_id, model_id')
  .is('deleted_at', null)
  .gte('start_time', baslangic)
  .lt('start_time', bitis);

// 2. Business expenses (o ay)
const giderler = await supabaseAdmin
  .from('business_expenses')
  .select('category, amount')
  .eq('year', yil).eq('month', ay);

// 3. Hesaplamalar (JavaScript'te):
const toplam_uretim = logs.reduce((s,r) => s + r.total_produced, 0);
const toplam_ciro   = logs.reduce((s,r) => s + r.unit_value, 0);
const ort_fpy       = logs.reduce((s,r) => s + r.first_pass_yield, 0) / logs.length;
const ort_oee       = logs.reduce((s,r) => s + r.oee_score, 0) / logs.length;
const toplam_gider  = giderler.reduce((s,r) => s + r.amount, 0);
const net_kar       = toplam_ciro - toplam_gider;

// 4. Top 5 model
const modelSayilari = {};
logs.forEach(l => modelSayilari[l.model_id] = (modelSayilari[l.model_id]||0) + l.total_produced);
// → En çok üretilen 5 modelin ID'si ile models tablosundan isimler çekilir
```

**Döndürülen veri yapısı:**

```json
{
  "toplam_uretim": 1500,
  "toplam_ciro": 45000,
  "toplam_gider": 28000,
  "net_kar": 17000,
  "kar_marji": 37.8,
  "ort_fpy": 94.2,
  "ort_oee": 78.5,
  "aktif_personel_sayisi": 4,
  "top5_modeller": [...],
  "gider_dagilimi": {...}
}
```

---

## 4. API — `rapor/personel-verimlilik`

**GET /api/rapor/personel-verimlilik?ay=3&yil=2026&prim_orani=20**

```javascript
// 1. Aktif personel listesi
// 2. O ayın üretim logları (personnel_id bazında grupla)
// 3. Prim kayıtları (o ay varsa)

// Her personel için:
{
  id, name, base_salary,
  toplam_uretilen, toplam_hatali, fpy_yuzde,
  katki_degeri,           // unit_value toplamı
  maas_maliyeti,          // base_salary * 1.205 + allowances
  katki_maas_farki,       // katki - maliyet
  prim_tutari,            // fark > 0 ise fark * prim_orani / 100
  verimlilik_skoru,       // 0-100
  prim_durumu,            // hesaplandi / onaylandi / odendi
}
```

---

## 5. RAPOR & ANALİZ 6 SEKME MİMARİSİ

| Sekme | API | Supabase Tablosu |
|---|---|---|
| Dashboard | `/api/rapor/ay-ozet` | production_logs, business_expenses |
| Personel Verimlilik | `/api/rapor/personel-verimlilik` | production_logs, personnel, prim_kayitlari |
| Model Kârlılık | `/api/costs` + `/api/production` | cost_entries, production_logs |
| Prim Onay | `/api/rapor/personel-verimlilik` | prim_kayitlari |
| Bölüm Muhasebesi | `/api/isletme-gider` | business_expenses, kar_zarar_ozet |
| Karar Arşivi | `/api/rapor/karar-arsivi` (planlı) | karar_arsivi |

---

## 6. DÜZELTİLEN HATALAR

### Hata 1: Gereksiz `operations(unit_price)` JOIN

```javascript
// YANLIŞ (önceki):
.select('total_produced, ..., operations(unit_price)')

// DOĞRU (sonraki):
.select('total_produced, ..., unit_value')
// unit_value production_logs'da zaten hesaplanmış olarak saklanıyor
```

### Hata 2: `isletme-gider` UNIQUE constraint sorunu

- Supabase'de `business_expenses` tablosunda UNIQUE constraint yoktu
- `upsert({ onConflict: 'category,year,month' })` → hata veriyordu
- Çözüm: delete + insert mantığına geçildi
