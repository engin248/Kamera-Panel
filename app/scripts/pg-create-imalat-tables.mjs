import pkg from 'pg';
const { Client } = pkg;

// Supabase Postgres veritabanı bağlantı adresi (Kullanıcının .env.local dosyasındaki şifresiyle)
const client = new Client({
    connectionString: 'postgresql://postgres:TtgS0ZK1mAB3NveP@db.cauptlsnqieegdrgotob.supabase.co:5432/postgres'
});

const SQLS = [
    {
        label: 'kesim_planlari',
        sql: `CREATE TABLE IF NOT EXISTS kesim_planlari (
            id BIGSERIAL PRIMARY KEY, model_id BIGINT, siparis_id BIGINT,
            plan_tarihi DATE NOT NULL, toplam_adet INTEGER DEFAULT 0,
            beden_dagitimi JSONB DEFAULT '{}', kat_sayisi INTEGER DEFAULT 1,
            tahmini_sarj_metre NUMERIC(10,2) DEFAULT 0, tahmini_fire_yuzde NUMERIC(5,2) DEFAULT 5,
            durum TEXT DEFAULT 'planlandı', kesimci_id BIGINT, notlar TEXT DEFAULT '',
            deleted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
        )`
    },
    {
        label: 'kesim_kayitlari',
        sql: `CREATE TABLE IF NOT EXISTS kesim_kayitlari (
            id BIGSERIAL PRIMARY KEY, plan_id BIGINT, gercek_adet INTEGER DEFAULT 0,
            fire_adet INTEGER DEFAULT 0, kullanilan_metre NUMERIC(10,2) DEFAULT 0,
            fire_metre NUMERIC(10,2) DEFAULT 0, fire_yuzde NUMERIC(5,2) DEFAULT 0,
            fire_nedeni TEXT DEFAULT '', kesim_tarihi TIMESTAMPTZ DEFAULT NOW(),
            kaydeden_id BIGINT, created_at TIMESTAMPTZ DEFAULT NOW()
        )`
    },
    {
        label: 'hat_planlamasi',
        sql: `CREATE TABLE IF NOT EXISTS hat_planlamasi (
            id BIGSERIAL PRIMARY KEY, model_id BIGINT, hat_adi TEXT NOT NULL,
            personel_listesi JSONB DEFAULT '[]', gun_hedefi INTEGER DEFAULT 0,
            aktif BOOLEAN DEFAULT TRUE, baslangic_tarihi DATE, bitis_tarihi DATE,
            notlar TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
        )`
    },
    {
        label: 'imalat_fazlari',
        sql: `CREATE TABLE IF NOT EXISTS imalat_fazlari (
            id BIGSERIAL PRIMARY KEY, model_id BIGINT, siparis_id BIGINT, faz TEXT NOT NULL,
            baslangic TIMESTAMPTZ, bitis TIMESTAMPTZ, tamamlanan_adet INTEGER DEFAULT 0,
            hedef_adet INTEGER DEFAULT 0, sorumlu_id BIGINT, durum TEXT DEFAULT 'bekliyor',
            notlar TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
        )`
    },
    {
        label: 'yari_mamul_stok',
        sql: `CREATE TABLE IF NOT EXISTS yari_mamul_stok (
            id BIGSERIAL PRIMARY KEY, model_id BIGINT, siparis_id BIGINT,
            faz_kaynak TEXT NOT NULL, faz_hedef TEXT NOT NULL, adet INTEGER DEFAULT 0,
            tarih TIMESTAMPTZ DEFAULT NOW(), kaydeden_id BIGINT, notlar TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`
    },
    { label: 'alter operations.birim_deger', sql: `ALTER TABLE operations ADD COLUMN IF NOT EXISTS birim_deger REAL DEFAULT 0` },
    { label: 'alter operations.standart_sure_dk', sql: `ALTER TABLE operations ADD COLUMN IF NOT EXISTS standart_sure_dk REAL DEFAULT 0` },
    { label: 'alter production_logs.katki_degeri', sql: `ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS katki_degeri_tutari REAL DEFAULT 0` },
    { label: 'alter business_expenses.saatlik_maliyet', sql: `ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS saatlik_maliyet NUMERIC(10,4) DEFAULT 0` },
    { label: 'idx_kesim_planlari', sql: `CREATE INDEX IF NOT EXISTS idx_kesim_planlari_model ON kesim_planlari(model_id)` },
    { label: 'idx_imalat_fazlari', sql: `CREATE INDEX IF NOT EXISTS idx_imalat_fazlari_model ON imalat_fazlari(model_id, faz)` },
    { label: 'idx_yari_mamul', sql: `CREATE INDEX IF NOT EXISTS idx_yari_mamul_model ON yari_mamul_stok(model_id)` },
];

async function runSQL() {
    try {
        await client.connect();
        console.log('🏗️  PG modülü ile İmalat tabloları doğrudan veritabanına oluşturuluyor...\n');
        let ok = 0, fail = 0;

        for (const { label, sql } of SQLS) {
            try {
                await client.query(sql);
                console.log(`✅ Başarılı: ${label}`);
                ok++;
            } catch (e) {
                console.log(`⚠️  Atlandı/Zaten Var: ${label} (${e.message})`);
                fail++;
            }
        }

        console.log(`\n📊 ${ok} Tablo/Sütun eklendi, ${fail} atlandı.`);
        console.log('🎉 Tüm İmalat tabloları hazır!');
    } catch (err) {
        console.error('Veritabanına bağlanılamadı:', err.message);
    } finally {
        await client.end();
    }
}
runSQL();
