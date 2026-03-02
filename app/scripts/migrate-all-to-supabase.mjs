// scripts/migrate-all-to-supabase.mjs
// Tüm tabloları SQLite'dan Supabase'e taşır
// Çalıştır: node scripts/migrate-all-to-supabase.mjs
// Force: node scripts/migrate-all-to-supabase.mjs --force

import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORCE = process.argv.includes('--force');

const SUPABASE_URL = 'https://cauptlsnqieegdrgotob.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6htr6a2WnfuZuOG-zYVBHA_JcGE7s3R';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DB_PATH = path.join(__dirname, '..', 'data', 'kamera-panel.db');
const db = new Database(DB_PATH, { readonly: true });

// JSON olarak tutulması gereken text alanlar
const JSON_FIELDS = {
    personnel: ['operation_skill_scores', 'machine_adjustments', 'fabric_experience', 'capable_operations'],
    models: ['measurement_table', 'op_dikim_details', 'op_kesim_details', 'op_utu_paket_details', 'op_nakis_details', 'op_yikama_details'],
    parti_kabul: ['beden_listesi', 'parca_listesi'],
    ilk_urun_hazirlama: ['ara_iscilik'],
    operations: [],
};

// Boş string tarihleri null yap
const cleanDates = (obj) => {
    const dateFields = ['start_date', 'deleted_at', 'birth_date', 'sgk_entry_date', 'isg_training_date',
        'last_health_check', 'delivery_date', 'work_start_date', 'purchase_date', 'last_maintenance',
        'next_maintenance', 'sent_date', 'expected_date', 'received_date', 'shipment_date',
        'gelis_tarihi', 'created_at', 'updated_at', 'checked_at'];
    for (const f of dateFields) {
        if (obj[f] === '' || obj[f] === 'null') obj[f] = null;
    }
    return obj;
};

// Sayısal düzeltme
const cleanNumbers = (obj, fields) => {
    for (const f of fields) {
        if (obj[f] !== undefined) obj[f] = parseFloat(obj[f]) || 0;
    }
    return obj;
};

// Tek tablo migration
async function migrateTable(tableName, { query, transform } = {}) {
    console.log(`\n📦 ${tableName} taşınıyor...`);
    let rows;
    try {
        rows = db.prepare(query || `SELECT * FROM ${tableName} WHERE deleted_at IS NULL`).all();
    } catch (e) {
        // deleted_at olmayan tablolar
        rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    }
    console.log(`   ${rows.length} kayıt bulundu`);

    if (rows.length === 0) { console.log('   ⏭️  Boş, geçiliyor'); return { success: 0, failed: 0 }; }

    let success = 0, failed = 0;
    const jsonFields = JSON_FIELDS[tableName] || [];

    for (const row of rows) {
        let data = { ...row };

        // JSON parse
        for (const f of jsonFields) {
            if (data[f] && typeof data[f] === 'string') {
                try { data[f] = JSON.parse(data[f]); } catch { data[f] = {}; }
            }
            if (!data[f] || typeof data[f] !== 'object') data[f] = {};
        }

        // Temizlik
        cleanDates(data);
        if (transform) data = transform(data);

        try {
            const { error } = await supabase.from(tableName).upsert(data, { onConflict: 'id', ignoreDuplicates: false });
            if (error) {
                failed++;
                console.log(`   ❌ ID ${data.id}: ${error.message}`);
            } else {
                success++;
                if (success <= 3) console.log(`   ✅ ID ${data.id} — ${data.name || data.firma_adi || ''}`);
            }
        } catch (e) {
            failed++;
            console.log(`   ❌ ID ${data.id}: ${e.message}`);
        }
    }

    if (success > 3) console.log(`   ... ve ${success - 3} tane daha`);
    console.log(`   📊 Başarılı: ${success} | Başarısız: ${failed}`);
    return { success, failed };
}

async function main() {
    console.log('🚀 TAM SUPABASE MIGRATION BAŞLIYOR');
    console.log(`📂 SQLite: ${DB_PATH}`);
    console.log(`☁️  Supabase: ${SUPABASE_URL}`);
    console.log(`⚡ Force mod: ${FORCE ? 'AÇIK' : 'KAPALI'}`);
    console.log('═'.repeat(50));

    const results = {};

    // 1. Bağımsız tablolar (FK yok)
    results.customers = await migrateTable('customers');
    results.machines = await migrateTable('machines');
    results.users = await migrateTable('users', { query: 'SELECT * FROM users' });
    results.personnel = await migrateTable('personnel');
    results.work_schedule = await migrateTable('work_schedule', { query: 'SELECT * FROM work_schedule' });
    results.monthly_work_days = await migrateTable('monthly_work_days', { query: 'SELECT * FROM monthly_work_days' });
    results.business_expenses = await migrateTable('business_expenses');

    // 2. Bağımlı tablolar
    results.models = await migrateTable('models');
    results.fason_providers = await migrateTable('fason_providers');
    results.orders = await migrateTable('orders');
    results.shipments = await migrateTable('shipments');

    // 3. FK = models'a bağlı
    results.operations = await migrateTable('operations');
    results.cost_entries = await migrateTable('cost_entries');
    results.fason_orders = await migrateTable('fason_orders');

    // 4. FK = models + operations + personnel
    results.production_logs = await migrateTable('production_logs');
    results.quality_checks = await migrateTable('quality_checks');
    results.approval_queue = await migrateTable('approval_queue');
    results.audit_trail = await migrateTable('audit_trail', { query: 'SELECT * FROM audit_trail' });
    results.activity_log = await migrateTable('activity_log', { query: 'SELECT * FROM activity_log' });

    // 5. Yeni M1-M3 tabloları
    results.parti_kabul = await migrateTable('parti_kabul');
    results.kalip_arsivi = await migrateTable('kalip_arsivi', { query: 'SELECT * FROM kalip_arsivi' });
    results.ilk_urun_hazirlama = await migrateTable('ilk_urun_hazirlama', { query: 'SELECT * FROM ilk_urun_hazirlama' });

    // ÖZET
    console.log('\n' + '═'.repeat(50));
    console.log('📊 MİGRASYON ÖZETİ');
    console.log('═'.repeat(50));
    let totalOk = 0, totalFail = 0;
    for (const [tablo, r] of Object.entries(results)) {
        const icon = r.failed === 0 ? '✅' : '⚠️';
        console.log(`${icon} ${tablo.padEnd(25)} ${r.success} ok, ${r.failed} hata`);
        totalOk += r.success;
        totalFail += r.failed;
    }
    console.log('─'.repeat(50));
    console.log(`TOPLAM: ${totalOk} başarılı, ${totalFail} başarısız`);
    console.log('═'.repeat(50));
    console.log('\n🎉 Tam migration tamamlandı!');
    db.close();
}

main().catch(err => {
    console.error('💥 Kritik hata:', err);
    process.exit(1);
});
