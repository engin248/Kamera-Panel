const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres'
});

async function run() {
    try {
        await client.connect();

        // Add missing columns to hat_planlamasi
        await client.query(`
      ALTER TABLE hat_planlamasi ADD COLUMN IF NOT EXISTS fason_mu BOOLEAN DEFAULT false;
      ALTER TABLE hat_planlamasi ADD COLUMN IF NOT EXISTS fason_birim_fiyat NUMERIC(10,2);
      ALTER TABLE hat_planlamasi ADD COLUMN IF NOT EXISTS bant_zorluk_derecesi INTEGER;
      ALTER TABLE hat_planlamasi ADD COLUMN IF NOT EXISTS gunluk_hat_maliyeti NUMERIC(10,2);
    `);

        // Add bozulan_adet to yari_mamul_stok
        await client.query(`
      ALTER TABLE yari_mamul_stok ADD COLUMN IF NOT EXISTS bozulan_adet INTEGER DEFAULT 0;
    `);

        // Add harcanan_kumas and pastal_fire_yuzde to kesim_planlari if missing
        await client.query(`
      ALTER TABLE kesim_planlari ADD COLUMN IF NOT EXISTS harcanan_kumas NUMERIC(10,2);
      ALTER TABLE kesim_planlari ADD COLUMN IF NOT EXISTS pastal_fire_yuzde NUMERIC(10,2);
    `);

        console.log("Eksik kolonlar başarıyla veritabanına işlendi.");

    } catch (err) {
        console.error("Test Hatası:", err);
    } finally {
        await client.end();
    }
}

run();
