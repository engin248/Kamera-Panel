# 👥 PERSONEL SEKMESİ — BOT BEYNİ

> **Sekme ID:** `personnel`
> **Bot:** 🔩 Kamera (Gemini 2.0 Flash)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Personel botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Fabrikadaki tüm çalışanların profilini tutmak.
Kim ne kadar iyi çalışıyor, hangi makinede uzman, maaşı ne kadar — hepsi burada.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının PERSONEL uzmanısın. Adın KAMERA.

UZMANLIĞIN:
- Personel profilleri (P1-P11 kriterleri)
- Maaş hesaplamaları ve gider analizi
- Operatör sınıflandırması (A/B/C/D)
- Beceri ve makine yetkinliği
- Giriş/çıkış saati takibi
- Haftalık performans notları

TARZIN: Net, insan odaklı. Sayı ver ama insanı da gör.
DİL: Türkçe. Max 4-5 cümle.

KURAL: Sadece elindeki personel verisini kullan.
```

---

## 📊 VERİTABANI — KULLANILAN TABLOLAR

### Ana Tablo: `personnel`

| Alan Grubu | Önemli Alanlar |
|------------|----------------|
| **Kimlik (P1)** | name, national_id, birth_date, gender, phone |
| **İş (P2)** | role, department, position, start_date, contract_type |
| **Ücret (P3)** | base_salary, transport_allowance, ssk_cost, food_allowance |
| **Beceri (P4)** | skill_level, machines, capable_operations, learning_speed |
| **Makine (P5)** | preferred_machine, most_efficient_machine, machine_adjustments |
| **Fiziksel (P6)** | physical_endurance, eye_health, work_capacity |
| **Karakter (P7)** | reliability, hygiene, responsibility_acceptance |
| **Üretim (P8-P9)** | daily_avg_output, error_rate, efficiency_score |
| **Gelişim (P10)** | new_machine_learning, self_improvement, training_needs |
| **Performans (P11)** | operator_class (A/B/C/D), satisfaction_score, weekly_note |
| **Sistem** | status (active/passive), deleted_at |

### İlişkili Tablolar

- `production_logs` → Personelin günlük üretim kayıtları
- `personel_saat` → Giriş/çıkış zamanları
- `approval_queue` → Personelin onay talepleri

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/personnel` | GET | Tüm aktif personeli listele |
| `/api/personnel` | POST | Yeni personel ekle |
| `/api/personnel/[id]` | PUT | Personel güncelle |
| `/api/personnel/[id]` | DELETE | Soft-delete |
| `/api/personel-saat` | POST | Giriş/çıkış kaydı |
| `/api/personel-haftalik` | GET | Haftalık rapor |

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Personel listesi (kart görünümü)
- [x] P1-P11 tam form (11 kriter grubu)
- [x] Maaş + yan haklar girişi
- [x] Operatör sınıfı (A/B/C/D)
- [x] Fotoğraf yükleme
- [x] Giriş/çıkış takibi
- [x] Haftalık not alanı (weekly_note)
- [x] Sesli giriş (TR + AR dil desteği)
- [x] Soft-delete (geri getirilebilir silme)
- [x] Çok dil desteği arayüzü

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Prim hesabı otomasyonu
- [ ] TODO: SGK/bordro rapor çıktısı
- [ ] TODO: Personel karşılaştırma grafiği
- [ ] TODO: İzin yönetimi modülü

---

## 💬 HIZLI KOMUTLAR (Bot için)

| Soru | Botu Ne Yapacak |
|------|-----------------|
| "Kaç aktif personelimiz var?" | Aktif personel sayısını söyle |
| "En verimli personel kim?" | efficiency_score'a göre sırala |
| "Bu ay maaş gideri ne kadar?" | base_salary toplamını hesapla |
| "A sınıfı operatörler kimler?" | operator_class = 'A' olanları listele |
| "Ahmet'in haftalık notu ne?" | weekly_note'u getir |

---

## 📝 BOT GÜNCELLEME KURALI

**Bu dosyayı şu durumlarda güncelle:**

- Yeni P1-P11 alanı eklendiyse → Tablo güncelle
- Personel botu prompt'u değiştiyse → System prompt güncelle
- Yeni özellik eklendiyse → `[x]` yap
- Yeni TODO belirlediyse → `[ ]` ekle
