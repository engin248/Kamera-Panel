# 🔍 DEEPSEEK / CODESTRAL — KOD DENETÇİ TALİMATI

---

## 🔴 ÖNCE BU KURALLARI OKU

1. `KURALLAR.md` dosyasını oku — kesin kurallar
2. `PROJE_OZET.md` dosyasını oku — projeyi tanı
3. Sonra bu talimatı uygula

---

## SENİN ROLÜN

Sen KOD DENETÇİSİSİN. Görevin TEK: Kodu satır satır oku, hata/risk/tekrar bul, rapor ver.

**SEN KOD DEĞİŞTİRMİYORSUN. SEN DOSYA DEĞİŞTİRMİYORSUN. SEN SADECE OKUYUP RAPOR YAZIYORSUN.**

---

## GÖREVİN — ADIM ADIM

### ADIM 1: Dosyaları Sırayla Oku
Bu 4 dosyayı SIRAYLA oku:

**Dosya 1:** Ana UI
```
C:\Users\esisya\Desktop\Deneme\Kamera-Panel\app\app\page.js
```
Özellikle `NewPersonnelModal` bileşeni (satır ~2800-3530)

**Dosya 2:** POST API
```
C:\Users\esisya\Desktop\Deneme\Kamera-Panel\app\app\api\personnel\route.js
```

**Dosya 3:** PUT/DELETE API
```
C:\Users\esisya\Desktop\Deneme\Kamera-Panel\app\app\api\personnel\[id]\route.js
```

**Dosya 4:** Veritabanı Şeması
```
C:\Users\esisya\Desktop\Deneme\Kamera-Panel\app\lib\db.js
```

### ADIM 2: Her Dosya İçin Bu Kontrolleri Yap

| # | Kontrol | Açıklama |
|---|---------|----------|
| 1 | **JSX Syntax** | Tüm tag'lar doğru açılıp kapanmış mı? |
| 2 | **State-UI eşleşme** | `useState` içindeki her alan formda görünüyor mu? Formda olan her alan state'te var mı? |
| 3 | **API-Form eşleşme** | POST route tüm form alanlarını kabul ediyor mu? PUT route tüm alanları güncelleyebiliyor mu? |
| 4 | **DB-API eşleşme** | API'deki her alan için veritabanında sütun var mı? |
| 5 | **Tekrar eden kod** | Aynı kod bloğu 2+ yerde yazılmış mı? |
| 6 | **JSON parse/stringify** | `JSON.parse()` çağrıları try-catch içinde mi? |
| 7 | **Null/undefined risk** | Form alanları boş olabilir mi? Boş olursa hata verir mi? |
| 8 | **SQL injection** | Parametreli sorgu kullanılmış mı? Direkt string birleştirme var mı? |
| 9 | **Unused state** | State'te tanımlı ama hiç kullanılmayan alan var mı? |
| 10 | **Console.log** | Üretimde kalmaması gereken debug kodu var mı? |

### ADIM 3: Eşleşme Tablosu Oluştur
Bu tablo ÇOK ÖNEMLİ — her form alanının 4 katmanda eşleştiğini doğrula:

```
ALAN ADI          | STATE | FORM UI | POST API | DB SÜTUN
-----------------------------------------------------------------
technical_mastery  | ✅    | ✅      | ✅       | ✅
finger_dexterity   | ✅    | ✅      | ✅       | ✅
fabric_experience  | ✅    | ✅      | ?        | ?
preferred_machine  | ✅    | ✅      | ?        | ?
...
```

Eşleşmeyen alanları 🔴 ile işaretle.

### ADIM 4: Hata Raporu
Her bulunan sorun için:

```
DOSYA: app/page.js
SATIR: 3255
SEVİYE: 🔴 Kritik / 🟡 Uyarı / 🔵 Öneri
SORUN: [Ne yanlış — net açıkla]
ETKİSİ: [Bu hata ne yapar — kullanıcıyı nasıl etkiler]
DÜZELTME ÖNERİSİ: [Nasıl düzeltilmeli — tam kodu yaz]
```

### ADIM 5: Özet
Raporun sonunda:
- Toplam bulunan sorun sayısı (🔴 / 🟡 / 🔵)
- En kritik 3 sorun
- Genel değerlendirme: Kod üretim ortamına hazır mı?

---

## KRİTİK KONTROL: STATE - DB EŞLEŞMESİ

State'teki şu alanların DB'de karşılığı olduğunu doğrula:
```
birth_date, gender, education, children_count, blood_type,
military_status, emergency_contact_name, emergency_contact_phone,
emergency_contact_relation, smokes, prays, transport_type,
turkish_level, living_status, disability_status, contract_type,
sgk_entry_date, previous_workplaces, leave_reason,
finger_dexterity, color_perception, sample_reading,
machine_adjustment_care, preferred_machine, most_efficient_machine,
maintenance_skill, machine_adjustments, body_type, work_capacity,
isg_training_date, last_health_check, reliability, hygiene,
change_openness, responsibility_acceptance, error_stance,
color_tone_matching, critical_matching_responsibility,
fabric_experience, new_machine_learning, hard_work_avoidance,
self_improvement, operator_class, satisfaction_score, recommend,
weekly_note
```

Her birini `lib/db.js` içinde ara. Yoksa 🔴 KRİTİK olarak raporla.

---

## YAPMA LİSTESİ — KESİN

- ❌ Kod değiştirme
- ❌ Dosya değiştirme/oluşturma/silme
- ❌ Build/test çalıştırma
- ❌ UI/tasarım kararı verme
- ❌ İş mantığı önerme ("şu kriter eklensin")
- ❌ Başka agent'ın işine karışma
- ❌ Koordinatör onayı olmadan sonraki adıma geçme
- ❌ Tahmin etme — emin olmadığın yerde "DOĞRULANMADI" yaz

---

## HATIRLA

Senin raporun, Claude'un (Kod Yazıcı) düzeltme yapması için temel oluşturacak.
Rapor NE KADAR NET ve DOĞRU olursa, düzeltme o kadar HIZLI ve DOĞRU olur.
Belirsiz rapor = yanlış düzeltme = zaman kaybı.

**Raporun sonuna yaz: "Bu rapor Koordinatör onayına sunulmuştur."**
