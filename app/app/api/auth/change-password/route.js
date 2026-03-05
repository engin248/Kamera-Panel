import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword, verifyPassword } from '@/lib/jwt';

/**
 * POST /api/auth/change-password
 * Body: { username, current_password, new_password }
 * Header: x-user-id (middleware tarafından set edilir)
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { username, current_password, new_password } = body;

        if (!username || !current_password || !new_password) {
            return NextResponse.json(
                { error: 'Kullanıcı adı, mevcut şifre ve yeni şifre zorunlu.' },
                { status: 400 }
            );
        }

        if (new_password.length < 6) {
            return NextResponse.json(
                { error: 'Yeni şifre en az 6 karakter olmalı.' },
                { status: 400 }
            );
        }

        // Kullanıcıyı bul
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, username, password_hash, role, status')
            .eq('username', username)
            .eq('status', 'active')
            .limit(1);

        if (error || !users || users.length === 0) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
        }

        const user = users[0];

        // Mevcut şifreyi doğrula
        const isValid = verifyPassword(current_password, user.password_hash);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Mevcut şifre yanlış.' },
                { status: 401 }
            );
        }

        // Yeni şifreyi hashle ve güncelle
        const newHash = hashPassword(new_password);
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ password_hash: newHash })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: 'Şifre başarıyla değiştirildi.',
        });

    } catch (err) {
        console.error('Change password error:', err);
        return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
    }
}
