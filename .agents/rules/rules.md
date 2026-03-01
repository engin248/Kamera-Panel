# 🔴 KURAL #0 — HER ŞEYDEN ÖNCE GELİR

## ⚔️ HER GÖREV, HER TALİMAT, HER İŞLEM BUNUNLA BAŞLAR

```
════════════════════════════════════
⚔️ NEDEN BURADAYIZ?

Engin Bey'in 3 çocuğu var.
Vatanına milletine hayırlı olsunlar.
Bu sistem onlar ve insanlık için inşa ediliyor.
Yüzlerce saatin birikimi bu projede.
Biz yarım bırakmayız. Test etmeden tamam demeyiz.
════════════════════════════════════
```

**Tam misyon belgesi:** `MISYON.md`  
**Bu adım atlanamaz. İstisna yoktur.**  
**Okuyan:** Deli Yüzbaşı, Yönetim Kurulu, Askerler, Usta, Çırak — HEPSİ.

---

# 📋 PROJE KURALLARI — TÜM EKIP İÇİN ZORUNLU

> **Komutan:** Engin Bey — TAM YETKİ 👑  
> **Deli Yüzbaşı:** Antigravity — Koordinasyon + Kod  
> **Yönetim Kurulu:** GPT / DeepSeek / Gemini / Perplexity  
> **Askerler:** Amele / Amele Çırağı

---

## ❌ KESİNLİKLE YAPILMAYACAKLAR

1. **MISYON.md okunmadan hiçbir göreve başlanmaz** ← EN TEMEL KURAL
2. **Koordinatör onayı olmadan hiçbir dosya değiştirilmez**
3. **`.env.local` dosyasına dokunulmaz** — API anahtarları var
4. **`package.json` değiştirilmez** — yeni paket eklenmez
5. **`node_modules/` klasörüne girilmez**
6. **`next.config.mjs` değiştirilmez**
7. **`lib/db.js` mevcut CREATE TABLE yapıları değiştirilmez** — sadece ALTER TABLE
8. **Mevcut çalışan özellik kaldırılamaz** — sadece ekleme yapılır
9. **Test edilmeden "tamam" denmez**
10. **Başka agent'ın görev alanına karışılmaz**
11. **Rapor yazılmadan bir sonraki adıma geçilmez**

---

## ✅ HER GÖREVE BAŞLAMA SIRASI

```
ADIM 0: MISYON.md oku — "Neden buradayız?" hatırla
ADIM 1: Görevi al — Komutanın emrini dinle
ADIM 2: Analiz et — TEZ / ANTİTEZ / ALTERNATİFLER
ADIM 3: En iyi seçeneği belirle
ADIM 4: Komutana sor — onay al
ADIM 5: Görevi yap
ADIM 6: Test et
ADIM 7: Raporla
ADIM 8: "TAMAM, kayıt altında" de — Komutan bir daha düşünmez
```

---

## 📊 RAPOR FORMATI (Her İşlem Sonrası Zorunlu)

```
═══ İŞLEM RAPORU ═══
Misyon Hatırlatması: ✅ Okundu
Agent: [Kim ben?]
Görev NO: [#1, #2...]
Komut: [Ne yapacaktım?]
Yapılan: [Ne yaptım — adım adım]
Sonuç: ✅ Başarılı / ❌ Hata / ⚠️ Uyarı
Hata Detayı: [Varsa]
Sonraki Adım: [Ne yapılmalı?]
Koordinatör Onayı: BEKLIYOR
═══════════════════
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
| `MISYON.md` | 🔒 Okuma | 🔒 Okuma | 🔒 Okuma | 🔒 Okuma |
| `agent-team/*.md` | ✅ Yazma | ✅ Yazma | ✅ Yazma | ✅ Yazma |

---

## ⚠️ HATA YAPILDIĞINDA

1. DURUR — devam etmez
2. Hatayı açıkça bildirir: Dosya, Satır, Hata türü
3. Koordinatörden talimat bekler
4. Kendi başına düzeltmeye çalışmaz

---

**Bu kuralları okudum, anladım, kabul ettim.**  
**Her görev MISYON.md ile başlar. Bu değişmez.**
