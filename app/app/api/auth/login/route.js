import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { logActivity } from '@/lib/auth';

// POST — Giriş Yap
export async function POST(request) {
    try {
        const db = getDb();
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Kullanıcı adı ve şifre gerekli' }, { status: 400 });
        }

        // Kullanıcıyı bul
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = ?').get(username, 'active');
        if (!user) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 });
        }

        // Şifre kontrolü (basit — sonra bcrypt'e geçilebilir)
        if (user.password_hash !== password) {
            return NextResponse.json({ error: 'Şifre yanlış' }, { status: 401 });
        }

        // Son giriş zamanını güncelle
        db.prepare('UPDATE users SET last_login = datetime(?) WHERE id = ?').run(new Date().toISOString(), user.id);

        // Günlüğe kaydet
        logActivity(user, 'LOGIN', 'users', user.id, `${user.display_name} giriş yaptı`);

        return NextResponse.json({
            success: true,
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
        const db = getDb();
        const users = db.prepare('SELECT id, username, display_name, role, status, last_login, created_at FROM users').all();
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
