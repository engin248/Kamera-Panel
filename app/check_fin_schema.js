const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres'
});

async function run() {
    try {
        await client.connect();
        const tbs = ['cost_entries', 'orders', 'personnel', 'fason_takip'];
        for (const t of tbs) {
            const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${t}'`);
            console.log(`Table ${t} columns:`, res.rows.map(r => r.column_name).join(', '));
        }
    } catch (err) {
        console.error("Hata:", err);
    } finally {
        await client.end();
    }
}

run();
