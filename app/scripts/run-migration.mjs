// run-migration.mjs — Supabase eksik tabloları otomatik yükler
// Çalıştırma: node scripts/run-migration.mjs
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local'i manuel oku (dotenv gerektirmeden)
function loadEnv() {
    try {
        const envPath = resolve(__dirname, '../.env.local');
        const content = readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const [key, ...rest] = trimmed.split('=');
            process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
        }
        console.log('✅ .env.local yüklendi');
    } catch (e) {
        console.warn('⚠️ .env.local okunamadı, ortam değişkenlerine bakılıyor...');
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik!');
    console.error('   .env.local dosyasını kontrol et.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// SQL komutlarını tek tek çalıştır
const SQL_STATEMENTS = [
    // 1. PRİM KAYITLARI
    `CREATE TABLE IF NOT EXISTS prim_kayitlari (
      id BIGSERIAL PRIMARY KEY,
      personel_id BIGINT REFERENCES personnel(id) ON DELETE CASCADE,
      ay INTEGER NOT NULL CHECK(ay BETWEEN 1 AND 12),
      yil INTEGER NOT NULL,
      katki_degeri NUMERIC(12,2) DEFAULT 0,
      maas_maliyeti NUMERIC(12,2) DEFAULT 0,
      katki_maas_farki NUMERIC(12,2) DEFAULT 0,
      prim_orani NUMERIC(5,2) DEFAULT 15,
      prim_tutari NUMERIC(12,2) DEFAULT 0,
      onay_durumu TEXT DEFAULT 'hesaplandi' CHECK(onay_durumu IN ('hesaplandi','onaylandi','odendi','reddedildi')),
      onaylayan_id BIGINT,
      onay_tarihi TIMESTAMPTZ,
      odeme_tarihi DATE,
      hesaplama_tarihi TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(personel_id, ay, yil)
    )`,

    // 2. KAR/ZARAR ÖZETİ
    `CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
      id BIGSERIAL PRIMARY KEY,
      ay INTEGER NOT NULL CHECK(ay BETWEEN 1 AND 12),
      yil INTEGER NOT NULL,
      toplam_gelir NUMERIC(14,2) DEFAULT 0,
      toplam_gider NUMERIC(14,2) DEFAULT 0,
      net_kar NUMERIC(14,2) DEFAULT 0,
      kar_marji_yuzde NUMERIC(6,2) DEFAULT 0,
      durum TEXT DEFAULT 'taslak' CHECK(durum IN ('taslak','onaylandi','revize')),
      onay_notu TEXT,
      kapatan_kullanici TEXT DEFAULT 'admin',
      kapama_tarihi TIMESTAMPTZ,
      detay_json JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(ay, yil)
    )`,

    // 3. KARAR ARŞİVİ
    `CREATE TABLE IF NOT EXISTS karar_arsivi (
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
    )`,

    // 4. PERSONEL SGK
    `CREATE TABLE IF NOT EXISTS personel_sgk (
      id BIGSERIAL PRIMARY KEY,
      personel_id BIGINT NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
      ay INTEGER NOT NULL CHECK(ay BETWEEN 1 AND 12),
      yil INTEGER NOT NULL,
      odenen_tutar NUMERIC(12,2) DEFAULT 0,
      notlar TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(personel_id, ay, yil)
    )`,

    // 5. MODEL İŞLEM SIRASI
    `CREATE TABLE IF NOT EXISTS model_islem_sirasi (
      id BIGSERIAL PRIMARY KEY,
      model_id BIGINT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
      sira_no INTEGER NOT NULL,
      islem_adi TEXT NOT NULL,
      makine_tipi TEXT DEFAULT '',
      zorluk_derecesi INTEGER DEFAULT 3 CHECK(zorluk_derecesi BETWEEN 1 AND 5),
      tahmini_sure_dk INTEGER DEFAULT 0,
      nasil_yapilir TEXT DEFAULT '',
      ses_kayit_url TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 6. ARA KONTROL
    `CREATE TABLE IF NOT EXISTS ara_kontrol (
      id BIGSERIAL PRIMARY KEY,
      parti_id BIGINT,
      model_id BIGINT REFERENCES models(id),
      kontrol_eden_id BIGINT REFERENCES personnel(id),
      istasyon TEXT DEFAULT 'Dikim',
      sira_no INTEGER,
      beden TEXT DEFAULT '',
      adet INTEGER DEFAULT 0,
      hatali INTEGER DEFAULT 0,
      foto_url TEXT DEFAULT '',
      numune_foto_url TEXT DEFAULT '',
      ai_uyum_skoru NUMERIC(5,2),
      onay BOOLEAN DEFAULT TRUE,
      ret_nedeni TEXT DEFAULT '',
      notlar TEXT DEFAULT '',
      tarih DATE DEFAULT CURRENT_DATE,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 7. PERSONEL SAAT KAYITLARI
    `CREATE TABLE IF NOT EXISTS personel_saat_kayitlari (
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
    )`,

    // 8. PARTI KABUL eksik kolonlar
    `ALTER TABLE parti_kabul ADD COLUMN IF NOT EXISTS parca_eksik_not TEXT DEFAULT ''`,
    `ALTER TABLE parti_kabul ADD COLUMN IF NOT EXISTS beden_eksik_not TEXT DEFAULT ''`,

    // 9. PERSONNEL ek alanlar
    `ALTER TABLE personnel ADD COLUMN IF NOT EXISTS sgk_employer_rate NUMERIC(5,2) DEFAULT 20.5`,
    `ALTER TABLE personnel ADD COLUMN IF NOT EXISTS prim_orani NUMERIC(5,2) DEFAULT 15`,

    // 10. BUSINESS EXPENSES saatlik maliyet
    `ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS saatlik_maliyet NUMERIC(10,4) DEFAULT 0`,

    // 11. İNDEXLER
    `CREATE INDEX IF NOT EXISTS idx_prim_personel_ay_yil ON prim_kayitlari(personel_id, ay, yil)`,
    `CREATE INDEX IF NOT EXISTS idx_karar_arsivi_tarih ON karar_arsivi(tarih DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_personel_saat_tarih ON personel_saat_kayitlari(tarih)`,
    `CREATE INDEX IF NOT EXISTS idx_personel_saat_personel ON personel_saat_kayitlari(personel_id)`,
    `CREATE INDEX IF NOT EXISTS idx_model_islem_model ON model_islem_sirasi(model_id, sira_no)`,
    `CREATE INDEX IF NOT EXISTS idx_ara_kontrol_model ON ara_kontrol(model_id)`,
    `CREATE INDEX IF NOT EXISTS idx_kar_zarar_ay_yil ON kar_zarar_ozet(ay, yil)`,
    `CREATE INDEX IF NOT EXISTS idx_production_start_time ON production_logs(start_time)`,
];

async function runMigration() {
    console.log('\n🚀 Supabase Migration başlatılıyor...');
    console.log(`📡 URL: ${supabaseUrl}\n`);

    let basarili = 0, hatali = 0;

    for (let i = 0; i < SQL_STATEMENTS.length; i++) {
        const sql = SQL_STATEMENTS[i];
        const isim = sql.trim().split('\n')[0].substring(0, 60) + '...';

        const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: { message: 'rpc yok' } }));

        if (error?.message === 'rpc yok') {
            // exec_sql RPC yoksa direkt REST API dene
            const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ sql }),
            });

            if (!res.ok && res.status !== 404) {
                console.error(`  ❌ [${i + 1}/${SQL_STATEMENTS.length}] HATA: ${isim}`);
                const body = await res.text();
                console.error(`     ${body.substring(0, 100)}`);
                hatali++;
                continue;
            }
        } else if (error) {
            // Zaten var hatası tamam
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log(`  ✅ [${i + 1}/${SQL_STATEMENTS.length}] Zaten var (ok): ${isim}`);
                basarili++;
                continue;
            }
            console.error(`  ❌ [${i + 1}/${SQL_STATEMENTS.length}] HATA: ${isim}`);
            console.error(`     ${error.message.substring(0, 120)}`);
            hatali++;
            continue;
        }

        console.log(`  ✅ [${i + 1}/${SQL_STATEMENTS.length}] Tamam: ${isim}`);
        basarili++;
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Başarılı: ${basarili} | ❌ Hata: ${hatali}`);

    if (hatali > 0) {
        console.log('\n⚠️  Bazı tablolar oluşturulamadı. Supabase Dashboard → SQL Editor\'a yapıştır:');
        console.log('   app/scripts/supabase-eksik-tablolar.sql');
    } else {
        console.log('\n🎉 Tüm tablolar hazır! Sistem kullanıma hazır.');
    }
}

runMigration().catch(console.error);
