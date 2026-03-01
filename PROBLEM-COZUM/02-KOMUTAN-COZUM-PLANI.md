════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in 3 çocuğu var.
Vatanına milletine hayırlı olsunlar.
Bu sistem onlar ve insanlık için inşa ediliyor.
════════════════════════════════════════════════════

# PLAN — KOMUTAN: ENGİN BEY

## Sahadan Gelen Ses — Problemi Yaşayanın Planı

**Hazırlayan:** Komutan Engin Bey
**Rütbe:** Komutan (En üst — son oyu kullanan)
**GN:** GN:20260301-004
**Tarih:** 01 Mart 2026
**Durum:** ✅ Teslim edildi

---

## SİSTEMİN TEMEL YAPISI — 4 BÖLÜM, 4 BOT

> Sistem 4 ayrı pencerede, 4 ayrı bot ile çalışacak.
> Her botun kendi görevi, kendi kriteri, kendi iş alanı belli.
> 4 bot birbirine entegre. Başka sistemlere de entegre edilebilir altyapı.

---

## BOT 1 — MODEL BÖLÜMü

### Ne Yapar?

Üretilecek ürünün teknik bilgilerini alır ve sisteme işler.

### Nereden Veri Gelir?

Ürünü tasarlayan firmadan teknik dosya gelir:

- Ürünün fotoğrafları
- Beden ölçüleri (kaç beden olduğu)
- Aksesuarlar
- Kullanılacak malzeme bilgisi

### Bu Bot Ne Yapar?

1. Fotoğrafları okur → sisteme yükler
2. Okuduklarını kendi tablosuna işler
3. Beden ölçülerini kaydeder
4. Yapılacak işlemleri listeler
5. Kriterleri belirler
6. Tabloya ekle / sil yapılabilir — her ürün kendine özel tablo

### Önemli Kural

Ana tabloda 100 işlem olsa bile o ürün 15 işlemle bitiyorsa sadece o 15 işlem alınır.
Tablo o ürüne özel kurulur.

---

## BOT 2 — ÜRETİM BÖLÜMü

### 2A — PARTİ GİRİŞİ

Ürün kapıdan içeri girdiği andan:

| Kontrol | Yapıldı mı? |
|---------|-------------|
| Kim getirdi? (şoför / personel) | [ ] |
| Ne zaman geldi? | [ ] |
| Parti kim açtı? | [ ] |
| Parti ne zaman açıldı? | [ ] |
| Beden eksiği var mı? | [ ] |
| Aksesuar eksiği var mı? | [ ] |
| Kumaş eksiği var mı? | [ ] |
| Model için numune ayrıldı mı? | [ ] |
| Kaç parçadan oluştuğu belirlendi mi? | [ ] |
| Her parça fotoğraflandı mı? | [ ] |
| Fotoğraflar sisteme yüklendi mi? | [ ] |

Parça örneği: Ön 1 + Arka 1 + Sol kol 1 + Sağ kol 1 + Yaka 1 = 5 parça.
Her parça ayrı fotoğraflanır, sisteme yüklenir.

### 2B — MODEL DİKİM AŞAMASI

İlk ürün dikilirken:

- Modelci **yaka mikrofonu takar** (çevresel gürültüyü almayan)
- İlk işlemden son işleme kadar **sesle anlatır**
- İmkan varsa **video da kaydedilir**
- Ses yazıya çevrilir, sisteme işlenir

Sonuç: İşlem sırası belli, nasıl yapıldığı belli, kim yapacak belli.

### 2C — SERİ ÜRETİM

Her işlem için doğru personel seçilir (beceriye göre):

- Zor işlem → Usta / Hızlı usta
- Normal işlem → Orta düzey
- Kolay işlem → Çırak

Her makinecinin başladığı ve bitirdiği saat kaydedilir.
Temizleme: Ne zaman, kaç adet.
Paket: Ne zaman, kaç adet.

---

## BOT 3 — MALİYET BÖLÜMü

### Ne Hesaplar?

**İşletme Giderleri:** Elektrik + Su + Yakıt + Diğer sabit giderler

**Personel Giderleri:** Maaş + SGK + Yol + Yemek

**Saatlik Maliyet:**

```
Toplam aylık gider ÷ Toplam çalışma saati = Saatlik maliyet
```

**Ürün Maliyeti:**
O ürüne harcanan süre × Saatlik maliyet

**Kritik Karar:**
Fason ürünün ilk tanesi dikilince maliyet anında belli olur.
Kâr etmeyecekse → O sipariş ALINMAZ.
Bu veri önden zarar etmeyi engeller.

---

## BOT 4 — PERSONEL & ÜCRETLENDİRME BÖLÜMü

### Kart Sistemi

Sabah gelirken basar, akşam çıkarken basar.
Kart fotoğrafları sisteme yüklendiğinde her şey otomatik hesaplanır.

**Takvim:** O ay kaç iş günü var
**Geç kalma:** 08:00'den sonraki her dakika kayıt
**Fazla mesai:** Paydostan sonra çalışma

**Mola Kuralı:**

- 2 saate kadar çalışma → 15 dk çay molası (düşülmez)
- 2 saatten fazla → 30 dk yemek molası düşülür

**Saatlik Ücret Örneği:**

```
Maaş      : 30.000 TL
Çalışma   : 9,5 saat/gün (mola düşüldükten sonra)
20 gün    : 190 saat
Saatlik   : 30.000 ÷ 190 = ~157 TL/saat

Fazla mesai 20 saat:
20 × 157 = 3.140 TL mesai ücreti
```

### Prim Sistemi

| İşletmeye Katkısı | Prim |
|-------------------|------|
| Normal | %5 |
| İyi | %10 |
| Çok iyi | %15 |
| Mükemmel | %20 |

### Ay Sonu Raporu (Her Personele Ayrı Dosya)

```
- Kaç gün çalıştı
- Kaç saat çalıştı
- Kaç adet, hangi işlemleri yaptı
- İşletmeye kaç TL değer kattı
- Maaşı + Mesaisi + Primi
- Net: İşletmede kâr mı zarar mı?
```

---

## GENEL MİMARİ KURALLARI

### Dil

```
Ana Dil  : Türkçe
2. Dil   : Arapça
3-5. Dil : Altyapı hazır, ileride eklenebilir
NOT      : İngilizce öncelikli değil
```

### Botların Sahip Olması Gereken Beceriler

```
✅ Görsel okuma (fotoğraf → metin)
✅ Ses tanıma (ses → yazı, Türkçe öncelikli)
✅ Fotoğraf karşılaştırma (referans vs yapılan)
✅ Tablo oluşturma / düzenleme / silme
✅ Otomatik hesaplama (maliyet, maaş, prim, mesai)
✅ Raporlama (personel, model, ay bazında)
✅ Entegrasyon (4 bot birbiriyle + ileride başka sistemlerle)
```

### Ölçek

```
Şimdi : Kendi işletmemizde
İleride: Aynı sorunu yaşayan işletmelere açılabilir
         Mimariye BUNA GÖRE kurulacak (genişletilebilir)
```

---

## 5. MUHASEBE BOTU (OPSİYONEL)

4 botun verilerini toplar:

- Toplam üretim / maliyet / personel değeri
- Net kâr/zarar
- Hangi model kârlı, hangi model zararlı

---

## KOMUTAN'IN KRİTİK TESPİTLERİ

```
1. Her modelin tablosu kendine özel olacak
   (herkese 45 işlemlik tablo dayatılmaz)

2. İşletme sahibi orada olmasa da sistem çalışır

3. Adil ücret: Kimin ne ürettiği kayıt altında
   Çalışmayan çalışana yük bindiremez

4. Fason kararı: İlk ürün dikilince kâr/zarar belli
   Zarar edecekse o sipariş alınmaz

5. Yasal sorun yok: Kendi iç sistemimiz
   Personel de aynı fikirde — adaletsizliği önlemek istiyorlar

6. Beceri-işlem eşleştirmesi otomatik:
   Zor iş → Usta / Kolay iş → Çırak
   Sistem bunu otomatik önerir

7. Birikim sonrası tahmin:
   6-12 ay sonra ortalama süreler belli olur
   Yeni modeller için fiyat tahmini mümkün olur

8. Sonraki bölümler:
   Komutan imalat bölümü ve mağaza bölümünü de anlatacak
   (Bu plan üretim bölümünü kapsıyor — devam edecek)
```

**[GK: KOMUTAN-04-TESLIM]**
════════════════════════════════════════════════════
