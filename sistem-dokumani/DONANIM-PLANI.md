# SİSTEM DONANIMIM PLANI

## Tarih: 2026-02-22

---

# 3 AŞAMALI DONANIM

Sistemi bir anda kurmak gerekmiyor. Adım adım:

---

## AŞAMA 1: PİLOT UYGULAMA (Pazartesi başlıyor) ✅ KARAR VERİLDİ

**Amaç:** Manuel veri toplama + pilot test

| # | Donanım | Model | Adet | Fiyat (TL) | Durum |
|---|---------|-------|:---:|-----------|:---:|
| 1 | Tablet | Samsung Galaxy Tab S9 (8GB/256GB) | 1 | ~25,000-28,000 | ✅ Alınacak |
| 2 | SD Kart | SanDisk Extreme 1TB V30 A2 | 1 | ~3,700 | ✅ Alınacak |
| 3 | SSD | Samsung T7 2TB | 1 | ~10,050-13,370 | ✅ Alınacak |
| 4 | Yaka Mikrofonu | USB-C Lavalier | 1 | ~200-500 | ✅ Alınacak |
| 5 | Kılıf + Ekran Cam | Tab S9 uyumlu | 1 | ~400-700 | ✅ Alınacak |
| | **TOPLAM AŞAMA 1** | | | **~39,350-46,270** | |

> Bu aşamada başka bir şeye gerek yok. Tablet + SSD + mikrofon ile başlıyorsunuz.

---

## AŞAMA 2: YAZILIM SİSTEMİ KURULUMU (1-2 hafta sonra)

**Amaç:** Web uygulamasını çalıştırmak, verileri yönetmek

### Gerekli: 1 Bilgisayar (Sunucu olarak çalışacak)

Mevcut bir bilgisayarınız varsa onu kullanabilirsiniz. Yoksa alınması gereken:

| # | Donanım | Minimum Özellik | İdeal Özellik | Tahmini Fiyat |
|---|---------|-----------------|---------------|---------------|
| 1 | **İşlemci** | Intel i5 / AMD Ryzen 5 | Intel i7 / AMD Ryzen 7 | — |
| 2 | **RAM** | 8 GB | 16 GB | — |
| 3 | **Depolama** | 512 GB SSD | 1 TB SSD | — |
| 4 | **İşletim Sistemi** | Windows 10/11 | Windows 10/11 veya Linux | — |
| 5 | **Ağ** | WiFi + Ethernet portu | Ethernet | — |
| | **Hazır Bilgisayar** | Masaüstü PC | | ~15,000-25,000 TL |

> **Zaten bir bilgisayarınız varsa:** i5 işlemci, 8GB RAM, 256GB SSD yeterliyse EKSTRA DONANIM ALMANIZA GEREK YOK.

### Gerekli: Ağ Altyapısı

Tablet ve bilgisayarın aynı ağda olması gerekiyor:

| # | Donanım | Açıklama | Fiyat |
|---|---------|----------|-------|
| 1 | **WiFi Router** | Tablet bağlantısı için (muhtemelen zaten var) | ~500-2,000 TL |

> **Zaten WiFi'nız varsa:** Ek bir şey almanıza gerek yok.

### Aşama 2 Şeması:
```
[Tablet] ──WiFi──→ [Router] ──→ [Bilgisayar/Sunucu]
                                       │
                                  Web Uygulaması
                                  Veritabanı
                                  Video Depolama
```

### AŞAMA 2 EK MALİYET:

| Durum | Maliyet |
|-------|---------|
| Mevcut bilgisayar + mevcut WiFi var | **0 TL** ✅ |
| Bilgisayar var, WiFi yok | ~500-2,000 TL |
| Bilgisayar yok, WiFi yok | ~15,000-27,000 TL |

---

## AŞAMA 3: TAM SİSTEM (Kamera + Çoklu Tablet) — İleride

**Amaç:** Her makineye kamera ve tablet/panel kurmak

Bu aşama sistemi pilot olarak test ettikten ve yazılım çalıştıktan SONRA yapılır.

### Makine Başı Donanım (1 makine için):

| # | Donanım | Açıklama | Fiyat (TL) |
|---|---------|----------|-----------|
| 1 | **IP Kamera** | 1080p veya 4K, 20-30° ayarlanabilir, PoE veya WiFi | ~1,000-3,000 |
| 2 | **Tablet veya Panel** | Operatör ekranı (7-10 inç Android tablet) | ~3,000-8,000 |
| 3 | **Tablet Tutucusu** | Makineye montaj aparatı | ~200-500 |
| 4 | **Kamera Tutucusu** | Esnek ayarlanabilir montaj kolu | ~200-500 |
| | **1 MAKİNE TOPLAM** | | **~4,400-12,000** |

### Hat Bazlı Hesap (örnek):

| Hat Büyüklüğü | Makine Sayısı | Toplam Maliyet |
|---------------|:---:|---------------|
| Küçük hat | 5 makine | ~22,000-60,000 TL |
| Orta hat | 10 makine | ~44,000-120,000 TL |
| Büyük hat | 20 makine | ~88,000-240,000 TL |

### Ağ Altyapısı (Çoklu cihaz için):

| # | Donanım | Açıklama | Fiyat |
|---|---------|----------|-------|
| 1 | **Endüstriyel WiFi Erişim Noktası** | Çok cihazı kaldıran, geniş kapsama | ~2,000-5,000 TL |
| 2 | **PoE Switch** (Kamera için) | Kameralara tek kablo ile güç + veri | ~1,500-4,000 TL |
| 3 | **Ethernet Kablolama** | Cat6 kablo, prizler, patchpanel | ~2,000-5,000 TL |
| 4 | **NAS veya Sunucu** (İsteğe bağlı) | Video arşivi için büyük depolama | ~5,000-15,000 TL |
| | **AĞ ALTYAPI TOPLAM** | | **~10,500-29,000 TL** |

---

# TOPLAM MALİYET ÖZETİ

| Aşama | Ne Zaman | Maliyet |
|-------|----------|---------|
| **Aşama 1** — Pilot | Pazartesi | **~39,000-46,000 TL** |
| **Aşama 2** — Yazılım | 1-2 hafta sonra | **0 TL** (mevcut PC varsa) |
| **Aşama 3** — 10 Makine | 2-3 ay sonra | **~54,000-149,000 TL** |

---

# ŞU AN NE LAZIM?

## Sadece Aşama 1. Başka bir şey değil.

| ✅ Alın | ❌ Şimdi almayın |
|--------|-----------------|
| Tab S9 (8GB/256GB) | IP kameralar |
| SanDisk 1TB SD | Operatör tabletleri |
| Samsung T7 2TB SSD | Switch / PoE |
| Yaka mikrofonu | NAS sunucu |
| Kılıf + cam | Ağ altyapısı |

**Yazılım geliştirmeye mevcut bilgisayarınızda başlıyoruz. Ek donanıma şu an gerek yok.**

---

# SORULAR

Yazılıma başlamadan önce bilmem gereken:

1. **Mevcut bilgisayarınız var mı?** (Masaüstü veya laptop — özellikleri ne?)
2. **Atölyede WiFi var mı?**
3. **Pazartesi ilk hangi modelle başlıyorsunuz?** (Ürün adı/tipi)
