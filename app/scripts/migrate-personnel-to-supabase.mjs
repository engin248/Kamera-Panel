// scripts/migrate-personnel-to-supabase.mjs
// Çalıştır: node scripts/migrate-personnel-to-supabase.mjs
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase bağlantısı
const SUPABASE_URL = 'https://cauptlsnqieegdrgotob.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6htr6a2WnfuZuOG-zYVBHA_JcGE7s3R';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// SQLite bağlantısı
const DB_PATH = path.join(__dirname, '..', 'data', 'kamera-panel.db');
const db = new Database(DB_PATH, { readonly: true });

const JSON_FIELDS = ['operation_skill_scores', 'machine_adjustments', 'fabric_experience'];

async function migrate() {
    console.log('🚀 Personel migration başlıyor...\n');
    console.log(`📂 SQLite: ${DB_PATH}`);
    console.log(`☁️  Supabase: ${SUPABASE_URL}\n`);

    // SQLite'dan verileri çek
    const personnel = db.prepare('SELECT * FROM personnel WHERE deleted_at IS NULL').all();
    console.log(`📋 SQLite'da ${personnel.length} aktif personel bulundu.\n`);

    if (personnel.length === 0) {
        console.log('⚠️  Aktarılacak personel yok. İşlem tamamlandı.');
        process.exit(0);
    }

    // Supabase'de mevcut verileri kontrol et
    const { data: existing } = await supabase.from('personnel').select('id').limit(1);
    if (existing && existing.length > 0) {
        console.log('⚠️  Supabase personnel tablosu dolu! Üzerine yazmak istiyor musunuz?');
        console.log('   Devam etmek için scripti tekrar çalıştırın ve --force flag ekleyin.\n');
        const force = process.argv.includes('--force');
        if (!force) {
            console.log('❌ Migration iptal edildi. (--force ile zorla çalıştırabilirsiniz)');
            process.exit(0);
        }
        console.log('⚡ --force aktif, mevcut veriler korunarak ekleme yapılacak.\n');
    }

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const person of personnel) {
        // SQLite ID'sini koru (eğer BIGSERIAL sıra bozulmasın diye)
        const data = { ...person };

        // JSON alanlarını parse et
        for (const field of JSON_FIELDS) {
            if (data[field] && typeof data[field] === 'string') {
                try {
                    data[field] = JSON.parse(data[field]);
                } catch {
                    data[field] = {};
                }
            }
            if (!data[field] || typeof data[field] !== 'object') {
                data[field] = {};
            }
        }

        // SQLite'a özel alanları temizle
        delete data.adaptation_status; // personnel tablosunda bu yer almıyor kontrol et

        // Tarihleri düzenle (SQLite'da TEXT olabilir)
        if (data.start_date === '') data.start_date = null;
        if (data.deleted_at === '') data.deleted_at = null;

        // Sayısal alanları düzelt
        data.daily_wage = parseFloat(data.daily_wage) || 0;
        data.base_salary = parseFloat(data.base_salary) || 0;
        data.transport_allowance = parseFloat(data.transport_allowance) || 0;
        data.ssk_cost = parseFloat(data.ssk_cost) || 0;
        data.food_allowance = parseFloat(data.food_allowance) || 0;
        data.compensation = parseFloat(data.compensation) || 0;
        data.daily_avg_output = parseInt(data.daily_avg_output) || 0;
        data.error_rate = parseFloat(data.error_rate) || 0;
        data.efficiency_score = parseFloat(data.efficiency_score) || 0;

        try {
            const { error } = await supabase
                .from('personnel')
                .upsert(data, { onConflict: 'id' });

            if (error) {
                failed++;
                errors.push(`❌ ${person.name} (id:${person.id}): ${error.message}`);
                console.log(`❌ ${person.name}: ${error.message}`);
            } else {
                success++;
                console.log(`✅ ${person.name} → Supabase'e aktarıldı`);
            }
        } catch (e) {
            failed++;
            errors.push(`❌ ${person.name}: ${e.message}`);
            console.log(`❌ ${person.name}: ${e.message}`);
        }
    }

    console.log('\n═══════════════════════════════════');
    console.log(`✅ Başarılı: ${success} personel`);
    console.log(`❌ Başarısız: ${failed} personel`);
    if (errors.length > 0) {
        console.log('\nHatalar:');
        errors.forEach(e => console.log(' ', e));
    }
    console.log('═══════════════════════════════════');
    console.log('\n🎉 Migration tamamlandı!');
    db.close();
}

migrate().catch(err => {
    console.error('💥 Kritik hata:', err);
    process.exit(1);
});
