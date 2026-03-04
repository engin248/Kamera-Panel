-- ============================================================
-- SQL ADIM 2: PRİM KAYITLARI (Pencere 5 — Rapor & Analiz)
-- Supabase Dashboard → SQL Editor → Yeni Sorgu → Yapıştır → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS prim_kayitlari (
  id BIGSERIAL PRIMARY KEY,
  personel_id BIGINT REFERENCES personnel(id) ON DELETE RESTRICT,
  ay INTEGER NOT NULL CHECK (ay BETWEEN 1 AND 12),
  yil INTEGER NOT NULL,

  -- Üretim özeti (production_logs'tan hesaplanır)
  toplam_uretilen INTEGER DEFAULT 0,
  toplam_hatali INTEGER DEFAULT 0,
  fpy_yuzde NUMERIC(5,2) DEFAULT 0,
  oee_ortalama NUMERIC(5,2) DEFAULT 0,

  -- Mali hesaplar (Vizyon formülü)
  katki_degeri NUMERIC(12,2) DEFAULT 0,
  -- Formül: SUM(toplam_adet × unit_value × (1 - hata_orani))

  maas_maliyeti NUMERIC(12,2) DEFAULT 0,
  -- Formül: brut_maas + yan_haklar + (brut_maas × 0.225 SGK)

  katki_maas_farki NUMERIC(12,2) DEFAULT 0,
  -- Formül: katki_degeri - maas_maliyeti

  prim_orani NUMERIC(5,2) DEFAULT 0,
  -- sistem_ayarlari.prim_orani'ndan alınan snapshot

  prim_tutari NUMERIC(12,2) DEFAULT 0,
  -- Formül: katki_maas_farki × prim_orani / 100

  -- Onay süreci
  onay_durumu TEXT DEFAULT 'hesaplandi'
    CHECK (onay_durumu IN ('hesaplandi','onaylandi','odendi','iptal')),
  onaylayan_id BIGINT REFERENCES personnel(id),
  onay_tarihi TIMESTAMPTZ,
  odeme_tarihi DATE,
  notlar TEXT,

  -- Audit
  hesaplayan TEXT DEFAULT 'sistem',
  hesaplama_tarihi TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(personel_id, ay, yil)
);

CREATE INDEX IF NOT EXISTS idx_prim_personel_ay ON prim_kayitlari(personel_id, ay, yil);
CREATE INDEX IF NOT EXISTS idx_prim_durum ON prim_kayitlari(onay_durumu);

-- Doğrulama:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'prim_kayitlari' ORDER BY ordinal_position;
