# MİMARİ TASARIM: TEKSTİL ÜRETİM YÖNETİM SİSTEMİ

## Tarih: 2026-02-22
## Durum: Mimari Analiz ve Öneri

---

## 1. GENEL MİMARİ YAKLAŞIM

### 1.1 Temel Prensipler
- **Basit başla, büyü** (Start Simple, Scale Later)
- **Web tabanlı** → Her cihazdan erişilebilir (bilgisayar, tablet, telefon)
- **Modüler yapı** → Her özellik bağımsız modül olarak geliştirilir
- **Çok kullanıcılı** → Operatör, yönetici, patron aynı anda kullanabilir
- **Mobil uyumlu** → Responsive tasarım + PWA (Progressive Web App)
- **Çok dilli** → Türkçe (ana) + Arapça + genişletilebilir

### 1.2 Aşamalı Geliştirme Planı

```
AŞAMA 1 (MVP - İlk Sürüm)
├── Ürün/Model tanımlama
├── İşlem kayıt (video + ses + yazı)
├── Basit operatör paneli (tablet)
├── Basit yönetici paneli
└── Türkçe dil desteği

AŞAMA 2 (Otomasyon Başlangıcı)
├── Kamera entegrasyonu
├── Ses → Yazı otomatik çevirisi
├── Ara kontrol sistemi
├── Zaman takibi (başla/bitir)
└── Arapça dil desteği

AŞAMA 3 (Performans & Maliyet)
├── Ücret hesaplama motoru
├── Zorluk derecesi bazlı değerlendirme
├── Prim hesaplama sistemi
├── Günlük/haftalık/aylık raporlar
└── Performans dashboardları

AŞAMA 4 (Tam Otomasyon)
├── AI destekli kalite kontrol (görüntü karşılaştırma)
├── Otomatik işletme uygunluk analizi
├── Gerçek zamanlı üretim izleme
├── İleri düzey analitik ve tahminleme
└── Ek dil destekleri
```

---

## 2. SİSTEM MİMARİSİ (Teknik)

### 2.1 Genel Görünüm

```
┌─────────────────────────────────────────────────────────────────┐
│                    KULLANICI KATMANI                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Operatör │  │   Yönetici   │  │   Patron  │  │   Model   │  │
│  │ Tableti  │  │   Paneli     │  │  Dashboard│  │  Makinacı │  │
│  │ (Makine  │  │ (Bilgisayar/ │  │ (Raporlar │  │  Tableti  │  │
│  │  başı)   │  │   Tablet)    │  │  Analiz)  │  │ (Kayıt)   │  │
│  └────┬─────┘  └──────┬───────┘  └─────┬─────┘  └─────┬─────┘  │
│       │               │               │               │         │
└───────┼───────────────┼───────────────┼───────────────┼─────────┘
        │               │               │               │
        ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API KATMANI                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Web Sunucusu (REST API)                      │   │
│  │  /api/models     → Ürün/Model yönetimi                   │   │
│  │  /api/operations  → İşlem yönetimi                        │   │
│  │  /api/production  → Üretim takibi                         │   │
│  │  /api/quality     → Kalite kontrol                        │   │
│  │  /api/performance → Performans & ücret                    │   │
│  │  /api/media       → Video/ses/fotoğraf                    │   │
│  │  /api/reports     → Raporlama                             │   │
│  │  /api/auth        → Kullanıcı giriş/yetki                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           WebSocket Sunucusu (Gerçek Zamanlı)             │   │
│  │  → Canlı üretim durumu                                    │   │
│  │  → Anlık bildirimler                                      │   │
│  │  → Kamera canlı görüntü                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    İŞ MANTIĞI KATMANI                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │   Model &  │ │   Üretim   │ │  Kalite    │ │ Performans │   │
│  │   İşlem    │ │   Takip    │ │  Kontrol   │ │  & Ücret   │   │
│  │   Modülü   │ │   Modülü   │ │  Modülü    │ │  Modülü    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │   Medya    │ │    Dil     │ │  Bildirim  │ │  Raporlama │   │
│  │  İşleme    │ │  Çeviri    │ │   Sistemi  │ │   Modülü   │   │
│  │  Modülü    │ │  Modülü    │ │            │ │            │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERİ KATMANI                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Veritabanı  │  │  Dosya       │  │  Önbellek (Cache)    │   │
│  │  (PostgreSQL)│  │  Depolama    │  │  (Redis - İleride)   │   │
│  │              │  │  (Videolar,  │  │                      │   │
│  │  - Modeller  │  │   Sesler,    │  │  - Oturum bilgileri  │   │
│  │  - İşlemler  │  │   Fotoğraf)  │  │  - Sık erişilen veri │   │
│  │  - Personel  │  │              │  │                      │   │
│  │  - Üretim    │  │  İlk aşama:  │  │                      │   │
│  │  - Performans│  │  Yerel disk  │  │                      │   │
│  │  - Raporlar  │  │  İleri aşama:│  │                      │   │
│  │              │  │  Bulut (S3)  │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ENTEGRASYON KATMANI                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │  Kamera    │ │  Ses→Yazı  │ │  Görüntü   │ │   Excel/   │   │
│  │  Sistemi   │ │  (Speech   │ │  Karşılaş- │ │   Word     │   │
│  │  (IP Cam   │ │   to Text) │ │  tırma     │ │   Dışa     │   │
│  │   veya     │ │            │ │  (AI)      │ │   Aktarım  │   │
│  │   USB)     │ │  Whisper   │ │            │ │            │   │
│  │            │ │  veya      │ │  İleride   │ │            │   │
│  │            │ │  Google    │ │            │ │            │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. TEKNOLOJİ SEÇİMLERİ

### 3.1 Önerilen Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji | Neden? |
|--------|-----------|--------|
| **Frontend** | Next.js (React) | Hem web hem mobil uyumlu, hızlı, modern |
| **Mobil Uyum** | PWA (Progressive Web App) | Uygulama mağazasına gerek yok, tarayıcıdan kurulur |
| **Backend** | Node.js + Next.js API Routes | JavaScript ile tek dilde geliştirme |
| **Veritabanı** | PostgreSQL | Güçlü, ücretsiz, ilişkisel veri için ideal |
| **Dosya Depolama** | Yerel disk → ilerde MinIO/S3 | Video ve ses dosyaları için |
| **Ses→Yazı** | OpenAI Whisper API | Türkçe ve Arapça desteği mükemmel |
| **Kamera** | IP Kameralar + WebRTC | Uygun fiyatlı, web üzerinden erişim |
| **Gerçek Zamanlı** | WebSocket (Socket.io) | Anlık bildirim ve canlı takip |
| **Dil Desteği** | next-intl / i18next | Çok dilli altyapı |
| **Raporlama** | ExcelJS + jsPDF | Excel ve PDF çıktı üretimi |
| **Kimlik Doğrulama** | NextAuth.js | Kullanıcı girişi ve yetki yönetimi |

### 3.2 Alternatif Basit Başlangıç Yığını

> Eğer en basit şekilde, minimum teknik bilgiyle başlamak isterseniz:

| Katman | Teknoloji | Neden? |
|--------|-----------|--------|
| **Frontend** | HTML + CSS + JavaScript | En temel, herkes anlayabilir |
| **Backend** | Node.js + Express | Basit ve hızlı |
| **Veritabanı** | SQLite | Kurulum gerektirmez, tek dosya |
| **Dosya Depolama** | Yerel klasör | Basit başlangıç |

---

## 4. VERİTABANI YAPISI (Ana Tablolar)

```
┌─────────────────┐     ┌─────────────────────┐
│    MODELLER      │     │    İŞLEMLER          │
│─────────────────│     │─────────────────────│
│ model_id (PK)   │────▶│ islem_id (PK)        │
│ model_adi        │     │ model_id (FK)        │
│ model_kodu       │     │ islem_adi            │
│ tarif            │     │ islem_sirasi         │
│ kumasi           │     │ zorluk_derecesi      │
│ beden_araligi    │     │ yapilis_aciklamasi   │
│ olusturma_tarihi │     │ video_url            │
│ durum            │     │ ses_url              │
│                  │     │ foto_url             │
│                  │     │ yazili_talimat       │
│                  │     │ tahmini_sure_sn      │
│                  │     │ islem_degeri         │
└─────────────────┘     └─────────────────────┘
                              │
                              ▼
┌─────────────────┐     ┌─────────────────────┐
│   PERSONEL      │     │  ÜRETİM KAYITLARI   │
│─────────────────│     │─────────────────────│
│ personel_id (PK)│────▶│ kayit_id (PK)        │
│ ad_soyad         │     │ islem_id (FK)        │
│ rol              │     │ personel_id (FK)     │
│ beceriler        │     │ baslama_saati        │
│ maas             │     │ bitis_saati          │
│ dil              │     │ urun_adedi           │
│ giris_tarihi     │     │ birim_sure_sn        │
│ durum            │     │ kalite_durumu        │
└─────────────────┘     │ tarih               │
                         └─────────────────────┘
                              │
                              ▼
┌─────────────────────┐  ┌─────────────────────┐
│  ARA KONTROLLER     │  │ PERFORMANS RAPORU    │
│─────────────────────│  │─────────────────────│
│ kontrol_id (PK)     │  │ rapor_id (PK)        │
│ kayit_id (FK)       │  │ personel_id (FK)     │
│ kontrol_sirasi      │  │ donem (gün/hafta/ay) │
│ sonuc (OK/FAIL)     │  │ toplam_uretim        │
│ karsilastirma_foto  │  │ toplam_deger         │
│ notlar              │  │ maliyet              │
│ tarih_saat          │  │ prim_miktari         │
└─────────────────────┘  │ performans_skoru     │
                          │ durum                │
                          └─────────────────────┘

┌─────────────────────┐
│   MAKİNELER         │
│─────────────────────│
│ makine_id (PK)      │
│ makine_tipi         │
│ konum               │
│ kamera_ip           │
│ tablet_id           │
│ durum               │
└─────────────────────┘
```

---

## 5. KULLANICI ROLLERİ VE YETKİLER

| Rol | Yetkiler |
|-----|----------|
| **Model Makinacı** | Prototip kayıt (video, ses, fotoğraf), işlem tanımlama |
| **Operatör** | Kendi işlemini görme, video/ses talimat izleme, işlem başlat/bitir, fotoğraf çekme |
| **Kalite Kontrol** | Ara kontrol yapma, onay/red verme, raporları görme |
| **Üretim Yöneticisi** | Tüm üretimi takip, personel atama, performans izleme, raporlar |
| **İşletme Sahibi / Patron** | Tüm raporlar, maliyet analizi, prim onaylama, stratejik kararlar |
| **Sistem Yöneticisi** | Kullanıcı yönetimi, sistem ayarları, makine/kamera tanımlama |

---

## 6. MOBİL UYUMLULUK

### 6.1 PWA (Progressive Web App)
- Tarayıcıdan **"Ana ekrana ekle"** ile uygulama gibi çalışır
- **İnternet kesilse bile** son görüntülenen veriler erişilebilir (offline cache)
- Uygulama mağazasına **yüklemeye gerek yok**
- Android ve iOS tablette **tam ekran** çalışır

### 6.2 Responsive Tasarım
- Operatör tableti: **Büyük butonlar**, kolay kullanım
- Yönetici paneli: **Detaylı tablolar** ve grafikler
- Telefon: **Bildirimler** ve hızlı durum kontrolü

---

## 7. KAMERA SİSTEMİ MİMARİSİ

### 7.1 Donanım Gereksinimleri (Makine Başı)
| Parça | Özellik | Tahmini Maliyet |
|-------|---------|-----------------|
| IP Kamera | 1080p, 20-30° ayarlanabilir açı, gece görüşlü | ~$30-80 |
| Tablet | 10" Android tablet, WiFi | ~$100-200 |
| Tablet Tutucu | Makineye montaj aparatı | ~$10-20 |
| Kamera Tutucu | Esnek açılı montaj kolu | ~$10-15 |

### 7.2 Ağ Altyapısı
```
[IP Kameralar] ──WiFi/Kablo──▶ [Router/Switch] ──▶ [Yerel Sunucu]
[Tabletler]    ──WiFi────────▶ [Router/Switch] ──▶ [Yerel Sunucu]
                                                          │
                                                    [İnternet]
                                                    (İsteğe bağlı
                                                     bulut yedek)
```

---

## 8. AŞAMA 1 (MVP) İÇİN BAŞLANGIÇ PLANI

### İlk yapılacaklar (en basit hali):

```
Hafta 1-2: Temel Altyapı
├── Veritabanı kurulumu
├── Kullanıcı giriş sistemi
├── Temel sayfa yapısı (layout)
└── Türkçe dil dosyası

Hafta 3-4: Model & İşlem Modülü
├── Yeni model/ürün ekleme formu
├── İşlem tanımlama (sıra, zorluk, açıklama)
├── Video yükleme (tablettan kayıt)
├── Ses yükleme
└── Yazılı talimat girişi

Hafta 5-6: Operatör Paneli
├── Operatörün kendi işlemlerini görmesi
├── Video/ses/yazı talimat ekranı
├── "İşleme Başla" / "İşlemi Bitir" butonları
├── Fotoğraf çekme ve yükleme
└── Basit karşılaştırma ekranı

Hafta 7-8: Yönetici Paneli
├── Üretim durumu genel görünüm
├── Personel listesi ve durumları
├── Basit raporlar (günlük üretim)
└── Excel dışa aktarım
```

---

## 9. SONUÇ VE ÖNERİ

### Neden Bu Mimari?

1. **Basit başlıyoruz** → İlk sürüm 1-2 ayda çalışır hale gelir
2. **Web tabanlı** → Özel uygulama geliştirmeye gerek yok
3. **Modüler** → Her özellik bağımsız, ihtiyaca göre eklenir
4. **Ölçeklenebilir** → 1 makineden 1000 makineye büyüyebilir
5. **Ekonomik** → Açık kaynak teknolojiler, lisans maliyeti yok
6. **Mobil uyumlu** → Tablet, telefon, bilgisayar hepsinden erişim
7. **Çok dilli** → Türkçe + Arapça + ileride istenen diller

### Tahmini Başlangıç Maliyetleri (1 Hat / 10 Makine için)

| Kalem | Maliyet (Tahmini) |
|-------|-------------------|
| 10x IP Kamera | ~$300-800 |
| 10x Android Tablet | ~$1,000-2,000 |
| 1x Yerel Sunucu (Mini PC) | ~$300-500 |
| Router/Switch | ~$50-100 |
| Montaj Aparatları | ~$200-350 |
| **Toplam Donanım** | **~$1,850-3,750** |
| Yazılım Geliştirme | Birlikte yapacağız! 🚀 |
