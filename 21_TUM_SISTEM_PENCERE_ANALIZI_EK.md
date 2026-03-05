# 🔍 TÜM SİSTEM PENCERELERİ (SEKMELER) - BÖLÜM 2: DETAYLI İŞLETME & MALİYET ANALİZİ

> **Sayın Koordinatör:** Talimatınız doğrultusunda, **Ceza ve Fire Kesinti** kısımlarını tamamen size bırakıyorum (bunları süreçteki hatalara göre siz belirleyeceksiniz).
>
> Aşağıda sistemdeki **geriye kalan tüm pencerelerin (Personel, Raporlar, Müşteriler, Fason, Sevkiyat, Mağaza ve Dashboard) ALT SEKMELERİ DAHİL** işletmeye katacağı **artı/eksileri**, verimliliği ve maliyet tasarrufu sağlama potansiyelini "İşletmenin Çıkarı" odaklı tek tek analiz ettim:

---

## 7️⃣ PERSONEL PENCERESİ (`PersonnelPage`)

**Amacı:** Personel sicili, maaş, yol/yemek ödenekleri ve yetenek skorlarının izlendiği pencere.

* **Artı (Sisteme Faydası):** Sabit giderlerin (yol, yemek) ve personelin yetenek derecesinin (Skill Level) net görünmesi, bant kurarken kimi nereye koyacağınızı veriye dayalı yapmanızı sağlar.
* **Eksi (Maliyet ve İşletme Körlüğü):** İşe gelmeyen (devamsız) personelin durumu veya iş kazası raporları maliyet olarak ayrıştırılmıyor. İşletmede bir personelin işe gelmediği "1 Gün", makinenin boş kalması ve üretimin eksik çıkması demektir. Ayrıca Kıdem Tazminatı yükү her ay birikmektedir, sistem bunu saklı bir yük (Gizli Borç) olarak tutmuyor.
* **Nasıl Daha İyi Olurdu:**
   1. **Gizli Borç (Kıdem Tazminatı) Göstergesi:** 1 yıldan uzun süredir çalışan personelin tahmini kıdem tazminatı her ay ufak ufak arka planda hesaplanıp "Gelecekteki İşletme Risk/Borç Yükü" olarak Muhasebeye bildirilmelidir.
   2. **Devamsızlık Fırsat Maliyeti:** Personel gelmediğinde sadece 1 günlük yevmiyesi kesilir (maaş avantajı) ama o makine boş kaldığı için "Üretilenden kaybedilen kâr (Fırsat Maliyeti)" işletmeden çıkar. Bu oran yöneticinin gözüne sokulmalıdır.

---

## 8️⃣ RAPORLAR PENCERESİ (`ReportsPage`)

**Amacı:** Geçmiş aya veya döneme ait Ciro, Gider, Net Kâr ve Personel Verimliliğini göstermek.

* **Artı (Sisteme Faydası):** Geçmişi ("Neyi doğru, neyi yanlış yaptık?") okumak için muazzam bir pano. Karlılık sıralaması ve personelin hata/başarı grafikleri harika bir vizyon sunuyor.
* **Eksi (Maliyet ve İşletme Körlüğü):** Raporlar sekmesi tamamen "Geçmişe (Düne)" bakıyor. Bir işletme dünle övünür ama "Yarın" ile ayakta kalır. "Gelecek projeksiyonu" yok.
* **Nasıl Daha İyi Olurdu (Maliyet Zırhı):**
  * **Burn Rate (Para Yakma Hızı):** Şirketin günlük sabit harcaması ne kadar? (Kirayı ve faturaları 30'a böl). "Şirketin hiç sipariş almasa bile aylık X TL kazanması lazım (Başa Baş Noktası Alarmı)" raporlarda dinamik yer almalı.
  * **Tahmini Kapanış (Run-Rate):** Ayın 15'indeyiz ve kârımız 50.000 TL. Sistem mevcut üretim hızına bakıp "Bu ay sonu 100.000 TL kârla kapatacaksınız" şeklinde ufuk çizgisi (Forecast) vermelidir.

---

## 9️⃣ MÜŞTERİLER PENCERESİ (`CustomersPage`)

**Amacı:** Toptan sipariş veren veya iş yaptığınız B2B müşterilerin sicili ve işlemleri.

* **Artı (Sisteme Faydası):** Denetim iziyle kimin verisi ne zaman güncellendi takibi mükemmel, Veri Kaybını ve manipülasyonu engelliyor.
* **Eksi (Maliyet ve İşletme Körlüğü):** Bir müşteri çok sipariş veriyor diye "En İyi Müşteri" zannedilebilir. Oysa o müşteri her siparişte inanılmaz ıskonto (indirim) istiyor, sürekli tamire ürün yolluyor veya tahsilatı 3 ay sallıyordur.
* **Nasıl Daha İyi Olurdu:**
  * **Müşteri Kârlılık Skoru (ROI):** "Ahmet Tekstil bize şu an kadar 2 Milyon ciro yaptırdı ama net kârımız sadece %4. Mehmet Butik ise 500 Bin ciro yaptırdı ama kârımız %25."
   Sistem her müşterinin Ciro hacmini değil, **MÜŞTERİDEN KALAN NET KÂRI** hesaplayıp müşterilere A, B, C kalite sınıfı (Rating) vermelidir ki pazarlık masasında kime rest çekeceğinizi, kimin nazını çekeceğinizi bilesiniz.

---

## 🔟 FASON TAKİP (`FasonPage`)

*(Ceza sistemleri dahil edilmedi, işleyişe odaklanıldı)*
**Amacı:** Bünye dışında (başkasına) diktirilen işleri denetlemek ve yollamak.

* **Artı (Sisteme Faydası):** Yapay zeka ile fason risk analizi yapılarak fasoncuyu değerlendirmek vizyoner bir bakış.
* **Eksi (Maliyet ve İşletme Körlüğü):** Fason firmaya 1.000 adetlik kumaş / pastal / tela gittiğinde sistem sadece çıkışı görüyor. Dönüşteki termin (süre) gecikmelerinin oluşturduğu tedarik zinciri tahribatını ölçmüyor.
* **Nasıl Daha İyi Olurdu:**
  * Fasoncu "Termin Sadakati" skoru tutulmalı.
  * **Gecikme Zararı (Opportunity Cost):** Eğer fasoncu ürünü 3 gün geç getirirse, bu dışarıdaki mağazada/siparişte "Rafta Yok (Out of Stock)" zararına sebep olur veya ana müşterinizin size olan güvenini kırar. Fasonda "Söz Verilen" vs "Gerçekleşen" zaman makası mali tabloya "Teslimat Kaylı Kayıp" olarak risk analizi şeklinde eklenmelidir.

---

## 1️⃣1️⃣ SEVKİYAT PENCERESİ (`ShipmentsPage`)

**Amacı:** Ürünlerin müşteriye yola çıkış (Lojistik) süreci. Kargo durum ve takip takibi.

* **Artı (Sisteme Faydası):** Hangi sipariş ne zaman gönderildi, takip no nedir şeffaf.
* **Eksi (Maliyet ve İşletme Körlüğü):** Mal yola çıktı ama "PARA ÇIKTI MI / GELDİ Mİ?" Lojistik, finans ile entegre konuşmuyor.
* **Nasıl Daha İyi Olurdu:**
  * Sevkiyat çıkışı yapılırken sistem sormalı: "Bu siparişin Cari Bakiyesi (Tahsilatı) Kapandı mı?". Eğer açık hesap gönderiliyorsa **"DİKKAT! Müşteri tahsilatı tamamlanmadan sevkiyat yapılıyor"** uyarısı finans departmanı için tetiklenmeli.
  * Lojistik (Kargo) masrafı her sevkiyata özel işletiliyor mu? Kargo firması 1 koli için "Ortalama 150 TL" alıyorsa bu değer otomatik o modelin maliyetinin üstüne "Lojistik Gideri" olarak binmezse Kâr sapması olur.

---

## 1️⃣2️⃣ MAĞAZA VE B2B SATIŞ (`MagazaPage`)

**Amacı:** Dinamik Stok takibi, Müşteri Sicili, Kasa/Satış Onay süreçleri.

* **Artı (Sisteme Faydası):** Stokların "Rafta Bekleme Yaşı (Yaşlanma/Ageing)" takibi muazzam bir stratejidir. İşletme nakdinin rafta eridiğini gösterir.
* **Eksi (Maliyet ve İşletme Körlüğü):** Stok yaşlanmasını izliyoruz ama bu yaşlanmanın "Erime (Amortisman) Maliyeti"ni paraya dökmüyoruz.
* **Nasıl Daha İyi Olurdu:**
  * **Stok Bağlı Nakit Zararı:** Ürün 3 aydır depodaysa, içeriğindeki 100.000 TL hammadde parası atıl kalmış demektir. Faiz veya fırsat kaybı olarak bu 100 bin Tl, 3 ayda aslında 10 Bin TL zarardadır.
  * Yapay Zeka ajanı, stok yaşlanması yükselen ürünler için *Müşteri/Yurt dışı pazar yeri tespiti* yapıp "Bu ürünü hemen %10 zararına dahi olsa şu firmalara verelim, nakde çevirip yeni sezona iplik alalım" demelidir (Agresif Tasfiye Stratejisi).

---

## 1️⃣3️⃣ ANA GÖSTERGE / DASHBOARD (`DashboardPage`)

**Amacı:** Yönetim kurulu için her şeyin anlık fotoğrafının çekilmesi.

* **Artı (Sisteme Faydası):** Sistem tasarım açısından çok sade, gereksiz grafiklerle yormuyor, ana odak noktalarını veriyor.
* **Eksi (Maliyet ve İşletme Körlüğü):** Nakit akışı uyarısı (Cash Flow) en üstte gözükmüyor. "Ciro" her şey demek değildir, "Tahsilat" can damarıdır.
* **Nasıl Daha İyi Olurdu:**
  * **15 Günlük Nakit Akış Radarı:** Önümüzdeki 15 gün içinde ödenecek SGK, Maaş, İplikçi çekleri ile Müşteriden gelecek nakdin veya banka hesap bakiyesinin kıyaslandığı basit bir **"Nakit Fazlası / Nakit Açığı X TL"** kartı eklenmelidir.
  * İşletmeler Ciro eksikliğinden değil, nakit akışını yönetemediklerinden (bankada para olmadığı gün maaş/vergi geldiğinde) kredi bataklığına düşer.

---

### 👑 ÖZET KARAR

Sayın Koordinatör;
Sistemin mimarisinde veri giriş çıkışları çok sağlıklı, ekranlar çok sezgisel kurgulanmış. Ancak sayfalar kendi başlarına birer "ada" gibi çalışıyor. Müşteri siparişi, Mağaza stoku, Fabrika üretimi birbirinin maliyetleriyle organik bağ kurmalı.

**Nasıl Bir Yol İzleyelim?**
Eğer onay verirseniz ve "Bunu koda dök" derseniz:

1. Pencereleri kodlarken belirttiğim bu "İşletme Çıkarı/Para Gidiyorsa Uyar" mantığına yönelik uyarı balonları ve veri alanlarını sisteme entegre edelim.
2. Sizin "Ceza kısmını ben halledeceğim" talimatınıza harfiyen uyarak, yasal/ceza kısmına dokunmadan sadece **verimlilik bildirimlerini** canlandıralım.

Emirlerinizi bekliyorum.
