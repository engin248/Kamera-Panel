#!/usr/bin/env node
// migrate.mjs - Doğrudan Supabase REST ile SQL çalıştırır
// Kullanım: node scripts/migrate.mjs

const SUPABASE_URL = 'https://cauptlsnqieegdrgotob.supabase.co';
const SERVICE_KEY = 'sb_publishable_6htr6a2WnfuZuOG-zYVBHA_JcGE7s3R';
const PROJECT_REF = 'cauptlsnqieegdrgotob';

// Supabase Management API endpoint
const MGMT_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function runSQL(sql, desc) {
    try {
        // Önce Supabase REST /rpc/exec dene
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({ sql_query: sql }),
        });

        if (resp.ok) {
            console.log(`✅ ${desc}`);
            return true;
        }

        const errText = await resp.text();
        // "already exists" hatası normal
        if (errText.includes('already exists') || errText.includes('duplicate') || errText.includes('42P07')) {
            console.log(`⚡ ${desc} — zaten var`);
            return true;
        }

        // 404 ise RPC yok — pg fetch ile dene
        console.log(`⚠️ ${desc} — RPC yok, pg direct deniyor...`);
        return false;
    } catch (e) {
        console.error(`❌ ${desc}: ${e.message}`);
        return false;
    }
}

const SQL_LIST = [
    ['prim_kayitlari tablosu', `CREATE TABLE IF NOT EXISTS prim_kayitlari (
      id BIGSERIAL PRIMARY KEY,
      personel_id BIGINT REFERENCES personnel(id) ON DELETE CASCADE,
      ay INTEGER NOT NULL CHECK(ay BETWEEN 1 AND 12),
      yil INTEGER NOT NULL,
      katki_degeri NUMERIC(12,2) DEFAULT 0,
      maas_maliyeti NUMERIC(12,2) DEFAULT 0,
      katki_maas_farki NUMERIC(12,2) DEFAULT 0,
      prim_orani NUMERIC(5,2) DEFAULT 15,
      prim_tutari NUMERIC(12,2) DEFAULT 0,
      onay_durumu TEXT DEFAULT 'hesaplandi',
      onaylayan_id BIGINT,
      onay_tarihi TIMESTAMPTZ,
      odeme_tarihi DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(personel_id, ay, yil)
    )`],
    ['kar_zarar_ozet tablosu', `CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
      id BIGSERIAL PRIMARY KEY,
      ay INTEGER NOT NULL,
      yil INTEGER NOT NULL,
      toplam_gelir NUMERIC(14,2) DEFAULT 0,
      toplam_gider NUMERIC(14,2) DEFAULT 0,
      net_kar NUMERIC(14,2) DEFAULT 0,
      kar_marji_yuzde NUMERIC(6,2) DEFAULT 0,
      durum TEXT DEFAULT 'taslak',
      onay_notu TEXT,
      kapama_tarihi TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(ay, yil)
    )`],
    ['karar_arsivi tablosu', `CREATE TABLE IF NOT EXISTS karar_arsivi (
      id BIGSERIAL PRIMARY KEY,
      tarih DATE DEFAULT CURRENT_DATE,
      konu TEXT NOT NULL,
      bolum TEXT DEFAULT 'uretim',
      sistem_onerisi TEXT,
      yapilan_karar TEXT,
      sonuc TEXT,
      sonuc_sayisal NUMERIC(12,2),
      sistem_mi_dogru BOOLEAN,
      ogrenim_notu TEXT,
      ilgili_ay INTEGER,
      ilgili_yil INTEGER,
      sorumlu_id BIGINT,
      sorumlu_ad TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`],
    ['personel_sgk tablosu', `CREATE TABLE IF NOT EXISTS personel_sgk (
      id BIGSERIAL PRIMARY KEY,
      personel_id BIGINT NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
      ay INTEGER NOT NULL,
      yil INTEGER NOT NULL,
      odenen_tutar NUMERIC(12,2) DEFAULT 0,
      notlar TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(personel_id, ay, yil)
    )`],
    ['model_islem_sirasi tablosu', `CREATE TABLE IF NOT EXISTS model_islem_sirasi (
      id BIGSERIAL PRIMARY KEY,
      model_id BIGINT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
      sira_no INTEGER NOT NULL,
      islem_adi TEXT NOT NULL,
      makine_tipi TEXT DEFAULT '',
      zorluk_derecesi INTEGER DEFAULT 3,
      tahmini_sure_dk INTEGER DEFAULT 0,
      nasil_yapilir TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`],
    ['ara_kontrol tablosu', `CREATE TABLE IF NOT EXISTS ara_kontrol (
      id BIGSERIAL PRIMARY KEY,
      parti_id BIGINT,
      model_id BIGINT REFERENCES models(id),
      kontrol_eden_id BIGINT REFERENCES personnel(id),
      istasyon TEXT DEFAULT 'Dikim',
      adet INTEGER DEFAULT 0,
      hatali INTEGER DEFAULT 0,
      onay BOOLEAN DEFAULT TRUE,
      ret_nedeni TEXT DEFAULT '',
      notlar TEXT DEFAULT '',
      tarih DATE DEFAULT CURRENT_DATE,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`],
    ['personel_saat_kayitlari tablosu', `CREATE TABLE IF NOT EXISTS personel_saat_kayitlari (
      id BIGSERIAL PRIMARY KEY,
      personel_id BIGINT REFERENCES personnel(id) ON DELETE CASCADE,
      tarih DATE NOT NULL,
      giris_saat TEXT,
      cikis_saat TEXT,
      net_calisma_dakika NUMERIC(8,2) DEFAULT 0,
      mesai_dakika NUMERIC(8,2) DEFAULT 0,
      gec_kalma_dakika NUMERIC(8,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(personel_id, tarih)
    )`],
    ['parti_kabul parca_eksik_not kolonu', `ALTER TABLE parti_kabul ADD COLUMN IF NOT EXISTS parca_eksik_not TEXT DEFAULT ''`],
    ['parti_kabul beden_eksik_not kolonu', `ALTER TABLE parti_kabul ADD COLUMN IF NOT EXISTS beden_eksik_not TEXT DEFAULT ''`],
    ['personnel sgk_employer_rate kolonu', `ALTER TABLE personnel ADD COLUMN IF NOT EXISTS sgk_employer_rate NUMERIC(5,2) DEFAULT 20.5`],
    ['personnel prim_orani kolonu', `ALTER TABLE personnel ADD COLUMN IF NOT EXISTS prim_orani NUMERIC(5,2) DEFAULT 15`],
    ['business_expenses saatlik_maliyet kolonu', `ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS saatlik_maliyet NUMERIC(10,4) DEFAULT 0`],
    ['idx_prim index', `CREATE INDEX IF NOT EXISTS idx_prim_personel_ay_yil ON prim_kayitlari(personel_id, ay, yil)`],
    ['idx_personel_saat index', `CREATE INDEX IF NOT EXISTS idx_personel_saat_tarih ON personel_saat_kayitlari(tarih)`],
    ['idx_production_start index', `CREATE INDEX IF NOT EXISTS idx_production_start_time ON production_logs(start_time)`],
];

console.log('🚀 Supabase Migration Başlıyor...\n');
let ok = 0, fail = 0;
for (const [desc, sql] of SQL_LIST) {
    const r = await runSQL(sql, desc);
    if (r) ok++; else fail++;
}
console.log(`\n${'─'.repeat(40)}`);
console.log(`✅ Başarılı: ${ok} | ❌ Başarısız: ${fail}`);
if (fail > 0) {
    console.log('\n📋 Başarısız olanlar için:');
    console.log('Supabase Dashboard → https://cauptlsnqieegdrgotob.supabase.co');
    console.log('SQL Editor → supabase-eksik-tablolar.sql dosyasını yapıştır');
}
