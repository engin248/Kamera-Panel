-- İMALAT (MANUFACTURING) MALİYET ODAKLI RÖNTGEN GÜNCELLEMELERİ
-- Engin Bey'in Analizi doğrultusunda İmalat Ekranlarındaki eksik Kumaş/Maliyet kolonları ekleniyor.

-- 1. KESİMHANE (Pastal) Güncellemeleri
ALTER TABLE kesim_planlari ADD COLUMN IF NOT EXISTS used_fabric_qty NUMERIC(10,2); -- Planlanan kumaş sarfiyatı (KG veya Metre)
ALTER TABLE kesim_planlari ADD COLUMN IF NOT EXISTS actual_fabric_qty NUMERIC(10,2); -- Gerçekte ustanın kullandığı kumaş
ALTER TABLE kesim_planlari ADD COLUMN IF NOT EXISTS fabric_waste_qty NUMERIC(10,2); -- Hesaplanan Kırpıntı/Fire KG

-- 2. FAZ SÜRE (Darboğaz/Bottleneck) Takibi
ALTER TABLE urun_fazlari ADD COLUMN IF NOT EXISTS phase_start_time TIMESTAMP WITH TIME ZONE; -- Bu faza (örn: Dikim) ne zaman girdi?
ALTER TABLE urun_fazlari ADD COLUMN IF NOT EXISTS phase_end_time TIMESTAMP WITH TIME ZONE;   -- Bu fazdan ne zaman çıktı? (Fark = Darboğaz maliyeti)

-- 3. FİRE ve SAFHA MALİYETİ Kayıtları
ALTER TABLE fire_kayitlari ADD COLUMN IF NOT EXISTS wasted_at_phase VARCHAR(50); -- Kesimde mi çöpe gitti, Ütüde mi? (Maliyeti çarpmak için)
ALTER TABLE fire_kayitlari ADD COLUMN IF NOT EXISTS estimated_loss_amount NUMERIC(10,2); -- Çöpe giden safhaya göre hesaplanmış TL zararı

-- 4. YARI MAMUL / FASON TAKİBİ
ALTER TABLE fason_takip ADD COLUMN IF NOT EXISTS sent_quantity INTEGER; -- Baskıya/Nakışa giden
ALTER TABLE fason_takip ADD COLUMN IF NOT EXISTS received_quantity INTEGER; -- Sağlam dönen
ALTER TABLE fason_takip ADD COLUMN IF NOT EXISTS spoiled_quantity INTEGER; -- Fasoncunun/Nakışçının bozduğu mal sayısı (Direkt Zarar)
