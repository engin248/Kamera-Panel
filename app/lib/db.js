import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'kamera-panel.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const PHOTOS_DIR = path.join(UPLOADS_DIR, 'photos');

[UPLOADS_DIR, VIDEOS_DIR, PHOTOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    -- Modeller
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      order_no TEXT,
      modelist TEXT,
      customer TEXT,
      customer_id INTEGER,
      description TEXT,
      fabric_type TEXT,
      sizes TEXT,
      size_range TEXT,
      total_order INTEGER DEFAULT 0,
      total_order_text TEXT DEFAULT '',
      completed_count INTEGER DEFAULT 0,
      fason_price REAL DEFAULT 0,
      fason_price_text TEXT DEFAULT '',
      model_difficulty INTEGER DEFAULT 5,
      front_image TEXT,
      back_image TEXT,
      measurement_table TEXT,
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
      has_lining INTEGER DEFAULT 0,
      lining_pieces INTEGER DEFAULT 0,
      has_interlining INTEGER DEFAULT 0,
      interlining_parts TEXT DEFAULT '',
      interlining_count INTEGER DEFAULT 0,
      difficult_points TEXT,
      critical_points TEXT,
      customer_requests TEXT,
      status TEXT DEFAULT 'prototip',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- İşlemler
    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL,
      order_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      difficulty INTEGER DEFAULT 5 CHECK(difficulty >= 1 AND difficulty <= 10),
      machine_type TEXT,
      thread_material TEXT,
      needle_type TEXT,
      tension_setting TEXT,
      speed_setting TEXT,
      quality_notes TEXT,
      quality_tolerance TEXT,
      error_examples TEXT,
      standard_time_min REAL,
      standard_time_max REAL,
      unit_price REAL DEFAULT 0,
      dependency TEXT,
      video_path TEXT,
      audio_path TEXT,
      written_instructions TEXT,
      correct_photo_path TEXT,
      incorrect_photo_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );

    -- Personel
    CREATE TABLE IF NOT EXISTS personnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'overlokcu',
      daily_wage REAL DEFAULT 0,
      skill_level TEXT DEFAULT 'baslangic',
      machines TEXT,
      skills TEXT,
      language TEXT DEFAULT 'tr',
      work_start TEXT DEFAULT '08:00',
      work_end TEXT DEFAULT '18:00',
      adaptation_status TEXT DEFAULT 'normal',
      start_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Üretim Kayıtları
    CREATE TABLE IF NOT EXISTS production_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL,
      operation_id INTEGER NOT NULL,
      personnel_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      total_produced INTEGER DEFAULT 0,
      defective_count INTEGER DEFAULT 0,
      defect_reason TEXT,
      defect_source TEXT DEFAULT 'operator',
      break_duration_min REAL DEFAULT 0,
      machine_down_min REAL DEFAULT 0,
      material_wait_min REAL DEFAULT 0,
      passive_time_min REAL DEFAULT 0,
      lot_change TEXT,
      quality_score REAL DEFAULT 100,
      defect_photo TEXT DEFAULT '',
      defect_classification TEXT DEFAULT '',
      first_pass_yield REAL DEFAULT 100,
      oee_score REAL DEFAULT 0,
      takt_time_ratio REAL DEFAULT 0,
      unit_value REAL DEFAULT 0,
      net_work_minutes REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (model_id) REFERENCES models(id),
      FOREIGN KEY (operation_id) REFERENCES operations(id),
      FOREIGN KEY (personnel_id) REFERENCES personnel(id)
    );

    -- Kalite Kontroller
    CREATE TABLE IF NOT EXISTS quality_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      production_log_id INTEGER,
      model_id INTEGER,
      operation_id INTEGER,
      personnel_id INTEGER,
      check_type TEXT DEFAULT 'inline',
      check_number INTEGER NOT NULL DEFAULT 1,
      result TEXT NOT NULL CHECK(result IN ('ok', 'red', 'warning')),
      defect_type TEXT,
      photo_path TEXT,
      notes TEXT,
      checked_by TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (production_log_id) REFERENCES production_logs(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );

    -- Onay Kuyruğu (İlk ürün onay talepleri)
    CREATE TABLE IF NOT EXISTS approval_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      personnel_id INTEGER NOT NULL,
      model_id INTEGER NOT NULL,
      operation_id INTEGER NOT NULL,
      photo_path TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reviewed_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (personnel_id) REFERENCES personnel(id),
      FOREIGN KEY (model_id) REFERENCES models(id),
      FOREIGN KEY (operation_id) REFERENCES operations(id)
    );

    -- Çalışma Takvimi (Aylık çalışma günü sayısı)
    CREATE TABLE IF NOT EXISTS monthly_work_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      work_days INTEGER NOT NULL DEFAULT 22,
      UNIQUE(year, month)
    );

    -- Sabit Mola Çizelgesi
    CREATE TABLE IF NOT EXISTS work_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('work', 'break')),
      order_number INTEGER DEFAULT 0
    );

    -- İşletme Giderleri
    CREATE TABLE IF NOT EXISTS business_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL DEFAULT 0,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Kullanıcılar (Yetki Sistemi)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT DEFAULT 'operator'
        CHECK(role IN ('koordinator','ustabasi','kaliteci','operator')),
      status TEXT DEFAULT 'active',
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- İşlem Günlüğü (Kim ne zaman ne yaptı)
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      record_summary TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Düzeltme Geçmişi (Audit Trail)
    CREATE TABLE IF NOT EXISTS audit_trail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT DEFAULT 'admin',
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Makineler
    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      brand TEXT,
      model_name TEXT,
      serial_no TEXT,
      location TEXT,
      purchase_date DATE,
      last_maintenance DATE,
      next_maintenance DATE,
      notes TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Makine Ayar Şablonları
    CREATE TABLE IF NOT EXISTS machine_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id INTEGER,
      operation_name TEXT NOT NULL,
      fabric_type TEXT,
      needle_type TEXT,
      tension_upper REAL,
      tension_lower REAL,
      speed_setting TEXT,
      thread_type TEXT,
      presser_foot TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    -- Müşteriler
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      tax_no TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Fason Tedarikçiler
    CREATE TABLE IF NOT EXISTS fason_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      address TEXT,
      speciality TEXT,
      quality_rating REAL DEFAULT 5,
      notes TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Fason Siparişleri
    CREATE TABLE IF NOT EXISTS fason_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      model_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      sent_date DATE,
      expected_date DATE,
      received_date DATE,
      received_quantity INTEGER DEFAULT 0,
      defective_count INTEGER DEFAULT 0,
      quality_notes TEXT,
      status TEXT DEFAULT 'beklemede',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES fason_providers(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );

    -- Sevkiyatlar
    CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL,
      customer_id INTEGER,
      quantity INTEGER NOT NULL,
      shipment_date DATE,
      tracking_no TEXT,
      cargo_company TEXT,
      destination TEXT,
      notes TEXT,
      status TEXT DEFAULT 'hazirlaniyor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (model_id) REFERENCES models(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Maliyet Kalemleri
    CREATE TABLE IF NOT EXISTS cost_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      unit TEXT,
      quantity REAL DEFAULT 1,
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (model_id) REFERENCES models(id)
    );

    -- Siparişler
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT,
      customer_id INTEGER,
      customer_name TEXT,
      model_id INTEGER,
      model_name TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      delivery_date DATE,
      priority TEXT DEFAULT 'normal',
      fabric_type TEXT,
      color TEXT,
      sizes TEXT,
      notes TEXT,
      status TEXT DEFAULT 'siparis_alindi',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );
  `);

  // Mevcut tablolara yeni sütun ekleme
  const alterStatements = [
    "ALTER TABLE personnel ADD COLUMN work_start TEXT DEFAULT '08:00'",
    "ALTER TABLE personnel ADD COLUMN work_end TEXT DEFAULT '18:00'",
    "ALTER TABLE personnel ADD COLUMN adaptation_status TEXT DEFAULT 'normal'",
    "ALTER TABLE models ADD COLUMN order_no TEXT",
    "ALTER TABLE models ADD COLUMN modelist TEXT",
    "ALTER TABLE models ADD COLUMN customer TEXT",
    "ALTER TABLE models ADD COLUMN customer_id INTEGER",
    "ALTER TABLE models ADD COLUMN sizes TEXT",
    "ALTER TABLE models ADD COLUMN front_image TEXT",
    "ALTER TABLE models ADD COLUMN back_image TEXT",
    "ALTER TABLE models ADD COLUMN measurement_table TEXT",
    "ALTER TABLE models ADD COLUMN delivery_date DATE",
    "ALTER TABLE models ADD COLUMN post_sewing TEXT",
    "ALTER TABLE models ADD COLUMN fason_price REAL DEFAULT 0",
    "ALTER TABLE models ADD COLUMN model_difficulty INTEGER DEFAULT 5",
    "ALTER TABLE models ADD COLUMN completed_count INTEGER DEFAULT 0",
    "ALTER TABLE operations ADD COLUMN needle_type TEXT",
    "ALTER TABLE operations ADD COLUMN tension_setting TEXT",
    "ALTER TABLE operations ADD COLUMN speed_setting TEXT",
    "ALTER TABLE operations ADD COLUMN quality_notes TEXT",
    "ALTER TABLE operations ADD COLUMN quality_tolerance TEXT",
    "ALTER TABLE operations ADD COLUMN error_examples TEXT",
    "ALTER TABLE operations ADD COLUMN standard_time_min REAL",
    "ALTER TABLE operations ADD COLUMN standard_time_max REAL",
    "ALTER TABLE operations ADD COLUMN unit_price REAL DEFAULT 0",
    "ALTER TABLE production_logs ADD COLUMN defect_source TEXT DEFAULT 'operator'",
    "ALTER TABLE production_logs ADD COLUMN material_wait_min REAL DEFAULT 0",
    "ALTER TABLE production_logs ADD COLUMN passive_time_min REAL DEFAULT 0",
    "ALTER TABLE production_logs ADD COLUMN quality_score REAL DEFAULT 100",
    "ALTER TABLE quality_checks ADD COLUMN model_id INTEGER",
    "ALTER TABLE quality_checks ADD COLUMN operation_id INTEGER",
    "ALTER TABLE quality_checks ADD COLUMN personnel_id INTEGER",
    "ALTER TABLE quality_checks ADD COLUMN check_type TEXT DEFAULT 'inline'",
    "ALTER TABLE quality_checks ADD COLUMN defect_type TEXT",
    "ALTER TABLE quality_checks ADD COLUMN checked_by TEXT",
    "ALTER TABLE machines ADD COLUMN brand TEXT",
    "ALTER TABLE machines ADD COLUMN model_name TEXT",
    "ALTER TABLE machines ADD COLUMN serial_no TEXT",
    "ALTER TABLE machines ADD COLUMN purchase_date DATE",
    "ALTER TABLE machines ADD COLUMN last_maintenance DATE",
    "ALTER TABLE machines ADD COLUMN next_maintenance DATE",
    "ALTER TABLE machines ADD COLUMN notes TEXT",
    "ALTER TABLE models ADD COLUMN garni TEXT",
    "ALTER TABLE models ADD COLUMN color_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN size_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN asorti TEXT",
    "ALTER TABLE models ADD COLUMN total_operations INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN piece_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN has_lining INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN lining_pieces INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN has_interlining INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN difficult_points TEXT",
    "ALTER TABLE models ADD COLUMN critical_points TEXT",
    "ALTER TABLE models ADD COLUMN customer_requests TEXT",
    "ALTER TABLE models ADD COLUMN work_start_date DATE",
    "ALTER TABLE operations ADD COLUMN stitch_per_cm TEXT",
    "ALTER TABLE operations ADD COLUMN how_to_do TEXT",
    "ALTER TABLE operations ADD COLUMN correct_photo_path TEXT",
    "ALTER TABLE operations ADD COLUMN incorrect_photo_path TEXT",
    "ALTER TABLE operations ADD COLUMN optical_appearance TEXT",
    "ALTER TABLE operations ADD COLUMN avg_unit_time REAL",
    "ALTER TABLE personnel ADD COLUMN base_salary REAL DEFAULT 0",
    "ALTER TABLE personnel ADD COLUMN transport_allowance REAL DEFAULT 0",
    "ALTER TABLE personnel ADD COLUMN ssk_cost REAL DEFAULT 0",
    "ALTER TABLE personnel ADD COLUMN food_allowance REAL DEFAULT 0",
    "ALTER TABLE personnel ADD COLUMN compensation REAL DEFAULT 0",
    "ALTER TABLE personnel ADD COLUMN technical_mastery TEXT DEFAULT 'operator'",
    "ALTER TABLE personnel ADD COLUMN speed_level TEXT DEFAULT 'normal'",
    "ALTER TABLE personnel ADD COLUMN quality_level TEXT DEFAULT 'standart'",
    "ALTER TABLE personnel ADD COLUMN discipline_level TEXT DEFAULT 'guvenilir'",
    "ALTER TABLE personnel ADD COLUMN versatility_level TEXT DEFAULT '1-2'",
    "ALTER TABLE personnel ADD COLUMN position TEXT",
    "ALTER TABLE personnel ADD COLUMN department TEXT",
    "ALTER TABLE machines ADD COLUMN sub_type TEXT",
    "ALTER TABLE machines ADD COLUMN count INTEGER DEFAULT 1",
    "ALTER TABLE machines ADD COLUMN category TEXT",
    "ALTER TABLE orders ADD COLUMN product_image TEXT",
    "ALTER TABLE orders ADD COLUMN model_description TEXT",
    "ALTER TABLE orders ADD COLUMN size_distribution TEXT",
    "ALTER TABLE orders ADD COLUMN color_details TEXT",
    "ALTER TABLE orders ADD COLUMN accessories TEXT",
    "ALTER TABLE orders ADD COLUMN lining_info TEXT",
    "ALTER TABLE orders ADD COLUMN packaging TEXT",
    "ALTER TABLE orders ADD COLUMN label_info TEXT",
    "ALTER TABLE orders ADD COLUMN washing_instructions TEXT",
    "ALTER TABLE orders ADD COLUMN sample_status TEXT DEFAULT 'yok'",
    "ALTER TABLE orders ADD COLUMN quality_criteria TEXT",
    "ALTER TABLE orders ADD COLUMN stitch_details TEXT",
    "ALTER TABLE orders ADD COLUMN delivery_method TEXT",
    "ALTER TABLE orders ADD COLUMN special_requests TEXT",
    "ALTER TABLE orders ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN deleted_by TEXT DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN delete_reason TEXT DEFAULT NULL",
    // Yeni model alanları (Madde 1-8)
    "ALTER TABLE models ADD COLUMN total_order_text TEXT",
    "ALTER TABLE models ADD COLUMN fason_price_text TEXT",
    "ALTER TABLE models ADD COLUMN color_details TEXT",
    "ALTER TABLE models ADD COLUMN size_distribution TEXT",
    "ALTER TABLE models ADD COLUMN op_kesim_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_kesim_details TEXT",
    "ALTER TABLE models ADD COLUMN op_dikim_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_dikim_details TEXT",
    "ALTER TABLE models ADD COLUMN op_utu_paket_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_utu_paket_details TEXT",
    "ALTER TABLE models ADD COLUMN op_nakis_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_nakis_details TEXT",
    "ALTER TABLE models ADD COLUMN op_yikama_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_yikama_details TEXT",
    "ALTER TABLE models ADD COLUMN interlining_parts TEXT",
    "ALTER TABLE models ADD COLUMN interlining_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN piece_count_details TEXT",
    // Operasyon detay alanları
    "ALTER TABLE operations ADD COLUMN required_skill_level TEXT DEFAULT '3_sinif'",
    "ALTER TABLE operations ADD COLUMN operation_category TEXT DEFAULT 'dikim'",
    // ===== YENİ: Personel Beceri/Kapasite Ölçüm Kriterleri =====
    // A. Üretim Kapasitesi
    "ALTER TABLE personnel ADD COLUMN daily_avg_output INTEGER DEFAULT 0",
    "ALTER TABLE personnel ADD COLUMN error_rate REAL DEFAULT 0",
    "ALTER TABLE personnel ADD COLUMN efficiency_score REAL DEFAULT 0",
    // B. Beceri Detayları
    "ALTER TABLE personnel ADD COLUMN capable_operations TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN operation_skill_scores TEXT DEFAULT '{}'",
    "ALTER TABLE personnel ADD COLUMN learning_speed TEXT DEFAULT 'normal'",
    "ALTER TABLE personnel ADD COLUMN independence_level TEXT DEFAULT 'kismen'",
    // C. Çalışma Disiplini ve Davranış
    "ALTER TABLE personnel ADD COLUMN attendance TEXT DEFAULT 'az'",
    "ALTER TABLE personnel ADD COLUMN punctuality TEXT DEFAULT 'genelde'",
    "ALTER TABLE personnel ADD COLUMN initiative_level TEXT DEFAULT 'orta'",
    "ALTER TABLE personnel ADD COLUMN teamwork_level TEXT DEFAULT 'iyi'",
    "ALTER TABLE personnel ADD COLUMN problem_solving TEXT DEFAULT 'sorar'",
    // D. Fiziksel ve Ergonomik
    "ALTER TABLE personnel ADD COLUMN physical_endurance TEXT DEFAULT 'iyi'",
    "ALTER TABLE personnel ADD COLUMN eye_health TEXT DEFAULT 'iyi'",
    "ALTER TABLE personnel ADD COLUMN health_restrictions TEXT DEFAULT ''",
    // E. Kariyer ve Gelişim
    "ALTER TABLE personnel ADD COLUMN leadership_potential TEXT DEFAULT 'hayir'",
    "ALTER TABLE personnel ADD COLUMN training_needs TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN general_evaluation TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN photo_url TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN national_id TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN phone TEXT DEFAULT ''",
    // ===== P1: KİMLİK & KİŞİSEL (YENİ) =====
    "ALTER TABLE personnel ADD COLUMN birth_date TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN gender TEXT DEFAULT 'erkek'",
    "ALTER TABLE personnel ADD COLUMN education TEXT DEFAULT 'ilkokul'",
    "ALTER TABLE personnel ADD COLUMN children_count TEXT DEFAULT '0'",
    "ALTER TABLE personnel ADD COLUMN blood_type TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN military_status TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN emergency_contact_name TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN emergency_contact_phone TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN emergency_contact_relation TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN smokes TEXT DEFAULT 'hayir'",
    "ALTER TABLE personnel ADD COLUMN prays TEXT DEFAULT 'hayir'",
    "ALTER TABLE personnel ADD COLUMN transport_type TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN turkish_level TEXT DEFAULT 'ana_dil'",
    "ALTER TABLE personnel ADD COLUMN living_status TEXT DEFAULT 'ailesiyle'",
    "ALTER TABLE personnel ADD COLUMN disability_status TEXT DEFAULT 'yok'",
    // ===== P2: İŞ GEÇMİŞİ (YENİ) =====
    "ALTER TABLE personnel ADD COLUMN contract_type TEXT DEFAULT 'belirsiz'",
    "ALTER TABLE personnel ADD COLUMN sgk_entry_date TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN previous_workplaces TEXT DEFAULT 'ilk_isi'",
    "ALTER TABLE personnel ADD COLUMN leave_reason TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN leave_types TEXT DEFAULT ''",
    // ===== P4: BECERİ (YENİ) =====
    "ALTER TABLE personnel ADD COLUMN finger_dexterity TEXT DEFAULT 'normal'",
    "ALTER TABLE personnel ADD COLUMN color_perception TEXT DEFAULT 'normal'",
    "ALTER TABLE personnel ADD COLUMN sample_reading TEXT DEFAULT 'gosterilmeli'",
    // ===== P5: MAKİNE AYAR (YENİ) =====
    "ALTER TABLE personnel ADD COLUMN machine_adjustment_care TEXT DEFAULT 'normal'",
    "ALTER TABLE personnel ADD COLUMN preferred_machine TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN most_efficient_machine TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN maintenance_skill TEXT DEFAULT 'basit'",
    "ALTER TABLE personnel ADD COLUMN machine_adjustments TEXT DEFAULT '{}'",
    // ===== P6: FİZİKSEL (YENİ) =====
    "ALTER TABLE personnel ADD COLUMN body_type TEXT DEFAULT 'normal'",
    "ALTER TABLE personnel ADD COLUMN work_capacity TEXT DEFAULT 'normal_rahat'",
    "ALTER TABLE personnel ADD COLUMN isg_training_date TEXT DEFAULT ''",
    "ALTER TABLE personnel ADD COLUMN last_health_check TEXT DEFAULT ''",
    // ===== P7: KARAKTERİSTİK (YENİ) =====
    "ALTER TABLE personnel ADD COLUMN reliability TEXT DEFAULT 'guvenilir'",
    "ALTER TABLE personnel ADD COLUMN hygiene TEXT DEFAULT 'normal'",
    "ALTER TABLE personnel ADD COLUMN change_openness TEXT DEFAULT 'acik'",
    "ALTER TABLE personnel ADD COLUMN responsibility_acceptance TEXT DEFAULT 'kabul_eder'",
    "ALTER TABLE personnel ADD COLUMN error_stance TEXT DEFAULT 'soyler'",
    // ===== P9: İŞLEMLER (YENİ) =====
    "ALTER TABLE personnel ADD COLUMN color_tone_matching TEXT DEFAULT 'fark_eder'",
    "ALTER TABLE personnel ADD COLUMN critical_matching_responsibility TEXT DEFAULT 'sorumluluk_alir'",
    "ALTER TABLE personnel ADD COLUMN fabric_experience TEXT DEFAULT '{}'",
    // ===== P10: GELİŞİM (YENİ) =====
    "ALTER TABLE personnel ADD COLUMN new_machine_learning TEXT DEFAULT 'istekli'",
    "ALTER TABLE personnel ADD COLUMN hard_work_avoidance TEXT DEFAULT 'kacmaz'",
    "ALTER TABLE personnel ADD COLUMN self_improvement TEXT DEFAULT 'gelisir'",
    // ===== P11: PERFORMANS (YENİ) =====
    "ALTER TABLE personnel ADD COLUMN operator_class TEXT DEFAULT 'B'",
    "ALTER TABLE personnel ADD COLUMN satisfaction_score TEXT DEFAULT '5'",
    "ALTER TABLE personnel ADD COLUMN recommend TEXT DEFAULT 'evet'",
    "ALTER TABLE personnel ADD COLUMN weekly_note TEXT DEFAULT ''",
    // ===== SOFT-DELETE SÜTUNLARI =====
    "ALTER TABLE personnel ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE personnel ADD COLUMN deleted_by TEXT DEFAULT NULL",
    "ALTER TABLE models ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE models ADD COLUMN deleted_by TEXT DEFAULT NULL",
    "ALTER TABLE machines ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE machines ADD COLUMN deleted_by TEXT DEFAULT NULL",
    "ALTER TABLE customers ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE customers ADD COLUMN deleted_by TEXT DEFAULT NULL",
    "ALTER TABLE shipments ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE shipments ADD COLUMN deleted_by TEXT DEFAULT NULL",
    "ALTER TABLE production_logs ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE production_logs ADD COLUMN deleted_by TEXT DEFAULT NULL",
    // ===== YENİ: Üretim Penceresi Kriterleri =====
    "ALTER TABLE production_logs ADD COLUMN defect_photo TEXT DEFAULT ''",
    "ALTER TABLE production_logs ADD COLUMN defect_classification TEXT DEFAULT ''",
    "ALTER TABLE production_logs ADD COLUMN first_pass_yield REAL DEFAULT 100",
    "ALTER TABLE production_logs ADD COLUMN oee_score REAL DEFAULT 0",
    "ALTER TABLE production_logs ADD COLUMN takt_time_ratio REAL DEFAULT 0",
    "ALTER TABLE production_logs ADD COLUMN unit_value REAL DEFAULT 0",
    "ALTER TABLE production_logs ADD COLUMN net_work_minutes REAL DEFAULT 0",
    "ALTER TABLE production_logs ADD COLUMN notes TEXT DEFAULT ''",
    "ALTER TABLE quality_checks ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE quality_checks ADD COLUMN deleted_by TEXT DEFAULT NULL",
    "ALTER TABLE cost_entries ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE cost_entries ADD COLUMN deleted_by TEXT DEFAULT NULL",
    "ALTER TABLE business_expenses ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE business_expenses ADD COLUMN deleted_by TEXT DEFAULT NULL",
    "ALTER TABLE fason_orders ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE fason_orders ADD COLUMN deleted_by TEXT DEFAULT NULL",
  ];
  for (const sql of alterStatements) {
    try { db.exec(sql); } catch (e) { /* sütun zaten var */ }
  }

  // Varsayılan Koordinatör kullanıcısı oluştur (yoksa)
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount === 0) {
    // Basit hash — sonra bcrypt'e geçilebilir
    db.prepare(
      'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)'
    ).run('admin', '47admin2026', 'Koordinatör', 'koordinator');
  }

  // Varsayılan mola çizelgesi ekle (yoksa)
  const scheduleCount = db.prepare('SELECT COUNT(*) as cnt FROM work_schedule').get().cnt;
  if (scheduleCount === 0) {
    const defaultSchedule = [
      { name: 'Sabah Mesai', start: '08:00', end: '10:00', type: 'work', order: 1 },
      { name: 'Çay Molası', start: '10:00', end: '10:20', type: 'break', order: 2 },
      { name: 'Sabah Mesai 2', start: '10:20', end: '13:00', type: 'work', order: 3 },
      { name: 'Öğle Molası', start: '13:00', end: '13:45', type: 'break', order: 4 },
      { name: 'Öğleden Sonra Mesai', start: '13:45', end: '16:00', type: 'work', order: 5 },
      { name: 'İkindi Molası', start: '16:00', end: '16:15', type: 'break', order: 6 },
      { name: 'Akşam Mesai', start: '16:15', end: '19:00', type: 'work', order: 7 },
    ];
    const ins = db.prepare('INSERT INTO work_schedule (name, start_time, end_time, type, order_number) VALUES (?, ?, ?, ?, ?)');
    for (const s of defaultSchedule) {
      ins.run(s.name, s.start, s.end, s.type, s.order);
    }
  }

  // Mevcut yıl için aylık çalışma günlerini hesapla (yoksa)
  const currentYear = new Date().getFullYear();
  const yearCheck = db.prepare('SELECT COUNT(*) as cnt FROM monthly_work_days WHERE year = ?').get(currentYear).cnt;
  if (yearCheck === 0) {
    const insMonth = db.prepare('INSERT OR IGNORE INTO monthly_work_days (year, month, work_days) VALUES (?, ?, ?)');
    for (let m = 1; m <= 12; m++) {
      // Hafta içi günleri say (Pazartesi-Cuma)
      let workDays = 0;
      const daysInMonth = new Date(currentYear, m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(currentYear, m - 1, d).getDay();
        if (day !== 0 && day !== 6) workDays++; // 0=Pazar, 6=Cumartesi
      }
      insMonth.run(currentYear, m, workDays);
    }
  }

  // === MIGRATION: Mevcut veritabanına eksik sütunları ekle ===
  const modelMigrations = [
    "ALTER TABLE models ADD COLUMN total_order_text TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN fason_price_text TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN color_details TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN size_distribution TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN piece_count_details TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN op_kesim_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_kesim_details TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN op_dikim_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_dikim_details TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN op_utu_paket_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_utu_paket_details TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN op_nakis_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_nakis_details TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN op_yikama_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN op_yikama_details TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN interlining_parts TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN interlining_count INTEGER DEFAULT 0",
    "ALTER TABLE models ADD COLUMN cutting_info TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN accessory_info TEXT DEFAULT ''",
    "ALTER TABLE models ADD COLUMN label_info TEXT DEFAULT ''",
  ];
  for (const sql of modelMigrations) {
    try { db.exec(sql); } catch { /* sütun zaten varsa hata verir, sorun yok */ }
  }
}

export default getDb;
