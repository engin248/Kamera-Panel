# BOLUM-URETIM-FASON.md — URETIM VE FASON DIKIM BOLUMU

> Versiyon: 1.0 | Tarih: 2026-03-03
> Durum: AKTIF - Uygulamada olan bolum
> Kapsam: Tum pencereler, sekmeler, secenekler, beceriler

---

## BOLUMUN AMACI

Gunluk uretim ve fason dikim islemlerini kayit altina almak.
Kim, hangi modelde, kac adet, kac hatali, ne kadar surede.
Sistem veriyi toplar, analiz eder, karar onerir, ogrenenir.

---

## MEVCUT TEKNIK YAPI

- Uygulama: Next.js (localhost:3000)
- Ana Dosya: app/app/page.js (12.000+ satir, tek dosya)
- Veritabani: SQLite (hedef: Supabase)
- Bot: Kamera (Gemini 2.0 Flash)

---

## PANEL SEKMELERI HARITASI

```
ANA PANEL (Dashboard)
  |
  +--- [1] MODELLER       secme: teknik foy, BOM, operasyon tanimi
  +--- [2] PERSONEL       secme: profil, beceri, prim, devam
  +--- [3] URETIM ASAMASI secme: gunluk uretim girisi (ANA CALISMA EKRANI)
  +--- [4] PARTI TAKIP    secme: lot/parti yonetimi
  +--- [5] KALITE KONTROL secme: hata kaydi, foto, onay
  +--- [6] FASON          secme: dis atolye siparisleri
  +--- [7] MALIYET        secme: model bazli maliyet analizi
  +--- [8] PRIM VE URET   secme: prim motoru (YAPILACAK - KRITIK)
  +--- [9] RAPORLAR       secme: analiz grafikleri
```

---

## PENCERE 1: MODELLER SEKMESI

### Amaci

Uretilecek her modelin teknik bilgilerini tanimlamak.
Operasyonlarin surelerini kayit altina almak. Prim hesabina veri saglamak.

### 1a. Model Listesi

- Kart gorunumu: foto + isim + model kodu + zorluk puani + durum
- Durum renkleri: Aktif (yesil), Taslak (sari), Arsivlendi (gri)
- Filtreler: Musteri, Sezon, Durum, Zorluk
- Arama: Model adi veya kodu ile
- Hizli butonlar: Yeni Model, Klonla, Arsivle

### 1b. Model Detay

Genel Bilgiler:

- Model Adi (zorunlu)
- Model Kodu (zorunlu, benzersiz)
- Musteri (dropdown: musteri listesinden)
- Sezon secenekler: kisa / yaz / kis / ilkbahar / sonbahar
- Renk sayisi (sayi)
- Beden dagilimi (metin: S M L XL 2XL seklinde)
- Zorluk Puani: 1-10 (slider)
- Fason birim fiyati (TL)
- Tahmini uretim suresi (dakika/adet)
- Notlar

### 1c. Teknik Foy

- On foto yukleme (JPG/PNG, max 5MB)
- Arka foto yukleme
- Parca listesi (parcalar + adetleri)
- Tela/astar bilgisi (var/yok + tipi)
- Olcu tablosu (Beden x Olcu matrisi)
- Tolerans degerleri
- Dikis ozelligi: tur, iplik no, itlik sayisi
- AI Analiz butonu: Fotodan otomatik bilgi cikarimi

### 1d. Operasyon Tanimi — KRITIK (Prim Hesabinin Temeli)

Her operasyon icin:

- Operasyon Adi (ornek: Yan Dikiş, Kol Takma, Yaka Recmesi)
- Kategori secenekler:
  - Duz Makina
  - Overlok
  - Recme
  - Nakis
  - Knitkama
  - El islemi
  - Utu
  - Kalite Kontrol
  - Paketleme
- Standart Sure (dk/adet): sistemin ideal suresi
- Gercek Sure (dk/adet): olcumle guncellenir
- Zorluk Katsayisi: 1.0 - 3.0 arasi
- Gerekli Makine Tipi (dropdown: tanimli makinelerden)
- Gerekli Beceri Sinifi: A / B / C / D
- Birim Deger (TL/adet): prim hesabina gider

Prim Degeri Formulu:
Prim = (Standart Sure / Gercek Sure) x Birim Deger x Zorluk Katsayisi

---

## PENCERE 2: PERSONEL SEKMESI

### Amaci

Her calisanin profilini, becerilerini, devamini ve primini yonetmek.

### 2a. Personel Listesi

- Kart gorunumu: foto avatar, isim, sinif (A/B/C/D), bolum
- Filtreler: Sinif, Bolum, Makine Uzmanligi, Durum
- Hizli durum gostergesi: Bugun isyerinde mi (yesil/kirmizi)

### 2b. Personel Profili P1-P11

P1 - Kimlik:

- Ad Soyad (zorunlu)
- TC Kimlik No
- Dogum Tarihi
- Cinsiyet secenekler: kadin / erkek
- Egitim secenekler: ilkokul / ortaokul / lise / universite
- Telefon, Adres, Acil Iletisim

P2 - Is Gecmisi:

- Sozlesme secenekler: standart / deneme / part-time / sozlesmesiz
- SGK Baslangic Tarihi
- Sirket Baslangic Tarihi
- Onceki Is Yeri ve Tecrube (yil)

P3 - Ucret:

- Baz Maas (TL)
- Yol Ucreti (TL)
- SSK Maliyeti (TL - sistem hesaplar: maas x 0.225)
- Yemek Ucreti (TL)
- Kidem Tazminati (sistem hesaplar)
- Toplam Maliyet (sistem hesaplar)

P4 - Beceri:

- Beceri Sinifi: A / B / C / D
- Hangi Makineleri Kullanabilir (coklu secim)
- Hangi Operasyonlari Yapabilir (coklu secim)
- Ogrenme Hizi: 1-5 yildiz
- Parmak Becerisi: 1-5 yildiz
- Renk Algilama secenekler: normal / zayif

P5 - Makine Tercihi:

- Tercihli Makine (dropdown)
- En Verimli Oldugu Makine
- Makine Ayari Yapabiliyor mu secenekler: evet / hayir

P6 - Fiziksel:

- Fiziksel Dayaniklilik: 1-5
- Goz sagligi secenekler: normal / gozluk / sorunlu
- ISG Egitim Tarihi

P7 - Karakteristik:

- Guvenilirlik: 1-5
- Hijyen: 1-5
- Sorumluluk: 1-5
- Takim Uyumu: 1-5
- Stres Yonetimi: 1-5

P8-P9 - Uretim Verileri:

- Gunluk Ortalama Uretim (adet)
- Hata Orani (yuzde)
- Verimlilik Skoru: 1-100 (sistem hesaplar)

P10 - Gelisim:

- Yeni Makine Ogrenme Kararliligi: 1-5
- Egitim Ihtiyaci (serbest metin)

P11 - Performans:

- Operatör Sinifi: A / B / C / D (kesin siniflandirma)
- Isi Sevme Skoru: 1-5
- Haftalik Not (yonetici notu, her hafta guncellenir)

### 2c. Devam Takibi

- Giris saati (otomatik veya manuel)
- Cikis saati
- Haftalik ozet (7 gun gorunumu)
- Devamsizlik kaydi + sebebi
- Izin kaydi secenekler: yillik / mazeret / ucretsiz

### 2d. Prim Ozeti (YAPILACAK - KRITIK)

- Bu ay toplam uretim adeti
- Hesaplanan katki degeri (TL)
- Maas maliyeti (TL)
- Prim miktari (TL)
- Formul aciklamasi
- Gecmis 3 ay karsilastirmasi

---

## PENCERE 3: URETIM ASAMASI — ANA CALISMA EKRANI

Fabrika zemininde tablet veya bilgisayarda surekli acik olacak.
En sik kullanilan, en kritik ekran.

### 3a. Gunluk Hedef Cubugu

- Bugun hedef: X adet (yonetici girer)
- Tamamlanan: Y adet (gercek zamanli)
- Yuzde tamamlanma (ilerleme cubugu)
- Tahmini bitis saati (mevcut hiza gore)
- Renkler: Yesil (hedefe gore iyi), Sari (anlik), Kirmizi (geride)

### 3b. Parti Lot Baglantisi

- Aktif parti secimi (dropdown veya QR okuma)
- Parti bilgileri: Model, Musteri, Toplam Adet, Bitis Tarihi
- Parti ilerlemesi
- Lot degisim kaydi:
  - Model tamamlandi
  - Musteri istegi
  - Hammadde bitti
  - Makine sorunu
  - Kalite sorunu
  - Vardiya degisimi
  - Diger (serbest metin)

### 3c. Uretim Giris Formu — EN KRITIK

ZORUNLU ALANLAR:

- Personel (dropdown: bugun gelen personelden)
- Model (dropdown: aktif modellerden)
- Operasyon (dropdown: secilen modelin operasyonlarindan)
- Uretilen Adet (sayi)
- Hata Adedi (sayi)
- Baslangic Saati (otomatik su an, degistirilebilir)
- Bitis Saati

HATA VARSA secenekler — Hata Turu (coklu secim):

- Dikiş kacigi
- Aciklik/Kapanma sorunu
- Yanlis operasyon
- Olcu hatasi
- Kumac bozuklugu
- Iplik sorunu
- Makine kaynakli
- Malzeme kaynakli
- Dikkat eksikligi
- Acelesi gelenmis
- Tecrubesizlik
- Diger (serbest metin)

Hata Kaynagi secenekler (tek secim):

- Operatör hatasi
- Makine arizasi veya ayar sorunu
- Malzeme kalite sorunu
- Yonetim hatasi (yanlis talimat)
- Dis kaynak (fason gelen malzeme)

Hata Fotografisi: (opsiyonel)

OTOMATIK HESAPLANAN METRIKLER (kullanici girmez):

- OEE yuzde: Kullanilabilirlik x Performans x Kalite
- FPY yuzde: (Toplam - Hatali) / Toplam x 100
- Takt Zamani Orani: Gercek Sure / Standart Sure
- Kalite Skoru: (1 - hata_orani) x 100
- Birim Uretim Suresi (dk)
- Prim Puani (o operasyon icin)

### 3d. Sesli Komut Paneli

- Mikrofon butonu (buyuk, kolay basilan)
- Ornek komutlar gosterilir:
  - "Ahmet 50 adet tamamladi"
  - "Ahmet giris yapti"
  - "Ahmet cikis yapti"
  - "Makine bozuldu"
  - "Lot degistir"
  - "Hata var Ahmet'te 3 adet"

Ses akisi:
Adim 1: Sesli komut al
Adim 2: Yaziya cevir
Adim 3: Kullaniciya goster
Adim 4: Kullanici ONAYLAR
Adim 5: Sistem kaydeder

KURAL: Onaysiz hic bir ses komutu islenmez.

### 3e. Canli Uretim Tablosu

- Bugun calisan her personel listesi
- Her satir: Ad, Operasyon, Uretilen, Hata, OEE, FPY
- Kirmizi: OEE altmis altinda veya FPY doksan altinda
- Gercek zamanli guncelleme

---

## PENCERE 4: PARTI LOT YONETIMI

### Yeni Parti Olusturma

- Model secimi
- Musteri secimi  
- Toplam siparis adeti
- Hedef teslim tarihi
- Oncelik secenekler: normal / acele / kritik
- Hacim: beden dagilimi + renk ayrimi
- Notlar

### Parti Listesi

- Durum secenekler: Hazirlanıyor / Devam Ediyor / Tamamlandi / Iptal
- Ilerleme yüzdesi
- Geciken partiler kirmizi uyari

---

## PENCERE 5: KALITE KONTROL

### 5a. Kalite Kontrol Kaydi

- Personel secimi
- Model secimi
- Operasyon secimi
- Kontrol turu secenekler:
  - Satin icinde (ara kontrol)
  - Son urun (tampon kontrol)
  - Ilk urun onay (3 adet ornek)
  - Rastgele ornekleme
- Sonuc secenekler: GECTI / REDDEDILDI / UYARI
- Hata tipleri (coklu - uretim ile ayni liste)
- Aciklama (serbest metin)
- Foto (coklu)
- Yonetici onay imzasi

### 5b. Ilk Urun Onay Kuyrugu

- Yeni modelde ilk 3 adet mutlaka onaya gelir
- Onaylayan: Kaliteci veya Ustabasi
- Red sebebi zorunlu aciklama
- Onayda uretim devam eder, redde duzeltme yapilir

### 5c. Hata Analiz Ozeti

- Bu hafta toplam hata adeti
- Hata turune gore pasta grafik
- Hatanin kaynagina gore grafik
- En cok hata cikan operasyon
- Trend: Gecen haftaya gore artis veya azalis

---

## PENCERE 6: FASON DIS ATOLYE

### Fason Tedarikci Listesi

- Atolye adi, telefon, adres
- Hangi operasyonlarda calistigimiz
- Birim fiyat anlasmalari
- Guven skoru (gecmis siparislere gore)

### Fason Siparis

- Tedarikci secimi
- Model ve operasyon tanimi
- Gonderilen adet, tarih
- Beklenen donus tarihi
- Anlasilan birim fiyat (TL)

### Takip

- Durum secenekler: Beklemede / Gonderildi / Tamamlandi / Sorunlu
- Gelen adet, hata adedi, hata orani
- Gecikme kaydi varsa
- Kalite degerlendirmesi: 1-5
- Odeme durumu

---

## PENCERE 7: MALIYET

### Maliyet Girisi

- Model secimi
- Kategori secenekler:
  - Cumac (m2 x fiyat)
  - Iplik
  - Aksesuar (dugme, fermuar, etiket)
  - Iscilik (operasyon baz maliyet)
  - Genel gider payi
  - Fason maliyet (varsa)
- Birim Maliyet (TL), Adet, Toplam

### Maliyet Ozeti

- Toplam uretim maliyeti (adet basi)
- Fason birim fiyati
- Kar Marji (yuzde)
- BEP (Basabas Noktasi)
- Uyari: Kar marji yuzde on bessin altinda ise kirmizi

### Isletme Giderleri

- Aylik sabit giderler:
  - Kira
  - Elektrik/Su/Dogalgaz
  - Maas giderleri toplam
  - SGK giderleri
  - Sigorta
  - Bakim/Onarim
  - Diger
- Aylik cizgi grafik ozet

---

## PENCERE 8: PRIM VE URET — YAPILACAK KRITIK

Bu pencere sistemin ADALET MOTORUDUR. Hicbir seyi atlanmadan kurulmali.

### Prim Hesap Motoru Formulu

```
Katki Degeri = TOPLAM(uretilen_adet x birim_deger x (1 - hata_orani))
Maas Maliyeti = baz_maas + yol + yemek + ssk_prim
Fazla Deger = Katki Degeri - Maas Maliyeti
Prim = Fazla Deger BUYUKSE:  Fazla Deger x Prim Orani%
       DEGILSE: 0 TL
```

### Personel Prim Kartelasi (Herkes Kendi Verisini Gorur)

- Ad Soyad
- Bu ayki uretim ozeti (operasyon bazli)
- Katki Degeri (TL)
- Maas Maliyeti (TL)
- Prim Tutari (TL) veya "Bu ay prim kazanilmadi"
- Formul gosterimi: Neden bu kadar?
- Gecen aya gore degisim

### Toplu Prim Raporu (Sadece Yönetici)

- Tum personelin yan yana karsilastirma
- Toplam prim gideri o ay
- En yuksek katki saglayan personel

---

## PENCERE 9: RAPORLAR

### Gunluk Rapor

- Bugun kac adet uretildi
- OEE ortalamasinin
- FPY ortalamasinin
- En verimli personel
- Hedefe ulasma yuzdesi

### Haftalik Rapor

- 7 gunluk uretim cizgi grafigi
- Personel bazli performans tablosu
- Hata trend grafigi
- Lot ilerlemeleri

### Aylik Rapor

- Toplam uretim
- Personel prim hesaplamalari
- En cok hataya yol acan operasyon
- Maliyet ve kar/zarar ozeti
- Fason maliyet karsilastirmasi

### Karar Karsilastirma Raporu (YAPILACAK)

- Sistem ne onerdi?
- Ne yapildi?
- Sonuc ne oldu?
- Fark analizi

---

## BOT SISTEMI — KAMERA BOTU

Her ekranda sag alt kosede chatbot asistani.
Bot: KAMERA | Motor: Gemini 2.0 Flash | Fallback: GPT-4o-mini

Ornek sesli ve yazili komutlar:

- "Bugun kac adet urettik?"
- "En cok hata kimin?"
- "OEE neden dusuk?"
- "Ahmetin bu haftalik performansi?"
- "Hangi lot en yakin bitiyor?"
- "Prim hesabimi goster"

---

## VERITABANI TABLOLARI

### production_logs (Ana Tablo)

| Alan                 | Tip     | Aciklama                        |
|----------------------|---------|---------------------------------|
| id                   | TEXT    | UUID otomatik                   |
| model_id             | FK      | Hangi model                     |
| operation_id         | FK      | Hangi operasyon                 |
| personnel_id         | FK      | Hangi personel                  |
| start_time           | DATETIME| Baslangic                       |
| end_time             | DATETIME| Bitis                           |
| total_produced       | INTEGER | Uretilen adet                   |
| defective_count      | INTEGER | Hatali adet                     |
| defect_reason        | TEXT    | Hata nedeni (JSON dizisi)       |
| defect_source        | TEXT    | operatör/makine/malzeme/yonetim |
| defect_photo         | TEXT    | Hata fotografi yolu             |
| oee_score            | REAL    | OEE yuzdesi                     |
| first_pass_yield     | REAL    | FPY yuzdesi                     |
| takt_time_ratio      | REAL    | Takt zamani orani               |
| quality_score        | REAL    | Kalite puani                    |
| unit_value           | REAL    | Birim deger TL                  |
| net_work_minutes     | REAL    | Net calisma suresi dk           |
| notes                | TEXT    | Notlar                          |
| deleted_at           | DATETIME| Soft-delete                     |

### uretim_giris (Parti Tablosu)

| Alan           | Tip     | Aciklama                |
|----------------|---------|-------------------------|
| id             | TEXT    | UUID                    |
| model_id       | FK      | Model                   |
| order_id       | FK      | Siparis baglantisi      |
| total_quantity | INTEGER | Toplam hedef adet       |
| completed      | INTEGER | Tamamlanan adet         |
| start_date     | DATE    | Baslama tarihi          |
| target_date    | DATE    | Hedef bitis tarihi      |
| status         | TEXT    | devam/tamamlandi/iptal  |
| lot_changes    | TEXT    | Lot degisim kayitlari   |
| priority       | TEXT    | normal/acele/kritik     |

---

## YAPILACAK ISLER — ONCELIK SIRASI

KRITIK (Vizyon icin zorunlu):

- [ ] Prim motoru kur (PENCERE 8 tamamen bos)
- [ ] Personel self-serve portali (kendi verisini gorsun)
- [ ] Karar karsilastirma modulu
- [ ] Supabase migration tamamla

YUKSEK ONCELIK:

- [ ] Uretim M1-M9 sekmeleri tamamlanmasi
- [ ] Operasyon sure olcumu (gercek vs standart)
- [ ] Vardiya yonetimi
- [ ] Otomatik hata siniflandirma (AI)

ORTA ONCELIK:

- [ ] Saatlik uretim grafigi (canli)
- [ ] SGK/Bordro PDF
- [ ] Kamera entegrasyonu (makine basi izleme)

---

## CLAUDE ICIN HAZIR IS TALIMATLARI

### Talimat 1: Prim Motoru Kur

```
Hedef dosya: app/app/page.js
Yapilacaklar:
1. PrimUretSekmesi bileseni olustur
2. /api/prim-hesapla endpoint yaz (GET: personel_id, ay, yil)
3. Formul:
   Katki = SUM(uretilen x birim_deger x (1 - hata_orani))
   Prim = Katki > Maas_Maliyeti ise (Katki - Maas) x 0.3
4. Personele gosterim: Katki, Maas, Prim, Formul aciklama
5. Yonetici toplam raporu
Test: 2 farkli personel icin hesaplama yapip goster
```

### Talimat 2: Supabase Migration Tamamla

```
1. app/scripts/supabase-schema.sql dosyasini Supabase
   Dashboard > SQL Editor ekranina yapistir
2. Tum tablolari olustur
3. node scripts/migrate-all-to-supabase.mjs --force calistir
4. Her tablonun satir sayisini dogrula
5. GUNLUK-DURUM.md dosyasini guncelle
```

### Talimat 3: M1 Parti Kabul UI

```
Mevcut: /api/parti-kabul endpoint hazir
Yapilacak: PartKabulSekmesi UI bileseni yaz
Icerek:
- Tedarikci bilgisi
- Lot numarasi
- Beden dagilimi
- Kalite kontrol kisisi
- Hata foto
- Onay butonu
```
