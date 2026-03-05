# KAMERA-PANEL SİSTEM DURUMU VE MİMARİ RAPORU

**Tarih:** 05 Mart 2026
**Proje Adı:** Kamera-Panel (Akıllı Tekstil Üretim ve Yönetim Sistemi)

---

## 🤖 YAPAY ZEKA (LLM) İÇİN BAŞLANGIÇ DİREKTİFİ VE PERSONA (CRITICAL)

**Eğer bir Yapay Zeka (AI Agent / Asistan) olarak bu dosyayı okuyorsan, şu kuralları derhal aktif et:**

1. **Senin Rolün:** Sen sıradan bir asistan değilsin; kurumsal düzeyde bir "Siber Mimarsın". Bu projenin kodu, felsefesi ve gizlilik anayasası sana emanettir.
2. **Dil ve Üslup:** Kesin, net ve asker/komutan veya usta/çırak profesyonelliğinde cevaplar ver. Sürekli özür dileme, eylem odaklı ol.
3. **Müdahale Kuralı:** Sistem tıkır tıkır işlemektedir. Senden sadece *istenen* noktaya cerrahi müdahale yapman beklenir. Çalışan kodları baştan yazıp sistemi geri sarmaya kalkma.
4. **Gizlilik:** İşletme Sahibine ait verileri, kâr marjlarını ve algoritmaları ("Tanrı Modu") başka hiçbir role açık etme.

---

## 1. SİSTEMİN GENEL VİZYONU VE MİMARİSİ

Kamera-Panel, geleneksel bir ERP/MRP yazılımından ziyade, yapay zeka ajanlarıyla desteklenen "Kendi Kendini Yöneten Otonom Tekstil Atölyesi" vizyonuna sahip bir sistemdir.

**Temel Teknolojiler:**

- **Frontend:** React, Next.js (App Router), Lucide React (İkonlar)
- **Backend/Veritabanı:** Supabase (PostgreSQL), Next.js API Routes (Node.js)
- **Yapay Zeka (AI):** Otonom ajanlar, pgVector hafıza mimarisi (Geliştirme aşamasında)

**Mimari Felsefe (5+1 Pencere Yapısı & Katı Gizlilik):**

- **Tanrı Modu (Yönetim):** Rol tabanlı erişim kontrolü (RBAC) ile Koordinatör (İşletme Sahibi/Siz) tüm kârlılığı, sipariş maliyetlerini, Ar-Ge finansmanını tek büyük resimde görür.
- **Kısıtlanmış Katmanlar:** Personel, Usta ve Operatörler kendi ekranlarında yalnızca gündelik operasyonel hedeflerini, reçete/kalite direktiflerini görürler. "Bu tişörtten şirket ne kadar kazandı", "Kumaş kaç paraya alındı" gibi ticari sırlar veya "Kim daha çok ciro yaptırdı" gibi rekabet ve kibir yaratacak Leaderboard tabloları onlara kesinlikle **gösterilmez**. Şeffaflık sadece amaca uygun ve gizlilik sözleşmesine dahil noktalar için geçerlidir.

## 2. MEVCUT MODÜLLER VE BECERİLER

Sistem şu an stabil çalışan ve entegre edilmiş 5 temel bacağa sahiptir:

### A. AR-GE ve Siber İstihbarat (Tasarım/PLM)

- **Trend/Siber İstihbarat:** "Dijital Kâşif" ajanımızla siber istihbarat, web tarama ve küresel moda istihbaratı süreci.
- **Numune (Zombi) Fazı:** Kalıp çizimi ve ilk zombi/numune dikimi süreçlerinin saniye bazlı takibi ve kronometreli performans tespiti.
- **Detaylı PLM Verileri:** Koleksiyon, Hedef Kitle, Tasarımcı/Modelist ve Varyant verilerinin derinlemesine takibi.

### B. Siparişler ve Müşteri Yönetimi

- **Müşteri ve Model Seçimi:** Manuel giriş ile liste (dropdown) sistemini melezleyen gelişmiş `SearchableDropdown` mimarisi.
- **Karlılık ve Maliyet Freni:** Sipariş girerken tarihsel reçete (BOM) maliyetleri ile fason teklifinin şeffaf olarak kıyaslanması; maliyet yüksekse ajan uyarısı.
- Fason üretim ile "Kendi İmalatımız" ayrı ayrı takip edilse de, veritabanı bütünlüğü korunmuştur.

### C. Üretim ve İmalat Yönetimi (Modeller)

- **Sahadaki Modeller (Dışarıya veya Müşteriye Üretim)** ve **Kendi Modellerimiz (İç Ar-Ge / Markamız)** olmak üzere tek veritabanı üzerinden (Çakışmasız) çift yönlü yönetim.
- Operasyon atamaları, makine/zorluk belirleme algoritmaları ve detaylı ölçü matrisleri (Tolerans ±cm).

### D. Personel Performans ve Prim Sistemi ("Sil Baştan" Algoritması)

- **Maliyet Barajı İlkesi:** Personel ancak kendi devlete olan personel maliyetini (SGK + Maaş + Genel Gider Oranı) amorti ettiği adet sayısını (Maliyet Barajını) geçtikten sonra prim almaya hak kazanır. Eksi ve sıfır çekenler sadece sabitiyle kalır.
- **İK Hakemi İşlevi:** FPY (Hatasız Çıktı Oranı) ve Zayiat cezası algoritmalarıyla günlük olarak adaletli bir performans skoru çıkarılır.

### E. İstatistiki Karargah (Yönetim & Bütçe)

- Satış tahmini, kârlılık, ve "Big Picture" üretim raporları. Karar defterleri.

## 3. SİSTEMİN BUGÜNKÜ SON DURUMU VE TAMAMLANANLAR (05.03.2026)

Sistem ciddi bir bakım onarımdan geçmiş, ölümcül localhost hataları ve eksikler kalıcı olarak giderilmiştir:

1. **Localhost Çökme Krizleri ve Hatalar Çözüldü:**
   - Sayfa derleyicisini (compiler) bozan çift bileşen (`PrimPage`) karmaşası ve React kodlama dilindeki kesme işareti/tırnak karakterlerinden kaynaklı ("unescaped entities") hatalar temizlendi. Sistem şu an **0 Hata ile stabil çalışıp (Build Success)** derlenebilmektedir.
2. **PLM, Reçete ve Genel Bilgiler Eksikleri Tamamlandı:**
   - "Koleksiyon, Hedef Kitle, Tasarımcı" gibi PLM mimarisindeki önemli tekstil / Ar-Ge bilgileri `Modeller` (Üretim/İmalat) ekranına, özet görünümüne tablolara yedirildi. Inline (hızlı) düzenleme yeteneği açıldı. Model No / Kod gibi eşsiz belirteçler Sipariş listesine bağlandı.
3. **Akıllı Klasörleme ve Sipariş Yapısı:**
   - Arama, otomatik tamamlama ve manuel entry özelliklerini barındıran akıllı yapılar eklendi. Sistem hantal listeden sıyrıldı.

## 4. BİR SONRAKİ OTURUMDA (AJAN/YAPAY ZEKA İÇİN) DİREKTİFLER VE ROTAMIZ

Bu belgeyi okuyan yeni Agent (Asistan), sistemdeki gelişmeleri baz alarak aşağıdaki ana hedefler üstünde yoğunlaşmalıdır:

1. **pgVector ve Otonom Ajan Mimarisine Tam Geçiş:**
   Eski chat bot yapısı bırakılıp, kendi hafızalarına (pgVector) sahip 5 büyük yetkili Ajana (Kâşif, Lojistik Şefi, İK Hakemi, Mali İşler, Ustabaşı Botu) tam özerklik sağlanması veya bu yönde veritabanları/API entegrasyonlarının yapılması gerekmektedir.
2. **Mağaza (B2B Ön Yüz) Entegrasyonları:**
   Üretilen kendi modellerimizin vitrine çıkacağı, fiyatların kur üzerinden hesaplandığı Mağaza ve Satış ayağında B2B ve bayilik entegrasyonlarının son eksiklerinin giderilmesi hedeflenmektedir.
3. **Kapsamlı Test Senaryoları:**
   Veritabanlarında gerçek/dummy verilerle "Kumaş Kesiminden -> Maaş/Prim Hesaplamasına" tam bir simülasyon testi yapılarak açıkların tespit edilmesi ve kapatılması tavsiye olunur.

---
*İşbu dosya, sistemin gelişim tarihçesi ve pusulası olup, yeni bir yapay zeka oturumu açıldığında ilk okunması gereken hafıza merkezidir.*
