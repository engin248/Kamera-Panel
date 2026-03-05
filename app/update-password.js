const postgres = require('postgres');
async function run() {
    try {
        const sql = postgres('postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres', { ssl: 'require' });
        const result = await sql`UPDATE users SET password_hash = 'admin47' WHERE username = 'admin' RETURNING *;`;
        console.log('Güncellendi:', result);
        process.exit(0);
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}
run();
