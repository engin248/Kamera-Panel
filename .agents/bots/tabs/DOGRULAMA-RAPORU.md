# DOGRULAMA-RAPORU.md — ANALİZ VE HATA TESPİTİ

> Tarih: 2026-03-03 | Hazırlayan: Antigravity
> Amaç: İş planlarındaki tutarsızlıkları bul, düzelt, Claude'a doğru yol göster.

---

## ✅ DOĞRU OLAN NOKTALAR

1. Veri akış mimarisi (P1→P2→P3→P4→P5) tutarlı
2. Prim formülü (Katkı > Maaş = Prim) vizyon dokümanıyla uyumlu
3. Hibrit DB (SQLite + Supabase) sorgu stratejisi doğru pattern
4. RLS politikaları vizyon yetki tablosuyla uyumlu
5. 5 aşama sırası (DB → API → UI → Bot → Test) doğru

---

## ⚠️ TESPİT EDİLEN 3 KRİTİK HATA/ÇAKIŞMA

### HATA 1: birim_deger vs unit_price ÇAKIŞMASI ⛔

**Sorun:**
CLAUDE-ISLANI-RAPOR-ANALIZ.md'de `operations.birim_deger` adında YENİ alan
önerildi. Ancak PRIM-URET.md'de görüldü ki `operations.unit_price` ZATEN
MEVCUT ve aynı işlevi görüyor.

**Yanlış olan:**

```sql
-- BU SATIR YANLIŞ — GEREKSIZ, ÇAKIŞIYOR:
ALTER TABLE operations ADD COLUMN IF NOT EXISTS birim_deger REAL DEFAULT 0;
```

**Doğrusu:**
`unit_price` kullan, `birim_deger` ekleme. Üretim kodunda zaten
`unit_value` alanı `unit_price`'tan doldurulabilir.

**Düzeltilmiş yönlendirme:**

```
operations.unit_price → production_logs.unit_value (üretim girilirken kopyalanır)
CLAUDE: unit_price alanı operations tablosunda var, birim_deger ekleme.
```

---

### HATA 2: personnel_id TİP UYUŞMAZLIĞI ⛔

**Sorun:**
`production_logs.personnel_id` = SQLite INTEGER (eski format)
`personnel.id` = Supabase UUID (text)

Hibrit sorguda `uretimler.map(u => personeller.find(p => p.id === u.personnel_id))`
satırı **her zaman null döner** çünkü `"123"` (string int) !== `"uuid-xxxx"`.

**Doğrusu:**

```javascript
// Mevcut production_logs'ta personnel_id nasıl saklanıyor?
// Supabase'e migrate edilmeden önce INTEGER id kullanılmış olabilir
// VEYA personnel tablosunda eski integer primary key varsa

// Yol 1: personnel tablosunda eski_id INT alanı varsa:
const personel = personeller.find(p => p.eski_id === u.personnel_id
                                  || p.id === u.personnel_id.toString());

// Yol 2: production_logs'ta Supabase UUID kullanan personnel_id varsa:
// Doğrudan UUID eşleştir (sorun yok)

// CLAUDE: Önce şunu kontrol et:
// SELECT personnel_id FROM production_logs LIMIT 5;
// Sonuç integer mi UUID mi? Buna göre join stratejisini ayarla.
```

---

### HATA 3: prim_orani KAYNAGI BELİRSİZ ⚠️

**Sorun:**
Prim hesabında `katki_maas_farki × prim_orani%` formülü var.
Ama `prim_orani` nerede saklanıyor, kim belirliyor, sistem mi, yönetici mi?

**Doğrusu:**

```
prim_orani = yönetici tarafından her ay girilebilir
             VEYA sistem geneli sabit bir oran olabilir (ör: %15)

ÖNERILEN ÇÖZÜM:
  1. Supabase'de bir "sistem_ayarlari" tablosuna ekle:
     INSERT INTO sistem_ayarlari (key, value) VALUES ('prim_orani', '15');
  2. Koordinatör panelinde bu değeri ayarlayabilsin
  3. Prim hesaplandığında mevcut prim_orani alınıp
     prim_kayitlari.prim_orani alanına snapshot olarak kaydedilsin

SQL:
CREATE TABLE IF NOT EXISTS sistem_ayarlari (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  aciklama TEXT,
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now()
);

INSERT INTO sistem_ayarlari (key, value, aciklama)
VALUES
  ('prim_orani', '15', 'Net katkı-maaş farkının kaçta kaçı prim olur (%)'),
  ('sgk_isverenPayi', '22.5', 'İşveren SGK oranı (%)'),
  ('min_prim_hakkedis', '250', 'Minimum prim hak ediş eşiği (TL)')
ON CONFLICT (key) DO NOTHING;
```

---

## 🔄 DÜZELTİLMİŞ VERİ AKIŞ TABLOSU

| Veri | Kaynak | Alan Adı | Hedef |
|------|--------|----------|-------|
| Birim değer | operations (SQLite) | `unit_price` | production_logs.unit_value |
| Personel maaş | personnel (Supabase) | `salary` | prim hesabı |
| SGK oranı | sistem_ayarlari (Supabase) | `sgk_isverenPayi` | maliyet hesabı |
| Prim oranı | sistem_ayarlari (Supabase) | `prim_orani` | prim hesabı |
| Üretim adedi | production_logs (SQLite) | `total_produced` | katkı değeri |
| Hata adedi | production_logs (SQLite) | `defective_count` | FPY + katkı |

---

## 📋 DÜZELTİLMİŞ AŞAMA 1 — VERİTABANI (Revize)

### Supabase'de Yapılacaklar

```sql
-- 1. YENİ TABLOLAR (Değişmedi):
-- prim_kayitlari, kar_zarar_ozet, karar_arsivi (RAPOR-ANALIZ iş planındaki SQL)

-- 2. sistem_ayarlari (YENİ — prim_orani buradan gelecek):
CREATE TABLE IF NOT EXISTS sistem_ayarlari (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  aciklama TEXT,
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now()
);

INSERT INTO sistem_ayarlari (key, value, aciklama) VALUES
  ('prim_orani', '15', 'Katkı-maaş farkının prim yüzdesi'),
  ('sgk_isverenPayi', '22.5', 'İşveren SGK oranı'),
  ('min_prim_esigi', '250', 'Minimum prim eşiği TL')
ON CONFLICT (key) DO NOTHING;

-- 3. kar_zarar_ozet'e kapanış alanları (Muhasebe için):
ALTER TABLE kar_zarar_ozet
  ADD COLUMN IF NOT EXISTS kapayan_id UUID,
  ADD COLUMN IF NOT EXISTS kapanma_tarihi TIMESTAMPTZ;
```

### SQLite'de Yapılacaklar (TEMİZLENDİ)

```javascript
// db.js alterStatements'e SADECE BU EKLENECEk:
// (birim_deger KALDIRILDI — unit_price zaten var)
"ALTER TABLE operations ADD COLUMN IF NOT EXISTS standart_sure_dk REAL DEFAULT 0",
"ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS katki_degeri_tutari REAL DEFAULT 0"
```

---

## 🔍 KONTROL ADIMI — CLAUDE ÖNCE BU SORGUYU ÇALIŞTIRSIN

```javascript
// Her şeyden önce bu sorguyu çalıştır ve sonucu kaydet:
const kontrol = db.prepare(`
  SELECT personnel_id, typeof(personnel_id) as tip
  FROM production_logs
  WHERE personnel_id IS NOT NULL LIMIT 3
`).all();
console.log('personnel_id format:', kontrol);

// Eğer tip = 'integer' → Supabase UUID eşleştirme için eski_id kullan
// Eğer tip = 'text' ve UUID formatında → Doğrudan eşleştir
```

---

## ✅ DÜZELTME SONRASI ONAYLANAN YAPILAR

| Bileşen | Durum | Not |
|---------|-------|-----|
| prim_kayitlari SQL | ✅ Doğru | RAPOR-ANALIZ iş planındaki SQL kullan |
| kar_zarar_ozet SQL | ✅ Doğru | + kapanış alanları ekle |
| karar_arsivi SQL | ✅ Doğru | Değişiklik yok |
| sistem_ayarlari | ✅ Yeni eklendi | prim_orani buradan gelir |
| operations.unit_price | ✅ Mevcut | birim_deger ekleme! |
| operations.standart_sure_dk | ✅ Eklenecek | Takt zamanı için |
| production_logs.katki_degeri_tutari | ✅ Eklenecek | Performans önbelleği |
| Hibrit sorgu (SQLite+Supabase) | ⚠️ ID tipi kontrol et | Önce KONTROL ADIMI |
| PDF (jspdf) | ✅ Doğru | npm install gerekli |
