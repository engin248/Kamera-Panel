# 🏆 PRİM & ÜRET SEKMESİ — BOT BEYNİ

> **Sekme ID:** `prim`
> **Bot:** 📊 Muhasip (GPT-4o-mini)
> **Son Güncelleme:** 2026-03-01
> **Bu dosya:** Prim & Üret botu için tek bilgi kaynağı

---

## 🎯 BU SEKMENİN AMACI

Çalışanları adil ve şeffaf bir sistemle teşvik etmek.
Kim ne kadar üretirse o kadar kazanır — prim sistemi buradan yönetilir.
Operatör sınıfı (A/B/C/D) + üretim verisi = ücret hesabı.

---

## 🤖 BOT SİSTEM PROMPTU

```
Sen "47 Sil Baştan 01" fabrikasının PRİM ve TEŞVİK uzmanısın. Adın MUHASİP.

UZMANLIĞIN:
- Prim hesabı (üretim miktarı × birim prim)
- Operatör sınıfı bazlı taban maaş
- Bireysel vs grup prim karşılaştırması
- "Çok üret — çok kazan" teşvik sistemi
- Adil ücret analizi

TARZIN: Adalet odaklı. Emek karşılığı aldığından emin ol.
DİL: Türkçe. Hesap göster. Max 5-6 cümle.
```

---

## 📊 VERİTABANI — KULLANILAN TABLOLAR

| Tablo | Hangi Alanlar | Ne İçin |
|-------|---------------|---------|
| `personnel` | operator_class, base_salary, daily_avg_output | Taban ücret + verimlilik |
| `production_logs` | total_produced, unit_value, personnel_id | Kim ne üretmiş |
| `operations` | unit_price | Birim prim fiyatı |

### Prim Hesaplama Mantığı (Planlanan)

```
Operatör Sınıfı → Taban Maaş Çarpanı:
  A sınıfı: ×1.30
  B sınıfı: ×1.15
  C sınıfı: ×1.00
  D sınıfı: ×0.90

Günlük Prim = Σ (üretilen_adet × operasyon_birim_fiyat)
Aylık Kazanç = Taban Maaş + Aylık Prim Toplamı
```

---

## 🌐 API ENDPOINT'LERİ

| Endpoint | Metot | Ne Yapar |
|----------|-------|----------|
| `/api/personnel` | GET | Operatör sınıfı + maaş bilgisi |
| `/api/production` | GET | Kişi bazlı üretim miktarı |
| `/api/operations` | GET | Birim prim fiyatları |

> **NOT:** Prim hesaplama için henüz özel bir API yok. Gelecekte eklenecek.

---

## ✅ MEVCUT ÖZELLİKLER

- [x] Operatör sınıfı (A/B/C/D) personel profilinde var
- [x] Base salary + yan haklar personelde kayıtlı
- [x] Üretim verisi (unit_value) production_logs'ta var
- [x] Operasyon birim fiyatı (unit_price) operations'ta var

## 🔲 YAPILMASI PLANLANANLAR

- [ ] TODO: Prim hesaplama motoru (otomatik hesap)
- [ ] TODO: Personel bazlı aylık prim raporu
- [ ] TODO: Grup prim sistemi (takım başarısı)
- [ ] TODO: Prim öncesi/sonrası maaş karşılaştırması
- [ ] TODO: "Bu ay en çok kazanan" sıralaması
- [ ] TODO: Prim hedefi belirleme (kişi bazlı)

---

## 💬 HIZLI KOMUTLAR (Bot için)

| Soru | Botu Ne Yapacak |
|------|-----------------|
| "Ahmet bu ay ne kadar prim hak etti?" | production_logs × unit_price topla |
| "A sınıfı operatörler kimler?" | operator_class = 'A' filtrele |
| "En çok üreten bu hafta kim?" | production_logs GROUP BY personnel |
| "Adil mi bu sistem?" | Üretim oranları vs maaş oranlarını karşılaştır |
