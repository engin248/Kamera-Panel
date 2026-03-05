const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres'
});

async function run() {
    try {
        await client.connect();
        console.log("Bağlandı.");

        await client.query(`
      ALTER TABLE models ADD COLUMN IF NOT EXISTS model_type VARCHAR(50) DEFAULT 'uretim';
      ALTER TABLE fason_orders ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50) DEFAULT 'CMT';
      ALTER TABLE fason_orders ADD COLUMN IF NOT EXISTS tolerance_rate DECIMAL(5,2) DEFAULT 3.0;
      ALTER TABLE fason_orders ADD COLUMN IF NOT EXISTS fabric_usage VARCHAR(255);
    `);

        console.log("SQL başarıyla çalıştırıldı!");
    } catch (err) {
        console.error("Hata:", err.message);
    } finally {
        await client.end();
    }
}

run();
