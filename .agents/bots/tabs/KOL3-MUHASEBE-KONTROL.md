# 🟡 KOL 3 — MUHASEBE / RAPOR UI ve GENEL SAYFA KONTROLÜ

**Sorumlu:** _____________  
**Tarih:** 2026-03-04  
**Çakışma:** Sadece page.js Muhasebe bölümü ve Sidebar — imalat/API dosyalarına dokunma!

---

## UI Kontrolleri (tarayıcıda yap)

`http://localhost:3000` aç

### Muhasebe Sayfası

Sidebar → **📒 Rapor & Analiz** tıkla

```
[ ] 1. Muhasebe sayfası AÇILIYOR MU?
[ ] 2. 9 sekme GÖRÜNÜYOR MU?
      (Özet / Sipariş / Model / Üretim / Personel / Teslimat / Fire / Kapasite / Final)
[ ] 3. 📊 Genel Özet → KPI kartları DOLU MU? (sipariş, model, üretim, personel, maliyet)
[ ] 4. 📋 Siparişler → tablo GÖRÜNÜYOR MU?
[ ] 5. 👗 Modeller → model listesi VAR MI?
[ ] 6. 🏭 Üretim → OEE ve üretim verileri VAR MI?
[ ] 7. 👥 Personel → personel tablosu VAR MI?
[ ] 8. 🚚 Teslimat Sapma → KPI kartları YÜKLENİYOR MU?
[ ] 9. 🔥 Fire Maliyet → Fire KPI ve model tablosu VAR MI?
[ ] 10. ⚡ Kapasite Tahmini → hafta detayı GÖRÜNÜYOR MU?
[ ] 11. 🤖 Final Raporu → "AI Final Raporu Oluştur" butonu ÇALIŞIYOR MU?
```

### Genel Sayfa Kontrolleri

Sidebar'daki HER butonu tek tek tıkla:

```
[ ] 12. 📦 Siparişler sayfası → sipariş tablosu açılıyor mu?
[ ] 13. 👗 Modeller sayfası → model kartları görünüyor mu?
[ ] 14. 👥 Personel sayfası → personel listesi var mı?
[ ] 15. 🔩 Üretim Aşaması → üretim tablosu var mı?
[ ] 16. 💰 Maliyet sayfası → maliyet kayıtları var mı?
[ ] 17. 🏆 Prim → sayfa açılıyor mu? (UI henüz olmayabilir - M4 görevi)
```

## Hata bulursan

Dosya: `app/page.js`  
Bölüm: `MuhasebeDepartmaniPage` fonksiyonu (satır ~12047)  
veya: `Sidebar` fonksiyonu (satır ~636)

**SADECE bu bölümlere dokun, İmalat ve API dosyalarına dokunma!**
