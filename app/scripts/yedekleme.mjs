import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
    console.error('Lütfen .env.local dosyasına SUPABASE url ve key değerlerini girin.');
    process.exit(1);
}

const supabase = createClient(url, key);
// Kritik Tabloları listeliyoruz.
const tables = ['production_logs', 'orders', 'expenses', 'personnel', 'models', 'fason_orders'];

async function backup() {
    console.log('📦 Supabase Veritabanı Yedekleme İşlemi Başlatıldı...');
    const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    const backupFile = path.join(backupDir, `db_backup_${dateStr}.json`);
    const finalData = {};

    for (const t of tables) {
        console.log(`Tablo okunuyor: ${t}...`);
        const { data, error } = await supabase.from(t).select('*');
        if (error) {
            console.warn(`Hata: ${t} tablosu okunamadı. ${error.message}`);
            finalData[t] = null;
        } else {
            finalData[t] = data;
            console.log(`✅ ${t} = ${data.length} kayıt yedeğe alındı.`);
        }
    }

    fs.writeFileSync(backupFile, JSON.stringify(finalData, null, 2));
    console.log(`\n🎉 Yedekleme tamamlandı!`);
    console.log(`Dosya: ${backupFile}`);
    console.log('💡 İŞLETME VİZYONU KURALI: Bu scripti her cuma mesai bitimi çalıştırın ve dosyayı flash belleğe yedekleyin.');
}

backup();
