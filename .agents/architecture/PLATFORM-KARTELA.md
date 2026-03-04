# PLATFORM-KARTELA.md — DİJİTAL KARTELA VE MALZEME KATALOĞU

> Versiyon: 1.0 | Tarih: 2026-03-03
> Durum: PLANLAMA ASAMASI
> Baglanti: SISTEM-GENEL.md | BOLUM-URETIM-FASON.md

---

## SORUNUN TANIMI

- Kumaş kartelaları klasörde duruyor, dışarıda görünmüyor
- İşletme ziyaretinde gördüğün ürünü sonradan bulamıyorsun
- Hangi kumaşçıda ne var bilinmiyor
- Tedarikçi ilişki geçmişi kayıt altında değil

---

## ÇÖZÜM — 3 MODÜL

```
KARTELA PLATFORMU
  +--- [1] DİJİTAL ARŞİV
  |         Kumaş, aksesuar, ürün kataloğu
  |         Fotoğraf + özellik + stok + tedarikçi
  |
  +--- [2] AI ARAMA VE EŞLEŞTİRME
  |         Görsel eşleştirme (fototan kumaş tespiti)
  |         İnternet araştırması (Instagram, web)
  |
  +--- [3] TEDARİKÇİ VE ORTAK TAKİBİ
              Alımlar, ödemeler, geçmiş
```

---

## MOD 1: DİJİTAL ARŞİV — Her Kumaş Girişi

ZORUNLU:

- Kumaş Adı / Kodu
- Tedarikçi (kumaşçı firma)
- Kumaş Tipi (dokuma/örme/özel/diğer)
- Alt tip: pamuk/polyester/viskon/süprem/ribana/penye/kadife...
- Renk (isim + HEX)
- Desen: Düz / Çizgili / Ekose / Baskılı / Jakarlı
- Gramaj (gr/m2)
- En (cm)
- Stok (metre)
- Fiyat (TL/m)
- Fotoğraf (min 1, ideal 3: zemin/doku/drapaj)

OPSİYONEL:

- Bileşim (%80 pamuk %20 poly)
- Yıkama talimatı
- Kullanım önerileri (gömlek/pantolon/elbise)
- Minimum sipariş miktarı

---

## MOD 2: AI ARAMA VE İNTERNET ARAŞTIRMASI

Metin Arama Örnekleri:

- "Kırmızı pamuklu düz kumaş var mı?"
- "Bu fotoğraftaki kumaşa benzer ne var?"

Görsel Eşleştirme:

- Telefon kamerasından fotoğraf çek
- AI kumaş tipini tespit eder, arşivde arar
- Bulamazsa internette arar

İnternet Araştırması:

- Instagram, Facebook, TikTok (kamuya açık içerik)
- Online satış platformları
- Büyük marka web siteleri

KURAL: Kişisel veriler kayıt altına alınmaz.
Sadece ürün bilgileri, fiyatlar ve firma bilgisi kaydedilir.

---

## MOD 3: TEDARİKÇİ TAKİBİ

Tedarikçi Profili:

- Firma adı, tür (kumaşçı/aksesuarcı/fason/müşteri)
- İletişim bilgileri
- Güven skoru (geçmişe göre otomatik)

İşlem Geçmişi:

- Tarih, işlem türü (alım/satış/hizmet)
- Tutar ve ödeme durumu (ödendi/bekliyor/gecikti)
- Belge (fatura foto)

Özet rapor:

- Toplam ödeme, toplam alım, güncel bakiye

---

## VERİTABANI TABLOLARI

### fabric_catalog

- id, supplier_id, fabric_name, fabric_type
- color_name, color_hex, pattern, composition
- weight_gsm, width_cm, stock_meters, price_per_meter
- photos (JSONB), notes, created_at, updated_at

### suppliers

- id, name, type, phone, email, address
- trust_score, status, notes, created_at

### supplier_transactions

- id, supplier_id, transaction_type, amount
- status, date, document_url, notes

---

## YAPILACAK İŞLER (Faza Planı)

FAZA 1 — Temel Arşiv:

- [ ] Supabase tabloları: fabric_catalog, suppliers
- [ ] Kumaş ekleme/düzenleme formu
- [ ] Fotoğraf yükleme ve galeri
- [ ] Temel arama (renk, tip, tedarikçi)

FAZA 2 — AI:

- [ ] Görsel eşleştirme (Gemini Vision)
- [ ] AI metin arama
- [ ] İnternet araştırma modülü

FAZA 3 — Entegrasyon:

- [ ] BOM → kumaş kataloğu bağlantısı
- [ ] Maliyet sekmesi → kumaş fiyatları
