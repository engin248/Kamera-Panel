# 🔍 KAMERA-PANEL — KONTROL PLANI (3 KOLDAN)

**Tarih:** 2026-03-04  
**Amaç:** Tüm yapılanları 3 ekipte kontrol et — çakışma YOK

---

## 🟢 KOL 1 — API ve VERİTABANI KONTROLÜ

**Kontrol edecek dosyalar:**

- `app/api/` klasöründeki TÜM route dosyaları
- `lib/supabase.js`, `lib/auth.js`
- Supabase tabloları

**Kontrol listesi:**

```
[ ] 1. /api/models          → GET 200 dönüyor mu? Veri geliyor mu?
[ ] 2. /api/personnel       → GET 200 dönüyor mu? Personel listesi var mı?
[ ] 3. /api/orders           → GET 200, POST ile yeni sipariş oluştur, tekrar GET
[ ] 4. /api/production       → GET 200, OEE hesaplaması doğru mu?
[ ] 5. /api/costs            → GET 200, maliyet kayıtları geliyor mu?
[ ] 6. /api/quality          → GET 200
[ ] 7. /api/prim?ay=3&yil=2026 → GET 200, personel primi hesaplanıyor mu?
[ ] 8. /api/rapor/ay-muhasebe?ay=3&yil=2026 → SGK oranı 0.225 mi? (G1)
[ ] 9. /api/rapor/ay-muhasebe → created_at kullanıyor mu? (G2)
[ ] 10. /api/rapor/teslimat-sapma?ay=3&yil=2026 → GET 200
[ ] 11. /api/rapor/fire-maliyet?ay=3&yil=2026 → GET 200
[ ] 12. /api/rapor/kapasite-tahmini?hafta=0 → GET 200
[ ] 13. /api/rapor/karar-arsivi → GET 200
[ ] 14. /api/chatbot → POST 200, yanıt geliyor mu?
[ ] 15. Supabase models tablosu → 3 kayıt var mı?
[ ] 16. Supabase personnel tablosu → kayıtlar var mı?
[ ] 17. Supabase orders tablosu → kayıt var mı?
[ ] 18. auth.js → production modda bypass kapalı mı?
[ ] 19. RLS → personnel, orders, models tablolarında aktif mi?
```

**Test komutu (hepsini tek seferde):**

```
node -e "const h=require('http');['/api/models','/api/personnel','/api/orders','/api/production','/api/costs','/api/prim?ay=3&yil=2026','/api/rapor/ay-muhasebe?ay=3&yil=2026','/api/rapor/teslimat-sapma?ay=3&yil=2026','/api/rapor/fire-maliyet?ay=3&yil=2026','/api/rapor/kapasite-tahmini?hafta=0','/api/rapor/karar-arsivi','/api/quality'].forEach(p=>{h.get({hostname:'localhost',port:3000,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(r.statusCode<400?'OK':'ERR',r.statusCode,p,d.slice(0,50)));}).on('error',e=>console.log('ERR',p,e.message));});"
```

---

## 🔵 KOL 2 — İMALAT API ve UI KONTROLÜ

**Kontrol edecek dosyalar:**

- `app/api/imalat/` klasöründeki TÜM route dosyaları
- `app/page.js` içindeki ImalatPage bileşeni
- `app/page.js` içindeki Sidebar

**Kontrol listesi:**

```
[ ] 1. /api/imalat/ozet-dashboard    → GET 200, KPI verisi geliyor mu?
[ ] 2. /api/imalat/kesim-plani       → GET 200
[ ] 3. /api/imalat/kesim-plani       → POST ile yeni kesim planı oluştur
[ ] 4. /api/imalat/kesim-kayit       → GET 200
[ ] 5. /api/imalat/hat-planlama      → GET 200
[ ] 6. /api/imalat/hat-planlama      → POST ile yeni hat ekle
[ ] 7. /api/imalat/faz-takip         → GET 200
[ ] 8. /api/imalat/yari-mamul        → GET 200
[ ] 9. /api/imalat/fire-kayit        → GET 200
[ ] 10. /api/imalat/fire-kayit       → POST ile fire kaydı ekle
[ ] 11. Sidebar'da "🏭 İmalat Yönetimi" butonu var mı?
[ ] 12. İmalat sayfası açılıyor mu?
[ ] 13. 6 sekme görünüyor mu? (Dashboard/Kesim/Hat/Faz/Mamul/Fire)
[ ] 14. Sekme geçişleri çalışıyor mu?
[ ] 15. Yeni Ekle butonu form açıyor mu?
[ ] 16. Form kaydet çalışıyor mu?
[ ] 17. Tablo/kart görünümleri doğru render ediliyor mu?
```

**Test komutu (API kontrolü):**

```
node -e "const h=require('http');['/api/imalat/ozet-dashboard','/api/imalat/kesim-plani','/api/imalat/kesim-kayit','/api/imalat/hat-planlama','/api/imalat/faz-takip','/api/imalat/yari-mamul','/api/imalat/fire-kayit'].forEach(p=>{h.get({hostname:'localhost',port:3000,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(r.statusCode<400?'OK':'ERR',r.statusCode,p,d.slice(0,50)));}).on('error',e=>console.log('ERR',p,e.message));});"
```

**UI kontrolü:** Tarayıcıda `http://localhost:3000` aç → Sidebar → İmalat Yönetimi tıkla

---

## 🟡 KOL 3 — MUHASEBE / RAPOR UI ve GENEL SAYFA KONTROLÜ

**Kontrol edecek dosyalar:**

- `app/page.js` içindeki MuhasebeDepartmaniPage
- `app/page.js` içindeki renderPage switch
- `app/page.js` genel Sidebar ve sayfa akışı

**Kontrol listesi:**

```
[ ] 1. Muhasebe sayfası açılıyor mu? (Sidebar → Rapor & Analiz)
[ ] 2. 9 sekme görünüyor mu? (Özet/Sipariş/Model/Üretim/Personel/Teslimat/Fire/Kapasite/Final)
[ ] 3. Genel Özet sekmesi → KPI kartları dolmuş mu?
[ ] 4. Siparişler sekmesi → tablo görünüyor mu?
[ ] 5. Modeller sekmesi → model listesi var mı?
[ ] 6. Üretim sekmesi → OEE ve üretim verileri var mı?
[ ] 7. Personel sekmesi → personel tablosu var mı?
[ ] 8. 🚚 Teslimat Sapma sekmesi → KPI kartları yükleniyor mu?
[ ] 9. 🔥 Fire Maliyet sekmesi → Fire KPI ve model tablosu var mı?
[ ] 10. ⚡ Kapasite Tahmini sekmesi → hafta detayı görünüyor mu?
[ ] 11. 🤖 Final Raporu → AI butonu çalışıyor mu?
[ ] 12. Sidebar tüm menüler → her sayfa açılıyor mu?
[ ] 13. Modeller sayfası → model kartları görünüyor mu?
[ ] 14. Personel sayfası → personel listesi var mı?
[ ] 15. Üretim Aşaması → üretim tablosu var mı?
[ ] 16. Maliyet sayfası → maliyet kayıtları var mı?
[ ] 17. Prim sayfası → (M4 bekleyen görev — UI olmayabilir)
```

**UI kontrolü:** Tarayıcıda `http://localhost:3000` aç → Sidebar → Rapor & Analiz tıkla → sekmeleri tek tek gez

---

## ÖZET

| Kol | Alan | Dosya/Klasör | Çakışma riski |
|-----|------|-------------|---------------|
| 🟢 KOL 1 | API + Veritabanı | `app/api/*`, `lib/*`, Supabase | ✅ ANTİGRAVİTY — TAMAMLANDI |
| 🔵 KOL 2 | İmalat API + UI | `app/api/imalat/*`, page.js İmalat | YOK |
| 🟡 KOL 3 | Muhasebe UI + Genel | page.js Muhasebe, Sidebar | YOK |

> ⚠️ **KURAL:** Her kol SADECE kendi alanındaki dosyaları kontrol eder ve değiştirir. Başka kolun dosyasına dokunma!
