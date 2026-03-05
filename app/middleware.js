import { NextResponse } from 'next/server';

// ====================================================================
// 🔐 KATMAN 1: Brute Force Koruması (In-memory rate limiter)
// ====================================================================
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true };
    }
    if (entry.count >= MAX_ATTEMPTS) {
        const wait = Math.ceil((entry.resetAt - now) / 60000);
        return { allowed: false, wait };
    }
    entry.count++;
    return { allowed: true };
}

// ====================================================================
// 🔐 KATMAN 2: JWT Doğrulama — Edge Runtime uyumlu (Web Crypto API)
// ====================================================================
async function verifyJWT(token) {
    try {
        const secret = process.env.JWT_SECRET || 'dev-only-key-change-in-production';
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [header, payload, signature] = parts;

        const enc = new TextEncoder();
        const keyData = enc.encode(secret);
        const key = await crypto.subtle.importKey(
            'raw', keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false, ['verify']
        );

        // Base64url decode helper
        function b64urlToBytes(str) {
            const padded = str.replace(/-/g, '+').replace(/_/g, '/');
            const pad = padded.length % 4 ? '='.repeat(4 - padded.length % 4) : '';
            return Uint8Array.from(atob(padded + pad), c => c.charCodeAt(0));
        }

        const valid = await crypto.subtle.verify(
            'HMAC', key,
            b64urlToBytes(signature),
            enc.encode(`${header}.${payload}`)
        );
        if (!valid) return null;

        const decoded = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)));
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
        return decoded;
    } catch { return null; }
}

// ====================================================================
// 🔐 KATMAN 3: Route Tanımları
// ====================================================================
const PUBLIC_ROUTES = [
    '/login',
    '/api/auth/login',
    '/api/auth/logout',
    '/_next',
    '/favicon.ico',
    '/public',
    '/api/chatbot',
    '/api/run-migration'
];

const INTERNAL_ROUTES = [
    '/api/cron',
    '/api/chatbot',
];

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '127.0.0.1';

    // ── Public route'lar serbest ──────────────────────────────────
    if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
        return NextResponse.next();
    }

    // ── Statik dosyalar serbest ──────────────────────────────────
    if (pathname.includes('.')) {
        return NextResponse.next();
    }

    // ── Login endpoint rate limiting ─────────────────────────────
    if (pathname === '/api/auth/login' && request.method === 'POST') {
        const rl = checkRateLimit(ip);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: `Cok fazla deneme. ${rl.wait} dakika bekleyin.` },
                { status: 429, headers: { 'Retry-After': String(rl.wait * 60) } }
            );
        }
        return NextResponse.next();
    }

    // ── İç servis çağrıları (bot/cron) — INTERNAL_API_KEY ────────
    const internalKey = request.headers.get('x-internal-key');
    const INTERNAL_KEY = process.env.INTERNAL_API_KEY;
    if (internalKey && INTERNAL_KEY && internalKey === INTERNAL_KEY) {
        return NextResponse.next();
    }

    // ── JWT Doğrulama ─────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('kp_token')?.value;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    const decoded = token ? await verifyJWT(token) : null;

    // API route koruması
    if (pathname.startsWith('/api/')) {
        if (!decoded) {
            return NextResponse.json(
                { error: 'Yetkisiz erisim. Lutfen giris yapin.' },
                { status: 401 }
            );
        }
        const res = NextResponse.next();
        res.headers.set('x-user-id', String(decoded.user_id || ''));
        res.headers.set('x-user-role', decoded.role || 'operator');
        res.headers.set('x-user-name', decoded.username || '');
        return res;
    }

    // Sayfa route koruması
    if (!decoded) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
