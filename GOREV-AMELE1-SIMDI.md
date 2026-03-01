════════════════════════════════════════════════════════════════
⚔️ MK:4721 — AMELE 1 GÖREVİ — MODELLER DB + API GENİŞLETME
GN:017B-REV | 01 Mart 2026
YETKİ: Üsteğmen (Antigravity/Claude)
════════════════════════════════════════════════════════════════

PROJE: C:\Users\Admin\Desktop\Kamera-Panel
ÖNCELİKLE OKU: MODELLER-OZELLIK-LISTESI.md

════════════════════════
PAZARTESİ GÖREVLERİN:
════════════════════════

─────────────────────────────────────
GÖREV 1 — A4/A5/B1/B2: MODEL TABLO GÜNCELLEMESİ
─────────────────────────────────────
lib/db.js veya app/app/api/models/route.js dosyasını bul.
models tablosuna şu sütunları YOKSA ekle:

```javascript
// ensureTables içine ekle:
db.exec(`
  ALTER TABLE models ADD COLUMN musteri TEXT;
  ALTER TABLE models ADD COLUMN sezon TEXT;
  ALTER TABLE models ADD COLUMN kumas_cinsi TEXT;
  ALTER TABLE models ADD COLUMN gramaj INTEGER;
  ALTER TABLE models ADD COLUMN kumas_icerik TEXT;
  ALTER TABLE models ADD COLUMN renk_secenekleri TEXT;
`);
```

NOT: better-sqlite3'te ALTER TABLE hata verirse tek tek dene.
Hata alırsan: db.prepare("ALTER TABLE models ADD COLUMN musteri TEXT").run(); try/catch içinde.

─────────────────────────────────────
GÖREV 2 — D1/D2: PARÇALAR TABLOSU
─────────────────────────────────────
Yeni tablo oluştur (yoksa):

```javascript
db.exec(`
  CREATE TABLE IF NOT EXISTS model_parcalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    sira INTEGER DEFAULT 0,
    ad TEXT NOT NULL,
    kesim_yonu TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES models(id)
  )
`);
```

API endpoint: app/app/api/model-parcalar/route.js (YENİ OLUŞTUR)

```javascript
import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const model_id = searchParams.get('model_id');
  const parcalar = db.prepare('SELECT * FROM model_parcalar WHERE model_id=? ORDER BY sira').all(model_id);
  return NextResponse.json(parcalar);
}

export async function POST(request) {
  const db = getDb();
  const { model_id, parcalar } = await request.json();
  // Önce eskilerini sil
  db.prepare('DELETE FROM model_parcalar WHERE model_id=?').run(model_id);
  // Yenilerini ekle
  const insert = db.prepare('INSERT INTO model_parcalar (model_id, sira, ad) VALUES (?,?,?)');
  parcalar.forEach((p, i) => insert.run(model_id, i, p.ad));
  return NextResponse.json({ ok: true, count: parcalar.length });
}
```

─────────────────────────────────────
GÖREV 3 — A4/A5, B1/B2: UI ALANLARI
─────────────────────────────────────
NewModelModal'da "Temel Bilgiler" bölümüne ekle:

```jsx
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'10px'}}>
  <div>
    <label style={{fontSize:'12px',color:'var(--text-muted)',display:'block',marginBottom:'4px'}}>Müşteri / Marka</label>
    <input className="form-input" placeholder="ABC Tekstil..." value={form.musteri||''} onChange={e=>setForm(f=>({...f,musteri:e.target.value}))} />
  </div>
  <div>
    <label style={{fontSize:'12px',color:'var(--text-muted)',display:'block',marginBottom:'4px'}}>Sezon</label>
    <select className="form-input" value={form.sezon||''} onChange={e=>setForm(f=>({...f,sezon:e.target.value}))}>
      <option value="">-- Sezon --</option>
      <option>İlkbahar/Yaz</option>
      <option>Sonbahar/Kış</option>
      <option>4 Mevsim</option>
    </select>
  </div>
  <div>
    <label style={{fontSize:'12px',color:'var(--text-muted)',display:'block',marginBottom:'4px'}}>Kumaş Cinsi</label>
    <input className="form-input" placeholder="Poplin, Gabardin..." value={form.kumas_cinsi||''} onChange={e=>setForm(f=>({...f,kumas_cinsi:e.target.value}))} />
  </div>
  <div>
    <label style={{fontSize:'12px',color:'var(--text-muted)',display:'block',marginBottom:'4px'}}>Gramaj (gr/m²)</label>
    <input type="number" className="form-input" placeholder="120" value={form.gramaj||''} onChange={e=>setForm(f=>({...f,gramaj:e.target.value}))} />
  </div>
</div>
```

════════════════════════
RAPOR FORMATI
════════════════════════

Her görev için:
✅/❌ [Görev]: [Ne yaptım, hangi dosya hangi satır]

GİT: git add -A && git commit -m "Modeller DB: musteri+sezon+kumas+parca tablosu" && git push

TAMAMLAYINCA: "AMELE 1 GN:017B MODELLER DB TAMAMLANDI"
════════════════════════════════════════════════════════════════
