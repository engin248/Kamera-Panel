-- =====================================================
-- KAMERA-PANEL: İMALAT BÖLÜMÜ SQL TABLOLARI
-- Supabase Dashboard → SQL Editor'a yapıştır → Run
-- Kaynak: CLAUDE-ISLANI-IMALAT.md
-- =====================================================

-- 1. KESİM PLANLARI
CREATE TABLE IF NOT EXISTS kesim_planlari (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  siparis_id BIGINT REFERENCES orders(id),
  plan_tarihi DATE NOT NULL,
  toplam_adet INTEGER NOT NULL DEFAULT 0,
  beden_dagitimi JSONB DEFAULT '{}',
  kat_sayisi INTEGER DEFAULT 1,
  tahmini_sarj_metre NUMERIC(10,2) DEFAULT 0,
  tahmini_fire_yuzde NUMERIC(5,2) DEFAULT 5,
  durum TEXT DEFAULT 'planlandı' CHECK(durum IN ('planlandı','kesimde','tamamlandı','iptal')),
  kesimci_id BIGINT REFERENCES personnel(id),
  notlar TEXT DEFAULT '',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. KESİM KAYITLARI (gerçek kesim verisi)
CREATE TABLE IF NOT EXISTS kesim_kayitlari (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES kesim_planlari(id) ON DELETE CASCADE,
  gercek_adet INTEGER DEFAULT 0,
  fire_adet INTEGER DEFAULT 0,
  kullanilan_metre NUMERIC(10,2) DEFAULT 0,
  fire_metre NUMERIC(10,2) DEFAULT 0,
  fire_yuzde NUMERIC(5,2) DEFAULT 0,
  fire_nedeni TEXT DEFAULT '',
  kesim_tarihi TIMESTAMPTZ DEFAULT NOW(),
  kaydeden_id BIGINT REFERENCES personnel(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HAT PLANLAMASI (makine hattı + personel ataması)
CREATE TABLE IF NOT EXISTS hat_planlamasi (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  hat_adi TEXT NOT NULL,
  personel_listesi JSONB DEFAULT '[]',
  gun_hedefi INTEGER DEFAULT 0,
  aktif BOOLEAN DEFAULT TRUE,
  baslangic_tarihi DATE,
  bitis_tarihi DATE,
  notlar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. İMALAT FAZLARI (Kesim → Dikim → Ütü/Paket → Sevkiyat)
CREATE TABLE IF NOT EXISTS imalat_fazlari (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  siparis_id BIGINT REFERENCES orders(id),
  faz TEXT NOT NULL CHECK(faz IN ('kesim','dikim','kalite_inline','utu_paket','sevkiyat')),
  baslangic TIMESTAMPTZ,
  bitis TIMESTAMPTZ,
  tamamlanan_adet INTEGER DEFAULT 0,
  hedef_adet INTEGER DEFAULT 0,
  sorumlu_id BIGINT REFERENCES personnel(id),
  durum TEXT DEFAULT 'bekliyor' CHECK(durum IN ('bekliyor','devam','tamamlandi','gecikti')),
  notlar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. YARI MAMUL STOK
CREATE TABLE IF NOT EXISTS yari_mamul_stok (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  siparis_id BIGINT REFERENCES orders(id),
  faz_kaynak TEXT NOT NULL,
  faz_hedef TEXT NOT NULL,
  adet INTEGER DEFAULT 0,
  tarih TIMESTAMPTZ DEFAULT NOW(),
  kaydeden_id BIGINT REFERENCES personnel(id),
  notlar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- İNDEXLER
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_kesim_planlari_model ON kesim_planlari(model_id);
CREATE INDEX IF NOT EXISTS idx_kesim_planlari_siparis ON kesim_planlari(siparis_id);
CREATE INDEX IF NOT EXISTS idx_kesim_kayitlari_plan ON kesim_kayitlari(plan_id);
CREATE INDEX IF NOT EXISTS idx_hat_planlamasi_model ON hat_planlamasi(model_id);
CREATE INDEX IF NOT EXISTS idx_imalat_fazlari_model ON imalat_fazlari(model_id, faz);
CREATE INDEX IF NOT EXISTS idx_imalat_fazlari_siparis ON imalat_fazlari(siparis_id);
CREATE INDEX IF NOT EXISTS idx_yari_mamul_model ON yari_mamul_stok(model_id);
