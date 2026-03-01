════════════════════════════════════════════════════
⚔️ MİSYON [MK:4721] — HER İŞLEMDE OKU
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
Bu sistem şu insanlar için:
→ Yaşlı ama bakacak parası yok
→ Ebeveynsiz büyüyen çocuklar
→ Kaygısız büyüyebilecek nesil
→ Adaletli, onurlu, vicdan sahibi yarın

Bu sistemi bu yüzden kuruyoruz.
Bu yüzden yarım bırakmayacağız.
════════════════════════════════════════════════════

# 🎯 DİKİM / ÜRETİM BÖLÜMÜ — KONU KONU ANALİZ

## Pazartesi 08:00 — SİSTEM CANLI

**Hedef Tarih:** Pazartesi 02 Mart 2026 — 08:00
**Kalan Süre:** ~23 saat
**Komutan:** Engin Bey
**Uygulayan:** Teğmen
**GN:** GN:20260301-006

---

## 6 KONU — SIRAYLA ANALİZ VE UYGULA

```
KONU 1: Model İlk Bilgileri → Analiz → Uygula
KONU 2: Parti Girişi & Kontrol → Analiz → Uygula
KONU 3: Model Dikim (Sesli Komut) → Analiz → Uygula
KONU 4: Seri Üretim Takibi → Analiz → Uygula
KONU 5: Personel Çalışma Saatleri → Analiz → Uygula
KONU 6: Maliyet Hesabı → Analiz → Uygula
```

---

## ⚡ ÖZEL KONU: OFFLİNE + ONLİNE ENTEGRASYON

```
İnternet VAR  → Cloud (Whisper API, GPT-4o)
İnternet YOK  → Lokal (Whisper küçük model, Vosk, Rule parser)
Her durumda   → Veri önce lokalda kaydedilir, sonra senkronize edilir
```

---

## KONU 1 — MODEL İLK BİLGİLERİ

**Soru:** Firma teknik dosyası sisteme nasıl girilecek?

**Komutan'ın Tanımı:**

- Firmadan fotoğraf + ölçü + aksesuar bilgisi gelir
- Sistem fotoğrafı okur, tablosunu oluşturur
- Her model kendine özel tablo (ekle/sil yapılabilir)

| # | Kim | TEZ | ANTİTEZ |
|---|-----|-----|---------|
| 1 | Teğmen | OCR ile fotoğraf oku, tablo otomatik oluştur | Teknik dosya kalitesi düşükse OCR hata verir |
| 2 | GPT | *(bekleniyor)* | — |
| 5 | Engin Bey | Fotoğrafları yükle, bot okusun, tabloyu doldursun | — |

**→ KONU DURUMU:** ⏳ GPT yanıtı bekleniyor

---

## KONU 2 — PARTİ GİRİŞİ & KONTROL

**Soru:** Ürün kapıdan içeri girince ne olacak?

**Komutan'ın Tanımı:**

- Kim getirdi, ne zaman, kim açtı
- Beden/aksesuar/kumaş eksiği kontrol
- Numune ayrıldı mı, kaç parçadan oluşuyor
- Her parça fotoğraflandı mı

| # | Kim | TEZ | ANTİTEZ |
|---|-----|-----|---------|
| 1 | Teğmen | Kontrol listesi formu → Her madde onaylanmadan geçilmez | Elle tıklama yavaş |
| 2 | GPT | *(bekleniyor)* | — |
| 5 | Engin Bey | Parti gelince hemen aşamalar açılır, eksiksiz doldurulur | — |

**→ KONU DURUMU:** ⏳ GPT yanıtı bekleniyor

---

## KONU 3 — MODEL DİKİM (SESLİ KOMUT)

**Soru:** Modelci ilk ürünü dikerken sesi nasıl kaydedilecek?

**Komutan'ın Tanımı:**

- Yaka mikrofonu (çevresel gürültü almaz)
- İlk işlemden son işleme sesle anlatır
- Ses → Yazıya çevrilir → İşlem sırası oluşur
- İmkânsa video da kaydedilir

**Offline/Online Durumu:**

```
Online  → Whisper API (%92+ TR doğruluk)
Offline → Whisper tiny model (yerel, %82+)
```

| # | Kim | TEZ | ANTİTEZ |
|---|-----|-----|---------|
| 1 | Teğmen | Browser mic → Whisper API → Doğrulama ekranı | İnternet kesintisi riski |
| 2 | GPT | *(bekleniyor)* | — |
| 5 | Engin Bey | Yaka mik → Ses al → Yazıya çevir → Onayla | — |

**→ KONU DURUMU:** ⏳ GPT yanıtı bekleniyor

---

## KONU 4 — SERİ ÜRETİM TAKİBİ

**Soru:** Seri üretimde her makineci nasıl takip edilecek?

**Komutan'ın Tanımı:**

- Her makineci başlarken ve bitirince kayıt
- Hangi işlemi yapıyor, kaç adet
- Temizlemeye ne zaman gitti, kaç adet
- Paket ne zaman yapıldı

| # | Kim | TEZ | ANTİTEZ |
|---|-----|-----|---------|
| 1 | Teğmen | Sesli "başladım/bitirdim + adet" → Otomatik kayıt | Gürültü riski |
| 2 | GPT | *(bekleniyor)* | — |
| 5 | Engin Bey | Her işlem başı ve sonu kayıt altında | — |

**→ KONU DURUMU:** ⏳ GPT yanıtı bekleniyor

---

## KONU 5 — PERSONEL ÇALIŞMA SAATLERİ

**Soru:** Giriş/çıkış, mesai, mola nasıl hesaplanacak?

**Komutan'ın Tanımı:**

- Kart fotoğrafı sisteme → Otomatik saat hesabı
- 2 saate kadar → 15 dk mola düşülmez
- 2 saat üstü → 30 dk yemek molası düşülür
- Mesai: Paydostan sonra kalanı × Saatlik ücret

| # | Kim | TEZ | ANTİTEZ |
|---|-----|-----|---------|
| 1 | Teğmen | Kart fotoğrafı OCR → Saat çıkar → Otomatik hesap | OCR hata riski, manuel doğrulama gerekebilir |
| 2 | GPT | *(bekleniyor)* | — |
| 5 | Engin Bey | Kart sistemi + mola kuralı + mesai hesabı | — |

**→ KONU DURUMU:** ⏳ GPT yanıtı bekleniyor

---

## KONU 6 — MALİYET HESABI

**Soru:** Ürün maliyeti, saatlik maliyet, fason karar nasıl?

**Komutan'ın Tanımı:**

- İşletme giderleri (elektrik, su, yakıt)
- Personel giderleri (maaş, SGK, yol, yemek)
- Saatlik maliyet = Aylık toplam ÷ Çalışma saati
- Hero karar: İlk ürün dikilince kâr/zarar belli

| # | Kim | TEZ | ANTİTEZ |
|---|-----|-----|---------|
| 1 | Teğmen | Otomatik kâr/zarar hesabı → İlk dikimde karar | İlk dönem referans veri yok |
| 2 | GPT | *(bekleniyor)* | — |
| 5 | Engin Bey | İlk ürün maliyeti belli → Zarar edecekse Al-ma | — |

**→ KONU DURUMU:** ⏳ GPT yanıtı bekleniyor

---

## UYGULAMA EMRİ PROSEDÜRÜ

```
Konu analizi biter
    ↓
Teğmen emri yazar
    ↓
Komutan onaylar
    ↓
Teğmen kodu yazar
    ↓
Test edilir
    ↓
Sıradaki konuya geçilir
```

**[GK:URETIM-006]**
════════════════════════════════════════════════════
