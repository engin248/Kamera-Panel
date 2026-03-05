const postgres = require('postgres');
async function run() {
    try {
        const sql = postgres('postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres', { ssl: 'require' });
        const result = await sql`INSERT INTO users (username, password_hash, display_name, role, status) VALUES ('admin47', 'admin47', 'Test Admin', 'admin', 'active') ON CONFLICT DO NOTHING RETURNING *;`;
        console.log('Başarılı:', result);
        process.exit(0);
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}
run();
