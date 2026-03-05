import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env.local'i manuel oku (RLS bypass için service_key şart)
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const [key, ...rest] = trimmed.split('=');
            process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
        }
    } catch (e) {
        console.warn('⚠️ .env.local okunamadı');
    }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cauptlsnqieegdrgotob.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error("❌ HATA: SUPABASE_SERVICE_ROLE_KEY bulunamadı! Lütfen .env.local dosyanızı kontrol edin.");
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
});

// Şifre hashleme fonksiyonu (Kamera-Panel jwt.js standardı)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return `${salt}:${hash}`;
}

async function run() {
    const args = process.argv.slice(2);
    const username = args[0] || 'admin';
    const newPassword = args[1] || '123456';

    console.log(`\n⏳ ${username} kullanıcısı aranıyor...`);

    const { data: user, error: findError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

    const hashedPw = hashPassword(newPassword);

    if (!user) {
        console.log(`ℹ️ Kullanıcı bulunamadı. Yeni '${username}' hesabı oluşturuluyor...`);
        const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
                username: username,
                password_hash: hashedPw,
                display_name: 'Sistem Yöneticisi',
                role: 'koordinator',
                status: 'active'
            });

        if (insertError) {
            console.log(`❌ Hesap oluşturulamadı: ${insertError.message}`);
        } else {
            console.log(`✅ Yeni yönetici hesabı oluşturuldu!`);
            console.log(`Kullanıcı Adı: ${username}`);
            console.log(`Şifre: ${newPassword}`);
        }
        return;
    }

    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash: hashedPw })
        .eq('username', username);

    if (updateError) {
        console.log(`❌ Şifre güncellenemedi: ${updateError.message}`);
    } else {
        console.log(`✅ Şifre başarıyla güncellendi!`);
        console.log(`Kullanıcı Adı: ${username}`);
        console.log(`Yeni Geçici Şifre: ${newPassword}`);
    }
}

run();
