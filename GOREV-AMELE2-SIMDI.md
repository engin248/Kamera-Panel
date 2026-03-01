════════════════════════════════════════════════════════════════
⚔️ MK:4721 — AMELE 2 GÖREVİ (GN:012C)
Engin Bey'in 3 çocuğu için. Vatan ve insanlık hayrına.
════════════════════════════════════════════════════════════════

SEN: Amele/Çırak 2 (uygulayıcı)
KOMUTAN: Üsteğmen (Antigravity)
PROJE: Kamera-Panel — Tekstil Üretim Takip
STACK: Next.js 14, SQLite (better-sqlite3)

════════════════════════════════════════════════════════════════
GÖREVİN — FASON FİYAT HESAP MOTORU
════════════════════════════════════════════════════════════════

### ADIM 1 — API ENDPOINT

Dosya: app/app/api/fason-fiyat-hesapla/route.js (YENİ OLUŞTUR)

```javascript
import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(request) {
  try {
    const db = getDb();
    const { model_id, kar_marji_yuzde = 20, ek_malzeme_tl = 0, nakliye_tl = 0, toplam_adet = 1 } = await request.json();

    // 1. Son ay saatlik maliyet
    const gider = db.prepare('SELECT saatlik_maliyet FROM isletme_giderleri ORDER BY yil DESC, ay DESC LIMIT 1').get();
    const saatlik_maliyet = gider?.saatlik_maliyet || 0;

    // 2. Model işlem süreleri toplamı (dakika → saat)
    const sureler = db.prepare(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN standard_time_max IS NOT NULL THEN (standard_time_min + standard_time_max) / 2.0
          ELSE COALESCE(standard_time_min, 0)
        END
      ), 0) as toplam_saniye
      FROM operations WHERE model_id = ?
    `).get(model_id);
    const tahmini_sure_saat = (sureler?.toplam_saniye || 0) / 3600;

    // 3. Hesaplamalar
    const iscilik = saatlik_maliyet * tahmini_sure_saat;
    const maliyet_alt = iscilik + ek_malzeme_tl + nakliye_tl;
    const fason_fiyat = maliyet_alt * (1 + kar_marji_yuzde / 100);
    const birim_fiyat = toplam_adet > 0 ? fason_fiyat / toplam_adet : fason_fiyat;

    const kar_zarar_sinyal = kar_marji_yuzde >= 20 ? 'karli' : kar_marji_yuzde >= 10 ? 'riskli' : 'zararlı';

    return NextResponse.json({
      saatlik_maliyet: saatlik_maliyet.toFixed(2),
      tahmini_sure_saat: tahmini_sure_saat.toFixed(2),
      iscilik_maliyeti: iscilik.toFixed(2),
      maliyet_alt: maliyet_alt.toFixed(2),
      fason_fiyat: fason_fiyat.toFixed(2),
      birim_fiyat: birim_fiyat.toFixed(2),
      kar_zarar_sinyal,
      kar_marji_yuzde
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

### ADIM 2 — IsletmeGiderForm'a Fason Hesap UI ekle

app/app/page.js içinde IsletmeGiderForm fonksiyonunu bul.
Formun altına "Fason Fiyat Hesapla" bölümü ekle:

```jsx
{/* FASON FİYAT HESAP */}
<div style={{ marginTop: '16px', padding: '12px', background: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '8px' }}>
  <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>🧮 Fason Fiyat Hesapla</div>
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
    <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kâr Marjı %</label>
      <input type="number" className="form-input" style={{ width: '80px' }} defaultValue={20} id="fason-kar" /></div>
    <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ek Malzeme ₺</label>
      <input type="number" className="form-input" style={{ width: '100px' }} defaultValue={0} id="fason-malzeme" /></div>
    <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nakliye ₺</label>
      <input type="number" className="form-input" style={{ width: '80px' }} defaultValue={0} id="fason-nakliye" /></div>
    <button onClick={async () => {
      const r = await fetch('/api/fason-fiyat-hesapla', { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ kar_marji_yuzde: parseFloat(document.getElementById('fason-kar').value), ek_malzeme_tl: parseFloat(document.getElementById('fason-malzeme').value), nakliye_tl: parseFloat(document.getElementById('fason-nakliye').value) })
      });
      const d = await r.json();
      alert(`Fason: ${d.fason_fiyat} TL | Birim: ${d.birim_fiyat} TL | Sinyal: ${d.kar_zarar_sinyal}`);
    }} style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Hesapla</button>
  </div>
</div>
```

### KURALLAR

❌ Başka dosyaya dokunma
✅ api/fason-fiyat-hesapla/route.js oluştur
✅ IsletmeGiderForm'a fason hesap ekle
✅ git add + commit + push yap

TAMAMLAYINCA YAZ: "AMELE 2 GN:012C UYGULAMA TAMAMLANDI"
════════════════════════════════════════════════════════════════
