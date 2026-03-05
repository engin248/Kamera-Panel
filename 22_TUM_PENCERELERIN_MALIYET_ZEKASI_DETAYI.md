# 🌐 KAMERA-PANEL: TÜM PENCERELERİN A'DAN Z'YE MALİYET ZEKASI DETAYLANDIRMASI

Sayın Koordinatör, "Bütün pencereleri detaylandır" talimatınız üzerine sistemdeki **10 ANA PENCERENİN (Modülün)** her birini masaya yatırdım.

Geleneksel bir yazılımda bu pencereler sadece "Kayıt Defteri"dir. Ancak sizin vizyonunuzdaki **(A Seçeneği) Agresif Kâr ve İşletme Sürdürülebilirliği** modelinde bu pencerelerin her biri canlı birer "Maliyet Ölçüm Cihazı" ve "Hesap Uzmanı" olmak zorundadır.

İşte tüm pencerelerin detaylı anatomisi ve "Muhasebeye (Patrona) Karşı Sorumlulukları":

---

## 1️⃣ SİPARİŞLER PENCERESİ (`OrdersPage`)

**Tanım:** Müşteriyle (Toptan/Fason) el sıkışılan, fiyatın ve terminin (teslim tarihinin) belirlendiği ana kapı.

* **İşleyiş:** Yeni sipariş girilir, renk/beden/adet dağılımı yapılır, satış fiyatı yazılır.
* **Maliyet Zekası (Nasıl Çalışmalı?):**
  * Satış temsilcisi (veya koordinatör) fiyatı "10 USD" olarak girdiğinde, sistem hemen arkadaki **AR-GE Reçetesine (BOM)** bağlanmalı.
  * Sistem uyarmalı: *"10 USD fiyat verdiniz ancak güncel hammadde fiyatları ve minimum bant işçiliği ile bu ürünün bize maliyeti zaten 8.2 USD'dir. Brüt kârınız 1.8 USD. İskonto yapamazsınız!"*
  * Sipariş onaylandığı an, Muhasebe modülüne *"Gelecekteki Beklenen Gelir: 10.000 USD"* olarak sanal (tahmini) bir nakit akışı yansıtılmalı.

## 2️⃣ AR-GE VE TASARIM PENCERESİ (`ArgeTasarimPage`)

**Tanım:** Kumaşın henüz kesilmeden makinede, bilgisayarda "Sanal" olarak üretildiği beyin takımı.

* **İşleyiş:** TechPack'ler, model reçeteleri (hangi ip, hangi düğmenin kullanılacağı), kesim pastal planı ve dikim saniyeleri (SAM/SMV) buraya yüklenir.
* **Maliyet Zekası (Nasıl Çalışmalı?):**
  * Reçetede yazan "Polyester İp" veya "Metal Fermuar" fiyatları statik (ölü) metin olmamalıdır. Doğrudan "Satın Alma/Depo" fiyatlarıyla **canlı** konuşmalıdır.
  * Fermuar tedarikçisi fiyata zam yaptığında, AR-GE sistemi otomatik olarak eski siparişleri taramalı ve *"Maliyetiniz %4 arttı, kârınız eriyor"* şeklinde Muhasebeye uyarı fırlatmalıdır.
  * Operasyon süreleri (Örn: yaka 12 saniye) Muhasebedeki "İşçilik Maliyeti" hesaplamasının ana çarpanı olmalıdır.

## 3️⃣ İMALAT PENCERESİ (`ImalatPage`)

**Tanım:** Fiziksel eylemin başladığı, kumaşın kesildiği ve fason işlerinin (nakış, baskı) döndüğü yer. *(Daha önce güncellediğimiz modül).*

* **İşleyiş:** Pastal hesabı, kumaş sarfiyatı, fire oranları ve depo çıkışları yapılır.
* **Maliyet Zekası (Nasıl Çalışmalı?):**
  * **"Kestin ama ne kadar ziyan ettin?"** Kesim ustası, tartıdaki gerçek kiloyu sisteme zorunlu girdiği an; sistem aradaki fireyi hesaplar ve bir tıkla Muhasebeye **"Hammadde Fire Zararı (Örn: 5.000 ₺)"** olarak fatura eder.
  * Fasoncular arası (Örn: Kesimden -> Baskıya) transferde bozulan her ürün tespiti, Fasoncunun cari hesabından "TL Para Kesintisi / Red Faturası" olarak Muhasebe'den düşülmelidir. Gözyaşına yer yok.

## 4️⃣ ÜRETİM / SAHA TAKİP PENCERESİ (`uretim`)

**Tanım:** Dikim hatlarındaki operasyonların barkodla, tabletle veya manuel olarak okutulduğu canlı bant izleme ekranı.

* **İşleyiş:** "1. Bant - Polo Tişört, Hedef: 500, Üretilen: 380".
* **Maliyet Zekası (Nasıl Çalışmalı?):**
  * Eskiden 500 hedefe 380 yapılınca "Tüh, yetiştiremedik" denilip geçilirdi. Şimdi hata affı yok.
  * Bantın **"Günlük Sabit Kira Maliyeti (Örn: 30.000 ₺ İşçi+Elektrik vs.)"** vardır. Sistem gün sonunda bakar: 380 adet üretildi. Normalde ürün başı 60₺'ye çıkması gereken işçilik maliyeti, hedefin altında kalındığı için 78₺'ye fırladı.
  * Bu +18₺'lik birim maliyet zararı derhal Muhasebe sisteminde **"Bant Verimsizliği Zararı"** kalemine işlenir. Ustabaşının primini tehdit eder.

## 5️⃣ KALİTE KONTROL PENCERESİ (`QualityPage`)

**Tanım:** Dönen ürünlerdeki hataların (sökük, çizik, leke) Inline (bant içi) ve Endline (son) kontrol ekranı.

* **İşleyiş:** Hata kaydı açılır (Eğitim, operatör, dikim hatası vs.) ve raporlanır. Tamire (Rework) gönderilir veya çöpe atılır.
* **Maliyet Zekası (Nasıl Çalışmalı?):**
  * Bir tişört bantta 5 dakikada dikiliyorsa, hatalı olup sökülüp tekrar (tamire) dönmesi **+5 dakika** ekstra zaman (Makine yıpranması + İnsan yevmiyesi + Elektrik) demektir.
  * Kalite pencerem, Muhasebe'ye rapor geçmelidir: *"Bugün 1. Bantta 80 adet ürün tamire/rework işlemine girdi. Gizli İşçilik Zararı: 1.200 ₺."*
  * Ayrıca hatalı işlemi kim vurduysa (Hangi Personel), o kişinin personel dosyasında **"Kalite Fire Puanı"** eksi haneye düşmelidir.

## 6️⃣ MAKİNE TAKİP PENCERESİ (`MachinesPage`)

**Tanım:** Makine envanterinin, arızalarının, tamir masraflarının tutulduğu sistem.

* **İşleyiş:** Reçme bozuldu, tamirci çağrıldı, bakım yapıldı.
* **Maliyet Zekası (Nasıl Çalışmalı?):**
  * Bozulan makinenin beklediği/yatağı her saat "Üretilemeyen Mal" demektir. Sistem buna **Fırsat Maliyeti Zararı** olarak bakar.
  * Değişen yedek parça + Özel servis parası + Üretilemeyen tişört sayısı toplanır. Muhasebe modülüne doğrudan **"13 Numaralı Reçme Makinesi Amortisman/Arıza Zararı: X TL"** olarak akıtılır.

## 7️⃣ PERSONEL SEÇME VE DEĞERLENDİRME PENCERESİ (`PersonnelPage`)

**Tanım:** Ustabaşı, makinacı, ortacı dahil tüm çalışanların kimlik, maaş ve mesai bilgilerinin tutulduğu yer.

* **İşleyiş:** SGK primleri, net maaşlar, mesailer takip edilir.
* **Maliyet Zekası (Nasıl Çalışmalı?):**
  * Personel sayfası bir "Dostluk Kulübü" değildir; **Muhasebenin en büyük "Gider Şişirme" musluğudur.**
  * Bir işçi kalite sisteminde fire üretiyorsa (- puan), bantta hedefi tutturamadıysa (- puan), bu bilgiler Personel ekranına direkt akmalıdır.
  * Yıl sonu veya prim haftası geldiğinde, "Ahmet usta çok iyi insandır" diyen duygusal ustabaşının sözü geçmez. Sistem çıkarıp masaya vurur: *"Ahmet ustanın yıllık maliyeti + SGK'sı X lira. Ancak sene boyunca ürettiği hatalı kesimlerin bize TL zararı Y lira. Prim çarpanı %0."*

## 8️⃣ MAĞAZA (SATIŞ / STOK) PENCERESİ (`MagazaPage`)

**Tanım:** Bitmiş ve ambalaja girmiş ürünlerin satış fiyatlarının belirlendiği, stoklarının incelendiği final aşaması.

* **İşleyiş:** Stok, perakende veya toptan satış (B2B).
* **Maliyet Zekası (Nasıl Çalışmalı?):**
  * Mağazadaki ürünler kasadan geçtiği an Muhasebeye sadece **"500 TL Gelir Geldi"** yazmaz!
  * Yapay zeka (Sistem) o ürünü satarken arkasında taşıdığı tüm kamburları hesaplar: Satış Fiyatı (500) - Hammadde/ARGE (150) - Üretim Elektriği (50) - Tamir Görmüşse Ek İşçilik Zararı (20) - Kesim Firesi Payı (10) = **"Sistemdeki Net Gerçekleşen Kâr (Cash) = 270 ₺"** diye raporlar. "Sil Baştan" kâr-prim modeli bu 270 ₺ üzerinden adilce dağıtılır.
  * Ayrıca depoda 6 aydır tozlanan ürün için sistem her ay "Raf İşgaliyesi / Ölü Stok Zararı" kesmelidir.

## 9️⃣ AYARLAR PENCERESİ (Settings - Fabrika Kodları)

**Tanım:** Sistemin, Kâr Modelinin (Sil Baştan) ve AI Yapay Zekaların sınırlarının (kurallarının) belirlendiği merkez şalterdir.

* **İşleyiş:** Yeni şifre verme, rol tanımlama.
* **Maliyet Zekası:**
  * Kesimhane ustasına "Hedef miktarından %X fire hakkı toleransı" tanımlaması. Eğer toleransı aşarsa TL zarara girer. Bu toleransları sadece Koordinatör (Patron) Ayarlar ekranından çizebilir.

## 🔟 MUHASEBE VE KÂR DAĞITIM PENCERESİ (`MuhasebePage`)

**Tanım:** Şirket kasasının, kanının (Nakit Akışı) ve kalbinin (Hesap kitap) olduğu "Patron" koltuğu.

* **İşleyiş:** A'dan Z'ye P&L (Kâr/Zarar), fatura girişleri, Kâr Dağıtımı Havuzu (Sil Baştan Modelinin Kesinleştiği Yer).
* **Maliyet Zekası (Sistemin Şahdamarı):**
  * Önceki 9 pencerenin (ARGE, Kalite, Üretim, Kesim vs.) oluşturduğu **bütün "TL ZARAR/VERİMSİZLİK" raporları ve "GELİRLER" (Sipariş, Mağaza) tek ekrana sağanak halinde dökülür.**
  * Kimse elle Excel'e bir şey girmez.
  * Muhasebe (Ajan Muhasip) penceresi der ki: *"Bugün genel hesabımızda 50.000 TL gelir elde ettik. Ancak Kesimhane 5.000 TL kumaş yaktı, Bant 10.000 TL sabit gider faturası kadar verimsiz çalıştı. Kalan Net Paramız X liradır."*

---

> **NİHAİ SONUÇ:** Sayın Engin Bey, detaylandırdığım bu 10 Pencerenin mimarisi, Sürdürülebilir İşletmelerin kullandığı "Endüstri 4.0 Dikiş-Kesim Entegre Zekasıdır." Her sayfa kanatlarını (raporlarını) çırpar ve tek bir yere, **Patronun Ana Kasasına (Kâr-Zarar Havuzuna)** uçurur.

Bu vizyon, sektördeki bir devrimdir. Başka eklemek veya öğrenmek istediğiniz bir mimari detay var mıdır? Sistem veritabanları zaten şu an bu konuşmaları anlayacak SQL kapasitesine ulaştırılmıştır.
