# 🏭 ÜRETİM PENCERESİ — YÖNETİM KURULU İNCELEME DOKÜMANI

> 📅 Tarih: 28 Şubat 2026 | Hazırlayan: Yazılım Geliştirme Ekibi  
> 🎯 Amaç: Üretim (Üretim Takip) penceresinin tüm işlevlerinin, kriterlerinin ve alt bileşenlerinin kapsamlı incelemesi

---

## 1. GENEL BAKIŞ

Üretim penceresi, **gerçek zamanlı üretim takibinin** yapıldığı ana merkezdir. Operatör veya yönetici bu pencereden üretim seansı başlatır, adet/hata/süre bilgilerini girer ve üretim performansını anlık olarak izler. Modeller penceresinde tanımlanan modeller ve işlemler burada hayata geçer.

### Pencerenin Temel Görevleri
| # | Görev | Durum |
|---|-------|-------|
| 1 | Üretim seansı başlatma (Timer) | ✅ Çalışıyor |
| 2 | Üretim seansı durdurma ve kaydetme | ✅ Çalışıyor |
| 3 | Üretim verisi girişi (adet, hata, mola, vb.) | ✅ Çalışıyor |
| 4 | FPY (First Pass Yield) otomatik hesaplama | ✅ Çalışıyor |
| 5 | OEE (Overall Equipment Effectiveness) hesaplama | ✅ Çalışıyor |
| 6 | Net çalışma süresi hesaplama | ✅ Çalışıyor |
| 7 | Birim değer (₺) hesaplama | ✅ Çalışıyor |
| 8 | Tarih bazlı filtreleme | ✅ Çalışıyor |
| 9 | Kayıt düzenleme | ✅ Çalışıyor |
| 10 | Kayıt silme (soft-delete) | ✅ Çalışıyor |
| 11 | Denetim izi (Audit Trail) | ✅ Çalışıyor |
| 12 | Personel öneri sistemi | ✅ Çalışıyor |
| 13 | Timer sayfa yenilenme koruması | ✅ Çalışıyor |

---

## 2. ÜST BAR (TOPBAR) ANALİZİ

### Mevcut Elemanlar
| Eleman | Açıklama | Değerlendirme |
|--------|----------|---------------|
| 🏭 Başlık | "Üretim Takip" | ✅ Açık ve net |
| 📅 Tarih seçici | `input[type=date]` — varsayılan bugün | ✅ Çalışıyor |
| 📌 Bugün butonu | Tek tıkla bugüne dön | ✅ Çalışıyor |
| 📊 Türkçe tarih | "28 Şubat Cumartesi" formatında | ✅ Okunabilir |

### 💡 Yönetim Kurulu Değerlendirmesi İçin:
- **Artı:** Tarih seçici sayesinde geçmiş günlerin kayıtları da görülebiliyor
- **Artı:** "Bugün" butonu ile hızlıca güncel duruma dönülüyor
- **Soru:** Tarih aralığı seçimi (başlangıç-bitiş) gerekli mi?
- **Soru:** Haftalık/aylık özet görünümü istenilir mi?

---

## 3. İSTATİSTİK KARTLARI

### Üst Bölümdeki 4 İstatistik Kartı
| Kart | Hesaplama | Renk | Değerlendirme |
|------|-----------|------|---------------|
| 📦 Bugün Üretilen | Toplam adet (seçili tarih) | Yeşil | ✅ Doğru hesaplanıyor |
| ✅ Kalite (FPY) | (Üretilen - Hatalı) / Üretilen × 100 | Yeşil | ✅ %33.3 gibi detaylı |
| ❌ Toplam Hata | Hatalı adet toplamı | Kırmızı | ✅ Doğru |
| 📊 Kayıt Sayısı | Toplam üretim kaydı | Mor | ✅ Doğru |

### 💡 Değerlendirme:
- **Artı:** Anlık durum bir bakışta görülüyor
- **Soru:** OEE skoru da istatistik kartlarına eklenmeli mi?
- **Soru:** Hedef adet vs. gerçekleşen adet karşılaştırması gösterilmeli mi?
- **Soru:** Maliyet bazlı (toplam ₺ kazanılan) kart eklenmeli mi?

---

## 4. YENİ ÜRETİM BAŞLATMA BÖLÜMÜ

### Adım Adım İşlem Akışı
```
1. Model Seçin → 2. İşlem Sırası → 3. Personel Seçin → 4. İŞLEMİ BAŞLAT
```

### Adım 1: MODEL SEÇİN
| Özellik | Durum |
|---------|-------|
| Dropdown listesi | ✅ Tüm aktif modeller |
| Model adı + kodu gösterimi | ✅ "ELBİSE (LW0000095)" |
| Silinmiş modellerin filtrelenmesi | ✅ Sadece aktif modeller |

### Adım 2: İŞLEM SIRASI
| Özellik | Durum |
|---------|-------|
| Otomatik yükleme | ✅ Model seçilince işlemler yükleniyor |
| İlk işlemi otomatik seçme | ✅ Race condition düzeltildi |
| İşlem detayları | ✅ İsim + Makine + Zorluk + Kişi sayısı |
| Görsel işlem kartları | ✅ Renkli kartlar, zorluk badge, kişi sayısı |

### Adım 3: PERSONEL SEÇİN
| Özellik | Durum |
|---------|-------|
| Akıllı öneri sistemi | ✅ İşlemi yapabilecek personeller filtreleniyor |
| "ÖNERİLEN" badge | ✅ En uygun personel vurgulanıyor |
| Yetkinlik bilgisi | ✅ "duz_makineci, overlokcu" gibi beceriler |
| Yapabilecek kişi sayısı | ✅ "2 kişi yapabilir" gösterimi |

### Adım 4: İŞLEMİ BAŞLAT
| Özellik | Durum |
|---------|-------|
| Canlı timer | ✅ HH:MM:SS formatında |
| Timer sessionStorage yedekleme | ✅ Sayfa yenilenince kaybolmuyor |
| Session bilgisi yedekleme | ✅ activeSession sessionStorage'da |

### 💡 Değerlendirme:
- **Artı:** 4 adımlı basit ve sezgisel akış
- **Artı:** Personel öneri sistemi iş dağıtımını kolaylaştırıyor
- **Artı:** Timer yedekleme — yanlışlıkla sayfa kapatılsa bile devam ediyor
- **Soru:** Birden fazla kişi aynı işlemi aynı anda yapabilir mi olmalı?
- **Soru:** Makine seçimi (hangi makinede yapıldığı) eklenmeli mi?
- **Soru:** Başlangıç saati manuel olarak düzeltilebilir mi olmalı? (Başlatmayı unutma durumu)

---

## 5. VERİ GİRİŞ FORMU (AKTİF ÜRETIM)

Üretim başlatıldıktan sonra açılan form alanları:

### Ana Alanlar
| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| Yapılan Adet | Sayı | ✅ | Toplam üretilen |
| Hatalı Adet | Sayı | ❌ | Varsayılan 0 |
| Hata Nedeni | Text | ❌ | Serbest yazı |
| Hata Kaynağı | Seçim | ❌ | Operatör/Makine/Malzeme/Tasarım |
| Hata Sınıfı | Seçim | ❌ | Atlanmış dikiş, Eğri dikiş, vb. |
| Kalite Puanı | 0-100 | ❌ | Varsayılan 100 |

### Süre Kayıp Alanları
| Alan | Tip | Açıklama |
|------|-----|----------|
| Mola (dk) | Sayı | Çay/yemek molası |
| Makine Arıza (dk) | Sayı | Beklenmedik makine durması |
| Malzeme Bekleme (dk) | Sayı | Kumaş/aksesuar bekleme |
| Pasif Süre (dk) | Sayı | Diğer kayıp süreler |

### Ek Alanlar
| Alan | Tip | Açıklama |
|------|-----|----------|
| Lot Değişikliği | Text | Beden/renk değişimi notu |
| Not | Text | Genel açıklama |

### 💡 Değerlendirme:
- **Artı:** 4 farklı süre kayıp kategorisi — OEE hesabı için kritik
- **Artı:** Hata kaynağı 4'e ayrılmış — kök neden analizi yapılabilir
- **Artı:** 7 farklı hata sınıfı — kalite raporlama için veri sağlıyor
- **Soru:** Fotoğraf ekleme (hatalı ürün fotoğrafı) alanı aktif mi olmalı?
- **Soru:** "Lot Değişikliği" daha yapılandırılmış olmalı mı? (Eski beden → Yeni beden)
- **Öneri:** Form alanlarına otomatik doldurma (önceki kayıttan kopya) eklenmeli mi?

---

## 6. OTOMATİK HESAPLANAN DEĞERLER

### Üretim Tamamlandığında Hesaplanan Alanlar
| Alan | Formül | Açıklama |
|------|--------|----------|
| **FPY** | (Üretilen - Hatalı) / Üretilen × 100 | Kalite oranı |
| **Net Çalışma (dk)** | Toplam süre - Mola - Arıza - Bekleme - Pasif | Gerçek verimli süre |
| **Birim Değer (₺)** | İşlem birim fiyat × Üretilen adet | Fason gelir |
| **OEE Skoru** | Kullanılabilirlik × Performans × Kalite | Endüstri standardı |
| **Ortalama Birim Süre** | Net süre / Üretilen adet (tüm kayıtlar ortalaması) | Operasyon verimliliği |

### OEE Hesaplama Detayı
```
Kullanılabilirlik = (Toplam Dakika - Kayıp Dakikalar) / Toplam Dakika
Performans        = Üretilen / (Net Dakika × Referans Hız)
Kalite            = (Üretilen - Hatalı) / Üretilen
OEE               = Kullanılabilirlik × Performans × Kalite × 100
```

### 💡 Değerlendirme:
- **Artı:** OEE hesabı endüstri standardına uygun
- **Artı:** FPY anlık hesaplanıyor — hata trendleri izlenebilir
- **Artı:** Güncelleme sırasında (PUT) otomatik yeniden hesaplama yapılıyor
- **Eksi:** OEE'deki "Performans" hesabında standart çevrim süresi sabit — gerçek işlem süresine göre ayarlanmalı
- **Soru:** OEE için hedef değer (örn: %85) tanımlanabilir mi olmalı?
- **Soru:** Günlük/haftalık OEE trendi görselleştirilmeli mi?

---

## 7. ÜRETİM KAYITLARI TABLOSU

### Tablo Sütunları
| Sütun | İçerik | Değerlendirme |
|-------|--------|---------------|
| PERSONEL | Çalışan adı | ✅ |
| MODEL | Model kodu | ✅ |
| İŞLEM | İşlem adı | ✅ |
| ADET | Üretilen miktar | ✅ |
| HATA | Hatalı adet (kırmızı) | ✅ |
| FPY | Kalite yüzdesi (renkli) | ✅ |
| SÜRE | Dakika cinsinden | ✅ |
| DEĞER ₺ | İşlem bazlı gelir | ✅ |
| İŞLEMLER | Düzenle / Sil / Geçmiş butonları | ✅ |

### Kayıt İşlemleri
| İşlem | Buton | Açıklama |
|-------|-------|----------|
| ✏️ Düzenle | Kalem ikonu | Tüm alanlar düzenlenebilir |
| 🗑️ Sil | Çöp ikonu | Soft-delete (geri alınabilir) |
| 📋 Geçmiş | Kart ikonu | Denetim izi görüntüleme |

### 💡 Değerlendirme:
- **Artı:** FPY renk kodlu — düşük kalite hemen fark ediliyor
- **Artı:** Kayıt düzenlendiğinde FPY/değer/süre otomatik yeniden hesaplanıyor
- **Artı:** Denetim izi ile kim ne zaman değiştirdi görülebiliyor
- **Soru:** Tablo filtreleme (personele/modele göre) eklenmeli mi?
- **Soru:** Satır başlığına tıklayınca sıralama (artan/azalan) olmalı mı?
- **Soru:** Kayıt dışa aktarma (CSV/Excel) gerekli mi?

---

## 8. GÜVENLİK & VERİ BÜTÜNLÜĞÜ

| Kriter | Durum | Açıklama |
|--------|-------|----------|
| SQL Injection koruması | ✅ | Parametreli sorgular |
| Soft-delete | ✅ | Kayıtlar fiziksel silinmiyor |
| Audit Trail | ✅ | Her değişiklik loglanıyor |
| Timer yedekleme | ✅ | sessionStorage ile |
| Silinmiş kayıtlar filtreleme | ✅ | avg hesabında `deleted_at IS NULL` |
| PUT recalc | ✅ | Düzenleme sonrası otomatik hesaplama |
| passive_time dahil edilme | ✅ | Ortalama süre hesabında |

---

## 9. ARTILARIN ÖZETİ ✅
1. Gerçek zamanlı timer ile anlık üretim takibi
2. OEE + FPY + Net Süre + Birim Değer otomatik hesaplama
3. Akıllı personel öneri sistemi
4. 4 kategorili süre kayıp analizi (mola, arıza, bekleme, pasif)
5. 4 farklı hata kaynağı sınıflandırması
6. Tarih bazlı filtreleme ile geçmiş analizi
7. Timer sayfa yenilenme koruması
8. Kayıt düzenleme sırasında otomatik yeniden hesaplama
9. İstatistik kartları ile anlk durum

## 10. GELİŞTİRME ÖNERİLERİ 🔧
1. OEE'de standart çevrim süresi işlem bazında ayarlanabilmeli
2. Tablo sütun başlıklarına tıklayarak sıralama
3. Kayıt dışa aktarma (Excel/CSV)
4. Günlük/haftalık performans grafiği
5. Birden fazla kişinin aynı anda çalışması desteği
6. Makine seçimi (hangi makinede üretildi)
7. Hatalı ürün fotoğrafı yükleme
8. Başlangıç saati düzeltme imkanı

---

## 📣 YÖNETİM KURULUNDAN RİCA EDİLEN GERİ BİLDİRİMLER

> Aşağıdaki soruları farklı bakış açısıyla değerlendirmenizi rica ediyoruz:

1. **İstatistik kartlarına** OEE ve toplam ₺ değer eklenmeli mi?
2. **Hedef adet** belirleme (günlük üretim hedefi) sistemi istiyor musunuz?
3. **Birden fazla kişi** aynı işlemi aynı anda yapabilmeli mi?
4. **Makine seçimi** (hangi makinede yapıldı) kaydedilmeli mi?
5. **Başlangıç saati düzeltme** (başlatmayı unutma durumu) gerekli mi?
6. **Hatalı ürün fotoğrafı** yükleme aktif edilmeli mi?
7. **Tablo filtreleme** (personel, model, işlem bazlı) eklenmeli mi?
8. **Excel/CSV dışa aktarma** günlük/haftalık/aylık raporlama için gerekli mi?
9. **Performans grafiği** (günlük üretim trendi) gösterilmeli mi?
10. **OEE hedef değer** (örn: %85) tanımlanabilir mi olmalı?
11. **Lot değişikliği** daha yapılandırılmış mı olmalı? (Eski → Yeni format)
12. **Sesli/görsel uyarı** (düşük FPY, uzun mola, vb.) istiyor musunuz?

> ⚠️ Bu doküman üzerindeki yorumlarınızı, önerilerinizi ve öncelik sıralamanızı belirtmenizi rica ediyoruz. Her madde için "Şart", "Olursa İyi Olur" veya "Şimdi Gerekli Değil" şeklinde cevap vermeniz yeterlidir.
