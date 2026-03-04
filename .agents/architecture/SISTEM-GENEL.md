# SISTEM-GENEL.md — TAM SİSTEM DOKÜMANTASYONU

> Versiyon: 1.0 | Tarih: 2026-03-03
> Kural: Her karar veriye ve analize dayanir. Duyguya degil.

---

## SISTEM FELSEFESI

- Basari ve basarisizlik kisinin kendi mucadelesine bagli olmali
- Kararlar veriye ve bilgiye gore alinmali
- Ucretlendirme katkiya gore, adil ve seffaf olmali
- Sistem insan yokken de calismali
- Her karar gelecek icin bilgi uretmeli

---

## ISLETME YAPISI — 4 BOLUM

```
[YZ OFISI - Beyin]
   Tum bolümlerin verisi burada toplanir
   Capraz analiz + otomatik karar onerileri
   |
   +--- [URETIM / FASON DIKIM] (AKTIF SIMDI)
   +--- [IMALAT]               (SIRADA)
   +--- [MAGAZA]               (SIRADA)
```

---

## KARAR AKIS SISTEMI (TUM BOLUMLER)

```
Sistem Analiz Eder
       ASAGI
Sistem Oneri Uretir
       ASAGI
Sorumlu Yönetici Görür
       ASAGI
   Uyguladir mi?
  EVET      HAYIR (Manuel yapti)
   |              |
Sonuc       Manuel sonuc kaydedilir
kaydedilir  (ne onerildi / ne yapildi)
        |              |
    [KARSILASTIRMA RAPORU OLUSUR]
              |
     [BILGI HAVUZU GUNCELLENIR]
              |
  [SISTEM BIR SONRAKI KARARI DUZELTIR]
```

Kural: Sistem onerisi dinlenmediginde ceza yok.
Ama karsilastirma kaydi tutulur. Zamanla dogru karar ortaya cikar.

---

## ADIL UCRETLENDIRME MOTORU

```
Katki Degeri  = Uretilen Adet x Birim Deger
Maas Maliyeti = Baz Maas + Yan Haklar

Eger Katki Degeri > Maas Maliyeti:
  Prim = (Katki Degeri - Maas Maliyeti) x Prim Orani
  OTOMATIK HESAPLANIR + SEFFAF GOSTERILIR

Prim Orani: Analiz + veri ile sonradan belirlenir
Temel kural: Isletme surdurulebilir olmali
```

Personel gordugu bilgiler:

- Kendi uretim adeti
- Hesaplanan katki degeri
- Maas maliyeti
- Prim miktari ve formulu

---

## AI MIMARISI

### Genel YZ Ofisi Yapay Zekasi

- Tum bolümlerin verisini okur
- Capraz analiz yapar
- Haftalik/aylik raporlar uretir
- Gecmis kararlari analiz ederek ogrenenir

### Bolum AI Botlari

| Bot       | Motor            | Bolum           | Uzmanlik                |
|-----------|------------------|-----------------|-------------------------|
| Kamera    | Gemini 2.0 Flash | Uretim+Personel | Anlik operasyon verisi  |
| Muhasip   | GPT-4o-mini      | Maliyet+Rapor   | Finans + prim analizi   |
| Tekniker  | DeepSeek         | Modeller+Kalite | Teknik operasyon detayi |
| Kasif     | Perplexity       | Tum sekmeler    | Piyasa arastirmasi      |
| YZ Sorumlusu | GPT-4o        | YZ Ofisi        | Capraz analiz+strateji  |

### Ses >> Yazi >> Onay >> Islem Akisi

```
Adim 1: Kullanici sesli komut verir
Adim 2: Ses yaziya donusturulur (transcript)
Adim 3: Yazi kullaniciya gosterilir
Adim 4: Kullanici ONAYLA der veya tusa basar
Adim 5: Sistem islemi kaydeder
```

KURAL: Ses komutu ASLA dogrudan islenmez. Onay sarti kesindir.

---

## VERITABANI MIMARISI

### Su An (Hibrit)

| Motor      | Tablolar              | Durum                 |
|------------|-----------------------|-----------------------|
| Supabase   | personnel             | Aktif                 |
| SQLite     | Diger 20+ tablo       | Gecis bekliyor        |

### Hedef (Tam Supabase)

- Tum tablolar Supabase'de
- Row Level Security (RLS) aktif
- Gercek zamanli guncellemeler aktif
- Otomatik yedekleme gunluk

---

## BOLUM DOKUMANLAR

| Dosya                  | Bolum              | Durum      |
|------------------------|--------------------|------------|
| BOLUM-URETIM-FASON.md  | Uretim + Fason     | AKTIF      |
| BOLUM-IMALAT.md        | Imalat             | SIRADA     |
| BOLUM-MAGAZA.md        | Magaza             | SIRADA     |
| BOLUM-YZ-OFISI.md      | YZ Ofisi           | SIRADA     |

---

---

## YETKI SISTEMI — KATMANLI ERISIM

PRENSIP: Herkes yalnizca kendi sorumluluk alani ve belirlenen
yetki sinirinda sisteme erisebilir.
Yetkisiz erisim girisimi engellenir ve KAYIT ALTINA ALINIR.

| Rol          | Erisilen Alanlar                     | Veri Gorürluk                  |
|--------------|--------------------------------------|--------------------------------|
| koordinator  | TAM YETKI - Tum sistem               | Her sey                        |
| bolum_mudur  | Kendi bolumunun tum ekranlari        | Kendi bolumunun tamami         |
| ustabasi     | Uretim + Personel ekranlari          | Gunluk uretim + ekip bilgisi   |
| kaliteci     | Kalite + Hata ekranlari              | Kalite verileri                |
| muhasip      | Maliyet + Rapor + Prim ekranlari     | Mali veriler                   |
| operator     | Sadece tablet ekrani                 | Yalnizca kendi uretim kaydi    |
| personel     | Self-serve portal                    | Kendi profili + kendi primi    |

---

## KAR ORTAKLIGI PRENSIBI

Her calisan (sahip dahil) isletmenin KAR ORTAGIDIR.

- Katki Degeri > Maas Maliyeti ise PRIM KAZANILIR
- Verilecek hak GERI ALINAMAZ
- Isletme surdurulebilir olmali (once hayatta kal)
- Sahip olmadigi zamanda sistem kanun+kurallarla calisir

---

## KAMUYA ACIK VIZYON

Asama 1 (Su An): Kendi isletmemizin sistemini kur, duzelt, ogren
Asama 2 (Ileride): Sistem kamuya ve diger isletmelere acilir

- Diger tekstil atolyeleri kullanabilir
- Genel insanlik yararina acik kaynak
- Sistem zamanla daha akilli hale gelir

---

## ENTEGRASYON PRENSIBI

- Ust sistemlere baglanabilir (muhasebe, SGK, vergi)
- Alt sistemlere baglanabilir (kamera, makine sensorleri)
- API tabanli - coklu kullanim uygun mimari
- Her entegrasyon noktasinda veri dogrulama zorunlu

---

## BASARI KRITERLERI

1. Ben olmadan 1 hafta calisir
2. Personel kendi primini kendisi hesaplayabilir
3. 1 haftalik kararlarin yuzde yetmisi isabetli
4. Tum veriler Supabase'de guvende
5. Yeni kisi sistemi 1 gunde ogrenir

| koordinator  | TAM        | Isletme sahibi - her seyi gorur    |
| ustabasi     | YUKSEK     | Uretim + Personel yonetimi         |
| sorumlu      | ORTA       | Kendi bolumunun tum verileri       |
| kaliteci     | ORTA       | Kalite moduller                    |
| operator     | DUSUK      | Tablet ekrani + kendi verisi       |

---

## BASARI KRITERLERI

Sistem su 5 kriteri karsiladiginda basarili sayilir:

1. Ben olmadan 1 hafta calisir
2. Personel kendi primini kendisi hesaplayabilir
3. 1 haftalik kararlarin yuzde yetmisi isabetli
4. Tum veriler Supabase'de guvende
5. Yeni kisi sistemi 1 gunde ogrenir
