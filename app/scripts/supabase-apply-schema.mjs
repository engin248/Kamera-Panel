// scripts/supabase-apply-schema.mjs
// Supabase Management API ile SQL şemasını uygular
// Gerekli: SUPABASE_ACCESS_TOKEN (Dashboard > Account > Access Tokens)
// Çalıştır: node scripts/supabase-apply-schema.mjs

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'cauptlsnqieegdrgotob';
// Bu token Supabase Dashboard > Hesap > Access Tokens'dan alınır
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.log('❌ SUPABASE_ACCESS_TOKEN eksik!');
    console.log('');
    console.log('👉 Adımlar:');
    console.log('   1. https://supabase.com/dashboard/account/tokens adresine git');
    console.log('   2. "Generate new token" → adını yaz → kopyala');
    console.log('   3. Terminalde çalıştır:');
    console.log('   $env:SUPABASE_ACCESS_TOKEN="senin_tokenin"; node scripts/supabase-apply-schema.mjs');
    process.exit(1);
}

const schemaSQL = readFileSync(path.join(__dirname, 'supabase-schema.sql'), 'utf-8');

async function runSQL(sql) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });
    return res.json();
}

async function main() {
    console.log('🏗️  Supabase Management API ile şema uygulanıyor...\n');

    // Büyük SQL'i satırlara böl, CREATE TABLE başlarını bul
    const statements = schemaSQL
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && !s.startsWith('--'));

    let ok = 0, fail = 0;
    for (const stmt of statements) {
        const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'index/other';
        try {
            const result = await runSQL(stmt + ';');
            if (result.error || result.message?.includes('error')) {
                console.log(`❌ ${tableName}: ${result.error || result.message}`);
                fail++;
            } else {
                console.log(`✅ ${tableName}`);
                ok++;
            }
        } catch (e) {
            console.log(`❌ ${tableName}: ${e.message}`);
            fail++;
        }
    }

    console.log(`\n📊 ${ok} başarılı, ${fail} başarısız`);
    if (fail === 0) {
        console.log('\n🎉 Şema kuruldu! Şimdi:');
        console.log('   node scripts/migrate-all-to-supabase.mjs --force');
    }
}

main().catch(e => { console.error(e.message); process.exit(1); });
