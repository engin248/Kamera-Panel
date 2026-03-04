-- =====================================================
-- KAMERA-PANEL: Orders + Customers Supabase Tabloları
-- Supabase Dashboard → SQL Editor'a yapıştır ve çalıştır
-- =====================================================

-- 1. MÜŞTERİLER
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  tax_no TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SİPARİŞLER
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT UNIQUE,
  customer_id BIGINT REFERENCES customers(id),
  customer_name TEXT DEFAULT '',
  model_id BIGINT REFERENCES models(id),
  model_name TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2) DEFAULT 0,
  delivery_date DATE,
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('acil','yuksek','normal','dusuk')),
  fabric_type TEXT DEFAULT '',
  color TEXT DEFAULT '',
  sizes TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'siparis_alindi'
    CHECK(status IN ('siparis_alindi','uretimde','tamamlandi','teslim_edildi','iptal')),
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRİM KAYITLARI
CREATE TABLE IF NOT EXISTS prim_kayitlari (
  id BIGSERIAL PRIMARY KEY,
  personel_id BIGINT REFERENCES personnel(id) ON DELETE RESTRICT,
  ay INTEGER NOT NULL CHECK(ay BETWEEN 1 AND 12),
  yil INTEGER NOT NULL,
  toplam_uretilen INTEGER DEFAULT 0,
  toplam_hatali INTEGER DEFAULT 0,
  fpy_yuzde NUMERIC(6,2) DEFAULT 100,
  katki_degeri NUMERIC(12,2) DEFAULT 0,
  maas_maliyeti NUMERIC(12,2) DEFAULT 0,
  katki_maas_farki NUMERIC(12,2) DEFAULT 0,
  prim_orani NUMERIC(5,2) DEFAULT 30,
  prim_tutari NUMERIC(12,2) DEFAULT 0,
  onay_durumu TEXT DEFAULT 'hesaplandi'
    CHECK(onay_durumu IN ('hesaplandi','onaylandi','reddedildi','odendi')),
  onaylayan_id BIGINT,
  onay_tarihi TIMESTAMPTZ,
  odeme_tarihi DATE,
  notlar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(personel_id, ay, yil)
);

-- 4. AUDIT TRAIL
CREATE TABLE IF NOT EXISTS audit_trail (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT DEFAULT 'admin',
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. İNDEXLER
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_model ON orders(model_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_prim_personel_ay_yil ON prim_kayitlari(personel_id, ay, yil);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_trail(table_name, record_id);

-- 6. İŞLEM TAMAMLANDI
-- Tablolar: customers, orders, prim_kayitlari, audit_trail
