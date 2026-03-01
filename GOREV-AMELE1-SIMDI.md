════════════════════════════════════════════════════════════════
⚔️ MK:4721 — AMELE 1 GÖREVİ (GN:012B)
Engin Bey'in 3 çocuğu için. Vatan ve insanlık hayrına.
════════════════════════════════════════════════════════════════

SEN: Amele/Çırak 1 (uygulayıcı)
KOMUTAN: Üsteğmen (Antigravity)
PROJE: Kamera-Panel — Tekstil Üretim Takip
STACK: Next.js 14, SQLite (better-sqlite3)

════════════════════════════════════════════════════════════════
GÖREVİN — PERSONEL HAFTALIK ÖZET + MAAŞ HESABI
════════════════════════════════════════════════════════════════

### ADIM 1 — API ENDPOINT

Dosya: app/app/api/personel-haftalik/route.js (YENİ OLUŞTUR)

```javascript
import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const hafta = searchParams.get('hafta') || (() => {
      const d = new Date();
      const start = new Date(d.setDate(d.getDate() - d.getDay() + 1));
      return start.toISOString().split('T')[0];
    })();

    // Haftanın başı ve sonu
    const haftaBaslangic = hafta;
    const haftaSonu = new Date(new Date(hafta).getTime() + 6*24*60*60*1000).toISOString().split('T')[0];

    const kayitlar = db.prepare(`
      SELECT 
        psk.personel_id,
        p.name as ad,
        p.daily_wage,
        SUM(psk.net_calisma_dakika) as toplam_dk,
        SUM(psk.mesai_dakika) as mesai_dk,
        COUNT(psk.id) as gun_sayisi
      FROM personel_saat_kayitlari psk
      JOIN personnel p ON p.id = psk.personel_id
      WHERE psk.tarih BETWEEN ? AND ?
      GROUP BY psk.personel_id
      ORDER BY p.name
    `).all(haftaBaslangic, haftaSonu);

    // Maaş hesapla
    const sonuc = kayitlar.map(k => {
      const saatlikUcret = (k.daily_wage || 0) / 8;
      const normalSaat = (k.toplam_dk || 0) / 60;
      const mesaiSaat = (k.mesai_dk || 0) / 60;
      const netMaas = (normalSaat * saatlikUcret) + (mesaiSaat * saatlikUcret * 1.5);
      return { ...k, saatlikUcret: saatlikUcret.toFixed(2), normalSaat: normalSaat.toFixed(1), mesaiSaat: mesaiSaat.toFixed(1), netMaas: netMaas.toFixed(2) };
    });

    return NextResponse.json({ hafta: haftaBaslangic, bitis: haftaSonu, personel: sonuc });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

### ADIM 2 — PersonelDevamBar'a "Haftalık Özet" sekmesi ekle

app/app/page.js içinde PersonelDevamBar fonksiyonunu bul.
useState'e `[haftalikTab, setHaftalikTab] = useState('gunluk')` ekle.
2 sekme butonu ekle: "Günlük Devam" ve "📊 Haftalık Özet".

Haftalık özet sekmesinde tablo:

- Sütunlar: Ad | Bu Hafta Saat | Mesai | Net Maaş Tahmini
- useEffect ile `/api/personel-haftalik` çağır
- Yeşil badge: net maaş tutarı

### KURALLAR

❌ Başka dosyaya dokunma
✅ api/personel-haftalik/route.js oluştur
✅ PersonelDevamBar'a haftalık sekme ekle
✅ git add + commit + push yap

TAMAMLAYINCA YAZ: "AMELE 1 GN:012B UYGULAMA TAMAMLANDI"
════════════════════════════════════════════════════════════════
