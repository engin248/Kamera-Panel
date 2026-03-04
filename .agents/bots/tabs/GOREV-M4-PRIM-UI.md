# GÖREV M4 — Prim UI Sayfası

**Zorluk:** ⭐⭐⭐ Zor  
**Sorumlu:** _____________

---

## Sorun

`/api/prim?ay=3&yil=2026` API'si çalışıyor (200 OK) ama UI ekranı yok. Personel prim hesaplaması görüntülenemiyor.

## Yapılacak

### 1. renderPage switch'e ekle

Dosya: `app/page.js` — `renderPage` fonksiyonu (zaten sidebar'da `prim` id'si var):

```javascript
case 'prim':
  return <PrimPage models={models} personnel={personnel} addToast={addToast} />;
```

### 2. PrimPage bileşeni yaz

Dosya: `app/page.js` — dosya sonuna ekle

Bileşen içeriği:

- **Ay/Yıl seçici** (2 dropdown)
- Veri çek: `fetch('/api/prim?ay=' + ay + '&yil=' + yil)`
- **KPI kartları:** Toplam prim, Ort prim, En yüksek prim, Personel sayısı
- **Tablo:** Personel adı | Brüt maaş | SGK | Net maaş | Üretim adedi | Prim tutarı | Toplam
- **Toplam satırı:** Tüm primlerin toplamı

### 3. Veri formatı (API'den dönen)

```json
[
  {
    "personnel_id": 5,
    "personnel_name": "Ahmet",
    "brut_maas": 25000,
    "sgk_kesinti": 5625,
    "net_maas": 19375,
    "uretim_adedi": 450,
    "prim_tutari": 1200,
    "toplam": 20575
  }
]
```

### 4. Opsiyonel: PDF export

- Prim tablosunu PDF olarak indirme butonu

## Test

- [ ] Sidebar → Prim & Üret tıkla → sayfa açılıyor
- [ ] Ay seç → tablo güncelleniyor
- [ ] KPI kartları dolu
- [ ] Tablo satırları doğru hesaplanmış
- [ ] Toplam satırı doğru

## DOKUNMA

İmalat API'lerine ve Muhasebe bölümüne DOKUNMA!
