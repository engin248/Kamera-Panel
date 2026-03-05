const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres'
});

async function run() {
    try {
        await client.connect();
        const tables = ['personnel', 'fason_takip', 'models', 'fason_gonderim']; // fason table name could be either

        for (const table of tables) {
            const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            if (res.rows.length > 0) {
                console.log(`\n--- TABLE: ${table} ---`);
                console.log(res.rows.map(r => r.column_name).join(', '));
            }
        }

    } catch (err) {
        console.error("Hata:", err);
    } finally {
        await client.end();
    }
}

run();
