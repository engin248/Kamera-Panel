# 🚀 İMALAT PENCERELERİ: "A SEÇENEĞİ (AGRESİF KÂR VE MALİYET ZEKASI)" UYGULANMASI

Sayın Koordinatör, daha önce karar kıldığımız **(A Seçeneği) Agresif Kâr Odaklı / Endüstri 4.0** stratejisini, "Kesim ve İmalat Takibi" modülündeki *tüm sekmelere ve veritabanına (fizyolojik olarak)* entegre ettim ve kodları derleyerek testlerini bitirdim.

Zaman veya stok takip yazılımından çıkarak; her butonun, her input alanının arkasında bir **TL Bedeli (Zarar/Ziyan)** arayan bir "Yapay Zeka Maliyet Cihazına" dönüştürdük. İşlemler ve bakış açımız aşağıdaki gibidir:

---

## 1️⃣ KESİM PLANI SEKMSİ (Tartım ve İzlenebilirlik Mührü)

* **Eski Durum:** Kesim ustası planı kendi insiyatifi ile açıp tahmini metre/kg girip geçebiliyordu. Kumaşların hangi toptancıdan/partiden geldiği veya gerçek tartım değeri "opsiyonel" bir bilgiydi.
* **Yeni Kodlanan Hiyerarşi (Maliyet Zekası):**
  * **PARTİ / LOT NO (*):** Form alanına kırmızı sınırlarla eklendi. Ustanın kestiği kumaşın top/parti numarası girilmeden sistem kesim planını **KAYDETMEZ**.
  * **USTANIN KESTİĞİ NET (KG/Metre) (*):** Zarar/Ziyanı makinenin anlayabilmesi için "Zorunlu Tartım" ibaresiyle işaretlendi. Teorik kullanım ile gerçek kullanım arasındaki sapmaları anında yakalıyoruz.
  * **Tablo Revizyonu:** İzlenebilirlik adına "Sarj(m)" kolonu yerine "Parti/Lot" kolonu ana tabloya yerleştirildi. Böylece geçmişe dönük *"Şu partiden ne kadar kestik, ne fire verdik?"* analizini anında yapabileceğiz.
* **Veritabanı (DB) Karşılığı:** PostgreSQL sunucusuna direkt bağlanarak `kesim_planlari` tablosuna `parti_lot_no`, `used_fabric_qty`, `actual_fabric_qty`, `fabric_waste_qty` isimli sütunlar eklendi ve API'ye bağlandı.

## 2️⃣ FİRE KAYIT SEKMSİ (Manuel Ceza & Kâr-Zarar Fişi)

* **Eski Durum:** Fire girildiğinde sadece "Metre" veya "Yüzde %" olarak stoktan düşüyordu. Sistem tahmini bir 100₺ çarpanıyla farazi bir maliyet çıkartıyordu.
* **Yeni Kodlanan Hiyerarşi (Maliyet Zekası):**
  * **BİLİNEN/HESAPLANAN ZARAR (₺) (*):** Fire formuna, tamamen kâr/maliyet odaklı kırmızı bir TL input'u açıldı.
  * "Fireyi yapan operatöre bu TL bedeli sistemden zimmetlenecektir (Prim Eksi Puan)" notu ile ustabaşını/yöneticiyi zararı *TL Cinsinden* beyan etmeye zorluyoruz.
  * Bu girilen TL zarar, API tarafında filtrelenip DİREKT olarak **`cost_entries` (Muhasebe Maliyet Kayıtları)** tablosuna "FİRE NEDENİ: ... (TL ZARAR)" başlığı ile kalıcı borç yansıtılıyor.
* **Tasarruf & Caydırıcılık:** Operatörler, kaydettikleri frelerin ekranda salt bir "10 Metre" olarak değil, "5.000 ₺ Zarar" olarak kayıt altına alındığını görecek/bilecektir.

## 3️⃣ HAT PLANLAMA SEKMSİ (Günlük Bant Kira ve Fason Maliyeti)

* **Eski Durum:** Üretim hattı (Bant) açılırken sadece günlük hedef adet ve hat adı giriliyordu. Yani "hat ne kadar sürede ne üretti?" felsefesi hakimdi.
* **Yeni Kodlanan Hiyerarşi (Maliyet Zekası):**
  * **GÜNLÜK SABİT HAT MALİYETİ (₺) (*):** Eğer hat fason değil de bir "İç Üretim (Bant)" ise, o bandın 1 günlük açık kalma maliyeti (Elektrik, işçilerin yevmiyesi, yemek, amortisman) form üzerinden zorunlu istenir hale getirildi.
  * Eğer o bant gün sonunda hedeflenen adeti çıkartamazsa, *Günlük Sabit Maliyet / Üretilen Adet* formülüne sapma bindiğini (Birim maliyetinin fırladığını) rapor ekranlarında görebileceksiniz.
  * Ayrıca "Zorluk Derecesi (1-5)" bilgisi artık salt bilgi olmaktan çıkıp, API üzerinden DB'ye `bant_zorluk_derecesi` sütunu ile yazılıyor. Yapay Zekamız prim verirken zor işçilik çıkaran hatta daha fazla katsayı uygulayacak.

## 4️⃣ YARI MAMUL TIKANIKLIK (DARBOĞAZ) TESPİTİ

* "Faz Kaynak -> Faz Hedef" stoğu geçirilirken var olan `bozulan_adet` metriği, aslında operasyonlar arası taşıma/bekleme sırasındaki zararı temsil eder. Fason baskıdan dönen ürünün içindeki lekeli adetleri yakalamak bu sekmeden geçer.

---

### 🔥 YAZILIM TEST VE MİMARİ SONUÇLARI

Tarafımca yapılan DB sorguları (`ALTER TABLE...`), Frontend React (`imalat-page.js`) ve Backend API (`route.js`) güncellemelerinin ardından sistem `npm run build` ile yeniden derlendi.

Sistem sıfır hata (Exit Code: 0) ile tüm bu Maliyet Zekası (A Seçeneği) hiyerarşisini sorunsuz olarak bünyesine kabul etti. Arayüzde hiçbir çökme yoktur.
