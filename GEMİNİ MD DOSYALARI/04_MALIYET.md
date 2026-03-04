# 💰 MALİYET — Supabase Entegrasyonu Tam Dokümantasyon

> **Tarih:** 2026-03-03  
> **Durum:** ✅ SQL Supabase'e uygulandı  
> **Tablolar:** `cost_entries`, `business_expenses`  
> **API:** `app/app/api/costs/`, `app/app/api/isletme-gider/`

---

## 1. NE YAPILDI

Maliyet modülü 2 farklı tablodan oluşur:

1. **`cost_entries`** — Model bazlı maliyet kalemleri (hammadde, aksesuar, fason)
2. **`business_expenses`** — Aylık işletme giderleri (kira, elektrik, SGK, maaş)

Bu sohbette:

1. Her iki tablonun SQL'i hazırlandı ve Supabase'e uygulandı
2. `costs/route.js` ve `costs/[id]/route.js` — Supabase'e geçirildi
3. `isletme-gider/route.js` — Supabase'e geçirildi
4. `isletme-gider` upsert → delete+insert mantığına çevrildi (UNIQUE constraint olmadığı için)

---

## 2. SUPABASE TABLO — `cost_entries`

Model başına yapılan harcamalar: hammadde, aksesuar, nakliye, fason işçilik vb.

```sql
CREATE TABLE IF NOT EXISTS cost_entries (
    id          BIGSERIAL PRIMARY KEY,
    model_id    BIGINT REFERENCES models(id),   -- Hangi modele ait
    category    TEXT NOT NULL,                   -- Maliyet kategorisi
    description TEXT,                            -- Açıklama
    amount      NUMERIC(10,2) NOT NULL,          -- Birim fiyat
    unit        TEXT,                            -- Birim (kg, metre, adet...)
    quantity    NUMERIC(10,2) DEFAULT 1,         -- Miktar
    total       NUMERIC(10,2) NOT NULL,          -- Toplam (amount x quantity)
    deleted_at  TIMESTAMPTZ,
    deleted_by  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_model ON cost_entries(model_id);
```

### API — `app/app/api/costs/route.js`

**GET /api/costs?model_id=X**

```javascript
supabaseAdmin
  .from('cost_entries')
  .select('*, models(name, code)')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
// Opsiyonel: .eq('model_id', model_id)
```

**POST /api/costs**

```javascript
// Toplam otomatik hesaplanır
const total = parseFloat(amount) * parseFloat(quantity || 1);
supabaseAdmin.from('cost_entries').insert({ model_id, category, description, amount, unit, quantity, total })
```

### API — `app/app/api/costs/[id]/route.js`

**PUT /api/costs/[id]**

- `amount` veya `quantity` değişirse `total` yeniden hesaplanır
- Alanlar: `category`, `description`, `unit`, `amount`, `quantity`, `total`

**DELETE /api/costs/[id]**

- Soft delete: `deleted_at = NOW()`

---

## 3. SUPABASE TABLO — `business_expenses`

Aylık sabit ve değişken işletme giderleri:

```sql
CREATE TABLE IF NOT EXISTS business_expenses (
    id           BIGSERIAL PRIMARY KEY,
    category     TEXT NOT NULL,             -- Kategori: kira, elektrik, sgk, maas vb.
    description  TEXT,                      -- Ek açıklama
    amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
    year         INTEGER NOT NULL,          -- Yıl: 2026
    month        INTEGER NOT NULL,          -- Ay: 3 (Mart)
    is_recurring BOOLEAN DEFAULT FALSE,     -- Tekrarlayan mı?
    deleted_at   TIMESTAMPTZ,
    deleted_by   TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### API — `app/app/api/isletme-gider/route.js`

**GET /api/isletme-gider?yil=2026&ay=3**

```javascript
supabaseAdmin
  .from('business_expenses')
  .select('*')
  .is('deleted_at', null)
  .eq('year', year)
  .eq('month', parseInt(month))  // Opsiyonel
  .order('month', { ascending: false })
  .order('category', { ascending: true })
```

**POST /api/isletme-gider**

Destekler hem tekil kayıt hem de aylık toplu gönderim:

```javascript
// Kategori + ay + yıl kombinasyonu zaten varsa güncelle, yoksa ekle
// Upsert yerine: önce o ay-yıl'ı sil, sonra yeniden ekle
for (const e of inserts) {
    await supabaseAdmin.from('business_expenses')
        .delete()
        .eq('category', e.category).eq('year', e.year).eq('month', e.month);
    await supabaseAdmin.from('business_expenses').insert(e);
}
```

> **Dikkat:** `business_expenses` tablosunda UNIQUE constraint yok. Bu yüzden upsert yerine delete+insert kullanıldı.

**PUT /api/isletme-gider** — Mevcut kaydı güncelle

**DELETE /api/isletme-gider?id=X** — Soft delete

---

## 4. MALİYET KATEGORİLERİ (Tipik Kullanım)

| Kategori | Tablo | Açıklama |
|---|---|---|
| `hammadde` | cost_entries | Kumaş maliyeti |
| `aksesuar` | cost_entries | Fermuar, düğme, etiket |
| `fason_iscilik` | cost_entries | Dış fason ücreti |
| `nakliye` | cost_entries | Taşıma maliyeti |
| `kira` | business_expenses | Atölye kirası |
| `elektrik` | business_expenses | Elektrik faturası |
| `su` | business_expenses | Su faturası |
| `sgk` | business_expenses | SGK işveren payı |
| `maas` | business_expenses | Toplam maaş gideri |
| `prim` | business_expenses | Prim ödemeleri |
| `diger` | business_expenses | Diğer giderler |

---

## 5. MALİYET HESAPLAMA MANTIĞI

### Model Maliyet Özeti (rapor/ay-ozet'te kullanılır)

```
Toplam Maliyet = SUM(cost_entries.total WHERE model_id = X)
             + (business_expenses aylık toplam / toplam üretim adedi) * model üretim adedi
```

### İlişki Şeması

```
cost_entries
└── model_id → models(id)

business_expenses
└── (bağımsız — yıl/ay bazında)

rapor/ay-ozet → her iki tabloyu da kullanır
kar_zarar_ozet → business_expenses toplamlarını kullanır
```

---

## 6. RLS

```sql
ALTER TABLE cost_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_costs_all"    ON cost_entries      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_expenses_all" ON business_expenses FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 7. DİKKAT EDİLECEK NOKTALAR

1. **`business_expenses` UNIQUE yok:** Aynı ay-yıl-kategori kombinasyonu birden fazla eklenebilir. API bunu delete+insert ile yönetiyor.
2. **`cost_entries.total`** = `amount × quantity` — API her seferinde yeniden hesaplıyor.
3. **`cost_entries`** model bazlı (FK var), **`business_expenses`** genel atölye gideri (FK yok).
