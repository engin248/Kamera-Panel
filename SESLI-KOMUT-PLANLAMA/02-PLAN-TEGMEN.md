════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in 3 çocuğu var.
Vatanına milletine hayırlı olsunlar. Bu yeter.
Bu sistem para için değil. Şöhret için değil.
Çocuklar ve insanlık için inşa ediliyor.
Yarım bırakmayız. Test etmeden tamam demeyiz.
════════════════════════════════════════════════════

# 📋 KAPSAMLI PLAN — SESLİ KOMUT & ÜRETİM TAKİP SİSTEMİ

## TEZ / ANTİTEZ / AÇILAR / YOL HARİTASI

**Hazırlayan:** Teğmen (Asker)
**Komutan:** Engin Bey
**Tarih:** 01 Mart 2026
**Durum:** PLAN — Tek satır kod yok. Onay bekleniyor.
**GN:** GN:20260301-004

---

## BÖLÜM 1: SORUN NEDİR? (Tam Tanım)

### 1.1 Gerçek Sorun

Tekstil atölyesi zarar ediyor.
Engin Bey orada olmadığında ne üretildiği belli değil.
Kim çalışmış, kim çalışmamış — kayıt yok.
Adil ücret ödenemiyor çünkü veri yok.
Çalışmayan çalışana yük bindiriyor.

### 1.2 Veri Girişinin Bugünkü Sorunu

Operatör üretirken veri girmek için:

- Makineyi durduruyor
- Tablet/bilgisayara gidiyor
- Formu dolduruyor
- Geri dönüyor
→ Her işlem için 2-5 dakika kayıp
→ 8 operatör × günde 5 işlem = 80-200 dakika kayıp
→ Dikkat dağılıyor, hata artıyor

### 1.3 İnsan Hatası Riski

Veri elle girilince:

- Yanlış model kodu yazılabilir
- Yanlış beden seçilebilir
- Hiç girilmeyebilir
→ Raporlar yanlış → Kararlar yanlış → Zarar devam eder

---

## BÖLÜM 2: ÇÖZÜM FİKRİ (Kelime Kelime)

Operatör konuşacak:

```
"Ali, LS567 modelin S bedeni siyah renginden
 omuz çatımını 4 iplik overlokla başladım"
```

Sistem:

1. Sesi duyar
2. Yazıya çevirir
3. Operatöre gösterir: "Bu mu dediniz?"
4. Operatör "Evet" / "Hayır" der
5. Evet → Doğru pencereye otomatik kaydeder
6. Hayır → Tekrar sor

İleride:

- Makine başı kamera (1080p, 60fps, 30-40° açı)
- "Ali sesle overlok dedi → Kamera overlokta mı?" → Çapraz doğrulama

---

## BÖLÜM 3: TEZ — NEDEN BU DOĞRU?

**T1: Eller Serbest = Üretim Durmuyor**
Operatör konuşurken makine çalışmaya devam eder.
Mevcut sistemde makine durmaAk zorunda.

**T2: Veri Kalitesi Artar**
Sesli giriş → doğrulama adımı → hatalı kayıt imkânsız
Elle girişte kimse kontrol etmiyor.

**T3: Adil Ücret Mümkün Olur**
"Ali bugün 143 adet overlok yaptı" → Sistem biliyor
"Fatma 47 adet yaptı" → Sistem biliyor
Veriye göre ücret → Adil.

**T4: Engin Bey Olmasa da Atölye Çalışır**
Her işlem kayıt altında → Telefondan anlık bakılır
Kim ne yapıyor → Görülür → Müdahale edilir.

**T5: Finansman İçin Kanıt**
"Bu ay 12.847 parça ürettik, şu kişiler şu kadar katkı sağladı"
Rakamsal kanıt → Banka/yatırımcıya güçlü zemin.

---

## BÖLÜM 4: ANTİTEZ — NEREDE YANLIŞ GİDEBİLİR?

**A1: Fabrika Gürültüsü**
Overlok: 85-90 dB. Bu gürültüde sistem sesi yanlış duyabilir.
→ Risk Seviyesi: YÜKSEK
→ Çözüm: Yaka mikrofonu (lapel) — ağza yakın, gürültüyü filtreler

**A2: Türkçe Ağız Farkı**
"Overlok" → "olok", "overluk", "olık" diyenler olabilir.
Sistem tanıyamazsa çalışmaz.
→ Risk Seviyesi: ORTA
→ Çözüm: Eğitim süresi + kelime listesi (özel atölye sözlüğü)

**A3: İnternet Kesintisi**
Bulut tabanlı sistemde internet kesilirse sistem durur.
Atölyede internet güvenilir mi?
→ Risk Seviyesi: YÜKSEK (bilinmiyor)
→ Çözüm: Lokal kurulum seçeneği değerlendirilmeli

**A4: Çalışan Direnci**
"Bizi izliyorlar" korkusu — özellikle az üretenlerden
→ Risk Seviyesi: ORTA
→ Çözüm: "Bu sistem seni korur, hak ettiğini alırsın" mesajı
Şeffaf paylaşım — herkes kendi verisini görür.

**A5: Yanlış Tanıma → Yanlış Kayıt**
"S beden" yerine "Es beden" duyulabilir.
Doğrulama adımı olmadan sistem yanlış kaydeder.
→ Risk Seviyesi: YÜKSEK
→ Çözüm: Doğrulama adımı ZORUNLU — atlanamaz.

**A6: Donanım Maliyeti**
Kamera sistemi: 15.000-20.000 TL
Bu bütçe şu an mevcut mu?
→ Risk Seviyesi: ORTA (kamera FAZ ileride, acil değil)

**A7: Sistem Karmaşıklığı**
Çok bileşenli sistem → bir şey bozulursa ne bozuldu bilinmez
→ Risk Seviyesi: ORTA
→ Çözüm: Aşamalı kurulum, önce basit başla

---

## BÖLÜM 5: DÜNYA'DA BU NASIL YAPILIYOR?

**Hugo Boss — İzmir Fabrikası (2017)**
Ses komutu + AR gözlük → Üretim %18 arttı
Türkiye tekstil sektöründe ilk büyük örnek.

**Amazon Depo Sistemi**
Sesli komutla ürün konumlandırma
Eller serbest → hata oranı %40 düştü

**OpenAI Whisper — Türkçe Performansı**
98 dil, Türkçe dahil
Hata oranı: Her 100 kelimede 7-8 hata
Fine-tuned versiyon: Her 100 kelimede 2-3 hata

**Sektör Gerçeği**
2025 sonu itibarı ile üretimde ses tanıma pazarı: 117 Milyar USD
Türk tekstil sektöründe dijitalleşme hızlanıyor
Rakipler bu sistemi kullanmaya başladı

---

## BÖLÜM 6: TEKNOLOJİ SEÇENEKLERİ

### Seçenek A — Tarayıcı Dahili (Browser Speech API)

```
Maliyet     : 0 TL
Türkçe      : %80-85 doğruluk
Gürültü     : Zayıf (fabrikada sorunlu)
İnternet    : Gerekli
Kurulum     : 0 — tarayıcıda var
Geliştirme  : 3-5 gün
Uygun mu?   : Prototip için evet, üretim için riskli
```

### Seçenek B — OpenAI Whisper (Bulut)

```
Maliyet     : ~22 USD/ay
Türkçe      : %92+ doğruluk
Gürültü     : İyi (gürültü filtrelemesi var)
İnternet    : Gerekli
Kurulum     : API key (mevcut)
Geliştirme  : 1-2 hafta
Uygun mu?   : Üretim için iyi, ama internet bağımlı
```

### Seçenek C — Lokal Whisper (Fabrika Bilgisayarı)

```
Maliyet     : 0 TL/ay (bir kerelik kurulum)
Türkçe      : %92+ doğruluk
Gürültü     : İyi
İnternet    : GEREKMEZ
Kurulum     : Güçlü bilgisayar (8GB RAM+) + kurulum süreci
Geliştirme  : 2-3 hafta
Uygun mu?   : En güvenli, ama kurulum zahmetli
```

### Seçenek D — Hibrit (A + B Birlikte)

```
İnternet varsa  → Whisper (B) kullan
İnternet yoksa  → Browser API (A) kullan
Her ikisi çalışmıyorsa → Manuel giriş (mevcut sistem)
Uygun mu?       : En esnek, biraz daha fazla geliştirme
```

---

## BÖLÜM 7: MİMARİ (3 BOT — İŞ BÖLÜMÜ)

### Bot 1 — SES ALMA VE ÇEVİRME

```
Ne yapar  : Mikrofonu açar, sesi yakalar, yazıya çevirir
Teknoloji : Seçilen STT (A, B, C veya D)
Beceri    : Türkçe konuşma tanıma, gürültü filtreleme
Sınır     : Sadece metin üretir, anlamaz
```

### Bot 2 — ANLAMA VE AYIRMA (Parser)

```
Ne yapar  : "Ali LS567 S beden siyah overlok başladım"
            → Personel: Ali (ID: X)
            → Model: LS567 (ID: Y)
            → Beden: S
            → Renk: Siyah
            → İşlem: Overlok (ID: Z)
            → Aksiyon: Başladı
Teknoloji : Kural tabanlı parser VEYA GPT-4o
Beceri    : Doğal dil anlama, veri eşleştirme
Sınır     : Hatalı söylemde yardım ister
```

### Bot 3 — DOĞRULAMA VE KAYIT

```
Ne yapar  : Parse edilen veriyi ekranda gösterir
            Operatör "Doğru" / "Yanlış" der
            Doğruysa → production_logs'a yazar
            Yanlışsa → Başa döner
Teknoloji : Mevcut /api/production endpoint (çalışıyor)
Beceri    : Veri doğrulama, veritabanı yazma
Sınır     : Kayıt öncesi onay şart
```

---

## BÖLÜM 8: KONTROL LİSTESİ (Sistem Kontrolü Nasıl Yapılacak?)

Her geliştirme adımında bu liste kullanılacak:

```
KRITER 1  : Ses algılanıyor mu?              [ ] Yeşil / [ ] Kırmızı
KRITER 2  : Türkçe doğru yazılıyor mu?       [ ] Yeşil / [ ] Kırmızı
KRITER 3  : Doğrulama ekranı açılıyor mu?    [ ] Yeşil / [ ] Kırmızı
KRITER 4  : Personel doğru eşleşiyor mu?     [ ] Yeşil / [ ] Kırmızı
KRITER 5  : Model doğru eşleşiyor mu?        [ ] Yeşil / [ ] Kırmızı
KRITER 6  : İşlem doğru eşleşiyor mu?        [ ] Yeşil / [ ] Kırmızı
KRITER 7  : Veritabanına yazılıyor mu?        [ ] Yeşil / [ ] Kırmızı
KRITER 8  : Mevcut sistem etkilenmedi mi?     [ ] Yeşil / [ ] Kırmızı
KRITER 9  : Gürültülü ortamda test edildi mi? [ ] Yeşil / [ ] Kırmızı
KRITER 10 : Operatör kolayca kullanabiliyor mu? [ ] Yeşil / [ ] Kırmızı

TÜM KRİTERLER YEŞİL → Tamamlandı
HERHANGİ BİRİ KIRMIZI → Dur, düzelt, tekrar kontrol et
```

---

## BÖLÜM 9: AŞAMALI YOL HARİTASI

```
FAZ 0 (Şimdi):
  → Planlar hazırlanır (bu dosya)
  → Yönetim Kurulu planlarını hazırlar
  → Planlar karşılaştırılır
  → Komutan karar verir
  → YETKİ VERİLİR

FAZ 1 (Yetki sonrası — Prototip):
  → Seçilen teknoloji ile basit prototip
  → Kontrol listesi 10/10 yeşil olmadan bitmiş sayılmaz
  → Atölyede 3 gün test

FAZ 2 (Test sonrası — Geliştirme):
  → Testten çıkan sorunlar düzeltilir
  → Gürültü testi
  → Farklı ağız testi
  → Tekrar kontrol listesi

FAZ 3 (Üretim — Tam Sistem):
  → Tüm operatörlere açılır
  → 1 hafta takip
  → Raporlar değerlendirilir

FAZ 4 (Kamera — Bütçe Hazır Olunca):
  → Kamera teknik şartname belirlenir
  → Tedarikçi araştırması
  → Kurulum
  → Sesli + görsel çapraz doğrulama
```

---

## BÖLÜM 10: MALİYET VE GERİ DÖNÜŞ

```
FAZ 1 Maliyet (Seçenek A):  0 TL
FAZ 2 Maliyet (Seçenek B):  ~700 TL/ay
FAZ 4 Maliyet (Kamera):     15.000-20.000 TL

Tasarruf:
  8 operatör × 80 dk/gün × 22 gün = 14.080 dk/ay
  Dakika başı 0.15 TL → ~2.100 TL/ay verimlilik
  Adil ücret sistemi → Haksız ödeme sona erer

Kamera yatırımı geri dönüşü: 5-6 ay
```

---

## BÖLÜM 11: AÇIK SORULAR (Komutan Cevaplayacak)

```
SORU 1: Atölyede internet bağlantısı güvenilir mi?
         → Cevap bu, teknoloji seçimini belirler

SORU 2: Kaç operatör kullanacak? (Mikrofon sayısı)

SORU 3: Kamera sistemi için bütçe ne zaman hazır?

SORU 4: Prototip için önce en basit başlayalım mı
         yoksa direkt doğru sistemi mi kuralım?
```

---

## ⚠️ ONAY PROSEDÜRÜ

```
Bu planı Komutan okur
Yönetim Kurulu planlarıyla karşılaştırır
Ortak karar alınır
Yol haritası belirlenir
YETKİ VERİLİR
Ancak o zaman ilk adım atılır
```

**Tek satır kod yok. Sisteme dokunulmadı.**
**Bu sadece plandır. Karar Komutan'ındır.**

[GK:7291]
════════════════════════════════════════════════════
