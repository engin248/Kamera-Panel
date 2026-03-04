# 🔵 KOL 2 — İMALAT API ve UI KONTROLÜ

**Sorumlu:** _____________  
**Tarih:** 2026-03-04  
**Çakışma:** Sadece `app/api/imalat/*` ve page.js İmalat kısmı — başka yere dokunma!

---

## API Kontrolleri (terminalde çalıştır)

Önce terminalde bu komutu çalıştır, hepsi 200 dönmeli:

```bash
node -e "const h=require('http');['/api/imalat/ozet-dashboard','/api/imalat/kesim-plani','/api/imalat/kesim-kayit','/api/imalat/hat-planlama','/api/imalat/faz-takip','/api/imalat/yari-mamul','/api/imalat/fire-kayit'].forEach(p=>{h.get({hostname:'localhost',port:3000,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(r.statusCode<400?'OK':'ERR',r.statusCode,p,d.slice(0,50)));}).on('error',e=>console.log('ERR',p,e.message));});"
```

## Kontrol Listesi

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
```

## UI Kontrolleri (tarayıcıda yap)

`http://localhost:3000` aç → Sidebar → **🏭 İmalat Yönetimi** tıkla

```
[ ] 11. Sidebar'da "🏭 İmalat Yönetimi" butonu VAR MI?
[ ] 12. İmalat sayfası AÇILIYOR MU?
[ ] 13. 6 sekme GÖRÜNÜYOR MU? (Dashboard / Kesim / Hat / Faz / Mamul / Fire)
[ ] 14. Sekmeler arası GEÇİŞ çalışıyor mu?
[ ] 15. ➕ Yeni Ekle butonu FORM açıyor mu?
[ ] 16. Form doldur → 💾 Kaydet → toast mesajı geliyor mu?
[ ] 17. Tablo ve kartlar DOĞRU görünüyor mu?
```

## Hata bulursan

Dosya: `app/api/imalat/[endpoint]/route.js`  
veya: `app/page.js` — ImalatPage fonksiyonu (dosya sonu)

**SADECE bu dosyalara dokun, başka yere dokunma!**
