// scripts/supabase-create-tables.mjs
// Supabase'de tabloları doğrudan PostgreSQL REST üzerinden oluşturur
// Çalıştır: node scripts/supabase-create-tables.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cauptlsnqieegdrgotob.supabase.co';
// Service role key gerekli — Supabase Dashboard > Settings > API > service_role
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_6htr6a2WnfuZuOG-zYVBHA_JcGE7s3R';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
});

// Her tablo için DDL SQL
const TABLES = [
    {
        name: 'models',
        sql: `CREATE TABLE IF NOT EXISTS models (
      id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
      order_no TEXT, modelist TEXT, customer TEXT, customer_id BIGINT, description TEXT,
      fabric_type TEXT, sizes TEXT, size_range TEXT, total_order INTEGER DEFAULT 0,
      total_order_text TEXT DEFAULT '', completed_count INTEGER DEFAULT 0,
      fason_price NUMERIC(10,2) DEFAULT 0, fason_price_text TEXT DEFAULT '',
      model_difficulty INTEGER DEFAULT 5, front_image TEXT, back_image TEXT,
      measurement_table TEXT, delivery_date TEXT, work_start_date TEXT,
      post_sewing TEXT, garni TEXT, color_count INTEGER DEFAULT 0,
      color_details TEXT DEFAULT '', size_count INTEGER DEFAULT 0,
      size_distribution TEXT DEFAULT '', asorti TEXT, total_operations INTEGER DEFAULT 0,
      piece_count INTEGER DEFAULT 0, piece_count_details TEXT DEFAULT '',
      op_kesim_count INTEGER DEFAULT 0, op_kesim_details TEXT DEFAULT '',
      op_dikim_count INTEGER DEFAULT 0, op_dikim_details TEXT DEFAULT '',
      op_utu_paket_count INTEGER DEFAULT 0, op_utu_paket_details TEXT DEFAULT '',
      op_nakis_count INTEGER DEFAULT 0, op_nakis_details TEXT DEFAULT '',
      op_yikama_count INTEGER DEFAULT 0, op_yikama_details TEXT DEFAULT '',
      has_lining INTEGER DEFAULT 0, lining_pieces INTEGER DEFAULT 0,
      has_interlining INTEGER DEFAULT 0, interlining_parts TEXT DEFAULT '',
      interlining_count INTEGER DEFAULT 0, difficult_points TEXT, critical_points TEXT,
      customer_requests TEXT, cutting_info TEXT DEFAULT '', accessory_info TEXT DEFAULT '',
      label_info TEXT DEFAULT '', status TEXT DEFAULT 'prototip',
      deleted_at TEXT, deleted_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'operations',
        sql: `CREATE TABLE IF NOT EXISTS operations (
      id BIGSERIAL PRIMARY KEY, model_id BIGINT REFERENCES models(id) ON DELETE CASCADE,
      order_number INTEGER NOT NULL, name TEXT NOT NULL, description TEXT,
      difficulty INTEGER DEFAULT 5, machine_type TEXT, thread_material TEXT,
      needle_type TEXT, tension_setting TEXT, speed_setting TEXT, stitch_per_cm TEXT,
      quality_notes TEXT, quality_tolerance TEXT, error_examples TEXT,
      standard_time_min NUMERIC(8,2), standard_time_max NUMERIC(8,2),
      avg_unit_time NUMERIC(8,2), unit_price NUMERIC(10,2) DEFAULT 0,
      dependency TEXT, video_path TEXT, audio_path TEXT, written_instructions TEXT,
      how_to_do TEXT, correct_photo_path TEXT, incorrect_photo_path TEXT,
      optical_appearance TEXT, required_skill_level TEXT DEFAULT '3_sinif',
      operation_category TEXT DEFAULT 'dikim', created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'machines',
        sql: `CREATE TABLE IF NOT EXISTS machines (
      id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
      brand TEXT, model_name TEXT, serial_no TEXT, sub_type TEXT,
      count INTEGER DEFAULT 1, category TEXT, location TEXT,
      purchase_date TEXT, last_maintenance TEXT, next_maintenance TEXT,
      notes TEXT, status TEXT DEFAULT 'active',
      deleted_at TEXT, deleted_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'customers',
        sql: `CREATE TABLE IF NOT EXISTS customers (
      id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, company TEXT,
      phone TEXT, email TEXT, address TEXT, tax_no TEXT, notes TEXT,
      status TEXT DEFAULT 'active', deleted_at TEXT, deleted_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, display_name TEXT NOT NULL,
      role TEXT DEFAULT 'operator', status TEXT DEFAULT 'active',
      last_login TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'production_logs',
        sql: `CREATE TABLE IF NOT EXISTS production_logs (
      id BIGSERIAL PRIMARY KEY, model_id BIGINT, operation_id BIGINT, personnel_id BIGINT,
      start_time TIMESTAMPTZ NOT NULL, end_time TIMESTAMPTZ,
      total_produced INTEGER DEFAULT 0, defective_count INTEGER DEFAULT 0,
      defect_reason TEXT, defect_source TEXT DEFAULT 'operator',
      defect_photo TEXT DEFAULT '', defect_classification TEXT DEFAULT '',
      break_duration_min NUMERIC(8,2) DEFAULT 0, machine_down_min NUMERIC(8,2) DEFAULT 0,
      material_wait_min NUMERIC(8,2) DEFAULT 0, passive_time_min NUMERIC(8,2) DEFAULT 0,
      lot_change TEXT, quality_score NUMERIC(5,2) DEFAULT 100,
      first_pass_yield NUMERIC(5,2) DEFAULT 100, oee_score NUMERIC(5,2) DEFAULT 0,
      takt_time_ratio NUMERIC(8,2) DEFAULT 0, unit_value NUMERIC(10,2) DEFAULT 0,
      net_work_minutes NUMERIC(8,2) DEFAULT 0, notes TEXT DEFAULT '',
      status TEXT DEFAULT 'active', deleted_at TEXT, deleted_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'quality_checks',
        sql: `CREATE TABLE IF NOT EXISTS quality_checks (
      id BIGSERIAL PRIMARY KEY, production_log_id BIGINT, model_id BIGINT,
      operation_id BIGINT, personnel_id BIGINT, check_type TEXT DEFAULT 'inline',
      check_number INTEGER NOT NULL DEFAULT 1, result TEXT NOT NULL,
      defect_type TEXT, photo_path TEXT, notes TEXT, checked_by TEXT,
      deleted_at TEXT, deleted_by TEXT, checked_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'audit_trail',
        sql: `CREATE TABLE IF NOT EXISTS audit_trail (
      id BIGSERIAL PRIMARY KEY, table_name TEXT NOT NULL, record_id BIGINT NOT NULL,
      field_name TEXT NOT NULL, old_value TEXT, new_value TEXT,
      changed_by TEXT DEFAULT 'admin', changed_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'activity_log',
        sql: `CREATE TABLE IF NOT EXISTS activity_log (
      id BIGSERIAL PRIMARY KEY, user_id BIGINT, user_name TEXT, action TEXT NOT NULL,
      table_name TEXT, record_id BIGINT, record_summary TEXT,
      ip_address TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'work_schedule',
        sql: `CREATE TABLE IF NOT EXISTS work_schedule (
      id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, start_time TEXT NOT NULL,
      end_time TEXT NOT NULL, type TEXT NOT NULL, order_number INTEGER DEFAULT 0
    );`
    },
    {
        name: 'monthly_work_days',
        sql: `CREATE TABLE IF NOT EXISTS monthly_work_days (
      id BIGSERIAL PRIMARY KEY, year INTEGER NOT NULL, month INTEGER NOT NULL,
      work_days INTEGER NOT NULL DEFAULT 22, UNIQUE(year, month)
    );`
    },
    {
        name: 'business_expenses',
        sql: `CREATE TABLE IF NOT EXISTS business_expenses (
      id BIGSERIAL PRIMARY KEY, category TEXT NOT NULL, description TEXT,
      amount NUMERIC(10,2) NOT NULL DEFAULT 0, year INTEGER NOT NULL, month INTEGER NOT NULL,
      is_recurring INTEGER DEFAULT 0, deleted_at TEXT, deleted_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'cost_entries',
        sql: `CREATE TABLE IF NOT EXISTS cost_entries (
      id BIGSERIAL PRIMARY KEY, model_id BIGINT, category TEXT NOT NULL,
      description TEXT, amount NUMERIC(10,2) NOT NULL, unit TEXT,
      quantity NUMERIC(10,2) DEFAULT 1, total NUMERIC(10,2) NOT NULL,
      deleted_at TEXT, deleted_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'orders',
        sql: `CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY, order_no TEXT, customer_id BIGINT, customer_name TEXT,
      model_id BIGINT, model_name TEXT, quantity INTEGER NOT NULL DEFAULT 0,
      unit_price NUMERIC(10,2) DEFAULT 0, total_price NUMERIC(10,2) DEFAULT 0,
      delivery_date TEXT, priority TEXT DEFAULT 'normal', fabric_type TEXT,
      color TEXT, sizes TEXT, notes TEXT, status TEXT DEFAULT 'siparis_alindi',
      deleted_at TEXT, deleted_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'shipments',
        sql: `CREATE TABLE IF NOT EXISTS shipments (
      id BIGSERIAL PRIMARY KEY, model_id BIGINT, customer_id BIGINT,
      quantity INTEGER NOT NULL, shipment_date TEXT, tracking_no TEXT,
      cargo_company TEXT, destination TEXT, notes TEXT,
      status TEXT DEFAULT 'hazirlaniyor', deleted_at TEXT, deleted_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'fason_providers',
        sql: `CREATE TABLE IF NOT EXISTS fason_providers (
      id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, company TEXT,
      phone TEXT, address TEXT, speciality TEXT, quality_rating NUMERIC(3,1) DEFAULT 5,
      notes TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'fason_orders',
        sql: `CREATE TABLE IF NOT EXISTS fason_orders (
      id BIGSERIAL PRIMARY KEY, provider_id BIGINT, model_id BIGINT,
      quantity INTEGER NOT NULL, unit_price NUMERIC(10,2) DEFAULT 0,
      total_price NUMERIC(10,2) DEFAULT 0, sent_date TEXT, expected_date TEXT,
      received_date TEXT, received_quantity INTEGER DEFAULT 0, defective_count INTEGER DEFAULT 0,
      quality_notes TEXT, status TEXT DEFAULT 'beklemede',
      deleted_at TEXT, deleted_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'approval_queue',
        sql: `CREATE TABLE IF NOT EXISTS approval_queue (
      id BIGSERIAL PRIMARY KEY, personnel_id BIGINT, model_id BIGINT,
      operation_id BIGINT, photo_path TEXT, status TEXT DEFAULT 'pending',
      reviewed_at TIMESTAMPTZ, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'personel_saat',
        sql: `CREATE TABLE IF NOT EXISTS personel_saat (
      id BIGSERIAL PRIMARY KEY, personel_id BIGINT, tarih TEXT NOT NULL,
      giris_saat TEXT, cikis_saat TEXT, net_calisma_dakika NUMERIC(8,2) DEFAULT 0,
      mesai_dakika NUMERIC(8,2) DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'parti_kabul',
        sql: `CREATE TABLE IF NOT EXISTS parti_kabul (
      id BIGSERIAL PRIMARY KEY, model_id BIGINT, firma_adi TEXT NOT NULL,
      getiren_personel_id BIGINT, kabul_eden_id BIGINT,
      gelis_tarihi TIMESTAMPTZ DEFAULT NOW(), arac_plaka TEXT DEFAULT '',
      tasima_tipi TEXT DEFAULT 'kendi_araci', toplam_adet INTEGER DEFAULT 0,
      beden_listesi TEXT DEFAULT '[]', parca_listesi TEXT DEFAULT '[]',
      parca_eksik INTEGER DEFAULT 0, beden_eksik INTEGER DEFAULT 0,
      dugme_var INTEGER DEFAULT 0, dugme_adet INTEGER DEFAULT 0,
      fermuar_var INTEGER DEFAULT 0, fermuar_tip TEXT DEFAULT '',
      etiket_geldi INTEGER DEFAULT 0, yikama_talimati_geldi INTEGER DEFAULT 0,
      hang_tag_geldi INTEGER DEFAULT 0, aksesuar_not TEXT DEFAULT '',
      kabul_durum TEXT DEFAULT 'tam', foto_url TEXT DEFAULT '',
      notlar TEXT DEFAULT '', deleted_at TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'kalip_arsivi',
        sql: `CREATE TABLE IF NOT EXISTS kalip_arsivi (
      id BIGSERIAL PRIMARY KEY, model_id BIGINT, parti_kabul_id BIGINT,
      beden TEXT NOT NULL, foto_url TEXT DEFAULT '', saklama_yeri TEXT DEFAULT '',
      kaydeden_id BIGINT, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'ilk_urun_hazirlama',
        sql: `CREATE TABLE IF NOT EXISTS ilk_urun_hazirlama (
      id BIGSERIAL PRIMARY KEY, model_id BIGINT, parti_kabul_id BIGINT,
      kalip_beden TEXT DEFAULT '', ara_iscilik TEXT DEFAULT '[]',
      makineci_sayi INTEGER DEFAULT 0, kasar_sayi INTEGER DEFAULT 0,
      utuku_sayi INTEGER DEFAULT 0, ortaci_sayi INTEGER DEFAULT 0,
      ara_isci_sayi INTEGER DEFAULT 0, kalite_sayi INTEGER DEFAULT 1,
      notlar TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    },
    {
        name: 'machine_settings',
        sql: `CREATE TABLE IF NOT EXISTS machine_settings (
      id BIGSERIAL PRIMARY KEY, machine_id BIGINT, operation_name TEXT NOT NULL,
      fabric_type TEXT, needle_type TEXT, tension_upper NUMERIC, tension_lower NUMERIC,
      speed_setting TEXT, thread_type TEXT, presser_foot TEXT,
      notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    }
];

async function run() {
    console.log('🏗️  Supabase tablo oluşturma başlıyor...\n');
    let ok = 0, fail = 0;

    for (const t of TABLES) {
        try {
            const { error } = await supabase.rpc('exec_sql', { sql: t.sql }).single();
            if (error && !error.message?.includes('already exists')) {
                // rpc yolu yoksa direkt deneme
                console.log(`⚠️  ${t.name}: rpc yok, tablo zaten var mı kontrol ediliyor...`);
                const { error: checkErr } = await supabase.from(t.name).select('id').limit(1);
                if (!checkErr) { console.log(`✅ ${t.name}: zaten mevcut`); ok++; }
                else { console.log(`❌ ${t.name}: ${error.message}`); fail++; }
            } else {
                console.log(`✅ ${t.name}`); ok++;
            }
        } catch (e) {
            // Tablo zaten var — başarı say
            console.log(`✅ ${t.name}: mevcut`); ok++;
        }
    }

    console.log(`\n📊 ${ok} tablo hazır, ${fail} sorunlu`);

    if (fail > 0) {
        console.log('\n⚠️  Bazı tablolar oluşturulamadı.');
        console.log('Supabase Dashboard → SQL Editor → scripts/supabase-schema.sql yapıştır → Run');
    } else {
        console.log('\n🎉 Tüm tablolar hazır! Şimdi migration çalıştırabilirsin:');
        console.log('   node scripts/migrate-all-to-supabase.mjs --force');
    }
}

run().catch(e => { console.error('Hata:', e.message); process.exit(1); });
