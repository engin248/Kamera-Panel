---
description: Görev tamamlama, doğrulama ve git push workflow'u
---

# 🔒 /kapat — Görev Kapatma Workflow'u

Her görev tamamlandığında bu workflow izlenir.

---

## ADIM 1: DOĞRULAMA

// turbo

```powershell
# Hangi dosyalar değişti?
cd C:\Users\Admin\Desktop\Kamera-Panel
git diff --name-only

# Yasak dosyalar değişti mi?
git diff --name-only | Select-String "\.env|package\.json|next\.config"
# Bu komut BOŞ çıkmalı!
```

---

## ADIM 2: API SAĞLIK KONTROLÜ

// turbo

```powershell
# Temel API'ler çalışıyor mu?
curl -s http://localhost:3000/api/models | python -c "import sys,json; d=json.load(sys.stdin); print(f'✅ Models: {len(d)} kayit')" 2>&1
curl -s http://localhost:3000/api/personnel | python -c "import sys,json; d=json.load(sys.stdin); print(f'✅ Personnel: {len(d)} kayit')" 2>&1
curl -s http://localhost:3000/api/orders | python -c "import sys,json; d=json.load(sys.stdin); print(f'✅ Orders: {len(d)} kayit')" 2>&1
```

---

## ADIM 3: KALİTE KONTROL LİSTESİ

```
□ Yasak dosyalar değişmedi mi?
□ API'ler sağlıklı mı?
□ Mevcut veriler kaybolmadı mı?
□ Yeni özellik çalışıyor mu?
□ Diğer paneller bozulmadı mı?
□ Mimari .md dosyaları güncellendi mi?
```

---

## ADIM 4: MİMARİ GÜNCELLE (Eğer Güncellenmemişse)

Değişikliğe göre:

| Ne Değişti? | Güncelle |
|-------------|----------|
| Yeni API endpoint | `.agents/architecture/SISTEM-MIMARI.md` |
| Yeni DB sütun/tablo | `.agents/architecture/VERITABANI.md` |
| Bot prompt değişikliği | `.agents/architecture/BOT-SISTEMI.md` + bots/ |
| Sekme özelliği | `.agents/architecture/PANEL-SEKMELERI.md` |
| Yeni kural | `.agents/rules/rules.md` |

---

## ADIM 5: GİT COMMIT

// turbo

```powershell
cd C:\Users\Admin\Desktop\Kamera-Panel
git add -A
git status
```

Commit mesajı formatı:

```
[Konu]: [Ne yapıldı — kısa]

Örnek: Personel: P11 operatör sınıfı eklendi, PANEL-SEKMELERI güncellendi
Örnek: Bot: Kamera prompt güncellendi, BOT-SISTEMI güncellendi
```

```powershell
git commit -m "[Mesaj]"
```

---

## ADIM 6: 🔴 PUSH ONAYI — ENGİN BEY'E SOR

> **⚠️ GIT PUSH HİÇBİR ZAMAN OTOMATİK ÇALIŞMAZ.**  
> Push yapmadan önce Engin Bey'e mutlaka sor.

Kullanıcıya göster:

```
═══ PUSH ONAYI ═══
Değişen dosyalar: [git status özeti]
Commit mesajı: [mesaj]

GitHub'a push yapılsın mı? (Evet / Hayır)
═════════════════
```

Onay gelirse:

```powershell
git push origin main
```

Onay gelmezse: Push yapma, commit lokalde kalsın.

---

## ADIM 7: KAPANIŞ BİLDİRİMİ

```
✅ GÖREV TAMAMLANDI

[Görev adı]
Tarih: [Tarih]
Commit: [Hash]
Push: ✅ Yapıldı / ⏳ Bekliyor (Engin Bey onayı)
Mimari Güncellendi: ✅

Sonraki görev için /baslat komutu kullanın.
```
