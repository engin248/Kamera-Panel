/**
 * 🔒 Auth Middleware — Yetki ve Güvenlik Kontrolü
 * Supabase versiyonu (SQLite'dan migrate edildi)
 *
 * Roller: koordinator, ustabasi, kaliteci, operator
 */

import { supabaseAdmin } from './supabase';

// Yetki matrisi
const PERMISSIONS = {
    koordinator: { GET: true, POST: true, PUT: true, DELETE: true },
    ustabasi: { GET: true, POST: true, PUT: true, DELETE: false },
    kaliteci: { GET: true, POST: true, PUT: true, DELETE: false },
    operator: { GET: true, POST: false, PUT: false, DELETE: false },
};

/**
 * İstekten kullanıcı bilgisini çıkar ve yetki kontrolü yap
 * Güvenlik: API_SECRET_KEY ile iç servis çağrıları doğrulanır.
 * Header yoksa koordinator kabul edilir (geliştirme modunda).
 */
export async function checkAuth(request, method = 'GET') {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const internalKey = request.headers.get('x-internal-key');

    // İç servis çağrıları (bot/cron) — INTERNAL_API_KEY ile doğrula
    const INTERNAL_KEY = process.env.INTERNAL_API_KEY;
    if (internalKey && INTERNAL_KEY && internalKey === INTERNAL_KEY) {
        return { id: null, username: 'system', display_name: 'Sistem', role: 'koordinator' };
    }

    // Header yoksa geliştirme modunda koordinator kabul (production'da kapatılmalı)
    const isDev = process.env.NODE_ENV !== 'production';
    if (!userId) {
        if (isDev) {
            return { id: null, username: 'admin', display_name: 'Koordinatör (Dev)', role: 'koordinator' };
        }
        // Production: yetkisiz
        return null;
    }

    // Supabase'den kullanıcıyı doğrula
    const { data: user } = await supabaseAdmin
        .from('personnel')
        .select('id, name, role, status')
        .eq('id', userId)
        .eq('status', 'active')
        .maybeSingle();

    if (!user) return null;

    // Yetki kontrolü
    const role = userRole || user.role || 'operator';
    const perms = PERMISSIONS[role] || PERMISSIONS.operator;
    if (!perms[method]) {
        return { ...user, display_name: user.name, role, _forbidden: true };
    }

    return { ...user, display_name: user.name, role };
}

/** Senkron versiyon — Header kontrolü ile yetki doğrulama */
export function checkAuthSync(request, method = 'GET') {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const internalKey = request.headers.get('x-internal-key');

    // İç servis çağrıları (bot/cron)
    const INTERNAL_KEY = process.env.INTERNAL_API_KEY;
    if (internalKey && INTERNAL_KEY && internalKey === INTERNAL_KEY) {
        return { id: null, username: 'system', display_name: 'Sistem', role: 'koordinator' };
    }

    // Header yoksa — dev modunda koordinator, production'da null
    if (!userId && !userRole) {
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev) {
            return { id: null, username: 'admin', display_name: 'Koordinatör (Dev)', role: 'koordinator' };
        }
        return null;
    }

    const role = userRole || 'operator';
    const perms = PERMISSIONS[role] || PERMISSIONS.operator;
    if (!perms[method]) return { role, _forbidden: true };
    return { id: userId, role, display_name: 'Kullanıcı' };
}

/** DELETE yetkisi kontrolü */
export async function checkDeletePermission(request) {
    const user = await checkAuth(request, 'DELETE');
    if (!user) return { allowed: false, user: null, error: 'Kullanıcı bulunamadı' };
    if (user._forbidden) return { allowed: false, user, error: `${user.display_name} — silme yetkisi yok. Sadece Koordinatör silebilir.` };
    return { allowed: true, user };
}

/** Denetim logu — audit_trail tablosuna yazar */
export async function logActivity(user, action, tableName, recordId, summary) {
    try {
        await supabaseAdmin.from('audit_trail').insert({
            user_id: user?.id || null,
            user_name: user?.display_name || 'Sistem',
            action,
            table_name: tableName,
            record_id: recordId ? String(recordId) : null,
            record_summary: summary || '',
        });
    } catch (e) {
        console.error('Activity log hatası:', e.message);
    }
}

/** Soft-delete — Supabase'de deleted_at ile işaretler */
export async function softDelete(tableName, id, user) {
    try {
        const { error } = await supabaseAdmin
            .from(tableName)
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user?.display_name || 'admin',
            })
            .eq('id', id)
            .is('deleted_at', null);

        if (error) return { success: false, error: error.message };
        await logActivity(user, 'SOFT_DELETE', tableName, id, `${tableName} #${id} soft-delete yapıldı`);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export default { checkAuth, checkAuthSync, checkDeletePermission, logActivity, softDelete };
