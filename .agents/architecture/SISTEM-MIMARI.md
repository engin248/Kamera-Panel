# 🏗️ KAMERA-PANEL — SİSTEM MİMARİSİ

> **Son Güncelleme:** 2026-03-03  
> **Durum:** Aktif Üretim — Supabase Geçişi  
> **Versiyon:** v2.2 (Supabase Tam Geçiş)

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

> **Hedef: Tüm tablolar Supabase'de** (Geçiş 2026-03-03'ten itibaren)

| Tablo | Motor | Açıklama | API Durumu |
|-------|-------|----------|------------|
| `personnel` | ☁️ Supabase | Çalışan profilleri (P1-P11) | ✅ Supabase |
| `machines` | ☁️ Supabase | Makine envanteri | ✅ Supabase |
| `models` | ☁️ Supabase | Model kartları | ✅ Supabase |
| `operations` | ☁️ Supabase | Model operasyonları | ✅ Supabase |
| `production_logs` | ☁️ Supabase | Günlük üretim kayıtları | ✅ Supabase |
| `cost_entries` | ☁️ Supabase | Maliyet kalemleri | ✅ Supabase |
| `business_expenses` | ☁️ Supabase | İşletme giderleri | ✅ Supabase |
| `prim_kayitlari` | ☁️ Supabase | Prim motor tablosu | ⏳ API bekliyor |
| `kar_zarar_ozet` | ☁️ Supabase | Aylık muhasebe özeti | ⏳ API bekliyor |
| `karar_arsivi` | ☁️ Supabase | Karar öğrenme sistemi | ⏳ API bekliyor |
| `quality_checks` | SQLite→Supabase | Kalite kontrol | ⏳ Bekliyor |
| `orders` | SQLite→Supabase | Siparişler | ⏳ Bekliyor |
| `customers` | SQLite→Supabase | Müşteri listesi | ⏳ Bekliyor |
| `shipments` | SQLite→Supabase | Sevkiyatlar | ⏳ Bekliyor |
| `fason_providers` | SQLite→Supabase | Fason tedarikçiler | ⏳ Bekliyor |
| `fason_orders` | SQLite→Supabase | Fason siparişler | ⏳ Bekliyor |
| `audit_trail` | SQLite→Supabase | Değişiklik geçmişi | ⏳ Bekliyor |
| `users` | SQLite→Supabase | Kullanıcılar (yetki) | ⏳ Bekliyor |
| `work_schedule` | SQLite→Supabase | Mola çizelgesi | ⏳ Bekliyor |
| `personel_saat` | SQLite→Supabase | Giriş/çıkış saati | ⏳ Bekliyor |
| `sistem_ayarlari` | ☁️ Supabase | Sistem ayarları | ✅ SQL hazır |

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Açıklama |
|----------|-------|----------|
| `/api/models` | GET, POST | Model CRUD | ✅ Supabase |
| `/api/models/[id]` | GET, PUT, DELETE | Tekil model | ✅ Supabase |
| `/api/models/[id]/operations` | GET, POST, PUT, DELETE | Model operasyonları | ✅ Supabase |
| `/api/operations` | GET, POST | Operasyon CRUD | |
| `/api/personnel` | GET, POST | Personel CRUD | ✅ Supabase |
| `/api/personnel/[id]` | GET, PUT, DELETE | Tekil personel | ✅ Supabase |
| `/api/production` | GET, POST | Üretim kaydı | ✅ Supabase |
| `/api/production/[id]` | GET, PUT, DELETE | Tekil üretim | ✅ Supabase |
| `/api/quality-checks` | GET, POST | Kalite kontrol | |
| `/api/orders` | GET, POST | Sipariş CRUD | |
| `/api/orders/[id]` | GET, PUT, DELETE | Tekil sipariş | |
| `/api/shipments` | GET, POST | Sevkiyat | |
| `/api/shipments/[id]` | PUT | Tekil sevkiyat | |
| `/api/customers` | GET, POST | Müşteri CRUD | |
| `/api/customers/[id]` | PUT, DELETE | Tekil müşteri | |
| `/api/machines` | GET, POST | Makine CRUD | ✅ Supabase |
| `/api/machines/[id]` | PUT, DELETE | Tekil makine | ✅ Supabase |
| `/api/fason` | GET, POST | Fason yönetim | |
| `/api/fason/[id]` | PUT | Tekil fason | |
| `/api/costs` | GET, POST | Maliyet | ✅ Supabase |
| `/api/costs/[id]` | PUT, DELETE | Tekil maliyet | ✅ Supabase |
| `/api/expenses` | GET, POST, PUT, DELETE | İşletme giderleri | |
| `/api/isletme-gider` | GET, POST, PUT, DELETE | İşletme gider | ✅ Supabase |
| `/api/rapor/ay-ozet` | GET | Aylık özet dashboard | ✅ Supabase |
| `/api/rapor/personel-verimlilik` | GET | Personel prim analizi | ✅ Supabase |
| `/api/auth` | POST | Giriş/Çıkış | |
| `/api/chatbot` | POST | **4 Bot AI** | |
| `/api/ai-kurul` | POST | Yönetim kurulu oylaması | |
| `/api/fason-fiyat-hesapla` | POST | Fiyat hesaplama | |
| `/api/uretim-ozet` | GET | Günlük özet | |
| `/api/uretim-giris` | GET, POST | Üretim parti girişi | |
| `/api/personel-saat` | POST | Giriş/çıkış saati | |
| `/api/personel-haftalik` | GET | Haftalık personel raporu | |
| `/api/work-schedule` | GET, POST | Çalışma takvimi | |
| `/api/upload` | POST | Dosya yükleme | |
| `/api/model-vision` | POST | Fotoğraf analizi (AI) | |
| `/api/model-operasyonlar` | GET | Model+Operasyon listesi | |
| `/api/approvals` | GET, POST | Onay kuyruğu | |
| `/api/audit-trail` | GET | Değişiklik geçmişi | |
| `/api/voice-command` | POST | Sesli komut işleme | |

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
