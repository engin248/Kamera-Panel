import { NextResponse } from 'next/server';

/**
 * 🔒 Next.js Middleware — Route Koruması
 * 
 * API endpoint'lerini korur:
 * - Production'da x-user-id veya x-internal-key header'ı zorunlu
 * - Dev modda serbest geçiş (auth.js ile uyumlu)
 * - Statik dosyalar ve public route'lar korunmaz
 */
export function middleware(request) {
    const { pathname } = request.nextUrl;

    // API route'larını koru
    if (pathname.startsWith('/api/')) {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        const internalKey = request.headers.get('x-internal-key');
        const isDev = process.env.NODE_ENV !== 'production';

        // İç servis çağrıları (bot/cron) — INTERNAL_API_KEY ile doğrula
        const INTERNAL_KEY = process.env.INTERNAL_API_KEY;
        if (internalKey && INTERNAL_KEY && internalKey === INTERNAL_KEY) {
            return NextResponse.next();
        }

        // Dev modda serbest geçiş
        if (isDev) {
            return NextResponse.next();
        }

        // Production'da header zorunlu
        if (!userId && !userRole) {
            return NextResponse.json(
                { error: 'Yetkisiz erişim. x-user-id veya x-user-role header gerekli.' },
                { status: 401 }
            );
        }

        return NextResponse.next();
    }

    // Diğer tüm route'lar serbest
    return NextResponse.next();
}

// Hangi route'larda middleware çalışsın
export const config = {
    matcher: [
        // API route'ları
        '/api/:path*',
    ],
};
