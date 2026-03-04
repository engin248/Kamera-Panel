-- ============================================================
-- SQL ADIM 4: KARAR ARŞİVİ (Sistem Öğrenme Döngüsü)
-- Supabase Dashboard → SQL Editor → Yeni Sorgu → Yapıştır → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS karar_arsivi (
  id BIGSERIAL PRIMARY KEY,
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  konu TEXT NOT NULL,
  bolum TEXT DEFAULT 'uretim',

  -- Sistem tarafı: Bot ne önerdi?
  sistem_onerisi TEXT,
  oneri_detay TEXT,
  oneri_verisi NUMERIC(12,2),

  -- İnsan kararı: Yönetici ne yaptı?
  yapilan_karar TEXT,
  karar_detay TEXT,

  -- Sonuç: Ne oldu?
  sonuc TEXT,
  sonuc_sayisal NUMERIC(12,2),
  sistem_mi_dogru BOOLEAN,
  -- TRUE = Sistem haklıydı, FALSE = İnsan haklıydı

  -- Öğrenme: Bir sonraki benzer durum için
  ogrenim_notu TEXT,
  ilgili_ay INTEGER,
  ilgili_yil INTEGER,

  -- Kim kaydetti
  sorumlu_id BIGINT REFERENCES personnel(id),
  sorumlu_ad TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_karar_tarih ON karar_arsivi(tarih DESC);
CREATE INDEX IF NOT EXISTS idx_karar_bolum ON karar_arsivi(bolum);

-- Doğrulama:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'karar_arsivi' ORDER BY ordinal_position;
