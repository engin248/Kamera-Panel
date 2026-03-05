// postgres modülünü kullanarak doğrudan veritabanına bağlanıp pgvector SQL scriptini çalıştırma
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// .env.local dosyasındaki değerleri manuel olarak yükle veya CLI üzerinden pass et
// Supabase proje db şifreniz: TtgS0ZK1mAB3NveP
// DB connection string: postgresql://postgres.cauptlsnqieegdrgotob:TtgS0ZK1mAB3NveP@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

async function run() {
    try {
        console.log('Postgres ile DBye bağlanılıyor...');
        const sql = postgres('postgresql://postgres.cauptlsnqieegdrgotob:TtgS0ZK1mAB3NveP@aws-0-eu-central-1.pooler.supabase.com:6543/postgres', {
            ssl: 'require'
        });

        console.log('SQL dosyası okunuyor...');
        const sqlString = fs.readFileSync('09_pgvector_hafiza_tablolari.sql', 'utf8');

        console.log('SQL script çalıştırılıyor...');
        const result = await sql.unsafe(sqlString);

        console.log('Başarılı! Sonuç:', result);
        process.exit(0);
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}
run();
