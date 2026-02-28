# 🏭 ÜRETİM TAKİP PENCERESİ — SON ANALİZ RAPORU

**Tarih:** 28 Şubat 2026
**Durum:** ✅ Tamamlandı — Son Kontrol Geçti

---

## 📊 TOPLAM SAYIM

### İstatistik Kartları: 6 Adet
| # | Kart | Ölçü | Renk Uyarısı |
|---|------|------|-------------|
| 1 | Bugün Üretilen | Adet | — |
| 2 | Kalite (FPY) | % | ✅ %95↑ yeşil, %85-95 turuncu, %85↓ kırmızı |
| 3 | Toplam Hata | Adet | — |
| 4 | OEE | % | ✅ Hedef %85 badge, üstü yeşil / altı turuncu |
| 5 | Toplam Değer | ₺ | — |
| 6 | Kayıt Sayısı | Adet | — |

### Üretim Başlatma Formu: 3 Adım
| Adım | İçerik | Özellik |
|------|--------|---------|
| ① Model Seçin | Dropdown | Tüm modeller listelenir |
| ② İşlem Sırası | Görsel kartlar + dropdown | Makine tipi, zorluk, yapabilecek kişi sayısı |
| ③ Personel Seçin | Dropdown + AI öneri | 🤖 ÖNERİLEN badge (yetkinlik bazlı) |

### Aktif Üretim Paneli — Süreç Kriterleri: 6 Alan
| # | Alan | Tip | Zorunlu |
|---|------|-----|---------|
| 1 | Yapılan Adet | Sayı | ✅ Evet |
| 2 | Hatalı Adet | Sayı | Hayır |
| 3 | Hata Kaynağı | Dropdown (4 seçenek) | Hata varsa |
| 4 | Hata Açıklaması | Metin | Hata varsa |
| 5 | Hata Tipi Sınıflandırma | Çoklu seçim (7 tip) | Hata varsa |
| 6 | İşlem Durumu (Lot) | Dropdown (4 seçenek) | Hayır |
| 7 | Kalite Puanı | Sayı (0-100) | Hayır |

### Hata Kaynağı Seçenekleri: 4 Adet
1. 👷 Operatör Hatası
2. ⚙️ Makine Hatası
3. 🧵 Malzeme Hatası
4. 📐 Tasarım Hatası

### Hata Tipi Sınıflandırma: 7 Adet
1. Atlanmış dikiş
2. Eğri dikiş
3. İplik kopması
4. Kumaş hatası
5. Ölçü hatası
6. Leke/iz
7. Diğer

### Lot Değişikliği: 4 Seçenek
1. Lot değişimi yok
2. Renk değişimi
3. Beden değişimi
4. İkisi birden

### Zaman Kriterleri: 4 Alan
| # | Alan | Açıklama |
|---|------|---------|
| 1 | Mola (dk) | Çay/yemek molası |
| 2 | Arıza (dk) | Makine arızası duruşu |
| 3 | Bekleme (dk) | Malzeme bekleme |
| 4 | Pasif (dk) | Diğer boş süre |

### Otomatik Hesaplamalar: 4 Adet
| # | Hesaplama | Formül |
|---|-----------|--------|
| 1 | FPY (İlk Geçiş) | (Yapılan - Hatalı) / Yapılan × 100 |
| 2 | Net Çalışma Süresi | Toplam - Mola - Arıza - Bekleme - Pasif |
| 3 | Birim Süre | Net Çalışma / Yapılan Adet |
| 4 | İşlem Değeri ₺ | Yapılan × Birim Fiyat |

### Timer & Kontroller: 4 Özellik
1. ⏱️ Canlı zamanlayıcı (HH:MM:SS)
2. ✏️ Başlangıç saati düzeltme
3. 🗑️ İptal butonu
4. ✅ Tamamla & Kaydet butonu

### Kayıtlar Tablosu: 9 Sütun + 3 Buton
| # | Sütun | Açıklama |
|---|-------|---------|
| 1 | Personel | İsim |
| 2 | Model | Kod |
| 3 | İşlem | İşlem adı |
| 4 | Adet | Yapılan |
| 5 | Hata | Badge ile gösterim |
| 6 | FPY | Renk kodlu badge |
| 7 | Süre | Dakika |
| 8 | Değer ₺ | Hesaplanan |
| 9 | İşlemler | ✏️ Düzenle / 🗑️ Sil / 📜 Geçmiş |

### Tablo Filtreleri: 2 Dropdown + Temizle
1. Tüm Personel (dropdown)
2. Tüm Modeller (dropdown)
3. ✕ Temizle butonu

### Düzenleme Modalı: 9 Alan
1. Yapılan Adet
2. Hatalı Adet
3. Hata Nedeni
4. Kalite Puanı
5. Mola (dk)
6. Arıza (dk)
7. Bekleme (dk)
8. Pasif (dk)
9. Not

### AI Personel Öneri Sistemi: 4 Kriter
1. Makine uyumu (0-40 puan)
2. Beceri seviyesi vs zorluk (0-30 puan)
3. İşlem deneyimi (0-20 puan)
4. Önceki FPY performansı (bonus 10 puan)

---

## 📈 GENEL TOPLAM

| Kategori | Sayı |
|----------|------|
| İstatistik kartları | 6 |
| Form adımları | 3 |
| Veri giriş alanları | 12 |
| Dropdown seçenekler | 15+ |
| Hata sınıflandırma tipleri | 7 |
| Otomatik hesaplamalar | 4 |
| Timer kontrolleri | 4 |
| Tablo sütunları | 9 |
| CRUD butonları/satır | 3 |
| Tablo filtreleri | 2+1 |
| Düzenleme modalı alanları | 9 |
| AI öneri kriterleri | 4 |
| **TOPLAM ÖZELLİK** | **~75+** |

---

## 🌍 DÜNYA ORTALAMASIYLA KARŞILAŞTIRMA İÇİN SORULAR

Yönetim kurulu üyelerine:

1. Bu 75+ özellik, bir küçük tekstil atölyesi için **yeterli mi**, **fazla mı**, **eksik mi**?
2. OEE hedefi %85 — bu dünya ortalaması. Bizim atölye için gerçekçi mi, %75 mi olmalı?
3. AI personel önerisi 4 kriterle çalışıyor — başka kriter eklenmeli mi?
4. Hata sınıflandırması 7 tip — tekstil sektöründe standart kaç tip?
5. FPY uyarı sınırları (%95/%85) — doğru mu, değişmeli mi?
6. Başka pencerelerle (Kalite Kontrol, Maliyet) entegrasyon gerekli mi?
