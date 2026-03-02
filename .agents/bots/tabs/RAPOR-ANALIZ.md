# 📒 RAPOR & ANALİZ SEKMESİ — BOT BEYNİ

> **Sekme ID:** `muhasebe`
> **Bot:** 📊 Muhasip (GPT-4o-mini)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Rapor & Analiz botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

İşletmenin finansal sağlığını raporlamak.
Aylık, yıllık, model bazlı — tüm verileri bir araya getirip yönetime sunarız.
"Bu ay ne kazandık, ne harcadık, nerede zarar ettik?" buradan öğreniriz.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının FİNANSAL ANALİSTİSİN. Adın MUHASİP.

UZMANLIĞIN:
- Aylık gelir-gider analizi
- Personel maaş-üretim verimliliği oranı
- Model bazlı karlılık sıralaması
- Dönemsel trend analizi (iyiye mi gidiyor?)
- Sipariş karlılığı özeti
- Yönetim kurulu için özet rapor

TARZIN: Profesyonel. Grafik gibi düşün — trend var mı?
DİL: Türkçe. Executive summary tarzı. Max 6-7 cümle.

KURAL: Rakamları bağlamla anlat. Sadece sayı değil, ne anlama geliyor.
```

---

## 📊 VERİTABANI — KULLANILAN TABLOLAR

Rapor sekmesi birden fazla tablodan veri çeker:

| Tablo | Ne İçin |
|-------|---------|
| `business_expenses` | Aylık gider toplamı |
| `personnel` | Maaş toplamı, personel sayısı |
| `production_logs` | Toplam üretim değeri (unit_value), hata oranı |
| `orders` | Aktif/tamamlanan sipariş, toplam gelir tahmini |
| `cost_entries` | Model bazlı maliyet |
| `models` | Fason fiyat × sipariş adedi = gelir tahmini |
| `monthly_work_days` | Aylık çalışma günü |

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/expenses` | GET | İşletme giderleri |
| `/api/isletme-gider` | GET | İşletme gider (yeni) |
| `/api/personel-haftalik` | GET | Haftalık personel raporu |
| `/api/uretim-ozet` | GET | Günlük üretim özeti |
| `/api/production` | GET | Ham üretim verisi |
| `/api/costs` | GET | Maliyet kalemleri |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] İşletme giderleri listesi (ay/yıl filtreli)
- [x] Sabit gider kaydı
- [x] Aylık toplam gider özeti
- [x] Personel haftalık raporu

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Aylık gelir-gider grafiği (bar chart)
- [ ] TODO: Personel verimliliği karşılaştırma grafiği
- [ ] TODO: Model karlılık sıralaması tablosu
- [ ] TODO: Yönetim kurulu için PDF rapor çıktısı
- [ ] TODO: Dönemsel trend analizi (ay/ay karşılaştırma)
- [ ] TODO: Maaş-üretim oranı dashboard kartı
- [ ] TODO: Hedef vs gerçekleşen grafiği

---

## 💬 HIZLI KOMUTLAR (Bot için)

| Soru | Botu Ne Yapacak |
|------|-----------------|
| "Bu ay ne kadar harcadık?" | business_expenses + personel maaşı topla |
| "Karlılık oranımız?" | (gelir - gider) / gelir × 100 |
| "En verimli ay hangisiydi?" | Aylık üretim değeri + gider karşılaştır |
| "Personel maliyeti giderin kaçı?" | Maaş/toplam gider × 100 |
| "Yönetim özeti ver" | Tüm verileri 5 cümlede özetle |

---

## 🔗 CROSS-TAB ENTEGRASYON

| Kaynak | Nasıl Kullanılır |
|--------|------------------|
| **Üretim** | `production_logs` — OEE, FPY, gunluk çıktı grafikleri |
| **Personel** | `personnel` — kişi başına verimlilik bar chart |
| **Modeller** | `models` + `operations` — model bazında performans |
| **Kalite** | `quality_checks` — hata oranı ve FPY trendi |
| **Maliyet** | `cost_entries` — maliyet trendi grafikleri |

---

## 🏗️ COMPONENT MİMARİSİ (page.js)

```
RaporAnalizSekmesi
  ├── OeeGrafigi          → /api/rapor/oee
  ├── PersonelVerimPanel  → /api/rapor/personel
  ├── ModelPerformans     → /api/rapor/model-ops
  ├── HataRaporuGrafigi   → /api/rapor/defects
  └── ExcelExport         → /api/rapor/export
```

> **Not:** Rapor sekmesinın bütün verileri read-only'dir. Veri yazma yapmaz.

---

## 🤖 CODING AGENT TALİMATLARI

### Yeni Rapor/Grafik Eklemek

1. **API:** `/api/rapor/` altına yeni route oluştur
2. **Query:** `production_logs` JOIN `models` JOIN `personnel` ile istenen metrik
3. **UI:** `page.js` RaporAnalizSekmesi'ne yeni panel ekle
4. **Grafık:** Sistem Chart.js veya native SVG kullanıyor — mevcut grafiklere bak

### Excel Export Eklemek

1. API: `/api/rapor/export?type=personel&from=&to=` formatında
2. Response: `Content-Disposition: attachment; filename=rapor.xlsx`
3. UI: "Excel İndir" butonu ekle

---

## 🔄 VERİ AKIŞI

```
Kullanıcı tarih/filtre seçer
  → GET /api/rapor/... (parametreli sorgu)
  → DB: production_logs GROUP BY tablo/tarih
  → Response: { labels[], data[] }
  → UI: grafik render edilir
```

---

## ⚠️ ÖNEMLİ KISITLAMALAR

- Tüm raporlar read-only — veri değiştirmez
- Grafik verileri API'den hesaplanır, UI'da math yok
- Soft-delete kayıtları (`deleted_at IS NOT NULL`) raporlara dahil edilmez
- Excel export şu an planlama aşamasında

---

## 📝 BOT GÜNCELLEME KURALI

**Bu dosyayı şu durumlarda güncelle:**

- Yeni rapor türü eklendiyse → Özellikler listesi güncelle
- Yeni API eklendiyse → Endpoint tablosu güncelle
- Yeni TODO belirlediyse → `[ ]` ekle
