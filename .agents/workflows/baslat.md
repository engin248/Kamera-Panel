---
description: Yeni bir geliştirme görevi başlatmak — analiz et, planla, agentlara dağıt
---

# 🚀 /baslat — Görev Başlatma Workflow'u

Bu workflow, her yeni geliştirme görevinde izlenecek adımları tanımlar.

---

## AŞAMA 1: ANALİZ (Antigravity yapar)

Koordinatör fikir/görev verir. Antigravity şunu yapar:

### 1.1 Fikri Yapılandır

Koordinatörün fikrini şu formata dök:

```
GÖREV: [Ne yapılacak — 1 cümle]
KAPSAM: [Hangi dosyalar etkilenecek]
AMAÇ: [Bu neden yapılıyor — işletme değeri]
```

### 1.2 Akademik Analiz Yap

Her görev için şu 6 boyutu raporla:

```
📌 TEZ: Bu fikir neden doğru?
   → Artıları, faydaları, destekleyen kanıtlar

📌 ANTİTEZ: Bu fikrin riskleri neler?
   → Eksileri, riskler, dikkat edilmesi gerekenler

📌 DÜNYA GENELİ: Bu konuda dünyada ne yapılıyor?
   → Benzer sistemler, best practices, sektör standartları

📌 TEKNİK ANALİZ: Bu nasıl implement edilir?
   → DB değişiklikleri, API değişiklikleri, UI değişiklikleri
   → Etkilenen dosyalar, risk seviyesi

📌 ALTERNATİFLER: Başka yollar var mı?
   → Seçenek A vs Seçenek B karşılaştırması

📌 TAVSİYE: En doğru yol hangisi ve neden?
```

### 1.3 Koordinatör Onayı Bekle

Analiz sunulur. Koordinatör:

- ✅ Onayla → Aşama 2'ye geç
- ✏️ Değiştir → Analizi güncelle
- ❌ Reddet → Görev iptal

---

## AŞAMA 2: GÖREV PLANLAMA (Antigravity yapar)

### 2.1 Görevi Alt Görevlere Böl

```
GÖREV #1: [Ne yapılacak — tek cümle]
  Sorumlu: Robot 1 (GPT) / Robot 2 (DeepSeek) / Robot 3 (Gemini) / Antigravity
  Dosyalar: [Hangi dosyalara dokunulacak]
  Süre: [Tahmini]
  Bağımlılık: [Hangi görev bitmeden başlayamaz]

GÖREV #2: ...
GÖREV #3: ...
```

### 2.2 Kontrol Planla

```
KONTROL #1 → Görev #1 biter bitmez
  Kim kontrol eder: [Antigravity + Robot X]
  Ne kontrol edilir: [Kriterler]

KONTROL #2 → Görev #2 biter bitmez
  ...
```

### 2.3 Koordinatör Onayı Bekle

Plan onaylanmadan agentlar harekete geçmez.

---

## AŞAMA 3: GÖREV DAĞITIMI (Antigravity → Agentlar)

Her agent için şu formatta talimat yaz ve Open Agent Manager'da ilgili agenta kopyala:

```
═══ ROBOT [1/2/3] TALİMATI — GÖREV #[N] ═══

SEN KİMSİN: [GPT → Doküman/Analiz | DeepSeek → Kod Denetim | Gemini → Analiz]
PROJE: Kamera-Panel (C:\Users\Admin\Desktop\Kamera-Panel)
GÖREV NO: #[N]

YAPACAKLARIN:
1. [Adım 1]
2. [Adım 2]
3. [Adım 3]

YAPAMAYACAKLARIN:
❌ Kod yazma/değiştirme
❌ Dosya silme
❌ [Göreve özgü kısıtlamalar]

RAPOR FORMATI:
[Her adım sonrası rapor yaz — bkz. rules.md]

TAMAMLAMA KRİTERLERİ:
□ [Kriter 1]
□ [Kriter 2]
□ [Kriter 3]
═══════════════════════════════════
```

---

## AŞAMA 4: PARALEL YÖNETİM

Agentlar çalışırken Antigravity şunu yapar:

```
┌─────────────────────────────────────┐
│ SOL: Agentların raporlarını incele  │
│      Her raporu real-time kontrol   │
│      Hata varsa dur ve bildir       │
└─────────────────────────────────────┘
         AYNI ANDA
┌─────────────────────────────────────┐
│ SAĞ: Koordinatörle sonraki görevi   │
│      planla                         │
│      Yeni analiz hazırla            │
└─────────────────────────────────────┘
```

---

## AŞAMA 5: DOĞRULAMA VE KAPANIŞ

// turbo
Tüm görevler bitince:

```powershell
# Değişen dosyaları gör
cd C:\Users\Admin\Desktop\Kamera-Panel
git diff --name-only

# Build test
cd app
npm run build

# API test
curl http://localhost:3000/api/models
curl http://localhost:3000/api/personnel
```

Sonra:

- Git commit mesajı yaz
- Push yap
- Koordinatöre son rapor sun
