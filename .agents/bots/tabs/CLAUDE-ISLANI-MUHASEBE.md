# CLAUDE-ISLANI-MUHASEBE.md

# PENCERE 6 — MUHASEBE: CLAUDE İÇİN TAM İŞ PLANI

> **Hazırlayan:** Antigravity
> **Tarih:** 2026-03-03
> **Hedef:** Bu belgeyi okuyan Claude hiçbir soru sormadan tamamen uygulayabilmeli.
> **Bağlı dosyalar:** RAPOR-ANALIZ.md | MALIYET.md | SUPABASE-SEMA.md

---

## ÖZET

Muhasebe penceresi (Pencere 6), Rapor & Analiz'in (Pencere 5) onaylanmış
verilerini kullanarak aylık kapanışı yapar.

Farkı: **Rapor & Analiz → analiz ve karar**, **Muhasebe → kayıt ve belge**.

Temel çıktılar:

1. Aylık kapanış (gelir - gider = net kâr/zarar onaylı kayıt)
2. Prim gideri kesinleştirilmesi (ödendi = muhasebe kaydı)
3. PDF rapor (yönetim + muhasebeci için)
4. Bölüm özeti (müşteri bazlı, model bazlı kârlılık)
5. Dönemsel karşılaştırma (bu ay / geçen ay / geçen yıl)

---

## BAKIŞ AÇISI 1 — TEKNİK MİMARİ

### 1.1 Teknoloji Yığını

| Katman | Teknoloji | Not |
|--------|-----------|-----|
| Frontend | Next.js (page.js yeni case) | `case 'muhasebe':` |
| API | `/api/muhasebe/` rotaları | 5 endpoint |
| Veritabanı | Supabase (kar_zarar_ozet, prim_kayitlari) | Okuma + güncelleme |
| PDF | `@react-pdf/renderer` veya `jspdf` | Paket kurulumu gerekebilir |
| Bot | GPT-4o-mini (Muhasip) | Rapor penceresiyle aynı bot |

### 1.2 Dosya Yapısı

```
app/
├── api/
│   └── muhasebe/
│       ├── ay-kapanis/route.js        ← Aylık kapanış kayıt + onay
│       ├── gelir-gider/route.js       ← Detaylı gelir/gider listesi
│       ├── donemsel-karsilastirma/route.js ← Bu ay / geçen ay / geçen yıl
│       ├── pdf-rapor/route.js         ← PDF üretimi
│       └── ozet-dashboard/route.js   ← Muhasebe dashboard
├── app/
│   └── page.js                        ← 'muhasebe' case eklenir
```

### 1.3 Bağımlılık Yönetimi

```bash
# PDF için paket kur (seçenekler):
npm install jspdf jspdf-autotable
# VEYA
npm install @react-pdf/renderer
```

Hangi kütüphane seçilirse NOT olarak al; ileride değiştirilebilir.

---

## BAKIŞ AÇISI 2 — VERİ AKIŞ MİMARİSİ

### 2.1 Muhasebe Veri Kaynakları

```
KAYNAK A: kar_zarar_ozet (Supabase — Rapor'dan gelir)
  Durum: 'onaylandi' olanlar muhasebe girişi kabul edilir
  Alan: toplam_gelir, hammadde_gider, iscilik_gider, fason_gider,
        sabit_gider, prim_gider, brut_kar, net_kar

KAYNAK B: prim_kayitlari (Supabase — Rapor'dan gelir)
  Durum: 'onaylandi' → ödeme bekliyor / 'odendi' → muhasebe kaydı
  Alan: personel_id, prim_tutari, odeme_tarihi

KAYNAK C: orders (SQLite)
  Durum: 'tamamlandi'
  Alan: müşteri bazlı gelir dağılımı

KAYNAK D: cost_entries + business_expenses (SQLite)
  Alan: model ve kategori bazlı gider detayı

KAYNAK E: isletme_giderleri (SQLite)
  Alan: kira, elektrik, su, personel toplamı (aylık)
```

### 2.2 Veri İşleme Zinciri

```
AŞAMA 1: Rapor & Analiz onayı kontrol
  kar_zarar_ozet.durum = 'onaylandi' mi?
  Değilse → Muhasebe modülü aktif değil
  Mesaj: "Lütfen önce Rapor sekmesinden onaylayın"

AŞAMA 2: Prim gideri hesabı
  SUM(prim_tutari) WHERE onay_durumu IN ('onaylandi','odendi')
  Bu tutar kar_zarar_ozet.prim_gider alanına yazılır

AŞAMA 3: Aylık kapanış yap
  kar_zarar_ozet.durum = 'kapandi'
  kapayan_id = current_user.id
  kapanma_tarihi = now()

AŞAMA 4: PDF raporunu üret
  Gelir Tablosu + Gider Dökümü + Personel Özeti

AŞAMA 5: Dönemsel karşılaştırma
  Bu ay, geçen ay, geçen yıl aynı ay → Yüzde değişim
```

### 2.3 Gelir Gider Detay Yapısı

```
GELİR KALEMLERI:
  + Sipariş gelirleri (müşteri bazlı dağılım)
    - Müşteri A: ₺X.XXX
    - Müşteri B: ₺Y.YYY
  + TOPLAM GELİR

GİDER KALEMLERİ:
  - Hammadde (kumaş, aksesuar, iplik)
    - Model bazlı döküm
  - İşçilik (personel brüt + SGK)
    - Personel bazlı döküm
  - Fason Gider (dış dikim işleri)
  - Sabit Gider (kira, elektrik, su, sigorta)
  - Değişken Gider (bakım, kargo, sarf)
  - Prim Gideri (onaylanan primer toplamı)
  + TOPLAM GİDER

HESAPLAMALAR:
  = BRÜT KÂR (Gelir - Hammadde - İşçilik - Fason)
  = NET KÂR (Brüt Kâr - Sabit - Değişken - Prim)
  = KÂR MARJI % (Net Kâr / Gelir × 100)
  = BAŞA BAŞ ADET (Toplam Gider / Ortalama Birim Maliyet)
```

---

## BAKIŞ AÇISI 3 — KULLANICI DENEYİMİ (UX/UI)

### 3.1 Sekme Yapısı

```
MuhasebeSekmesi
  ├── [Ay/Yıl Seçici] + [Kapanış Durumu Etiketi]
  │       taslak → onaylandi → kapandi
  ├── [Alt Sekme Bar]
  │     6.1 📊 Özet Dashboard
  │     6.2 📋 Gelir/Gider Detay
  │     6.3 👥 Personel Özeti
  │     6.4 📄 PDF Rapor
  │     6.5 📈 Dönemsel Karşılaştırma
  └── [İçerik Alanı]
```

### 3.2 Sekme 6.1 — Özet Dashboard

```
DURUM BANNER:
  [🔴 Taslak] / [🟡 Onaylandı — Muhasebe Başlayabilir] / [🟢 Kapandı]

ÜST KARTLAR (4 büyük):
  [Toplam Gelir ₺]  [Toplam Gider ₺]  [Net Kâr ₺]  [Kâr Marjı %]

ORTA BÖLÜM — GELİR/GİDER PASTA GRAFİĞİ:
  (CSS/SVG ile basit halka grafiği)

ALT AKSIYON BÖLÜMÜ:
  Eğer durum = 'onaylandi' → [AY KAPANIŞINI YAP] butonu
  Eğer durum = 'kapandi'  → [PDF İNDİR] butonu
```

### 3.3 Sekme 6.2 — Gelir/Gider Detay

```
İki panel yan yana:
  [GELİR]                    [GİDER]
  Sipariş gelirleri          Hammadde detay
  Müşteri dağılımı           İşçilik detay
  Model dağılımı             Fason detay
                              Sabit gider
                              Prim gideri
  ─────────────────────────────────────────
  Toplam: ₺X                 Toplam: ₺Y
                              NET KÂR: ₺(X-Y)
```

### 3.4 Sekme 6.3 — Personel Muhasebe Özeti

```
Tablo: Ad | Brüt Maaş | SGK İşv. | Toplam Maliyet | Prim | Toplamı
Son satır: TOPLAM | ₺X | ₺Y | ₺Z | ₺P | ₺Grand

Prim sütunu:
  - 'odendi' → ₺X (✅)
  - 'onaylandi' → ₺X (⏳ Ödeme bekleniyor)
  - Prim yok → - (—)
```

### 3.5 Sekme 6.4 — PDF Rapor

```
PDF İÇERİĞİ (A4, Türkçe):
  Sayfa 1: Kapak (fabrika adı, dönem, tarih)
  Sayfa 2: Yönetim Özeti (4 büyük kart, pasta grafik)
  Sayfa 3: Gelir Tablosu (detaylı)
  Sayfa 4: Gider Tablosu (detaylı)
  Sayfa 5: Personel Maliyet Tablosu
  Sayfa 6: Model Kârlılık Tablosu
  Sayfa 7: İmza sayfası (Hazırlayan, Onaylayan)

PDF Butonu: [📄 PDF Oluştur] → yükleniyor.. → [⬇️ İndir]
```

### 3.6 Sekme 6.5 — Dönemsel Karşılaştırma

```
3 Sütun → Her metrik için:
         Bu Ay    Geçen Ay   Geçen Yıl
Gelir    ₺X       ₺Y (↑%5)   ₺Z (↑%12)
Gider    ₺X       ₺Y (↓%3)   ₺Z (↑%8)
Net Kâr  ₺X       ₺Y         ₺Z
OEE%     %85      %82         %79
FPY%     %96      %95         %93
```

---

## BAKIŞ AÇISI 4 — İŞ MANTIĞI VE VİZYON UYUMU

### 4.1 Kapanış Kuralları

```
KURAL 1: Rapor onayı olmadan kapanış yapılamaz.
  IF kar_zarar_ozet.durum != 'onaylandi' → HATA dön

KURAL 2: Açık prim kalmışsa uyar.
  IF COUNT(prim_kayitlari WHERE durum='onaylandi') > 0:
    UYARI: "X personelin primi ödenmedi. Yine de kapat?"

KURAL 3: Kapanış geri alınamaz.
  durum = 'kapandi' sonrası değişiklik yasak.
  Yeni ay için yeni kayıt açılır.

KURAL 4: Kapanış yapıldığında audit log kaydı.
  kaydeden, zaman, durum_oncesi, durum_sonrasi
```

### 4.2 Kar Ortaklığı Prensibi

```
Muhasebe kapanış ekranında gösterilmeli:

"Bu ayın net kârından pay:
  Sürdürülebilir işletme fonu: ₺X
  Personel prim havuzu: ₺Y (%P)
  YZ ve AR-GE yatırımı: ₺Z"

Bu görünüm her çalışanın işletmenin kâr ortağı
olduğunu somutlaştırır.
```

### 4.3 Bot (Muhasip) Devreye Girme Anları

```
1. Kapanış öncesi: "Bu ay için 3 dikkat noktası"
2. Kâr marjı düşükse: "Neden düştü? Model mi, hammadde mi?"
3. Prim büyük çıktıysa: "Bu oran sürdürülebilir mi?"
4. Geçen yıla göre kötü: "Trend analizi ve öneriler"
```

---

## BAKIŞ AÇISI 5 — GÜVENLİK VE VERİ BÜTÜNLÜĞÜ

### 5.1 Yetki Seviyeleri

```
koordinator → Her şeyi yapabilir (kapanış dahil)
muhasip     → Görüntüler + PDF alır, kapanış yapamaz
ustabasi    → Sadece kendi bölüm özeti
personel    → Sadece kendi prim durumunu görür
```

### 5.2 Kapanış Güvenlik Akışı

```javascript
// /api/muhasebe/ay-kapanis route.js
export async function POST(request) {
  const body = await request.json();
  const { ay, yil, kapayan_id, rol } = body;

  // 1. Yetki kontrolü
  if (!['koordinator'].includes(rol)) {
    return Response.json({ error: 'Sadece koordinatör kapanış yapabilir' }, { status: 403 });
  }

  // 2. Onay kontrolü
  const ozet = await supabase.from('kar_zarar_ozet')
    .select('durum').eq('ay', ay).eq('yil', yil).single();
  if (ozet.data.durum !== 'onaylandi') {
    return Response.json({ error: 'Önce Rapor sekmesinden onaylayın' }, { status: 400 });
  }

  // 3. Açık prim kontrolü
  const { count } = await supabase.from('prim_kayitlari')
    .select('id', { count: 'exact' })
    .eq('ay', ay).eq('yil', yil).eq('onay_durumu', 'onaylandi');
  // count > 0 ise UYARI dön ama devam izni ver

  // 4. Kapanışı yap
  await supabase.from('kar_zarar_ozet')
    .update({ durum: 'kapandi', kapayan_id, kapanma_tarihi: new Date() })
    .eq('ay', ay).eq('yil', yil);

  return Response.json({ success: true });
}
```

### 5.3 Veri Silme Yasağı

```
Muhasebe kaydı asla silinmez.
Soft-delete bile uygulanmaz.
Hata varsa: Düzeltme kaydı + açıklama eklenir
```

---

## CLAUDE UYGULAMA SIRASI

### AŞAMA 1 — Veritabanı Güncelle (Supabase)

```sql
-- kar_zarar_ozet tablosuna kapanış alanları ekle
ALTER TABLE kar_zarar_ozet
  ADD COLUMN IF NOT EXISTS kapayan_id UUID,
  ADD COLUMN IF NOT EXISTS kapanma_tarihi TIMESTAMPTZ;
```

```javascript
// Kontrol et: prim_kayitlari, kar_zarar_ozet var mı?
// Yoksa RAPOR-ANALIZ iş planındaki SQL'leri önce çalıştır
```

### AŞAMA 2 — PDF Paketi

```bash
npm install jspdf jspdf-autotable
```

### AŞAMA 3 — API Rotaları

**Dosya 1: `app/api/muhasebe/ay-kapanis/route.js`**

- GET → { ay, yil } — kapanış durumu + tüm veriler
- POST → { ay, yil, kapayan_id } — kapanış yap

**Dosya 2: `app/api/muhasebe/gelir-gider/route.js`**

- GET → { ay, yil } — müşteri ve model bazlı detay

**Dosya 3: `app/api/muhasebe/donemsel-karsilastirma/route.js`**

- GET → { ay, yil } — bu ay + geçen ay + geçen yıl

**Dosya 4: `app/api/muhasebe/pdf-rapor/route.js`**

- POST → { ay, yil } — PDF binary döndür
- Content-Type: application/pdf

**Dosya 5: `app/api/muhasebe/ozet-dashboard/route.js`**

- GET → { ay, yil } — 4 büyük kart + durum banner

### AŞAMA 4 — UI (page.js)

```javascript
// Yeni case ekle:
case 'muhasebe':
  return <MuhasebeSekmesi />;

// Bileşenler:
function MuhasebeSekmesi() {
  const [muhSekme, setMuhSekme] = useState('ozet');
  const [ayYil, setAyYil] = useState({ ay: buAy, yil: buYil });

  return (
    <div>
      <AyYilSecici value={ayYil} onChange={setAyYil} />
      <KapanisDurumBanner ay={ayYil.ay} yil={ayYil.yil} />
      <SekmeBar
        tabs={['ozet','detay','personel','pdf','donemsel']}
        aktif={muhSekme}
        onChange={setMuhSekme}
      />
      {muhSekme === 'ozet' && <MuhOzetDashboard {...ayYil} />}
      {muhSekme === 'detay' && <GelirGiderDetay {...ayYil} />}
      {muhSekme === 'personel' && <PersonelMuhasebe {...ayYil} />}
      {muhSekme === 'pdf' && <PdfRaporSekme {...ayYil} />}
      {muhSekme === 'donemsel' && <DonemselKarsilastirma {...ayYil} />}
    </div>
  );
}
```

### AŞAMA 5 — PDF Üretimi

```javascript
// app/api/muhasebe/pdf-rapor/route.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function POST(request) {
  const { ay, yil } = await request.json();
  const doc = new jsPDF('p', 'mm', 'a4');

  // Türkçe font ekle (gerekirse)
  doc.setFont('helvetica');

  // Sayfa 1: Kapak
  doc.setFontSize(20);
  doc.text('47 Sil Baştan 01 — Aylık Muhasebe Raporu', 105, 50, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Dönem: ${ay}/${yil}`, 105, 70, { align: 'center' });

  // Sayfa 2: Özet tablo
  doc.addPage();
  doc.autoTable({
    head: [['Kalem', 'Tutar (₺)']],
    body: [
      ['Toplam Gelir', ozet.toplam_gelir],
      ['Toplam Gider', /* hesapla */],
      ['Net Kâr', ozet.net_kar],
      ['Kâr Marjı', `%${ozet.kar_marji_yuzde.toFixed(1)}`]
    ]
  });

  // ... diğer sayfalar

  const pdfBuffer = doc.output('arraybuffer');
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="muhasebe_${yil}_${ay}.pdf"`
    }
  });
}
```

### AŞAMA 6 — Test Kriterleri

```
TEST 1: Onaysız kapanış yapılamıyor mu?
  → kar_zarar_ozet.durum = 'taslak' → Kapanış buton pasif olmalı

TEST 2: Kapanış sonrası düzenleme yok mu?
  → durum = 'kapandi' → Tüm alanlar read-only

TEST 3: PDF doğru mu?
  → İndirilen PDF açılıyor mu? Veriler doğru mudur?

TEST 4: Dönemsel karşılaştırma doğru mu?
  → Geçen ay kaydı Supabase'de varsa doğru veriyor mu?

TEST 5: Personel prim durumu doğru mu?
  → 'odendi' olanlar PDF'de gösteriliyor mu?

TEST 6: Yetki kontrolü
  → muhasip token ile kapanış yapmaya çalış → 403 dönsün
```

---

## HIZLI BAŞLANGIÇ KOMUTU (Claude için)

```
GÖREV: Pencere 6 — Muhasebe uygula

ÖN KOŞUL: Pencere 5 (Rapor & Analiz) tamamlanmış olmalı.
           kar_zarar_ozet ve prim_kayitlari Supabase'de var.

1. npm install jspdf jspdf-autotable

2. Supabase SQL:
   ALTER TABLE kar_zarar_ozet ADD COLUMN IF NOT EXISTS
   kapayan_id UUID, kapanma_tarihi TIMESTAMPTZ;

3. 5 API endpoint oluştur: muhasebe/ altında

4. page.js'e 'muhasebe' case + MuhasebeSekmesi bileşeni

5. PDF üretimi: jsPDF ile 7 sayfalık Türkçe rapor

6. 6 test maddesini çalıştır, hiçbirinde hata kalmamalı.

Referans dosyalar:
  - Bu belge (tüm spesifikasyon)
  - RAPOR-ANALIZ.md (veri kaynakları)
  - SUPABASE-SEMA.md (tablo yapıları)
```
