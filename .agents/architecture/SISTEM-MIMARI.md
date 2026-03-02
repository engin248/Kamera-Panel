# 🏗️ KAMERA-PANEL — SİSTEM MİMARİSİ

> **Son Güncelleme:** 2026-03-02  
> **Durum:** Aktif Üretim  
> **Versiyon:** v2.1 (Supabase + Bot Entegrasyonlu)

---

## 📐 GENEL MİMARİ

```
Kamera-Panel/
├── app/                          → Next.js Uygulaması (PORT 3000)
│   ├── app/
│   │   ├── page.js               → Ana UI (12.000+ satır, tek dosya React)
│   │   ├── globals.css           → Global stiller
│   │   ├── layout.js             → Root layout
│   │   ├── api/                  → 27+ API endpoint
│   │   └── operator/             → Tablet operatör ekranı
│   ├── lib/
│   │   ├── db.js                 → SQLite veritabanı (better-sqlite3)
│   │   ├── supabase.js           → ☁️ Supabase istemcisi (supabase + supabaseAdmin)
│   │   ├── ai-services.js        → 4 AI API entegrasyonu
│   │   ├── auth.js               → Yetki sistemi
│   │   ├── edit-system.js        → Audit trail / düzenlemesistemi
│   │   └── i18n.js               → Çok dil desteği (TR/AR)
│   ├── scripts/
│   │   └── migrate-personnel-to-supabase.mjs  → SQLite→Supabase migration
│   ├── data/
│   │   └── kamera-panel.db       → SQLite veritabanı (diğer tablolar)
│   └── .env.local              → API anahtarları (GitHub'a gitmiyor)
├── .agents/                      → AI Agent sistemi
│   ├── architecture/             → Mimari dokümanlar (BU KLASÖR)
│   ├── bots/                     → Bot konfigürasyonları
│   ├── rules/rules.md            → Sistem kuralları
│   ├── skills/                   → Agent becerileri
│   └── workflows/                → İş akışları
└── MISYON.md                     → Misyon belgesi [MK:4721]
```

---

## 🗄️ VERİTABANI TABLOLARI

> **Hibrit Mimari:** `personnel` → Supabase | Diğerleri → SQLite

| Tablo | Motor | Açıklama | Satır Sayısı (Tahmini) |
|-------|-------|----------|------------------------|
| `personnel` | ☁️ Supabase | Çalışan profilleri (P1-P11) | 10-30 |
| `models` | SQLite | Model kartları (teknik detaylar) | 10-50 |
| `operations` | SQLite | Model operasyonları | 50-500 |
| `production_logs` | SQLite | Günlük üretim kayıtları | 1000+ |
| `quality_checks` | SQLite | Kalite kontrol | 500+ |
| `approval_queue` | SQLite | İlk ürün onayları | 50+ |
| `orders` | SQLite | Siparişler | 20-100 |
| `shipments` | SQLite | Sevkiyatlar | 10-50 |
| `customers` | SQLite | Müşteri listesi | 5-30 |
| `machines` | SQLite | Makine envanteri | 5-20 |
| `machine_settings` | SQLite | Makine ayar şablonları | 10-100 |
| `fason_providers` | SQLite | Fason tedarikçiler | 5-20 |
| `fason_orders` | SQLite | Fason siparişler | 10-50 |
| `cost_entries` | SQLite | Maliyet kalemleri | 50-200 |
| `business_expenses` | SQLite | İşletme giderleri | 20-100 |
| `users` | SQLite | Kullanıcılar (yetki) | 2-10 |
| `activity_log` | SQLite | İşlem günlüğü | 1000+ |
| `audit_trail` | SQLite | Değişiklik geçmişi | 1000+ |
| `work_schedule` | SQLite | Mola çizelgesi | 7 (sabit) |
| `monthly_work_days` | SQLite | Aylık çalışma günleri | 12/yıl |

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Açıklama |
|----------|-------|----------|
| `/api/models` | GET, POST | Model CRUD |
| `/api/models/[id]` | GET, PUT, DELETE | Tekil model |
| `/api/operations` | GET, POST | Operasyon CRUD |
| `/api/personnel` | GET, POST | Personel CRUD |
| `/api/production` | GET, POST | Üretim kaydı |
| `/api/quality-checks` | GET, POST | Kalite kontrol |
| `/api/orders` | GET, POST | Sipariş CRUD |
| `/api/orders/[id]` | GET, PUT, DELETE | Tekil sipariş |
| `/api/shipments` | GET, POST | Sevkiyat |
| `/api/shipments/[id]` | PUT | Tekil sevkiyat |
| `/api/customers` | GET, POST | Müşteri CRUD |
| `/api/customers/[id]` | PUT, DELETE | Tekil müşteri |
| `/api/machines` | GET, POST | Makine CRUD |
| `/api/machines/[id]` | PUT, DELETE | Tekil makine |
| `/api/fason` | GET, POST | Fason yönetim |
| `/api/fason/[id]` | PUT | Tekil fason |
| `/api/costs` | GET, POST | Maliyet |
| `/api/costs/[id]` | DELETE | Tekil maliyet |
| `/api/expenses` | GET, POST | İşletme giderleri |
| `/api/isletme-gider` | GET, POST | İşletme gider (yeni) |
| `/api/auth` | POST | Giriş/Çıkış |
| `/api/chatbot` | POST | **4 Bot AI** |
| `/api/ai-kurul` | POST | Yönetim kurulu oylaması |
| `/api/fason-fiyat-hesapla` | POST | Fiyat hesaplama |
| `/api/uretim-ozet` | GET | Günlük özet |
| `/api/uretim-giris` | GET, POST | Üretim parti girişi |
| `/api/personel-saat` | POST | Giriş/çıkış saati |
| `/api/personel-haftalik` | GET | Haftalık personel raporu |
| `/api/work-schedule` | GET, POST | Çalışma takvimi |
| `/api/upload` | POST | Dosya yükleme |
| `/api/model-vision` | POST | Fotoğraf analizi (AI) |
| `/api/model-operasyonlar` | GET | Model+Operasyon listesi |
| `/api/approvals` | GET, POST | Onay kuyruğu |
| `/api/audit-trail` | GET | Değişiklik geçmişi |
| `/api/voice-command` | POST | Sesli komut işleme |

---

## 🤖 CHATBOT BOT SİSTEMİ

Her sekme için ayrı bot yapısı (bkz. `bots/` klasörü):

| Bot | AI Motoru | Sekme | Uzmanlık |
|-----|-----------|-------|----------|
| **Kamera** 🔩 | Gemini 2.0 Flash | Üretim, Siparişler | Anlık operasyon |
| **Muhasip** 📊 | GPT-4o-mini | Maliyet, Rapor | Finans analizi |
| **Kaşif** 🔍 | Perplexity Sonar | Tüm sekmeler | Piyasa araştırması |
| **Tekniker** 🛠️ | DeepSeek Chat | Modeller, Kalite | Teknik detaylar |

Chatbot API: `POST /api/chatbot` — `{ message, history, bot }`

---

## 🖥️ UI PANEL SEKMELERİ

### Üretim Departmanı (Ana Grup)

| Sekme | ID | Bot | Açıklama |
|-------|----|-----|----------|
| Modeller | `models` | Tekniker | Model kartları, BOM, operasyon tanımları |
| Personel | `personnel` | Kamera | P1-P11 kriter, maaş, beceri profili |
| Üretim Aşaması | `production` | Kamera | Günlük üretim, OEE, FPY takibi |
| Maliyet | `costs` | Muhasip | Model bazlı maliyet analizi |
| Rapor & Analiz | `muhasebe` | Muhasip | Aylık/yıllık raporlar |

### Bağımsız Sekmeler

| Sekme | ID | Bot | Açıklama |
|-------|----|-----|----------|
| Siparişler | `orders` | Kamera | Müşteri siparişleri, teslimat takibi |
| Kalite Kontrol | `quality` | Tekniker | Hata tipleri, foto, karar |
| Fason | `fason` | Muhasip | Dış atölye takibi |
| Sevkiyat | `shipments` | Kamera | Sevkiyat ve kargo takibi |
| Prim & Üret | `prim` | Muhasip | Teşvik sistemi |
| Makineler | `machines` | Tekniker | Makine envanteri, bakım |
| Müşteriler | `customers` | Kamera | Müşteri CRM |
| Raporlar | `reports` | Muhasip | Grafik + analitik |
| Ana Panel | `dashboard` | Kamera | Genel özet dashboard |
| Ayarlar | `settings` | — | Sistem ayarları |

---

## 🔒 YETKİ SİSTEMİ

| Rol | Yetki Seviyesi | Erişim |
|-----|----------------|--------|
| `koordinator` | TAM YETKİ | Her şey |
| `ustabasi` | YÜKSEK | Üretim + Personel |
| `kaliteci` | ORTA | Kalite modülleri |
| `operator` | DÜŞÜK | Sadece tablet ekranı |

Varsayılan: `admin` / `47admin2026`

---

## 🛠️ TEKNİK YIĞIN

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| Framework | Next.js | 16.1.6 |
| UI | React | 19.2.3 |
| Veritabanı (yerel) | SQLite (better-sqlite3) | ^12.6.2 |
| Veritabanı (bulut) | ☁️ Supabase PostgreSQL | @supabase/supabase-js |
| AI - Operasyon | Google Gemini | 2.0-flash (+fallback to GPT) |
| AI - Finans | OpenAI GPT | 4o-mini |
| AI - Araştırma | Perplexity | sonar (+fallback to Gemini) |
| AI - Teknik | DeepSeek | chat (+fallback to Gemini/GPT) |
| Dosya Yükleme | Multer | ^2.0.2 |
| ID Üretimi | UUID | ^13.0.0 |
| Port | localhost | 3000 |

---

## 📁 STATIK DOSYALAR

```
app/public/
├── uploads/
│   ├── photos/     → Model fotoğrafları (ön/arka)
│   └── videos/     → Operasyon eğitim videoları
```

---

## 🔄 GÜNCELLEME KURALLARI

Bu dosya **her büyük değişiklikten sonra güncellenir**:

- Yeni API endpoint eklendiyse → API tablosunu güncelle
- Yeni sekme eklendiyse → UI tablosunu güncelle
- Yeni veritabanı tablosu eklendiyse → DB tablosunu güncelle
- Bot değişikliği varsa → Bot tablosunu güncelle
