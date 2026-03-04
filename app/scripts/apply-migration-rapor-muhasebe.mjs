// scripts/apply-migration-rapor-muhasebe.mjs
// Pencere 5 (Rapor & Analiz) ve Pencere 6 (Muhasebe) için
// yeni tablolar + alan eklemeleri
// Çalıştır:
//   $env:SUPABASE_ACCESS_TOKEN="TOKEN"; node scripts/apply-migration-rapor-muhasebe.mjs

const PROJECT_ID = 'cauptlsnqieegdrgotob';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.log('❌ SUPABASE_ACCESS_TOKEN eksik!');
    console.log('');
    console.log('👉 Adımlar:');
    console.log('   1. https://supabase.com/dashboard/account/tokens adresine git');
    console.log('   2. "Generate new token" → kopyala');
    console.log('   3. PowerShell\'de:');
    console.log('   $env:SUPABASE_ACCESS_TOKEN="senin_tokenin"; node scripts/apply-migration-rapor-muhasebe.mjs');
    process.exit(1);
}

async function runSQL(label, sql) {
    try {
        const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        });
        const result = await res.json();
        if (result.error || (result.message && result.message.toLowerCase().includes('error'))) {
            console.log(`❌ ${label}: ${result.error || result.message}`);
            return false;
        }
        console.log(`✅ ${label}`);
        return true;
    } catch (e) {
        console.log(`❌ ${label}: ${e.message}`);
        return false;
    }
}

const migrations = [

    // ─────────────────────────────────────────
    // 1. SİSTEM AYARLARI
    // ─────────────────────────────────────────
    ['CREATE sistem_ayarlari', `
        CREATE TABLE IF NOT EXISTS sistem_ayarlari (
            id BIGSERIAL PRIMARY KEY,
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            aciklama TEXT,
            kategori TEXT DEFAULT 'genel',
            guncelleme_tarihi TIMESTAMPTZ DEFAULT NOW(),
            guncelleyen TEXT DEFAULT 'sistem'
        );
    `],

    ['INSERT sistem_ayarlari varsayıланlar', `
        INSERT INTO sistem_ayarlari (key, value, aciklama, kategori) VALUES
            ('prim_orani', '15', 'Net katkı-maaş farkının prim yüzdesi (%)', 'prim'),
            ('sgk_isveren_orani', '22.5', 'İşveren SGK oranı (%)', 'muhasebe'),
            ('gelir_vergisi_orani', '15', 'Stopaj gelir vergisi oranı (%)', 'muhasebe'),
            ('min_prim_esigi', '250', 'Minimum prim hak ediş eşiği (TL)', 'prim'),
            ('prim_aktif', 'true', 'Prim sistemi açık mı?', 'prim')
        ON CONFLICT (key) DO NOTHING;
    `],

    // ─────────────────────────────────────────
    // 2. PRİM KAYITLARI
    // ─────────────────────────────────────────
    ['CREATE prim_kayitlari', `
        CREATE TABLE IF NOT EXISTS prim_kayitlari (
            id BIGSERIAL PRIMARY KEY,
            personel_id BIGINT REFERENCES personnel(id) ON DELETE RESTRICT,
            ay INTEGER NOT NULL CHECK (ay BETWEEN 1 AND 12),
            yil INTEGER NOT NULL,
            toplam_uretilen INTEGER DEFAULT 0,
            toplam_hatali INTEGER DEFAULT 0,
            fpy_yuzde NUMERIC(5,2) DEFAULT 0,
            oee_ortalama NUMERIC(5,2) DEFAULT 0,
            katki_degeri NUMERIC(12,2) DEFAULT 0,
            maas_maliyeti NUMERIC(12,2) DEFAULT 0,
            katki_maas_farki NUMERIC(12,2) DEFAULT 0,
            prim_orani NUMERIC(5,2) DEFAULT 0,
            prim_tutari NUMERIC(12,2) DEFAULT 0,
            onay_durumu TEXT DEFAULT 'hesaplandi'
                CHECK (onay_durumu IN ('hesaplandi','onaylandi','odendi','iptal')),
            onaylayan_id BIGINT REFERENCES personnel(id),
            onay_tarihi TIMESTAMPTZ,
            odeme_tarihi DATE,
            notlar TEXT,
            hesaplayan TEXT DEFAULT 'sistem',
            hesaplama_tarihi TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(personel_id, ay, yil)
        );
    `],

    ['INDEX prim_kayitlari personel_ay', `
        CREATE INDEX IF NOT EXISTS idx_prim_personel_ay ON prim_kayitlari(personel_id, ay, yil);
    `],

    ['INDEX prim_kayitlari durum', `
        CREATE INDEX IF NOT EXISTS idx_prim_durum ON prim_kayitlari(onay_durumu);
    `],

    // ─────────────────────────────────────────
    // 3. KAR ZARAR ÖZET
    // ─────────────────────────────────────────
    ['CREATE kar_zarar_ozet', `
        CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
            id BIGSERIAL PRIMARY KEY,
            ay INTEGER NOT NULL CHECK (ay BETWEEN 1 AND 12),
            yil INTEGER NOT NULL,
            toplam_gelir NUMERIC(14,2) DEFAULT 0,
            hammadde_gider NUMERIC(14,2) DEFAULT 0,
            iscilik_gider NUMERIC(14,2) DEFAULT 0,
            fason_gider NUMERIC(14,2) DEFAULT 0,
            sabit_gider NUMERIC(14,2) DEFAULT 0,
            degisken_gider NUMERIC(14,2) DEFAULT 0,
            prim_gider NUMERIC(14,2) DEFAULT 0,
            toplam_gider NUMERIC(14,2) DEFAULT 0,
            brut_kar NUMERIC(14,2) DEFAULT 0,
            net_kar NUMERIC(14,2) DEFAULT 0,
            kar_marji_yuzde NUMERIC(5,2) DEFAULT 0,
            toplam_uretim_adedi INTEGER DEFAULT 0,
            ortalama_fpy NUMERIC(5,2) DEFAULT 0,
            ortalama_oee NUMERIC(5,2) DEFAULT 0,
            basa_bas_adet NUMERIC(10,2) DEFAULT 0,
            durum TEXT DEFAULT 'taslak'
                CHECK (durum IN ('taslak','onaylandi','kapandi')),
            onaylayan_id BIGINT REFERENCES personnel(id),
            onay_tarihi TIMESTAMPTZ,
            kapayan_id BIGINT REFERENCES personnel(id),
            kapanma_tarihi TIMESTAMPTZ,
            yonetim_notu TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(ay, yil)
        );
    `],

    ['INDEX kar_zarar_ozet ay', `
        CREATE INDEX IF NOT EXISTS idx_karzarar_ay ON kar_zarar_ozet(ay, yil);
    `],

    // ─────────────────────────────────────────
    // 4. KARAR ARŞİVİ
    // ─────────────────────────────────────────
    ['CREATE karar_arsivi', `
        CREATE TABLE IF NOT EXISTS karar_arsivi (
            id BIGSERIAL PRIMARY KEY,
            tarih DATE NOT NULL DEFAULT CURRENT_DATE,
            konu TEXT NOT NULL,
            bolum TEXT DEFAULT 'uretim',
            sistem_onerisi TEXT,
            oneri_detay TEXT,
            oneri_verisi NUMERIC(12,2),
            yapilan_karar TEXT,
            karar_detay TEXT,
            sonuc TEXT,
            sonuc_sayisal NUMERIC(12,2),
            sistem_mi_dogru BOOLEAN,
            ogrenim_notu TEXT,
            ilgili_ay INTEGER,
            ilgili_yil INTEGER,
            sorumlu_id BIGINT REFERENCES personnel(id),
            sorumlu_ad TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `],

    ['INDEX karar_arsivi tarih', `
        CREATE INDEX IF NOT EXISTS idx_karar_tarih ON karar_arsivi(tarih DESC);
    `],

    // ─────────────────────────────────────────
    // 5. MEVCUT TABLOLARA ALAN EKLEMELERİ
    // ─────────────────────────────────────────
    ['ALTER operations standart_sure_dk', `
        ALTER TABLE operations
            ADD COLUMN IF NOT EXISTS standart_sure_dk NUMERIC(8,2) DEFAULT 0;
    `],

    ['ALTER production_logs katki_degeri_tutari', `
        ALTER TABLE production_logs
            ADD COLUMN IF NOT EXISTS katki_degeri_tutari NUMERIC(12,2) DEFAULT 0;
    `],

    ['ALTER personnel portal_aktif', `
        ALTER TABLE personnel
            ADD COLUMN IF NOT EXISTS portal_aktif BOOLEAN DEFAULT TRUE;
    `],

    ['ALTER personnel notlar', `
        ALTER TABLE personnel
            ADD COLUMN IF NOT EXISTS notlar TEXT;
    `],
];

async function main() {
    console.log('🚀 Pencere 5+6 Migration başladı...\n');
    console.log(`📌 Proje: ${PROJECT_ID}\n`);

    let ok = 0, fail = 0;

    for (const [label, sql] of migrations) {
        const success = await runSQL(label, sql.trim());
        if (success) ok++; else fail++;
        // Rate limiting
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Sonuç: ${ok} başarılı, ${fail} başarısız`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    if (fail === 0) {
        console.log('\n🎉 Migration tamamlandı!');
        console.log('\nOluşturulan tablolar:');
        console.log('  ✅ sistem_ayarlari (prim, sgk oranları)');
        console.log('  ✅ prim_kayitlari (aylık prim hesabı + onay)');
        console.log('  ✅ kar_zarar_ozet (aylık muhasebe kapanışı)');
        console.log('  ✅ karar_arsivi (sistem öğrenme döngüsü)');
        console.log('\nGüncellenen tablolar:');
        console.log('  ✅ operations.standart_sure_dk');
        console.log('  ✅ production_logs.katki_degeri_tutari');
        console.log('  ✅ personnel.portal_aktif, notlar');
        console.log('\n👉 Sonraki adım: Rapor & Analiz API rotalarını oluştur');
    } else {
        console.log('\n⚠️  Bazı işlemler başarısız. Hataları incele.');
    }
}

main().catch(e => { console.error(e.message); process.exit(1); });
