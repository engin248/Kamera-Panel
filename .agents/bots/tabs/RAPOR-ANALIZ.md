# 📊 PENCERE 5 — RAPOR & ANALİZ & MUHASEBE

> **Sekme ID:** `rapor-analiz`
> **Bot:** 🧮 Muhasip (GPT-4o-mini)
> **Son Güncelleme:** 2026-03-03
> **Bu dosya:** 5. Pencere botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENIN AMACI

4 pencereden (Modeller, Personel, Üretim, Maliyet) gelen verileri
birleştirerek üretim bölümünün tam resmi görülür:

- Kim ne kadar üretiyor, ne kadar katkı sağlıyor?
- Hangi model karlı, hangi model zarar ediyor?
- Ay sonunda ne prim ödenecek?
- İşletme bu ay kâr mı zarar mı?

**Vizyon:** Bu pencere prim onayının, karar karşılaştırmasının
ve bölüm muhasebesinin yapıldığı merkez noktadır.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının MUHASIP ve ANALİST botusun. Adın MUHASİP.

UZMANLIĞIN:
- 4 sekmenin verilerini birleştir ve analiz et
- Kâr/zarar hesabı (aylık, model bazlı, personel bazlı)
- Prim hesabı ve doğrulaması
- OEE, FPY, Katkı Değeri hesaplamaları
- "Ne öneririm?" — karar desteği ver
- Sistem önerisi vs gerçekleşen karar karşılaştırması

TARZIN: Net, sayısal, tarafsız. "Görsüz veri olmaz" prensibi.
DİL: Türkçe. Raporlama formatı kullan.

KURAL 1: Tüm hesaplar açıklanır — rakam var, formül var.
KURAL 2: Prim önerirken işletme sürdürülebilirliğini kontrol et.
KURAL 3: Sistem önerecek, insan onaylayacak.
```

---

## 📥 GİRDİLER — 4 PENCEREDEN GELEN VERİ

| Kaynak | Veri | Kullanım |
|--------|------|----------|
| **Modeller (P1)** | operations.unit_price, models.fason_price | Birim değer, standart süre |
| **Personel (P2)** | personnel.salary, personnel.sgk | İşçilik maliyeti |
| **Üretim (P3)** | production_logs.total_produced, defective_count, unit_value | Ham veri — Katkı Değeri |
| **Maliyet (P4)** | cost_entries, isletme_giderleri, business_expenses | Sabit + değişken gider |

---

## 📐 HESAPLAMA METRİKLERİ

### A. Katkı Değeri (Kişi + Dönem Bazlı)

```
Katkı Değeri =
  SUM(total_produced × unit_value × (1 - defective_count/total_produced))

Yani: Üretilen temiz ürünlerin toplam değeri
```

### B. Gerçek İşçilik Maliyeti (Kişi Bazlı)

```
Maaş Maliyeti =
  baz_maas + yol_ucreti + yemek_ucreti + sgk_isverenPayi

SGK İşveren = Brüt × 0.225
```

### C. Prim Hesabı (Kişi Bazlı)

```
Katki > Maas ise:
  Ham Prim = (Katki - Maas) × Prim_Orani%

İşletme net kâr > 0 kontrolü yapılır
Onay beklenir → Ödendi işareti → Personel self-serve görür
```

### D. Bölüm Kâr/Zarar

```
Brüt Kâr = Toplam Gelir - Hammadde - İşçilik - Sabit Gider - Fason

Net Kâr = Brüt Kâr - Vergiler

Kâr Marjı % = Net Kâr / Gelir × 100
```

### E. Model Bazlı Kârlılık

```
Model Kârı = Sipariş Geliri - (Birim Maliyet × Adet)
Birim Maliyet = Hammadde + İşçilik + Genel Gider Payı + Fason
```

---

## 📊 ALT SEKMELER — 6 BÖLÜM

### Sekme 5.1: 📈 AY SONU ÖZET DASHBOARD

**Otomatik hesaplanır, her kutucuk tıklanabilir (detay açılır):**

- Toplam Üretim Adedi / Hedef → %Gerçekleşme
- Hata Adedi + FPY Ortalaması
- OEE Ortalaması
- Toplam Katkı Değeri (₺)
- Toplam İşçilik Maliyeti (₺)
- Net Kâr / Zarar (₺) + 🟢/🟡/🔴 sinyal
- Kâr Marjı %
- En Verimli 3 Personel → 🏆
- En Sorunlu Model → ⚠️
- Prim Havuzu (₺) — yönetici onayı bekleniyor

### Sekme 5.2: 👥 PERSONEL VERİMLİLİK RAPORU

Her personel için bir satır:

| Ad | Adet | Hata% | FPY | Katkı(₺) | Maaş(₺) | Fark | Prim? |
|----|------|-------|-----|----------|---------|------|-------|
| İsim | 450 | 2% | 98 | 2.250 | 1.800 | +450 | ✅ |

- Renk kodlu: 🟢 +250 ve üzeri / 🟡 0-250 / 🔴 negatif
- Ay seçici
- Self-serve: Personel sadece kendi satırını görür

### Sekme 5.3: 👗 MODEL KÂRLILIK TABLOSU

| Model | Sipariş Adedi | Birim Maliyet | Satış Fiyatı | Kâr Marjı% |
|-------|--------------|--------------|-------------|------------|
| M-001 | 500 | ₺45 | ₺65 | %30.7 |

- Kâr marjı < %10 ise 🔴 (zarar riski)
- En karlı modeller sıralanır

### Sekme 5.4: 💰 PRİM ONAY EKRANI

Yönetici için:

- Her personel için: Katkı Değeri, Maaş Maliyeti, Önerilen Prim
- Toplu onayla veya tek tek onayla
- Onaylama → prim_kayitlari tablosuna `onaylandi` kaydı
- Ödendi → `odendi` + tarih kaydı
- Personel self-serve portalında gösterilir

### Sekme 5.5: 📋 BÖLÜM MUHASEBESİ

Ay kapanış ekranı:

- Gelirler tablosu (sipariş bazlı)
- Giderler tablosu (hammadde, işçilik, sabit, fason)
- Prim gideri (onaylandıysa)
- Net kâr teyit
- "Kapat" → kar_zarar_ozet tablosuna `onaylandi` kaydı
- PDF çıktı butonu

### Sekme 5.6: 🔍 KARAR KARŞILAŞTIRMA ARŞIVI

- Sistem bu ay ne önerdi?
- Yönetici ne yaptı?
- Sonuç ne oldu?
- Fark analizi notu
- Bir sonraki ay için öğrenme kaydı

---

## 🧩 VERİ AKIŞ DİYAGRAMI

```
P1 (Modeller)          P2 (Personel)
unit_price             salary, sgk
     ↓                       ↓
P3 (Üretim) ←──────────────→
total_produced + unit_value + hata
     ↓
P4 (Maliyet)
hammadde + sabit + fason giderleri
     ↓
PENCERE 5 (Rapor & Muhasebe)
  ├── Katkı Değeri hesabı
  ├── Prim motor
  ├── Kâr/Zarar dashboard
  ├── Model kârlılık
  └── Karar karşılaştırma
```

---

## 🌐 API ENDPOINT'LERİ (YAZILACAK)

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/rapor/ay-ozet` | GET | Ay özet dashboard verisi |
| `/api/rapor/personel-verimlilik` | GET | Personel Katkı/Maaş/Prim |
| `/api/rapor/model-karlilik` | GET | Model bazlı kâr marjı |
| `/api/rapor/prim-onay` | GET/POST | Prim listesi + onay işlemi |
| `/api/rapor/muhasebe` | GET/POST | Ay kapanış + PDF çıktı |
| `/api/rapor/karar-arsiv` | GET/POST | Karar karşılaştırma kayıtları |

---

## 📋 YAPILACAK İŞLER

FAZA 1 — Altyapı:

- [ ] Supabase: prim_kayitlari tablosu
- [ ] Supabase: kar_zarar_ozet tablosu
- [ ] Supabase: karar_arsivi tablosu (YENİ — vizyon için)
- [ ] /api/rapor/ay-ozet endpoint
- [ ] /api/rapor/personel-verimlilik endpoint

FAZA 2 — UI:

- [ ] Sekme 5.1: Dashboard
- [ ] Sekme 5.2: Personel Verimlilik (self-serve dahil)
- [ ] Sekme 5.3: Model Kârlılık
- [ ] Sekme 5.4: Prim Onay Ekranı
- [ ] Sekme 5.5: Bölüm Muhasebesi

FAZA 3 — Karar Sistemi:

- [ ] Sekme 5.6: Karar Karşılaştırma
- [ ] PDF rapor çıktısı
- [ ] Telegram bildirimi (onay bekliyor)

---

## 🔗 CROSS-TAB ENTEGRASYON

| Sekme | Bağlantı | Nasıl |
|-------|----------|-------|
| Modeller (P1) | unit_price, operations | Birim değer buradan |
| Personel (P2) | salary, sgk | Maliyet buradan |
| Üretim (P3) | production_logs | Ham veri buradan |
| Maliyet (P4) | cost_entries, expenses | Gider toplamı buradan |
