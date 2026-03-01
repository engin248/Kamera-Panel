# 🤖 BOT SİSTEMİ — KAMERA-PANEL

> **Vizyon:** Her panel sekmesinin kendi uzman botu vardır.  
> Botlar sohbet yoluyla veriyi okur, yorum yapar, değişiklik önerir.  
> **Son Güncelleme:** 2026-03-01

---

## 🎯 BOT MİMARİSİ

```
Kullanıcı Sorusu
      │
      ▼
ChatbotPanel (page.js)
      │
      ▼
POST /api/chatbot
  { message, history, bot: 'gemini'|'gpt'|'perplexity'|'deepseek' }
      │
      ▼
chatbot/route.js
  → DB'den fabrika verisi çek (anlık özet)
  → Bot konfigürasyonu seç (BOT_CONFIGS)
  → Seçilen AI API'sine gönder
      │
      ▼
AI yanıtı → Kullanıcıya
```

---

## 🤖 BOTLAR

### 1. 🔩 KAMERA — Operasyon Uzmanı

| Özellik | Değer |
|---------|-------|
| **Bot ID** | `gemini` |
| **AI Motoru** | Google Gemini 2.0 Flash |
| **API Key** | `GEMINI_API_KEY` |
| **Aktif Sekmeler** | Üretim, Siparişler, Personel, Dashboard |
| **Uzmanlık** | Anlık üretim takibi, günlük hedefler, sipariş durumu, personel performansı |
| **Karakter** | Net, hızlı, kesin sayılar. Kısa cevap (max 3-4 satır) |
| **Veri Bağlamı** | Bugünkü üretim, aktif siparişler, personel sayısı, geciken siparişler |

**Örnek sorular:**

- "Bugün ne kadar üretildi?"
- "Geciken sipariş var mı?"
- "Kaç personel aktif?"

---

### 2. 📊 MUHASİP — Finans Uzmanı

| Özellik | Değer |
|---------|-------|
| **Bot ID** | `gpt` |
| **AI Motoru** | OpenAI GPT-4o-mini |
| **API Key** | `OPENAI_API_KEY` |
| **Aktif Sekmeler** | Maliyet, Rapor & Analiz, Fason, Prim |
| **Uzmanlık** | Maliyet analizi, karlılık hesabı, maaş-verimlilik oranı, giderler |
| **Karakter** | Profesyonel, analitik. Yüzde hesap yapar. Max 5-6 cümle |
| **Veri Bağlamı** | Bu ay giderler, personel maaşları, model fiyatları |

**Örnek sorular:**

- "Bu ay karlılık nasıl?"
- "Personel maliyeti üretimi karşılıyor mu?"
- "Sipariş başı kar/zarar?"

---

### 3. 🔍 KAŞİF — Araştırma Uzmanı

| Özellik | Değer |
|---------|-------|
| **Bot ID** | `perplexity` |
| **AI Motoru** | Perplexity Sonar (llama-3.1-sonar-small-128k-online) |
| **API Key** | `PERPLEXITY_API_KEY` |
| **Aktif Sekmeler** | Tüm sekmeler (araştırma modu) |
| **Uzmanlık** | Tekstil sektörü, kumaş/iplik piyasaları, rakip analizi, trendler |
| **Karakter** | Meraklı, araştırmacı. Kaynak belirtir. Max 6-7 cümle |
| **Veri Bağlamı** | Fabrika özeti + güncel internet verisi |

**Örnek sorular:**

- "Pamuk fiyatı bu ay nasıl?"
- "Türkiye tekstil ihracatı trendi?"
- "Bu bölgede fason fiyat ortalaması?"

---

### 4. 🛠️ TEKNİKER — Teknik Uzman

| Özellik | Değer |
|---------|-------|
| **Bot ID** | `deepseek` |
| **AI Motoru** | DeepSeek Chat |
| **API Key** | `DEEPSEEK_API_KEY` |
| **Aktif Sekmeler** | Modeller, Kalite Kontrol, Makineler |
| **Uzmanlık** | Model teknik detayları, BOM, dikim operasyonları, makine seçimi, kalite |
| **Karakter** | Teknik, metodolojik. Adım adım açıklar. Max 5-6 cümle |
| **Veri Bağlamı** | Model listesi, operasyon detayları |

**Örnek sorular:**

- "Bu modelde BOM eksik mi?"
- "Dikim sırası doğru mu?"
- "Hata oranı neden yüksek?"

---

## 📍 SEKME-BOT EŞLEŞME HARİTASI

| Sekme | Bot ID | Neden Bu Bot? |
|-------|--------|---------------|
| `models` | `deepseek` (Tekniker) | Teknik model detayları, BOM, operasyon tanımları |
| `personnel` | `gemini` (Kamera) | Anlık personel durumu, giriş/çıkış, performans |
| `production` | `gemini` (Kamera) | Günlük üretim takibi, OEE, hedef |
| `costs` | `gpt` (Muhasip) | Maliyet analizi, kar/zarar hesabı |
| `muhasebe` | `gpt` (Muhasip) | Raporlama ve finansal analiz |
| `orders` | `gemini` (Kamera) | Sipariş durumu, teslimat takibi |
| `quality` | `deepseek` (Tekniker) | Kalite standartları, hata analizi |
| `fason` | `gpt` (Muhasip) | Fason maliyet karşılaştırması |
| `shipments` | `gemini` (Kamera) | Sevkiyat takibi |
| `prim` | `gpt` (Muhasip) | Prim hesabı, teşvik sistemi |
| `machines` | `deepseek` (Tekniker) | Makine bakım, ayar şablonları |
| `customers` | `gemini` (Kamera) | Müşteri sipariş geçmişi |
| `reports` | `gpt` (Muhasip) | Finansal raporlar, trendler |
| `dashboard` | `gemini` (Kamera) | Genel fabrika özeti |

> **NOT:** Gelecekte her sekmenin kendi ayrı chatbot instance'ı olacak.  
> Şu an her sekme aynı ChatbotPanel'i kullanıyor, bot ID otomatik seçilebilir.

---

## 🔧 BOT ENTEGRASYON YOLU

### Mevcut Yapı (v1)

```
Tek ChatbotPanel → Kullanıcı bot seçer → API'ye gönderir
```

### Hedef Yapı (v2 — Sekme Botları)

```
Her Sekme → Kendi BotPanel'i → O sekmenin verisi bağlamda → Otomatik bot seçimi
```

**Yapılması Gerekenler:**

- [ ] Her sekme bileşenine `BotPanel` prop'u ekle
- [ ] Sekme açıldığında bot otomatik başlasın
- [ ] O sekmenin DB verisi bota bağlam olarak verilsin
- [ ] Bot sohbet geçmişi sekme bazında ayrı tutulsun
- [ ] Bot, o sekmedeki veriyi değiştirebilsin (CRUD)

---

## 🗃️ BOT VERİ BAĞLAMI (Şu An)

`/api/chatbot` her çağrıda şu veriyi çeker:

```javascript
// Aktif siparişler (10 adet, teslimat sıralı)
const orders = db.prepare(`SELECT ... WHERE status NOT IN ('tamamlandi','iptal') LIMIT 10`).all();

// Bugünkü üretim kayıtları
const uretim = db.prepare(`SELECT ... WHERE DATE(created_at) = ? LIMIT 20`).all(today);

// Genel istatistikler
const personelSayisi = ... // aktif personel
const modelSayisi = ...    // aktif model
const geciken = ...        // geciken sipariş
const maliyet = ...        // bu ay gider
const personelMaas = ...   // toplam maaş
const modeller = ...       // son 5 model
```

---

## ⚠️ GELECEKTEKİ BOT KAYDEDİLEBİLİRLİK SİSTEMİ

Engin Bey'in hedefi: Bot ile sohbet ederek veri değiştirebilmek.

**Örnek akış:**

1. "Ahmet'in haftanın notunu güncelle: Bu hafta çok iyi performans gösterdi"
2. Bot → NLP ile anlar → `PUT /api/personnel/:id` çağırır
3. Değişiklik `audit_trail`'e kaydedilir
4. Kullanıcıya onay gösterilir

**Güvenlik:** Bot hiçbir zaman onaysız yazma yapamaz.

---

## 📝 GÜNCELLEME KURALI

Bu dosyayı şu durumlarda güncelle:

- Yeni bot eklendiyse
- Bot-sekme eşleşmesi değiştiyse
- Bot prompt'ları değiştiyse
- Yeni veri bağlamı eklendiyse
