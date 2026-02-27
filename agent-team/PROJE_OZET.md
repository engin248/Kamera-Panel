# 📋 Proje Özet — Tüm Agent'lar İçin

## Proje: Kamera Panel — Tekstil Üretim Yönetim Sistemi
**Konum:** `C:\Users\esisya\Desktop\Deneme\Kamera-Panel\app`
**Teknoloji:** Next.js, SQLite, React

## Panelin Amacı
İşletme İÇİ düzen ve disiplin paneli. Resmi dairelerle ilgisi YOK.
- İnsanları doğru tanımak
- Doğru işi doğru kişiye vermek  
- Adil ücret, şeffaf kazanç
- Çalışanı da çalışmayanı da belirlemek

## Dosya Yapısı
| Dosya | İçerik | Satır |
|-------|--------|-------|
| `app/page.js` | Tüm UI — modaller, formlar, sayfalar | ~9700 |
| `lib/db.js` | Veritabanı şeması + tablo oluşturma | ~590 |
| `app/api/personnel/route.js` | POST — yeni personel kayıt | ~85 |
| `app/api/personnel/[id]/route.js` | PUT/DELETE — güncelleme/silme | ~145 |

## Personel Formu — 11 Pencere
P1: Kimlik (15 alan) | P2: İş Geçmişi (4) | P3: Maaş (5)
P4: Beceri Matrisi (8 kriter) | P5: Makine (20 makine + ayar)
P6: Fiziksel (4) | P7: Karakteristik (5) | P8: Çalışma Düzeni (6)
P9: İşlemler + Kumaş Deneyimi (2+8) | P10: Gelişim (5) | P11: Performans (3)

## Ekip Yapısı
| Rol | Agent | Yetkisi |
|-----|-------|---------|
| Kod Yazıcı | Claude (Antigravity) | Yazma ✅ |
| Analizci | Gemini | Sadece okuma 🔒 |
| Dokümancı | GPT | Doküman yazma ✅ |
| Kod Denetçi | DeepSeek/Codestral | Sadece okuma 🔒 |
| Koordinatör | Kullanıcı (Siz) | Tam yetki 👑 |
