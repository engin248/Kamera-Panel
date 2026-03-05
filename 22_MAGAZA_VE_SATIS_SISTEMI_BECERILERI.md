# MAĞAZA (TOPTAN VE PERAKENDE SATIŞ) BÖLÜMÜ BECERİLERİ VE YAPAY ZEKA MİMARİSİ

İmalat ve Ar-Ge (Üretim bandı) hatasız ve yapay zeka korumalı bir şekilde inşa edildikten sonra, atölyenin vitrini ve gelir merkezi olan **Mağaza Bölümünün** (Toptan ve Perakende) inşasında dünya standartlarında satış ve pazar yönetimi becerileri bulunmalıdır.

Dünya genelindeki B2B (Toptan) ve B2C (Perakende) mağaza yönetim sistemleri incelendiğinde, sistemin "sıradan bir stok takip botu" olmaktan çıkıp **Kamera-Panel Otonom Satış Komuta Merkezine** dönüşmesi için gereken temel beceriler şunlardır:

## 1. 🔄 Evrensel Ürün Yaşam Döngüsü ve Soybilim Takibi (Product Lifecycle)

İmalattan çıkan her bir partinin (batch) veya tekil ürünün barkodlanıp, "Kime Gitti?", "Ne Zaman Gitti?" ve "Hâlâ Orada Mı?" sorularına saniyesinde cevap verebilen bir izlenebilirlik (Traceability) ağı kurulmalıdır.

* **Beceriler (Dünya Standartları):**
  * **B2B & B2C Ayrıştırması:** Toptancıya giden malın koli/parti (batch) bazlı, perakende satılan malın tekil SKU bazlı takibi. "Ahmet Toptancısına giden 500 adet A modelinin 300'ü satılmış, 200'ü elinde bekliyor" gibi B2B müşteri stoklarını dahi sat-çık (sell-out) verileriyle tahminleme yeteneği.
  * **Zaman ve Hız Kronometresi:** Ürün imalattan çıkıp mağazaya veya depoya girdiği an kronometre başlar. Her bir ürünün rafta veya depoda kaçıncı gününde olduğu saniyesi saniyesine raporlanır.
  * **Gerçek Zamanlı Omnichannel:** İnternet sitesi, toptan B2B portalı ve fiziksel mağaza stoklarının tek havuzdan yönetilmesi ile "Yok Satma" (Stockout) kalkanının oluşturulması.

## 2. 🎯 Sell-Through Rate (Satış Hızı) ve Rafta Yaşlanan Stok (Aging Inventory) Analizi

Perakende ve toptan satışın kalbi, doğru malı doğru hızda satmaktır. Global markaların en çok güvendiği iki metrik sisteme gömülmelidir.

* **Beceriler (Dünya Standartları):**
  * **Sell-Through Rate (STR) Motoru:** "100 adet gelen malın 1 haftada yüzde kaçı satıldı?" sorusunun (Satış Hızı) yanıtı. Genellikle perakendede hedeflenen `%70-%80` aralığıdır. Ajan, bu hedefin altında kalan modelleri anında tespit eder.
  * **Yaşlanan Stok (Aging Inventory) Alarmları:** Rafta 0-30, 31-60, 61-90+ gün bekleyen stokları (Deadstock) tespit eden Veri Analisti Ajanı.
  * **Dinamik İskonto ve Kampanya Tetikleyicisi:** Yaşlanan veya STR'si düşük olan ürünler için otomatik "Çapraz Satış" (Bestseller ile bundle yapma) veya kademeli bölgesel iskonto önerileri sunarak paranın rafta ölmesini (kilitlenmesini) engeller.

## 3. ⚖️ Hızlı B2B Fiyatlama ve İskonto Yönetimi (Satış Şefi Ajanı)

Toptan satışlarda müşterinin sürekli fiyat ve iskonto pazarlığı yapması kaçınılmazdır. Ajan, kârlılığı koruyup müşteriyi ödüllendirmelidir.

* **Beceriler:**
  * **Maliyet Odaklı Satış:** Modelin güncel üretim maliyetini (Muhasip ajandan alarak) canlı olarak görür. Zararına veya sıfır kârla toptan sipariş verilmesini sert bir dille engeller.
  * **Müşteri Sadakati ve Kâr Marjı Esnekliği:** Güven Skoru yüksek (ödemeleri sağlam ve düzenli olan) müşteriler için sistem, satış personeline inisiyatif vererek **daha düşük kâr marjıyla (%15 yerine %12 gibi)** satış onayı verir ("Müşteri kalitelidir, ticari ilişkiyi sürdürmek adına kâr marjından fedakarlık yapılabilir" yaklaşımı).

## 4. 🗂️ Müşteri Risk, Empati ve Açık Hesap Yönetimi

Toptan (B2B) satışta müşteri ilişkisini "robotik ve sert" değil, "insani ve ticaretin kuralına uygun" (esnaf zekası) yönetmek şarttır.

* **Beceriler:**
  * **Risk Skoru ve Empatik (Kırıcı Olmayan) Dil:** Ödemesi zayıf olan veya limiti dolan bir toptancıya sistem asla "Reddedildi" veya "Riskli" mesajı çekmez. Bunun yerine Satış Şefi Ajanı; *«Değerli müşterimiz, mevcut cari hesap dengemiz gereği bu siparişte size peşin ödeme seçeneği ile yardımcı olmak isteriz»* gibi kırıcı olmayan, empati odaklı alternatif çözüm diline (prompt'a) sahip olur.
  * Perakende iadelerinde "kronik iadeci" müşterileri tespit edip kargo masrafı optimizasyonu yapması. (Kara liste algoritması)

## 5. 🚚 Müşteri Tercihli Lojistik ve Üretimle Konuşan Kasa

Sadece sevkiyat yapmak yetmez; müşteri hangi ambarı/kargoyu tanıyorsa onunla çalışmak güven verir.

* **Beceriler:**
  * **Müşteriye Özel (Favori) Kargo Hafızası:** Her toptancının tanıdığı, bedelini uygun bulduğu bir kargo veya ambar firması vardır. Sistem, müşterinin geçmişte en çok hangi kargoyu tercih ettiğini pgVector'de tutar ve sipariş girilirken otomatik olarak müşterinin **favori lojistik firmasını** irsaliyeye yazar.
  * Beklenmedik dev siparişlerde eksik olan ürün için **İmalat Bölümüyle (Bant Şefi Ajanı) anında pazarlık yapıp**, müşteriye *gerçekçi ve kesin bir üretim/teslim tarihi* verebilme becerisi.

---

### 💡 Mağaza Modülü İnşaat Planı (Sıradaki Adımlar)

Bu dünya standartlarındaki sistemi kurmak için şu 3 temel veritabanı tablosunu (`supabase`) inşa ederek başlayacağız:

1. **`kamera_magaza_stok`:** Hangi ürün, hangi barkodla (SKU), hangi tarihte mağazaya/depoya girdi? (Yaşlanan stok takibi için).
2. **`kamera_satislar`:** Hangi ürün, kime (Müşteri ID), saat kaçta, hangi kâr marjıyla veya iskontoyla satıldı? (Sell-Through Rate hesabı için).
3. **`kamera_musteriler`:** Perakende/Toptan müşteri sicili bilgileri, güven skoru, toplam cirosu, favori kargo firması ve iade tarihçesi.

Siz onay verdiğiniz an, ilk olarak bu tabloları pgVector yapısına uygun SQL komutlarıyla oluşturup, ön yüze Satış/Kasa ekranını dökmeye başlayabiliriz!
