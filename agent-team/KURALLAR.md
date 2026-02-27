# 🔴 PROJE KURALLARI — TÜM AGENT'LAR İÇİN ZORUNLU

**Bu kurallar KESİNDİR. İstisna YOKTUR.**

---

## ❌ KESİNLİKLE YAPILMAYACAKLAR

1. **KOORDİNATÖR ONAYI OLMADAN HİÇBİR DOSYA DEĞİŞTİRİLMEZ**
2. **`.env` dosyasına DOKUNULMAZ** — içinde API anahtarları ve gizli bilgiler var
3. **`package.json` DEĞİŞTİRİLMEZ** — yeni paket eklenmez, versiyon değiştirilmez
4. **`node_modules/` klasörüne GİRİLMEZ**
5. **`next.config.js` DEĞİŞTİRİLMEZ**
6. **`lib/db.js` içindeki mevcut CREATE TABLE yapıları DEĞİŞTİRİLMEZ** — sadece ALTER TABLE ile yeni sütun eklenebilir
7. **Mevcut çalışan bir özellik KALDIRILAMAZ** — sadece yeni ekleme yapılabilir
8. **Resmi daire, devlet, KKD, İSG belgesi konularına GİRİLMEZ** — bu İÇ DÜZEN paneli
9. **Başka agent'ın görev alanına KARIŞILMAZ**
10. **Test edilmeden "tamam" DENİLMEZ**

---

## ✅ HER AGENT'IN UYACAĞI GENEL KURALLAR

1. Önce `PROJE_OZET.md` oku — projeyi anla
2. Sonra kendi talimatını oku — görevini anla
3. Görev dışı iş yapma
4. Rapor formatına uy
5. Emin olmadığın konuda Koordinatöre sor — tahmin etme
6. Her çıktının sonunda "Koordinatör onayı gerekir" yaz

---

## 🎯 PANELİN AMACI — HER AGENT BİLMELİ

Bu panel İŞLETME İÇİ bir sistemdir:
- İnsanları DOĞRU tanımak
- DOĞRU işi doğru kişiye vermek
- Çalışanların MUTLU ve VERİMLİ olmasını sağlamak
- ADİL ücretlendirme ve ŞEFFAF kazanç dağıtımı yapmak
- Çalışanı da çalışmayanı da BELİRLEMEK

**Bu panel şunları YAPMAZ:**
- Resmi rapor üretmez
- Devlet dairesine bilgi vermez
- İşe alım/çıkarma kararı almaz

---

## 🔒 DOSYA ERİŞİM TABLOSU

| Dosya | Claude (Kod) | Gemini (Analiz) | GPT (Doküman) | Perplexity (Araştırma) |
|-------|-------------|-----------------|---------------|----------------------|
| `app/page.js` | Yazma ✅ | Okuma 🔒 | Okuma 🔒 | ❌ |
| `app/api/*` | Yazma ✅ | Okuma 🔒 | ❌ | ❌ |
| `lib/db.js` | Yazma ✅ (dikkatli) | Okuma 🔒 | ❌ | ❌ |
| `.env` | ❌ | ❌ | ❌ | ❌ |
| `package.json` | ❌ | ❌ | ❌ | ❌ |
| `agent-team/*` | ❌ | ❌ | ❌ | ❌ |
| Dokümanlar (.md) | ❌ | Yazma ✅ | Yazma ✅ | ❌ |

---

## ⚠️ HATA YAPTIĞINDA

1. DURUR — devam etmez
2. Hatayı açıkça bildirir
3. Koordinatörden talimat bekler
4. Kendi başına düzeltmeye ÇALIŞMAZ (daha çok bozabilir)

---

## 📋 İŞ AKIŞI

```
Koordinatör görev verir
  → İlgili agent çalışır
    → Sonucu Koordinatöre sunar
      → Koordinatör onaylar veya düzeltme ister
        → Onay olmadan bir sonraki adıma GEÇİLMEZ
```

**Her adım Koordinatör onayına bağlıdır. Otonom karar ALINMAZ.**
