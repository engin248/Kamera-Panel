# 🚀 Kamera-Panel Güncellemeleri - 05.03.2026

## 1. Gizlilik Anayasası Uygulaması (Rol Bazlı Menü Daraltması)

- `app/page.js` içindeki `ROLE_ACCESS` matrisi güncellendi.
- Artık Ustabaşı, Bant Sorumlusu ve Operatör kendi "Prim" sekmelerini görebiliyorlar ancak **Muhasebe, Maliyet, Raporlar (P&L - Kar/Zarar)** gibi modüllere **girişleri arayüz seviyesinde tamamen kapatıldı.**
- Koordinatör **haricindeki** tüm roller, şirketin kârlılığını, maliyetlerini ve diğer "büyük resim" verilerini **göremez** duruma getirildi.

## 2. Maaş Barajlı "Sil Baştan" Prim Modeli (Target Limit)

- `app/page.js` içerisindeki **Prim Sayfası (`PrimPage`)** güncellendi.
- Yetkisi olmayan (Koordinatör olmayan) personeller prim sayfasına girdiğinde artık şirket prim listesini listelemek yerine, **sadece kendi kişisel "Maaş Barajı" ekranını** görmektedir.
- Personelin *toplam_uretilen*, *katki_degeri* ve *maas_maliyeti* hesaplanarak bir **`targetAdet`** (Maaş Baraj Hedefi) belirlendi.
- Personel, bu barajı aşmadığı sürece (örneğin 3000 parça) ne kadar prim alacağını göremez ve teşvik barı ile kendi hedefine ne kadar kaldığını anlık olarak izler. Barajı geçtiği an yeşil renkli "🎉 Maaş Maliyetini Karşıladın!" ekranı ile hak ettiği primi TL cinsinden görür.

## 3. Adil Kalite Duvarı ve Fire Cezaları Altyapısı

- Hatalı (Red) çıkan ürünlerin tamirini yapmanın bir maliyeti (Rework Cost) olduğu için Kalite Kontrol modülü güncellendi.
- `app/api/quality-checks/route.js` dosyasına bir "Fire_Cezasi" trigger'ı eklendi. Kontrol sonucu **'red'** ise ve o işlemi yapan personel biliniyorsa, otomatik olarak `fire_kayitlari` tablosuna **1.50 TL (örn. Sökme/Dikme) ceza maliyeti** (Tamir Kaybı) yansıtılıyor.
- Personelin `api/prim` içindeki prim hesaplamasında bu fire/zayiat hesaplaması maaştan sonra ayrıca **düşülerek** (Fazla Değer = Katkı - Maaş Maliyeti - **Zayiat**) net prim hakkı belirlendi. Böylece sadece çok üretmek değil, **kaliteli üretmek** primin ana şartı yapıldı.

## 4. Veritabanı (SQL) Altyapı Hazırlığı

- `24_FIRE_CEZASI_VE_GIZLILIK.sql` isimli dosya oluşturularak şu anda çalışmakta olan veya eklenecek olan tablo eksiklikleri (operator_id, estimated_loss_amount) için DB göç (migration) kodları hazırlandı.
- RLS (Row Level Security) kurallarının taslağı yazılarak, arayüzde (frontend) gizlenen verilerin sunucu/veritabanı (backend) seviyesinde de "Koordinatör" dışındakilere kapatılmasının temelleri atıldı.
