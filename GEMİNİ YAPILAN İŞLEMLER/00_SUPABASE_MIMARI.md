# 🏗️ SUPABASE BAĞLANTI MİMARİSİ — Sistem Genel Bakış

> **Tarih:** 2026-03-03  
> **Proje:** Kamera-Panel Tekstil Üretim Yönetim Sistemi  
> **Durum:** Supabase tam geçiş tamamlandı

---

## 1. SUPABASE BAĞLANTI KURULUMU

### `app/lib/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Frontend (anon) erişim — RLS kuralları geçerli
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Backend (service_role) erişim — RLS'yi atlar, tam erişim
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

### `.env.local` dosyası (gerekli)

```
NEXT_PUBLIC_SUPABASE_URL=https://cauptlsnqieegdrgotob.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. TABLO İLİŞKİ DİYAGRAMI

```
personnel (id)
    ├── production_logs (personnel_id)
    └── prim_kayitlari (personel_id)

models (id)
    ├── operations (model_id) [CASCADE]
    ├── production_logs (model_id)
    ├── cost_entries (model_id)
    ├── orders (model_id)
    ├── shipments (model_id)
    └── fason_orders (model_id)

operations (id)
    └── production_logs (operation_id)

customers (id)
    ├── orders (customer_id)
    └── shipments (customer_id)

production_logs (id)
    └── quality_checks (production_log_id)

fason_providers (id)
    └── fason_orders (provider_id)
```

---

## 3. API DÖNÜŞÜM DURUMU

| API Endpoint | SQLite → Supabase | Test |
|---|---|---|
| `/api/personnel` | ✅ Dönüştürüldü | ✅ 4 kayıt |
| `/api/personnel/[id]` | ✅ Dönüştürüldü | ✅ OK |
| `/api/models` | ✅ Dönüştürüldü | ✅ [] |
| `/api/models/[id]` | ✅ Dönüştürüldü | ✅ OK |
| `/api/models/[id]/operations` | ✅ Dönüştürüldü | ✅ OK |
| `/api/machines` | ✅ Dönüştürüldü | ✅ [] |
| `/api/machines/[id]` | ✅ Dönüştürüldü | ✅ OK |
| `/api/production` | ✅ Dönüştürüldü | ✅ OK |
| `/api/production/[id]` | ✅ Dönüştürüldü | ✅ OK |
| `/api/costs` | ✅ Dönüştürüldü | ✅ OK |
| `/api/costs/[id]` | ✅ Dönüştürüldü | ✅ OK |
| `/api/isletme-gider` | ✅ Dönüştürüldü | ✅ OK |
| `/api/rapor/ay-ozet` | ✅ Dönüştürüldü | ✅ OK |
| `/api/rapor/personel-verimlilik` | ✅ Dönüştürüldü | ✅ OK |

---

## 4. RLS POLİTİKASI (Tüm Tablolar)

Her tablo için aynı pattern uygulandı:

```sql
ALTER TABLE [tablo_adi] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_[tablo]_all" ON [tablo_adi]
    FOR ALL TO service_role USING (true) WITH CHECK (true);
```

**Neden service_role?**  
API'ler `supabaseAdmin` kullanır → `service_role` key → RLS atlanır → Tam CRUD erişimi  
Frontend doğrudan Supabase'e istek atmaz → anon key sadece yedekte

---

## 5. DOĞRULAMA SQL (Supabase SQL Editor'de çalıştır)

```sql
-- Tüm tablolar var mı?
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE'
ORDER BY table_name;
-- Beklenen: 22 tablo

-- Kritik kolonlar var mı?
SELECT
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='models' AND column_name='measurement_table')     AS models_jsonb,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='operations' AND column_name='birim_deger')        AS ops_birim_deger,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='production_logs' AND column_name='katki_degeri_tutari') AS prod_katki,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='prim_kayitlari' AND column_name='onay_durumu')   AS prim_onay;
-- Beklenen: Hepsi 1
```
