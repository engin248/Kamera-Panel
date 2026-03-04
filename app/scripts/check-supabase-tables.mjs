// Supabase tablo kontrol scripti
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cauptlsnqieegdrgotob.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXB0bHNucWllZWdkcmdvdG9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQxNzE3MywiZXhwIjoyMDg3OTkzMTczfQ.MgVNEwQzHJncpL5JSm1HX7Z0VxRH1mqg3PjGyIlW1Sw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Kontrol edilecek tablolar
const TABLES = [
    'personnel',
    'models',
    'operations',
    'production_logs',
    'quality_checks',
    'approval_queue',
    'machines',
    'customers',
    'fason_providers',
    'fason_orders',
    'shipments',
    'cost_entries',
    'orders',
    'users',
    'audit_trail',
    'work_schedule',
    'monthly_work_days',
    'business_expenses',
    'personel_saat_kayitlari',
    'parti_kabul',
    'kalip_arsivi',
    'ilk_urun_hazirlama',
    // Eksik tablolar (yeni eklenenler)
    'prim_kayitlari',
    'kar_zarar_ozet',
    'karar_arsivi',
    'personel_sgk',
    'model_islem_sirasi',
    'ara_kontrol',
    'uretim_girisleri',
    'uretim_giris_parcalar',
];

async function checkTables() {
    console.log('🔍 Supabase Tablo Kontrolü Başlıyor...\n');

    let found = 0;
    let missing = 0;

    for (const table of TABLES) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('id')
                .limit(1);

            if (error && error.code === '42P01') {
                console.log(`❌ ${table} — BULUNAMADI`);
                missing++;
            } else if (error && error.message?.includes('does not exist')) {
                console.log(`❌ ${table} — BULUNAMADI`);
                missing++;
            } else if (error) {
                console.log(`⚠️  ${table} — HATA: ${error.message}`);
                missing++;
            } else {
                const count = data ? data.length : 0;
                console.log(`✅ ${table} — MEVCUT (${count} kayıt örneği)`);
                found++;
            }
        } catch (e) {
            console.log(`❌ ${table} — HATA: ${e.message}`);
            missing++;
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 SONUÇ: ${found} tablo mevcut, ${missing} eksik/hatalı`);
    console.log(`📊 TOPLAM: ${TABLES.length} tablo kontrol edildi`);

    if (missing === 0) {
        console.log('🎉 TÜM TABLOLAR MEVCUT!');
    } else {
        console.log(`⚠️  ${missing} tablo eksik veya hatalı — yukarıdaki listeyi kontrol edin`);
    }
}

checkTables();
