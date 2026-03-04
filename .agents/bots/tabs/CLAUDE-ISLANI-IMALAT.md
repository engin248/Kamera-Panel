# CLAUDE-ISLANI-IMALAT.md

# İMALAT BÖLÜMÜ: CLAUDE İÇİN TAM İŞ PLANI

# Akademik Seviyede — 5 Farklı Bakış Açısı

> **Hazırlayan:** Antigravity
> **Tarih:** 2026-03-03
> **Bölüm:** İmalat (Kesim + Dikim + Ütü/Paket + Nakış + Yıkama)
> **Hedef:** Bu belgeyi okuyan Claude hiçbir soru sormadan uygulayabilmeli.

---

## BÖLÜM TANIMI

İmalat bölümü, hammaddenin (kumaş + aksesuar) bitmiş ürüne dönüştüğü
tüm üretim süreçlerini kapsar. Üretim bölümü (fason dikim takibi) ile
farkı: İmalat, işletmenin kendi içinde gerçekleştirdiği tüm üretim
aşamalarıdır.

İmalat alt süreçleri:

1. **Kesim** — Kumaş kesim planı, sarf hesabı, fire takibi
2. **Dikim** — Makine hattı, operasyon sırası, hız takibi
3. **Kalite Kontrol** — Inline + bant sonu kontrol
4. **Ütü / Paket** — Son hazırlık ve ambalaj
5. **Nakış / Aksesuarlar** — Varsa özel işlemler
6. **Sevkiyat Hazırlık** — Müşteri bazlı paketleme

---

## BAKIŞ AÇISI 1 — TEKNİK MİMARİ

### 1.1 Mevcut Sistemle İlişki

```
MEVCUT TABLOLAR (Supabase):
  models          → İmalat edilecek model
  operations      → Her modelin operasyon listesi
  personnel       → Çalışanlar + maaş
  production_logs → Üretim kaydı (mevcut)
  quality_checks  → Kalite kontrol (mevcut)
  parti_kabul     → Hammadde giriş (mevcut)
  fason_orders    → Dış fason (mevcut)
  cost_entries    → Maliyet (mevcut)
  shipments       → Sevkiyat (mevcut)

YENİ TABLOLAR (imalat için):
  kesim_planlari     → Kesim sipariş planı
  kesim_kayitlari    → Gerçek kesim verisi (fire dahil)
  hat_planlamasi     → Makine hattı ve personel ataması
  imalat_fazlari     → Kesim → Dikim → Ütü fazları
  fire_kayitlari     → Kumaş fire takibi
  yari_mamul_stok    → Yarı mamul ara stok
```

### 1.2 Teknoloji Yığını

| Katman | Teknoloji | Not |
|--------|-----------|-----|
| Frontend | Next.js 16 App Router | `app/app/page.js` yeni case blokları |
| API | `/api/imalat/` rotaları | 8+ endpoint |
| DB (Ana) | Supabase PostgreSQL | Yeni tablolar + mevcut tablolar |
| DB (Geçici) | SQLite (mevcut) | Migrasyon tamamlanana kadar |
| Bot | GPT-4o-mini (Üretim Şefi) | Her alt bölüm için bağlam |
| Ses | Web Speech API | Mevcut hook kullanılır |

### 1.3 Dosya Yapısı (Oluşturulacak)

```
app/
├── api/
│   └── imalat/
│       ├── kesim-plani/route.js       ← Kesim planı CRUD
│       ├── kesim-kayit/route.js       ← Gerçek kesim girişi
│       ├── hat-planlama/route.js      ← Makine hattı yönetimi
│       ├── faz-takip/route.js         ← Kesim→Dikim→Ütü faz durumu
│       ├── fire-kayit/route.js        ← Kumaş fire kaydı
│       ├── yari-mamul/route.js        ← Ara stok yönetimi
│       ├── kalite/route.js            ← Inline kalite kontrol
│       └── ozet-dashboard/route.js   ← İmalat dashboard
└── app/
    └── page.js                        ← 'imalat' case blokları
```

---

## BAKIŞ AÇISI 2 — VERİ AKIŞ MİMARİSİ

### 2.1 İmalat Veri Döngüsü

```
GİRDİ NOKTALARI:
  1. Sipariş (orders) → Hangi model, kaç adet, ne zaman?
  2. Parti Kabul (parti_kabul) → Hammadde geldi mi, eksiksiz mi?
  3. Model (models) → Operasyonlar, beden dağılımı, zorluk

İŞLEM NOKTALAR:
  Kesim Planlama → Kesim Gerçekleşme → Fire Kaydı
       ↓
  Hat Planlama (Makine + Personel ataması)
       ↓
  Dikim Fazı → Operasyon bazlı takip → Inline Kalite
       ↓
  Ütü/Paket Fazı → Bant Sonu Kalite → Yı Mamul Stok
       ↓
  Sevkiyat Hazırlık → Müşteri Paketleme

ÇIKTI NOKTALARI:
  → production_logs (her operasyonun üretim kaydı)
  → quality_checks (kalite bulgular)
  → prim_kayitlari (personel katkı değeri)
  → kar_zarar_ozet (imalat bölümü kâr/zarar)
  → shipments (sevkiyat kaydı)
```

### 2.2 Kesim Planı Veri Yapısı

```sql
CREATE TABLE IF NOT EXISTS kesim_planlari (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  siparis_id BIGINT REFERENCES orders(id),
  plan_tarihi DATE NOT NULL,
  toplam_adet INTEGER NOT NULL,
  beden_dagitimi JSONB DEFAULT '{}',
  -- Örnek: {"S": 50, "M": 100, "L": 80, "XL": 20}
  kat_sayisi INTEGER DEFAULT 1,
  -- Kaç kat üst üste kesim yapılacak
  kumaş_tipi TEXT,
  tahmini_sarj_metre NUMERIC(10,2) DEFAULT 0,
  tahmini_fire_yuzde NUMERIC(5,2) DEFAULT 5,
  durum TEXT DEFAULT 'planlandı'
    CHECK (durum IN ('planlandı','kesimde','tamamlandı','iptal')),
  kesimci_id BIGINT REFERENCES personnel(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kesim_kayitlari (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES kesim_planlari(id),
  gercek_adet INTEGER DEFAULT 0,
  fire_adet INTEGER DEFAULT 0,
  kullanilan_metre NUMERIC(10,2) DEFAULT 0,
  fire_metre NUMERIC(10,2) DEFAULT 0,
  fire_yuzde NUMERIC(5,2) DEFAULT 0,
  -- fire_yuzde = fire_metre / kullanilan_metre * 100
  fire_nedeni TEXT,
  kesim_tarihi TIMESTAMPTZ DEFAULT NOW(),
  kaydeden_id BIGINT REFERENCES personnel(id)
);

CREATE TABLE IF NOT EXISTS hat_planlamasi (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  hat_adi TEXT NOT NULL, -- "Hat 1", "Hat 2"
  personel_listesi JSONB DEFAULT '[]',
  -- [{"personel_id": 1, "operasyon_id": 5, "makine_id": 3}]
  gun_hedefi INTEGER DEFAULT 0,
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS imalat_fazlari (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  siparis_id BIGINT REFERENCES orders(id),
  faz TEXT NOT NULL
    CHECK (faz IN ('kesim','dikim','kalite_inline','utu_paket','sevkiyat')),
  baslangic TIMESTAMPTZ,
  bitis TIMESTAMPTZ,
  tamamlanan_adet INTEGER DEFAULT 0,
  hedef_adet INTEGER DEFAULT 0,
  sorumlu_id BIGINT REFERENCES personnel(id),
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Prim Bağlantısı — İmalat → Rapor & Analiz

```
İmalat verisi → production_logs → prim_kayitlari (mevcut akış)

Yeni bağlantı:
  hat_planlamasi.personel_listesi × operations.unit_price
  × kesim_kayitlari.gercek_adet × (1 - fire_yuzde/100)
  = İmalat Katkı Değeri

Bu değer production_logs.katki_degeri_tutari alanına yazılır.
```

---

## BAKIŞ AÇISI 3 — KULLANICI DENEYİMİ (UX/UI)

### 3.1 İmalat Ana Menüsü

```
İmalat Bölümü (case 'imalat')
  ├── [Aktif Sipariş Seçici] — Hangi siparişin imalatı?
  ├── [Alt Sekme Bar]
  │     İ.1 📐 Kesim Planlama
  │     İ.2 🏭 Hat Yönetimi
  │     İ.3 📊 Faz Takibi (Kanban)
  │     İ.4 🔍 Inline Kalite
  │     İ.5 📦 Ütü & Paket
  │     İ.6 🚛 Sevkiyat Hazırlık
  │     İ.7 📈 İmalat Dashboard
  └── [İçerik Alanı]
```

### 3.2 Sekme İ.1 — Kesim Planlama

```
ÜST BÖLÜM: Aktif sipariş bilgisi
  Model: [M-001 Elbise]  Beden: [S:50 M:100 L:80]  Toplam: 230

FORMLAR:
  Kesim Tarihi: [tarih seçici]
  Kat Sayısı: [sayı input] → otomatik metre hesabı
  Kesimci: [personel seçici]
  Tahmini Sarj: [X] metre × [Y] kat = [Z] toplam metre
  Tahmini Fire: [%5]

[PLANI KAYDET] → kesim_planlari tablosuna kayıt

ALT TABLO: Geçmiş kesim planları + gerçekleşme oranları
```

### 3.3 Sekme İ.3 — Faz Takibi (Kanban Görünümü)

```
KANBAN SÜTUNLARI:
[Kesim]    [Dikim]    [Kalite]   [Ütü/Paket]  [Hazır]
  220 adet   180 adet   160 adet   120 adet    100 adet
  ████░░░    ████████   ████████   ██████       █████
  %95        %78        %70        %52          %43

Her kart:
  Model Kodu | Adet | Hedef | Sorumlu | Başlama
```

### 3.4 Sekme İ.4 — Inline Kalite

```
Kontrol noktası formları:
  [Model] [Operasyon] [Kontrol adedi] [Hatalı adedi]
  [Hata tipi] [📷 Fotoğraf] [Notlar]
  [Kaydet → quality_checks tablosuna]

FPY = (Kontrol - Hata) / Kontrol × 100
Anlık FPY: %[X] → 🟢 >95% / 🟡 90-95% / 🔴 <90%
```

### 3.5 Bot Devreye Girme Noktaları

```
Bot: "Üretim Şefi" (GPT-4o-mini)
1. Kesim planında: "Bu sipariş için önerilen kat sayısı: X"
   (geçmiş fire oranlarına göre)
2. Hat planlamasında: "Hat 1 kapasitesi X, günlük hedefe ulaşmak
   için Y kişi yeterli" (historical data)
3. Faz gecikmesinde: "Dikim fazı %40 geride — sebep analizi: ..."
4. Kalite sorununda: "Bu hata tipi 3. kez görülüyor — kök neden ..."
```

---

## BAKIŞ AÇISI 4 — İŞ MANTIĞI VE VİZYON UYUMU

### 4.1 Fire Yönetimi (Kritik)

```
Fire = Para kaybı = Doğrudan kâr marjını etkiler

Kural 1: Fire %3'ü geçerse → Bot uyarır
Kural 2: Aynı personel 3 kez yüksek fire → Görüşme önerisi
Kural 3: Fire nedeni kayıt zorunlu → Kör nokta elimine edilir
Kural 4: Aylık fire raporu → Muhasebe'ye (kar_zarar_ozet'e eklenir)

Fire Maliyet Hesabı:
  fire_metre × kumaş_birim_fiyatı = Fire Maliyeti (₺)
  Bu maliyet cost_entries tablosuna 'fire' kategorisinde kaydedilir
```

### 4.2 Hat Verimliliği (OEE Bağlantısı)

```
OEE = Kullanılabilirlik × Performans × Kalite

Kullanılabilirlik = Gerçek Çalışma / Planlanan Çalışma
  (machine_down_min değerinden hesaplanır)

Performans = Gerçek Üretim / Teorik Üretim
  (unit_time × adet vs gerçek süre)

Kalite = FPY (First Pass Yield)

OEE Hedef: %85 üzeri → Sağlıklı
OEE <70 → Bot analiz yapar + neden listesi sunar
```

### 4.3 Aksesuar ve Hammadde Bağlantısı

```
Parti Kabul → Hammadde stoka girer
     ↓
Kesim Planı → "Bu model için X metre gerekiyor"
              "Stokta Y metre var" → Yeterliliği kontrol et
     ↓
Kesim Gerçekleşme → Stoktan düş
     ↓
Fire Kaydı → Fire maliyeti cost_entries'e yaz

Eksik aksesuar:
  parti_kabul.aksesuar_not alanı varsa → Bot uyarı verir
```

### 4.4 Vizyon: Adil Prim İmalat'ta Nasıl Çalışır?

```
İmalat personeli için katkı değeri:
  Katkı = SUM(tamamlanan_adet × operations.unit_price × (1 - fire_yuzde))

Katki > Maas ise → Prim hakki

FARK: Üretim bölümüyle fark:
  İmalat'ta fire oranı doğrudan katkı değerini düşürür
  Kaliteli + hızlı çalışan daha fazla prim alır
```

---

## BAKIŞ AÇISI 5 — GÜVENLİK, VERİ BÜTÜNLÜĞÜ VE ÖLÇEKLENME

### 5.1 Yetki Seviyeleri (İmalat Spesifik)

```
koordinator  → Tüm görünüm + plan + onay
ustabasi     → Kendi hattının planı + girişi
kesimci      → Sadece kesim kayıtları
makine_op    → Sadece kendi üretim logları
kalite_kont  → quality_checks + inline kontrol
```

### 5.2 Yarı Mamul Stok Kontrolü

```
Fire kavramı sadece kumaşta değil, süreçte de var:
  Kesim tamamlandı: 220 adet → Dikime geçti: 218 adet (2 kayıp?)
  Bu 2 adet nerede? → yari_mamul_stok takip eder

Kritik kural:
  Giriş adedi = Çıkış adedi + Fire + Stok
  Bu denklem sağlanmazsa → Sistem uyarır (kayıp var)
```

### 5.3 Supabase Gerçek Zamanlı Güncellemeler

```javascript
// Faz takibi real-time için:
const subscription = supabase
  .channel('imalat-fazlar')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'imalat_fazlari' },
    payload => { setFazlar(prev => updateFaz(prev, payload)); }
  )
  .subscribe();

// Kullanım: Hat yöneticisi veri girince Kanban otomatik güncellenir
```

---

## CLAUDE UYGULAMA SIRASI

### AŞAMA 0 — Ön Koşullar (Üretim Bölümü Tamamlanmış Olmalı)

```
✓ prim_kayitlari tablosu var
✓ kar_zarar_ozet tablosu var
✓ production_logs.katki_degeri_tutari alanı var
✓ Rapor & Analiz penceresi (P5) çalışıyor
```

### AŞAMA 1 — Veritabanı (Supabase SQL editörüne yapıştır)

```sql
-- 1a. Kesim Planları
CREATE TABLE IF NOT EXISTS kesim_planlari (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  siparis_id BIGINT REFERENCES orders(id),
  plan_tarihi DATE NOT NULL,
  toplam_adet INTEGER NOT NULL,
  beden_dagitimi JSONB DEFAULT '{}',
  kat_sayisi INTEGER DEFAULT 1,
  tahmini_sarj_metre NUMERIC(10,2) DEFAULT 0,
  tahmini_fire_yuzde NUMERIC(5,2) DEFAULT 5,
  durum TEXT DEFAULT 'planlandı'
    CHECK (durum IN ('planlandı','kesimde','tamamlandı','iptal')),
  kesimci_id BIGINT REFERENCES personnel(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Kesim Kayıtları (gerçek)
CREATE TABLE IF NOT EXISTS kesim_kayitlari (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES kesim_planlari(id),
  gercek_adet INTEGER DEFAULT 0,
  fire_adet INTEGER DEFAULT 0,
  kullanilan_metre NUMERIC(10,2) DEFAULT 0,
  fire_metre NUMERIC(10,2) DEFAULT 0,
  fire_yuzde NUMERIC(5,2) DEFAULT 0,
  fire_nedeni TEXT,
  kesim_tarihi TIMESTAMPTZ DEFAULT NOW(),
  kaydeden_id BIGINT REFERENCES personnel(id)
);

-- 1c. Hat Planlaması
CREATE TABLE IF NOT EXISTS hat_planlamasi (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  hat_adi TEXT NOT NULL,
  personel_listesi JSONB DEFAULT '[]',
  gun_hedefi INTEGER DEFAULT 0,
  aktif BOOLEAN DEFAULT TRUE,
  baslangic_tarihi DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. İmalat Fazları
CREATE TABLE IF NOT EXISTS imalat_fazlari (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  siparis_id BIGINT REFERENCES orders(id),
  faz TEXT NOT NULL
    CHECK (faz IN ('kesim','dikim','kalite_inline','utu_paket','sevkiyat')),
  baslangic TIMESTAMPTZ,
  bitis TIMESTAMPTZ,
  tamamlanan_adet INTEGER DEFAULT 0,
  hedef_adet INTEGER DEFAULT 0,
  sorumlu_id BIGINT REFERENCES personnel(id),
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1e. Yarı Mamul Stok
CREATE TABLE IF NOT EXISTS yari_mamul_stok (
  id BIGSERIAL PRIMARY KEY,
  model_id BIGINT REFERENCES models(id),
  siparis_id BIGINT REFERENCES orders(id),
  faz_kaynak TEXT NOT NULL,  -- nereden geldi (kesim, dikim)
  faz_hedef TEXT NOT NULL,   -- nereye gidecek
  adet INTEGER DEFAULT 0,
  tarih TIMESTAMPTZ DEFAULT NOW(),
  kaydeden_id BIGINT REFERENCES personnel(id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_kesim_model ON kesim_planlari(model_id);
CREATE INDEX IF NOT EXISTS idx_faz_model ON imalat_fazlari(model_id, faz);
```

### AŞAMA 2 — API Rotaları (8 endpoint)

| Dosya | Metot | İşlev |
|-------|-------|-------|
| `imalat/kesim-plani/route.js` | GET+POST | Kesim planı listele/oluştur |
| `imalat/kesim-kayit/route.js` | POST | Gerçek kesim verisi gir |
| `imalat/hat-planlama/route.js` | GET+POST | Hat yönetimi |
| `imalat/faz-takip/route.js` | GET+PUT | Faz durumu güncelle |
| `imalat/fire-kayit/route.js` | POST | Fire kaydı + cost_entries'e yaz |
| `imalat/yari-mamul/route.js` | GET+POST | Stok takibi |
| `imalat/kalite/route.js` | POST | Inline kalite kontrol |
| `imalat/ozet-dashboard/route.js` | GET | İmalat dashboard verileri |

### AŞAMA 3 — UI (page.js)

```javascript
case 'imalat':
  return <ImalatBolumu />;

// Alt sekmeler:
// İ.1 KesimPlanlama → /api/imalat/kesim-plani
// İ.2 HatYonetimi → /api/imalat/hat-planlama
// İ.3 FazTakibi (Kanban) → /api/imalat/faz-takip + Supabase Realtime
// İ.4 InlineKalite → /api/imalat/kalite
// İ.5 UtuPaket → production_logs (mevcut) + yeni faz
// İ.6 SevkiyatHazirlik → shipments tablosu
// İ.7 Dashboard → /api/imalat/ozet-dashboard
```

### AŞAMA 4 — Bot Entegrasyonu

```javascript
case 'imalat':
  systemPrompt = `Sen "47 Sil Baştan 01" fabrikasının ÜRETİM ŞEFİ botusun.
  Alanın: Kesim planı, hat verimliliği, fire analizi, faz takibi.
  Veri: [aktif sipariş + faz durumları JSON olarak verilir]
  Kural: Fire >%3 ise mutlaka uyar. OEE <70 ise neden analizi yap.
  Prim: Personel katkı değerini fire oranını hesaba katarak belirle.`;
  break;
```

### AŞAMA 5 — Test Kriterleri

```
TEST 1: Kesim planı oluştur → kayıt Supabase'de görünüyor mu?
TEST 2: Gerçek kesim verisi gir → fire yüzdesi otomatik hesaplanıyor mu?
TEST 3: Faz takibi güncelle → Kanban'da anlık değişiyor mu?
TEST 4: Inline kalite kaydı → quality_checks tablosuna gidiyor mu?
TEST 5: Fire kaydı → cost_entries'de 'fire' kategorisinde görünüyor mu?
TEST 6: İmalat dashboard → OEE, FPY, fire oranı doğru mu?
TEST 7: Prim bağlantısı → İmalat verisi prim_kayitlari'na yansıyor mu?
```

---

## HIZLI BAŞLANGIÇ KOMUTU (Claude için)

```
GÖREV: İmalat Bölümü uygula

ÖN KOŞUL: Üretim bölümü (P1-P5) tamamlanmış olmalı.

1. Supabase: 5 yeni tablo oluştur (AŞAMA 1 SQL'leri)

2. API: app/api/imalat/ altında 8 endpoint oluştur

3. UI: page.js'e 'imalat' case + 7 alt sekme
   En kritik: Faz Takibi (Kanban) + Supabase Realtime subscription

4. Bot: Üretim Şefi promptu + kesim/fire bağlamı

5. Test: 7 test maddesi — hepsinden yeşil alana kadar devam et

Referans dosyalar:
  - Bu belge (tüm spesifikasyon)
  - CLAUDE-ISLANI-RAPOR-ANALIZ.md (prim motoru — aynı mantık)
  - supabase-schema.sql (mevcut BIGSERIAL/BIGINT pattern)
```
