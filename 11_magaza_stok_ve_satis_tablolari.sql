-- ==============================================================================
-- DOSYA: 11_magaza_stok_ve_satis_tablolari.sql
-- AMAÇ: Mağaza (Toptan ve Perakende Satış) Bölümü İçin Veritabanı ve Hafıza Altyapısı
-- ÖZELLİKLER: Müşteri Sicili, Dinamik Stok (Yaşlanan Stok takibi), Satış Hızı, Lojistik Kalkanı
-- ==============================================================================

-- 1. MAĞAZA MÜŞTERİLERİ (B2B Toptan ve Özel B2C Perakende)
CREATE TABLE IF NOT EXISTS public.magaza_musteriler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firma_adi TEXT NOT NULL,
    ilgili_kisi TEXT,
    telefon TEXT,
    musteri_tipi TEXT CHECK (musteri_tipi IN ('Toptan (B2B)', 'Perakende (B2C)')), -- B2B mi B2C mi?
    guven_skoru INTEGER DEFAULT 10, -- 1 ile 10 arasında bir değer (Satış Şefi Ajanı yönetir)
    favori_kargo_firmasi TEXT, -- Nakliye/Ambar tercihi (Empatik Lojistik)
    toplam_ciro DECIMAL(15,2) DEFAULT 0,
    acik_hesap_limiti DECIMAL(15,2) DEFAULT 0, -- Vadeli mal alma limiti
    notlar TEXT,
    
    -- Ajanın bu müşteri hakkındaki empatik / kalıcı hissiyat hafızası
    vektor_kisisel_profil vector(1536), 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. MAĞAZA DİNAMİK STOK (Product Lifecycle ve Yaşlanan Stok - Aging Inventory)
CREATE TABLE IF NOT EXISTS public.magaza_stok (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL, -- İmalattaki model ID'sine referans
    batch_no TEXT, -- Hangi partide üretildi (Traceability)
    barkod_sku TEXT UNIQUE NOT NULL,
    renk TEXT,
    beden TEXT,
    giris_miktari INTEGER NOT NULL,
    kalan_miktar INTEGER NOT NULL,
    giris_tarihi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()), -- Kronometre burada başlar (Yaşlanan Stok)
    raf_omru_uyarisi BOOLEAN DEFAULT FALSE -- Veri Analisti Ajanı 60 günü geçerse bunu TRUE yapar
);

-- 3. MAĞAZA SATIŞLAR (Sell-Through Rate ve İskonto Kalkanı)
CREATE TABLE IF NOT EXISTS public.magaza_satislar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id UUID REFERENCES public.magaza_musteriler(id),
    stok_id UUID REFERENCES public.magaza_stok(id),
    satis_miktari INTEGER NOT NULL,
    birim_fiyat DECIMAL(10,2) NOT NULL,
    uygulanan_iskonto DECIMAL(5,2) DEFAULT 0, -- % kaç indirim yapıldı?
    satis_tarihi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    odeme_tipi TEXT CHECK (odeme_tipi IN ('Peşin', 'Kredi Kartı', 'Vadeli / Çek')),
    kargo_durumu TEXT DEFAULT 'Bekliyor',
    
    -- Satış Şefi Ajanı tarafından düşülen karar/onay notu (Örn: "Müşteri sağlam, iskonto onaylandı")
    ajan_onay_notu TEXT,
    
    -- Bu satış senaryosunu (satış hızı vs.) vector olarak kaydetmek için
    satis_hafiza_vektoru vector(1536)
);

-- RLS (Row Level Security) Etkinleştirmesi
ALTER TABLE public.magaza_musteriler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magaza_stok ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magaza_satislar ENABLE ROW LEVEL SECURITY;

-- Varsayılan RLS Politikaları (Anonim okuma/yazma şimdilik açık)
CREATE POLICY "magaza_musteriler_anon_select" ON public.magaza_musteriler FOR SELECT USING (true);
CREATE POLICY "magaza_musteriler_anon_insert" ON public.magaza_musteriler FOR INSERT WITH CHECK (true);
CREATE POLICY "magaza_musteriler_anon_update" ON public.magaza_musteriler FOR UPDATE USING (true);
CREATE POLICY "magaza_musteriler_anon_delete" ON public.magaza_musteriler FOR DELETE USING (true);

CREATE POLICY "magaza_stok_anon_select" ON public.magaza_stok FOR SELECT USING (true);
CREATE POLICY "magaza_stok_anon_insert" ON public.magaza_stok FOR INSERT WITH CHECK (true);
CREATE POLICY "magaza_stok_anon_update" ON public.magaza_stok FOR UPDATE USING (true);
CREATE POLICY "magaza_stok_anon_delete" ON public.magaza_stok FOR DELETE USING (true);

CREATE POLICY "magaza_satislar_anon_select" ON public.magaza_satislar FOR SELECT USING (true);
CREATE POLICY "magaza_satislar_anon_insert" ON public.magaza_satislar FOR INSERT WITH CHECK (true);
CREATE POLICY "magaza_satislar_anon_update" ON public.magaza_satislar FOR UPDATE USING (true);
CREATE POLICY "magaza_satislar_anon_delete" ON public.magaza_satislar FOR DELETE USING (true);
