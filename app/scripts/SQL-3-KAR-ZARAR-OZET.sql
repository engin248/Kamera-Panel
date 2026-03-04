-- ============================================================
-- SQL ADIM 3: KAR ZARAR ÖZET (Pencere 6 — Muhasebe)
-- Supabase Dashboard → SQL Editor → Yeni Sorgu → Yapıştır → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
  id BIGSERIAL PRIMARY KEY,
  ay INTEGER NOT NULL CHECK (ay BETWEEN 1 AND 12),
  yil INTEGER NOT NULL,

  -- Gelir
  toplam_gelir NUMERIC(14,2) DEFAULT 0,

  -- Gider kalemleri (ayrı ayrı izlenebilir)
  hammadde_gider NUMERIC(14,2) DEFAULT 0,
  iscilik_gider NUMERIC(14,2) DEFAULT 0,
  fason_gider NUMERIC(14,2) DEFAULT 0,
  sabit_gider NUMERIC(14,2) DEFAULT 0,
  degisken_gider NUMERIC(14,2) DEFAULT 0,
  prim_gider NUMERIC(14,2) DEFAULT 0,

  -- Hesaplanan değerler
  toplam_gider NUMERIC(14,2) DEFAULT 0,
  brut_kar NUMERIC(14,2) DEFAULT 0,
  net_kar NUMERIC(14,2) DEFAULT 0,
  kar_marji_yuzde NUMERIC(5,2) DEFAULT 0,

  -- Performans
  toplam_uretim_adedi INTEGER DEFAULT 0,
  ortalama_fpy NUMERIC(5,2) DEFAULT 0,
  ortalama_oee NUMERIC(5,2) DEFAULT 0,
  basa_bas_adet NUMERIC(10,2) DEFAULT 0,

  -- Durum akışı: taslak → onaylandi → kapandi
  durum TEXT DEFAULT 'taslak'
    CHECK (durum IN ('taslak','onaylandi','kapandi')),
  onaylayan_id BIGINT REFERENCES personnel(id),
  onay_tarihi TIMESTAMPTZ,
  kapayan_id BIGINT REFERENCES personnel(id),
  kapanma_tarihi TIMESTAMPTZ,
  yonetim_notu TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ay, yil)
);

CREATE INDEX IF NOT EXISTS idx_karzarar_ay ON kar_zarar_ozet(ay, yil);

-- Doğrulama:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'kar_zarar_ozet' ORDER BY ordinal_position;
