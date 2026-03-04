import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createToken, verifyPassword, hashPassword } from '@/lib/jwt';
import { logActivity } from '@/lib/auth';

// POST — Giriş Yap (JWT token döner)
export async function POST(request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Kullanıcı adı ve şifre gerekli' }, { status: 400 });
        }

        // Supabase users tablosundan kullanıcıyı bul
        const { data: users, error: fetchErr } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('status', 'active')
            .limit(1);

        if (fetchErr) throw fetchErr;
        const user = users?.[0];

        if (!user) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 });
        }

        // 🔐 Şifre kontrolü — hash'li ve düz metin destekli (geriye uyumlu)
        const passwordValid = verifyPassword(password, user.password_hash);
        if (!passwordValid) {
            return NextResponse.json({ error: 'Şifre yanlış' }, { status: 401 });
        }

        // Eski düz metin şifre varsa otomatik hash'e yükselt
        if (!user.password_hash.includes(':')) {
            const hashedPw = hashPassword(password);
            await supabaseAdmin
                .from('users')
                .update({ password_hash: hashedPw })
                .eq('id', user.id);
        }

        // 🔐 JWT Token oluştur (24 saat geçerli)
        const token = createToken({
            user_id: user.id,
            username: user.username,
            role: user.role,
        });

        // Son giriş zamanını güncelle
        await supabaseAdmin
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        // Audit log
        await logActivity(
            { id: user.id, display_name: user.display_name },
            'LOGIN', 'users', user.id,
            `${user.display_name} giriş yaptı`
        );

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                role: user.role,
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET — Kullanıcı listesi (sadece koordinator)
export async function GET(request) {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, username, display_name, role, status, last_login, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
