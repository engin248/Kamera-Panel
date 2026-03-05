/**
 * supabase-kolon-ekle.mjs
 * Eksik kolonları Supabase'e ekler
 * Çalıştır: node scripts/supabase-kolon-ekle.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cauptlsnqieegdrgotob.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXB0bHNucWllZWdkcmdvdG9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQxNzE3MywiZXhwIjoyMDg3OTkzMTczfQ.MgVNEwQzHJncpL5JSm1HX7Z0VxRH1mqg3PjGyIlW1Sw';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ─── Kolon var mı kontrol et ───────────────────────────────────────────────
async function kolonVarMi(tablo, kolon) {
    const { data, error } = await supabase
        .from(tablo)
        .select(kolon)
        .limit(0);
    return !error; // hata yoksa kolon var
}

// ─── REST API üzerinden ALTER TABLE çalıştır ──────────────────────────────
async function execSQL(sql) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        }
    });
    // Doğrudan SQL çalıştır — Supabase pg extension endpoint
    const r = await fetch(`${SUPABASE_URL}/pg`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: sql })
    });
    return r;
}

// ─── Ana kontrol ve ekleme ─────────────────────────────────────────────────
const KONTROLLER = [
    { tablo: 'operations', kolon: 'birim_deger', sql: 'ALTER TABLE operations ADD COLUMN IF NOT EXISTS birim_deger NUMERIC(10,2) DEFAULT 0' },
    { tablo: 'operations', kolon: 'standart_sure_dk', sql: 'ALTER TABLE operations ADD COLUMN IF NOT EXISTS standart_sure_dk NUMERIC(8,2) DEFAULT 0' },
    { tablo: 'prim_kayitlari', kolon: 'onaylanan_prim', sql: 'ALTER TABLE prim_kayitlari ADD COLUMN IF NOT EXISTS onaylanan_prim NUMERIC(12,2) DEFAULT 0' },
    { tablo: 'production_logs', kolon: 'katki_degeri_tutari', sql: 'ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS katki_degeri_tutari NUMERIC(12,2) DEFAULT 0' },
    { tablo: 'personnel', kolon: 'sgk_employer_rate', sql: 'ALTER TABLE personnel ADD COLUMN IF NOT EXISTS sgk_employer_rate NUMERIC(5,2) DEFAULT 20.5' },
    { tablo: 'personnel', kolon: 'prim_orani', sql: 'ALTER TABLE personnel ADD COLUMN IF NOT EXISTS prim_orani NUMERIC(5,2) DEFAULT 15' },
    { tablo: 'personnel', kolon: 'daily_avg_output', sql: 'ALTER TABLE personnel ADD COLUMN IF NOT EXISTS daily_avg_output NUMERIC(10,2) DEFAULT 0' },
    { tablo: 'personnel', kolon: 'error_rate', sql: 'ALTER TABLE personnel ADD COLUMN IF NOT EXISTS error_rate NUMERIC(5,2) DEFAULT 0' },
    { tablo: 'personnel', kolon: 'efficiency_score', sql: 'ALTER TABLE personnel ADD COLUMN IF NOT EXISTS efficiency_score NUMERIC(5,2) DEFAULT 0' },
    { tablo: 'business_expenses', kolon: 'saatlik_maliyet', sql: 'ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS saatlik_maliyet NUMERIC(10,4) DEFAULT 0' },
];

console.log('🔍 Supabase kolon kontrolü başlıyor...\n');

const eksikSQL = [];

for (const k of KONTROLLER) {
    const var_ = await kolonVarMi(k.tablo, k.kolon);
    if (var_) {
        console.log(`  ✅ ${k.tablo}.${k.kolon} → MEVCUT`);
    } else {
        console.log(`  ❌ ${k.tablo}.${k.kolon} → EKSİK`);
        eksikSQL.push(k.sql);
    }
}

console.log('\n');

if (eksikSQL.length === 0) {
    console.log('🎉 Tüm kolonlar mevcut! Eklenecek bir şey yok.\n');
} else {
    console.log(`⚠️  ${eksikSQL.length} eksik kolon tespit edildi.\n`);
    console.log('📋 Supabase Dashboard → SQL Editor\'a şunu yapıştırın:\n');
    console.log('-- ================================================');
    console.log('-- EKSİK KOLON EKLEMELERİ');
    console.log('-- ================================================');
    eksikSQL.forEach(s => console.log(s + ';'));
    console.log('-- ================================================\n');
}
