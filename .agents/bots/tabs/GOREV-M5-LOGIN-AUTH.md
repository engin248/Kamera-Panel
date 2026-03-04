# GÖREV M5 — Login ve Auth Sistemi

**Zorluk:** ⭐⭐⭐ Zor  
**Sorumlu:** _____________

---

## Sorun

Auth bypass dev modda açık — production'da login gerekli ama login sayfası yok.

## Yapılacak

### 1. Login sayfası oluştur

Yeni dosya: `app/app/login/page.js`

- Kullanıcı adı input
- Şifre input
- Giriş butonu
- Hata mesajı gösterimi
- POST `/api/auth/login` endpoint'ine gönder

### 2. Auth login API

Yeni dosya: `app/app/api/auth/login/route.js`

- POST: username + password al
- `personnel` tablosundan kontrol et
- Başarılı: session cookie oluştur
- Başarısız: hata döndür

### 3. Personnel tablosuna şifre ekle

Supabase SQL Editor'da:

```sql
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS password_hash TEXT;
UPDATE personnel SET password_hash = 'admin123' WHERE role = 'koordinator';
```

### 4. Middleware

Yeni dosya: `app/middleware.js`

- Session cookie kontrolü
- Cookie yoksa `/login`'e yönlendir
- `/api/*` ve `/login` hariç tüm sayfalar korumalı

### 5. Rol bazlı menü

`app/page.js` — Sidebar fonksiyonunda:

- `operator` rolü: sadece Üretim Giriş görsün
- `ustabasi`: Üretim + İmalat görsün
- `koordinator`: hepsini görsün

## Test

- [ ] `/login` sayfası açılıyor
- [ ] Yanlış şifre → hata mesajı
- [ ] Doğru şifre → ana sayfa
- [ ] Cookie silince → login'e yönlendir
- [ ] Operator menüde sadece Üretim Giriş görüyor

## DOKUNMA

İmalat API'lerine ve Muhasebe hesaplama koduna DOKUNMA!
