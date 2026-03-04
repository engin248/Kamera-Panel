# 👗 MODELLER SEKMESİ — BOT BEYNİ

> **Sekme ID:** `models`
> **Bot:** 🛠️ Tekniker (DeepSeek Chat)
> **Son Güncelleme:** 2026-03-03
> **Bu dosya:** Modeller botu için tek bilgi kaynağı

---

## ⚠️ ANTİGRAVİTY ANALİZ NOTU (2026-03-03)

| # | Eksik | Önem | Düzeltime |
|---|-------|------|----------|
| 1 | Operasyon standart süresi yok — prim hesabının temeli eksik | Kritik | TODO eklendi |
| 2 | Kumaş/hammadde bağlantısı yok — Kartela platformuyla kopuk | Yüksek | TODO eklendi |
| 3 | 5. pencere (Rapor) İçin veri çıkışı tanımlı değil | Orta | Cross-tab güncellendi |
| 4 | Supabase geçiş hazırlığı yok | Yüksek | Supabase notu eklendi |
| 5 | Model timeline (prototip→numune→seri) hala TODO | Orta | Mevcut |

---

## 🎯 BU SEKMENİN AMACI

Her konfeksiyon modelinin teknik kartını tutmak.
Beden, renk, operasyon, parça listesi, dikim detayları — hepsi burada.
Bu bilgiler çalışanlara iş verirken temel alınır.

**Vizyon Prensibi:** Operasyonun standart süresi ve birim değeri burada tanımlanır.
Prim hesabı bu değerlerle gerçekleşir. Doğru tanım → Adil ücret.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının TEKNİK uzmanısın. Adın TEKNİKER.

UZMANLIĞIN:
- Model teknik kartları (BOM, operasyonlar, parçalar)
- Dikim operasyonları sırası ve makine seçimi
- Beden dağılımı ve renk/asorti hesabı
- Kalite kriterleri ve zor noktalar
- Müşteri talepleri ve teslim tarihi
- Fason fiyat ve zorluk puanı
- Prim hesabı ve adil ücretlendirme

TARZIN: Teknik, adım adım. Üretim verimliliğine odaklan.
DİL: Türkçe. Teknik ama anlaşılır. Max 5-6 cümle.

KURAL: Model verisini detaylı analiz et. Eksik varsa söyle. Prim hesabı için operasyon sürelerini ve birim değerlerini kullan.
```

---

## 📊 VERİTABANI — KULLANILAN TABLOLAR

### Ana Tablo: `models`

| Alan Grubu | Önemli Alanlar |
|------------|----------------|
| **Temel Bilgi** | name, code, order_no, customer, modelist |
| **Üretim** | total_order, fason_price, model_difficulty (1-10), status |
| **Görsel** | front_image, back_image |
| **Ölçü** | sizes, size_range, size_count, size_distribution |
| **Renk** | color_count, color_details, asorti |
| **Operasyonlar** | total_operations, op_kesim_*, op_dikim_*, op_utu_paket_*, op_nakis_*, op_yikama_* |
| **Parça** | piece_count, piece_count_details |
| **Tela/Astar** | has_lining, lining_pieces, has_interlining, interlining_parts |
| **Notlar** | difficult_points, critical_points, customer_requests |
| **Tarihler** | delivery_date, work_start_date |

### İlişkili Tablolar

- `operations` → Modelin detaylı operasyon listesi
- `production_logs` → Bu modelde ne kadar üretildi
- `cost_entries` → Model maliyet kalemleri
- `orders` → Bu modele gelen siparişler

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/models` | GET | Tüm modelleri listele |
| `/api/models` | POST | Yeni model oluştur |
| `/api/models/[id]` | GET | Tek model detayı |
| `/api/models/[id]` | PUT | Model güncelle |
| `/api/models/[id]` | DELETE | Soft-delete |
| `/api/model-operasyonlar` | GET | Model + operasyon listesi |
| `/api/model-vision` | POST | Fotoğraf AI analizi |
| `/api/upload` | POST | Fotoğraf/video yükleme |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Model listesi (kart görünümü + detay açılır)
- [x] Yeni model formu (tek sayfa scroll — 6 tab birleştirildi)
- [x] Ön + arka fotoğraf yükleme
- [x] Operasyon kategorileri (Kesim, Dikim, Ütü/Paket, Nakış, Yıkama)
- [x] Dikim alt tipleri (Düz Makina, Overlok, Reçme + özel satır ekleme)
- [x] Beden sayısı metin formatında girilir (boşlukla ayrılmış)
- [x] Beden dağılımı (size_distribution)
- [x] Renk sayısı + asorti bilgisi
- [x] Parça listesi (piece_count + piece_count_details)
- [x] Tela / astar bilgisi (checkbox + adet)
- [x] Zorluk puanı (1-10 slider)
- [x] Müşteri talepleri + kritik notlar
- [x] Fason fiyat (sayı + metin açıklama)
- [x] Model AI fotoğraf analizi (Gemini Vision)
- [x] Soft-delete
- [x] Operasyon: makine tipi, iş süresi (min/max), birim fiyat
- [x] Operasyon: gerekli beceri seviyesi + kategori

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Operasyon eğitim videosu tam entegrasyonu
- [ ] **TODO (KRİTİK): Operasyon standart süre alanı** — her operasyon için süre (dk/adet) girilmeli, prim hesabı buradan gelir
- [ ] **TODO (KRİTİK): Birim değer alanı** — operasyon başına TL değeri — `operations` tablosunda olmalı
- [ ] TODO: Prim hesabı entegrasyonu (operasyon süreleri ve birim değerleri ile)
- [ ] TODO: Tedarikçi/kumaş bağlantısı (fabric_supplier alanı — Kartela Platformuyla entegre)
- [ ] TODO: Model şablondan kopyalama özelliği
- [ ] TODO: Beden tablosu (ölçü grafiği)
- [ ] TODO: Model timeline (prototip → numune → seri üretim)
- [ ] TODO: 5. Pencere (Rapor) için veri hazırlığı ve görselleştirme
- [ ] TODO: Supabase geçiş — `models` ve `operations` tabloları Supabase'e taşınacak

---

## 💬 HIZLI KOMUTLAR (Bot için)

| Soru | Botu Ne Yapacak |
|------|-----------------|
| "Kaç aktif modelimiz var?" | Model sayısını söyle |
| "En zor model hangisi?" | model_difficulty'ye göre sırala |
| "Bu modelde kaç operasyon var?" | total_operations'ı getir |
| "BOM eksik mi?" | piece_count ve op_* alanlarını kontrol et |
| "Teslimat tarihi geçmiş model var mı?" | delivery_date < bugün olanları bul |

---

## 🔗 CROSS-TAB ENTEGRASYON

| İlişki | Tablo | Nasıl Bağlı |
|--------|-------|-------------|
| **Üretim** | `production_logs` | `model_id` ile hangi model üretildiği |
| **Siparişler** | `orders` | `model_id` FK — sipariş→model eşlemesi |
| **Maliyet** | `cost_entries` | `model_id` FK — model bazlı maliyet |
| **Sevkiyat** | `shipments` | `model_id` FK — hangi modeli sevk ettik |
| **Müşteriler** | `customers` | `customer_id` FK — kim sipariş verdi |
| **5. Pencere (Rapor)** | `production_logs + cost_entries` | Model başına verimlilik + kar analizi |

---

## 🏗️ COMPONENT MİMARİSİ (page.js)

```
NewModelModal          → Yeni model oluşturma (~satır 826)
  ├── Fotoğraf yükleme (handleImageUpload)
  ├── Dikim operasyonu satırları (op_rows state)
  └── handleSubmit → POST /api/models

EditModelModal         → Model düzenleme (~satır 6982)
  ├── editFrontPreview / editBackPreview state
  ├── handleEditImageUpload (fotoğraf güncelleme)
  ├── op_dikim_details (JSON — sıralı operasyon listesi)
  ├── post_sewing (JSON — dikimden sonra 6 panel)
  └── handleUpdateModel → PUT /api/models/:id

openEditModal()        → editForm state'i models verisiyle doldurur
```

> **ÖNEMLİ:** Model Düzenle'deki `color_details` alanı `|` ile ayrılmış varyant saklar (`Varyant1|Varyant2`)

---

## 🤖 CODING AGENT TALİMATLARI

### Yeni Model Alanı Eklemek

1. **DB:** `db.js` alterStatements dizisine `ALTER TABLE models ADD COLUMN yeni_alan TEXT` ekle
2. **API GET:** `/api/models/route.js` SELECT sorgusuna ekle
3. **API PUT:** `/api/models/[id]/route.js` UPDATE sorgusuna ekle
4. **EditModal UI:** `page.js` ~satır 6982 editModel bloğuna form input ekle
5. **NewModal UI:** `page.js` ~satır 826 NewModelModal'a da ekle
6. **openEditModal():** `setEditForm({...model, yeni_alan: model.yeni_alan || ''})` satırına ekle

### Dikimden Sonra Yeni Panel Eklemek

EditModal'daki 6 panel dizisine yeni `{ key, label, placeholder }` objesi ekle.  
Veri `post_sewing` JSON alanına saklanır — DB değişikliği gereksiz.

---

## 🔄 VERİ AKIŞI

```
EditModal form
  → PUT /api/models/:id
  → audit_trail tablosuna her değişen alan kaydedilir
  → loadModels() → UI güncellenir
  → Değişiklik Geçmişi modal'ında görünür
```

---

## ⚠️ ÖNEMLİ KISITLAMALAR

- `models` soft-delete: `deleted_at / deleted_by` sütunları var
- Her PUT isteği `audit_trail`'e otomatik loglanır (API route içinde)
- `op_dikim_details` ve `post_sewing` JSON string olarak saklanır — parse edilmeli
- `color_details` varyant: `"Kırmızı|Mavi"` formatı

---

## 📝 BOT GÜNCELLEME KURALI

**Bu dosyayı şu durumlarda güncelle:**

- Yeni model alanı (sütun) DB'ye eklendiyse → Tablo güncelle
- Modeller botu prompt değiştiyse → System prompt güncelle
- Yeni özellik eklendiyse → `[x]` yap
- Yeni TODO belirlediyse → `[ ]` ekle
