-- =====================================================
-- KAMERA-PANEL: Supabase PostgreSQL TAM ŞEMA
-- Supabase Dashboard → SQL Editor'a yapıştır ve çalıştır
-- =====================================================

-- ❗ ÖNCE: Mevcut tabloları temizle (ilk kurulumda)
-- DROP TABLE IF EXISTS ... CASCADE; (dikkatli kullan)

-- 1. MODELLER
CREATE TABLE IF NOT EXISTS models (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  order_no TEXT,
  modelist TEXT,
  customer TEXT,
  customer_id BIGINT,
  description TEXT,
  fabric_type TEXT,
  sizes TEXT,
  size_range TEXT,
  total_order INTEGER DEFAULT 0,
  total_order_text TEXT DEFAULT '',
  completed_count INTEGER DEFAULT 0,
  fason_price NUMERIC(10,2) DEFAULT 0,
  fason_price_text TEXT DEFAULT '',
  model_difficulty INTEGER DEFAULT 5,
  front_image TEXT,
  back_image TEXT,
  measurement_table JSONB DEFAULT '{}',
  delivery_date DATE,
  work_start_date DATE,
  post_sewing TEXT,
  garni TEXT,
  color_count INTEGER DEFAULT 0,
  color_details TEXT DEFAULT '',
  size_count INTEGER DEFAULT 0,
  size_distribution TEXT DEFAULT '',
  asorti TEXT,
  total_operations INTEGER DEFAULT 0,
  piece_count INTEGER DEFAULT 0,
  piece_count_details TEXT DEFAULT '',
  op_kesim_count INTEGER DEFAULT 0,
  op_kesim_details TEXT DEFAULT '',
  op_dikim_count INTEGER DEFAULT 0,
  op_dikim_details TEXT DEFAULT '',
  op_utu_paket_count INTEGER DEFAULT 0,
  op_utu_paket_details TEXT DEFAULT '',
  op_nakis_count INTEGER DEFAULT 0,
  op_nakis_details TEXT DEFAULT '',
  op_yikama_count INTEGER DEFAULT 0,
  op_yikama_details TEXT DEFAULT '',
  has_lining BOOLEAN DEFAULT FALSE,
  lining_pieces INTEGER DEFAULT 0,
  has_interlining BOOLEAN DEFAULT FALSE,
  interlining_parts TEXT DEFAULT '',
  interlining_count INTEGER DEFAULT 0,
  difficult_points TEXT,
  critical_points TEXT,
  customer_requests TEXT,
  cutting_info TEXT DEFAULT '',
  accessory_info TEXT DEFAULT '',
  label_info TEXT DEFAULT '',
  status TEXT DEFAULT 'prototip',
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. İŞLEMLER (operations)
CREATE TABLE IF NOT EXISTS operations (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  difficulty INTEGER DEFAULT 5 CHECK(difficulty >= 1 AND difficulty <= 10),
  machine_type TEXT,
  thread_material TEXT,
  needle_type TEXT,
  tension_setting TEXT,
  speed_setting TEXT,
  stitch_per_cm TEXT,
  quality_notes TEXT,
  quality_tolerance TEXT,
  error_examples TEXT,
  standard_time_min NUMERIC(8,2),
  standard_time_max NUMERIC(8,2),
  avg_unit_time NUMERIC(8,2),
  unit_price NUMERIC(10,2) DEFAULT 0,
  dependency TEXT,
  video_path TEXT,
  audio_path TEXT,
  written_instructions TEXT,
  how_to_do TEXT,
  correct_photo_path TEXT,
  incorrect_photo_path TEXT,
  optical_appearance TEXT,
  required_skill_level TEXT DEFAULT '3_sinif',
  operation_category TEXT DEFAULT 'dikim',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERSONEL (personnel) - zaten var, eksikleri ekle
-- ALTER TABLE personnel ADD COLUMN IF NOT EXISTS ...

-- 4. ÜRETİM KAYITLARI
CREATE TABLE IF NOT EXISTS production_logs (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  operation_id BIGINT REFERENCES operations(id),
  personnel_id BIGINT REFERENCES personnel(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  total_produced INTEGER DEFAULT 0,
  defective_count INTEGER DEFAULT 0,
  defect_reason TEXT,
  defect_source TEXT DEFAULT 'operator',
  defect_photo TEXT DEFAULT '',
  defect_classification TEXT DEFAULT '',
  break_duration_min NUMERIC(8,2) DEFAULT 0,
  machine_down_min NUMERIC(8,2) DEFAULT 0,
  material_wait_min NUMERIC(8,2) DEFAULT 0,
  passive_time_min NUMERIC(8,2) DEFAULT 0,
  lot_change TEXT,
  quality_score NUMERIC(5,2) DEFAULT 100,
  first_pass_yield NUMERIC(5,2) DEFAULT 100,
  oee_score NUMERIC(5,2) DEFAULT 0,
  takt_time_ratio NUMERIC(8,2) DEFAULT 0,
  unit_value NUMERIC(10,2) DEFAULT 0,
  net_work_minutes NUMERIC(8,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. KALİTE KONTROL
CREATE TABLE IF NOT EXISTS quality_checks (
  id BIGSERIAL PRIMARY KEY,
  production_log_id BIGINT REFERENCES production_logs(id),
  model_id BIGINT REFERENCES models(id),
  operation_id BIGINT REFERENCES operations(id),
  personnel_id BIGINT REFERENCES personnel(id),
  check_type TEXT DEFAULT 'inline',
  check_number INTEGER NOT NULL DEFAULT 1,
  result TEXT NOT NULL CHECK(result IN ('ok', 'red', 'warning')),
  defect_type TEXT,
  photo_path TEXT,
  notes TEXT,
  checked_by TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ONAY KUYRUĞU
CREATE TABLE IF NOT EXISTS approval_queue (
  id BIGSERIAL PRIMARY KEY,
  personnel_id BIGINT REFERENCES personnel(id),
  model_id BIGINT REFERENCES models(id),
  operation_id BIGINT REFERENCES operations(id),
  photo_path TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MAKİNELER
CREATE TABLE IF NOT EXISTS machines (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT,
  model_name TEXT,
  serial_no TEXT,
  sub_type TEXT,
  count INTEGER DEFAULT 1,
  category TEXT,
  location TEXT,
  purchase_date DATE,
  last_maintenance DATE,
  next_maintenance DATE,
  notes TEXT,
  status TEXT DEFAULT 'active',
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MUSAAAAŞTERİLER
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_no TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FASON TEDARİKÇİLER
CREATE TABLE IF NOT EXISTS fason_providers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  address TEXT,
  speciality TEXT,
  quality_rating NUMERIC(3,1) DEFAULT 5,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FASON SİPARİŞLERİ
CREATE TABLE IF NOT EXISTS fason_orders (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT REFERENCES fason_providers(id),
  model_id BIGINT REFERENCES models(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2) DEFAULT 0,
  sent_date DATE,
  expected_date DATE,
  received_date DATE,
  received_quantity INTEGER DEFAULT 0,
  defective_count INTEGER DEFAULT 0,
  quality_notes TEXT,
  status TEXT DEFAULT 'beklemede',
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SEVKİYATLAR
CREATE TABLE IF NOT EXISTS shipments (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  customer_id BIGINT REFERENCES customers(id),
  quantity INTEGER NOT NULL,
  shipment_date DATE,
  tracking_no TEXT,
  cargo_company TEXT,
  destination TEXT,
  notes TEXT,
  status TEXT DEFAULT 'hazirlaniyor',
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. MALİYET KALEMLERİ
CREATE TABLE IF NOT EXISTS cost_entries (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  unit TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  total NUMERIC(10,2) NOT NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SİPARİŞLER
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT,
  customer_id BIGINT REFERENCES customers(id),
  customer_name TEXT,
  model_id BIGINT REFERENCES models(id),
  model_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2) DEFAULT 0,
  delivery_date DATE,
  priority TEXT DEFAULT 'normal',
  fabric_type TEXT,
  color TEXT,
  sizes TEXT,
  notes TEXT,
  status TEXT DEFAULT 'siparis_alindi',
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. KULLANICILAR
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'operator',
  status TEXT DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. AUDİT TRAIL (birleştirilmiş — hem alan değişiklikleri hem aktivite logu)
-- NOT: Kod (auth.js logActivity) user_id, user_name, action, record_summary kullanıyor
CREATE TABLE IF NOT EXISTS audit_trail (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  action TEXT,
  record_summary TEXT,
  changed_by TEXT DEFAULT 'admin',
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  user_id BIGINT,
  user_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table ON audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_at ON audit_trail(changed_at DESC);

-- 17. ÇALIŞMA TAKVİMİ
CREATE TABLE IF NOT EXISTS work_schedule (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('work', 'break')),
  order_number INTEGER DEFAULT 0
);

-- 18. AYLIK ÇALIŞMA GÜNLERİ
CREATE TABLE IF NOT EXISTS monthly_work_days (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  work_days INTEGER NOT NULL DEFAULT 22,
  UNIQUE(year, month)
);

-- 19. İŞLETME GİDERLERİ
CREATE TABLE IF NOT EXISTS business_expenses (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. PERSONEL SAAT (giriş/çıkış)
-- NOT: Kodda "personel_saat_kayitlari" kullanıldığı için tablo ismi buna uygun
CREATE TABLE IF NOT EXISTS personel_saat_kayitlari (
  id BIGSERIAL PRIMARY KEY,
  personel_id BIGINT REFERENCES personnel(id),
  tarih DATE NOT NULL,
  giris_saat TEXT,
  cikis_saat TEXT,
  net_calisma_dakika NUMERIC(8,2) DEFAULT 0,
  mesai_dakika NUMERIC(8,2) DEFAULT 0,
  gec_kalma_dakika NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(personel_id, tarih)
);

-- 21. M1: PARTİ KABUL
CREATE TABLE IF NOT EXISTS parti_kabul (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  firma_adi TEXT NOT NULL,
  getiren_personel_id BIGINT,
  kabul_eden_id BIGINT,
  gelis_tarihi TIMESTAMPTZ DEFAULT NOW(),
  arac_plaka TEXT DEFAULT '',
  tasima_tipi TEXT DEFAULT 'kendi_araci',
  toplam_adet INTEGER DEFAULT 0,
  beden_listesi JSONB DEFAULT '[]',
  parca_listesi JSONB DEFAULT '[]',
  parca_eksik BOOLEAN DEFAULT FALSE,
  beden_eksik BOOLEAN DEFAULT FALSE,
  dugme_var BOOLEAN DEFAULT FALSE,
  dugme_adet INTEGER DEFAULT 0,
  fermuar_var BOOLEAN DEFAULT FALSE,
  fermuar_tip TEXT DEFAULT '',
  etiket_geldi BOOLEAN DEFAULT FALSE,
  yikama_talimati_geldi BOOLEAN DEFAULT FALSE,
  hang_tag_geldi BOOLEAN DEFAULT FALSE,
  aksesuar_not TEXT DEFAULT '',
  kabul_durum TEXT DEFAULT 'tam' CHECK(kabul_durum IN ('tam','eksikli','ret')),
  foto_url TEXT DEFAULT '',
  notlar TEXT DEFAULT '',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. M1: KALIP ARŞİVİ
CREATE TABLE IF NOT EXISTS kalip_arsivi (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  parti_kabul_id BIGINT REFERENCES parti_kabul(id),
  beden TEXT NOT NULL,
  foto_url TEXT DEFAULT '',
  saklama_yeri TEXT DEFAULT '',
  kaydeden_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. M2: İLK ÜRÜN HAZIRLAMA
CREATE TABLE IF NOT EXISTS ilk_urun_hazirlama (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  parti_kabul_id BIGINT,
  kalip_beden TEXT DEFAULT '',
  ara_iscilik JSONB DEFAULT '[]',
  makineci_sayi INTEGER DEFAULT 0,
  kasar_sayi INTEGER DEFAULT 0,
  utuku_sayi INTEGER DEFAULT 0,
  ortaci_sayi INTEGER DEFAULT 0,
  ara_isci_sayi INTEGER DEFAULT 0,
  kalite_sayi INTEGER DEFAULT 1,
  notlar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- İNDEXLER (performans)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
CREATE INDEX IF NOT EXISTS idx_models_code ON models(code);
CREATE INDEX IF NOT EXISTS idx_personnel_status ON personnel(status);
CREATE INDEX IF NOT EXISTS idx_production_model ON production_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_production_personnel ON production_logs(personnel_id);
CREATE INDEX IF NOT EXISTS idx_production_date ON production_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_trail(table_name, record_id);

-- =====================================================
-- ROW LEVEL SECURITY (isteğe bağlı - şimdilik kapalı)
-- =====================================================
-- ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
-- ... (sonraki adımda aktif edilecek)
