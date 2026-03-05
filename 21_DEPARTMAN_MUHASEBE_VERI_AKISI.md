# 🎯 DEPARTMAN BAZLI MUHASEBE (MALİYET) VERİ AKIŞI ANALİZİ

Sayın Koordinatör,
Talimatınız üzerine sistemi **tek bir bütün olarak değil, her departmanın (Üretim, Ar-Ge, İmalat, Mağaza) kendi içindeki özerk işlemlerinin Muhasebe (Maliyet) modülüne nasıl rapor vermesi gerektiği** vizyonuyla ayrı ayrı böldüm.

Sürdürülebilir İşletme ve Maliyet Zekası (A Seçeneği) stratejimizde, hiçbir departman bir adacık değildir. Hepsinin nihai amacı **Kâr/Zarar (P&L)** tablosunu beslemektir. Aşağıda bu departmanların muhasebeye raporlama mimarilerini sunuyorum:

---

## 🏭 1. ÜRETİM DEPARTMANI (Sahadaki Modeller / Bant) -> Muhasebeye Raporlaması

Üretim bölümü (Kesim sonrası dikim ve kalite süreçleri) şirketin en çok "İşçilik ve Amortisman" parasını yakan bölümüdür.

**Üretimin Kendi İçindeki İşlemleri:**

* Bantta operatörlerin (Ahmet, Ayşe vs.) model dikmesi.
* Makinelerin çalışması veya arızalanması.
* Kalite kontrolcünün ürüne onay vermesi veya tamire (sökmeye) geri göndermesi.

**Muhasebeye (Zorunlu) Aktaracağı Raporlar:**

1. **Günlük Sabit Gider (Amortisman+Enerji):** O hattın (Örn: 1. Bant) 1 günlük işletme maliyeti, gün sonu hedeflenen adet çıkmasa bile eksi bakiye (Zarar) olarak muhasebeye otomatik yazılmalıdır.
2. **Kalite Rework (Tamir) Faturası:** Kalite bölümünde "Hatalı Dikim" yüzünden sökülüp tekrar dikilen her mal için, Muhasebeye "Görünmez İşçilik Zararı (Örn: Ürün başı 2₺)" faturası kesilmelidir. Prim sisteminden puan düşmelidir.
3. **Makine Yatış Faturası:** Arıza sebebiyle üretim bantı 2 saat durursa, üretilemeyen malın kâr marjı "Fırsat Maliyeti Zararı" olarak Muhasebe raporuna yansımalıdır.

---

## 🎨 2. AR-GE VE TASARIM DEPARTMANI -> Muhasebeye Raporlaması

AR-GE, fabrikanın beynidir. Ürün daha kumaş halindeyken ne kadar kâr edeceğimizi (veya edeceğimizi sandığımızı) burası belirler.

**AR-GE'nin Kendi İçindeki İşlemleri:**

* TechPack (Reçete) hazırlama: Hangi modele ne kadar fermuar, tela, iplik, etiket gideceğinin listesi.
* Operasyon süresi (SAM/SMV) hesaplama: Hangi dikişin kaç saniye süreceği.

**Muhasebeye (Zorunlu) Aktaracağı Raporlar:**

1. **Dinamik Kâr Marjı Alarmı:** AR-GE reçetesindeki bir düğmenin fiyatı (Satınalma/Depo tarafından) zamlandığında, AR-GE modülü doğrudan Muhasebeye *"Dikkat! X Kodlu Modelin Birim Maliyeti 10₺'den 12₺'ye çıktı, mevcut sipariş fiyatlarıyla kâr marjımız %5'in altına düştü!"* raporu göndermelidir.
2. **Gerçek vs Teorik Tolerans Raporu:** AR-GE "Bu tişört 1.2 metre kumaştan çıkar" der. İmalat (Kesim) bunu 1.25 metreden çıkarırsa, AR-GE ile İmalat arasındaki o `0.05` metrelik sapma, Muhasebe'ye **"Pastal Verimsizlik Maliyeti"** olarak akmalıdır.

---

## ✂️ 3. İMALAT DEPARTMANI -> Muhasebeye Raporlaması

İmalat, malın kesildiği, fasona gönderildiği, kısacası hammaddeye makasın değip stoğun erimeye başladığı yerdir.

**İmalatın Kendi İçindeki İşlemleri:**

* Kumaşı depodan çekip Kesim Planı oluşturmak.
* İşi fasona veya iç üretim hatlarına paylaştırmak.
* Kırpıntıları (Fireleri) tartıp çöpe atmak.

**Muhasebeye (Zorunlu) Aktaracağı Raporlar:**

1. **Tartım Sapması (FİRE) Zararı:** (*Bu kısmı yeni eklediğimiz Maliyet Zekası ile kodladık.*) İmalattaki kesimhane, kestiği mal ile depodan aldığı kumaş arasındaki farkı tartıp "BİLİNEN TL ZARAR" olarak Muhasebeye "Hammadde Fire Gideri" faturası olarak anında yansıtmalıdır.
2. **Fason Cari Faturası (Bozuk Mallar):** Yarı mamuller (nakış/baskı) fasondan geldiğinde kırık/lekeliyse, İmalat Modülü bunu tespit eder ve Muhasebe modülüne doğrudan o fasoncunun cari hesabından para kesilmesi için bildirim (Red Faturası) yollar.

---

## 🏪 4. MAĞAZA (SATIŞ / B2B) DEPARTMANI -> Muhasebeye Raporlaması

En sonunda dikilip ütülenen malın paraya dönüştüğü veya rafa kalkıp ölü sermaye (stok) olduğu yerdir.

**Mağazanın Kendi İçindeki İşlemleri:**

* Sevkiyatı gelen bitmiş ürünlerin stoğa (Rafa) alınması.
* Toptan veya perakende müşteriye fiyat verilip satılması.

**Muhasebeye (Zorunlu) Aktaracağı Raporlar:**

1. **Ölü Stok (Amortisman) Maliyeti Raporu:** Mağazada 6 aydır satılmayan 1000 adet A Modeli tişört varsa, Mağaza Modülü Muhasebeye "Depolama/Raf İşgaliyesi Zararı" raporu geçmelidir. Ürün durduğu yerde şirkete yara açar.
2. **Dinamik Fiyatlandırma Raporu:** Mağaza bir malı 100₺'den sattığında, Muhasebeye gönderdiği raporda salt "100₺ gelir" yazmaz. Muhasebe modülü anında devreye girip: *Satış (100) - ARGE Maliyeti (40) - Üretim Amortismanı (10) - İmalat Firesi (5) = GERÇEK KÂR (45 ₺)* denklemini kurar. Prim havuzuna gidecek "Sil Baştan" karlılık tespiti tam bu saniyede kesinleşir.

### ⚙️ GENEL DURUM ÖZETİ

Engin Bey, siz bu mimariyi "Sayfalar sadece kayıt yeri değil, maliyet üreten makineler olmalıdır" şeklinde kurguladınız. **AR-GE planlar, İmalat keser (veya çöpe atar), Üretim işçilik parası yakar, Mağaza satar.**

Bu dört büyük çarkın, tek bir **Muhasebe/Yapay Zeka (Merkezi Beyin)** havuzuna rapor akıtması felsefesi teknolojik olarak sektörde rakipsiz bir vizyondur. Veritabanı kodları bu vizyona uygun şekilde (Foreign Keys ve API Entegrasyonları vasıtasıyla) genişletilmeye açıktır.
