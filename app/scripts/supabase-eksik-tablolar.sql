-- =====================================================
-- KAMERA-PANEL: Eksik Tablolar — Supabase'e Ekle
-- Supabase Dashboard → SQL Editor'a yapıştır ve çalıştır
-- =====================================================

-- 1. PRİM KAYITLARI
CREATE TABLE IF NOT EXISTS prim_kayitlari (
  id BIGSERIAL PRIMARY KEY,
  personel_id BIGINT REFERENCES personnel(id) ON DELETE CASCADE,
  ay INTEGER NOT NULL CHECK(ay BETWEEN 1 AND 12),
  yil INTEGER NOT NULL,
  toplam_uretilen INTEGER DEFAULT 0,
  toplam_hatali INTEGER DEFAULT 0,
  fpy_yuzde NUMERIC(6,2) DEFAULT 100,
  katki_degeri NUMERIC(12,2) DEFAULT 0,
  maas_maliyeti NUMERIC(12,2) DEFAULT 0,
  katki_maas_farki NUMERIC(12,2) DEFAULT 0,
  prim_orani NUMERIC(5,2) DEFAULT 15,
  prim_tutari NUMERIC(12,2) DEFAULT 0,
  onay_durumu TEXT DEFAULT 'hesaplandi' CHECK(onay_durumu IN ('hesaplandi','onaylandi','odendi','reddedildi')),
  onaylayan_id BIGINT,
  onay_tarihi TIMESTAMPTZ,
  odeme_tarihi DATE,
  notlar TEXT DEFAULT '',
  hesaplama_tarihi TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(personel_id, ay, yil)
);

-- 1b. AUDIT TRAIL (düzeltme geçmişi)
CREATE TABLE IF NOT EXISTS audit_trail (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT DEFAULT 'admin',
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  user_id BIGINT,
  user_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table ON audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_at ON audit_trail(changed_at DESC);


-- 2. KAR/ZARAR ÖZETİ
CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
  id BIGSERIAL PRIMARY KEY,
  ay INTEGER NOT NULL CHECK(ay BETWEEN 1 AND 12),
  yil INTEGER NOT NULL,
  toplam_gelir NUMERIC(14,2) DEFAULT 0,
  toplam_gider NUMERIC(14,2) DEFAULT 0,
  net_kar NUMERIC(14,2) DEFAULT 0,
  kar_marji_yuzde NUMERIC(6,2) DEFAULT 0,
  durum TEXT DEFAULT 'taslak' CHECK(durum IN ('taslak','onaylandi','revize')),
  onay_notu TEXT,
  kapatan_kullanici TEXT DEFAULT 'admin',
  kapama_tarihi TIMESTAMPTZ,
  detay_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ay, yil)
);

-- 3. KARAR ARŞİVİ
CREATE TABLE IF NOT EXISTS karar_arsivi (
  id BIGSERIAL PRIMARY KEY,
  tarih DATE DEFAULT CURRENT_DATE,
  konu TEXT NOT NULL,
  bolum TEXT DEFAULT 'uretim',
  sistem_onerisi TEXT,
  yapilan_karar TEXT,
  sonuc TEXT,
  sonuc_sayisal NUMERIC(12,2),
  sistem_mi_dogru BOOLEAN,
  ogrenim_notu TEXT,
  ilgili_ay INTEGER,
  ilgili_yil INTEGER,
  sorumlu_id BIGINT REFERENCES personnel(id),
  sorumlu_ad TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERSONEL SGK KAYITLARI
CREATE TABLE IF NOT EXISTS personel_sgk (
  id BIGSERIAL PRIMARY KEY,
  personel_id BIGINT NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  ay INTEGER NOT NULL CHECK(ay BETWEEN 1 AND 12),
  yil INTEGER NOT NULL,
  odenen_tutar NUMERIC(12,2) DEFAULT 0,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(personel_id, ay, yil)
);

-- 5. MODEL İŞLEM SIRASI
CREATE TABLE IF NOT EXISTS model_islem_sirasi (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  sira_no INTEGER NOT NULL,
  islem_adi TEXT NOT NULL,
  makine_tipi TEXT DEFAULT '',
  zorluk_derecesi INTEGER DEFAULT 3 CHECK(zorluk_derecesi BETWEEN 1 AND 5),
  tahmini_sure_dk INTEGER DEFAULT 0,
  nasil_yapilir TEXT DEFAULT '',
  ses_kayit_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ARA KONTROL
CREATE TABLE IF NOT EXISTS ara_kontrol (
  id BIGSERIAL PRIMARY KEY,
  parti_id BIGINT REFERENCES parti_kabul(id),
  model_id BIGINT REFERENCES models(id),
  kontrol_eden_id BIGINT REFERENCES personnel(id),
  istasyon TEXT DEFAULT 'Dikim',
  sira_no INTEGER,
  beden TEXT DEFAULT '',
  adet INTEGER DEFAULT 0,
  hatali INTEGER DEFAULT 0,
  foto_url TEXT DEFAULT '',
  numune_foto_url TEXT DEFAULT '',
  ai_uyum_skoru NUMERIC(5,2),
  onay BOOLEAN DEFAULT TRUE,
  ret_nedeni TEXT DEFAULT '',
  notlar TEXT DEFAULT '',
  tarih DATE DEFAULT CURRENT_DATE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PERSONEL SAAT KAYITLARI (isim düzeltmesi)
-- Not: Şemada "personel_saat" var ama kodda "personel_saat_kayitlari" kullanılıyor.
-- Birini diğerine alias yapıyoruz veya yeni tablo oluşturuyoruz:
CREATE TABLE IF NOT EXISTS personel_saat_kayitlari (
  id BIGSERIAL PRIMARY KEY,
  personel_id BIGINT REFERENCES personnel(id) ON DELETE CASCADE,
  tarih DATE NOT NULL,
  giris_saat TEXT,
  cikis_saat TEXT,
  net_calisma_dakika NUMERIC(8,2) DEFAULT 0,
  mesai_dakika NUMERIC(8,2) DEFAULT 0,
  gec_kalma_dakika NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(personel_id, tarih)
);

-- 8. İŞLETME GİDERLERİ (saatlik_maliyet alanı eklenmesi)
ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS saatlik_maliyet NUMERIC(10,4) DEFAULT 0;

-- 9. PERSONNEL SGK EMPLOYER RATE alanları
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS sgk_employer_rate NUMERIC(5,2) DEFAULT 20.5;
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS prim_orani NUMERIC(5,2) DEFAULT 15;

-- 10. PARTI KABUL eksik alanlar
ALTER TABLE parti_kabul ADD COLUMN IF NOT EXISTS parca_eksik_not TEXT DEFAULT '';
ALTER TABLE parti_kabul ADD COLUMN IF NOT EXISTS beden_eksik_not TEXT DEFAULT '';

-- 11. ÜRETİM GİRİŞLERİ (lot/parti açma)
-- uretim-giris/route.js bu tabloyu kullanıyor ama hiçbir SQL'de tanımlı değildi!
CREATE TABLE IF NOT EXISTS uretim_girisleri (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  getiren_personel_id BIGINT REFERENCES personnel(id),
  acan_personel_id BIGINT REFERENCES personnel(id),
  acilis_tarihi DATE,
  beden_eksik BOOLEAN DEFAULT FALSE,
  beden_eksik_detay TEXT DEFAULT '',
  aksesuar_eksik BOOLEAN DEFAULT FALSE,
  aksesuar_eksik_detay TEXT DEFAULT '',
  kumas_eksik BOOLEAN DEFAULT FALSE,
  kumas_eksik_detay TEXT DEFAULT '',
  numune_ayrildi BOOLEAN DEFAULT FALSE,
  parca_sayisi INTEGER DEFAULT 0,
  notlar TEXT DEFAULT '',
  durum TEXT DEFAULT 'beklemede' CHECK(durum IN ('beklemede','devam','tamamlandi','iptal')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ÜRETİM GİRİŞ PARÇALARI
CREATE TABLE IF NOT EXISTS uretim_giris_parcalar (
  id BIGSERIAL PRIMARY KEY,
  giris_id BIGINT REFERENCES uretim_girisleri(id) ON DELETE CASCADE,
  parca_adi TEXT NOT NULL,
  fotograf_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- İNDEXLER (performans)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_prim_personel_ay_yil ON prim_kayitlari(personel_id, ay, yil);
CREATE INDEX IF NOT EXISTS idx_karar_arsivi_tarih ON karar_arsivi(tarih DESC);
CREATE INDEX IF NOT EXISTS idx_personel_saat_tarih ON personel_saat_kayitlari(tarih);
CREATE INDEX IF NOT EXISTS idx_personel_saat_personel ON personel_saat_kayitlari(personel_id);
CREATE INDEX IF NOT EXISTS idx_model_islem_model ON model_islem_sirasi(model_id, sira_no);
CREATE INDEX IF NOT EXISTS idx_ara_kontrol_model ON ara_kontrol(model_id);
CREATE INDEX IF NOT EXISTS idx_kar_zarar_ay_yil ON kar_zarar_ozet(ay, yil);
CREATE INDEX IF NOT EXISTS idx_uretim_giris_model ON uretim_girisleri(model_id);
CREATE INDEX IF NOT EXISTS idx_production_start_time ON production_logs(start_time DESC);
