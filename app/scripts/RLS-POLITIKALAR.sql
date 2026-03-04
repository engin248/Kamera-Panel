-- ============================================================
-- RLS (Row Level Security) Politikaları — DÜZELTILMIŞ
-- Sadece MEVCUT tablolar için (30 tablo kontrol edildi)
-- ============================================================

-- 1. RLS ENABLE: Mevcut hassas tablolar
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prim_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE karar_arsivi ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE kar_zarar_ozet ENABLE ROW LEVEL SECURITY;
ALTER TABLE personel_sgk ENABLE ROW LEVEL SECURITY;

-- 2. OKUMA POLİTİKALARI (authenticated + service_role)
CREATE POLICY IF NOT EXISTS "personnel_read" ON personnel FOR SELECT
USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "production_logs_read" ON production_logs FOR SELECT
USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "quality_checks_read" ON quality_checks FOR SELECT
USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "orders_read" ON orders FOR SELECT
USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "models_read" ON models FOR SELECT
USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "cost_entries_read" ON cost_entries FOR SELECT
USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "karar_arsivi_read" ON karar_arsivi FOR SELECT
USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "audit_trail_read" ON audit_trail FOR SELECT
USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "kar_zarar_read" ON kar_zarar_ozet FOR SELECT
USING (auth.role() IN ('authenticated', 'service_role'));

-- 3. YAZMA POLİTİKALARI (sadece service_role)
CREATE POLICY IF NOT EXISTS "production_logs_write" ON production_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "orders_write" ON orders FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "prim_service_only" ON prim_kayitlari FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "audit_trail_write" ON audit_trail FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "karar_arsivi_write" ON karar_arsivi FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "kar_zarar_write" ON kar_zarar_ozet FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "personel_sgk_write" ON personel_sgk FOR ALL
USING (auth.role() = 'service_role');
