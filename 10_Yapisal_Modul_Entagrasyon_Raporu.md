# KAMERA-PANEL - YAPISAL MODÜL ENTEGRASYON VE BOT YETKİ RAPORU

Sistem "Üretim Süreç Döngüsü" üzerine inşa edilmiştir. Bu rapor, atölye içindeki modüllerin (sayfaların) birbirleriyle nasıl konuştuğunu ve her bölüme atanan YZ (Yapay Zeka) Botlarının görev tanımlarını açıklamaktadır.

## 1. ÜRETİM ZİNCİRİ (BİRBİRİNİ TETİKLEYEN MODÜLLER)

Aşağıdaki departmanlar organik olarak birbirine bağlıdır. Bir modülde yapılan değişiklik, veri olarak arka planda diğerine geçer:

1. **MODELLER (Başlangıç Noktası):** Hangi ürünün (Kodu, Adı, Fason Fiyatı vb.) dikileceğinin tanımlandığı ana kaynaktır. Bu modül veri üretmezse diğer bölümlerde işlem yapılamaz.
2. **PERSONEL (İş Gücü):** Üretim yapacak olan terzi ve operatörlerin (Maaş, Pozisyon) kaydının tutulduğu departmandır.
3. **ÜRETİM AŞAMASI (Kalp):** Personelin (Kimin), hangi Modeli (Ne), ne kadar adet (Kaç tane) diktiğini kaydeder.
    * *Tetikleme:* Burada girilen günlük üretim verileri, anında Personel modülündeki adam/saat verisiyle eşleşir.
4. **MALİYET (Hesap):** Üretilen adet sayıları, Modelin dikim zorluğu ve Personelin günlük yevmiyesiyle çarpılarak "Birim Başına Maliyet" hesaplanır.
    * *Tetikleme:* Üretim verisi olmazsa Maliyet boş çıkar. Personel yevmiyesi girilmezse Maliyet eksik hesaplanır.
5. **RAPOR & ANALİZ VE MUHASEBE (Sonuç):** Yukarıdaki 4 modülden gelen *tüm ham verilerin* birleştiği potadır. Zarar mı ettik kar mı ettik, günlük fason hedefi tuttu mu sorularına cevap veren net bilançonun alındığı yönetim ekranıdır.

## 2. BAĞIMSIZ MODÜL: SİPARİŞLER

* **SİPARİŞLER Modülü şu an için Üretim Zincirini doğrudan TETİKLEMEZ.**
* Amacı: Müşterilerden (veya mağazalardan) gelen ana kesim / sipariş miktarını ve termin (teslimat) tarihlerini takip etmektir.
* *Gelecek Planı:* İlerleyen aşamalarda Siparişler tamamlandıkça (Sevkiyat faturası kesildikçe) otomatik olarak Üretim'den düşülebilir. Ancak şu an için bağımsız bir "Termin Takip Panosu" olarak çalışır.

## 3. YAPAY ZEKA BOT DAĞILIMI VE YETKİLERİ

Her üretim odasının kendi uzman bir "Bot'u" vardır. Odaya giren (sekmeyi açan) yönetici o uzmandan destek alır:

* **1. MUHASİP (Finans Uzmanı - Renk: Mavi):**
  * *Sorumlu Olduğu Sekmeler:* Maliyet, Muhasebe Rapor & Analiz, Fason ve Prim hesaplamaları.
  * *Ne Yapar:* Kârlılığı, fason fiyatların kurtarıp kurtarmadığını, "dünkü üretimle zarar ettik mi?" gibi paraya dayalı soruları yanıtlar.
* **2. TEKNİKER (Saha Temsilcisi - Renk: Turuncu):**
  * *Sorumlu Olduğu Sekmeler:* Modeller, Makineler, Kalite Kontrol ve Ayarlar.
  * *Ne Yapar:* Dikim sıralarını oluşturur, BOM (Malzeme Listesi) okur. Makine arızalarında ne yapılması gerektiğini ve defolu ürünlerde (Kalite) üretim hatasını bulur.
* **3. KAMERA (Operasyon Şefi - Renk: Yeşil):**
  * *Sorumlu Olduğu Sekmeler:* Üretim Aşaması, Personel, Siparişler, Sevkiyat, Müşteriler ve Ana Dashboard.
  * *Ne Yapar:* Günlük rutini takip eder. Kim geldi, kaç kişi çalışıyor, bugün kaç ürün çıktı gibi canlı saha operasyonlarını bilir.
* **4. KAŞİF (Dış Gözlemci - Renk: Mor):**
  * *Sorumlu Olduğu Sekmeler:* Raporlar (Genel ve Pazar araştırması).
  * *Ne Yapar:* Dışarıdaki piyasa durumunu (kumaş fiyatları, asgari ücret enflasyonu vb.) araştırıp genel raporlara katkı sunar.

> **Özet:** Sistem atölye mantığıyla tasarlanmıştır. Modeli belirle -> Terziyi oturt -> Üretimi say -> Maliyeti çıkart -> Muhasebe de hesabı kes. Tüm bu süreç kendi uzman AI asistanlarıyla desteklenir. Siparişler ise kapıdaki müşteri bekleme listesidir.
