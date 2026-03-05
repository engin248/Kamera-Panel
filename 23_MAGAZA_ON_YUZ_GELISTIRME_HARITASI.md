# MAĞAZA (SATIŞ VE ÖN YÜZ) TEKNİK GELİŞTİRME HARİTASI

Bu doküman, oluşturulan `11_magaza_stok_ve_satis_tablolari.sql` altyapısı üzerine inşa edilecek **Kamera-Panel Mağaza/Kasa Ön Yüzünün (UI)** gereksinimlerini listeler.

Tıpkı İmalat biriminde olduğu gibi, "Satış Modülü" de büyük bir asistan kalkanıyla (`satis.js` ve `satis-analisti.js`) desteklenecektir.

## 1. Geliştirilecek Ana Sayfa: `app/app/magaza/page.js`

İmalat ve Ar-Ge dışında, sipariş/satış operasyonları için yeni bir sekme (Tab) kurgusu gereklidir:

* **Sekme 1: Kasa Arayüzü (B2B ve B2C Satış Paneli)**
  * Bir "POS (Point of Sale)" ekranı mantığında çalışır.
  * Satılacak Modeller seçilir.
  * Müşteri (Firma/Şahıs) listesi dropdown ile getirilir.
  * "🤖 Satış Şefi'ne Danış" butonu buradadır. Zararına satışları veya riskli müşterileri engeller. İndirim taleplerinin onay merciidir.
* **Sekme 2: Dinamik Envanter ve Stok (Yaşlanan Stok Takibi)**
  * Raftaki güncel `magaza_stok` miktarlarını listeler.
  * Giriş tarihi `giris_tarihi` üzerinden "Kaç Gündür Stokta?" sütunu bulunur.
  * "🤖 Analist: Yaşlanan Stokları Tara" butonu burada bulunur. `raf_omru_uyarisi` TRUE olan mallar için iskonto/bundle kampanya önerileri üretir.
* **Sekme 3: Müşteri Cari Sicili (Risk Skoru Paneli)**
  * Kim ne kadarlık mal aldı, açık limiti ne kadar, kaç parası kaldı?
  * `favori_kargo_firmasi` burada tanımlanır. (Otomatik Kredi ve Sevk kontrolü).

## 2. Yazılacak Yapay Zeka Backend (Ajan) Servisleri

İmalat'taki (Lojistik, Fason vs.) ajan mimarisine benzer şekilde:

* **`app/api/magaza/satis-sefi/route.js`**: İskonto ve Cari limit kontrollerini yapar.
* **`app/lib/agents/satis-sefi.js`**: LangChain motorudur. Empatik dil üretme, güven skoru okuma ve "sıfır maliyet kalkanı" karar destek sistemini içerir.
* **`app/lib/agents/veri-analisti.js`**: "Sell-Through Rate" (Satış Hızı) formülünü hesaplayan özel RAG ajanıdır.

## 3. Üretim Bandı Müzakeresi (İmalat ile Haberleşme)

Eğer Kasa ekranında, 500 stok varken "2000 adetlik" bir toptan sipariş emri girilirse:
Sistem hata verip "Stok Yetersiz" demek yerine; Asistan (Sipariş Paneli), `Bant Şefi`'nin API'sini tetikler:
*"Şu an model kesim ve dikim hatlarında boşluk var mı? Geriye kalan 1500 adetlik üretimi ne kadar sürede tamamlarız?"*
Gelen veriye göre müşteriye **Kesin Termin Tarihi (Satış Taahhüdü)** oluşturulur.

*Onayınızla birlikte, ilk olarak `page.js` içerisine VEYA `app/magaza/page.js` klasörüne Frontend inşasına başlayacağız.*
