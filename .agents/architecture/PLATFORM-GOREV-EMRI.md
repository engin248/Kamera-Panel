# PLATFORM-GOREV-EMRI.md — DİJİTAL GÖREV EMRİ SİSTEMİ

> Versiyon: 1.0 | Tarih: 2026-03-03
> Durum: PLANLAMA ASAMASI
> Baglanti: SISTEM-GENEL.md

---

## SORUNUN TANIMI

- Görev sözlü veriliyor → unutuluyor, yanlış anlaşılıyor
- Kim ne yaptı kayıt altında değil
- Uzaktan takip imkânı yok
- Sonuç sorulunca "unuttum / öyle demedin" oluyor

---

## GÖREV AKIŞ SİSTEMİ

```
GÖREV EMRİ VERİLİR (yönetici — sözsüz, yazılı/sesli)
       ASAGI
BİLDİRİM GİDER (Telefon + E-posta + Telegram)
       ASAGI
SORUMLU KABUL EDER ("Görevi aldım" — tek tık)
       ASAGI
GÖREV İCRA EDİLİR
       ASAGI
SONUÇ VE GÖRÜŞ BİLDİRİLİR (yazılı + fotoğraf)
       ASAGI
YÖNETİCI ONAYLAR veya GERİ DÖNER
       ASAGI
ARŞİVE KAYIT (tüm süreç)
```

---

## EKRANLAR

### Ekran 1: Görev Listesi

Görünümler:

- Bekleyen (atandı, kabul edilmedi)
- Devam Eden
- Sonuç Bekleniyor
- Tamamlanan
- İptal Edilen

Filtreler: Kişi / Tarih / Öncelik / Bölüm

### Ekran 2: Yeni Görev Emri

ZORUNLU:

- Görev Başlığı (kısa ve net)
- Açıklama (detaylı talimat)
- Sorumlu Kişi (listeden seç)
- Son Tarih ve Saat
- Öncelik: Normal / Acele / Kritik
- Bildirim Kanalı (çoklu): Telefon / E-posta / Telegram
- Bölüm: Üretim / İmalat / Mağaza / Genel

OPSİYONEL:

- Ek dosya veya referans fotoğraf
- Tekrarlı: tek seferlik / günlük / haftalık / aylık
- Özel not

### Ekran 3: Görev Detay

- Emrin tam içeriği
- Kim tarafından ne zaman verildi
- Kabul tarihi ve saati
- Sonuç ve görüş
- Yönetici onayı veya geri dönüş
- Tüm zaman damgaları

### Ekran 4: Sesli Görev Verme

Söyle: "Ahmet'e ver, makineleri bugün 17.00'ye kadar kontrol etsin"
→ Yazıya döner → Onay ekranı → Gönder

### Ekran 5: Kişi Bazlı Rapor

Her çalışan için:

- Kaç görev aldı
- Kaç tanesini zamanında kapattı
- Ortalama tamamlama süresi
- Geri dönüş sayısı (kalite göstergesi)

---

## BİLDİRİM SİSTEMİ

Telegram Bot:

- Görev gelince mesaj alır
- Botta "Kabul Ettim" ve "Sonuç Yaz" butonu

E-posta:

- SMTP ile otomatik HTML e-posta

Push Bildirim:

- PWA ile telefona bildirim

---

## VERİTABANI TABLOLARI

### tasks

- id, title, description
- assigned_to (FK: personnel), assigned_by
- priority, department, due_date, status
- is_recurring, recurring_pattern, created_at

### task_actions

- id, task_id (FK), action_type
- actor_id, content, attachments (JSONB), timestamp

### notification_log

- id, task_id, channel, recipient, status, sent_at

---

## YAPILACAK İŞLER (Faza Planı)

FAZA 1 — Temel:

- [ ] Supabase: tasks ve task_actions tabloları
- [ ] Görev oluşturma formu
- [ ] Görev listesi ve detay ekranı
- [ ] Kabul et / Sonuç yaz akışı

FAZA 2 — Bildirim:

- [ ] E-posta (SMTP)
- [ ] Telegram bot entegrasyonu
- [ ] Push bildirim (PWA)

FAZA 3 — Raporlama:

- [ ] Kişi bazlı tamamlama raporu
- [ ] Gecikme analizi
- [ ] Üretim sistemi entegrasyonu
