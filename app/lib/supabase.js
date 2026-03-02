// lib/supabase.js — Supabase istemcileri (server + client tarafı)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL veya Anon Key eksik! .env.local dosyasını kontrol edin.');
}

// Tarayıcı tarafında kullanılan public client (RLS aktif)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sunucu tarafında kullanılan admin client (RLS bypass - dikkatli kullanın)
export const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export default supabase;
