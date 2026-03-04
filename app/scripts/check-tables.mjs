// Supabase'deki mevcut tabloları kontrol eder
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABAS_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Supabase URL veya KEY bulunamadı!');
    console.log('Bulunanlar:', {
        SUPABASE_URL: SUPABASE_URL ? '✅' : '❌',
        SERVICE_KEY: SERVICE_KEY ? '✅' : '❌'
    });
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
});

// Beklenen tablolar (sistemde olması gerekenler)
const EXPECTED_TABLES = [
    // Ana tablolar
    'personnel', 'models', 'operations', 'machines', 'orders', 'customers',
    'production_logs', 'quality_checks', 'shipments', 'business_expenses',
    'fason_providers', 'fason_orders', 'prim_kayitlari', 'audit_trail',
    'parti_kabul', 'users',
    // Eksik olabilecekler
    'kar_zarar_ozet', 'karar_arsivi', 'personel_sgk', 'model_islem_sirasi',
    'ara_kontrol', 'personel_saat_kayitlari', 'approval_queue',
    'work_schedule', 'monthly_work_days', 'cost_entries',
    // İmalat (yeni)
    'kesim_planlari', 'kesim_kayitlari', 'hat_planlamasi', 'imalat_fazlari', 'yari_mamul_stok'
];

async function checkTables() {
    console.log('🔍 Supabase tablo kontrolü başlıyor...\n');
    console.log('URL:', SUPABASE_URL);
    console.log('KEY:', SERVICE_KEY.substring(0, 20) + '...\n');

    const existing = [];
    const missing = [];

    for (const table of EXPECTED_TABLES) {
        try {
            const { error } = await supabase.from(table).select('id').limit(1);
            if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
                missing.push(table);
                console.log(`❌ EKSİK: ${table}`);
            } else if (error && error.message.includes('No API key')) {
                console.log(`⚠️  KEY HATASI: ${table} - ${error.message}`);
                break;
            } else {
                existing.push(table);
                console.log(`✅ VAR:   ${table}`);
            }
        } catch (e) {
            missing.push(table);
            console.log(`❌ HATA:  ${table} - ${e.message}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Mevcut: ${existing.length} tablo`);
    console.log(`❌ Eksik:  ${missing.length} tablo`);

    if (missing.length > 0) {
        console.log('\n🔴 EKSİK TABLOLAR:');
        missing.forEach(t => console.log(`  - ${t}`));
    } else {
        console.log('\n🎉 Tüm tablolar mevcut!');
    }
}

checkTables().catch(console.error);
