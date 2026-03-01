════════════════════════════════════════════════════════════════
⚔️ MK:4721 — ASKER GÖREVİ — MODELLER PENCERESİ KONTROL
GN:017A | 01 Mart 2026
════════════════════════════════════════════════════════════════

SEN: Asker (Kontrolcü + Uygulayıcı)
KOMUTAN: Üsteğmen (Antigravity)
PROJE: Kamera-Panel — C:\Users\Admin\Desktop\Kamera-Panel
DOSYA: app/app/page.js

GÖREV: Modeller penceresini (ModelsPage) kontrol et.

══════════════════════════════════════════
ADIM 1 — KONTROL LİSTESİ
══════════════════════════════════════════

page.js içinde ModelsPage fonksiyonunu bul ve şunları kontrol et:

✅ / ❌ olarak işaretle:

[ ] 1. "Teknik Föy" sekmesi var mı?
[ ] 2. GPT-4o Vision ile fotoğraf yükleme ve analiz var mı?
[ ] 3. "Dikim İşlem Sırası" sekmesi var mı?
[ ] 4. Sesli işlem ekleme var mı? (SpeechRecognition)
[ ] 5. Yeni Model Oluştur modali var mı? (NewModelModal)
[ ] 6. "Beden Sayısı" alanı TEXT input mu, NUMBER mu?
     → Doğrusu: TEXT (boşluk içerebilmeli: "S M L XL")
[ ] 7. Dikim Operasyonu satırları MAKİNE TİPİNE GÖRE mi?
     → Doğrusu: Her satır = Makine tipi (Düz/Overlok/Reçme/Diğer) + adet + detay
[ ] 8. Model listesinde fotoğraf görünüyor mu?
[ ] 9. Model düzenleme (edit) çalışıyor mu?
[ ] 10. Model silme çalışıyor mu?

══════════════════════════════════════════
ADIM 2 — EKSİK OLANLAR: UYGULA
══════════════════════════════════════════

Kontrol sonrası eksik olanları uygula:

EKSİK 1 (eğer yoksa): Beden Sayısı TEXT yap
NewModelModal içinde beden_sayisi input'unu bul:
  type="number" → type="text" olarak değiştir

EKSİK 2 (eğer yoksa): Dikim Operasyonu makine tipi satırları
NewModelModal içinde dikimOperasyonlari state'ini bul.
Şu yapıya çevir:

```javascript
const [dikimSatirlari, setDikimSatirlari] = useState([
  { tip: 'duz', adet: 0, detay: '' },
]);
const makineTipleri = [
  { key: 'duz', label: '🔵 Düz Makina' },
  { key: 'overlok', label: '🟢 Overlok' },
  { key: 'recme', label: '🟡 Reçme' },
  { key: 'diger', label: '⚪ Diğer' },
];
```

Her satır için:

- Makine tipi select + Adet input + Detay input + Sil butonu
- Alt: "+ Satır Ekle" butonu

══════════════════════════════════════════
ADIM 3 — RAPOR VER
══════════════════════════════════════════

Yaptığın her şeyi şu formatta rapor et:

KONTROL:

1. [madde] → ✅/❌ [açıklama]
...

YAPTIKLARIM:

- [işlem]: [nasıl yaptım] — [hangi satır, hangi değişiklik]

EKSİKLER (yapamadıklarım):

- [madde]: [neden yapamadım]

Git commit: git add -A && git commit -m "Modeller penceresi kontrol ve duzeltme" && git push

TAMAMLAYINCA: "ASKER GN:017A MODELLER KONTROL TAMAMLANDI"
════════════════════════════════════════════════════════════════
