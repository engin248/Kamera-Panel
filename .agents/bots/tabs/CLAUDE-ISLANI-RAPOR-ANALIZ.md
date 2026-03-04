# CLAUDE-ISLANI-RAPOR-ANALIZ.md

# PENCERE 5 — RAPOR & ANALİZ: CLAUDE İÇİN TAM İŞ PLANI

> **Hazırlayan:** Antigravity
> **Tarih:** 2026-03-03
> **Hedef:** Bu belgeyi okuyan Claude hiçbir soru sormadan tamamen uygulayabilmeli.
> **Bağlı dosyalar:** RAPOR-ANALIZ.md | SUPABASE-SEMA.md | MALIYET.md | URETIM.md

---

## ÖZET

Üretim bölümünün 4 penceresi (Modeller, Personel, Üretim Aşaması, Maliyet)
veri üretir. Bu pencere (Pencere 5 — Rapor & Analiz) bu veriyi tüketir,
hesaplar, raporlar ve karar onayı alır.

Temel çıktılar:

1. Aylık OEE/FPY verimlilik raporu
2. Personel Katkı Değeri vs Maaş karşılaştırması
3. Prim hesabı ve onay mekanizması
4. Model bazlı kârlılık analizi
5. Karar karşılaştırma arşivi (sistem vs insan)

---

## BAKIŞ AÇISI 1 — TEKNİK MİMARİ

### 1.1 Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| Frontend | Next.js 16 App Router | `app/app/page.js` içine yeni case bloğu |
| API Layer | Next.js Route Handlers | `app/api/rapor/` altında yeni rotalar |
| Veritabanı | Supabase PostgreSQL | 3 yeni tablo + mevcut tablolardan okuma |
| AI Bot | GPT-4o-mini (Muhasip) | Analiz + karar önerisi |
| Ses | Web Speech API (mevcut hook) | Onay komutları için |
| Stil | Mevcut CSS variables | `var(--accent)`, `var(--danger)` vb. |

### 1.2 Dosya Yapısı (Oluşturulacak)

```
app/
├── api/
│   └── rapor/
│       ├── ay-ozet/route.js          ← Ay özet dashboard
│       ├── personel-verimlilik/route.js ← Katkı+Maaş+Prim
│       ├── model-karlilik/route.js   ← Model bazlı kâr
│       ├── prim-onay/route.js        ← Onay + ödendi
│       └── karar-arsivi/route.js     ← Sistem öğrenme
├── app/
│   └── page.js                       ← 'rapor' case bloğu eklenir
```

### 1.3 Bağımlılıklar (Önce Bunlar Hazır Olmalı)

```
GEREKLI:
✓ Supabase bağlantısı (mevcut — .env.local'de SUPABASE_URL var)
✓ personnel tablosu Supabase'de (mevcut)
✓ production_logs SQLite'de (mevcut)
✓ cost_entries SQLite'de (mevcut)
✓ operations SQLite'de (mevcut)

OLUŞTURULACAK (önce bunlar):
☐ prim_kayitlari (Supabase)
☐ kar_zarar_ozet (Supabase)
☐ karar_arsivi (Supabase)
☐ operations.standart_sure_dk alanı
☐ operations.birim_deger alanı
```

---

## BAKIŞ AÇISI 2 — VERİ AKIŞ MİMARİSİ

### 2.1 Ham Veri Kaynakları ve Dönüşüm

```
KAYNAK 1: production_logs (SQLite)
  Alan: total_produced, defective_count, unit_value, personnel_id, model_id, date
  Dönüşüm:
    fpy = (total_produced - defective_count) / total_produced × 100
    katki_tutari = total_produced × unit_value × (1 - defective_count/total_produced)
    Grupla: personnel_id + ay + yil

KAYNAK 2: personnel (Supabase)
  Alan: id, salary, benefits_total (yol+yemek), created_at
  Dönüşüm:
    sgk_prim = salary × 0.225
    maas_maliyeti = salary + benefits_total + sgk_prim

KAYNAK 3: operations (SQLite)
  Alan: id, model_id, birim_deger (YENI)
  Dönüşüm: unit_value üretim loguna yazılırken buradan alınır

KAYNAK 4: cost_entries + isletme_giderleri + business_expenses (SQLite)
  Dönüşüm: toplamlar aylık gider hesabına gider

KAYNAK 5: orders (SQLite)
  Alan: model_id, quantity, unit_price, status='tamamlandi'
  Dönüşüm: Toplam gelir = SUM(quantity × unit_price) WHERE status='tamamlandi'
```

### 2.2 Hesaplama Zinciri (Sıralı)

```
ADIM 1: production_logs'u ay/yıl + personel bazlı topla
  → Her personel için: toplam_adet, toplam_hatali, toplam_katki

ADIM 2: personnel'den maas_maliyeti hesapla
  → Her personel için aylık gerçek maliyet

ADIM 3: katki - maas_maliyeti = fark
  → fark > 0 ise prim_tutari = fark × prim_orani%

ADIM 4: cost_entries + giderler topla
  → aylık toplam gider

ADIM 5: orders toplam gelir hesapla
  → aylık gelir

ADIM 6: net_kar = gelir - hammadde - iscilik - sabit - fason

ADIM 7: net_kar > 0 kontrolü → Prim ödeme onayı aktif
```

### 2.3 Hibrit DB Sorgu Stratejisi

SQLite ve Supabase aynı anda kullanılıyor. Şu strateji:

```javascript
// app/api/rapor/personel-verimlilik/route.js
import db from '@/lib/db'; // SQLite
import { createClient } from '@supabase/supabase-js'; // Supabase

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ay = searchParams.get('ay');
  const yil = searchParams.get('yil');

  // 1. SQLite'den üretim verisini çek
  const uretimler = db.prepare(`
    SELECT personnel_id,
           SUM(total_produced) AS toplam_adet,
           SUM(defective_count) AS toplam_hatali,
           SUM(total_produced * unit_value *
               (1.0 - CAST(defective_count AS REAL) / NULLIF(total_produced, 0))) AS katki_degeri
    FROM production_logs
    WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
      AND deleted_at IS NULL
    GROUP BY personnel_id
  `).all(ay.padStart(2,'0'), yil);

  // 2. Supabase'den personel maaş bilgisini çek
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
  const { data: personeller } = await supabase
    .from('personnel')
    .select('id, name, salary, benefits_total')
    .eq('status', 'active');

  // 3. Birleştir ve hesapla
  const sonuclar = uretimler.map(u => {
    const personel = personeller.find(p => p.id === u.personnel_id);
    if (!personel) return null;
    const sgk = personel.salary * 0.225;
    const maas_maliyeti = personel.salary + (personel.benefits_total || 0) + sgk;
    const fark = u.katki_degeri - maas_maliyeti;
    return {
      personnel_id: u.personnel_id,
      ad: personel.name,
      toplam_adet: u.toplam_adet,
      fpy: ((u.toplam_adet - u.toplam_hatali) / u.toplam_adet * 100).toFixed(1),
      katki_degeri: u.katki_degeri.toFixed(2),
      maas_maliyeti: maas_maliyeti.toFixed(2),
      fark: fark.toFixed(2),
      prim_hakediyor: fark > 0
    };
  }).filter(Boolean);

  return Response.json({ sonuclar });
}
```

---

## BAKIŞ AÇISI 3 — KULLANICI DENEYİMİ (UX/UI)

### 3.1 Sekme Yapısı (page.js içinde)

Mevcut yapıya ekleme: `case 'rapor':` bloğu

```
RaporAnaliz bileşeni
  ├── [Ay/Yıl Seçici] → tüm alt sekmeler güncellenir
  ├── [Alt Sekme Bar]
  │     5.1 📈 Dashboard
  │     5.2 👥 Personel
  │     5.3 👗 Model
  │     5.4 💰 Prim Onay
  │     5.5 📋 Muhasebe → (Ayrı pencere, bu plandan hariç)
  │     5.6 🔍 Karar Arşivi
  └── [İçerik Alanı]
```

### 3.2 Sekme 5.1 — Dashboard Tasarımı

```jsx
// 3 satır × 3 kart = 9 KPI kartı
// Kart yapısı: ikon + başlık + değer + trend(↑↓) + renk
[Toplam Üretim]    [Hedef %si]      [Net Kâr]
[OEE Ortalaması]   [FPY Ortalaması] [Kâr Marjı%]
[En İyi Personel]  [Prim Havuzu]    [Karar Sayısı]
```

Her karta tıklayınca → Modal açılır → Detay gösterilir

### 3.3 Sekme 5.2 — Personel Verimlilik Tablosu

```
Sütunlar: Ad | Adet | Hata% | FPY | Katki(₺) | Maaş(₺) | Fark | Prim?
Renk: yeşil(+250 üzeri) / sarı(0-250) / kırmızı(negatif)
Self-serve: Personel girişi yaptıysa sadece kendi satırı
Sort: Katkı Değerine göre (en yüksek önce)
```

### 3.4 Sekme 5.4 — Prim Onay

```
Her personel için:
  [İsim] [Katkı: ₺X] [Maaş: ₺Y] [Prim: ₺Z]
  [📋 Formülü Göster] ↓ accordion
    Formül: (₺X - ₺Y) × %P = ₺Z
  [✅ Onayla] [❌ İptal]

Alt: [TÜM ONAYLANANLAR İÇİN ONAYLA] buton
```

### 3.5 Sekme 5.6 — Karar Arşivi

```
Filtreler: Tarih | Konu | Bölüm | Sistem mi haklıydı?
Yeni Kayıt →
  Konu: [input]
  Sistem Önerisi: [textarea]
  Yapılan: [textarea]
  Sonuç: [textarea]
  Sistem Haklıydı mı: [Evet/Hayır/Belirsiz]
  Öğrenim Notu: [textarea]
  [Kaydet → POST /api/rapor/karar-arsivi]
```

---

## BAKIŞ AÇISI 4 — İŞ MANTIĞI VE VİZYON UYUMU

### 4.1 Prim Motoru Kuralları

```
KURAL 1 — İşletme Önce Yaşar:
  net_kar <= 0 ise → prim ödemesi ASKIYA ALINIR
  Ekrana: "Bu ay net kâr oluşmadı. Prim ödemesi ertelendi."

KURAL 2 — Hak Geri Alınamaz:
  Prim hesaplandıktan sonra onaylanırsa → geri alınamaz
  Sadece "ödendi" işareti değişebilir

KURAL 3 — Şeffaflık Zorunlu:
  Personel her zaman formülü görebilir
  "Bu ay neden prim yok?" sorusuna sistem yanıt verir

KURAL 4 — Katki Değeri Doğru Veri Gerektirir:
  unit_value = 0 ise → Üretim verisi primes dahil edilmez
  Bot uyarır: "X kişinin unit_value verisi eksik"
```

### 4.2 Bot (Muhasip) Devreye Girdiği Anlar

```
1. Ay başında: "Geçen aya göre karşılaştırma raporu"
2. Prim hesaplandığında: "Bu hesap tutarlı mı? Anomali var mı?"
3. Net zarar durumunda: "Neden zarar? En olası 3 neden"
4. Karar karşılaştırması eklendiğinde: "Sistem mi doğruydu, insan mı?"
```

### 4.3 Karar Karşılaştırma Öğrenme Döngüsü

```
Her karar kaydı:
  sistem_onerisi = Bot'un o an için önerdiği şey
  yapilan_karar = Yöneticinin yaptığı
  sonuc_sayisal = Kâr farkı, verimlilik değişimi

Aylık raporda:
  "Sistemi dinlediğimizde: ort %X daha iyi sonuç"
  "İnsan kararı daha iyiydi: Y/Z durumda"
```

---

## BAKIŞ AÇISI 5 — GÜVENLİK VE VERİ BÜTÜNLÜĞÜ

### 5.1 Yetki Kontrolleri

```javascript
// Her API route başında:
const yetkiKontrol = (role, izinliRoller) => {
  if (!izinliRoller.includes(role)) {
    return Response.json({ error: 'Yetkisiz erişim' }, { status: 403 });
  }
};

// Personel verimlilik:
// koordinator → hepsini görür
// muhasip → hepsini görür
// ustabasi → sadece kendi ekibini
// personel → sadece kendini (personnel_id === auth.uid())
```

### 5.2 Veri Tutarlılığı

```
Her hesap loglanır:
  hesaplayan: req.user.id
  hesaplama_tarihi: now()
  parametreler: { ay, yil, prim_orani }

Hesap değişirse → Yeni kayıt, eski silinmez (audit trail)
```

### 5.3 Prim Onay Güvenlik Akışı

```
1. Hesapla → prim_kayitlari.durum = 'hesaplandi'
2. Koordinatör onaylar → durum = 'onaylandi'
   (Başka kimse bu adımı yapamaz — RLS kontrolü)
3. Ödeme yapılır → durum = 'odendi' + odeme_tarihi
4. Personel görür → self-serve portalda 'onaylandi' kartı
```

---

## CLAUDE UYGULAMA SIRASI

### AŞAMA 1 — Veritabanı Hazırlık (ÖNCE YAP)

```sql
-- Supabase SQL editöründe çalıştır:

-- 1a. prim_kayitlari
CREATE TABLE IF NOT EXISTS prim_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personel_id UUID NOT NULL,
  ay INTEGER NOT NULL CHECK (ay BETWEEN 1 AND 12),
  yil INTEGER NOT NULL,
  toplam_uretilen INTEGER DEFAULT 0,
  toplam_hatali INTEGER DEFAULT 0,
  fpy_yuzde REAL DEFAULT 0,
  katki_degeri REAL DEFAULT 0,
  maas_maliyeti REAL DEFAULT 0,
  katki_maas_farki REAL DEFAULT 0,
  prim_orani REAL DEFAULT 0,
  prim_tutari REAL DEFAULT 0,
  onay_durumu TEXT DEFAULT 'hesaplandi'
    CHECK (onay_durumu IN ('hesaplandi','onaylandi','odendi','iptal')),
  onaylayan_id UUID,
  onay_tarihi TIMESTAMPTZ,
  odeme_tarihi DATE,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(personel_id, ay, yil)
);

-- 1b. kar_zarar_ozet
CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ay INTEGER NOT NULL, yil INTEGER NOT NULL,
  toplam_gelir REAL DEFAULT 0,
  hammadde_gider REAL DEFAULT 0,
  iscilik_gider REAL DEFAULT 0,
  fason_gider REAL DEFAULT 0,
  sabit_gider REAL DEFAULT 0,
  prim_gider REAL DEFAULT 0,
  brut_kar REAL DEFAULT 0,
  net_kar REAL DEFAULT 0,
  kar_marji_yuzde REAL DEFAULT 0,
  toplam_uretim_adedi INTEGER DEFAULT 0,
  ortalama_fpy REAL DEFAULT 0,
  ortalama_oee REAL DEFAULT 0,
  durum TEXT DEFAULT 'taslak',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ay, yil)
);

-- 1c. karar_arsivi
CREATE TABLE IF NOT EXISTS karar_arsivi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarih DATE DEFAULT CURRENT_DATE,
  konu TEXT NOT NULL,
  bolum TEXT DEFAULT 'uretim',
  sistem_onerisi TEXT,
  yapilan_karar TEXT,
  sonuc TEXT,
  sonuc_sayisal REAL,
  sistem_mi_dogru BOOLEAN,
  ogrenim_notu TEXT,
  sorumlu_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

```javascript
// SQLite'de (db.js alterStatements'a ekle):
ALTER TABLE operations ADD COLUMN IF NOT EXISTS standart_sure_dk REAL DEFAULT 0;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS birim_deger REAL DEFAULT 0;
ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS katki_degeri_tutari REAL DEFAULT 0;
```

### AŞAMA 2 — API Rotaları

**Dosya 1: `app/api/rapor/personel-verimlilik/route.js`**

- GET → ay, yil parametresi
- SQLite'den üretim toplamı
- Supabase'den personel maaşı
- Hesapla ve döndür

**Dosya 2: `app/api/rapor/ay-ozet/route.js`**

- GET → ay, yil
- 9 KPI kartı için tek yanıt
- Dahili: personel-verimlilik + model kârlılık + gider toplamı

**Dosya 3: `app/api/rapor/prim-onay/route.js`**

- GET → Onay bekleyen primler listesi
- POST → { personel_id, ay, yil, onay: true/false }
- PUT → { id, durum: 'odendi', odeme_tarihi }

**Dosya 4: `app/api/rapor/model-karlilik/route.js`**

- GET → ay, yil
- orders JOIN cost_entries GROUP BY model_id

**Dosya 5: `app/api/rapor/karar-arsivi/route.js`**

- GET → liste (son 50 kayıt)
- POST → yeni kayıt ekle

### AŞAMA 3 — UI (page.js)

1. `case 'rapor':` bloğu ekle
2. `RaporAnaliz` fonksiyonunu oluştur
3. Alt sekme state: `const [raporSekme, setRaporSekme] = useState('dashboard')`
4. Her alt sekme için bileşen fonksiyonu:

```
Dashboard5_1()     → /api/rapor/ay-ozet
PersonelRapor5_2() → /api/rapor/personel-verimlilik
ModelKarlilik5_3() → /api/rapor/model-karlilik
PrimOnay5_4()      → /api/rapor/prim-onay
KararArsivi5_6()   → /api/rapor/karar-arsivi
```

### AŞAMA 4 — Bot Entegrasyonu

```javascript
// Bot: Muhasip (GPT-4o-mini)
// page.js'de mevcut bot yapısına ekle:

case 'rapor':
  systemPrompt = `Sen fabrika muhasip ve analiz botusun...
    [RAPOR-ANALIZ.md'deki sistem promptunu buraya koy]`;
  context = JSON.stringify(rapor_verileri); // Mevcut ay özeti
  break;
```

### AŞAMA 5 — Test Kriterleri

```
TEST 1: Personel verimlilik hesabı doğru mu?
  → Bir personeli manuel hesapla, API ile karşılaştır

TEST 2: Prim motoru doğru mu?
  → net_kar = 0 durumunda prim butonu pasif mi?

TEST 3: Yetki kontrolü
  → Personel token ile başka personelin primini görebiliyor mu? (HAYlR olmalı)

TEST 4: Karar arşivi kaydı ve okunması

TEST 5: Dashboard 9 kart doğru veriyi gösteriyor mu?
```

---

## HIZLI BAŞLANGIC KOMUTİ (Claude için)

```
GÖREV: Pencere 5 — Rapor & Analiz uygula

1. Önce veritabanı:
   - Supabase'de 3 tablo: prim_kayitlari, kar_zarar_ozet, karar_arsivi
   - SQLite'de operations tablosuna 2 alan ekle

2. Sonra API:
   - /api/rapor/personel-verimlilik GET endpoint
   - /api/rapor/ay-ozet GET endpoint
   - /api/rapor/prim-onay GET + POST + PUT

3. Son UI:
   - page.js'e 'rapor' case bloğu
   - Dashboard (9 KPI kart)
   - Personel verimlilik tablosu (self-serve dahil)
   - Prim onay ekranı (sadece koordinatör onaylayabilir)

Bu dosyadan kopyalama yap:
  - Bot promptu: RAPOR-ANALIZ.md satır 23-38
  - Supabase SQL: Bu belge, Aşama 1
  - Formüller: Bu belge, Bakış Açısı 2.2
```
