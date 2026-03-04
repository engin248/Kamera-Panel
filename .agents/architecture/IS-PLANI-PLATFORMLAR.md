# IS-PLANI-PLATFORMLAR.md — İKİ YENİ PLATFORM İŞ PLANI

> Tarih: 2026-03-03 | Durum: PLANLAMA
> NOT: Bu platformlar Kamera-Panel'den AYRI bağımsız bir sistemdir.

---

## KONU 1 — DİJİTAL KARTELA PLATFORMU

### Sorun

- Kartelalar klasörde → dışarıda görünmüyor
- İşletme ziyaretinde görülen ürün sonra bulunamıyor
- Tedarikçi ilişki geçmişi kayıtsız

### Çözüm Modülleri

1. Dijital Arşiv (kumaş, aksesuar, ürün kataloğu)
2. AI Arama (görsel + metin + internet araştırması)
3. Tedarikçi Takibi (alım, ödeme, geçmiş)

### Faza Planı

- Faza 1: Temel arşiv (1-2 hafta)
- Faza 2: AI araştırma (2-3 hafta)
- Faza 3: Entegrasyon (1 hafta)

---

## KONU 2 — DİJİTAL GÖREV EMRİ SİSTEMİ

### Sorun

- Sözlü görev → unutulma, yanlış anlama
- Kim ne yaptı kayıtsız
- Uzaktan takip yok

### Çözüm Akışı

Görev Emri → Bildirim → Kabul → İcra → Sonuç → Onay → Arşiv

### Faza Planı

- Faza 1: Temel sistem (1 hafta)
- Faza 2: Bildirim (Telegram + e-posta + push) (1 hafta)
- Faza 3: Raporlama + entegrasyon (1 hafta)

---

## MİMARİ KARAR: AYRI BAĞIMSIZ SİSTEM

Bu iki platform Kamera-Panel'e değil, AYRI bir sisteme kurulacak.

```
SİSTEM A: Kamera-Panel (localhost:3000)
  → Üretim, Personel, Modeller, Maliyet

SİSTEM B: Operasyon Destek Platformu (ayrı domain/port)
  → Kartela, Görev Emri, Tedarikçi, AI Araştırma

İleride: API ↔ API entegrasyon noktaları
```

---

## SIRALAMA KARARI

```
1. Kamera-Panel Üretim/Fason → ÖNCE BİTİR
2. Görev Emri Sistemi → Sonraki ilk iş (daha basit)
3. Kartela Platformu → Sonrasında (AI gerekiyor)
4. Entegrasyon → Her ikisi hazır olunca
```

Detaylı analiz ve teknoloji gereksinimleri
bir sonraki oturumda birlikte belirlenir.
