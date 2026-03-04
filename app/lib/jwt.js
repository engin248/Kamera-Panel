/**
 * 🔐 JWT Yardımcısı — Node.js crypto ile JWT oluşturma ve doğrulama
 * Harici bağımlılık gerektirmez (jose/jsonwebtoken yok)
 */
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-key-change-in-production';
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Base64URL kodlama (standart base64'ten farklı)
 */
function base64url(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * JWT Token oluştur
 * @param {Object} payload - Token içeriği (user_id, role, display_name vb.)
 * @returns {string} JWT token
 */
export function createToken(payload) {
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = base64url(JSON.stringify({
        ...payload,
        iat: now,
        exp: now + (TOKEN_EXPIRY_HOURS * 3600),
    }));

    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${tokenPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${header}.${tokenPayload}.${signature}`;
}

/**
 * JWT Token doğrula
 * @param {string} token - JWT token
 * @returns {Object|null} Payload veya null (geçersiz/süresi dolmuş)
 */
export function verifyToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [header, payload, signature] = parts;

        // İmza doğrulama
        const expectedSig = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${payload}`)
            .digest('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

        if (signature !== expectedSig) return null;

        // Payload decode
        const decoded = JSON.parse(base64urlDecode(payload));

        // Süre kontrolü
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) return null;

        return decoded;
    } catch {
        return null;
    }
}

/**
 * Şifre hash'leme (SHA-256 + salt)
 * @param {string} password - Düz metin şifre
 * @returns {string} Hash değeri (salt:hash formatında)
 */
export function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return `${salt}:${hash}`;
}

/**
 * Şifre doğrulama
 * @param {string} password - Düz metin şifre
 * @param {string} storedHash - Veritabanındaki hash (salt:hash formatında)
 * @returns {boolean} Doğru mu?
 */
export function verifyPassword(password, storedHash) {
    // Eski düz metin şifrelerle geriye uyumluluk
    if (!storedHash.includes(':')) {
        return password === storedHash;
    }
    const [salt, hash] = storedHash.split(':');
    const testHash = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return hash === testHash;
}

export default { createToken, verifyToken, hashPassword, verifyPassword };
