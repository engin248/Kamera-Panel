# 🏭 ÜRETİM — Supabase Entegrasyonu Tam Dokümantasyon

> **Tarih:** 2026-03-03  
> **Durum:** ✅ Supabase'de CANLI  
> **Tablo:** `production_logs`  
> **Bağlı Tablolar:** `models`, `operations`, `personnel`

---

## 1. NE YAPILDI

Üretim modülü, personelin hangi modelin hangi operasyonunu ne kadar ürettiğini kaydeder. Bu sohbette:

1. `production_logs` tablosu tasarlandı ve SQL hazırlandı
2. `app/app/api/production/route.js` — Supabase'e geçirildi
3. `app/app/api/production/[id]/route.js` — Supabase'e geçirildi
4. Otomatik metrik hesaplama motoru yazıldı (OEE, FPY, takt time)
5. Üretim sonrası `personnel` ve `models` otomatik güncelleme eklendi

---

## 2. SUPABASE TABLO — `production_logs`

```sql
CREATE TABLE IF NOT EXISTS production_logs (
    id                    BIGSERIAL PRIMARY KEY,

    -- FK Bağlantılar
    model_id              BIGINT REFERENCES models(id),
    operation_id          BIGINT REFERENCES operations(id),
    personnel_id          BIGINT REFERENCES personnel(id),

    -- Zaman
    start_time            TIMESTAMPTZ NOT NULL,
    end_time              TIMESTAMPTZ,

    -- Üretim Sayıları
    total_produced        INTEGER DEFAULT 0,
    defective_count       INTEGER DEFAULT 0,
    defect_reason         TEXT DEFAULT '',
    defect_source         TEXT DEFAULT 'operator',
    defect_photo          TEXT DEFAULT '',
    defect_classification TEXT DEFAULT '',

    -- Kayıp Süreler (dakika)
    break_duration_min    NUMERIC(8,2) DEFAULT 0,
    machine_down_min      NUMERIC(8,2) DEFAULT 0,
    material_wait_min     NUMERIC(8,2) DEFAULT 0,
    passive_time_min      NUMERIC(8,2) DEFAULT 0,

    -- İş Takibi
    lot_change            TEXT DEFAULT '',
    notes                 TEXT DEFAULT '',
    status                TEXT DEFAULT 'active',

    -- Otomatik Hesaplanan Metrikler
    quality_score         NUMERIC(5,2) DEFAULT 100,
    first_pass_yield      NUMERIC(5,2) DEFAULT 100,  -- FPY = (üretilen-hatalı)/üretilen * 100
    oee_score             NUMERIC(5,2) DEFAULT 0,     -- OEE = Kullanılabilirlik x Performans x Kalite
    takt_time_ratio       NUMERIC(8,2) DEFAULT 0,
    unit_value            NUMERIC(10,2) DEFAULT 0,    -- operations.unit_price x total_produced
    net_work_minutes      NUMERIC(8,2) DEFAULT 0,     -- Fiili çalışma süresi

    -- Prim Sistemi için
    katki_degeri_tutari   REAL DEFAULT 0,             -- operations.birim_deger x total_produced

    -- Sistem
    deleted_at            TIMESTAMPTZ,
    deleted_by            TEXT,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

**Toplam: 28 kolon**

### İndeksler

```sql
CREATE INDEX IF NOT EXISTS idx_prod_model     ON production_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_prod_personnel ON production_logs(personnel_id);
CREATE INDEX IF NOT EXISTS idx_prod_date      ON production_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_prod_deleted   ON production_logs(deleted_at);
```

---

## 3. API MİMARİSİ

### 3.1 `app/app/api/production/route.js`

**GET /api/production**

```javascript
supabaseAdmin
  .from('production_logs')
  .select(`*, models(name, code), operations(name, unit_price), personnel(name, role)`)
  .is('deleted_at', null)
  .order('start_time', { ascending: false })
  .limit(100)
```

→ Dönen her kayıt düzleştirilir: `model_name`, `operation_name`, `personnel_name` alanları eklenir

**POST /api/production**

Zorunlu alanlar: `model_id`, `operation_id`, `personnel_id`, `start_time`

```javascript
// 1. Birim değeri operations tablosundan çek
const { data: op } = await supabaseAdmin
    .from('operations').select('unit_price').eq('id', operation_id).single();
unit_value = op.unit_price * total_produced;

// 2. Metrikleri hesapla
const metrics = calcMetrics({ total_produced, defective_count, start_time, end_time, ... });

// 3. Kayıt ekle
supabaseAdmin.from('production_logs').insert({ ...insertData, unit_value, ...metrics })

// 4. models.completed_count güncelle (arka planda)
supabaseAdmin.from('models').update({ completed_count: total }).eq('id', model_id)

// 5. personnel performans güncelle (arka planda)
supabaseAdmin.from('personnel').update({
    daily_avg_output, error_rate, efficiency_score
}).eq('id', personnel_id)
```

### 3.2 `app/app/api/production/[id]/route.js`

**GET /api/production/[id]** — İlişkisel veriyle tek kayıt

**PUT /api/production/[id]** — Güncellenebilir alanlar:

```javascript
const ALLOWED_FIELDS = [
    'total_produced', 'defective_count', 'defect_reason', 'defect_source',
    'break_duration_min', 'machine_down_min', 'material_wait_min', 'passive_time_min',
    'quality_score', 'lot_change', 'status', 'end_time',
    'defect_photo', 'defect_classification', 'notes',
    'first_pass_yield', 'oee_score', 'takt_time_ratio', 'unit_value', 'net_work_minutes',
];
```

**DELETE /api/production/[id]** — Soft delete

---

## 4. OTOMATİK METRİK HESAPLAMA

```javascript
function calcMetrics({ total_produced, defective_count, start_time, end_time,
    break_duration_min, machine_down_min, material_wait_min, passive_time_min }) {

    const good = (total_produced || 0) - (defective_count || 0);
    const fpy = total_produced > 0 ? (good / total_produced) * 100 : 100;

    const totalMin = end_time
        ? (new Date(end_time) - new Date(start_time)) / 60000
        : 0;
    const lostMin = (break_duration_min||0) + (machine_down_min||0)
                  + (material_wait_min||0) + (passive_time_min||0);
    const netWork = Math.max(0, totalMin - lostMin);

    const availability = totalMin > 0 ? netWork / totalMin : 0;
    const performance = netWork > 0 ? total_produced / netWork : 0;
    const quality = fpy / 100;
    const oee = availability * Math.min(performance, 1) * quality * 100;

    return {
        first_pass_yield: Math.round(fpy * 10) / 10,
        oee_score: Math.round(oee * 10) / 10,
        net_work_minutes: Math.round(netWork * 10) / 10,
        takt_time_ratio: netWork > 0 ? Math.round((netWork / Math.max(total_produced, 1)) * 100) / 100 : 0,
    };
}
```

---

## 5. ARKA PLAN OTOMATİK GÜNCELLEMELER

Üretim kaydedildikten sonra arka planda 2 tablo otomatik güncellenir:

### models.completed_count

```javascript
// Bu modelde toplam üretilen adet
const total = production_logs.filter(r => r.model_id == model_id)
                              .reduce((s, r) => s + r.total_produced, 0);
models.update({ completed_count: total }).eq('id', model_id)
```

### personnel performans (son 30 gün)

```javascript
personnel.update({
    daily_avg_output: ortalama_günlük_üretim,
    error_rate: hata_oranı_yuzde,
    efficiency_score: ortalama_oee_skoru,
}).eq('id', personnel_id)
```

---

## 6. BAĞLANTI ŞEMASİ

```
production_logs
├── model_id     → models(id)
├── operation_id → operations(id)
└── personnel_id → personnel(id)

Yerleştirme sonrası:
production_logs → models (completed_count güncel)
production_logs → personnel (daily_avg_output, error_rate, efficiency_score güncel)
production_logs → prim_kayitlari (ay sonu prim hesabında kullanılır)
production_logs → rapor/ay-ozet (aylık özet raporlarda kullanılır)
```

---

## 7. RLS

```sql
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_production_all" ON production_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
```
