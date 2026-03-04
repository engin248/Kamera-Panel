-- ============================================================
-- SQL ADIM 1: SİSTEM AYARLARI
-- Supabase Dashboard → SQL Editor → Yeni Sorgu → Yapıştır → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS sistem_ayarlari (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  aciklama TEXT,
  kategori TEXT DEFAULT 'genel',
  guncelleme_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncelleyen TEXT DEFAULT 'sistem'
);

INSERT INTO sistem_ayarlari (key, value, aciklama, kategori) VALUES
  ('prim_orani', '15', 'Net katkı-maaş farkının prim yüzdesi (%)', 'prim'),
  ('sgk_isveren_orani', '22.5', 'İşveren SGK oranı (%)', 'muhasebe'),
  ('gelir_vergisi_orani', '15', 'Stopaj gelir vergisi oranı (%)', 'muhasebe'),
  ('min_prim_esigi', '250', 'Minimum prim hak ediş eşiği (TL)', 'prim'),
  ('prim_aktif', 'true', 'Prim sistemi aktif mi?', 'prim')
ON CONFLICT (key) DO NOTHING;

-- Doğrulama:
SELECT * FROM sistem_ayarlari;
