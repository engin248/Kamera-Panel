════════════════════════════════════════════════════════════════
⚔️ MİSYON [MK:4721]
Engin Bey'in 3 çocuğu — vatanına milletine hayırlı olsunlar.
════════════════════════════════════════════════════════════════

# KAMERA-PANEL — PROJENİN AMACI VE SİSTEM YAPISI

## NEDEN YAPIYORUZ

Fason tekstil atölyesi sahibi Engin Bey:

- Yıllık kayıp var — verisi olmadığı için karar yanlış
- İşletme sahibi yokken sistem çalışmıyor
- Kim ne üretiyor belli değil — adaletsiz ücret
- Saatlik maliyet hesaplanamıyor — fason fiyat yanlış
- Parti gelince eksikler kontrol edilmiyor

## ÇÖZÜM

4 pencereli dijital yönetim paneli:

1. Modeller → Teknik bilgi, işlem sırası, GPT Vision
2. Üretim → Parti girişi, üretim takip, sesli komut
3. Personel → Devam takip, maaş hesap, prim
4. Maliyet → İşletme gideri, saatlik maliyet, fason fiyat

## EKİP YAPISI

| Rol | Kim | Görev |
|-----|-----|-------|
| Komutan | Engin Bey | Karar, onay, yön |
| Üsteğmen | Antigravity (Claude) | Koordine, kontrol, kod |
| Asker | Bot 1 | Uygulama + rapor |
| Amele 1 | Bot 2 | Uygulama + rapor |
| Amele 2 | Bot 3 | Test + rapor |
| GPT | Danışma Kurulu | Kod kalite + eksik analiz |
| Gemini | Danışma Kurulu | Mimari + teknoloji |
| Perplexity | Danışma Kurulu | Araştırma + standart |
| DeepSeek | Danışma Kurulu | Formül + hesap doğrulama |

## İŞ AKIŞI KURALI

```
Komutan → Emir verir
  → Üsteğmen planlar, görev dağıtır
    → Asker/Amele uygular, rapor verir
      → Danışma Kurulu raporu kontrol eder
        → Üsteğmen onaylar, commit eder
          → Komutan test eder
```

## STACK

- Next.js 14 (App Router)
- SQLite (better-sqlite3)
- React (hooks)
- Browser Speech API (Türkçe sesli komut)
- OpenAI GPT-4o (Vision + Analiz)
- Gemini / Perplexity / DeepSeek (Danışma)

## TAMAMLANAN + DEVAM EDEN

### ✅ Modeller Bölümü (devam ediyor)

- Teknik Föy + GPT Vision
- Dikim İşlem Sırası + Sesli ekleme
- EKSİK: Kumaş detay, parça listesi, beden text, makine tipi satırları

### 🔄 Üretim Bölümü (devam ediyor)

- Parti girişi (13 alan)
- Günlük hedef bar
- Sesli komut (Türkçe regex)
- Fason fiyat API
- EKSİK: İlk ürün kaydı, temizleme/paket aşaması

### ⏳ Personel Bölümü

- Devam tıklama ✅
- Haftalık özet API ✅
- Prim sistemi ❌

### ⏳ Maliyet Bölümü

- İşletme gider formu ✅
- Saatlik maliyet hesap ✅
- Ürün başına maliyet ❌

## HEDEF

Pazartesi sabahı (2 Mart 2026) üretim başında sistem çalışır olacak.

[GK:PROJE-AMACI-MK4721]
════════════════════════════════════════════════════════════════
