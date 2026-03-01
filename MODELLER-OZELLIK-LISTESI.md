════════════════════════════════════════════════════════════════
⚔️ MK:4721 — MODELLER BÖLÜMÜ
TAM ÖZELLİK VE KRİTER LİSTESİ
Hazırlayan: GPT + Perplexity + Komutan Engin Bey + Üsteğmen
════════════════════════════════════════════════════════════════

## MODELLER BÖLÜMÜ — OLMASI GEREKEN HER ŞEY

────────────────────────────────────────

### A. MODEL TEMEL BİLGİLERİ (Model Kartı)

────────────────────────────────────────

[ ] A1. Model Adı (zorunlu)
[ ] A2. Model Kodu / SKU (otomatik veya manuel)
[ ] A3. Kategori (Gömlek / Pantolon / Elbise / Ceket / Diğer)
[ ] A4. Müşteri / Marka adı
[ ] A5. Sezon (İlkbahar-Yaz / Sonbahar-Kış / 4 Mevsim)
[ ] A6. Koleksiyon yılı
[ ] A7. Model durumu (Aktif / Pasif / Arşiv)
[ ] A8. İlk giriş tarihi (otomatik)
[ ] A9. Son düzenleme tarihi (otomatik)

────────────────────────────────────────

### B. KUMAŞ / MALZEME BİLGİLERİ

────────────────────────────────────────

[ ] B1. Kumaş cinsi (Poplin / Gabardin / Brode / Triko / Diğer)
[ ] B2. Kumaş gramajı (gr/m²)
[ ] B3. Kumaş içeriği (% Pamuk / % Polyester / karışım)
[ ] B4. Renk seçenekleri (birden fazla girilebilmeli)
[ ] B5. Astar var mı? (Evet/Hayır + cinsi)
[ ] B6. Aksesuar listesi (düğme adedi, fermuar tipi, bant...)

────────────────────────────────────────

### C. BEDEN BİLGİLERİ

────────────────────────────────────────

[ ] C1. Beden aralığı — TEXT formatı (S/M/L/XL veya 36/38/40...)
[ ] C2. Beden dağılımı / asorti (S:50 M:80 L:70 XL:20)
[ ] C3. Standart ölçü tablosu (göğüs, bel, kalça, kol boyu...)
[ ] C4. Ölçü toleransı (±1cm gibi)

────────────────────────────────────────

### D. PARÇA LİSTESİ

────────────────────────────────────────

[ ] D1. Kaç parçadan oluşuyor (sayı)
[ ] D2. Her parçanın adı (Ön beden, Arka beden, Sol kol, Sağ kol, Yaka...)
[ ] D3. Her parçanın fotoğrafı (opsiyonel)
[ ] D4. Parça kesim yönü (düz/çapraz)

────────────────────────────────────────

### E. TEKNİK ÇİZİM / FÖYLER

────────────────────────────────────────

[ ] E1. Teknik çizim fotoğrafı yükleme (birden fazla)
[ ] E2. GPT-4o Vision ile otomatik analiz
[ ] E3. Ön görünüş fotoğrafı
[ ] E4. Arka görünüş fotoğrafı
[ ] E5. Detay fotoğrafları (yaka, kol, cep detayı...)
[ ] E6. Referans numune fotoğrafı
[ ] E7. Fotoğraf üzerine not yazabilme

────────────────────────────────────────

### F. DİKİM OPERASYON SIRASI

────────────────────────────────────────

[ ] F1. Her işlemin adı
[ ] F2. İşlemin makine tipi (Düz / Overlok / Reçme / Biye / Düğme / Elle / Diğer)
[ ] F3. İşlem süresi — standar süre (dakika/saniye)
[ ] F4. Hangi beceri seviyesi gerekli (Usta / Orta / Çırak)
[ ] F5. İşlem sırası — sürükle-bırak ile sıralama
[ ] F6. Kritik işlem işareti (⭐ Dikkat gerektiren)
[ ] F7. Kalite kontrol notu (her işlem için)
[ ] F8. Sesli işlem ekleme (SpeechRecognition)
[ ] F9. GPT ile sesli transcription → işlem listesi dönüştürme
[ ] F10. Her işleme birim fiyat ekleme (akord ücreti)

────────────────────────────────────────

### G. OTOMATİK HESAPLAMALAR

────────────────────────────────────────

[ ] G1. Toplam işlem süresi (tüm operasyonlar toplamı)
[ ] G2. Tahmini birim maliyet (süre × saatlik maliyet)
[ ] G3. Tahmini fason fiyat (maliyet + kâr marjı)
[ ] G4. Kâr/zarar sinyali (🟢 Kârlı / 🔴 Zararlı)
[ ] G5. Usta/Çırak dağılımı önerisi (beceriye göre)

────────────────────────────────────────

### H. MODEL GEÇMİŞİ / AUDİT

────────────────────────────────────────

[ ] H1. Bu model kaç kez üretildi
[ ] H2. Geçmiş üretim tarihleri
[ ] H3. Geçmiş hata oranları
[ ] H4. En hızlı / en yavaş üretim süresi
[ ] H5. Değişiklik geçmişi (kim, ne zaman değiştirdi)

────────────────────────────────────────

### I. MODELLER LİSTESİ SAYFASI

────────────────────────────────────────

[ ] I1. Kart veya tablo görünümü seçeneği
[ ] I2. Kategoriye göre filtrele
[ ] I3. Müşteriye göre filtrele
[ ] I4. Sezona göre filtrele
[ ] I5. Arama (model adı veya kodu)
[ ] I6. Sıralama (tarih / alfabe / üretim sayısı)
[ ] I7. Toplu export (Excel/PDF)
[ ] I8. QR kod oluştur (her model için)

════════════════════════════════════════

## MEVCUT DURUM (01 Mart 2026)

✅ = Yapıldı | ❌ = Yapılmadı | ⚠️ = Kısmen

A1 ✅ | A2 ✅ | A3 ✅ | A4 ❌ | A5 ❌ | A6 ❌ | A7 ✅ | A8 ✅ | A9 ✅
B1 ❌ | B2 ❌ | B3 ❌ | B4 ❌ | B5 ❌ | B6 ❌
C1 ⚠️(number→text) | C2 ⚠️ | C3 ❌ | C4 ❌
D1 ⚠️ | D2 ❌ | D3 ❌ | D4 ❌
E1 ✅ | E2 ✅ | E3 ✅ | E4 ❌ | E5 ❌ | E6 ❌ | E7 ❌
F1 ✅ | F2 ⚠️(makine tipi ayrımı yok) | F3 ✅ | F4 ❌ | F5 ❌ | F6 ❌ | F7 ❌ | F8 ✅ | F9 ✅ | F10 ✅
G1 ✅ | G2 ✅ | G3 ✅ | G4 ✅ | G5 ❌
H1 ❌ | H2 ❌ | H3 ❌ | H4 ❌ | H5 ❌
I1 ⚠️ | I2 ❌ | I3 ❌ | I4 ❌ | I5 ✅ | I6 ❌ | I7 ❌ | I8 ❌

## PAZARTESİ İÇİN KRİTİK OLANLAR

🔴 ZORUNLU (Pazartesi sabahı olmadan olmaz):

- F2: Makine tipi ayrımı (Düz/Overlok/Reçme)
- C1: Beden text formatı
- D1/D2: Parça listesi
- E3/E4: Ön/arka fotoğraf

🟡 ÖNEMLİ (Bu hafta içinde):

- A4/A5: Müşteri/Sezon
- B1/B2: Kumaş cinsi/gramaj
- G5: Beceri önerisi

🔵 İLERİDE:

- H: Geçmiş/Audit
- I7/I8: Export/QR

[GK:MODELLER-OZELLIK-LISTESI]
════════════════════════════════════════
