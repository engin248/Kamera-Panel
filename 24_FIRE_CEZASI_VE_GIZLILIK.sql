-- ============================================================
-- SİL BAŞTAN PRİM SİSTEMİ VERİTABANI GÜNCELLEMELERİ VE DÜZELTMELERİ
-- ============================================================

-- 1. fire_kayitlari tablosunun varsa hata durumunda veya yeni bir kayıt için kurgulanması
-- (Kalite kontrol hatalarında rework maliyetinin yazılması için)
-- Tablo zaten var olabilir ama operator_id veya estimated_loss_amount kolonları eklenebilir.

DO $$
BEGIN
    -- operator_id kolonu ekleme
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fire_kayitlari' AND column_name='operator_id') THEN
        ALTER TABLE fire_kayitlari ADD COLUMN operator_id BIGINT REFERENCES personnel(id);
    END IF;

    -- estimated_loss_amount kolonu ekleme
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fire_kayitlari' AND column_name='estimated_loss_amount') THEN
        ALTER TABLE fire_kayitlari ADD COLUMN estimated_loss_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- fire_nedeni kolonu ekleme (Varsa diye kontrol)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fire_kayitlari' AND column_name='fire_nedeni') THEN
        ALTER TABLE fire_kayitlari ADD COLUMN fire_nedeni TEXT;
    END IF;
END $$;

-- ============================================================
-- RLS (ROW LEVEL SECURITY) POLİTİKALARI (GÜVENLİK ANAYASASI)
-- ============================================================
-- Sadece izin verilen rolller (koordinatör vb.) muhasebe, prim ve maliyet tablolarını görebilir.
-- Bu veritabanı tarafında ek bir güvenlik katmanıdır.

-- Önce tabloları RLS'ye açalım
ALTER TABLE prim_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;

-- Prim Kayıtları için RLS (Sadece koordinatör tam yetki, personel sadece kendisini)
-- (Gerçekte Supabase'de session role 'authenticated' üzerinden jwt.user_id ile bağlanır, ama role/user_metadata bazlı kontrol yapılabilir)

-- ÖRNEK RLS POLİTİKASI (Eğer Auth üzerinden tam entegre çalışılıyorsa):
-- CREATE POLICY "Koordinator Her Seyi Gorur" ON prim_kayitlari FOR ALL USING (auth.jwt() ->> 'role' = 'koordinator');
-- CREATE POLICY "Personel Kendi Primini Gorur" ON prim_kayitlari FOR SELECT USING ((auth.jwt() ->> 'personnel_id')::bigint = personel_id);

-- Ancak mevcut mimaride Supabase anon key / service key kullanımı ve frontend based RBAC yapildiği için 
-- frontend API_ROUTE (backend) kısmında güvenlik kontrollerinin sağlam olması kritiktir. 
-- Şimdilik service_role API üzerinden her yetkiye sahip olduğundan RLS'i çok katı zorlamayabilir, 
-- Ancak ileride JWT-based login'e tam geçildiğinde bu RLS polisileri hayati önem taşır.
