# 🎯 YÖNETİM KURULU KOORDİNASYON PANELİ

> **Proje:** Kamera-Panel — Tekstil Üretim Yönetim Sistemi  
> **Son Güncelleme:** 2026-03-01  
> **Versiyon:** 3.0 (Çok-Agent Koordinasyon Sistemi)

---

## 👥 KURUL ÜYELERİ VE ROLLERİ

| # | Üye | Araç | Rol | Yetki | API Durumu |
|---|-----|------|-----|-------|-----------|
| 👑 | **Koordinatör** | Siz | Karar Veren | TAM YETKİ | — |
| 🤖 | **Antigravity** | Bu araç | Analizci + Kod Yazıcı | Yazma ✅ | Dahili |
| 🤖 | **Robot 1** | Open Agent Manager → GPT | Doküman & İnsan Analisti | Rapor yazma | ✅ OpenAI |
| 🤖 | **Robot 2** | Open Agent Manager → DeepSeek | Kod Denetçi | Rapor yazma | ❌ Eksik |
| 🤖 | **Robot 3** | Open Agent Manager → Gemini | Analizci & Çapraz Kontrol | Rapor yazma | ❌ Eksik |

---

## 🔄 ÇALIŞMA SİSTEMİ

```
SİZ (Koordinatör)
    │
    ▼
ANTİGRAVİTY (Bu araç)
 ├─ Fikri alır
 ├─ Akademik analiz yapar (Tekstil Uzman Skill)
 ├─ Tez/Antitez/Alternatifler sunar
 ├─ Onay bekler
 │
 ▼ (Onay gelince)
 ├─ Görevi alt görevlere böler
 ├─ Her robota NET talimat yazar
 ├─ Open Agent Manager'a kopyalanacak talimatları hazırlar
 │
 ▼ (Siz kopyalarsınız)
ROBOT 1 (GPT) → İnsan analizi yapar → Rapor yazar
ROBOT 2 (DeepSeek) → Kod denetler → Rapor yazar  
ROBOT 3 (Gemini) → Çapraz kontrol eder → Rapor yazar
    │
    ▼
ANTİGRAVİTY → Real-time kontrol
    │
    ▼
SİZ → Son onay → Yeni görev planlaması
```

---

## 📁 DOSYA YAPISI

```
.agents/
├── rules/
│   └── rules.md              ← TÜM KURALLAR (her agent okur)
│
├── skills/
│   └── tekstil-analiz/
│       └── SKILL.md          ← Akademik analiz çerçevesi
│
└── workflows/
    ├── baslat.md             ← /baslat komutu — görev başları
    ├── kapat.md              ← /kapat komutu — görev kapanır
    ├── robot1-gpt-talimat.md
    ├── robot2-deepseek-talimat.md
    └── robot3-gemini-talimat.md

agent-team/
├── KURALLAR.md
├── PROJE_OZET.md
├── TALIMAT_GPT.md
├── TALIMAT_GEMINI.md
├── TALIMAT_DEEPSEEK.md
├── TALIMAT_PERPLEXITY.md
└── kurul-rapor-*.md
```

---

## 🔑 EKSİK API KEY'LER

Şu robotlar API key bekliyor:

| Robot | Platform | URL | Ücret |
|-------|----------|-----|-------|
| **Robot 2** (DeepSeek) | platform.deepseek.com | <https://platform.deepseek.com/api_keys> | Çok ucuz (~$0.001/1K token) |
| **Robot 3** (Gemini) | aistudio.google.com | <https://aistudio.google.com/app/apikey> | Ücretsiz tier var |

**`.env.local` dosyasına eklenecek:**

```
DEEPSEEK_API_KEY=sk-...
GEMINI_API_KEY=AI...
```

---

## 📊 GÖREV TAKİP TABLOSU

| Görev | Durum | Sorumlu | Tamamlanma |
|-------|-------|---------|-----------|
| Üretim Penceresi — 21 Kriter | ✅ Tamamlandı | Antigravity | 2026-02-28 |
| Model Beden & Dikim Operasyonları | ✅ Tamamlandı | Antigravity | 2026-02-28 |
| WAL/SHM gitignore | ✅ Tamamlandı | Antigravity | 2026-02-28 |
| Çok-Agent Koordinasyon Sistemi | ✅ Tamamlandı | Antigravity | 2026-03-01 |
| **Sonraki Görev** | ⏳ Bekliyor | — | — |

---

## 🚦 KARAR NOKTASI PROTOKOLÜ

Her karar noktasında şu format kullanılır:

```
🟡 KARAR GEREKİYOR

Konu: [Ne hakkında karar verilecek]
Seçenek A: [Açıklama] → Avantaj: [...] Risk: [...]
Seçenek B: [Açıklama] → Avantaj: [...] Risk: [...]
Tavsiyem: [Hangi seçenek ve neden]

Koordinatör kararı:  [ ] A  [ ] B  [ ] Başka: ___
```

---

## ⚡ HIZLI KOMUTLAR

| Komut | Ne Yapar |
|-------|----------|
| `/baslat` | Yeni görev başlat — analiz + plan + dağıtım |
| `/kapat` | Mevcut görevi kapat — test + commit + push |
| `/durum` | Anlık durum raporu — hangi görev nerede |
| `/kontrol` | Yazılan kodu kontrol et — robotlara talimat |
| `/analiz [konu]` | Derinlemesine akademik analiz — koda geçmeden önce |
