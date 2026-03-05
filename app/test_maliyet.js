const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres'
});

async function run() {
    try {
        await client.connect();

        // Check kesim_planlari columns
        const resKesim = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'kesim_planlari'");
        const kesimCols = resKesim.rows.map(r => r.column_name);
        console.log("Kesim Planları Sütunları:", kesimCols.includes('used_fabric_qty') ? "Tamam ✅" : "Eksik ❌");

        // Check fire_kayitlari columns
        const resFire = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'fire_kayitlari'");
        const fireCols = resFire.rows.map(r => r.column_name);
        console.log("Fire Kayıtları Sütunları:", fireCols.includes('estimated_loss_amount') ? "Tamam ✅" : "Eksik ❌");

        // Check urun_fazlari
        const resFaz = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'urun_fazlari'");
        const fazCols = resFaz.rows.map(r => r.column_name);
        console.log("Ürün Fazları Sütunları:", fazCols.includes('phase_start_time') ? "Tamam ✅" : "Eksik ❌");

    } catch (err) {
        console.error("Test Hatası:", err);
    } finally {
        await client.end();
    }
}

run();
