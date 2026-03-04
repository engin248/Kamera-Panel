-- ============================================================
-- SQL ADIM 5: MEVCUT TABLOLARA ALAN EKLEMELERİ
-- Supabase Dashboard → SQL Editor → Yeni Sorgu → Yapıştır → Run
-- ÖNEMLİ: Adım 1-4 tamamlandıktan SONRA çalıştır
-- ============================================================

-- operations tablosuna standart süre alanı ekle
-- (unit_price zaten var — birim_deger EKLEME)
ALTER TABLE operations
  ADD COLUMN IF NOT EXISTS standart_sure_dk NUMERIC(8,2) DEFAULT 0;

-- production_logs: katkı değeri önbelleği (performans için)
ALTER TABLE production_logs
  ADD COLUMN IF NOT EXISTS katki_degeri_tutari NUMERIC(12,2) DEFAULT 0;

-- personnel: self-serve portal ve notlar
ALTER TABLE personnel
  ADD COLUMN IF NOT EXISTS portal_aktif BOOLEAN DEFAULT TRUE;

ALTER TABLE personnel
  ADD COLUMN IF NOT EXISTS notlar TEXT;

-- ============================================================
-- DOĞRULAMA — Aşağıdaki sorguyu çalıştırarak kontrol et
-- ============================================================
SELECT 
  (SELECT COUNT(*) FROM sistem_ayarlari) AS sistem_ayarlari_kayit,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema='public' AND table_name='prim_kayitlari') AS prim_kayitlari_var,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema='public' AND table_name='kar_zarar_ozet') AS kar_zarar_ozet_var,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema='public' AND table_name='karar_arsivi') AS karar_arsivi_var;

-- Beklenen sonuç:
-- sistem_ayarlari_kayit = 5
-- prim_kayitlari_var = 1
-- kar_zarar_ozet_var = 1
-- karar_arsivi_var = 1
