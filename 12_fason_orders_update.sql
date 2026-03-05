-- ==========================================
-- EKSİK KOLON GÜNCELLEMESİ: FASON SİPARİŞLERİ
-- ==========================================

-- fason_orders tablosuna operation_type ekliyoruz
ALTER TABLE public.fason_orders 
ADD COLUMN IF NOT EXISTS operation_type TEXT DEFAULT 'Sadece Dikim';

-- Mevcut siparişlerin operasyon türlerini güncelle (opsiyonel)
UPDATE public.fason_orders 
SET operation_type = 'Sadece Dikim' 
WHERE operation_type IS NULL;
