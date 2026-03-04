// lib/supabase.js — Supabase istemcileri (server + client tarafı)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // Throw yerine console.warn — sunucu çökmesini engelle
    console.warn('[supabase.js] UYARI: Supabase URL veya Anon Key eksik! .env.local dosyasını kontrol edin.');
}

const url = supabaseUrl || 'https://localhost';
const anonKey = supabaseAnonKey || 'placeholder';
const serviceKey = supabaseServiceKey || anonKey;

// Tarayıcı tarafında kullanılan public client (RLS aktif)
export const supabase = createClient(url, anonKey);

// Sunucu tarafında kullanılan admin client (RLS bypass - dikkatli kullanın)
export const supabaseAdmin = createClient(url, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export default supabase;
