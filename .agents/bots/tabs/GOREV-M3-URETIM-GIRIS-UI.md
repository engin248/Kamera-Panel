# GÖREV M3 — Üretim Giriş UI

**Zorluk:** ⭐⭐ Orta  
**Sorumlu:** _____________

---

## Sorun

`/api/uretim-giris` API'si var ama arayüzde karşılığı yok. Personel günlük üretim girişi yapamıyor.

## Yapılacak

### 1. renderPage switch'e ekle

Dosya: `app/page.js` — `renderPage` fonksiyonu içinde:

```javascript
case 'uretim-giris':
  return <UretimGirisPage models={models} personnel={personnel} addToast={addToast} />;
```

### 2. Sidebar'a buton ekle

Dosya: `app/page.js` — `uretimItems` dizisine:

```javascript
{ id: 'uretim-giris', icon: '📝', label: 'Üretim Giriş' },
```

### 3. UretimGirisPage bileşeni yaz

Dosya: `app/page.js` — dosya sonuna ekle

Bileşen içeriği:

- Personel seç (dropdown)
- Model seç (dropdown)
- Operasyon seç
- Üretim adedi (input number)
- Hatalı adet (input number)
- Kaydet butonu → POST `/api/uretim-giris`

### 4. POST body formatı

```json
{
  "personnel_id": 5,
  "model_id": 12,
  "operation_id": 3,
  "total_produced": 150,
  "defective_count": 2,
  "date": "2026-03-04"
}
```

## Test

- [ ] Sidebar'da "📝 Üretim Giriş" butonu var
- [ ] Sayfa açılıyor
- [ ] Form doldur → Kaydet → toast mesajı geldi
- [ ] `/api/production` çağrısında yeni kayıt görünüyor

## DOKUNMA

`app/api/imalat/*` ve Muhasebe bölümüne DOKUNMA — başka kolun işi!
