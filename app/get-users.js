const postgres = require('postgres');
async function run() {
    try {
        const sql = postgres('postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres', { ssl: 'require' });
        const users = await sql`SELECT username, role, status FROM users LIMIT 10;`;
        console.log('Kullanıcılar:', users);
        process.exit(0);
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}
run();
