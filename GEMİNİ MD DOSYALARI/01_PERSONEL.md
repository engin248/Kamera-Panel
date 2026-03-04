# 👥 PERSONEL — Supabase Entegrasyonu Tam Dokümantasyon

> **Tarih:** 2026-03-03  
> **Durum:** ✅ Supabase'de CANLI  
> **Test Sonucu:** 4 personel kaydı Supabase'den başarıyla geliyor  

---

## 1. NE YAPILDI

Personel modülü bu projede **ilk Supabase'e taşınan modül**dür. Diğer tüm modüller için referans mimari olarak kullanıldı.

### Yapılan işlemler

1. Supabase'de `personnel` tablosu oluşturuldu
2. `app/app/api/personnel/route.js` — SQLite'dan Supabase'e geçirildi
3. `app/app/api/personnel/[id]/route.js` — Supabase'e geçirildi
4. `app/lib/supabase.js` — Supabase bağlantı servisi oluşturuldu
5. Test: `/api/personnel` → 4 personel dönüyor ✅

---

## 2. SUPABASE TABLO — `personnel`

```sql
CREATE TABLE IF NOT EXISTS personnel (
    id                  BIGSERIAL PRIMARY KEY,
    name                TEXT NOT NULL,
    position            TEXT,
    role                TEXT,
    department          TEXT,
    start_date          DATE,
    status              TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','izinli')),

    -- Maaş
    base_salary         NUMERIC(10,2) DEFAULT 0,
    daily_wage          NUMERIC(10,2) DEFAULT 0,
    transport_allowance NUMERIC(10,2) DEFAULT 0,
    food_allowance      NUMERIC(10,2) DEFAULT 0,
    sgk_no              TEXT,

    -- Performans (production_logs'dan otomatik güncellenir)
    daily_avg_output    INTEGER DEFAULT 0,
    error_rate          NUMERIC(5,2) DEFAULT 0,
    efficiency_score    NUMERIC(5,2) DEFAULT 0,

    -- Makine ve beceri
    machines            TEXT,
    skills              TEXT,

    -- Portal erişim
    portal_aktif        BOOLEAN DEFAULT FALSE,
    portal_pin          TEXT,

    -- Sistem
    deleted_at          TIMESTAMPTZ,
    deleted_by          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API MİMARİSİ

### Dosyalar

- `app/app/api/personnel/route.js` — GET (liste), POST (yeni kayıt)
- `app/app/api/personnel/[id]/route.js` — GET (tekil), PUT (güncelle), DELETE (soft-delete)

### GET /api/personnel

```javascript
supabaseAdmin
  .from('personnel')
  .select('*')
  .is('deleted_at', null)
  .order('name', { ascending: true })
```

### POST /api/personnel

- Yeni personel ekler
- `supabaseAdmin.from('personnel').insert(data).select().single()`

### PUT /api/personnel/[id]

- VALID_COLUMNS listesinden gelen alanları günceller
- `audit_trail` tablosuna değişiklik kaydeder
- `deleted_at = null` kontrolü yapar

### DELETE /api/personnel/[id]

- Soft delete: `deleted_at = NOW()` set edilir, fiziksel silinmez

---

## 4. VALID_COLUMNS (API Whitelist)

```javascript
const VALID_COLUMNS = new Set([
    'name', 'position', 'role', 'department', 'start_date', 'status',
    'base_salary', 'daily_wage', 'transport_allowance', 'food_allowance', 'sgk_no',
    'daily_avg_output', 'error_rate', 'efficiency_score',
    'machines', 'skills',
    'portal_aktif', 'portal_pin',
]);
```

---

## 5. DİĞER TABLOLARLA BAĞLANTISI

```
personnel (id) ←── production_logs (personnel_id)
personnel (id) ←── prim_kayitlari (personel_id)
```

### Otomatik Güncelleme

`production_logs` tablosuna her kayıt sonrası, `personnel` tablosundaki şu alanlar otomatik hesaplanır:

- `daily_avg_output` — Son 30 günün ortalama üretim adedi
- `error_rate` — Hata oranı (%)
- `efficiency_score` — OEE skoru ortalaması

---

## 6. SUPABASE RLS POLİTİKASI

```sql
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_personnel_all" ON personnel
    FOR ALL TO service_role USING (true) WITH CHECK (true);
```

> `supabaseAdmin` → `service_role` key kullanır → RLS'yi atlar → Tam erişim

---

## 7. TEST SONUÇLARI

| Test | Sonuç |
|---|---|
| `GET /api/personnel` | ✅ 4 kayıt geliyor |
| `GET /api/personnel?limit=3` | ✅ Çalışıyor (limit henüz implemente değil) |
| SQLite bağımlılığı | ✅ Sıfır (`grep` ile doğrulandı) |

**Mevcut Personeller (2026-03-03):**

- Ahmet mehti (ID: 30)
- Ali hassan (ID: 29)
- Amet yanzı (ID: 31)
- NURCAN AYTEN (ID: 25)
