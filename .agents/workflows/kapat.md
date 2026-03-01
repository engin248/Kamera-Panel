---
description: /kapat — Görev tamamlama, doğrulama ve git push workflow'u
---

# 🔒 /kapat — Görev Kapatma Workflow'u

Her görev tamamlandığında bu workflow izlenir.

---

## ADIM 1: Tüm Raporları Topla

Her agenttan şunu iste:

```
Robot [1/2/3] → Son raporunu gönder
```

Raporlarda şunlar olmalı:

- ✅ Her tamamlanan adım
- ✅ Karşılaşılan hatalar ve çözümler
- ✅ Tamamlanma kriterleri

---

## ADIM 2: Çapraz Doğrulama

Antigravity şunları kontrol eder:

// turbo

```powershell
# Hangi dosyalar değişti?
cd C:\Users\Admin\Desktop\Kamera-Panel
git diff --name-only

# Yasak dosyalar değişti mi?
git diff --name-only | Select-String "auth.js|edit-system.js|layout.js|next.config|package.json"
# Bu komut BOŞ çıkmalı!
```

// turbo

```powershell
# Build kontrolü
cd C:\Users\Admin\Desktop\Kamera-Panel\app
npm run build 2>&1 | Select-String "Error|error" | Select-Object -First 20
```

// turbo

```powershell
# API sağlık kontrolü (server çalışıyorsa)
curl -s http://localhost:3000/api/models | python -c "import sys,json; data=json.load(sys.stdin); print(f'Models OK: {len(data)} kayıt')"
curl -s http://localhost:3000/api/personnel | python -c "import sys,json; data=json.load(sys.stdin); print(f'Personnel OK: {len(data)} kayıt')"
```

---

## ADIM 3: Kalite Kontrol Listesi

```
□ Yasak dosyalar değişmedi mi?
□ npm run build hatasız tamamlandı mı?
□ Mevcut veriler kaybolmadı mı?
□ Yeni özellik çalışıyor mu?
□ Diğer paneller bozulmadı mı?
□ Tüm agent raporları alındı mı?
□ Koordinatör onayı alındı mı?
```

---

## ADIM 4: Koordinatör Son Onayı

Koordinatöre sun:

```
═══ SON DURUM RAPORU ═══
Görev: [Ne yapıldı]
Süre: [Ne kadar sürdü]
Değişen dosyalar: [Liste]
Test: ✅ Build OK / ❌ Hata
Agentlar: Robot1 ✅ | Robot2 ✅ | Robot3 ✅
Sorunlar: [Varsa]
Tavsiye: Git push yapılabilir mi?
═══════════════════════
```

---

## ADIM 5: Git Commit & Push

// turbo

```powershell
cd C:\Users\Admin\Desktop\Kamera-Panel
git add -A
git status
```

Commit mesajı formatı:

```
[Konu]: [Ne yapıldı — kısa]

Örnek: Üretim: 21 kriter UI + CRUD endpoints eklendi
Örnek: Personel: P1-P11 form alanları DB ile senkronize edildi
Örnek: Fix: Model silme butonu soft-delete yapacak şekilde düzeltildi
```

```powershell
git commit -m "[Mesaj]"
git push origin main
```

---

## ADIM 6: Kapanış Bildirimi

```
✅ GÖREV TAMAMLANDI

[Görev adı]
Tarih: [Tarih]
Commit: [Hash]

Sonraki görev için /baslat komutu kullanın.
```
