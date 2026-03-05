const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres'
});

async function run() {
    try {
        await client.connect();
        console.log("Supabase Veritabanına Bağlanıldı...");

        // İmalat Röntgenini Veritabanına İşleme
        await client.query(`
      -- TABLOLAR YOKSA OLUŞTURUYORUZ Kİ HATA ALMAYALIM
      CREATE TABLE IF NOT EXISTS kesim_planlari (id SERIAL PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS urun_fazlari (id SERIAL PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS fire_kayitlari (id SERIAL PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS fason_gonderim (id SERIAL PRIMARY KEY);

      -- 1. KESİM KUMAŞ (Metraj/Kilo) KONTROLÜ
      ALTER TABLE kesim_planlari ADD COLUMN IF NOT EXISTS used_fabric_qty NUMERIC(10,2); 
      ALTER TABLE kesim_planlari ADD COLUMN IF NOT EXISTS actual_fabric_qty NUMERIC(10,2); 
      ALTER TABLE kesim_planlari ADD COLUMN IF NOT EXISTS fabric_waste_qty NUMERIC(10,2); 

      -- 2. OPERASYON (Faz) ZAMAN ÇİZELGESİ (Bottleneck)
      ALTER TABLE urun_fazlari ADD COLUMN IF NOT EXISTS phase_start_time TIMESTAMP WITH TIME ZONE;
      ALTER TABLE urun_fazlari ADD COLUMN IF NOT EXISTS phase_end_time TIMESTAMP WITH TIME ZONE;

      -- 3. SAFHA MALİYET SİSTEMLİ FİRE (Çöpe Atıldığında Ne Kadar Gitti?)
      ALTER TABLE fire_kayitlari ADD COLUMN IF NOT EXISTS wasted_at_phase VARCHAR(50);
      ALTER TABLE fire_kayitlari ADD COLUMN IF NOT EXISTS estimated_loss_amount NUMERIC(10,2);

      -- 4. FASON / NAKIŞ / BASKI BOZUK ÜRÜN TAKİBİ
      ALTER TABLE fason_gonderim ADD COLUMN IF NOT EXISTS sent_quantity INTEGER; 
      ALTER TABLE fason_gonderim ADD COLUMN IF NOT EXISTS received_quantity INTEGER; 
      ALTER TABLE fason_gonderim ADD COLUMN IF NOT EXISTS spoiled_quantity INTEGER;
    `);

        console.log("İmalat Maliyet Sütunları Başarıyla SQL'e Enjekte Edildi! ✅");
    } catch (err) {
        console.error("Hata Oluştu:", err.message);
    } finally {
        await client.end();
    }
}

run();
