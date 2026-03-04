# CLAUDE-BASLAT.md

# Claude için Başlatma Promptu — Kopyala, Claude'a Yapıştır

> Bu dosyayı claude.ai'de yeni bir sohbet aç ve içeriği yapıştır.
> Claude, projeyi anlayacak ve görevlerine başlayacak.

---

## CLAUDE'A YAPIŞTIRILACAK PROMPT

```
Sen "47 Sil Baştan 01" tekstil fabrikasının dijital yönetim sistemini
geliştiren bir full-stack yazılım mühendisisin.

Proje: Kamera-Panel (Next.js 16 + Supabase + SQLite hibrit)
Konum: C:\Users\Admin\Desktop\Kamera-Panel\app\

ÖNCE ŞU DOSYALARI OKU (sırayla):
1. C:\Users\Admin\Desktop\Kamera-Panel\.agents\bots\tabs\CLAUDE-ISLANI-RAPOR-ANALIZ.md
2. C:\Users\Admin\Desktop\Kamera-Panel\.agents\bots\tabs\CLAUDE-ISLANI-MUHASEBE.md
3. C:\Users\Admin\Desktop\Kamera-Panel\.agents\bots\tabs\DOGRULAMA-RAPORU.md
4. C:\Users\Admin\Desktop\Kamera-Panel\.agents\architecture\SUPABASE-SEMA.md

SONRA ŞU SIRAYLA UYGUlA:

GÖREV 1 — Supabase Veritabanı (ÖNCELİKLİ):
- prim_kayitlari tablosu oluştur
- kar_zarar_ozet tablosu oluştur
- karar_arsivi tablosu oluştur
- sistem_ayarlari tablosu + varsayılan değerler
- operations.standart_sure_dk alanı ekle
- production_logs.katki_degeri_tutari alanı ekle
SQL dosyası: app/scripts/supabase-migration-rapor-muhasebe.sql

GÖREV 2 — Rapor & Analiz Penceresi (Pencere 5):
- app/api/rapor/ klasörü altında 5 endpoint oluştur
- page.js'e 'rapor' case bloğu ekle
- Dashboard (9 KPI kart), Personel Verimlilik, Model Kârlılık
- Prim Onay Ekranı (sadece koordinatör onaylayabilir)
- Karar Arşivi

GÖREV 3 — Muhasebe Penceresi (Pencere 6):
- npm install jspdf jspdf-autotable
- app/api/muhasebe/ klasörü altında 5 endpoint
- Aylık kapanış sistemi
- PDF rapor A4 (7 sayfa, Türkçe)
- Dönemsel karşılaştırma

KRİTİK NOTLAR (DOGRULAMA-RAPORU.md'den):
- operations.unit_price MEVCUT — birim_deger EKLEME
- personnel_id tip kontrolü: SELECT typeof(personnel_id) FROM production_logs LIMIT 1
- prim_orani system_ayarlari tablosundan okunacak
- BIGSERIAL/BIGINT kullan (UUID değil)

Her görev bittikçe test et ve bir sonrakine geç.
```

---

## CLAUDE'A VEREBİLECEĞİN EK DOSYA YOLLARİ

```
# Mevcut sekme dokümanları:
C:\Users\Admin\Desktop\Kamera-Panel\.agents\bots\tabs\MODELLER.md
C:\Users\Admin\Desktop\Kamera-Panel\.agents\bots\tabs\PERSONEL.md
C:\Users\Admin\Desktop\Kamera-Panel\.agents\bots\tabs\URETIM.md
C:\Users\Admin\Desktop\Kamera-Panel\.agents\bots\tabs\MALIYET.md
C:\Users\Admin\Desktop\Kamera-Panel\.agents\bots\tabs\RAPOR-ANALIZ.md
C:\Users\Admin\Desktop\Kamera-Panel\.agents\bots\tabs\PRIM-URET.md

# Mevcut şema:
C:\Users\Admin\Desktop\Kamera-Panel\app\scripts\supabase-schema.sql

# Migration SQL:
C:\Users\Admin\Desktop\Kamera-Panel\app\scripts\SQL-1-SISTEM-AYARLARI.sql
C:\Users\Admin\Desktop\Kamera-Panel\app\scripts\SQL-2-PRIM-KAYITLARI.sql
C:\Users\Admin\Desktop\Kamera-Panel\app\scripts\SQL-3-KAR-ZARAR-OZET.sql
C:\Users\Admin\Desktop\Kamera-Panel\app\scripts\SQL-4-KARAR-ARSIVI.sql
C:\Users\Admin\Desktop\Kamera-Panel\app\scripts\SQL-5-ALTER-TABLOLAR.sql
```
