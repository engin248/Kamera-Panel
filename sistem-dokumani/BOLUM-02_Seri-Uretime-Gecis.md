# BÖLÜM 2: SERİ ÜRETİME GEÇİŞ

## Tarih: 2026-02-22
## Durum: Ham Kayıt (Kullanıcıdan Alınan)

---

## 2.1 Seri Üretim Başlangıç Süreci (Operatör Adımları)

Her operatör, seri üretime başlamadan önce aşağıdaki adımları sırasıyla tamamlayacak:

### Adım 1 — Video İzleme
- Operatör, kendisine atanan işlemin **prototip videosunu** tabletten izler.
- İşlemin **nasıl yapılacağını** görsel olarak öğrenir.

### Adım 2 — Sesli Anlatımı Dinleme
- İşlemin **sesli anlatımını** dinler.
- Yapılış şeklini sesli talimatlarla pekiştirir.

### Adım 3 — İlk Ürünü Yapma
- Öğrendiği şekilde **ilk ürünü** yapar.

### Adım 4 — Fotoğraf Çekme ve Karşılaştırma
- Yaptığı işlemin **fotoğrafını çeker**.
- Tabletteki **prototip örnek ürünle karşılaştırır**.
- Sistem veya yönetici tarafından **"OK" onayı** alınır.

### Adım 5 — Seri Üretime Başlama
- Onay alındıktan sonra **seri üretim başlar**.
- **Başlangıç saati** otomatik olarak sisteme kaydedilir.

---

## 2.2 Ara Kontrol Sistemi

### 2.2.1 Periyodik Kontrol
- Seri üretim sırasında **belirli aralıklarla** (örn: her 20 üründe bir) ara kontrol yapılır.
- Kontrol edilen ürün, **sistemdeki prototip örnek ürünle karşılaştırılır**.

### 2.2.2 Kontrol Kriterleri
- İşlemin **doğru yapılıp yapılmadığı**
- Ürünün **optik görünümünün** uygunluğu
- İşlemin **kalite standartlarına** uygunluğu

### 2.2.3 Kontrol Sonucu
- ✅ **OK** → Üretim devam eder
- ❌ **Olmamış** → "Yeniden deneyin" uyarısı verilir, düzeltme yapılır

### 2.2.4 Maliyet Avantajı
- Tüm işlemler önceden belirlenmiş ve sistemde tanımlı olduğu için **inisiyatif kullanımı ortadan kalkar**.
- Ara kontroller sistem üzerinden yapıldığı için **kalite kontrol personeli maliyeti düşer**.
- İşletmelere **maliyet tasarrufu** sağlanır.

---

## 2.3 İşlem Bitiş Kaydı ve Zaman Takibi

### 2.3.1 Kayıt Altına Alınan Veriler
İşlem tamamlandığında sisteme aşağıdaki bilgiler kaydedilir:
- **İşlem başlangıç saati**
- **İşlem bitiş saati**
- **Toplam üretilen ürün adedi**
- **Bir ürünün kaç saniye/dakikada yapıldığı** (otomatik hesaplama)

---

## 2.4 Ücret ve Maliyet Hesaplama

### 2.4.1 Personel Maliyet Hesabı
- İşlemi yapan personelin **maliyeti ve ücreti** hesaplanır.
- Her işlemin, **bütün ürün içindeki zorluk derecesine göre değeri** belirlenir.

### 2.4.2 Ücret Karşılama Analizi
- Bu işlemi yapan personelin **aldığı ücreti karşılayıp karşılayamadığı** hesaplanır.
- Hesaplama: `Yapılan işlemlerin toplam değeri` vs. `Personelin aldığı ücret`

---

## 2.5 Prim ve Performans Değerlendirme Sistemi

### 2.5.1 Kayıt Periyotları
Tüm işlemler aynı mantık ve düzende kaydedilir:
- **Günlük** kayıt
- **Haftalık** kayıt
- **Aylık** kayıt

### 2.5.2 Verimlilik Değerlendirmesi
- Çalışan personelin **verimliliği** ölçülür.
- Aldığı ücret karşısında **yaptığı işlemlerin değeri** değerlendirilir.

### 2.5.3 Prim Sistemi (Ücret Karşılandığında)
- Personelin yaptığı işlemlerin değeri, aldığı ücreti **karşıladığından fazla** ise:
  - Fazla kalan kısmın **%10-%20'si** gibi bir oran **prim olarak** verilir.
  - Prim, maaş **dışında** ek ödeme olarak ödenir.
  - **Çalışan ve verimli personel ödüllendirilir** ✅

### 2.5.4 Düşük Performans Yönetimi (Ücret Karşılanmadığında)
| Ay | Eylem |
|----|-------|
| **1. Ay** | Durum **bildirilir**, personel uyarılır |
| **2. Ay** | **Düzelme ve durum değerlendirmesi** yapılır |
| **3. Ay** | **Karar aşaması**: Devam mı, ayrılık mı? |

---

## 2.6 Üretim Öncesi Uygunluk Kontrolü

### 2.6.1 İşletme Yeterlilik Analizi
Prototipten gelen bilgilere göre sistem otomatik olarak kontrol eder:
- Bu ürün için **kaç işlem** gerekiyor?
- Bu işlemler için **hangi makineler** gerekiyor?
- Bu işlemler için **hangi becerilere sahip personel** gerekiyor?

### 2.6.2 Eşleştirme
- Fason işletmenin **mevcut makine parkuru** ile gereksinimler karşılaştırılır.
- Fason işletmenin **mevcut personel becerileri** ile gereksinimler karşılaştırılır.
- Sistem, **bu ürünün bu işletmeye uygun olup olmadığını** belirler.

---

## 2.7 Makine Başı Donanım Kurulumu

### 2.7.1 Her Makinada Bulunacak Ekipmanlar
- **Kamera**: Gerekli açıyla monte edilmiş, işlemi ve detayları gören
- **Tablet / Panel**: Operatörün kullanacağı ekran
- Tüm ekipmanlar **operatörün çalışmasını engellemeyecek** şekilde yerleştirilecek

### 2.7.2 Tablet/Panel Üzerinde Erişilebilir İçerikler
- 📹 **Video**: İşlemin yapılış videosu
- 🔊 **Ses**: İşlemin sesli anlatımı
- 📝 **Yazı**: İşlemin yazılı talimatları
- Operatör, ihtiyaç duyduğu anda bunlara erişebilecek

---

## 2.8 Yönetici Paneli / Sistem Kullanımı

### 2.8.1 Yönetici Görünümü
- Yönetici sistemi açtığında:
  - **Yazılı ve görsel işlem sırası** görüntülenir
  - Her işlemin durumu takip edilir

### 2.8.2 İşlem Doğrulama
- Operatör işlemi tamamlayıp sisteme yüklediğinde:
  - Sistem, yüklenen işlemi **prototip örneğiyle karşılaştırır**
  - ✅ **OK** → Devam
  - ❌ **Olmamış** → "Yeniden deneyin" uyarısı

---

## 2.9 Sistemin Sağladığı Temel Faydalar

| Fayda | Açıklama |
|-------|----------|
| **İnisiyatif Yok** | Her işlem nasıl yapılacağı önceden belirlenmiş, tahmine yer yok |
| **Kalite Güvence** | Ara kontroller ve sistem karşılaştırmaları ile kalite garanti altında |
| **Adil Ücretlendirme** | Zorluk derecesine göre işlem değeri + prim sistemi |
| **Çalışan Ödüllendirme** | Verimli çalışanlar prim ile ödüllendirilir |
| **Düşük Performans Tespiti** | Çalışmayan/verimsiz personel veriyle tespit edilir |
| **Maliyet Düşürme** | Kalite kontrol personeli ihtiyacı azalır, işletme maliyeti düşer |
| **Şeffaflık** | Tüm veriler kayıt altında, herkes ne yaptığını ve kazancını görür |

---

## 2.10 Sonraki Aşama
> **Bölüm 3:** — (Bekliyor)
