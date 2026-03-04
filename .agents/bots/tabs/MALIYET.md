# 💰 MALİYET SEKMESİ — YOL HARİTASI
>
> Son güncelleme: 2026-03-03 | Sistem kaybında bu dosyadan yeniden inşa edilebilir.

---

## ⚠️ ANTİGRAVİTY ANALİZ NOTU (2026-03-03)

Dosya genel yapisi iyi. Tespit edilen 5 kritik eksik aşağıda işlendi:

| # | Eksik | Önem | Düzeltime |
|---|-------|------|----------|
| 1 | Prim formülü vizyon ile örtüşmüyor (havuz % yerine Katkı>Maaş prensibi) | Kritik | Sekme 5 güncellendi |
| 2 | Fason maliyet gider kalemi yok | Yüksek | Sekme 1 + Sekme 2'ye eklendi |
| 3 | Katkı Değeri vs Maaş Maliyeti karşılaştırması yok | Kritik | Sekme 3'e eklendi |
| 4 | Personelin kendi verisini görememe sorunu | Kritik | Sekme 3'e self-serve görünüm eklendi |
| 5 | Karar karşılaştırma / sistem öğrenimi bağlantısı yok | Orta | Sekme 6'ya eklendi |

---

## 📌 GENEL AMAÇ

Üretim bölümünün tüm maliyet kalemlerini, personel verimlilik skorlarını,
aylık kâr/zarar durumunu ve prim sistemini tek bir sekmede yöneten modül.

**Ana Soru:** "Bu ay işletme kâr mı etti, zarar mı? Neden? Kim katkı sağladı, kim değil?"

**Vizyon Prensibi:** Her çalışan işletmenin kar ortağıdır.
Prim = Katkı Değeri > Maaş Maliyeti ise otomatik hakkedilir.
Personel kendi primini ve formulünü görebilir (seffaflik).

## 🗂️ DOSYA YAPISI

```
app/
├── app/
│   └── page.js                        ← Maliyet UI (costs case bloğu)
├── api/
│   ├── costs/route.js                 ← Model bazlı hammadde maliyeti (MEVCUT)
│   ├── expenses/route.js              ← Aylık gider CRUD (MEVCUT)
│   ├── isletme-gider/route.js         ← Kira/elektrik/su (MEVCUT)
│   ├── personnel/route.js             ← Personel + maaş (MEVCUT)
│   ├── production/route.js            ← Üretim adet + hata (MEVCUT)
│   └── prim/route.js                  ← Prim hesaplama (YAZILACAK)
├── lib/
│   └── maliyet-hesap.js               ← Ortak hesaplama fonksiyonları (YAZILACAK)
.agents/
└── bots/tabs/MALIYET.md               ← Bu dosya (YOL HARİTASI)
```

---

## 🔧 KULLANILAN TEKNOLOJİLER

| Teknoloji | Kullanım Yeri |
|---|---|
| **Next.js 16 (App Router)** | Tüm sayfa ve API rotaları |
| **SQLite / better-sqlite3** | Yerel veritabanı — tüm tablolar |
| **React useState / useEffect** | UI state yönetimi |
| **Web Speech API** | Sesli giriş (SpeechRecognition) |
| **`useVoiceInput` hook** | TR+AR+genişletilebilir dil desteği |
| **CSS Variables** | Tema renkleri (var(--accent), var(--danger) vb.) |
| **fetch API** | Her bölüm için REST çağrıları |
| **Supabase** | Yedek/bulut senkronizasyon (göç planında) |

---

## 📊 VERİTABANI TABLOLARI

### Mevcut (Kullanılacak)

```sql
-- Personel maaş bilgisi
personnel (id, name, salary, position, ...)

-- Üretim verisi
production (id, personnel_id, model_id, total_produced, defective_count, date, ...)

-- İşletme sabit giderleri
isletme_giderleri (id, ay, yil, elektrik, su, kira, yakit, diger,
                   toplam_personel_maliyeti, saatlik_maliyet, ...)

-- Aylık genel gider
business_expenses (id, category, description, amount, year, month, is_recurring, ...)

-- Model hammadde maliyeti
cost_entries (id, model_id, category, description, amount, unit, quantity, total, ...)

-- Model operasyonları (birim fiyat)
model_operations (id, model_id, name, unit_price, machine_type, difficulty, ...)
```

### Yeni Oluşturulacak

```sql
-- Prim kayıtları
CREATE TABLE IF NOT EXISTS prim_kayitlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personel_id INTEGER NOT NULL,
    ay INTEGER NOT NULL,
    yil INTEGER NOT NULL,
    verimlilik_skoru REAL DEFAULT 0,
    prim_tutari REAL DEFAULT 0,
    havuz_orani REAL DEFAULT 10,  -- Net karin yüzdesi
    onay_durumu TEXT DEFAULT 'bekliyor',  -- bekliyor / onaylandi / odendi
    onaylayan TEXT,
    odeme_tarihi DATE,
    notlar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(personel_id, ay, yil)
);

-- Aylık kâr/zarar özeti
CREATE TABLE IF NOT EXISTS kar_zarar_ozet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ay INTEGER NOT NULL,
    yil INTEGER NOT NULL,
    toplam_gelir REAL DEFAULT 0,
    hammadde_gider REAL DEFAULT 0,
    iscilik_gider REAL DEFAULT 0,
    sabit_gider REAL DEFAULT 0,
    brut_kar REAL DEFAULT 0,
    net_kar REAL DEFAULT 0,
    kar_marji_yuzde REAL DEFAULT 0,
    durum TEXT DEFAULT 'taslak',  -- taslak / onaylandi
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ay, yil)
);
```

---

## 🎯 6 ALT SEKME — GÖREV LİSTESİ VE İŞLEM SIRASI

---

### SEKME 1: 📥 İşletme Giderleri

**Amaç:** Aylık tüm giderleri kayıt altına al, toplam işçilik maliyetini hesapla.

#### Görevler

- [ ] Ay/Yıl seçici (dropdown)
- [ ] Sabit giderler formu: Kira, Elektrik, Su, İnternet, Sigorta
- [ ] Değişken giderler formu: Bakım-onarım, Kargo, Sarf malzeme, Diğer
- [ ] **Maaş toplamı** → `/api/personnel` dan otomatik çek
- [ ] **SGK işveren payı** → Brüt maaş × %22.5 otomatik hesapla
- [ ] **Gelir vergisi stopajı** → Kademeli tablo ile otomatik hesapla
- [ ] **FASON MALİYETİ** → fason_orders tablosundan o aya ait toplam fason gideri (YENİ)
- [ ] **Tekrarlayan gider kopya** → `is_recurring=true` olan giderleri sonraki aya kopya
- [ ] Her alana 🎤 ses girişi butonu (TR/AR toggle)
- [ ] Kaydet → `/api/isletme-gider` POST
- [ ] Geçmiş aylar listesi

#### Ses Akışı

```
[🎤] → Dinliyor (TR veya AR) → Metin alana yazılır →
[✅ Doğrula] → Sayısal alan kontrolü → Kaydet
```

#### API Çağrıları

```
GET  /api/isletme-gider?ay=3&yil=2026
POST /api/isletme-gider  { ay, yil, elektrik, su, kira, ... }
GET  /api/personnel       → maaş toplamı için
GET  /api/expenses?year=2026&month=3
POST /api/expenses        { category, description, amount, is_recurring }
```

---

### SEKME 2: 🧵 Model & Operasyon Maliyeti

**Amaç:** Her model için ürün başı maliyeti hesapla. Ön maliyet vs gerçekleşen karşılaştır.

#### Görevler

- [ ] Model seçici dropdown (Modeller sekmesinden)
- [ ] **Kumaş maliyeti:** metre × ₺/m × (1 + fire%) — ses girişi
- [ ] **Aksesuar kalemleri:** kalem ekle/sil sistemi (düğme, fermuar, etiket vb.) — ses girişi
- [ ] **İplik / sarf:** Manuel giriş — ses girişi
- [ ] **FASON MALİYETİ:** O model için verilmiş fason sipariş bedelini maliyet olarak yansıt (fason_orders JOIN cost_entries) (YENİ)
- [ ] **Operasyon işçilik:** model_operations birim_fiyat × üretilen adet (otomatik)
- [ ] **Genel gider payı:** İşletme gideri ÷ toplam üretim adedi (otomatik)
- [ ] **Ön maliyet girişi** → sipariş öncesi tahmin (manuel) — ses girişi
- [ ] **Gerçekleşen maliyet** → üretim sonrası otomatik hesap
- [ ] **Sapma göstergesi** → Gerçekleşen − Ön (renk kodlu)
- [ ] **Fason fiyat önerisi** → Birim maliyet × (1 + kâr marjı%)
- [ ] Kaydet → `/api/costs` POST

#### Hesaplama Formülü

```
Birim Maliyet =
  (Kumaş m × ₺/m × (1 + fire%/100))
  + Aksesuar toplamı
  + İplik/Sarf
  + (Toplam operasyon birim fiyat / üretilen adet)
  + (Aylık işletme gideri / toplam üretim adedi)
```

---

### SEKME 3: 👥 Personel Maliyet & Verimlilik

**Amaç:** Her personelin aylık gerçek maliyetini ve verimlilik skorunu göster.

#### Görevler

- [ ] Tüm personel listesi `/api/personnel` dan çek
- [ ] Her personel için aylık üretim verisi `/api/production` dan çek
- [ ] **Çalışılan saat** → `/api/personel-saat` tan hesapla
- [ ] **Brüt maaş** → personel profilinden
- [ ] **Gerçek maliyet** → Brüt + (Brüt × 0.225) SGK
- [ ] **FPY** hesapla → (Toplam − Hatalı) ÷ Toplam × 100
- [ ] **Saat başı üretim** → Adet ÷ Çalışılan saat
- [ ] **Birim başı maliyet** → Gerçek maliyet ÷ Üretilen adet
- [ ] **Verimlilik skoru** → Adet × FPY ÷ 100
- [ ] **KATKI DEĞERİ** → SUM(uretilen_adet × birim_deger × (1 - hata_orani)) (YENİ - VIZYON FORMULÜ)
- [ ] **KATKI vs MAAŞ KARSI** → Katkı Değeri > Maaş Maliyeti mi? (YENİ)
  - EVET: 🟢 Prim hakediyor — prim tutarını göster
  - HAYIR: 🔴 Bu ay prim yok — farkı göster
- [ ] **SELF-SERVE GÖRÜNÜM** → Personel kendi sekmesini görebilir (yalnızca kendi verisi) (YENİ)
- [ ] Renk kodlu kart: En iyi 🟢 / Orta 🟡 / Düşük 🔴
- [ ] Ay seçici

---

### SEKME 4: 📊 Kar / Zarar Aylık Dashboard

**Amaç:** Tüm verileri birleştir, net kâr/zarar ve sinyal göster.

#### Görevler

- [ ] Ay/yıl seçici
- [ ] **Gelir** → Siparişler tablosundan tamamlanan sipariş × birim fiyat
- [ ] **Hammadde gideri** → cost_entries toplamı
- [ ] **İşçilik gideri** → Personel toplam (brüt + SGK)
- [ ] **Sabit gider** → business_expenses + isletme_giderleri toplamı
- [ ] Otomatik hesap: Brüt Kâr → Net Kâr → Kâr Marjı %
- [ ] **Başa baş adet** → Toplam Gider ÷ Ortalama Birim Maliyet
- [ ] **Renk sinyali kartı** → 🟢 Kâr / 🟡 Başa baş / 🔴 Zarar
- [ ] **Müşteri bazlı kârlılık** → Sipariş join müşteri adı
- [ ] **Sezon karşılaştırması** → Bu ay / Geçen ay / Geçen yıl
- [ ] Kaydet → `/api/kar-zarar-ozet` (yeni endpoint)

---

### SEKME 5: 🏆 Prim Sistemi

**Amaç:** Verimli personeli adil ve şeffaf şekilde ödüllendirmek.
**Vizyon:** Her çalışan işletmenin kar ortağıdır. Prim hak edildiğinde otomatik hesaplanır, personel formulü görür.

#### Görevler

- [ ] **KATKI-MAAS KONTROLÜ** (YENİ - VIZYON PRENSiBi)

  ```
  Katkı Değeri = SUM(uretilen_adet x birim_deger x (1 - hata_orani))
  Maaş Maliyeti = baz_maas + yol + yemek + sgk_prim
  
  Katkı > Maaş ise: Prim = (Katkı - Maaş) x Prim Oranı%
  Değilse: Bu ay prim yok (açıklama gösterilir)
  ```

- [ ] Yalmz Net Kâr > 0 olduğunda prim ödeme onayı aktif
- [ ] **Prim oranı %** → Analiz + veri ile belirlenir (yönetici girer)
- [ ] **Kıdem puanı** → yönetici tanımlar
- [ ] **Devamsızlık kesintisi** → gün başı belirlenen kesinti
- [ ] **Kalite ihlali kesintisi** → aşırı hata için
- [ ] **PRiM KARTELASı** → Personel kendi prim tablosunu görür: (YENİ)
  - Katkı Değeri (TL)
  - Maaş Maliyeti (TL)
  - Prim Tutarı (TL) veya "Bu ay prim kazanilmadi"
  - Formül açıklaması (neden bu kadar?)
  - Geçen aya göre değişim
- [ ] Yönetici onay butonu → Onay → durum = onaylandi
- [ ] Ödendi işareti → durum = odendi → personel kartına yansır
- [ ] API: `/api/prim` GET/POST/PUT (YAZILACAK)

---

### SEKME 6: 🔍 Zarar / Sapma Analizi

**Amaç:** Eksi çıkan aylarda nedeni bul, sorumlu eşlaştır ve sisteme öğret.

#### Görevler

- [ ] **En maliyetli model** → cost_entries birim maliyet sıralaması
- [ ] **En çok hata yapan personel** → defective_count sıralı liste
- [ ] **Bütçe aşan gider kalemleri** → planlanan vs gerçekleşen
- [ ] **Darboğaz operasyon** → hata oranı yüksek işlemler
- [ ] **Fire oranı analizi** → hammadde israfı
- [ ] **Müşteri kârlılık tablosu** → hangi müşteri zarar ettirdi
- [ ] **KARAR KARSILASTIRMA BAĞLANTISI** (YENİ - VIZYON)
  - Sistem bu ay ne önerdi? (uyarı / karar)
  - Yönetici ne yaptı?
  - Sonuç ne oldu? (kar/zarar)
  - Fark analizi not satırı → bilgi havuzuna kayd

---

## 🎤 SES GİRİŞİ MİMARİSİ

### Mevcut Altyapı (Kullanılacak)

```js
// page.js satır 12-86 — useVoiceInput hook
function useVoiceInput(formSetter) {
  const [voiceLang, setVoiceLang] = useState('tr-TR');
  const toggleLang = () => setVoiceLang(v => v === 'tr-TR' ? 'ar-SA' : 'tr-TR');
  // ...
}
```

### Genişletilecek Dil Yapısı

```js
// Maliyet sekmesine eklenecek
const DESTEKLENEN_DILLER = [
  { code: 'tr-TR', flag: '🇹🇷', label: 'Türkçe' },   // Birincil
  { code: 'ar-SA', flag: '🇸🇦', label: 'العربية' },   // İkincil
  // İleride eklenebilir:
  // { code: 'en-US', flag: '🇺🇸', label: 'English' }
];
```

### Her Alana Ses Akışı

```
🎤 Butona bas → Seçili dilde dinle →
Metin input alanına yaz →
[✅] Doğrula → Tip kontrolü (sayı/metin) →
Hata yoksa kaydet / Hata varsa ⚠️ uyar
```

---

## 📐 SGK & VERGİ HESAPLAMA

```js
// lib/maliyet-hesap.js — Yazılacak
export function personelGercekMaliyet(brutMaas) {
  const sgkIsverenPayi = brutMaas * 0.225;  // %22.5
  // Gelir vergisi kademeli — basit tahmini
  const gvStopaj = brutMaas * 0.15;          // yaklaşık %15
  return brutMaas + sgkIsverenPayi + gvStopaj;
}

export function toplamIscilikGideri(personelListesi) {
  return personelListesi.reduce((t, p) => t + personelGercekMaliyet(p.salary), 0);
}

export function birimMaliyet({ hammadde, iscilik, sabitGider, uretimAdedi }) {
  return (hammadde + iscilik + sabitGider) / uretimAdedi;
}

export function netKar({ gelir, hammadde, iscilik, sabitGider }) {
  return gelir - hammadde - iscilik - sabitGider;
}

export function verimlilikSkoru({ adet, hata }) {
  const fpy = adet > 0 ? ((adet - hata) / adet) * 100 : 0;
  return adet * fpy / 100;
}
```

---

## 📋 İŞLEM SIRASI (UYGULAMA PLANI)

```
AŞAMA 1 — Altyapı (önce bunlar)
  ├── lib/maliyet-hesap.js yaz (SGK, net kâr, birim maliyet formülleri)
  ├── prim_kayitlari tablosunu oluştur
  └── kar_zarar_ozet tablosunu oluştur

AŞAMA 2 — UI Sekmeleri (sıraya göre)
  ├── Sekme 1: İşletme Giderleri formu
  ├── Sekme 2: Model & Operasyon Maliyeti
  ├── Sekme 3: Personel Verimlilik tablosu
  ├── Sekme 4: Kar/Zarar Dashboard
  ├── Sekme 5: Prim Sistemi
  └── Sekme 6: Sapma Analizi

AŞAMA 3 — Ses Entegrasyonu
  ├── DESTEKLENEN_DILLER array ekle
  ├── Her forma useVoiceInput hook bağla
  └── Doğrulama akışı (tip kontrolü + kaydet)

AŞAMA 4 — Yeni API
  └── /api/prim route.js yaz

AŞAMA 5 — Test & Doğrulama
  ├── SGK hesabı kontrol et
  ├── Prim dağılımı kontrol et
  └── Ses girişi TR+AR test et
```

---

## 🔒 YETKi VE SEFFAFLIK KURALLARI

| Rol | Görebileçekleri |
|-----|------------------|
| koordinator | Tüm sekmeler, tüm personel |
| ustabasi | Sekme 1-4-6 (gider, kâr, analiz) |
| muhasip | Sekme 1-2-3-4-5-6 (tam mali erişim) |
| personel | YALNIZCA kendi prim kartelası (Sekme 5 self-serve) |

Kural: Personel başkasının verisini göremez. Kendi prim formulünü görür.

---

## ⚡ HIZLI REFERANS (GÜNCELLENMIŞ)

| Değer | Formül |
|---|---|
| SGK işveren | Brüt × 0.225 |
| Gerçek işçilik | Brüt + SGK |
| FPY | (Toplam − Hatalı) ÷ Toplam × 100 |
| **Katkı Değeri** | **SUM(adet × birim_değer × (1-hata_oranı))** |
| Birim maliyet | (Hammadde + İşçilik + Sabit) ÷ Adet |
| Net Kâr | Gelir − Hammadde − İşçilik − Sabit |
| Kâr marjı | Net Kâr ÷ Gelir × 100 |
| Verimlilik skoru | Adet × FPY ÷ 100 |
| Başa baş adet | Toplam Gider ÷ Birim Maliyet |
| **Prim** | **Katkı > Maaş ise: (Katkı - Maaş) × Prim %** |

---

## 🔗 BAĞIMLI MODÜLLER

- **Modeller** → Operasyon birim fiyatları
- **Personel** → Maaş bilgisi
- **Üretim Aşaması** → Adet ve hata verileri
- **Fason** → Dış işçilik maliyeti (YENİ bağlantı)
- **Siparışler** → Satış geliri
- **Rapor & Analiz** → Bu sekmeden beslenir

---

*Bu dosya sistem kaybı durumunda Maliyet sekmesini sıfırdan inşa etmek için yeterli bilgiyi içerir.*
