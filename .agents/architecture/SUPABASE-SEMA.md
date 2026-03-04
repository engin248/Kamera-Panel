# SUPABASE-SEMA.md — ÜRETİM BÖLÜMÜ TAM VERİTABANI ŞEMASI

> Versiyon: 1.0 | Tarih: 2026-03-03
> Durum: TASARIM — Claude kodlayacak
> Bağlantı: RAPOR-ANALIZ.md | MALIYET.md | PERSONEL.md | URETIM.md

---

## MEVCUT DURUM

| Tablo | Şu An | Hedef |
|-------|-------|-------|
| `personnel` | ✅ Supabase | Mevcut |
| `models` | SQLite | Supabase'e taşı |
| `operations` | SQLite | Supabase'e taşı |
| `production_logs` | SQLite | Supabase'e taşı |
| `uretim_giris` | SQLite | Supabase'e taşı |
| `cost_entries` | SQLite | Supabase'e taşı |
| `isletme_giderleri` | SQLite | Supabase'e taşı |
| `business_expenses` | SQLite | Supabase'e taşı |
| `orders` | SQLite | Supabase'e taşı |
| `prim_kayitlari` | YOK | YENİ OLUŞTUR |
| `kar_zarar_ozet` | YOK | YENİ OLUŞTUR |
| `karar_arsivi` | YOK | YENİ OLUŞTUR |

---

## YENİ OLUŞTURULACAK TABLOLAR (Supabase SQL)

### 1. prim_kayitlari (Prim Motoru)

```sql
CREATE TABLE IF NOT EXISTS prim_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personel_id UUID REFERENCES personnel(id) ON DELETE RESTRICT,
  ay INTEGER NOT NULL CHECK (ay BETWEEN 1 AND 12),
  yil INTEGER NOT NULL,

  -- Ham veriler
  toplam_uretilen INTEGER DEFAULT 0,
  toplam_hatali INTEGER DEFAULT 0,
  fpy_yuzde REAL DEFAULT 0,
  oee_skoru REAL DEFAULT 0,

  -- Prim hesabı (Vizyon formülü)
  katki_degeri REAL DEFAULT 0,       -- SUM(adet × birim_deger × (1-hata_orani))
  maas_maliyeti REAL DEFAULT 0,      -- baz_maas + yol + yemek + sgk
  katki_maas_farki REAL DEFAULT 0,   -- katki - maas (pozitif ise prim hak edildi)
  prim_orani REAL DEFAULT 0,         -- % olarak (yönetici belirler)
  prim_tutari REAL DEFAULT 0,        -- katki_maas_farki × prim_orani%

  -- Onay süreci
  onay_durumu TEXT DEFAULT 'hesaplandi'
    CHECK (onay_durumu IN ('hesaplandi','onaylandi','odendi','iptal')),
  onaylayan_id UUID,
  onay_tarihi TIMESTAMPTZ,
  odeme_tarihi DATE,
  notlar TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(personel_id, ay, yil)
);

-- RLS
ALTER TABLE prim_kayitlari ENABLE ROW LEVEL SECURITY;

-- Personel kendi primini okuyabilir
CREATE POLICY "personel_kendi_prim" ON prim_kayitlari
  FOR SELECT USING (
    personel_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM users WHERE role IN ('koordinator','muhasip','ustabasi'))
  );
```

### 2. kar_zarar_ozet (Aylık Muhasebe)

```sql
CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ay INTEGER NOT NULL,
  yil INTEGER NOT NULL,

  -- Gelir
  toplam_gelir REAL DEFAULT 0,      -- Tamamlanan siparişler × fiyat

  -- Giderler
  hammadde_gider REAL DEFAULT 0,    -- cost_entries toplamı
  iscilik_gider REAL DEFAULT 0,     -- Personel maaş + SGK toplamı
  fason_gider REAL DEFAULT 0,       -- Fason siparişleri toplamı (YENİ)
  sabit_gider REAL DEFAULT 0,       -- isletme_giderleri + business_expenses
  prim_gider REAL DEFAULT 0,        -- Ödenen prim toplamı

  -- Hesaplanan değerler
  brut_kar REAL DEFAULT 0,          -- Gelir - tüm giderler
  net_kar REAL DEFAULT 0,           -- Brüt kâr - vergiler
  kar_marji_yuzde REAL DEFAULT 0,   -- Net kâr / Gelir × 100

  -- Performans
  toplam_uretim_adedi INTEGER DEFAULT 0,
  ortalama_fpy REAL DEFAULT 0,
  ortalama_oee REAL DEFAULT 0,

  durum TEXT DEFAULT 'taslak'
    CHECK (durum IN ('taslak','onaylandi','kapandi')),
  onaylayan_id UUID,
  onay_tarihi TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ay, yil)
);
```

### 3. karar_arsivi (Sistem Öğrenme — Vizyon Gerekliliği)

```sql
CREATE TABLE IF NOT EXISTS karar_arsivi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  konu TEXT NOT NULL,               -- "Prim oranı", "Personel ataması" vb.
  bolum TEXT DEFAULT 'uretim',

  -- Sistem önerisi
  sistem_onerisi TEXT,              -- Sistem ne dedi?
  oneri_detay JSONB,                -- Formüller, veriler

  -- Yapılan
  yapilan_karar TEXT,               -- Yönetici ne yaptı?
  yapilan_detay JSONB,

  -- Sonuç
  sonuc TEXT,                       -- Ne oldu?
  sonuc_sayisal REAL,               -- Sayısal sonuç (kâr farkı, verimlilik değişimi vb.)
  sistem_mi_dogru BOOLEAN,          -- Sistem mi haklıydı, insan mı?

  -- Öğrenme
  ogrenim_notu TEXT,                -- Bir sonraki benzer durum için not
  sorumlu_id UUID,                  -- Kararı veren kişi

  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE karar_arsivi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "koordinator_tam" ON karar_arsivi
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'koordinator'));
```

---

## MEVCUT TABLOLARA EKLENMESİ GEREKEN ALANLAR

### operations tablosu (Prim için kritik)

```sql
-- Operasyon standart süresi — prim hesabının temeli
ALTER TABLE operations ADD COLUMN IF NOT EXISTS standart_sure_dk REAL DEFAULT 0;
-- Açıklama: 1 adet için standart üretim süresi (dakika)

ALTER TABLE operations ADD COLUMN IF NOT EXISTS birim_deger REAL DEFAULT 0;
-- Açıklama: 1 adet üretimin TL değeri (prim hesabında kullanılır)
```

### production_logs tablosu

```sql
-- Katkı değeri her kayıtta saklanır (hesaplama hızı için)
ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS katki_degeri_tutari REAL DEFAULT 0;
-- Formül: total_produced × unit_value × (1 - defective_count/total_produced)
```

### personnel tablosu (Supabase — zaten var)

```sql
-- Self-serve portal için gerekli
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS portal_aktif BOOLEAN DEFAULT true;
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS portal_pin TEXT;
-- Personel kendi portal pinine erişir
```

---

## SUPABASE GEÇİŞ PLANI (Öncelik Sırası)

```
AŞAMA 1 — YENİ TABLOLAR (Hemen yap, SQLite ile çakışmaz):
  ✅ prim_kayitlari
  ✅ kar_zarar_ozet
  ✅ karar_arsivi

AŞAMA 2 — MEVCUT TABLOLARA ALAN EKLE:
  ✅ operations.standart_sure_dk
  ✅ operations.birim_deger
  ✅ production_logs.katki_degeri_tutari
  ✅ personnel.portal_aktif / portal_pin

AŞAMA 3 — TABLO GEÇİŞLERİ (Sırayla):
  1. models (bağımlı tablolar sonra)
  2. operations (models bittikten sonra)
  3. production_logs (hem models hem personnel bittikten sonra)
  4. cost_entries (models + orders bittikten sonra)
  5. isletme_giderleri + business_expenses (bağımsız)
  6. orders (models + personnel bittikten sonra)
```

---

## ROW LEVEL SECURITY (RLS) ÖZETI

| Tablo | Kural |
|-------|-------|
| `personnel` | Herkes kendini okur, koordinator hepsini |
| `prim_kayitlari` | Personel kendi satırını okur, muhasip hepsini |
| `kar_zarar_ozet` | koordinator + muhasip + ustabasi |
| `karar_arsivi` | Sadece koordinator değiştirir, yöneticiler okur |
| `production_logs` | ustabasi + operator (kendi kayıtları) |

---

## CLAUDE İÇİN HAZIR KOMUT

```
Görev: Supabase SQL editöründe şu sorguları çalıştır:

1. yeni_tablolar.sql → prim_kayitlari, kar_zarar_ozet, karar_arsivi
2. alan_ekle.sql → operations + production_logs + personnel

Kontrol: Her tablo oluşturuldu mu? RLS aktif mi?
Test: 1 kayıt ekle, 1 kayıt oku, RLS doğrula.
```
