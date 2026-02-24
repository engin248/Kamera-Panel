# TEKSTİL ÜRETİM YÖNETİM SİSTEMİ — SON HALİ

## Tarih: 2026-02-22
## Durum: Birleştirilmiş Son Versiyon — Kontrol İçin Hazır

---

# AŞAMA 1: PROTOTİP / İLK ÜRÜN HAZIRLAMA

## 1.1 Amaç
İlk ürün hazırlanırken tüm işlemlerin eksiksiz olarak kayıt altına alınması.
Bu kayıtlar seri üretimin temelini oluşturur.

## 1.2 İlk Ürün Hazırlanırken Kayıt Altına Alınacak Bilgiler

Her işlem için aşağıdaki bilgiler tablet ile kayıt altına alınır:

| # | Veri | Açıklama | Kayıt Şekli |
|---|------|----------|-------------|
| 1 | **İşlem Adı** | Yapılan işlemin adı (örn: omuz alma, yaka çevirme) | Manuel giriş |
| 2 | **İşlem Sırası** | Kaçıncı işlem olduğu (1, 2, 3...) | Manuel giriş |
| 3 | **İşlem Yapılış Şekli** | İşlemin nasıl yapılacağının açıklaması | Sesli anlatım → yazıya dönüşüm |
| 4 | **Zorluk Derecesi** | İşlemin zorluğu (1-10 arası veya kolay/orta/zor) | Manuel giriş |
| 5 | **Kullanılan Makine** | Hangi makine ile yapıldığı (düz dikiş, overlok, reçme, ütü vb.) | Manuel giriş |
| 6 | **İplik/Malzeme Bilgisi** | İplik numarası, rengi, tipi ve ek malzemeler | Manuel giriş |
| 7 | **İşlem Videosu** | İşlemin yapılış videosu (4K) | Tablet kamera |
| 8 | **Sesli Anlatım** | İşlemin nasıl yapılacağının sesli açıklaması | Tablet mikrofon + yaka mikrofonu |
| 9 | **Yazılı Talimat** | Sesli anlatımdan otomatik oluşturulan yazılı talimat | Ses → yazı dönüşümü |
| 10 | **İstenilen Optik Görünüm** | İşlem sonrası ürünün nasıl görünmesi gerektiği | Video + fotoğraf |
| 11 | **✅ Doğru Yapılmış Fotoğrafı** | Kabul edilebilir kalitede yapılmış örnek fotoğraf | Tablet kamera |
| 12 | **❌ Yanlış Yapılmış Fotoğrafı** | Kabul edilemez kalitede yapılmış örnek fotoğraf | Tablet kamera |
| 13 | **İşlem Bağımlılığı** | Bu işlem hangi işlemden sonra yapılmalı? | Manuel giriş |

## 1.3 İşlem Süresi Hakkında

> ⚠️ **İlk ürün hazırlanırken işlem süresi BELİRLENMEZ.**
> 
> Çünkü:
> - İlk ürün deneme amaçlıdır, süre gerçeği yansıtmaz
> - Gerçek süre verisi **seri üretimde** ortaya çıkar
> 
> **Süre belirleme yöntemi:**
> 1. Seri üretimde ilk operatörün yaptığı **adet** baz alınır
> 2. İlerleyen süreçte farklı personellerin performansı kaydedilir
> 3. Biriken verilerden **ortalama süre** hesaplanır
> 4. Bu ortalama, performans değerlendirmesinin temeli olur

## 1.4 Ses → Yazı Dönüşümü ve Kontrol

| Adım | İşlem |
|------|-------|
| 1 | Her işlem sesli anlatılır (yaka mikrofonu ile) |
| 2 | Ses otomatik olarak yazıya çevrilir |
| 3 | Çevrilen yazı ile ses kaydı karşılaştırılır |
| 4 | Anlam ve ifade farkı var mı kontrol edilir |
| 5 | Onaylandıktan sonra yazılı talimat olarak kaydedilir |

## 1.5 Model Kartı (Çıktı Dokümanı)

İlk ürün tamamlandığında aşağıdaki bilgileri içeren model kartı oluşturulur:

| Bilgi | Açıklama |
|-------|----------|
| Model Adı | Ürünün adı |
| Model Kodu | Ürünün kodu |
| Tarifi | Ürünün genel açıklaması |
| Kumaşı | Kullanılan kumaş tipi ve özellikleri |
| Beden Aralığı | Üretilecek beden aralığı |
| Toplam İşlem Sayısı | Kaç işlem yapılacak |
| İşlem Listesi | Sıralı tüm işlemler, makine, iplik, zorluk, talimat |
| Video Linkleri | Her işlemin videosu |
| Doğru/Yanlış Fotoğrafları | Her işlemin kabul/red örnekleri |

**Format:** Excel veya Word + sisteme yükleme
**Dil:** Türkçe + Arapça

## 1.6 Video Dosya İsimlendirme Standardı

Tüm videolar şu formatta isimlendirilir:
```
[ModelKodu]_[İşlemNo]_[İşlemAdı]_[Tarih].mp4
```
**Örnek:**
```
MK2026-001_03_OmuzAlma_20260224.mp4
MK2026-001_07_YakaCevirme_20260224.mp4
```

## 1.7 Dil Desteği

- **Türkçe** — Ana dil
- **Arapça** — İkinci dil
- Mimari olarak **çok dile** genişletilebilir

---

# AŞAMA 2: SERİ ÜRETİME GEÇİŞ

## 2.1 Üretim Öncesi Uygunluk Kontrolü

Ürün seri üretime verilmeden ÖNCE sistem otomatik kontrol yapar:

| Kontrol | Açıklama |
|---------|----------|
| İşlem sayısı | Bu ürün için kaç işlem gerekiyor? |
| Makine kontrolü | Bu işlemler için hangi makineler gerekiyor? İşletmede var mı? |
| Personel kontrolü | Bu işlemler için hangi becerilere sahip personel gerekiyor? Mevcut mu? |
| Uygunluk kararı | Bu ürün bu işletmeye uygun mu? |

## 2.2 Operatör Başlangıç Süreci

Her operatör seri üretime başlamadan ÖNCE şu adımları izler:

| Adım | İşlem | Araç |
|------|-------|------|
| 1 | İşlem videosunu izler | Tablet |
| 2 | Sesli anlatımı dinler | Tablet + kulaklık |
| 3 | Yazılı talimatı okur | Tablet |
| 4 | Doğru/yanlış fotoğrafları inceler | Tablet |
| 5 | İlk ürünü yapar | Makine |
| 6 | Yaptığının fotoğrafını çeker | Tablet kamera |
| 7 | Prototip örneğiyle karşılaştırır | Tablet ekran |
| 8 | OK onayı alır (yönetici veya sistem) | Tablet |
| 9 | Seri üretime başlar | Makine |
| 10 | Başlama saati otomatik kaydedilir | Sistem |

## 2.3 Seri Üretim Sırasında Kayıt Altına Alınacak Veriler

### Her İşlem Seansı İçin:

| # | Veri | Kayıt Şekli |
|---|------|-------------|
| 1 | **Operatör adı / ID** | Sistem girişi |
| 2 | **İşlem adı** | Otomatik (atanmış işlem) |
| 3 | **Başlama saati** | "Başla" butonu |
| 4 | **Bitiş saati** | "Bitir" butonu |
| 5 | **Toplam üretilen adet** | Manuel giriş |
| 6 | **Hatalı ürün adedi (fire)** | Manuel giriş |
| 7 | **Hata nedeni** | Manuel giriş (açılır menü veya yazı) |
| 8 | **Mola/duruş süresi** | "Mola başladı / bitti" butonu |
| 9 | **Makine arıza süresi** | "Arıza başladı / bitti" butonu |
| 10 | **Kumaş/parti değişikliği** | Manuel giriş (varsa) |
| 11 | **Ara kontrol sonuçları** | Her 20 üründe OK/Red + fotoğraf |

### Otomatik Hesaplanan Veriler:

| # | Veri | Hesaplama |
|---|------|-----------|
| 12 | **Brüt çalışma süresi** | Bitiş - Başlama |
| 13 | **Net çalışma süresi** | Brüt süre - mola - arıza süresi |
| 14 | **Birim süre (saniye/ürün)** | Net süre ÷ üretilen adet |
| 15 | **Sağlam ürün adedi** | Toplam adet - hatalı adet |
| 16 | **Fire oranı (%)** | Hatalı adet ÷ Toplam adet × 100 |

## 2.4 Ara Kontrol Sistemi

| Kural | Açıklama |
|-------|----------|
| Sıklık | Her ~20 üründe bir (ayarlanabilir) |
| Yöntem | Ürün fotoğrafı çekilir → sistemdeki prototiple karşılaştırılır |
| Sonuç | ✅ OK → devam / ❌ Red → düzelt ve tekrar dene |
| Kayıt | Kontrol fotoğrafı, sonuç ve varsa not kaydedilir |

## 2.5 Ücret ve Maliyet Hesaplama

### 2.5.1 İşlem Değeri
- Her işlemin, ürün toplam değeri içindeki **payı** zorluk derecesine göre belirlenir
- Örnek: 10 işlemli bir ürün, toplam değeri 100 birim ise:
  - Kolay işlem (zorluk 2): 5 birim
  - Orta işlem (zorluk 5): 10 birim
  - Zor işlem (zorluk 9): 20 birim

### 2.5.2 Operatör Ücret Karşılama Analizi
```
Yapılan İşlerin Toplam Değeri   vs.   Operatörün Aldığı Ücret
              ↓                              ↓
        Değer > Ücret  →  PRİM HAK EDİYOR
        Değer < Ücret  →  DÜŞÜK PERFORMANS
```

## 2.6 Prim ve Performans Sistemi

### Prim (Ücret karşılandığında):
- Fazla kalan kısmın **%10-%20'si** prim olarak ödenir
- Maaş dışı ek ödeme

### Düşük Performans Yönetimi:

| Ay | Eylem |
|----|-------|
| 1. Ay | Durum bildirilir, uyarı yapılır |
| 2. Ay | Düzelme değerlendirilir |
| 3. Ay | Karar: devam mı, ayrılık mı? |

### İşlem Süresi Ortalaması (Performans Referansı):

| Aşama | Yöntem |
|-------|--------|
| İlk başlangıç | İlk operatörün yaptığı **adet** baz alınır |
| İlerleyen süreç | Farklı personellerin performansı kaydedilir |
| Zaman içinde | Biriken verilerden **ortalama süre** hesaplanır |
| Sonuç | Bu ortalama, adil performans ölçütü olur |

## 2.7 Operatör Beceri Yönetimi

| Veri | Açıklama |
|------|----------|
| Operatör adı | Kimlik bilgisi |
| Yapabildiği işlemler | Hangi işlemlerde yetkin |
| Beceri seviyesi | Başlangıç / Orta / İleri |
| Kullanabildiği makineler | Hangi makinelerde çalışabiliyor |
| Performans geçmişi | Geçmiş dönem verileri |

## 2.8 Makine Başı Donanım

Her makinada:

| Ekipman | Özellik |
|---------|---------|
| **Kamera** | 20-30° açı, işlem+iğne+el detayı gören |
| **Tablet / Panel** | Video, ses, yazı talimat erişimi |
| **Yerleşim** | Operatörün çalışmasını ENGELLEMEYECEK şekilde |

Tablet/panelden erişilebilir:
- 📹 İşlem videosu
- 🔊 Sesli anlatım
- 📝 Yazılı talimat
- ✅ Doğru yapılmış fotoğraf
- ❌ Yanlış yapılmış fotoğraf

## 2.9 Yönetici Paneli

| Fonksiyon | Açıklama |
|-----------|----------|
| Genel durum | Hangi model, hangi aşamada, kaç işlem tamamlandı |
| Personel durumu | Kim ne yapıyor, ne kadar üretmiş, fire oranı |
| İşlem onay/red | Operatörün yüklediği fotoğrafı prototiple karşılaştır |
| Performans raporu | Günlük / haftalık / aylık |
| Ücret/prim raporu | Kimin ne kadar kazandığı, prim hak edip etmediği |
| Fire raporu | Hangi işlemde, hangi operatörde ne kadar fire var |

---

# AŞAMA 3: RAPORLAMA VE ÇIKTILAR

## 3.1 Düzenli Raporlar

| Rapor | Periyot | İçerik |
|-------|---------|--------|
| Günlük üretim raporu | Her gün | Model, adet, fire, süre |
| Haftalık performans | Her hafta | Operatör bazlı verimlilik |
| Aylık maliyet analizi | Her ay | Ücret vs. üretim değeri |
| Prim raporu | Her ay | Kimin ne kadar prim hak ettiği |
| Fire analizi | Her ay | Hangi işlem/operatörde fire yüksek |

## 3.2 Çıktı Formatları

- **Excel** — detaylı veri tabloları
- **Word/PDF** — model kartları, talimatlar
- **Ekran** — dashboard, grafikler, anlık durum

---

# VERİ YEDEKLEME STRATEJİSİ

## 3-2-1 Kuralı

| Kopya | Ortam | Konum |
|-------|-------|-------|
| Kopya 1 | Tablet SD kart (1TB) | Atölyede |
| Kopya 2 | Samsung T7 SSD (2TB) | Ofiste / kasada |
| Kopya 3 | Bilgisayar hard disk | Farklı fiziksel konum |
| İleride | Bulut depolama | İnternet üzerinde |

**Günlük:** Tablet → SSD yedekleme
**Haftalık:** SSD → Bilgisayar yedekleme

---

# TÜM VERİ LİSTESİ (Toplu Görünüm)

## A. Prototipte Girilen Veriler (1 kere, ilk ürün için)

| # | Veri |
|---|------|
| A1 | Model adı |
| A2 | Model kodu |
| A3 | Tarifi / açıklama |
| A4 | Kumaş tipi |
| A5 | Beden aralığı |
| A6 | İşlem adı (her işlem için) |
| A7 | İşlem sırası |
| A8 | İşlem yapılış şekli (sesli → yazılı) |
| A9 | Zorluk derecesi |
| A10 | Kullanılan makine tipi |
| A11 | İplik/malzeme bilgisi |
| A12 | İşlem videosu (4K) |
| A13 | Sesli anlatım kaydı |
| A14 | Doğru yapılmış fotoğraf |
| A15 | Yanlış yapılmış fotoğraf |
| A16 | İşlem bağımlılığı (hangi işlemden sonra) |
| A17 | İstenilen optik görünüm |

## B. Seri Üretimde Girilen Veriler (her gün, her operatör)

| # | Veri | Giriş |
|---|------|-------|
| B1 | Operatör ID | Sistem girişi |
| B2 | Atanan işlem | Otomatik |
| B3 | Başlama saati | Buton |
| B4 | Bitiş saati | Buton |
| B5 | Üretilen adet | Manuel |
| B6 | Hatalı ürün adedi | Manuel |
| B7 | Hata nedeni | Manuel (menü) |
| B8 | Mola başlangıç/bitiş | Buton |
| B9 | Makine arıza başlangıç/bitiş | Buton |
| B10 | Kumaş/parti değişikliği | Manuel (varsa) |
| B11 | Ara kontrol fotoğrafı | Kamera |
| B12 | Ara kontrol sonucu (OK/Red) | Buton |
| B13 | İlk ürün onay fotoğrafı | Kamera |

## C. Otomatik Hesaplanan Veriler

| # | Veri | Formül |
|---|------|--------|
| C1 | Brüt çalışma süresi | Bitiş - Başlama |
| C2 | Net çalışma süresi | Brüt - mola - arıza |
| C3 | Birim süre | Net süre ÷ adet |
| C4 | Sağlam ürün adedi | Toplam - hatalı |
| C5 | Fire oranı % | Hatalı ÷ Toplam × 100 |
| C6 | İşlem değeri | Zorluk × katsayı |
| C7 | Operatör üretim değeri | Sağlam adet × işlem değeri |
| C8 | Ücret karşılama oranı | Üretim değeri ÷ günlük ücret |
| C9 | Prim miktarı | (Değer - Ücret) × %10-20 |
| C10 | Ortalama birim süre (kümülatif) | Tüm operatörlerin ortalaması |

## D. Personel Verileri (1 kere tanımlanır)

| # | Veri |
|---|------|
| D1 | Ad soyad |
| D2 | Rol (operatör / yönetici / model makinacı) |
| D3 | Maaş / günlük ücret |
| D4 | Yapabildiği işlemler listesi |
| D5 | Beceri seviyesi (başlangıç / orta / ileri) |
| D6 | Kullanabildiği makineler |
| D7 | İşe giriş tarihi |
| D8 | Dil (Türkçe / Arapça) |

## E. Makine/Ekipman Verileri (1 kere tanımlanır)

| # | Veri |
|---|------|
| E1 | Makine adı / tipi |
| E2 | Makine konumu (hat no, sıra no) |
| E3 | Kamera IP adresi (ileride) |
| E4 | Tablet ID (ileride) |
| E5 | Makine durumu (aktif / arızalı / bakımda) |
