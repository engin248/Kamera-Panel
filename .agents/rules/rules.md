# 🔴 PROJE KURALLARI — TÜM AGENT'LAR İÇİN ZORUNLU

> **Proje:** Kamera-Panel — Tekstil Üretim Yönetim Sistemi  
> **Koordinatör:** Kullanıcı (Siz) — TAM YETKİ 👑  
> **Kod Yazıcı:** Antigravity (Claude) — YAZMA YETKİSİ ✅  
> **Yardımcılar:** Open Agent Manager'daki 3 Robot (GPT / DeepSeek / Gemini)

---

## ❌ KESİNLİKLE YAPILMAYACAKLAR

1. **KOORDİNATÖR ONAYI OLMADAN HİÇBİR DOSYA DEĞİŞTİRİLMEZ**
2. **`.env.local` dosyasına DOKUNULMAZ** — API anahtarları var
3. **`package.json` DEĞİŞTİRİLMEZ** — yeni paket eklenmez
4. **`node_modules/` klasörüne GİRİLMEZ**
5. **`next.config.mjs` DEĞİŞTİRİLMEZ**
6. **`lib/db.js` mevcut CREATE TABLE yapıları DEĞİŞTİRİLMEZ** — sadece ALTER TABLE eklenebilir
7. **Mevcut çalışan özellik KALDIRILAMAZ** — sadece ekleme yapılır
8. **Test edilmeden "tamam" DENİLMEZ**
9. **Başka agent'ın görev alanına KARIŞILMAZ**
10. **Rapor YAZILMADAN bir sonraki adıma GEÇİLMEZ**

---

## ✅ HER AGENT'IN UYACAĞI GENEL KURALLAR

1. Her işlem öncesi görevi OKU ve anla
2. Her işlem sonrası **RAPOR YAZ** (ne yaptım → ne oldu → sonuç)
3. Hata olursa DURUR — devam etmez — bildirir
4. Emin olmadığın konuda SORMADAN ilerleme
5. Koordinatör onayı olmadan sonraki adıma GEÇİLMEZ

---

## 📋 İŞ AKIŞI (4 AŞAMA)

```
AŞAMA 1 — ANALİZ (Antigravity + Koordinatör)
  Koordinatör fikir/görev verir
  → Antigravity akademik derinlikte analiz eder
  → Tez / Antitez / Sentez sunar
  → Koordinatör onaylar VEYA değiştirir

AŞAMA 2 — GÖREV DAĞITIMI (Antigravity → Agentlar)
  Onaylanan plan bölümlere ayrılır
  → Her agent'a NET talimat yazılır
  → Talimatlar workflow dosyasına kaydedilir
  → Agentlar harekete geçer

AŞAMA 3 — PARALEL ÇALIŞMA
  Agentlar görevi yapar → Her adımda RAPOR yazar
  Kontrol Agent'ı raporları denetler
  Antigravity real-time kontrol eder
  Koordinatör yeni görevleri planlar

AŞAMA 4 — DOĞRULAMA
  Tüm raporlar toplanır
  Çapraz doğrulama yapılır
  Koordinatör son onayı verir
  Git commit & push yapılır
```

---

## 🔒 DOSYA ERİŞİM TABLOSU

| Dosya | Antigravity | Robot 1 (GPT) | Robot 2 (DeepSeek) | Robot 3 (Gemini) |
|-------|-------------|---------------|---------------------|------------------|
| `app/page.js` | ✅ Yazma | 🔒 Okuma | 🔒 Okuma | 🔒 Okuma |
| `app/api/*` | ✅ Yazma | ❌ | 🔒 Okuma | ❌ |
| `lib/db.js` | ✅ Yazma (dikkatli) | ❌ | 🔒 Okuma | ❌ |
| `.env.local` | ❌ | ❌ | ❌ | ❌ |
| `package.json` | ❌ | ❌ | ❌ | ❌ |
| `agent-team/*.md` | ✅ Yazma | ✅ Yazma | ✅ Yazma | ✅ Yazma |
| `.agents/**` | ✅ Yazma | 🔒 Okuma | 🔒 Okuma | 🔒 Okuma |

---

## ⚠️ HATA YAPILDIĞINDA

1. DURUR — devam etmez
2. Hatayı açıkça bildirir: Dosya, Satır, Hata türü
3. Koordinatörden talimat bekler
4. Kendi başına düzeltmeye ÇALIŞMAZ

---

## 📊 RAPOR FORMATI (Her İşlem Sonrası Zorunlu)

```
═══ İŞLEM RAPORU ═══
Agent: [Kim ben?]
Görev NO: [#1, #2...]
Komut: [Ne yapacaktım?]
Yapılan: [Ne yaptım — adım adım]
Sonuç: ✅ Başarılı / ❌ Hata / ⚠️ Uyarı
Hata Detayı: [Varsa]
Süre: [Yaklaşık]
Sonraki Adım: [Ne yapılmalı?]
Koordinatör Onayı: BEKLIYOR
═══════════════════
```
