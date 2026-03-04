import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TABLOLAR = {
    kesim_planlari: `CREATE TABLE IF NOT EXISTS kesim_planlari (
        id BIGSERIAL PRIMARY KEY, model_id BIGINT, siparis_id BIGINT,
        plan_tarihi DATE NOT NULL, toplam_adet INTEGER DEFAULT 0,
        beden_dagitimi JSONB DEFAULT '{}', kat_sayisi INTEGER DEFAULT 1,
        tahmini_sarj_metre NUMERIC(10,2) DEFAULT 0, tahmini_fire_yuzde NUMERIC(5,2) DEFAULT 5,
        durum TEXT DEFAULT 'planlandı', kesimci_id BIGINT, notlar TEXT DEFAULT '',
        deleted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW())`,
    kesim_kayitlari: `CREATE TABLE IF NOT EXISTS kesim_kayitlari (
        id BIGSERIAL PRIMARY KEY, plan_id BIGINT, gercek_adet INTEGER DEFAULT 0,
        fire_adet INTEGER DEFAULT 0, kullanilan_metre NUMERIC(10,2) DEFAULT 0,
        fire_metre NUMERIC(10,2) DEFAULT 0, fire_yuzde NUMERIC(5,2) DEFAULT 0,
        fire_nedeni TEXT DEFAULT '', kesim_tarihi TIMESTAMPTZ DEFAULT NOW(),
        kaydeden_id BIGINT, created_at TIMESTAMPTZ DEFAULT NOW())`,
    hat_planlamasi: `CREATE TABLE IF NOT EXISTS hat_planlamasi (
        id BIGSERIAL PRIMARY KEY, model_id BIGINT, hat_adi TEXT NOT NULL,
        personel_listesi JSONB DEFAULT '[]', gun_hedefi INTEGER DEFAULT 0,
        aktif BOOLEAN DEFAULT TRUE, baslangic_tarihi DATE, bitis_tarihi DATE,
        notlar TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
    imalat_fazlari: `CREATE TABLE IF NOT EXISTS imalat_fazlari (
        id BIGSERIAL PRIMARY KEY, model_id BIGINT, siparis_id BIGINT, faz TEXT NOT NULL,
        baslangic TIMESTAMPTZ, bitis TIMESTAMPTZ, tamamlanan_adet INTEGER DEFAULT 0,
        hedef_adet INTEGER DEFAULT 0, sorumlu_id BIGINT, durum TEXT DEFAULT 'bekliyor',
        notlar TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
    yari_mamul_stok: `CREATE TABLE IF NOT EXISTS yari_mamul_stok (
        id BIGSERIAL PRIMARY KEY, model_id BIGINT, siparis_id BIGINT,
        faz_kaynak TEXT NOT NULL, faz_hedef TEXT NOT NULL, adet INTEGER DEFAULT 0,
        tarih TIMESTAMPTZ DEFAULT NOW(), kaydeden_id BIGINT, notlar TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW())`,
};

const ALTERS = [
    `ALTER TABLE operations ADD COLUMN IF NOT EXISTS standart_sure_dk REAL DEFAULT 0`,
    `ALTER TABLE operations ADD COLUMN IF NOT EXISTS birim_deger REAL DEFAULT 0`,
    `ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS katki_degeri_tutari REAL DEFAULT 0`,
    `ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS saatlik_maliyet NUMERIC(10,4) DEFAULT 0`,
];

export async function POST() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const durumlar = {};
    const hatalar = [];

    // Tabloları Supabase SDK'nın sql() metodu ile oluştur
    for (const [t, sql] of Object.entries(TABLOLAR)) {
        try {
            // SDK v2'de sql template tag
            if (typeof supabase.sql === 'function') {
                const { error } = await supabase.sql`${sql}`;
                if (error) hatalar.push({ tablo: t, hata: error.message });
                else durumlar[t] = '✅ Oluşturuldu (sql tag)';
            } else {
                // Alternatif: batch endpoint
                const res = await fetch(`${url}/rest/v1/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'tx=commit' },
                    body: JSON.stringify({ query: sql }),
                });
                durumlar[t] = res.ok ? '✅' : `❌ ${res.status}`;
            }
        } catch (e) {
            hatalar.push({ tablo: t, hata: e.message });
            durumlar[t] = `❌ ${e.message.slice(0, 50)}`;
        }
    }

    // Mevcut durum kontrol
    const mevcut = {};
    for (const t of Object.keys(TABLOLAR)) {
        const { data, error } = await supabase.from(t).select('id').limit(0);
        mevcut[t] = !error ? '✅ Mevcut' : `❌ ${error.message.slice(0, 50)}`;
    }

    return NextResponse.json({ durumlar, mevcut, hatalar });
}

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const tumTablolar = [
        'prim_kayitlari', 'kar_zarar_ozet', 'karar_arsivi', 'audit_trail',
        'kesim_planlari', 'kesim_kayitlari', 'hat_planlamasi', 'imalat_fazlari', 'yari_mamul_stok'
    ];
    const durumlar = {};
    for (const t of tumTablolar) {
        const { error } = await supabase.from(t).select('id').limit(0);
        durumlar[t] = !error ? '✅ Mevcut' : `❌ ${error.message.slice(0, 60)}`;
    }

    // SDK bilgisi
    const sdkInfo = {
        hasSql: typeof supabase.sql === 'function',
        sdkVersion: '(kontrol edin: package.json)',
    };

    return NextResponse.json({ durumlar, sdkInfo });
}
