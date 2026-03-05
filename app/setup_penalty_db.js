const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres'
});

async function run() {
    try {
        await client.connect();

        // Add operator_id to fire_kayitlari
        await client.query(`
      ALTER TABLE fire_kayitlari ADD COLUMN IF NOT EXISTS operator_id INTEGER;
    `);

        // Add Zayiat Cezası support to prim_kayitlari
        await client.query(`
      ALTER TABLE prim_kayitlari ADD COLUMN IF NOT EXISTS zayiat_cezasi NUMERIC(10,2) DEFAULT 0;
    `);

        console.log("DB columns for Penalty System successfully added.");
    } catch (err) {
        console.error("Test Hatası:", err);
    } finally {
        await client.end();
    }
}

run();
