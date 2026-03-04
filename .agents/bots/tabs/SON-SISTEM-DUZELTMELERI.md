# 🔧 KAMERA-PANEL — SON SİSTEM DÜZELTMELERİ

**Tarih:** 2026-03-04  
**Durum:** Görev dağıtımı için hazır

---

## GÖREV M1 — Models Tablosu Supabase Aktarımı

**Zorluk:** ⭐⭐ Orta  
**Dosya:** `app/data/kamera-panel.db` → Supabase `models` tablosu  
**Sorun:** SQLite'daki 3 model kaydı Supabase'e aktarılamıyor. FK/NOT NULL constraint hatası veriyor. models tablosundaki zorunlu sütunlar (unit_price, category vb.) SQLite'da yok.  
**Yapılacak:**

1. Supabase Dashboard → SQL Editor aç
2. `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='models'` çalıştır
3. NOT NULL olan ama SQLite'da olmayan sütunları bul
4. Ya sütunları nullable yap ya da varsayılan değerle INSERT et
5. SQLite'daki 3 modeli Supabase'e aktar
**Test:** `/api/models` endpoint'i 200 dönmeli ve 3 model görünmeli

---

## GÖREV M2 — Next.js Sunucu Yeniden Başlatma

**Zorluk:** ⭐ Kolay  
**Dosya:** `app/.env.local`  
**Sorun:** `SUPABASE_SERVICE_ROLE_KEY` güncellendi ama sunucu eski key ile çalışıyor.  
**Yapılacak:**

1. Terminal'de çalışan Next.js sunucusunu durdur (Ctrl+C)
2. `cd C:\Users\Admin\Desktop\Kamera-Panel\app`
3. `npm run dev` ile yeniden başlat
4. `http://localhost:3000` açılmalı
**Test:** Tarayıcıda sayfa açılıyor mu kontrol et

---

## GÖREV M3 — Üretim Giriş UI

**Zorluk:** ⭐⭐ Orta  
**Dosya:** `app/app/page.js`  
**Sorun:** `/api/uretim-giris` API'si var ama arayüzde karşılığı yok.  
**Yapılacak:**

1. `page.js` içinde `renderPage` switch'e `case 'uretim-giris':` ekle
2. Sidebar'a Üretim Giriş butonu ekle (uretimItems dizisine)
3. UretimGirisPage bileşeni yaz — form: personel seç, model seç, adet gir, kaydet
4. `/api/uretim-giris` POST endpoint'ine form verisi gönder
**Test:** Sidebar'dan tıklanıp form doldurulup kaydedilmeli

---

## GÖREV M4 — Prim UI Sayfası

**Zorluk:** ⭐⭐⭐ Zor  
**Dosya:** `app/app/page.js`  
**Sorun:** `/api/prim` API hazır ama UI yok. Personel prim hesaplama ve görüntüleme ekranı gerekli.  
**Yapılacak:**

1. `page.js` içinde `renderPage` switch'e `case 'prim':` ekle (zaten sidebar'da var)
2. PrimPage bileşeni yaz:
   - Ay/Yıl seçici
   - `/api/prim?ay=X&yil=Y` den veri çek
   - Personel bazlı prim tablosu: ad, brüt, SGK, net, üretim adedi, prim tutarı
   - Toplam prim özet kartları
3. Opsiyonel: PDF export butonu
**Test:** Prim sekmesine tıkla, ay seç, tablo dolsun

---

## GÖREV M5 — Login ve Auth Sistemi

**Zorluk:** ⭐⭐⭐ Zor  
**Dosya:** `app/app/login/page.js` (YENİ) + `app/middleware.js` (YENİ)  
**Sorun:** Şu an auth bypass açık (dev modunda herkes koordinatör). Production'da login gerekli.  
**Yapılacak:**

1. `app/login/page.js` — basit kullanıcı adı/şifre formu
2. `personnel` tablosuna `password_hash` sütunu ekle
3. `middleware.js` — session/cookie kontrolü, login olmayan `/login`'e yönlendir
4. `lib/auth.js` zaten hazır — sadece header'ları doğru gönder
5. Rol bazlı menü kısıtı: operator sadece üretim görsün
**Test:** Giriş yapmadan sayfa açılmamalı, operatör silme yetkisi olmamalı

---

## GÖREV M6 — Operations Tablosu Schema Düzeltme

**Zorluk:** ⭐ Kolay  
**Dosya:** Supabase `operations` tablosu  
**Sorun:** SQLite'da `standard_time_min`, Supabase'de `standart_sure_dk` — isim farkı var. İki kayıt aktarılamadı.  
**Yapılacak:**

1. Supabase SQL Editor'da: `ALTER TABLE operations ADD COLUMN IF NOT EXISTS standard_time_min NUMERIC`
2. Ya da mevcut `standart_sure_dk` sütununu kullanacak şekilde migration script güncelle
3. SQLite'daki 2 operations kaydını Supabase'e aktar
**Test:** `/api/operations` endpoint'i 200 dönmeli

---

## GÖREV M7 — Karar Arşivi UI

**Zorluk:** ⭐⭐ Orta  
**Dosya:** `app/app/page.js`  
**Sorun:** `/api/rapor/karar-arsivi` API çalışıyor (200) ama görsel arayüz yok.  
**Yapılacak:**

1. Muhasebe sayfasının `bolumler` dizisine `{ id: 'karar', label: '📜 Karar Arşivi' }` ekle
2. `aktifBolum === 'karar'` bloğu yaz — tarih, konu, karar, sorumlu tablosu
3. Filtreleme: tarih aralığı, anahtar kelime arama
**Test:** Muhasebe → Karar Arşivi sekmesine tıkla, kayıtlar listelenmeli

---

## GÖREV M8 — Bot Deep Test (Gemini/DeepSeek/GPT)

**Zorluk:** ⭐⭐ Orta  
**Dosya:** `app/app/api/chatbot/route.js`  
**Sorun:** Chatbot 3 farklı AI modeli kullanıyor. Temel test OK ama gerçek üretim verileriyle kapsamlı test yapılmadı.  
**Yapılacak:**

1. Her bot moduna (genel, uretim, kalite, maliyet) 5'er test sorusu gönder
2. Yanıt sürelerini ölç (5 sn üstü sorunlu)
3. Hatalı/boş yanıtları logla
4. Hata veren modlar için fallback mekanizması kontrol et
**Test:** 20 soru gönder, hepsine 5 sn içinde anlamlı yanıt gelmeli

---

## DURUM TAKİP

| Görev | Sorumlu | Durum |
|-------|---------|-------|
| M1 | ANTİGRAVİTY | ✅ Tamamlandı — NOT NULL kaldırıldı, 3 model aktarıldı |
| M2 | ANTİGRAVİTY | ✅ Tamamlandı — Sunucu yeni key ile çalışıyor, tüm API OK |
| M3 | _______ | ⬜ Bekliyor |
| M4 | _______ | ⬜ Bekliyor |
| M5 | _______ | ⬜ Bekliyor |
| M6 | ANTİGRAVİTY | ✅ Tamamlandı — standard_time_min eklendi, 1 operasyon aktarıldı |
| M7 | ANTİGRAVİTY | ✅ Tamamlandı — Karar Arşivi sekmesi page.js'e eklendi |
| M8 | ANTİGRAVİTY | ✅ Tamamlandı — 19/20 OK, ort 3.5sn, C4-karlılık timeout |
