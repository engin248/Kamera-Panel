# 🗄️ DİĞER TABLOLAR — Supabase SQL Dokümantasyonu

> **Tarih:** 2026-03-03  
> **Durum:** ✅ SQL Hazır ve Supabase'e Uygulandı  
> **Tablolar:** customers, orders, shipments, fason_providers, fason_orders,  
> quality_checks, approval_queue, work_schedule, monthly_work_days,  
> personel_saat, users, audit_trail, sistem_ayarlari

---

## 1. MÜŞTERİLER — `customers`

```sql
CREATE TABLE IF NOT EXISTS customers (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    company     TEXT,
    phone       TEXT,
    email       TEXT,
    address     TEXT,
    tax_no      TEXT,
    notes       TEXT,
    status      TEXT DEFAULT 'active',
    deleted_at  TIMESTAMPTZ,
    deleted_by  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. SİPARİŞLER — `orders`

```sql
CREATE TABLE IF NOT EXISTS orders (
    id              BIGSERIAL PRIMARY KEY,
    order_no        TEXT,
    customer_id     BIGINT REFERENCES customers(id),
    customer_name   TEXT,
    model_id        BIGINT REFERENCES models(id),
    model_name      TEXT,
    quantity        INTEGER NOT NULL DEFAULT 0,
    unit_price      NUMERIC(10,2) DEFAULT 0,
    total_price     NUMERIC(10,2) DEFAULT 0,
    delivery_date   DATE,
    priority        TEXT DEFAULT 'normal',
    fabric_type     TEXT,
    color           TEXT,
    sizes           TEXT,
    notes           TEXT,
    status          TEXT DEFAULT 'siparis_alindi',
    deleted_at      TIMESTAMPTZ,
    deleted_by      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. SEVKİYAT — `shipments`

```sql
CREATE TABLE IF NOT EXISTS shipments (
    id              BIGSERIAL PRIMARY KEY,
    model_id        BIGINT REFERENCES models(id),
    customer_id     BIGINT REFERENCES customers(id),
    quantity        INTEGER NOT NULL,
    shipment_date   DATE,
    tracking_no     TEXT,
    cargo_company   TEXT,
    destination     TEXT,
    notes           TEXT,
    status          TEXT DEFAULT 'hazirlaniyor',
    deleted_at      TIMESTAMPTZ,
    deleted_by      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. FASON — `fason_providers` + `fason_orders`

```sql
CREATE TABLE IF NOT EXISTS fason_providers (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    company         TEXT,
    phone           TEXT,
    address         TEXT,
    speciality      TEXT,
    quality_rating  NUMERIC(3,1) DEFAULT 5,
    notes           TEXT,
    status          TEXT DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fason_orders (
    id                  BIGSERIAL PRIMARY KEY,
    provider_id         BIGINT REFERENCES fason_providers(id),
    model_id            BIGINT REFERENCES models(id),
    quantity            INTEGER NOT NULL,
    unit_price          NUMERIC(10,2) DEFAULT 0,
    total_price         NUMERIC(10,2) DEFAULT 0,
    sent_date           DATE,
    expected_date       DATE,
    received_date       DATE,
    received_quantity   INTEGER DEFAULT 0,
    defective_count     INTEGER DEFAULT 0,
    quality_notes       TEXT,
    status              TEXT DEFAULT 'beklemede',
    deleted_at          TIMESTAMPTZ,
    deleted_by          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. KALİTE KONTROL — `quality_checks`

```sql
CREATE TABLE IF NOT EXISTS quality_checks (
    id                  BIGSERIAL PRIMARY KEY,
    production_log_id   BIGINT REFERENCES production_logs(id),
    model_id            BIGINT REFERENCES models(id),
    operation_id        BIGINT REFERENCES operations(id),
    personnel_id        BIGINT REFERENCES personnel(id),
    check_type          TEXT DEFAULT 'inline',
    check_number        INTEGER NOT NULL DEFAULT 1,
    result              TEXT NOT NULL CHECK (result IN ('ok','red','warning')),
    defect_type         TEXT,
    photo_path          TEXT,
    notes               TEXT,
    checked_by          TEXT,
    deleted_at          TIMESTAMPTZ,
    deleted_by          TEXT,
    checked_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. ONAY KUYRUĞU — `approval_queue`

```sql
CREATE TABLE IF NOT EXISTS approval_queue (
    id              BIGSERIAL PRIMARY KEY,
    personnel_id    BIGINT REFERENCES personnel(id),
    model_id        BIGINT REFERENCES models(id),
    operation_id    BIGINT REFERENCES operations(id),
    photo_path      TEXT,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reviewed_at     TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_approval" ON approval_queue FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 7. AYLIK ÇALIŞMA GÜNLERİ — `monthly_work_days`

```sql
CREATE TABLE IF NOT EXISTS monthly_work_days (
    id          BIGSERIAL PRIMARY KEY,
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    work_days   INTEGER NOT NULL DEFAULT 22,
    UNIQUE(year, month)
);
ALTER TABLE monthly_work_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_workdays" ON monthly_work_days FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 8. DESTEK TABLOLAR

### `audit_trail` — Değişiklik Geçmişi

```sql
CREATE TABLE IF NOT EXISTS audit_trail (
    id          BIGSERIAL PRIMARY KEY,
    table_name  TEXT NOT NULL,
    record_id   BIGINT NOT NULL,
    field_name  TEXT NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_by  TEXT DEFAULT 'admin',
    changed_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Her PUT/DELETE işleminde `models` ve `personnel` API'leri bu tabloya kayıt ekler.

### `sistem_ayarlari` — 5 Varsayılan Kayıt

```sql
CREATE TABLE IF NOT EXISTS sistem_ayarlari (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    description TEXT,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan değerler:
INSERT INTO sistem_ayarlari VALUES
    ('prim_orani',        '10',             'Varsayılan prim yüzdesi (%)'),
    ('sgk_isveren_orani', '20.5',           'SGK işveren payı (%)'),
    ('aylik_calisma_gunu','22',             'Aylık varsayılan iş günü'),
    ('firma_adi',         'Kamera Tekstil', 'Firma adı'),
    ('prim_havuzu_yuzde', '10',             'Net kardan prim havuzu yüzdesi (%)');
```

### `work_schedule` — Çalışma Takvimi

```sql
CREATE TABLE IF NOT EXISTS work_schedule (
    id           BIGSERIAL PRIMARY KEY,
    name         TEXT NOT NULL,    -- "Sabah vardiyası", "Öğle molası"
    start_time   TEXT NOT NULL,    -- "08:00"
    end_time     TEXT NOT NULL,    -- "12:00"
    type         TEXT NOT NULL CHECK (type IN ('work','break')),
    order_number INTEGER DEFAULT 0
);
```

### `personel_saat` — Giriş/Çıkış Saati

```sql
CREATE TABLE IF NOT EXISTS personel_saat (
    id                      BIGSERIAL PRIMARY KEY,
    personel_id             BIGINT REFERENCES personnel(id),
    tarih                   DATE NOT NULL,
    giris_saat              TEXT,           -- "08:05"
    cikis_saat              TEXT,           -- "17:30"
    net_calisma_dakika      NUMERIC(8,2) DEFAULT 0,
    mesai_dakika            NUMERIC(8,2) DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### `users` — Uygulama Kullanıcıları

```sql
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    role            TEXT DEFAULT 'operator'
        CHECK (role IN ('koordinator','ustabasi','kaliteci','operator','muhasip')),
    status          TEXT DEFAULT 'active',
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. TOPLAM SUPABASE TABLO LİSTESİ (22 Tablo)

| # | Tablo | Açıklama |
|---|---|---|
| 1 | `personnel` | Personel profilleri |
| 2 | `models` | Model kartları |
| 3 | `operations` | Model operasyonları |
| 4 | `production_logs` | Üretim kayıtları |
| 5 | `machines` | Makine envanteri |
| 6 | `cost_entries` | Model maliyet kalemleri |
| 7 | `business_expenses` | İşletme giderleri |
| 8 | `prim_kayitlari` | Prim motor tablosu |
| 9 | `kar_zarar_ozet` | Aylık muhasebe özeti |
| 10 | `karar_arsivi` | Karar öğrenme sistemi |
| 11 | `audit_trail` | Değişiklik geçmişi |
| 12 | `sistem_ayarlari` | Sistem ayarları |
| 13 | `customers` | Müşteri listesi |
| 14 | `orders` | Siparişler |
| 15 | `shipments` | Sevkiyatlar |
| 16 | `fason_providers` | Fason tedarikçiler |
| 17 | `fason_orders` | Fason siparişler |
| 18 | `quality_checks` | Kalite kontrol |
| 19 | `approval_queue` | Onay kuyruğu |
| 20 | `work_schedule` | Çalışma takvimi |
| 21 | `personel_saat` | Giriş/çıkış saati |
| 22 | `users` | Uygulama kullanıcıları |
