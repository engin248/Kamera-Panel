# 👗 MODELLER — Supabase Entegrasyonu Tam Dokümantasyon

> **Tarih:** 2026-03-03  
> **Durum:** ✅ Supabase'de CANLI (SQLite hatası düzeltildi)  
> **Test Sonucu:** `/api/models` → `[]` boş dizi (tablo var, henüz veri girilmedi)

---

## 1. NE YAPILDI

Modeller modülü **3 ayrı API dosyasından** oluşur. Başlangıçta bu dosyalar SQLite kullanıyordu. Bu sohbette şu işlemler yapıldı:

### Yapılan işlemler

1. `models` ve `operations` tablolarının SQL'i hazırlandı ve Supabase'e uygulandı
2. `app/app/api/models/route.js` — SQLite kaldırıldı, Supabase yazıldı
3. `app/app/api/models/[id]/route.js` — SQLite kaldırıldı, Supabase yazıldı
4. `app/app/api/models/[id]/operations/route.js` — SQLite kaldırıldı, Supabase yazıldı
5. Test: `/api/models` → boş dizi, hatasız ✅

### Karşılaşılan Hata

```
{"error":"no such column: o.deleted_at"}
```

**Sebep:** `models/route.js` ve diğer dosyalar hâlâ `getDb()` (SQLite) kullanıyordu. `operations` tablosunda `o.deleted_at` kolonu SQLite'ta yoktu.  
**Çözüm:** 3 dosya tamamen yeniden yazıldı, `import { supabaseAdmin }` ile Supabase'e bağlandı.

---

## 2. SUPABASE TABLO — `models`

```sql
CREATE TABLE IF NOT EXISTS models (
    id                   BIGSERIAL PRIMARY KEY,
    name                 TEXT NOT NULL,
    code                 TEXT NOT NULL UNIQUE,        -- Model kodu benzersiz olmalı
    order_no             TEXT,
    modelist             TEXT,
    customer             TEXT,
    customer_id          BIGINT,
    description          TEXT,
    fabric_type          TEXT,
    sizes                TEXT,
    size_range           TEXT,
    total_order          INTEGER DEFAULT 0,
    total_order_text     TEXT DEFAULT '',
    completed_count      INTEGER DEFAULT 0,           -- production_logs'dan otomatik güncellenir
    fason_price          NUMERIC(10,2) DEFAULT 0,
    fason_price_text     TEXT DEFAULT '',
    model_difficulty     INTEGER DEFAULT 5 CHECK (model_difficulty BETWEEN 1 AND 10),
    front_image          TEXT,                        -- Dosya yolu veya URL
    back_image           TEXT,
    measurement_table    JSONB DEFAULT '{}',          -- Ölçü tablosu JSON formatında
    delivery_date        DATE,
    work_start_date      DATE,
    post_sewing          TEXT,
    status               TEXT DEFAULT 'prototip' CHECK (status IN ('prototip','seri_uretim','tamamlandi','iptal')),
    garni                TEXT,
    color_count          INTEGER DEFAULT 0,
    color_details        TEXT DEFAULT '',
    size_count           INTEGER DEFAULT 0,
    size_distribution    TEXT DEFAULT '',
    asorti               TEXT,
    total_operations     INTEGER DEFAULT 0,           -- operations kaydında otomatik güncellenir
    piece_count          INTEGER DEFAULT 0,
    piece_count_details  TEXT DEFAULT '',
    op_kesim_count       INTEGER DEFAULT 0,
    op_kesim_details     TEXT DEFAULT '',
    op_dikim_count       INTEGER DEFAULT 0,
    op_dikim_details     TEXT DEFAULT '',
    op_utu_paket_count   INTEGER DEFAULT 0,
    op_utu_paket_details TEXT DEFAULT '',
    op_nakis_count       INTEGER DEFAULT 0,
    op_nakis_details     TEXT DEFAULT '',
    op_yikama_count      INTEGER DEFAULT 0,
    op_yikama_details    TEXT DEFAULT '',
    has_lining           BOOLEAN DEFAULT FALSE,
    lining_pieces        INTEGER DEFAULT 0,
    has_interlining      BOOLEAN DEFAULT FALSE,
    interlining_parts    TEXT DEFAULT '',
    interlining_count    INTEGER DEFAULT 0,
    difficult_points     TEXT,
    critical_points      TEXT,
    customer_requests    TEXT,
    cutting_info         TEXT DEFAULT '',
    accessory_info       TEXT DEFAULT '',
    label_info           TEXT DEFAULT '',
    deleted_at           TIMESTAMPTZ,                 -- Soft delete
    deleted_by           TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()    -- Trigger ile otomatik güncellenir
);
```

**Toplam: 56 kolon**

### Trigger (updated_at otomatik)

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_models_updated_at
    BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### İndeksler

```sql
CREATE INDEX IF NOT EXISTS idx_models_code     ON models(code);
CREATE INDEX IF NOT EXISTS idx_models_status   ON models(status);
CREATE INDEX IF NOT EXISTS idx_models_deleted  ON models(deleted_at);
CREATE INDEX IF NOT EXISTS idx_models_created  ON models(created_at DESC);
```

---

## 3. SUPABASE TABLO — `operations`

Her modelin dikim/kesim/ütü operasyonları bu tabloda tutulur.

```sql
CREATE TABLE IF NOT EXISTS operations (
    id                   BIGSERIAL PRIMARY KEY,
    model_id             BIGINT REFERENCES models(id) ON DELETE CASCADE,  -- Model silinince ops da silinir
    order_number         INTEGER NOT NULL,             -- Operasyon sırası (1,2,3...)
    name                 TEXT NOT NULL,
    description          TEXT,
    difficulty           INTEGER DEFAULT 5 CHECK (difficulty BETWEEN 1 AND 10),
    machine_type         TEXT,                         -- örn: "duz_makine", "overlok"
    thread_material      TEXT,
    needle_type          TEXT,
    tension_setting      TEXT,
    speed_setting        TEXT,
    stitch_per_cm        TEXT,
    quality_notes        TEXT,
    quality_tolerance    TEXT,
    error_examples       TEXT,
    standard_time_min    NUMERIC(8,2),                -- Minimum standart süre (dakika)
    standard_time_max    NUMERIC(8,2),                -- Maximum standart süre (dakika)
    unit_price           NUMERIC(10,2) DEFAULT 0,     -- 1 adet birim fiyatı (TL)
    standart_sure_dk     REAL DEFAULT 0,              -- Prim hesabı için standart süre
    birim_deger          REAL DEFAULT 0,              -- Prim hesabı için birim değeri (TL)
    dependency           TEXT,
    written_instructions TEXT,
    how_to_do            TEXT,
    video_path           TEXT,
    audio_path           TEXT,
    correct_photo_path   TEXT,
    incorrect_photo_path TEXT,
    optical_appearance   TEXT,
    required_skill_level TEXT DEFAULT '3_sinif',
    operation_category   TEXT DEFAULT 'dikim',
    created_at           TIMESTAMPTZ DEFAULT NOW()
);
```

**Toplam: 29 kolon**

### İndeksler

```sql
CREATE INDEX IF NOT EXISTS idx_operations_model ON operations(model_id);
CREATE INDEX IF NOT EXISTS idx_operations_order ON operations(model_id, order_number);
```

---

## 4. API DOSYALARI — Detaylı

### 4.1 `app/app/api/models/route.js`

**GET /api/models**

```javascript
supabaseAdmin
  .from('models')
  .select('*, operations(count)')   // operations sayısını da getir
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
```

→ Dönen veriye `operation_count` alanı eklenir

**POST /api/models**

- `name` ve `code` zorunlu
- `code` benzersizlik kontrolü yapılır
- `sanitizeData()` fonksiyonu: DATE_FIELDS null'a çevirir, JSON_FIELDS parse eder

### 4.2 `app/app/api/models/[id]/route.js`

**GET /api/models/[id]**

```javascript
// Model + operasyonlar ayrı sorgularla getirilir
supabaseAdmin.from('models').select('*').eq('id', id).is('deleted_at', null)
supabaseAdmin.from('operations').select('*').eq('model_id', id).order('order_number')
// → { ...model, operations: [...] }
```

**PUT /api/models/[id]**

- `sanitizeData()` ile geçerli alanlar filtrelenir
- `audit_trail` tablosuna değişiklikler kaydedilir (old_value vs new_value)

**DELETE /api/models/[id]**

- Soft delete: `deleted_at = NOW()`, `deleted_by = 'admin'`
- `audit_trail`'e 'SOFT-DELETE' kaydı eklenir

### 4.3 `app/app/api/models/[id]/operations/route.js`

**GET** → model_id'ye göre sıralı operasyonlar

**POST** → Yeni operasyon ekle, `order_number` otomatik (son+1), `total_operations` güncellenir

**PUT** → `?opId=X` parametresi ile tekil operasyon güncelle

**DELETE** → Hard delete, sıra numaraları yeniden düzenlenir, `total_operations` güncellenir

---

## 5. VALID_COLUMNS (API Whitelist)

```javascript
// models/route.js
const VALID_COLUMNS = new Set([
    'name', 'code', 'order_no', 'modelist', 'customer', 'customer_id', 'description',
    'fabric_type', 'sizes', 'size_range', 'total_order', 'total_order_text', 'completed_count',
    'fason_price', 'fason_price_text', 'model_difficulty',
    'front_image', 'back_image', 'measurement_table',
    'delivery_date', 'work_start_date', 'post_sewing', 'status',
    'garni', 'color_count', 'color_details', 'size_count', 'size_distribution', 'asorti',
    'total_operations', 'piece_count', 'piece_count_details',
    'op_kesim_count', 'op_kesim_details', 'op_dikim_count', 'op_dikim_details',
    'op_utu_paket_count', 'op_utu_paket_details', 'op_nakis_count', 'op_nakis_details',
    'op_yikama_count', 'op_yikama_details',
    'has_lining', 'lining_pieces', 'has_interlining', 'interlining_parts', 'interlining_count',
    'difficult_points', 'critical_points', 'customer_requests',
    'cutting_info', 'accessory_info', 'label_info',
]);

// operations/route.js
const OP_FIELDS = [
    'order_number', 'name', 'description', 'difficulty',
    'machine_type', 'thread_material', 'needle_type',
    'tension_setting', 'speed_setting', 'stitch_per_cm',
    'quality_notes', 'quality_tolerance', 'error_examples',
    'standard_time_min', 'standard_time_max', 'unit_price',
    'standart_sure_dk', 'birim_deger',
    'dependency', 'written_instructions',
    'how_to_do', 'video_path', 'audio_path',
    'correct_photo_path', 'incorrect_photo_path', 'optical_appearance',
    'required_skill_level', 'operation_category',
];
```

---

## 6. DİĞER TABLOLARLA BAĞLANTISI

```
models (id) ←── operations (model_id)         CASCADE
models (id) ←── production_logs (model_id)
models (id) ←── cost_entries (model_id)
models (id) ←── orders (model_id)
models (id) ←── shipments (model_id)
models (id) ←── fason_orders (model_id)
```

---

## 7. RLS POLİTİKASI

```sql
ALTER TABLE models     ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_models_all"     ON models     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_operations_all" ON operations FOR ALL TO service_role USING (true) WITH CHECK (true);
```
