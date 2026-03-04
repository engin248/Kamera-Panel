# 🤖 MAKİNELER — Supabase Entegrasyonu Tam Dokümantasyon

> **Tarih:** 2026-03-03  
> **Durum:** ✅ Supabase'de CANLI  
> **Test:** `/api/machines` → `[]` boş dizi (tablo var, henüz veri girilmedi)

---

## 1. NE YAPILDI

1. `machines` tablosu SQL hazırlandı ve Supabase'e uygulandı
2. `app/app/api/machines/route.js` — Supabase API (zaten Supabase'deydi)
3. `app/app/api/machines/[id]/route.js` — Supabase API
4. Test: `/api/machines` → hatasız boş dizi ✅

---

## 2. SUPABASE TABLO — `machines`

```sql
CREATE TABLE IF NOT EXISTS machines (
    id                BIGSERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    type              TEXT NOT NULL,       -- makine tipi: duz_makine, overlok, reçme...
    brand             TEXT,               -- Marka
    model_name        TEXT,               -- Makine modeli
    serial_no         TEXT,               -- Seri numarası
    sub_type          TEXT,               -- Alt tip
    count             INTEGER DEFAULT 1,  -- Adet
    category          TEXT,              -- Kategori: dikiş, kesim, ütü...
    location          TEXT,              -- Atölyedeki konumu
    purchase_date     DATE,
    last_maintenance  DATE,
    next_maintenance  DATE,
    notes             TEXT,
    status            TEXT DEFAULT 'active',
    deleted_at        TIMESTAMPTZ,
    deleted_by        TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

**Toplam: 18 kolon**

---

## 3. API VALID_COLUMNS

```javascript
const VALID_COLUMNS = new Set([
    'name', 'type', 'brand', 'model_name', 'serial_no',
    'sub_type', 'count', 'category', 'location',
    'purchase_date', 'last_maintenance', 'next_maintenance',
    'notes', 'status',
]);
```

---

## 4. RLS

```sql
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_machines_all" ON machines
    FOR ALL TO service_role USING (true) WITH CHECK (true);
```
