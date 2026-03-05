const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres'
});

async function run() {
    try {
        await client.connect();
        console.log("Bağlandı.");

        await client.query(`
      ALTER TABLE models ADD COLUMN IF NOT EXISTS collection_name VARCHAR(100);
      ALTER TABLE models ADD COLUMN IF NOT EXISTS target_audience VARCHAR(100);
      ALTER TABLE models ADD COLUMN IF NOT EXISTS size_range VARCHAR(50);
      ALTER TABLE models ADD COLUMN IF NOT EXISTS designer_name VARCHAR(100);
      ALTER TABLE models ADD COLUMN IF NOT EXISTS tech_pack_data JSONB DEFAULT '{}'::jsonb;
    `);

        console.log("PLM SQL başarıyla çalıştırıldı!");
    } catch (err) {
        console.error("Hata:", err.message);
    } finally {
        await client.end();
    }
}

run();
