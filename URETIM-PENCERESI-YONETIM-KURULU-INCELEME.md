# 🏭 ÜRETİM PENCERESİ — YÖNETİM KURULU KAPSAMLI İNCELEME DOKÜMANI

> **Tarih:** 2026-02-28
> **Hazırlayan:** AI Geliştirme Ekibi (Müsteşar)
> **Konu:** Üretim Penceresi & Kriterleri — Dünya Standartlarının Üstünde Sistem Tasarımı
> **Durum:** 🔴 YÖNETİM KURULU ONAYI BEKLİYOR
> **Versiyon:** 2.0 (Genişletilmiş)

---

## 1. YÖNETİCİ ÖZETİ

Bu doküman, Kamera-Panel tekstil üretim yönetim sisteminin **Üretim Takip Penceresi**nin tasarımını kapsamaktadır. Mevcut sistemdeki (Personel, Maliyet, Sipariş, Model, Makine) panellerin **hiçbirine dokunulmadan**, aynı mimariye %100 uyumlu yeni bir üretim modülü eklenecektir.

### Ne Değişecek / Ne Değişmeyecek

| Değişecek ✅ | Değişmeyecek ❌ |
|-------------|----------------|
| Üretim takip penceresi yeniden tasarlanacak | Personel paneli |
| 21 yeni kriter eklenecek | Maliyet paneli |
| production_logs tablosuna 8 kolon eklenecek | Sipariş paneli |
| Production API genişletilecek | Model paneli |
| Türkçe+Arapça çeviriler eklenecek | Makine paneli |
| | Kalite Kontrol paneli |
| | Login/Auth sistemi |
| | CSS/Tema |
| | Veritabanı yapısı (mevcut tablolar) |

---

## 2. DÜNYA STANDARTLARI ANALİZİ

### 2.1 Referans Alınan Uluslararası Standartlar

| Standart | Kuruluş | Kapsam | Bizde Karşılığı |
|----------|---------|--------|-----------------|
| **ISO 22400** | ISO | Üretim performans metrikleri (OEE, Takt) | Otomatik OEE hesaplama |
| **Toyota TPS** | Toyota | Yalın üretim, Andon, Kanban | Dijital Andon uyarıları |
| **Six Sigma** | Motorola/GE | Hata azaltma, DPMO, FPY | First Pass Yield otomatik |
| **ISO 9001:2015** | ISO | Kalite yönetim sistemi | Kalite puanlama + izlenebilirlik |
| **IATF 16949** | IATF | Otomotiv kalite standardı (hata takibi) | Fotoğraflı hata kaydı |
| **Lean Manufacturing** | MIT/Toyota | İsraf azaltma, değer akışı | Duruş süresi analizi |
| **Industry 4.0** | Almanya | Akıllı fabrika, veri odaklı üretim | Gerçek zamanlı veri |
| **WCM (World Class Manufacturing)** | Fiat | Dünya sınıfı üretim kriterleri | Beceri matrisi |

### 2.2 Bu Standartları Nasıl Aşıyoruz?

| Dünya Standardı | Bizim Farkımız |
|-----------------|---------------|
| OEE genellikle günlük hesaplanır | ⚡ **Anlık OEE** — her işlem bitiminde otomatik |
| Operatör veri girişi elle yapılır | 🎙️ **Sesle giriş** — eller dolu bile olsa veri girilebilir |
| Kalite kontrol ayrı departman | 📸 **Anında karşılaştırma** — operatör kendi kontrol eder |
| Çok dilli destek nadirdir | 🌍 **Türkçe+Arapça** — göçmen işçi desteği |
| Performans raporları ay sonunda | 📊 **Anlık performans** — prim hesabı gerçek zamanlı |
| Makine başı tablet genellikle yok | 📱 **Her makineye tablet** — operatör bağımsız çalışır |

---

## 3. ÜRETİM PENCERESİ — 21 KRİTER (DETAYLI)

### A. SÜREÇ KRİTERLERİ (7 Kriter)

#### A1: İşlem Seçimi (Model + İşlem + Personel)
- **Ne:** Hangi model, hangi işlem, kim yapıyor
- **Neden Gerekli:** Üretim kaydının temel kimliği
- **Giriş Tipi:** 3 ayrı dropdown (birbirine bağlı — model seçince işlemler filtraner)
- **Butonlar:** ✏️ Değiştir | ❌ Temizle
- **Tez:** Dropdown ile hızlı seçim sağlanır
- **Antitez:** Çok model/işlem olunca listelerde kaybolunabilir → **Çözüm:** Arama özellikli dropdown
- **Doğrulama:** Model seçilmeden işlem seçilemez, işlem seçilmeden personel seçilemez

#### A2: Başlangıç/Bitiş Saati
- **Ne:** İşlemin ne zaman başladığı ve bittiği
- **Neden Gerekli:** Birim süre, verimlilik, maliyet hesabının temeli
- **Giriş Tipi:** "Başlat" butonu (otomatik) veya manuel datetime giriş
- **Butonlar:** ⏱️ Başlat | ⏹️ Durdur | ✏️ Manuel düzelt | ❌ Sıfırla
- **Tez:** Otomatik zamanlama en doğru sonucu verir
- **Antitez:** Operatör butona basmayı unutabilir → **Çözüm:** Unutma uyarısı (30dk sonra bildirim)
- **Doğrulama:** Bitiş saati, başlangıçtan önce olamaz

#### A3: Üretilen Adet
- **Ne:** Toplam kaç parça üretildi
- **Neden Gerekli:** Verimlilik + maliyet hesabı
- **Giriş Tipi:** Sayısal input (spinner + klavye + sesle)
- **Butonlar:** 🔢 Gir | ➕ +1 hızlı ekleme | ✏️ Düzelt | ❌ Sıfırla
- **Tez:** Manuel sayım en basit yöntem
- **Antitez:** Manuel sayım hataya açık → **Çözüm:** +1 hızlı buton ile tek tek sayım seçeneği
- **Doğrulama:** Negatif olamaz, 0 olabilir (henüz başlamamış kayıt)

#### A4: Hatalı Adet (Fire)
- **Ne:** Red/fire verilen parça sayısı
- **Neden Gerekli:** Kalite analizi, FPY hesabı, hata trendi
- **Giriş Tipi:** Sayısal input
- **Butonlar:** 🔢 Gir | ✏️ Düzelt | ❌ Sıfırla
- **Tez:** Her fireyi kaydetmek kaliteyi iyileştirir
- **Antitez:** Operatör fire gizleyebilir → **Çözüm:** Ara kontrol sistemi + fotoğraf zorunluluğu
- **Doğrulama:** Hatalı adet ≤ üretilen adet

#### A5: Hata Nedeni & Kaynağı
- **Ne:** Hatanın neden ve kimden kaynaklandığı
- **Neden Gerekli:** Kök neden analizi, önlem planı
- **Giriş Tipi:** Dropdown (6 neden × 4 kaynak) + serbest metin
- **Neden Kategorileri:** Dikiş hatası, Kesim hatası, Kumaş hatası, İplik hatası, Tasarım hatası, Diğer
- **Kaynak Kategorileri:** Operatör, Makine, Malzeme, Tasarım
- **Butonlar:** ▼ Seç | ✏️ Not ekle | ❌ Temizle
- **Tez:** Kategorize hata takibi trendi görmeyi sağlar
- **Antitez:** Kategoriler yetersiz kalabilir → **Çözüm:** "Diğer" + serbest metin alanı
- **Doğrulama:** Hatalı adet > 0 ise neden zorunlu

#### A6: Lot/Parti Değişimi
- **Ne:** Renk veya beden geçişi
- **Neden Gerekli:** Lot değişimi süresi ayrıca takip edilmeli
- **Giriş Tipi:** Seçim (Renk değişimi / Beden değişimi / İkisi birden / Yok) + not
- **Butonlar:** ▼ Seç | ✏️ Not | ❌ Temizle
- **Tez:** Lot değişimleri verimlilik düşürücü, takip edilmeli
- **Antitez:** Bu aşamada karmaşıklık ekleyebilir → **Çözüm:** İsteğe bağlı alan (isteyen doldurur)
- **Doğrulama:** Yok

#### A7: İşlem Durumu
- **Ne:** Kayıdın mevcut durumu
- **Neden Gerekli:** İş akışı takibi
- **Giriş Tipi:** Dropdown (Aktif/Tamamlandı/Beklemede/İptal edildi)
- **Butonlar:** ▼ Seç | ❌ Temizle
- **Tez:** Durum takibi iş akışını netleştirir
- **Antitez:** Otomatik olmalı — **Çözüm:** Başlat'a basınca "Aktif", Kaydet'e basınca "Tamamlandı" otomatik
- **Doğrulama:** Silinen kayıt "İptal" durumuna geçer (hard delete yok)

---

### B. ZAMAN & VERİMLİLİK KRİTERLERİ (5 Kriter)

#### B1: Net Çalışma Süresi (Otomatik)
- **Hesaplama:** Total süre − Mola − Arıza − Bekleme − Pasif
- **Neden Gerekli:** Gerçek üretken zamanı bilmek
- **Gösterim:** Otomatik hesaplanan, readonly alan
- **Tez:** Net süre, gerçek performansı gösterir
- **Antitez:** Operatör mola süresini eksik girebilir → **Çözüm:** Standart mola süreleri varsayılan olsun

#### B2: Mola Süresi (dakika)
- **Ne:** Çay, yemek, WC molası toplamı
- **Giriş Tipi:** Sayısal (dakika)
- **Varsayılan:** İş çizelgesinden otomatik çekilecek (örn: 60 dk)
- **Butonlar:** 🔢 Gir | ✏️ Düzelt | ❌ Sıfırla

#### B3: Makine Arıza Süresi (dakika)
- **Ne:** Makine bozulması, iğne kırılması vb.
- **Butonlar:** 🔢 Gir | ✏️ Düzelt | ❌ Sıfırla
- **İleri Hedef:** Makine bazlı arıza istatistikleri

#### B4: Malzeme Bekleme Süresi (dakika)
- **Ne:** Kumaş, iplik, aksesuar bekleme süresi
- **Butonlar:** 🔢 Gir | ✏️ Düzelt | ❌ Sıfırla

#### B5: Pasif Süre (dakika)
- **Ne:** Elektrik kesintisi, toplantı, diğer nedenler
- **Butonlar:** 🔢 Gir | ✏️ Düzelt | ❌ Sıfırla

---

### C. KALİTE KRİTERLERİ (4 Kriter)

#### C1: First Pass Yield — FPY (Otomatik)
- **Hesaplama:** ((Üretilen − Hatalı) / Üretilen) × 100
- **Hedef:** %95+ (dünya standardı)
- **Renk Kodlama:** ≥95 🟢 | ≥85 🟡 | <85 🔴

#### C2: Kalite Puanı (0-100)
- **Ne:** Genel kalite değerlendirmesi
- **Giriş Tipi:** Slider veya sayısal input
- **Varsayılan:** 100 (sorun yoksa)
- **Butonlar:** 🔢 Gir | ✏️ Düzelt | ❌ Sıfırla

#### C3: Hata Tipi Sınıflandırma
- **Ne:** Detaylı hata kategorisi
- **Giriş Tipi:** Çoklu seçim checkbox
- **Kategoriler:** Atlanmış dikiş | Eğri dikiş | İplik kopması | Kumaş hatası | Ölçü hatası | Leke/iz | Diğer
- **Butonlar:** ☑️ Seç/Kaldır | ✏️ Not ekle | ❌ Tümünü temizle

#### C4: Hata Fotoğrafı
- **Ne:** Görsel hata kaydı
- **Giriş Tipi:** Kamera veya dosya yükleme
- **Butonlar:** 📸 Çek/Yükle | 👁️ Görüntüle | ❌ Sil

---

### D. PERFORMANS KRİTERLERİ (5 Kriter — Tümü Otomatik)

#### D1: Birim Süre (saniye)
- **Hesaplama:** Net çalışma süresi / Üretilen adet
- **Gösterim:** "3.45 sn/adet" formatında

#### D2: Standart Süre Karşılaştırma (%)
- **Hesaplama:** (Standart süre / Gerçek birim süre) × 100
- **Gösterim:** >100% = hedefin üstünde 🟢 | <100% = hedefin altında 🔴

#### D3: OEE (Overall Equipment Effectiveness)
- **Hesaplama:** Kullanılabilirlik × Performans × Kalite
  - Kullanılabilirlik = Net çalışma / Planlanan çalışma
  - Performans = (Birim süre × Üretilen) / Net çalışma
  - Kalite = (Üretilen − Hatalı) / Üretilen
- **Dünya standardı:** %85+ = "World Class"
- **Renk Kodlama:** ≥85 🟢 | ≥60 🟡 | <60 🔴

#### D4: Takt Time Uyumu (%)
- **Hesaplama:** (Takt süresi / Birim süre) × 100
  - Takt süresi = Planlanan süre / Sipariş adedi
- **Gösterim:** %100+ = talebi karşılıyor 🟢

#### D5: İşlem Değeri (₺)
- **Hesaplama:** Birim fiyat × üretilen adet
- **Gösterim:** "42.50 ₺" formatında

---

## 4. PENCERE TASARIMI — DETAYLI UI YAPISI

### 4.1 Ekran Bölümleri

```
┌────────────────────────────────────────────────────────────────────┐
│ BÖLÜM 1 — BAŞLIK BARI                                            │
│ 🏭 Üretim Takip                                    + Yeni Üretim │
├────────────────────────────────────────────────────────────────────┤
│ BÖLÜM 2 — ÖZEt KARTLARI (4 stat-card)                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐            │
│ │📦 Üretim │ │✅ Kalite  │ │❌ Hata   │ │📊 OEE     │            │
│ │  48 adet │ │  %97.9   │ │  1 adet  │ │  %87.2    │            │
│ └──────────┘ └──────────┘ └──────────┘ └───────────┘            │
├────────────────────────────────────────────────────────────────────┤
│ BÖLÜM 3 — AKTİF ÜRETİM PANELİ (varsa)                          │
│ ┌────────────────────────────────────────────────────────────────┐│
│ │ Model: ELBİSE | İşlem: Yaka dikişi | Kişi: Ali               ││
│ │ ⏱️ 02:45:30  [⏸️ Duraklat] [⏹️ Bitir]                        ││
│ │                                                                ││
│ │ Üretilen: [  48 ]❌ | Hatalı: [  1 ]❌ | Kalite: [  98 ]❌    ││
│ │ Mola: [ 60 ]❌ dk | Arıza: [  0 ]❌ dk | Bekleme: [ 5 ]❌ dk  ││
│ │ Hata Nedeni: [▼ Dikiş hatası]❌ | Kaynak: [▼ Operatör]❌      ││
│ │ [📸 Fotoğraf] | Not: [_________________]❌                     ││
│ │                                                                ││
│ │ ─── Otomatik Hesaplamalar ───                                  ││
│ │ Birim: 3.45sn | FPY: %97.9 | OEE: %87.2 | Değer: 40.80₺     ││
│ │                                                                ││
│ │ [🗑️ İptal]  [💾 Geçici Kaydet]  [✅ Tamamla & Kapat]          ││
│ └────────────────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────────────────┤
│ BÖLÜM 4 — BUGÜNÜN ÜRETİM KAYITLARI (tablo)                     │
│ ┌─────┬────────┬────────┬──────┬──────┬───────┬──────┬────────┐ │
│ │ #   │ Model  │ İşlem  │ Kişi │ Adet │Hatalı │Kalite│ Süre   │ │
│ ├─────┼────────┼────────┼──────┼──────┼───────┼──────┼────────┤ │
│ │ 1   │ELBİSE  │Yaka    │Ali   │ 48   │  1   │%97.9 │ 2:45   │ │
│ │ [✏️ Düzenle] [🗑️ Sil]                                        │ │
│ └─────┴────────┴────────┴──────┴──────┴───────┴──────┴────────┘ │
├────────────────────────────────────────────────────────────────────┤
│ BÖLÜM 5 — YENİ ÜRETİM BAŞLAT (collapsed, + ile açılır)         │
│ [▼ Model Seç] → [▼ İşlem Seç] → [▼ Personel Seç] → [⏱️Başlat] │
└────────────────────────────────────────────────────────────────────┘
```

### 4.2 Mobil/Tablet Görünümü

```
Her bölüm alt alta, tek kolon, büyük butonlar
Stat kartları: 2×2 grid (mobilde)
Form alanları: Tam genişlik
Tablo: Yatay scroll
```

---

## 5. TEKNİK MİMARİ

### 5.1 Mevcut Mimariyle Birebir Uyum

| Bileşen | Mevcut | Üretim Penceresi |
|---------|--------|-----------------|
| Framework | Next.js 16 + React 19 | ✅ Aynı |
| Veritabanı | SQLite (better-sqlite3) | ✅ Aynı tablo genişletmesi |
| API | Next.js API Routes | ✅ Aynı pattern |
| Dosya Yükleme | Multer + data/uploads/ | ✅ Aynı klasör yapısı |
| CSS | globals.css + inline style | ✅ Aynı CSS değişkenleri |
| Dil | lib/i18n.js | ✅ Yeni key'ler eklenir |
| State Yönetimi | React useState/useEffect | ✅ Aynı pattern |
| Form | EditableField/EditableSelect | ✅ Aynı bileşenler |

### 5.2 Veritabanı Değişiklikleri

```sql
-- MEVCUT production_logs TABLOSU KORUNACAK (17 kolon)
-- EKLENECEK YENİ 8 KOLON:

ALTER TABLE production_logs ADD COLUMN defect_photo TEXT DEFAULT '';
ALTER TABLE production_logs ADD COLUMN defect_classification TEXT DEFAULT '';
ALTER TABLE production_logs ADD COLUMN first_pass_yield REAL DEFAULT 100;
ALTER TABLE production_logs ADD COLUMN oee_score REAL DEFAULT 0;
ALTER TABLE production_logs ADD COLUMN takt_time_ratio REAL DEFAULT 0;
ALTER TABLE production_logs ADD COLUMN unit_value REAL DEFAULT 0;
ALTER TABLE production_logs ADD COLUMN net_work_minutes REAL DEFAULT 0;
ALTER TABLE production_logs ADD COLUMN notes TEXT DEFAULT '';
```

### 5.3 API Endpoint Değişiklikleri

| Method | Endpoint | İşlev | Durum |
|--------|---------|-------|-------|
| GET | /api/production | Kayıtları listele (filtreli) | Mevcut → genişletilecek |
| POST | /api/production | Yeni kayıt ekle | Mevcut → genişletilecek |
| PUT | /api/production/[id] | Kayıt güncelle | 🆕 Yeni |
| DELETE | /api/production/[id] | Kayıt sil (soft-delete) | Mevcut → kontrol edilecek |

---

## 6. YÖNETİM KURULU — KAPSAMLI DEĞERLENDİRME SORULARI

### 🔴 KRİTİK KARARLAR (Strateji)

#### SORU 1: 21 kriter yeterli mi?

**TEZ:** 21 kriter, dünya standartlarının tamamını kapsıyor (OEE, FPY, Takt, SPC). Fazlası karmaşıklık yaratır, eksik bırakmak veri kaybına yol açar.

**ANTİTEZ:** Bazı tekstil-spesifik kriterler eksik olabilir:
- İplik tüketimi (metre/parça) → maliyet hesabı için önemli
- Enerji tüketimi (kWh) → makine bazlı maliyet
- Kumaş fire oranı → kesim aşaması için
- İşçi rotasyonu → vardiya değişimi

**SORU:** Bu ek kriterlerden hangisi eklensin, hangisi ileri tarihe bırakılsın?

---

#### SORU 2: Hata sınıflandırma sistemi nasıl olsun?

**TEZ (Basit — 6 kategori):**
Dikiş | Kesim | Kumaş | İplik | Tasarım | Diğer
- ✅ Hızlı seçim, operatör kolay kullanır
- ❌ Detay eksik kalabilir

**ANTİTEZ (Gelişmiş — 3 seviye):**
Seviye 1: Ana kategori (Dikiş/Kesim/Malzeme)
Seviye 2: Alt kategori (Atlanmış dikiş / Eğri dikiş / Gergin dikiş)
Seviye 3: Etki (Düzeltilebilir / Red / Hurda)
- ✅ Detaylı analiz, trend tespiti
- ❌ Operatör için karmaşık, yavaş giriş

**ÖNERİ:** 1. aşamada basit (6 kategori), veri birikince 2. aşamada genişlet

**SORU:** Bu yaklaşımı onaylıyor musunuz? Yoksa baştan detaylı mı başlayalım?

---

#### SORU 3: OEE hesaplaması dahil edilsin mi?

**TEZ (Evet):**
- Dünya standardı metrik (ISO 22400)
- Tek rakamla üretim verimliliğini özetler
- Karşılaştırma imkanı (sektör ortalaması %60-80, dünya sınıfı %85+)

**ANTİTEZ (Hayır / İleri tarih):**
- Hesaplaması karmaşık (3 bileşen çarpımı)
- Planlanan çalışma süresi tanımı belirsiz olabilir
- Yanlış veri girişiyle yanıltıcı sonuçlar verebilir

**ÖNERİ:** Dahil edelim ama "bilgilendirme" amaçlı gösterelim, karar metriki olarak kullanmayalım (ilk 3 ay)

**SORU:** OEE'yi baştan gösterelim mi, yoksa 3 ay veri birikince mi aktive edelim?

---

#### SORU 4: Sesle veri girişi kapsamı

**TEZ (Her alanda):**
- Operatör ellerini kullanamaz (dikiş yaparken)
- Tüm alanlarda sesle giriş, iş hızını artırır

**ANTİTEZ (Sadece belirli alanlarda):**
- Sayısal alanlarda sesle giriş hataya açık ("beş" mi "altı" mı dedi?)
- Gürültülü atölyede mikrofon sorunları
- Geliştirme maliyeti yüksek

**ÖNERİ:** Metin alanları (not, hata açıklaması) + sayısal alanlar (adet) için sesle giriş. Dropdown'larda sesle giriş gereksiz.

**SORU:** Sesle girişin kapsamını nasıl belirleyelim?

---

#### SORU 5: Fotoğraf yükleme zorunluluk durumu

**TEZ (Zorunlu, hatalı adet > 0 ise):**
- İspat amaçlı, tartışma önler
- Kalite trend analizinde görsel veri çok değerli
- Operatörü dikkatli çalışmaya teşvik eder

**ANTİTEZ (İsteğe bağlı):**
- Çekim süresi üretimi yavaşlatır
- Her hata tipi fotoğrafla belgelenmeye uygun değil
- Depolama maliyeti (her fotoğraf ~500KB-2MB)

**ÖNERİ:** Hatalı adet > 3 ise zorunlu, 1-2 adet için isteğe bağlı

**SORU:** Fotoğraf zorunluluk eşiği ne olsun? (Önerimiz: hata > 3 ise zorunlu)

---

#### SORU 6: Lot/parti takibi bu aşamada gerekli mi?

**TEZ (Evet):**
- Lot değişimi süresini bilmek planlama için kritik
- Renk/beden geçiş hatalarını takip eder
- Sipariş bazlı maliyet hesabı doğru olur

**ANTİTEZ (İleri tarihe bırak):**
- İlk aşamada veri girişini karmaşıklaştırır
- Operatörlerin adapte olması güçleşir
- Mevcut sipariş yapısıyla entegrasyon gerektirir

**ÖNERİ:** Bu aşamada isteğe bağlı alan olarak ekleyelim (görünsün ama zorunlu olmasın)

**SORU:** Lot takibini isteğe bağlı mı zorunlu mu başlatalım?

---

#### SORU 7: UI pencere tasarımı uygun mu?

**TEZ:** Section 4.1'deki 5 bölümlü tasarım, tüm bilgiyi tek ekranda sunar. Mevcut panellerle aynı görsel dili kullanır.

**ANTİTEZ:** Tek ekranda çok fazla bilgi olabilir. Tab sistemi (Giriş | Kalite | Rapor) daha temiz olabilir.

**SORU:** Tek ekran mı, yoksa sekme (tab) sistemi mi tercih edersiniz?

---

### 🟡 TAKTİK KARARLAR

#### SORU 8: Varsayılan mola süresi ne olsun?
- **Seçenekler:** 30 dk | 45 dk | 60 dk | İş çizelgesinden otomatik
- **Önerimiz:** İş çizelgesinden otomatik çekilsin

#### SORU 9: Minimum kayıt süresi var mı?
- 5 dakikadan kısa kayıtlar uyarı versin mi?
- **Önerimiz:** 2 dakikadan kısa kayıtlarda "Emin misiniz?" sorusu

#### SORU 10: Silme işlemi nasıl olsun?
- **Hard delete:** Kayıt tamamen silinir (geri dönüşü yok)
- **Soft delete:** Kayıt "iptal" olarak işaretlenir (geri alınabilir)
- **Önerimiz:** Soft delete + sadece Koordinatör hard delete yapabilsin

---

### 🟢 TEYİT GEREKTIREN NOKTALAR

11. Mevcut panellere **kesinlikle dokunulmayacak** ✅
12. Tüm değişiklikler **audit trail** ile kayıt altında olacak ✅
13. Sistem **Türkçe + Arapça** destekleyecek ✅
14. Her alan **responsive** (tablet/telefon uyumlu) olacak ✅
15. Tüm veriler **silinmeden arşivlenecek** (soft delete) ✅

---

## 7. RİSK ANALİZİ

| Risk | Olasılık | Etki | Önlem |
|------|----------|------|-------|
| Operatör sistemi kullanmak istemez | Orta | Yüksek | Basit UI, sesle giriş, eğitim |
| Yanlış veri girişi | Yüksek | Orta | Validasyon kuralları, otomatik kontrol |
| Mevcut paneller bozulur | Düşük | Çok yüksek | Dosya bazlı izolasyon, QA agent |
| Performans sorunu (büyük veri) | Düşük | Orta | İndeksleme, sayfalama |
| Dil sorunları (Arapça RTL) | Orta | Düşük | Mevcut i18n sistemi kullanılacak |

---

## 8. ONAY

| Kurul Üyesi | Görüş / Notlar | Onay |
|-------------|----------------|------|
| Koordinatör | _________________ | ☐ Onay / ☐ Düzeltme İstiyor / ☐ Red |
| Teknik Danışman | _________________ | ☐ Onay / ☐ Düzeltme İstiyor / ☐ Red |
| Üretim Sorumlusu | _________________ | ☐ Onay / ☐ Düzeltme İstiyor / ☐ Red |

> **Sonraki Adım:** Bu doküman onaylandıktan sonra "AGENT-GOREV-DOSYASI.md" dokümanındaki görevler dizüstü bilgisayara aktarılacak ve Open Agent Manager ile uygulamaya geçilecektir.
