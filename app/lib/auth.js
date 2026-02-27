/**
 * 🔒 Auth Middleware — Yetki ve Güvenlik Kontrolü
 * 
 * Roller: koordinator, ustabasi, kaliteci, operator
 * 
 * Kullanım:
 *   import { checkAuth, logActivity } from '@/lib/auth';
 *   const user = checkAuth(request, 'DELETE'); // yetki kontrolü
 *   logActivity(user, 'DELETE', 'personnel', id, 'Ahmet silinidi');
 */

import getDb from './db';

// Yetki matrisi
const PERMISSIONS = {
    koordinator: { GET: true, POST: true, PUT: true, DELETE: true },
    ustabasi: { GET: true, POST: true, PUT: true, DELETE: false },
    kaliteci: { GET: true, POST: true, PUT: true, DELETE: false },
    operator: { GET: true, POST: false, PUT: false, DELETE: false },
};

/**
 * İstekten kullanıcı bilgisini çıkar ve yetki kontrolü yap
 * @param {Request} request - HTTP isteği
 * @param {string} method - HTTP metodu (GET, POST, PUT, DELETE)
 * @returns {{ id, username, display_name, role } | null}
 */
export function checkAuth(request, method = 'GET') {
    const db = getDb();

    // Header'dan kullanıcı bilgisi al
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    // Geçici: Eğer header yoksa varsayılan olarak koordinator kabul et
    // (Login sistemi aktif edilince bu kaldırılacak)
    if (!userId) {
        return { id: 1, username: 'admin', display_name: 'Koordinatör', role: 'koordinator' };
    }

    // Kullanıcıyı DB'den doğrula
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = ?').get(userId, 'active');
    if (!user) {
        return null; // Kullanıcı bulunamadı
    }

    // Yetki kontrolü
    const perms = PERMISSIONS[user.role] || PERMISSIONS.operator;
    if (!perms[method]) {
        return { ...user, _forbidden: true };
    }

    return user;
}

/**
 * DELETE yetkisi kontrolü — sadece koordinator yapabilir
 * @param {Request} request
 * @returns {{ allowed: boolean, user: object, error?: string }}
 */
export function checkDeletePermission(request) {
    const user = checkAuth(request, 'DELETE');

    if (!user) {
        return { allowed: false, user: null, error: 'Kullanıcı bulunamadı veya devre dışı' };
    }

    if (user._forbidden) {
        return { allowed: false, user, error: `${user.display_name} (${user.role}) — silme yetkisi yok. Sadece Koordinatör silebilir.` };
    }

    return { allowed: true, user };
}

/**
 * İşlem günlüğüne kayıt ekle
 * @param {object} user - { id, display_name }
 * @param {string} action - 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'SOFT_DELETE'
 * @param {string} tableName - 'personnel', 'models', vs.
 * @param {number|string} recordId - Kaydın ID'si
 * @param {string} summary - Kısa açıklama
 */
export function logActivity(user, action, tableName, recordId, summary) {
    try {
        const db = getDb();
        db.prepare(
            'INSERT INTO activity_log (user_id, user_name, action, table_name, record_id, record_summary) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
            user?.id || 0,
            user?.display_name || 'Sistem',
            action,
            tableName,
            recordId || 0,
            summary || ''
        );
    } catch (e) {
        console.error('Activity log hatası:', e.message);
    }
}

/**
 * Soft-delete işlemi — veriyi silmez, deleted_at ile işaretler
 * @param {string} tableName - Tablo adı
 * @param {number|string} id - Kayıt ID'si
 * @param {object} user - Silme yapan kullanıcı
 * @returns {{ success: boolean, error?: string }}
 */
export function softDelete(tableName, id, user) {
    try {
        const db = getDb();

        // Kaydın mevcut olup olmadığını kontrol et
        const record = db.prepare(`SELECT * FROM ${tableName} WHERE id = ? AND deleted_at IS NULL`).get(id);
        if (!record) {
            return { success: false, error: 'Kayıt bulunamadı veya zaten silinmiş' };
        }

        // Soft-delete uygula
        db.prepare(
            `UPDATE ${tableName} SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ?`
        ).run(user?.display_name || 'admin', id);

        // Günlüğe kaydet
        logActivity(user, 'SOFT_DELETE', tableName, id, `${tableName} #${id} soft-delete yapıldı`);

        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export default { checkAuth, checkDeletePermission, logActivity, softDelete };
