/**
 * lib/db.js — KULLANIMDAN KALDIRILDI
 *
 * Tüm veritabanı işlemleri Supabase üzerinden yapılmaktadır.
 * Bu dosya geriye dönük uyumluluk için saklanmıştır.
 *
 * Doğru kullanım:
 *   import { supabaseAdmin } from '@/lib/supabase'
 *
 * @deprecated SQLite kaldırıldı — 2026-03-03
 */

// Yanlışlıkla import edilirse net hata mesajı ver
export function getDb() {
  throw new Error(
    '[db.js] SQLite kaldırıldı. Supabase kullanın: import { supabaseAdmin } from "@/lib/supabase"'
  );
}

export default getDb;
