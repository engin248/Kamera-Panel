-- =====================================================
-- KAMERA-PANEL: YENİ TABLOLAR MİGRATION
-- Pencere 5 (Rapor & Analiz) + Pencere 6 (Muhasebe)
-- Supabase Dashboard → SQL Editor'a yapıştır ve çalıştır
-- Tarih: 2026-03-03
-- =====================================================

-- ÖNEMLİ NOT: Mevcut tablolar BIGSERIAL/BIGINT kullanıyor (UUID değil)
-- Bu migration aynı desen: BIGSERIAL PRIMARY KEY, BIGINT FK

-- =====================================================
-- 1. SİSTEM AYARLARI (prim_orani, sgk oranı vb.)
-- =====================================================
CREATE TABLE IF NOT EXISTS sistem_ayarlari (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  aciklama TEXT,
  kategori TEXT DEFAULT 'genel',
  guncelleme_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncelleyen TEXT DEFAULT 'sistem'
);

-- Varsayılan değerler
INSERT INTO sistem_ayarlari (key, value, aciklama, kategori) VALUES
  ('prim_orani', '15', 'Net katkı-maaş farkının prim yüzdesi (%)', 'prim'),
  ('sgk_isveren_orani', '22.5', 'İşveren SGK yükümlülük oranı (%)', 'muhasebe'),
  ('gelir_vergisi_orani', '15', 'Stopaj gelir vergisi oranı (%)', 'muhasebe'),
  ('min_prim_esigi', '250', 'Minimum prim hak ediş eşiği (TL)', 'prim'),
  ('prim_aktif', 'true', 'Prim sistemi açık mı?', 'prim')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 2. PRİM KAYITLARI
-- Hesaplama + onay + ödeme süreci
-- =====================================================
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

  -- Mali hesaplar
  katki_degeri NUMERIC(12,2) DEFAULT 0,    -- SUM(adet × unit_value × (1-hata_orani))
  maas_maliyeti NUMERIC(12,2) DEFAULT 0,   -- brut_maas + yan_haklar + sgk_isveren
  katki_maas_farki NUMERIC(12,2) DEFAULT 0, -- katki - maas
  prim_orani NUMERIC(5,2) DEFAULT 0,       -- % olarak (snapshot — o andaki oran)
  prim_tutari NUMERIC(12,2) DEFAULT 0,     -- fark × oran%

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

-- =====================================================
-- 3. KAR ZARAR ÖZET
-- Aylık kapanış muhasebesi
-- =====================================================
CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
  id BIGSERIAL PRIMARY KEY,
  ay INTEGER NOT NULL CHECK (ay BETWEEN 1 AND 12),
  yil INTEGER NOT NULL,

  -- Gelir
  toplam_gelir NUMERIC(14,2) DEFAULT 0,      -- Tamamlanan siparişler

  -- Gider kalemleri
  hammadde_gider NUMERIC(14,2) DEFAULT 0,    -- cost_entries
  iscilik_gider NUMERIC(14,2) DEFAULT 0,     -- Personel brüt + SGK toplamı
  fason_gider NUMERIC(14,2) DEFAULT 0,       -- fason_orders toplamı
  sabit_gider NUMERIC(14,2) DEFAULT 0,       -- business_expenses sabit
  degisken_gider NUMERIC(14,2) DEFAULT 0,    -- business_expenses değişken
  prim_gider NUMERIC(14,2) DEFAULT 0,        -- Ödenen primler toplamı

  -- Hesaplanan değerler
  toplam_gider NUMERIC(14,2) DEFAULT 0,
  brut_kar NUMERIC(14,2) DEFAULT 0,
  net_kar NUMERIC(14,2) DEFAULT 0,
  kar_marji_yuzde NUMERIC(5,2) DEFAULT 0,

  -- Üretim performansı
  toplam_uretim_adedi INTEGER DEFAULT 0,
  ortalama_fpy NUMERIC(5,2) DEFAULT 0,
  ortalama_oee NUMERIC(5,2) DEFAULT 0,
  basa_bas_adet NUMERIC(10,2) DEFAULT 0,

  -- Durum akışı
  durum TEXT DEFAULT 'taslak'
    CHECK (durum IN ('taslak','onaylandi','kapandi')),
  onaylayan_id BIGINT REFERENCES personnel(id),
  onay_tarihi TIMESTAMPTZ,
  kapayan_id BIGINT REFERENCES personnel(id),
  kapanma_tarihi TIMESTAMPTZ,

  -- Notlar
  yonetim_notu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ay, yil)
);

CREATE INDEX IF NOT EXISTS idx_karzarar_ay ON kar_zarar_ozet(ay, yil);
CREATE INDEX IF NOT EXISTS idx_karzarar_durum ON kar_zarar_ozet(durum);

-- =====================================================
-- 4. KARAR ARŞİVİ
-- Sistem önerisi vs. yönetici kararı — öğrenme döngüsü
-- =====================================================
CREATE TABLE IF NOT EXISTS karar_arsivi (
  id BIGSERIAL PRIMARY KEY,
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  konu TEXT NOT NULL,
  bolum TEXT DEFAULT 'uretim',

  -- Sistem tarafı
  sistem_onerisi TEXT,
  oneri_detay TEXT,        -- JSON string olarak saklanabilir
  oneri_verisi NUMERIC(12,2),

  -- İnsan kararı
  yapilan_karar TEXT,
  karar_detay TEXT,

  -- Sonuç
  sonuc TEXT,
  sonuc_sayisal NUMERIC(12,2),
  sistem_mi_dogru BOOLEAN,  -- true = sistem haklıydı, false = insan haklıydı

  -- Öğrenme
  ogrenim_notu TEXT,
  ilgili_ay INTEGER,
  ilgili_yil INTEGER,

  -- Audit
  sorumlu_id BIGINT REFERENCES personnel(id),
  sorumlu_ad TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_karar_tarih ON karar_arsivi(tarih DESC);
CREATE INDEX IF NOT EXISTS idx_karar_bolum ON karar_arsivi(bolum);

-- =====================================================
-- 5. MEVCUT TABLOLARA ALAN EKLEMELERİ
-- =====================================================

-- operations tablosuna standart süre (takt zamanı için)
-- NOT: unit_price zaten var — birim_deger EKLEME
ALTER TABLE operations
  ADD COLUMN IF NOT EXISTS standart_sure_dk NUMERIC(8,2) DEFAULT 0;

-- production_logs: katkı değeri önbelleği (performans)
ALTER TABLE production_logs
  ADD COLUMN IF NOT EXISTS katki_degeri_tutari NUMERIC(12,2) DEFAULT 0;

-- personnel tablosu: self-serve portal aktivasyonu
-- (Supabase'de personnel tablosu varsa)
ALTER TABLE personnel
  ADD COLUMN IF NOT EXISTS portal_aktif BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notlar TEXT;

-- =====================================================
-- 6. DOĞRULAMA SORGULARI
-- Aşağıdaki sorguları çalıştırarak tabloların oluştuğunu doğrula
-- =====================================================

/*
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'sistem_ayarlari',
    'prim_kayitlari',
    'kar_zarar_ozet',
    'karar_arsivi'
  )
ORDER BY table_name, ordinal_position;

-- Varsayılan ayarları kontrol et:
SELECT * FROM sistem_ayarlari;
*/
