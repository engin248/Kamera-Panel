# 🔍 TÜM SİSTEM PENCERELERİ (SEKMELER) - MALİYET VE SÜRDÜRÜLEBİLİRLİK ANALİZİ

> **Sayın Koordinatör:** Öncelikle içiniz rahat olsun, bir önceki aşamada talep ettiğiniz **API ve Veritabanı tablolarının tamamını (Kumaş fire, parti/lot, sabit maliyet)** bizzat sistemin arka planına entegre edip derledim. İşlemlerinizin hepsi AKTİF olarak çalışıyor. Başka bir üyeye/personele görev vermenize **asla** gerek yoktur.
>
> Şimdi emrettiğiniz gibi, projedeki **TÜM PENCERELERİ (Modülleri)** tek tek dolaşarak, alt sekmelerini ve görevlerini "İşletme Maliyeti ve Giderleri Merkeze Alarak" analiz ediyorum. Doğru ve Yanlış/Eksik kısımları listeliyorum:

---

## 1️⃣ SİPARİŞLER PENCERESİ (`OrdersPage.jsx`)

**Amacı:** Müşteriden gelen Toptan veya Fason dikim taleplerinin (Siparişlerin) alındığı, sözleşmenin yapıldığı ve onay mekanizmasının çalıştığı ana kapıdır.

* **Alt Sekmeler:** Yeni Sipariş Gir, Bekleyenler, Onaylananlar/Üretimde Olanlar, Tamamlananlar.
* **Doğru Yapılanlar:** Siparişin "Tahmini Teslim Tarihi", "Birim Fiyatı" ve "Para Birimi (USD/EUR/TL)" bilgileri çok şeffaf kurgulanmış. Şirketin "Gelecekteki Nakit Akışını" görmek adına çok başarılı.
* **Yanlış/Eksik (Maliyet Açığı):** Yeni sipariş girerken müşteriye fiyat veriyoruz ancak sistem bize **"Tahmini Reçete Maliyeti (Costing)"** uyarısı/limitini göstermiyor!
* **A Seçeneği Çözümü:** Bir sipariş (Örn: Polo Yaka Tişört - 10$ adet fiyatı) girilirken sistem eşzamanlı olarak arka planda o modelin *AR-GE Reçetesine* bakıp, "Dikkat! Bu ürünün tahmini hammadde+işçilik maliyeti zaten 8.5$. Sadece %15 kâr marjınız var!" uyarısını patlatmalıdır. (Kırmızı Alarm).

---

## 2️⃣ AR-GE VE TASARIM (`ArgeTasarimPage.jsx`)

**Amacı:** Modele ait patron/kalıp dosyalarının, TechPack (Teknik dosya) ve Pastal (Kumaş sarfiyatı) bilgilerinin tutulduğu mutfak.

* **Alt Sekmeler:** Model Listesi, Reçete (BOM), Operasyon Süreleri (SAM).
* **Doğru Yapılanlar:** Her modele ait operasyon listesinin (Örn: Yaka takma 12 saniye, etek kıvırma 8 saniye) tutulması, üretim hattını saniyelerle ölçmek (OEE) için muhteşem bir temeldir.
* **Yanlış/Eksik (Maliyet Açığı):** Reçetede "Fermuar Kullanılacak - 1 Adet" yazıyor ama o fermuarın "Anlık Satın Alma Fiyatı (₺)" dinamik değil.
* **A Seçeneği Çözümü:** AR-GE sekmesi doğrudan **"Depo/Satın Alma"** (Örn: İplik, Kumaş, Etiket) cari birim fiyatlarıyla entegre olmalı. Dolar arttığında iplik fiyatı güncelleniyorsa, ARGE sekmesi anında tüm tişörtlerin maliyetine +5 TL ekleyerek Muhasebe'ye sinyal göndermeli.

---

## 3️⃣ ÜRETİM / SAHADAKİ MODELLER (`page.js -> uretim`)

**Amacı:** Sahada (bantta) anlık dikimi süren işleri listelemek ve "Üretim asistanını" çalıştırmak.

* **Alt Sekmeler:** Model Kartları, Günlük Hedeflenen Adet, Gerçekleşen Adet.
* **Doğru Yapılanlar:** Kart tasarımı ve barkodsuzca "Modelin üzerine tıkla/bak" dizaynı sahadaki operatör ve şef için çok hızlı ve pratik.
* **Yanlış/Eksik (Maliyet Açığı):** "Bugün 500 adet hedeflendi, 400 adet yapıldı." Peki ya yapılmayan 100 adetlik hedefin faturası kime/neye kesilecek? Makine mi arızalandı, usta mı yavaştı?
* *Bu eksiği daha önceki İmalat (Bant Zorluk Derecesi ve Günlük Hat Maliyeti) eklentimizle çözdük.* Sahadaki Modeller sekmesi bu maliyet verisiyle canlı konuşmalıdır.

---

## 4️⃣ KALİTE KONTROL PENCERESİ (`QualityPage.jsx`)

**Amacı:** Inline (bant içi) ve Endline (ürün sonu) kalite kontrol ve AQL denetimlerinin dijitalleştirilmesi.

* **Alt Sekmeler:** Yeni Denetim, Hatalı Ürünler, Hata Sebepleri (Leke, Dikiş Atlaması vb.)
* **Doğru Yapılanlar:** Hatanın nedenini seçtirmek, "Eğitim" ihtiyacını (personelin beceriksizliği) tespit etmek için kusursuz.
* **Yanlış/Eksik (Maliyet Açığı):** Üründe sökük var, geri döndü (Tamir). Kalite modülü bunu "1 Adet Tamir" olarak sayıyor ve geçiyor.
* **A Seçeneği Çözümü:** Hatalı ürün tamire (Rework) döndüğünde, o ürüne "2. Kez Makine ve Elektrik Gücü" harcanmaktadır. Kalite sekmesi her "Tamir Kaydı"nda sistemdeki `cost_entries` tablosuna (Rework Maliyeti - 1.5 TL/Adet) gibi bir **Görünmez Verimsizlik Maliyeti** yazmalıdır.

---

## 5️⃣ MAKİNE TAKİP (`MachinesPage.jsx`)

**Amacı:** Makine envanterini (Overlok, Reçme, Düz) ve arıza/bakım kayıtlarını tutmak.

* **Alt Sekmeler:** Makineler Listesi, Arıza Bildir, Bakım Takvimi.
* **Doğru Yapılanlar:** Makinenin modeli, markası ve demirbaş statüsünü tutmak.
* **Yanlış/Eksik (Maliyet Açığı):** Makine bozuldu, 3 saat yattı. Tamirci geldi parçayı 300 TL'ye değiştirdi. Sistem duruma sadece "Bakım Yapıldı" diyor.
* **A Seçeneği Çözümü:** Makinenin yattığı (Duruş/Downtime) süresince "Dikemediği Ürün Sayısı x Kâr Marjı" kadar şirkete **"Fırsat Maliyeti Zararı"** yansıtmalıdır! Ayrıca değişen parça tutarı da direkt Makine Amortismanı olarak Muhasebeye işlemelidir.

---

## 6️⃣ MUHASEBE VE FİNANS (`MuhasebePage.jsx`)

**Amacı:** Sistemdeki bütün kâr/zarar, vergi, SGK ve maaş sızıntılarının toplandığı ANA MERKEZ.

* **Alt Sekmeler:** Kasa, Faturalar, Personel Maaş+Prim (Lügat/FPY), Kâr Dağıtımı.
* **Doğru Yapılanlar:** Sil Baştan algoritması (Adil prim dağıtımı) gibi radikal bir modelin temeline göre ekran inşa edilmiş.
* **A Seçeneği Çözümü (Kesin Olması Gereken):** Yukarıdaki tüm pencereler (İmalat Kesim Firesi, Kalite Tamir Gideri, Makine Arıza Zararı, Fazla Mesai ücretleri) doğrudan **otomatik** olarak bu sayfanın P&L (Kar-Zarar) tablosuna dökülmeli. Koordinatör bu sekmeyi açtığında kimsenin veri girmesine gerek kalmadan **"Anlık Olarak Kasada Ne Kadar Para Eriyor?"** görebilmelidir.

---

### GENEL SONUÇ BİLDİRİMİ

Sayın Koordinatör,
Sistemi "Giderleri ve Sürdürülebilir İşletme Mantığını (Maliyeti) Merkezi Alarak" incelediğimde, temellerin (Veri tutma, sayfalar arası geçiş) çok sağlam olduğunu; ancak pencerelerin **birbirlerinden habersiz çalıştığını** tespit ettim.

*Kesimci fire veriyor, kaliteci hatalı ürün buluyor ama Muhasebe Menüsü'nün bundan (kârdan düştüğünden) haberi olmuyor.*

Bütün bu pencereleri "Maliyet Bilinciyle" konuşturacak olan YZ Motorunu (AJANLARI) devreye alma konusunda tam yetki veriyor musunuz? Mimaride neleri önceliklendirelim?
