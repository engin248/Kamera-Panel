# 🏆 PRİM SİSTEMİ — Supabase Entegrasyonu Tam Dokümantasyon

> **Tarih:** 2026-03-03  
> **Durum:** ✅ SQL Supabase'e uygulandı (YENİ TABLO)  
> **Tablo:** `prim_kayitlari`  
> **API:** `app/app/api/rapor/personel-verimlilik/route.js` (prim hesaplar)

---

## 1. NE YAPILDI

Bu sohbette sıfırdan tasarlanan YENİ modüldür. Daha önce SQLite'ta yoktu.

1. `prim_kayitlari` tablosu tasarlandı
2. SQL hazırlandı ve Supabase'e uygulandı
3. `personel-verimlilik` API'si prim hesaplama mantığıyla yazıldı
4. UNIQUE constraint: aynı personel için aynı ay-yılda tek kayıt

---

## 2. SUPABASE TABLO — `prim_kayitlari`

```sql
CREATE TABLE IF NOT EXISTS prim_kayitlari (
    id                  BIGSERIAL PRIMARY KEY,
    personel_id         BIGINT REFERENCES personnel(id) ON DELETE RESTRICT,

    ay                  INTEGER NOT NULL CHECK (ay BETWEEN 1 AND 12),
    yil                 INTEGER NOT NULL,

    -- Üretim verileri (production_logs'dan hesaplanır)
    toplam_uretilen     INTEGER DEFAULT 0,
    toplam_hatali       INTEGER DEFAULT 0,
    fpy_yuzde           REAL DEFAULT 0,
    oee_skoru           REAL DEFAULT 0,

    -- Mali hesaplama
    katki_degeri        REAL DEFAULT 0,      -- Personelin toplam katkı değeri (TL)
    maas_maliyeti       REAL DEFAULT 0,      -- base_salary + sgk + yemek + yol
    katki_maas_farki    REAL DEFAULT 0,      -- katki_degeri - maas_maliyeti
    prim_orani          REAL DEFAULT 0,      -- % (örn: 20)
    prim_tutari         REAL DEFAULT 0,      -- Hesaplanan prim (TL)

    -- Onay süreci
    onay_durumu         TEXT DEFAULT 'hesaplandi'
        CHECK (onay_durumu IN ('hesaplandi','onaylandi','odendi','iptal')),
    onaylayan_id        BIGINT,
    onay_tarihi         TIMESTAMPTZ,
    odeme_tarihi        DATE,
    notlar              TEXT,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(personel_id, ay, yil)            -- Her personel için aylık tek kayıt
);
```

---

## 3. PRİM HESAPLAMA MANTIĞI

`/api/rapor/personel-verimlilik` API'si bu mantıkla çalışır:

```javascript
// 1. Personel listesi (personnel tablosundan)
const personeller = await supabaseAdmin.from('personnel').select('id, name, base_salary, ...')

// 2. Bu ayın üretim logları (production_logs tablosundan)
const uretimLogs = await supabaseAdmin.from('production_logs')
    .select('personnel_id, total_produced, defective_count, first_pass_yield, unit_value')
    .gte('start_time', baslangic).lt('start_time', bitis)

// 3. Her personel için hesaplama:
for (const p of personeller) {
    const logs = uretimLogs.filter(l => l.personnel_id == p.id);
    
    const katki_degeri = logs.reduce((s, l) => s + (l.unit_value || 0), 0);
    const maas_maliyeti = p.base_salary * 1.205 + p.food_allowance + p.transport_allowance;
    const katki_maas_farki = katki_degeri - maas_maliyeti;
    
    // Prim sadece katkı değeri > maaş maliyetindeyse ödenir
    const prim_tutari = katki_maas_farki > 0
        ? katki_maas_farki * (prim_orani / 100)
        : 0;
}
```

---

## 4. PRİM ONAY SÜRECİ

```
hesaplandi → onaylandi → odendi
               ↓
             iptal
```

1. `hesaplandi` — Sistem otomatik hesapladı
2. `onaylandi` — Yönetici onayladı (Rapor & Analiz → Prim Onay sekmesinden)
3. `odendi` — Ödeme yapıldı
4. `iptal` — İptal edildi

---

## 5. BAĞLANTI ŞEMASİ

```
prim_kayitlari
├── personel_id → personnel(id) ON DELETE RESTRICT
└── UNIQUE(personel_id, ay, yil)

Veri kaynakları:
production_logs → katki_degeri, oee_skoru, fpy_yuzde hesaplanır
personnel → maas_maliyeti hesaplanır
```

---

## 6. RLS

```sql
ALTER TABLE prim_kayitlari ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_prim_all" ON prim_kayitlari
    FOR ALL TO service_role USING (true) WITH CHECK (true);
```
