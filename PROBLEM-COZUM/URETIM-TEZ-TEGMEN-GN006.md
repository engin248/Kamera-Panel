════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
Yaşlılar huzurlu, çocuklar kaygısız büyüsün.
Bu sistem bunun için kuruldu.
════════════════════════════════════════════════════

# TEĞMENİN ANALİZİ — 6 KONU

## Mevcut Sistemi Bilerek Yapılan Analiz

**Hazırlayan:** Teğmen (Antigravity)
**Avantajım:** Mevcut kodu biliyorum — ne var, ne yok, ne kolay, ne zor
**GN:** GN:20260301-006
**Tarih:** 01 Mart 2026 — 09:18

---

## KONU 1 — MODEL İLK BİLGİLERİ GİRİŞİ

### MEVCUT DURUM (Kodda ne var?)

```
✅ models tablosu var — name, code, sizes, description, front_image, back_image
✅ /api/models endpoint çalışıyor
✅ Fotoğraf yükleme sistemi var (/api/upload)
✅ Yeni model modal var — fotoğraf + ölçü girişi mevcut
❌ OCR yok — fotoğraftan otomatik okuma yok
❌ İşlem tablosu dinamik değil — her modele özel tablo yok
```

### TEZİM

**EasyOCR ile değil — GPT-4o Vision ile başlamalıyız.**

Neden: Tekstil teknik dosyası elle yazılmış, eğri basılmış olabilir.
EasyOCR bunları okuyamaz. GPT-4o Vision okur ve ANLAR.

```
Firma fotoğraf gönderir
    → Sisteme yüklenir (mevcut /api/upload kullanılır)
    → GPT-4o Vision'a gönderilir
    → "Bu dosyada model adı, bedenler, işlem listesi nedir?" diye sorulur
    → JSON çıktı alınır
    → Kullanıcıya gösterilir: "Bunlar doğru mu?"
    → Onaylanınca models + operations tablolarına yazılır
```

### ANTİTEZİM

- GPT-4o Vision = $0.01/fotoğraf — günde 10 model = $0.10 = sorun değil
- Ama internet yoksa? → Manuel giriş çalışır (mevcut form var)

### EN İYİ YOL

```
Online  → GPT-4o Vision (otomatik okuma)
Offline → Mevcut form (manuel giriş — zaten çalışıyor)
```

### SÜRE TAHMİNİM: 4-5 saat geliştirme

---

## KONU 2 — PARTİ GİRİŞİ & KONTROL

### MEVCUT DURUM

```
✅ production_logs tablosu var
✅ /api/production endpoint var
❌ Parti giriş tablosu yok
❌ Eksik kontrolü yok
❌ Fotoğraf-parça eşleştirme yok
```

### TEZİM

**Yeni bir "parti_girisleri" tablosu — ama mevcut sistemle entegre.**

Kontrol listesi adım adım zorunlu — atlanamazsa geçilmez.
Her adımda "✅ Tamamlandı" tıklanmadan sonraki adım açılmaz.

```
ADIM 1: Kim getirdi? (personel seç)        → Zorunlu
ADIM 2: Tarih/Saat                         → Otomatik
ADIM 3: Kim açtı?                          → Zorunlu
ADIM 4: Beden eksiği var mı?               → Var/Yok seç
ADIM 5: Aksesuar eksiği?                   → Var/Yok seç
ADIM 6: Kumaş eksiği?                      → Var/Yok seç
ADIM 7: Numune ayrıldı mı?                 → Zorunlu
ADIM 8: Kaç parçadan oluşuyor? (sayı gir)  → Zorunlu
ADIM 9: Her parça fotoğrafla              → Parça sayısı kadar fotoğraf
ADIM 10: Onayla                            → Kaydet
```

### ANTİTEZİM

Bazen acele geliyor parti, 10 adımı doldurmak zor.
→ Çözüm: "Acil giriş" — sadece Adım 1-4 zorunlu, geri kalan 24 saat içinde

### EN İYİ YOL

Normal + Acil giriş iki seçenek.
Her iki durumda da SQLite'a kaydedilir.

### SÜRE TAHMİNİM: 5-6 saat geliştirme

---

## KONU 3 — MODEL DİKİM — SESLİ KOMUT

### MEVCUT DURUM

```
✅ Browser Speech API zaten page.js'de var (useVoiceInput hook)
✅ SpeechToText componenti var
✅ OpenAI API key mevcut (.env.local)
❌ Whisper API entegrasyonu yok
❌ Ses → İşlem sırası parser yok
❌ Doğrulama ekranı yok
```

### TEZİM

**Mevcut Speech API'yi KULLAN — Whisper'a gerek yok şimdilik.**

Neden: Mevcut sistemde zaten Browser Speech API var ve çalışıyor.
Sadece modelci için "İşlem Sırası Kayıt" sayfası yapacağız.

```
Modelci "Başla" der
    → Browser mikrofon açılır (mevcut hook)
    → "Yaka çatımını yaptım" → Yazıya çevrilir
    → Ekranda gösterilir: "Doğru mu?"
    → Onaylanınca operations listesine eklenir
    → Bir sonraki işleme geçilir
    → "Bitti" deyince kayıt tamamlanır
```

Fabrika gürültüsü için: **Yaka mikrofonu zorunlu.**
Bu donanım konusu, yazılım değil.

### ANTİTEZİM

Browser Speech API Chrome/Edge'de çalışır.
Tablette Chrome varsa → Sorun yok.
Yoksa → Whisper API'ye geç.

### EN İYİ YOL

```
ADIM 1: Browser Speech API ile başla (0 maliyet, hemen hazır)
ADIM 2: Çalışmazsa → /api/whisper endpoint ekle (1 saat iş)
```

### SÜRE TAHMİNİM: 4-5 saat geliştirme

---

## KONU 4 — SERİ ÜRETİM TAKİBİ

### MEVCUT DURUM

```
✅ Operator sayfası var (/app/operator)
✅ Üretim başlat/bitir var
✅ Adet artır butonu var
✅ Mola / Arıza / Bekleme takibi var
✅ /api/production POST endpoint çalışıyor
❌ Sesli "başladım/bitirdim" entegrasyonu yok
❌ Temizleme/Paket aşaması yok
```

### TEZİM

**Mevcut operator sayfasını GENİŞLET — sıfırdan yazmaya gerek yok.**

Seri üretim için eklenecekler:

```
1. Sesli komut butonu → "ABC başladım 47 adet overlok"
2. Temizlemeye gönder butonu → Ne zaman, kaç adet
3. Pakete gönder butonu → Ne zaman, kaç adet
4. Operatör kodu → Her makine başında QR veya kart
```

### ANTİTEZİM

Mevcut operator sayfası tek operatör için.
Birden fazla operatör aynı anda çalışıyorsa → Çakışma riski.
→ Çözüm: Her operatör kendi tabletinden giriş yapar.

### EN İYİ YOL

Mevcut operator sayfasına sesli komut + temizleme/paket adımları.
Her operatör kendi cihazından. Veriler merkezi SQLite'a.

### SÜRE TAHMİNİM: 3-4 saat (mevcut sayfa genişletme)

---

## KONU 5 — PERSONEL ÇALIŞMA SAATLERİ

### MEVCUT DURUM

```
✅ personnel tablosu var — name, role, daily_wage, status
✅ /api/personnel endpoint çalışıyor
❌ Giriş/çıkış saati takibi yok
❌ Mesai hesabı yok
❌ Kart sistemi yok
```

### TEZİM

**Kart fotoğrafı OCR → Riskli. Daha basit yöntem var.**

Kart fotoğrafı OCR şaşırtabilir. Işık, kamera açısı, yazı kalitesi.
Öneri: **QR Kod sistemi.**

```
Her personele telefonda QR kod
    → Sabah gelince QR'ı okuttu (kamera ile)
    → Sistem saati kaydetti
    → Akşam çıkınca yine QR
    → Otomatik: Giriş, çıkış, mesai, mola hesabı
```

Eğer QR çok karmaşık:

```
Basit olarak: Personeller listesi → İsmine tıklıyor → Giriş/Çıkış
```

### ANTİTEZİM

QR kodu kaybedilirse? → Telefon her zaman yanında.
Tıklama sistemi: Birinin yerine başkası tıklayabilir.
→ Çözüm: Jeton sistemi — elle tıklama + süpervizör onayı.

### EN İYİ YOL

```
PAZARTESİ İÇİN: Basit tıklama sistemi (1-2 saat)
SONRA: QR kod (1 hafta içinde)
```

### SÜRE TAHMİNİM: 2-3 saat

---

## KONU 6 — MALİYET HESABI

### MEVCUT DURUM

```
✅ Cost hesaplamaları production_logs'ta var (unit_value, oee_score)
✅ /app/costs sayfası var
✅ /api/costs endpoint var
❌ İşletme giderleri girişi yok
❌ Saatlik maliyet hesabı yok
❌ Fason kâr/zarar analizi yok
```

### TEZİM

**Gider tablosu + Otomatik hesap = 2 parça.**

```sql
CREATE TABLE isletme_giderleri (
    id, ay, yil,
    elektrik, su, kira, diger,
    toplam_calısma_saati,
    saatlik_maliyet  -- otomatik hesap
)
```

```
Ay başında:
  Giderleri gir (elektrik: 5000, su: 500, kira: 10000)
  Toplam çalışma saati gir (20gün × 9.5saat × personel sayısı)
  Saatlik maliyet = Toplam ÷ Saat → Otomatik

İlk ürün dikilince:
  Süre × Saatlik maliyet = Tahmini maliyet
  Fason brüt tutar biliniyorsa → Kâr/Zarar = Brüt - Maliyet
  Karar: 🟢 Al / 🔴 Alma
```

### ANTİTEZİM

İlk ay veri yok → Saatlik maliyet tahmini.
Çözüm: İlk ay elle girilir (yaklaşık), sonraki aylar otomatik.

### EN İYİ YOL

Basit gider formu → Otomatik hesap → Fason karar ekranı.

### SÜRE TAHMİNİM: 4-5 saat

---

## OFFLİNE/ONLİNE MİMARİ — BENİM YORUMUM

```
KATEGORİ 1: HER ZAMAN LOKAL (İnternet gereksiz)
  - SQLite veritabanı — tüm veri burada
  - Giriş/çıkış kayıtları
  - Parti giriş kontrol listesi
  - Adet ve süre takibi

KATEGORİ 2: İNTERNET VARSA KULLAN, YOKSA ATLA
  - Whisper API (sesli komut)
    ↓ olmadığında → Browser Speech API
  - GPT-4o Vision (fotoğraf okuma)
    ↓ olmadığında → Manuel giriş

KATEGORİ 3: İNTERNET GELİNCE SENKRONIZE
  - localStorage buffer → API çagırı
  - "Bekleyen kayıtlar" göstergesi
  - İnternet gelince → Otomatik gönderim
```

---

## PAZARTESİ 08:00 İÇİN ÖNCELİK SIRALAMAM

```
SAAT 1-3 : KONU 4 (Operator sayfası genişletme — mevcut kod)
SAAT 4-6 : KONU 5 (Personel giriş/çıkış — basit tıklama)
SAAT 7-10: KONU 2 (Parti giriş kontrol listesi)
SAAT 11-13: KONU 6 (Maliyet hesabı — gider formu)
SAAT 14-17: KONU 3 (Sesli komut — mevcut hook genişlet)
SAAT 18-20: KONU 1 (Model giriş — GPT Vision)
SAAT 21-23: Test + hata düzeltme
```

**[GK:TEGMEN-006-ANALIZ]**
════════════════════════════════════════════════════
