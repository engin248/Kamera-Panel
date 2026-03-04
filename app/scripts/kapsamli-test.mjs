// Kapsamlı Sistem Entegrasyon Testi
// Bot yönetimi, API, Auth, Veritabanı, Dosya yapısı
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

const sb = createClient(
    'https://cauptlsnqieegdrgotob.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXB0bHNucWllZWdkcmdvdG9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQxNzE3MywiZXhwIjoyMDg3OTkzMTczfQ.MgVNEwQzHJncpL5JSm1HX7Z0VxRH1mqg3PjGyIlW1Sw'
);

let totalPass = 0, totalFail = 0;
const failures = [];

function pass(msg) { totalPass++; console.log(`  ✅ ${msg}`); }
function fail(msg) { totalFail++; failures.push(msg); console.log(`  ❌ ${msg}`); }

async function testSupabaseTables() {
    console.log('\n═══ 1. VERİTABANI TABLOLARI ═══');
    const tables = ['personnel', 'models', 'operations', 'production_logs', 'quality_checks',
        'approval_queue', 'machines', 'customers', 'fason_providers', 'fason_orders', 'shipments',
        'cost_entries', 'orders', 'users', 'audit_trail', 'work_schedule', 'monthly_work_days',
        'business_expenses', 'personel_saat_kayitlari', 'parti_kabul', 'kalip_arsivi',
        'ilk_urun_hazirlama', 'prim_kayitlari', 'kar_zarar_ozet', 'karar_arsivi', 'personel_sgk',
        'model_islem_sirasi', 'ara_kontrol', 'uretim_girisleri', 'uretim_giris_parcalar'];

    for (const t of tables) {
        const { error } = await sb.from(t).select('id').limit(1);
        if (error) fail(`Tablo: ${t} → ${error.message}`);
        else pass(`Tablo: ${t}`);
    }
}

async function testSupabaseData() {
    console.log('\n═══ 2. VERİ BÜTÜNLÜĞÜ ═══');

    const { data: personnel } = await sb.from('personnel').select('id, name, role, status');
    if (personnel && personnel.length > 0) pass(`Personnel: ${personnel.length} kayıt`);
    else fail('Personnel: Kayıt yok');

    const { data: models } = await sb.from('models').select('id, name, code, status');
    if (models && models.length > 0) pass(`Models: ${models.length} kayıt`);
    else fail('Models: Kayıt yok');

    const { data: orders } = await sb.from('orders').select('id');
    pass(`Orders: ${orders?.length || 0} kayıt`);
}

function testFiles() {
    console.log('\n═══ 3. DOSYA YAPISI ═══');
    const checks = [
        ['middleware.js', 'Route koruması'],
        ['app/api/voice-command/route.js', 'Voice command API'],
        ['app/api/chatbot/route.js', 'Chatbot API (Bot yönetimi)'],
        ['app/api/auth/login/route.js', 'Auth login API'],
        ['app/api/rapor/ay-ozet/route.js', 'Rapor: Ay özet'],
        ['app/api/rapor/personel-verimlilik/route.js', 'Rapor: Personel verimlilik'],
        ['app/api/rapor/model-karlilik/route.js', 'Rapor: Model karlılık'],
        ['app/api/rapor/prim-onay/route.js', 'Rapor: Prim onay'],
        ['app/api/rapor/karar-arsivi/route.js', 'Rapor: Karar arşivi'],
        ['app/api/rapor/ay-muhasebe/route.js', 'Rapor: Muhasebe'],
        ['app/api/rapor/teslimat-sapma/route.js', 'Rapor: Teslimat sapma'],
        ['app/api/rapor/fire-maliyet/route.js', 'Rapor: Fire maliyet'],
        ['app/api/rapor/kapasite-tahmini/route.js', 'Rapor: Kapasite tahmini'],
        ['app/api/production/route.js', 'Üretim API'],
        ['app/api/personnel/route.js', 'Personel API (dizin)'],
        ['app/api/personel/sgk/route.js', 'SGK API'],
        ['app/api/models/route.js', 'Model API (dizin)'],
        ['app/api/orders/route.js', 'Sipariş API'],
        ['app/api/expenses/route.js', 'Gider API'],
        ['app/api/prim/route.js', 'Prim API'],
        ['app/api/kar-zarar/route.js', 'Kar/Zarar API'],
        ['app/api/fason/route.js', 'Fason API'],
        ['app/api/cron/aylik-siralama/route.js', 'Cron API'],
        ['lib/auth.js', 'Auth modülü'],
        ['lib/supabase.js', 'Supabase client'],
        ['lib/ai-services.js', 'AI servisleri (Bot entegrasyon)'],
        ['lib/maliyet-hesap.js', 'Maliyet hesaplama'],
        ['app/components/pages/MuhasebePage.jsx', 'Muhasebe Sayfası'],
        ['app/components/pages/PersonnelPage.jsx', 'Personel Sayfası'],
        ['app/components/pages/OrdersPage.jsx', 'Sipariş Sayfası'],
        ['app/page.js', 'Ana sayfa'],
        ['next.config.mjs', 'Next.js config'],
        ['.env.local', 'Ortam değişkenleri'],
    ];

    for (const [file, desc] of checks) {
        if (existsSync(file)) pass(`${desc} (${file})`);
        else fail(`${desc} (${file})`);
    }
}

function testEnvVars() {
    console.log('\n═══ 4. ORTAM DEĞİŞKENLERİ ═══');
    const env = readFileSync('.env.local', 'utf-8');
    const required = [
        'OPENAI_API_KEY', 'DEEPSEEK_API_KEY', 'GEMINI_API_KEY',
        'PERPLEXITY_API_KEY', 'INTERNAL_API_KEY',
        'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'
    ];
    for (const key of required) {
        if (env.includes(key + '=') && !env.includes(key + '=\n')) pass(`ENV: ${key}`);
        else fail(`ENV: ${key} eksik/boş`);
    }
}

function testAuthModule() {
    console.log('\n═══ 5. AUTH & GÜVENLİK ═══');
    const auth = readFileSync('lib/auth.js', 'utf-8');

    if (auth.includes('checkAuth')) pass('checkAuth fonksiyonu mevcut');
    else fail('checkAuth fonksiyonu eksik');

    if (auth.includes('checkDeletePermission')) pass('checkDeletePermission mevcut');
    else fail('checkDeletePermission eksik');

    if (auth.includes('softDelete')) pass('softDelete mevcut');
    else fail('softDelete eksik');

    if (auth.includes('logActivity')) pass('logActivity mevcut');
    else fail('logActivity eksik');

    if (auth.includes('INTERNAL_API_KEY')) pass('INTERNAL_API_KEY kontrolü var');
    else fail('INTERNAL_API_KEY kontrolü eksik');

    if (auth.includes("NODE_ENV !== 'production'")) pass('Production/Dev modu ayrımı var');
    else fail('Production/Dev modu ayrımı eksik');

    const mw = readFileSync('middleware.js', 'utf-8');
    if (mw.includes('x-user-id')) pass('Middleware: x-user-id header kontrolü');
    else fail('Middleware: header kontrolü eksik');
}

function testBotSystem() {
    console.log('\n═══ 6. BOT SİSTEMİ ═══');
    const aiServices = readFileSync('lib/ai-services.js', 'utf-8');

    if (aiServices.includes('openai') || aiServices.includes('OPENAI')) pass('Bot: OpenAI (Muhasip) entegrasyonu');
    else fail('Bot: OpenAI entegrasyonu eksik');

    if (aiServices.includes('gemini') || aiServices.includes('GEMINI')) pass('Bot: Gemini (Kamera) entegrasyonu');
    else fail('Bot: Gemini entegrasyonu eksik');

    if (aiServices.includes('deepseek') || aiServices.includes('DEEPSEEK')) pass('Bot: DeepSeek (Tekniker) entegrasyonu');
    else fail('Bot: DeepSeek entegrasyonu eksik');

    if (aiServices.includes('perplexity') || aiServices.includes('PERPLEXITY')) pass('Bot: Perplexity (Kaşif) entegrasyonu');
    else fail('Bot: Perplexity entegrasyonu eksik');

    if (existsSync('app/api/chatbot/route.js')) {
        const chatbot = readFileSync('app/api/chatbot/route.js', 'utf-8');
        if (chatbot.includes('supabaseAdmin')) pass('Bot: Chatbot Supabase entegrasyonu');
        else fail('Bot: Chatbot Supabase eksik');
        if (chatbot.includes('personnel') || chatbot.includes('personel')) pass('Bot: Personel veri bağlamı');
        else fail('Bot: Personel bağlamı eksik');
    } else fail('Bot: chatbot/route.js dosyası yok');
}

function testDbCleanup() {
    console.log('\n═══ 7. SQLite TEMİZLİK ═══');
    const pkg = readFileSync('package.json', 'utf-8');
    if (!pkg.includes('better-sqlite3')) pass('package.json: SQLite yok');
    else fail('package.json: SQLite hala var');

    const db = readFileSync('lib/db.js', 'utf-8');
    if (!db.includes("require('better-sqlite3')") && !db.includes("from 'better-sqlite3'"))
        pass('db.js: SQLite import yok');
    else fail('db.js: SQLite import hala var');

    if (!existsSync('Maliyet')) pass('Artık dosyalar temizlendi');
    else fail('Maliyet dosyası hala var');

    const config = readFileSync('next.config.mjs', 'utf-8');
    if (!config.includes('instrumentationHook')) pass('next.config: instrumentationHook kaldırıldı');
    else fail('next.config: instrumentationHook hala var');
}

async function main() {
    console.log('🔍 KAPSAMLI SİSTEM ENTEGRASYON TESTİ');
    console.log('════════════════════════════════════════');

    await testSupabaseTables();
    await testSupabaseData();
    testFiles();
    testEnvVars();
    testAuthModule();
    testBotSystem();
    testDbCleanup();

    console.log('\n════════════════════════════════════════');
    console.log(`📊 SONUÇ: ${totalPass} geçti, ${totalFail} başarısız`);
    console.log('════════════════════════════════════════');

    if (totalFail === 0) {
        console.log('🎉 TÜM TESTLER GEÇTİ!');
    } else {
        console.log('\n⚠️  Başarısız testler:');
        failures.forEach(f => console.log(`   → ${f}`));
    }
}

main().catch(e => { console.error(e); process.exit(1); });
