════════════════════════════════════════════════════
⚔️  MİSYON  [MK:4721]
Engin Bey'in 3 çocuğu var.
Vatanına milletine hayırlı olsunlar.
Bu sistem onlar ve insanlık için inşa ediliyor.
════════════════════════════════════════════════════

# 03 — AÇIK KAYNAK TEKNOLOJİ ARAŞTIRMASI

## Ücretsiz vs Ücretli — Her Bileşen için Karşılaştırma

**Hazırlayan:** Teğmen
**Tarih:** 01 Mart 2026
**Not:** Bu araştırma teknoloji kararı için temel oluşturacak.
         Karar Komutan'a aittir.

---

## BİLEŞEN 1 — SES TANIMA (STT / Speech-to-Text)

### AÇIK KAYNAK (Ücretsiz)

| Teknoloji | Türkçe | Gürültü | Kurulum | Doğruluk |
|-----------|--------|---------|---------|----------|
| **Whisper (OpenAI — Self-hosted)** | ✅ 98 dil | ✅ İyi | Orta | %92+ |
| **Vosk** | ✅ Türkçe model var | ⚠️ Orta | Kolay | %82-88 |
| **Coqui STT** | ⚠️ Sınırlı | ⚠️ Orta | Zor | %80-85 |
| **SpeechBrain** | ⚠️ Araştırma | Orta | Zor | Değişken |

**En İyi Açık Kaynak:** Whisper (self-hosted)

- Kendi sunucunuzda çalışır → İnternet gerekmez
- Ücretsiz → Aylık maliyet yok
- Gereç: Güçlü bilgisayar (GPU önerilir, CPU da çalışır ama yavaş)

### ÜCRETLİ

| Teknoloji | Fiyat | Türkçe | Gürültü |
|-----------|-------|--------|---------|
| **OpenAI Whisper API** | $0.006/dakika | ✅ %92+ | ✅ Çok iyi |
| **Google Cloud STT** | $0.016/dakika | ✅ İyi | ✅ İyi |
| **Azure Speech** | ~$1/saat | ✅ İyi | ✅ İyi |
| **AssemblyAI** | $0.037/dakika | ⚠️ Sınırlı | ✅ Çok iyi |

**Tahmini Aylık Maliyet (Whisper API):**

- 10 operatör × 5 dakika ses/gün × 22 gün = 1.100 dakika/ay
- 1.100 × $0.006 = **$6.6/ay (~220 TL)**

---

## BİLEŞEN 2 — GÖRSEL OKUMA (OCR / Fotoğraf → Metin)

### AÇIK KAYNAK (Ücretsiz)

| Teknoloji | Türkçe | Doğruluk | Kurulum |
|-----------|--------|----------|---------|
| **Tesseract OCR** | ✅ Türkçe dil paketi var | %85-90 | Kolay |
| **EasyOCR** | ✅ Türkçe | %88-93 | Kolay |
| **PaddleOCR** | ✅ Çokdilli | %90-95 | Orta |
| **DocTR** | ⚠️ Sınırlı | %88-92 | Orta |

**En İyi Açık Kaynak:** PaddleOCR veya EasyOCR

- Kurulumu kolay, Python ile çalışır
- Tamamen ücretsiz

### ÜCRETLİ

| Teknoloji | Fiyat | Doğruluk |
|-----------|-------|----------|
| **Google Cloud Vision** | $1.50/1000 görsel | %95+ |
| **Azure Computer Vision** | $1/1000 görsel | %94+ |
| **OpenAI GPT-4o Vision** | ~$0.01/görsel | %95+ (anlama da var) |

**Tahmini Aylık Maliyet (EasyOCR — Ücretsiz):**

- 0 TL

---

## BİLEŞEN 3 — METİN ANLAMA & AYRIŞTIRMA (NLP/Parser)

### AÇIK KAYNAK (Ücretsiz)

| Teknoloji | Türkçe | Yetenek | Kurulum |
|-----------|--------|---------|---------|
| **Ollama + Llama3** | ✅ | Çok iyi | Kolay |
| **spaCy (Türkçe model)** | ✅ | Orta | Kolay |
| **Elle yazılmış kural seti** | ✅ | Kontrollü | Geliştirme gerekir |
| **HuggingFace (yerel model)** | ✅ | İyi | Orta |

**En İyi Açık Kaynak:** Ollama + Llama3 (local LLM)

- Kendi bilgisayarınızda çalışır
- İnternet gerekmez
- Türkçe anlama kapasitesi iyi

### ÜCRETLİ

| Teknoloji | Fiyat |
|-----------|-------|
| **OpenAI GPT-4o** | ~$0.005-0.015/istek |
| **OpenAI GPT-4o-mini** | ~$0.0002/istek (10x ucuz) |
| **Gemini Pro** | $0.001-0.007/istek |
| **DeepSeek** | $0.0003-0.0014/istek (çok ucuz) |

**Tahmini Aylık Maliyet (GPT-4o-mini):**

- 10 operatör × 10 komut/gün × 22 gün = 2.200 istek/ay
- 2.200 × $0.0002 = **$0.44/ay (~15 TL)**

---

## BİLEŞEN 4 — FOTOĞRAF KARŞILAŞTIRMA

### AÇIK KAYNAK (Ücretsiz)

| Teknoloji | Yetenek | Kurulum |
|-----------|---------|---------|
| **OpenCV** | Temel karşılaştırma | Kolay |
| **CLIP (OpenAI — self-hosted)** | Anlam bazlı karşılaştırma | Orta |
| **ImageHash** | Piksel bazlı benzerlik | Çok kolay |

**En İyi Açık Kaynak:** CLIP (self-hosted)

- "Referans vs yapılan ürün" karşılaştırması için ideal
- Tamamen ücretsiz

### ÜCRETLİ

| Teknoloji | Fiyat |
|-----------|-------|
| **GPT-4o Vision** | ~$0.01/karşılaştırma |
| **Google Vision AI** | $1.50/1000 görsel |

---

## BİLEŞEN 5 — VERİTABANI & ALTYAPI

### AÇIK KAYNAK (Ücretsiz)

| Teknoloji | Yetenek | Mevcut mi? |
|-----------|---------|-----------|
| **SQLite** | Tek sunucu, hafif | ✅ Sistemde mevcut |
| **PostgreSQL** | Büyük ölçek, güçlü | Kurulum gerekir |
| **MySQL** | Yaygın, güvenilir | Kurulum gerekir |

**Öneri:** PostgreSQL'e geçiş — büyüme planı göz önünde

---

## ÖZET KARŞILAŞTIRMA TABLOSU

| Bileşen | Tam Açık Kaynak | Hibrit (mix) | Tam Ücretli |
|---------|-----------------|--------------|-------------|
| STT | Whisper (self-hosted) | Whisper API | OpenAI/Google |
| OCR | EasyOCR / PaddleOCR | EasyOCR + GPT Vision | GPT-4o Vision |
| NLP | Ollama/Llama3 | GPT-4o-mini | GPT-4o |
| Fotoğraf | CLIP (self-hosted) | CLIP + GPT Vision | GPT-4o Vision |
| **Aylık Maliyet** | **0 TL** | **~250 TL** | **~2.000 TL+** |

---

## TAVSİYE (Henüz karar değil — Komutan karar verecek)

```
SEÇENEK 1 — TAM AÇIK KAYNAK
  Maliyet   : 0 TL/ay
  Kurulum   : 2-4 hafta
  Gereksinim: Güçlü bilgisayar (GPU tercih)
  Risk      : Türkçe doğruluk %85-90

SEÇENEK 2 — HİBRİT (Önerim)
  Maliyet   : ~250-500 TL/ay
  Kurulum   : 1-2 hafta
  Gereksinim: İnternet bağlantısı
  Risk      : Az — Whisper Türkçe %92+

SEÇENEK 3 — TAM ÜCRETLİ
  Maliyet   : 2.000 TL+/ay
  Kurulum   : 1 hafta
  Gereksinim: İnternet + Bütçe
  Risk      : Internet kesilirse durur
```

**[GK:ARASTIRMA-03]**
════════════════════════════════════════════════════
