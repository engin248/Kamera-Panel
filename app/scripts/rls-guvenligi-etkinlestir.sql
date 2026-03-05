-- ============================================================
-- 🔐 KAMERA-PANEL — ROW LEVEL SECURITY (RLS) ETKİNLEŞTİRME
-- Tarih: 2026-03-04
-- Yöntem: service_role her şeyi yapabilir
--         anon/authenticated sadece okuyabilir
-- Supabase SQL Editor'a yapıştır ve Run et.
-- ============================================================

-- ============================================================
-- ADIM 1: Tüm mevcut policy'leri temizle (çakışma olmasın)
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- ADIM 2: Tüm tablolarda RLS'yi etkinleştir
-- ============================================================
ALTER TABLE IF EXISTS personnel            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS machines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS models               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS operations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS production_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cost_entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_expenses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prim_kayitlari       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kar_zarar_ozet       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS karar_arsivi         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quality_checks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shipments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fason_providers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fason_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_trail          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS work_schedule        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS personel_saat_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS personel_sgk         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS model_islem_sirasi   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ara_kontrol          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sistem_ayarlari      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS approvals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS monthly_work_days    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ADIM 3: Policy'leri oluştur
-- Kural: service_role her şeyi yapabilir (backend API'ler)
--        Diğerleri sadece SELECT yapabilir
-- ============================================================

-- ── PERSONNEL ────────────────────────────────────────────────
CREATE POLICY "personnel_service_all"
  ON personnel FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "personnel_read"
  ON personnel FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── MACHINES ─────────────────────────────────────────────────
CREATE POLICY "machines_service_all"
  ON machines FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "machines_read"
  ON machines FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── MODELS ───────────────────────────────────────────────────
CREATE POLICY "models_service_all"
  ON models FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "models_read"
  ON models FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── OPERATIONS ───────────────────────────────────────────────
CREATE POLICY "operations_service_all"
  ON operations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "operations_read"
  ON operations FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── PRODUCTION_LOGS ──────────────────────────────────────────
CREATE POLICY "production_logs_service_all"
  ON production_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "production_logs_read"
  ON production_logs FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── COST_ENTRIES ─────────────────────────────────────────────
CREATE POLICY "cost_entries_service_all"
  ON cost_entries FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "cost_entries_read"
  ON cost_entries FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── BUSINESS_EXPENSES ────────────────────────────────────────
CREATE POLICY "business_expenses_service_all"
  ON business_expenses FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "business_expenses_read"
  ON business_expenses FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── ORDERS ───────────────────────────────────────────────────
CREATE POLICY "orders_service_all"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "orders_read"
  ON orders FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── CUSTOMERS ────────────────────────────────────────────────
CREATE POLICY "customers_service_all"
  ON customers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "customers_read"
  ON customers FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── SHIPMENTS ────────────────────────────────────────────────
CREATE POLICY "shipments_service_all"
  ON shipments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "shipments_read"
  ON shipments FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── FASON_PROVIDERS ──────────────────────────────────────────
CREATE POLICY "fason_providers_service_all"
  ON fason_providers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "fason_providers_read"
  ON fason_providers FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── FASON_ORDERS ─────────────────────────────────────────────
CREATE POLICY "fason_orders_service_all"
  ON fason_orders FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "fason_orders_read"
  ON fason_orders FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── QUALITY_CHECKS ───────────────────────────────────────────
CREATE POLICY "quality_checks_service_all"
  ON quality_checks FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "quality_checks_read"
  ON quality_checks FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── APPROVALS ────────────────────────────────────────────────
CREATE POLICY "approvals_service_all"
  ON approvals FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "approvals_read"
  ON approvals FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── PRIM_KAYITLARI (hassas — sadece service_role) ─────────────
CREATE POLICY "prim_service_only"
  ON prim_kayitlari FOR ALL
  USING (auth.role() = 'service_role');

-- ── KAR_ZARAR_OZET (hassas — sadece service_role) ────────────
CREATE POLICY "kar_zarar_service_only"
  ON kar_zarar_ozet FOR ALL
  USING (auth.role() = 'service_role');

-- ── KARAR_ARSIVI ─────────────────────────────────────────────
CREATE POLICY "karar_arsivi_service_all"
  ON karar_arsivi FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "karar_arsivi_read"
  ON karar_arsivi FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── AUDIT_TRAIL (sadece servis yazabilir/okuyabilir) ─────────
CREATE POLICY "audit_trail_service_all"
  ON audit_trail FOR ALL
  USING (auth.role() = 'service_role');

-- ── USERS (kritik — sadece service_role) ─────────────────────
CREATE POLICY "users_service_only"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- ── WORK_SCHEDULE ────────────────────────────────────────────
CREATE POLICY "work_schedule_service_all"
  ON work_schedule FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "work_schedule_read"
  ON work_schedule FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── PERSONEL_SAAT_KAYITLARI ──────────────────────────────────
CREATE POLICY "personel_saat_service_all"
  ON personel_saat_kayitlari FOR ALL
  USING (auth.role() = 'service_role');

-- ── PERSONEL_SGK (hassas) ────────────────────────────────────
CREATE POLICY "personel_sgk_service_only"
  ON personel_sgk FOR ALL
  USING (auth.role() = 'service_role');

-- ── MODEL_ISLEM_SIRASI ───────────────────────────────────────
CREATE POLICY "model_islem_service_all"
  ON model_islem_sirasi FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "model_islem_read"
  ON model_islem_sirasi FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── ARA_KONTROL ──────────────────────────────────────────────
CREATE POLICY "ara_kontrol_service_all"
  ON ara_kontrol FOR ALL
  USING (auth.role() = 'service_role');

-- ── SİSTEM_AYARLARI ──────────────────────────────────────────
CREATE POLICY "sistem_ayarlari_service_all"
  ON sistem_ayarlari FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "sistem_ayarlari_read"
  ON sistem_ayarlari FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ── MONTHLY_WORK_DAYS ────────────────────────────────────────
CREATE POLICY "monthly_work_days_service_all"
  ON monthly_work_days FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "monthly_work_days_read"
  ON monthly_work_days FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- ============================================================
-- ADIM 4: Doğrulama — aktif policy listesi
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
