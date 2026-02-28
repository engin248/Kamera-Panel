# 🤖 AGENT GÖREV DOSYASI — ÜRETİM PENCERESİ (v2.0)

> **Proje:** Kamera-Panel Üretim Takip Sistemi
> **Hedef:** Üretim Penceresi & 21 Kriter implementasyonu
> **Çalışma Ortamı:** Dizüstü bilgisayar → Open Agent Manager
> **Kaynak:** Masaüstü bilgisayardaki mevcut GitHub reposu
> **Versiyon:** 2.0 (Genişletilmiş — Eksiksiz)

---

## BÖLÜM 0: DİZÜSTÜ BİLGİSAYARA AKTARIM REHBERİ

### 0.1 Ön Gereksinimler (Dizüstü Bilgisayarda Kurulu Olmalı)

```
✅ ZORUNLU KURULUMLAR:
1. Node.js (v18 veya üzeri) → https://nodejs.org
2. Git → https://git-scm.com
3. Python 3.x → https://python.org (test scriptleri için)
4. Open Agent Manager → Kurulmuş ve çalışır durumda
5. Visual Studio Code (önerilen) → https://code.visualstudio.com
6. Bir tarayıcı (Chrome/Edge önerilen)

✅ İSTEĞE BAĞLI:
- SQLite Browser → https://sqlitebrowser.org (DB inceleme için)
```

### 0.2 Projeyi Dizüstü Bilgisayara Aktarma (3 Yöntem)

#### YÖNTEM 1: GitHub'dan Clone (ÖNERİLEN ✅)
```powershell
# 1. Masaüstüne git
cd ~/Desktop

# 2. Deneme klasörü oluştur (masaüstü bilgisayardaki yapıyla aynı)
mkdir Deneme
cd Deneme

# 3. GitHub'dan projeyi çek
git clone https://github.com/engin248/Kamera-Panel.git

# 4. Proje klasörüne gir
cd Kamera-Panel/app

# 5. Bağımlılıkları yükle
npm install

# 6. Çalışıp çalışmadığını test et
npm run dev
# → Tarayıcıda http://localhost:3000 açılmalı

# 7. Ctrl+C ile kapat (test tamamlandı)
```

#### YÖNTEM 2: USB Flash Disk ile Taşıma
```
1. Masaüstü bilgisayarda:
   - C:\Users\esisya\Desktop\Deneme\ klasörünü kopyala
   - USB'ye yapıştır

2. Dizüstü bilgisayarda:
   - USB'den masaüstüne yapıştır
   - Kamera-Panel\app\ klasöründe terminal aç
   - node_modules klasörünü SİL (büyük, kopyalamaya gerek yok)
   - npm install çalıştır
```

#### YÖNTEM 3: .env Dosyasını Manuel Taşıma
```
⚠️ ÖNEMLİ: .env dosyası GitHub'a yüklenmez!
Masaüstü bilgisayardaki .env dosyasını manuel kopyalaman gerekir:

Kaynak: C:\Users\esisya\Desktop\Deneme\.env
Hedef:  [DizüstüMasaüstü]\Deneme\.env

İçeriği:
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
CLAUDE_API_KEY=...
PERPLEXITY_API_KEY=...
```

### 0.3 Aktarım Doğrulama Kontrol Listesi

```
Dizüstü bilgisayarda şunları doğrula:

□ Proje klasör yapısı doğru mu?
  Deneme/
  ├── .env (API key'ler)
  ├── test_all_outputs.py
  └── Kamera-Panel/
      ├── app/
      │   ├── app/page.js (~450KB)
      │   ├── lib/db.js
      │   ├── data/kamera-panel.db
      │   └── package.json
      ├── URETIM-PENCERESI-YONETIM-KURULU-INCELEME.md
      └── AGENT-GOREV-DOSYASI.md

□ npm install başarılı mı?
□ npm run dev ile localhost:3000 açılıyor mu?
□ Ana Panel görünüyor mu? (📊 Ana Panel başlığı)
□ Sidebar menü çalışıyor mu?
□ Mevcut veriler görünüyor mu? (1 model, 2 personel, 200 sipariş)
□ test_all_outputs.py çalışıyor mu?
  → python test_all_outputs.py
  → %100 sağlık bekleniyor
```

---

## BÖLÜM 1: GÜVENLİK KURALLARI

### 1.1 Dokunulmaz Dosyalar (READ-ONLY)

```
⛔ YASAK — Bu dosyalarda HİÇBİR DEĞİŞİKLİK YAPILAMAZ:

DOSYA                              NEDEN
─────────────────────────────────  ──────────────────────────────
app/lib/auth.js                    Yetkilendirme sistemi
app/lib/edit-system.js             Düzenleme sistemi
app/app/globals.css                CSS (sadece YENİ class EKLENEBİLİR)
app/app/layout.js                  Sayfa layout'u
app/next.config.mjs                Next.js konfigürasyonu
app/package.json                   Bağımlılıklar (npm install ile)

API'LER — SADECE OKUMA:
app/app/api/personnel/             Personel API
app/app/api/personnel/[id]/        Personel detay API
app/app/api/costs/                 Maliyet API
app/app/api/costs/[id]/            Maliyet detay API
app/app/api/orders/                Sipariş API
app/app/api/orders/[id]/           Sipariş detay API
app/app/api/shipments/             Sevkiyat API
app/app/api/shipments/[id]/        Sevkiyat detay API
app/app/api/customers/             Müşteri API
app/app/api/customers/[id]/        Müşteri detay API
app/app/api/fason/                 Fason API
app/app/api/machines/              Makine API (okuma izni var)
app/app/api/models/                Model API (okuma izni var)
app/app/api/expenses/              Gider API
app/app/api/auth/                  Auth API
app/app/api/approvals/             Onay API
app/app/api/audit-trail/           Değişiklik kaydı API
app/app/api/upload/                Dosya yükleme API
app/app/api/work-schedule/         İş çizelgesi API
```

### 1.2 Düzenlenebilir Dosyalar

```
✅ İZİN VERİLEN DEĞİŞİKLİKLER:

DOSYA                              İZİN VERİLEN İŞLEM
─────────────────────────────────  ──────────────────────────────
app/lib/db.js                      SADECE production_logs tablosuna
                                   ALTER TABLE ile YENİ kolon ekleme.
                                   Mevcut kolonlar DEĞİŞTİRİLEMEZ.
                                   Diğer tablolar DEĞİŞTİRİLEMEZ.

app/lib/i18n.js                    SADECE YENİ çeviri key'leri ekleme.
                                   Mevcut key'ler DEĞİŞTİRİLEMEZ.

app/app/api/production/route.js    GET ve POST fonksiyonları
                                   genişletilebilir. Mevcut parametreler
                                   KALDIRILMAZ, yenileri EKLENEBİLİR.

app/app/api/production/[id]/       PUT ve DELETE endpoint'leri
route.js                           eklenebilir/genişletilebilir.

app/app/api/quality-checks/        Kalite kontrol API genişletilebilir.
route.js

app/app/page.js                    SADECE activeSection === 'production'
                                   bölümündeki kod DEĞİŞTİRİLEBİLİR.
                                   Diğer bölümler (personnel, models,
                                   orders, costs, vb.) DOKUNULMAZ.

app/app/globals.css                SADECE YENİ CSS class'ları
                                   EKLENEBİLİR. Mevcut class'lar
                                   DEĞİŞTİRİLEMEZ.
```

### 1.3 Kontrol Mekanizması

Her agent çalıştıktan sonra QA-Agent şu kontrolü yapar:

```python
# qc_check.py — Agent iş kontrol scripti
# Bu script her aşama sonunda çalıştırılır

import subprocess

# 1. Git diff ile hangi dosyalar değişti?
result = subprocess.run(['git', 'diff', '--name-only'], capture_output=True, text=True)
changed_files = result.stdout.strip().split('\n')

# 2. Yasak dosyalar değişti mi?
FORBIDDEN = [
    'app/lib/auth.js',
    'app/lib/edit-system.js',
    'app/app/layout.js',
    'app/next.config.mjs',
    'app/package.json',
]
for f in changed_files:
    if f in FORBIDDEN:
        print(f"⛔ YASAK DOSYA DEĞİŞMİŞ: {f}")
        print("İŞLEM DURDURULMALI!")
        
# 3. Build test
subprocess.run(['npm', 'run', 'build'], cwd='app/')
```

---

## BÖLÜM 2: AGENT ROLLERI ve DETAYLI GÖREVLERİ (3 AGENT)

| Agent | Rol | Kapsam | Kontrol Eden |
|-------|-----|--------|-------------|
| **Agent 1** | 🗄️🔌 Backend | DB + API | Agent 3 |
| **Agent 2** | 🎨🌍 Frontend | UI + Dil (i18n) | Agent 3 |
| **Agent 3** | 🔍 QA | Test + Doğrulama | Koordinatör (Sen) |

---

### AGENT 1: 🗄️🔌 BACKEND AGENT (DB + API)

**🎯 Amaç:** Veritabanı genişletme + Production API'lerini geliştirme
**📁 Dokunacağı Dosyalar:**
  - `app/lib/db.js` (SADECE production_logs bölümü)
  - `app/app/api/production/route.js`
  - `app/app/api/production/[id]/route.js`
**🔒 Kısıtlama:** Diğer tablolara ve API dosyalarına DOKUNMAYACAK
**👀 Kontrol Eden:** Agent 3 (QA)

#### Görev Detayı:

```
ADIM 1: db.js dosyasını aç
ADIM 2: initTables() fonksiyonunu bul
ADIM 3: CREATE TABLE IF NOT EXISTS production_logs içindeki
        mevcut 17 kolonu doğrula (hiçbiri silinmemiş mi?)
ADIM 4: Mevcut kolonlardan SONRA 8 yeni kolon ekle:

   defect_photo TEXT DEFAULT '',
   defect_classification TEXT DEFAULT '',
   first_pass_yield REAL DEFAULT 100,
   oee_score REAL DEFAULT 0,
   takt_time_ratio REAL DEFAULT 0,
   unit_value REAL DEFAULT 0,
   net_work_minutes REAL DEFAULT 0,
   notes TEXT DEFAULT ''

ADIM 5: Migration kodu ekle (mevcut DB için):
   try {
     db.exec("ALTER TABLE production_logs ADD COLUMN defect_photo TEXT DEFAULT ''");
   } catch(e) {} // kolon zaten varsa hata verir, sorun değil
   // ... her yeni kolon için

ADIM 6: Test et — node -e "const db = require('./lib/db'); console.log('OK')"
```

#### Doğrulama Kontrol Listesi:
```
□ Mevcut 17 kolon aynen korunuyor mu?
  id, model_id, operation_id, personnel_id,
  start_time, end_time, total_produced, defective_count,
  defect_reason, defect_source, break_duration_min,
  machine_down_min, material_wait_min, passive_time_min,
  lot_change, quality_score, status, created_at

□ 8 yeni kolon eklendi mi?
□ Default değerler doğru mu?
□ Migration kodu var mı?
□ DB integrity check geçiyor mu?
  → node -e "const db=require('./lib/db'); console.log(db.pragma('integrity_check'))"
□ Diğer tablolar değişmedi mi?
  → git diff app/lib/db.js | grep -E "^[+-]" | grep -v production_logs
  → Bu komut boş olmalı (production_logs dışında değişiklik yok)
```

#### GÖREV BÖLÜM B — API Genişletme

DB kolonları eklendikten sonra API'leri genişlet:

#### Görev Detayı:

```
ADIM 1: GET /api/production GENİŞLETME
  - Mevcut filtreler KALACAK (date, from, to, personnel_id)
  - Yeni 8 alan response'a eklenecek
  - Sayfalama parametreleri eklenecek (limit, offset)

ADIM 2: POST /api/production GENİŞLETME
  - Mevcut zorunlu alanlar KALACAK (model_id, operation_id, personnel_id, start_time)
  - Yeni 8 alan kabul edilecek (opsiyonel)
  - Otomatik hesaplamalar:
    * net_work_minutes = brüt_süre - mola - arıza - bekleme - pasif
    * first_pass_yield = ((üretilen - hatalı) / üretilen) × 100
    * OEE hesaplanacak (basit formül)
    * unit_value = birim_fiyat × üretilen_adet

ADIM 3: PUT /api/production/[id] OLUŞTURMA
  - Mevcut kaydı güncelle
  - Tüm alanlar opsiyonel (sadece gönderilen alanlar güncellenir)
  - Audit trail kaydı oluştur
  - Otomatik hesaplamaları yeniden çalıştır

ADIM 4: DELETE /api/production/[id] DÜZENLEME
  - Hard delete YAPMAYACAK
  - status='deleted' olarak güncelle (soft delete)
  - deleted_at timestamp ekle

ADIM 5: Hata yönetimi:
  - Zorunlu alan eksikse 400 dön
  - Kayıt bulunamazsa 404 dön
  - DB hatası olursa 500 dön + hata mesajı
```

#### API Test Komutları:
```powershell
# GET testi — tüm kayıtlar
curl http://localhost:3000/api/production

# GET testi — tarih filtresi
curl "http://localhost:3000/api/production?date=2026-02-28"

# POST testi — yeni kayıt
curl -X POST http://localhost:3000/api/production `
  -H "Content-Type: application/json" `
  -d '{"model_id":1,"operation_id":1,"personnel_id":1,"start_time":"2026-02-28T09:00:00","total_produced":50,"defective_count":2}'

# PUT testi — güncelleme
curl -X PUT http://localhost:3000/api/production/1 `
  -H "Content-Type: application/json" `
  -d '{"total_produced":55,"quality_score":95}'

# DELETE testi — soft delete
curl -X DELETE http://localhost:3000/api/production/1
```

#### Doğrulama Kontrol Listesi:
```
□ GET mevcut filtrelerle çalışıyor mu?
□ GET yeni alanları döndürüyor mu?
□ POST zorunlu alan kontrolü yapıyor mu?
□ POST otomatik hesaplamalar doğru mu?
□ PUT sadece gönderilen alanları güncelliyor mu?
□ DELETE soft-delete yapıyor mu (status='deleted')?
□ Hata durumları doğru HTTP kodu dönüyor mu?
□ Mevcut diğer API'ler çalışıyor mu (regression test)?
  → curl http://localhost:3000/api/models
  → curl http://localhost:3000/api/personnel
  → curl http://localhost:3000/api/machines
  → Üçü de 200 OK ve mevcut veri dönmeli
```

---

### AGENT 2: 🎨🌍 FRONTEND AGENT (UI + Dil)

**🎯 Amaç:** Üretim paneli UI + Türkçe/Arapça çeviri key'leri
**📁 Dokunacağı Dosyalar:**
  - `app/app/page.js` (SADECE `activeSection === 'production'` bölümü)
  - `app/lib/i18n.js` (SADECE yeni key ekleme)
  - `app/app/globals.css` (SADECE yeni CSS class ekleme)
**🔒 Kısıtlama:** Diğer panel kodlarına ve mevcut key'lere DOKUNMAYACAK
**👀 Kontrol Eden:** Agent 3 (QA)

#### Tasarım Kuralları (Mevcut Panellerden Kopyalanacak):

```
RENK PALETİ (globals.css'den):
  --primary: koyu yeşil (sidebar)
  --accent: vurgu rengi
  --text: metin rengi
  --text-muted: ikincil metin
  --bg: arka plan
  --card-bg: kart arka planı
  --border: kenarlık rengi

BILEŞEN PATTERNLERİ (mevcut koddan):
  Stat kartları: className="stat-card" + stat-icon + stat-value + stat-label
  Form alanları: EditableField bileşeni (label, value, onChange, clear butonu)
  Dropdown: EditableSelect bileşeni
  Tablolar: className="data-table"
  Modal: className="modal" + "modal-content"
  Butonlar: className="btn btn-primary" / "btn btn-danger"

RESPONSIVE:
  2 kolonlu grid → tek kolon (mobil)
  Tablo → yatay scroll (mobil)
  Butonlar → tam genişlik (mobil)
```

#### Görev Adımları:

```
ADIM 1: State tanımlamaları (production bölümüne)
  - productionLogs: []  → API'den gelen kayıtlar
  - activeSession: null  → aktif üretim oturumu
  - productionForm: {}   → yeni kayıt form durumu
  - editingLog: null      → düzenlenen kayıt

ADIM 2: API çağrıları (useEffect ve fonksiyonlar)
  - fetchProductionLogs()  → GET /api/production
  - startProduction()      → POST /api/production
  - updateProduction()     → PUT /api/production/[id]
  - deleteProduction()     → DELETE /api/production/[id]

ADIM 3: UI Bölüm 1 — Başlık
  - "🏭 Üretim Takip" başlığı
  - "+ Yeni Üretim" butonu

ADIM 4: UI Bölüm 2 — Stat Kartları (4 adet)
  - 📦 Bugün Üretilen (toplam adet)
  - ✅ Kalite Oranı (ortalama FPY)
  - ❌ Toplam Hata (bugünkü hata adedi)
  - 📊 OEE Ortalaması (bugünkü ortalama)

ADIM 5: UI Bölüm 3 — Aktif Üretim Paneli
  - Aktif oturum varsa tam formu göster
  - 21 kriter giriş alanı
  - Her alanda ❌ temizle butonu
  - Otomatik hesaplama alanları (readonly)
  - [İptal] [Kaydet] [Tamamla] butonları

ADIM 6: UI Bölüm 4 — Yeni Üretim Başlatma
  - Model seçimi (dropdown, API'den)
  - İşlem seçimi (modele bağlı dropdown)
  - Personel seçimi (dropdown, API'den)
  - [⏱️ Başlat] butonu

ADIM 7: UI Bölüm 5 — Bugünün Kayıtları
  - Tablo: Model | İşlem | Kişi | Adet | Hata | Kalite | Süre
  - Her satırda [✏️ Düzenle] [🗑️ Sil]
  - Boş durum: "Henüz üretim kaydı yok" mesajı

ADIM 8: Düzenleme Modal'ı
  - Mevcut kayıt verileriyle dolu form
  - [Kaydet] [İptal] butonları
```

#### Doğrulama Kontrol Listesi:
```
□ Üretim paneli tarayıcıda açılıyor mu?
□ 4 stat kartı doğru veri gösteriyor mu?
□ Model/İşlem/Personel dropdown'ları API'den veri çekiyor mu?
□ Model seçince işlemler filtreleniyor mu?
□ "Başlat" butonu yeni kayıt oluşturuyor mu?
□ Üretilen adet, hatalı adet girilebiliyor mu?
□ Her alanda ❌ temizle butonu var mı ve çalışıyor mu?
□ Otomatik hesaplamalar anlık güncelleniyor mu?
□ "Tamamla" butonu kayıt oluşturuyor mu?
□ Kayıt tablosunda veriler görünüyor mu?
□ Düzenle butonu modal açıyor mu?
□ Sil butonu soft-delete yapıyor mu?
□ Boş durum mesajı görünüyor mu?
□ Responsive → telefon/tablet boyutunda çalışıyor mu?
□ DİĞER PANELLER BOZULMADI MI?
  → Siparişler paneli açılıyor mu?
  → Modeller paneli açılıyor mu?
  → Personel paneli açılıyor mu?
  → Makineler paneli açılıyor mu?
  → Prim & Ücret paneli açılıyor mu?
  → Raporlar paneli açılıyor mu?
```

#### GÖREV BÖLÜM B — Dil Desteği (i18n)

UI oluşturulduktan sonra çeviri key'lerini ekle:

#### Eklenecek Key'ler (Minimum 45 Key):

```javascript
// SÜREÇ
production_tracking: { tr: 'Üretim Takip', ar: 'تتبع الإنتاج' },
new_production: { tr: 'Yeni Üretim', ar: 'إنتاج جديد' },
start_production: { tr: 'Üretimi Başlat', ar: 'بدء الإنتاج' },
end_production: { tr: 'Üretimi Bitir', ar: 'إنهاء الإنتاج' },
select_model: { tr: 'Model Seçin', ar: 'اختر الموديل' },
select_operation: { tr: 'İşlem Seçin', ar: 'اختر العملية' },
select_personnel: { tr: 'Personel Seçin', ar: 'اختر الموظف' },
total_produced: { tr: 'Üretilen Adet', ar: 'العدد المنتج' },
defective_count: { tr: 'Hatalı Adet', ar: 'العدد المعيب' },
defect_reason: { tr: 'Hata Nedeni', ar: 'سبب الخطأ' },
defect_source: { tr: 'Hata Kaynağı', ar: 'مصدر الخطأ' },
lot_change: { tr: 'Lot Değişimi', ar: 'تغيير الدفعة' },
status_active: { tr: 'Aktif', ar: 'نشط' },
status_completed: { tr: 'Tamamlandı', ar: 'مكتمل' },
status_paused: { tr: 'Beklemede', ar: 'في الانتظار' },
status_cancelled: { tr: 'İptal', ar: 'ملغى' },

// ZAMAN
break_time: { tr: 'Mola Süresi (dk)', ar: 'وقت الاستراحة (دقيقة)' },
machine_downtime: { tr: 'Makine Arıza (dk)', ar: 'تعطل الآلة (دقيقة)' },
material_wait: { tr: 'Malzeme Bekleme (dk)', ar: 'انتظار المواد (دقيقة)' },
passive_time: { tr: 'Pasif Süre (dk)', ar: 'الوقت الخامل (دقيقة)' },
net_work_time: { tr: 'Net Çalışma', ar: 'صافي العمل' },

// KALİTE
first_pass_yield: { tr: 'İlk Geçiş Oranı', ar: 'نسبة النجاح الأول' },
quality_score: { tr: 'Kalite Puanı', ar: 'نقاط الجودة' },
defect_photo: { tr: 'Hata Fotoğrafı', ar: 'صورة الخطأ' },

// HATA TİPLERİ
defect_stitch: { tr: 'Dikiş Hatası', ar: 'خطأ الخياطة' },
defect_cut: { tr: 'Kesim Hatası', ar: 'خطأ القص' },
defect_fabric: { tr: 'Kumaş Hatası', ar: 'خطأ القماش' },
defect_thread: { tr: 'İplik Hatası', ar: 'خطأ الخيط' },
defect_design: { tr: 'Tasarım Hatası', ar: 'خطأ التصميم' },
defect_other: { tr: 'Diğer', ar: 'أخرى' },

// HATA KAYNAKLARI
source_operator: { tr: 'Operatör Hatası', ar: 'خطأ المشغل' },
source_machine: { tr: 'Makine Hatası', ar: 'خطأ الآلة' },
source_material: { tr: 'Malzeme Hatası', ar: 'خطأ المواد' },
source_design: { tr: 'Tasarım Hatası', ar: 'خطأ التصميم' },

// PERFORMANS
unit_time: { tr: 'Birim Süre', ar: 'وقت الوحدة' },
oee_score: { tr: 'OEE Skoru', ar: 'نقاط OEE' },
takt_time: { tr: 'Takt Uyumu', ar: 'توافق التاكت' },
operation_value: { tr: 'İşlem Değeri', ar: 'قيمة العملية' },

// BUTONLAR
save_record: { tr: 'Kaydet', ar: 'حفظ' },
update_record: { tr: 'Güncelle', ar: 'تحديث' },
delete_record: { tr: 'Sil', ar: 'حذف' },
cancel: { tr: 'İptal', ar: 'إلغاء' },
clear_field: { tr: 'Temizle', ar: 'مسح' },
complete_and_close: { tr: 'Tamamla & Kapat', ar: 'إكمال وإغلاق' },
no_production_yet: { tr: 'Henüz üretim kaydı yok', ar: 'لا يوجد سجل إنتاج بعد' },
```

#### Doğrulama:
```
□ 45+ yeni key eklendi mi?
□ Tüm key'lerde hem tr hem ar var mı?
□ Mevcut key'ler değişmedi mi?
  → git diff app/lib/i18n.js | grep "^-" | grep -v "^---"
  → Silinen satır OLMAMALI
□ Key format (camelCase) mevcut key'lerle uyumlu mu?
```

---

### AGENT 3: 🔍 QA AGENT (Kalite Kontrol)

**🎯 Amaç:** Agent 1 ve Agent 2'nin işlerini doğrula
**📁 Yetkisi:** Tüm dosyaları OKUMA + test çalıştırma (yazma yok)
**👀 Kontrol Eden:** Koordinatör (İnsan — Sen)

#### Her Aşama Sonrası Kontrol Sırası:

```
═══ AGENT 1 SONRASI (Backend kontrolü) ═══

1. Git diff: SADECE db.js + api/production/ değişmiş olmalı
2. DB integrity: node -e "require('./lib/db')" → hatasız
3. Mevcut veri: models=1, personnel=2 kaybolmamış mı?
4. API regression: /api/models, /api/personnel, /api/machines → 200
5. Production API: GET/POST/PUT/DELETE çalışıyor mu?

═══ AGENT 2 SONRASI (Frontend kontrolü) ═══

6. Build: npm run build → hatasız
7. Browser: Üretim paneli açılıyor mu? 21 kriter görünüyor mu?
8. CRUD: Yazma/düzeltme/silme butonları çalışıyor mu?
9. i18n: Türkçe + Arapça key'ler doğru mu?
10. Regression: Diğer paneller (Sipariş, Model, Personel) bozulmamış mı?

═══ GENEL KONTROL ═══

11. python test_all_outputs.py → %100 sağlık
12. git status → clean working tree
```

---

## BÖLÜM 3: İŞLEM SIRASI ve ZAMAN ÇİZELGESİ

```
Cumartesi Günü İş Planı (3 Agent):
═══════════════════════════════════

09:00 — PROJEYİ DİZÜSTÜ BİLGİSAYARA AKTAR
         └→ Bölüm 0'daki adımları izle
         └→ Doğrulama kontrol listesini tamamla

09:30 — AŞAMA 1: Agent 1 (Backend) çalıştır
         └→ DB: production_logs'a 8 kolon ekle
         └→ API: GET/POST genişlet, PUT/DELETE ekle
         └→ Agent 3 (QA): Backend kontrolü yap
         └→ ✅ geçerse devam, ❌ ise düzelt

12:00 — ÖĞLE MOLASI

13:00 — AŞAMA 2: Agent 2 (Frontend) çalıştır
         └→ UI: Üretim paneli oluştur (21 kriter + CRUD)
         └→ i18n: 45+ Türkçe/Arapça çeviri key'i ekle
         └→ Agent 3 (QA): Frontend + dil kontrolü yap
         └→ ✅ geçerse devam, ❌ ise düzelt

16:00 — AŞAMA 3: Agent 3 (QA) entegrasyon testi
         └→ Tam test süiti çalıştır
         └→ test_all_outputs.py
         └→ Tüm paneller çalışıyor mu?

17:00 — AŞAMA 4: Git commit & push
         └→ git add -A
         └→ git commit -m "Üretim penceresi: 21 kriter + CRUD"
         └→ git push origin main

17:30 — BİTİŞ ✅
```

---

## BÖLÜM 4: SORUN GİDERME

### Sık Karşılaşılabilecek Sorunlar

| Sorun | Çözüm |
|-------|-------|
| `npm install` hata veriyor | Node.js versiyonu kontrol et (v18+) |
| `npm run dev` port kullanılıyor | `netstat -aon | findstr :3000` ile PID bul, kapat |
| DB dosyası kilitli | Dev server'ı kapat, tekrar başlat |
| Git push reddediliyor | `git pull origin main` ile güncelledikten sonra push et |
| Mevcut panel bozuldu | `git checkout -- app/app/page.js` ile geri al |
| Build hatası | Hata mesajını oku, ilgili satırı düzelt |
| API 500 hatası | `npm run dev` konsolundaki hata mesajını oku |

---

## BÖLÜM 5: BAŞARI KRİTERLERİ

Tüm işlemler tamamlandığında şunlar sağlanmış olmalı:

```
✅ 21 kriter üretim panelinde görünüyor
✅ Her kriterde yazma/düzeltme/silme butonları çalışıyor
✅ Otomatik hesaplamalar (FPY, OEE, birim süre) doğru çalışıyor
✅ Yeni üretim başlatılabiliyor
✅ Mevcut kayıt düzenlenebiliyor
✅ Kayıt silinebiliyor (soft delete)
✅ Türkçe label'lar doğru görünüyor
✅ Arapça label'lar doğru görünüyor
✅ Mevcut panellerin HİÇBİRİ bozulmamış
✅ npm run build hatasız
✅ test_all_outputs.py → %100 sağlık
✅ Git commit & push tamamlanmış
```
