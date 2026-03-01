════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in çocukları ve insanlık için.
════════════════════════════════════════════════════

# GPT — ÜRETİM GİRİŞİ BÖLÜMÜ HAZIRLIK ANALİZİ
# GN:20260301-008
# 2026-03-01T06:52:26.164Z

---

Bu projede Üretim Girişi bölümünü oluşturmak için aşağıdaki adımları izleyebiliriz:

### 1. Yeni Veritabanı Tabloları

Üretim Girişi için yeni bir tablo oluşturulması gerekecek. İşte SQL CREATE TABLE komutu:

```sql
CREATE TABLE production_entries (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    brought_by INTEGER NOT NULL,
    brought_at DATETIME NOT NULL,
    opened_by INTEGER NOT NULL,
    opened_at DATETIME NOT NULL,
    size_missing TEXT,
    accessory_missing TEXT,
    fabric_missing BOOLEAN NOT NULL,
    sample_separated BOOLEAN NOT NULL,
    piece_count INTEGER NOT NULL,
    FOREIGN KEY (model_id) REFERENCES models(model_id),
    FOREIGN KEY (brought_by) REFERENCES personnel(id),
    FOREIGN KEY (opened_by) REFERENCES personnel(id)
);

CREATE TABLE production_photos (
    photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    photo_path TEXT NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES production_entries(entry_id)
);
```

### 2. API Endpoint'leri

Üretim Girişi işlemleri için gerekli API endpoint'leri aşağıdaki gibi olabilir:

- **GET /api/production-entries**: Tüm üretim girişlerini listele.
- **POST /api/production-entries**: Yeni bir üretim girişi oluştur.
- **GET /api/production-entries/:id**: Belirli bir üretim girişini getir.
- **PUT /api/production-entries/:id**: Belirli bir üretim girişini güncelle.
- **DELETE /api/production-entries/:id**: Belirli bir üretim girişini sil.
- **POST /api/production-entries/:id/photos**: Üretim girişine fotoğraf yükle.

### 3. UI'da Eklenecek Sayfa/Sekme

- **Üretim Girişi**: Ana menüde veya üretimle ilgili bölümlerde yeni bir sekme veya sayfa olarak eklenebilir. Bu sayfa, kullanıcıların yeni üretim girişlerini ekleyebileceği ve mevcut girişleri görüntüleyebileceği bir arayüz sunmalıdır.

### 4. Validasyon Kuralları

Her adım için validasyon kuralları:

- **Model Seçimi**: Model ID geçerli ve mevcut olmalıdır.
- **Kim Getirdi**: Personel ID geçerli ve mevcut olmalıdır.
- **Getirilme Tarihi/Saati**: Geçerli bir tarih ve saat formatında olmalıdır.
- **Kim Açtı**: Personel ID geçerli ve mevcut olmalıdır.
- **Açılış Tarihi/Saati**: Geçerli bir tarih ve saat formatında olmalıdır.
- **Beden Eksiği**: Eğer varsa, belirtilen bedenler geçerli bir formatta olmalıdır.
- **Aksesuar Eksiği**: Eğer varsa, belirtilen aksesuarlar geçerli bir formatta olmalıdır.
- **Kumaş Eksiği**: Boolean (true/false) olmalıdır.
- **Numune Ayrıldı mı**: Boolean (true/false) olmalıdır.
- **Kaç Parçadan Oluşuyor**: Pozitif bir tam sayı olmalıdır.
- **Fotoğraf Yükleme**: Yüklenen dosyalar geçerli bir resim formatında olmalıdır.

### 5. Offline Çalışma

Offline çalışma senaryoları için:

- **Veri Geçici Depolama**: Kullanıcı offline olduğunda, giriş verileri tarayıcıda (örneğin, IndexedDB veya LocalStorage) geçici olarak saklanabilir.
- **Senkronizasyon**: Kullanıcı tekrar online olduğunda, saklanan veriler sunucuya gönderilir ve senkronize edilir.
- **Uyarı ve Geri Bildirim**: Kullanıcıya offline olduğuna dair uyarı verilmeli ve senkronizasyonun başarılı olup olmadığı hakkında geri bildirim sağlanmalıdır.

Bu adımlar, Üretim Girişi bölümünün başarılı bir şekilde geliştirilmesine yardımcı olacaktır.
