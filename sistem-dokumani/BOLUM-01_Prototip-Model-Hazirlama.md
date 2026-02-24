# BÖLÜM 1: PROTOTİP / MODEL HAZIRLAMA AŞAMASI

## Tarih: 2026-02-22
## Durum: Ham Kayıt (Kullanıcıdan Alınan)

---

## 1.1 Problem Tanımı

- Ürün sahibi, ürün üzerinde yapılacak **tüm işlemleri** ve bunların **nasıl yapılacağını** tam olarak belirtmiyor.
- Arada birçok işlem atlanıyor/eksik kalıyor.
- Bu eksik kalan işlemler nedeniyle çalışanlar **kendi inisiyatiflerini** kullanmak zorunda kalıyor.
- İnisiyatif kullanılan işlemlerde **adil bir bedel değerlendirmesi** yapılmadığı için fason çalışan işletmeler **kalite ve dünya standartlarına** gerekli özeni göstermiyor.

---

## 1.2 Çözüm: İlk Numune / Prototip Kayıt Sistemi

### 1.2.1 Temel Prensipler
- Ürün **ilk prototip aşamasındayken** veya **ilk model hazırlık aşamasındayken** tüm bilgiler kayıt altına alınacak.
- Kayıt altına alınacak bilgiler:
  - **Yapılacak işlem sayısı**
  - **İşlemlerin yapılma sırası**
  - **İşlemlerin yapılış şekli**
  - **Her işlemin istenilen ve optik duruşu**
  - **Her işlemin zorluk derecesi**

### 1.2.2 İşlem Zorluk Derecesi
- Her işlem kayıt altına alınırken o işlemin **zorluk derecesi** ayrıca belirtilecek.
- Zorluk derecesi, ilerleyen aşamalarda **adil ücretlendirme**, **performans değerlendirmesi** ve **iş dağılımı** için temel veri kaynağı olacak.
- Zorluk derecesi prototip aşamasında belirlenerek dokümana ve sisteme işlenecek.

### 1.2.3 Kayıt Yöntemi
- Tüm işlemler **sesli ve görsel** olarak kayıt altına alınacak.
- Model makinacı ilk ürünü hazırlarken **bir tablet** ile görsel ve sesli kayıt yapılacak.
- Her işlem **ayrı ayrı video** olarak kaydedilecek (örn: omuz alma işlemi ayrı bir video).

### 1.2.4 Video İçeriği (Her İşlem İçin)
- İşlemin **yapılış şekli**
- İşlemin **olması gereken optik görünümü**
- Nasıl yapılırsa ürün kalitesinin **kabul edilebilir** olacağı
- Nasıl yapılırsa ürün kalitesinin **kabul edilemez** olacağı
- **Sesli anlatım** ile işlemin nasıl yapılacağının açıklanması

### 1.2.5 Kamera Sistemi Kurulumu
- İşlem yapılan **her makinada** kamera sistemi kurulacak.
- Kamera **20-30 derece açıyla** konumlandırılacak.
- Kameranın görmesi gerekenler:
  - Yapılan **işlemin kendisi** ve **ince ayrıntıları**
  - Makinanın **ayak ve iğnesi**
  - Operatörün **elleri** ve **işlem yapış şekli**

---

## 1.3 Sesten Yazıya Dönüşüm ve Kontrol Mekanizması

### 1.3.1 Ses → Yazı Çevirisi
- Her işlem için yapılan **sesli anlatım**, otomatik olarak **yazıya çevrilecek**.

### 1.3.2 Kontrol Mekanizması
- Çevrilen yazı ile ses kaydı karşılaştırılacak:
  - Aynı **anlam ve ifade** mi taşıyor?
  - **Farklılık** var mı?
  - **Yanlış bir durum** var mı?
- Kontrol mekanizması tarafından doğrulandıktan sonra onaylanacak.

---

## 1.4 Çıktılar (Dokümantasyon)

### 1.4.1 Yazılı Doküman
- İlk işlemden son işleme kadar **yazılı yapılış şekli** oluşturulacak.
- Doküman formatı: **Excel veya Word**
- Dokümanda bulunacak bilgiler:
  - **Model Adı**
  - **Model Kodu**
  - **Tarifi** (Açıklama)
  - **Kumaşı**
  - **Beden Aralığı**
  - **Yapılacak İşlemlerin Sıralı Yapılış Şekli** (İlk işlemden son işleme kadar)

### 1.4.2 Video Arşivi
- Her işlemin **ayrı videosu** sıralı şekilde arşivlenecek.
- Videolar ile yazılı doküman **eşleştirilmiş** olacak.

---

## 1.5 Dil Desteği

### İlk Aşama
- **Türkçe** (Ana dil)
- **Arapça** (İkinci dil)

### Mimari Hedef
- Sistem **çok dile çevrilebilir** mimaride tasarlanacak.
- İleride farklı diller eklenebilecek.

---

## 1.6 Sonraki Aşama
> **Bölüm 2: Seri Üretime Geçiş** — (Bekliyor)
