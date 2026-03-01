════════════════════════════════════════════════════════════════
⚔️ MK:4721 — ASKER GÖREVİ — MODELLER BÖLÜMÜ TAM UYGULAMA
GN:017A-REV | 01 Mart 2026
YETKİ: Üsteğmen (Antigravity/Claude) tarafından verilmiştir.
Üsteğmene ulaşmak için: yeni kod yazmadan önce MODELLER-OZELLIK-LISTESI.md dosyasını oku.
════════════════════════════════════════════════════════════════

PROJE: C:\Users\Admin\Desktop\Kamera-Panel
DOSYA: app/app/page.js (başlıca)
SERVER: npm run dev çalışıyor (app/ klasöründe)
TEST: <http://localhost:3000>

ÖNCELİKLE OKU:

1. MODELLER-OZELLIK-LISTESI.md — Tam özellik listesi
2. PROJE-AMACI-MK4721.md — Proje amacı ve ekip yapısı
3. agent-team/KURALLAR.md — Genel kurallar

════════════════════════
PAZARTESİ KRİTİK GÖREVLERİN (önce bunları yap):
════════════════════════

─────────────────────────────────────
GÖREV 1 — C1: Beden Sayısı TEXT yap
─────────────────────────────────────
page.js → NewModelModal içinde beden_sayisi:
  type="number" → type="text" (boşluk kabul etmeli: "S M L XL" veya "36 38 40")

─────────────────────────────────────
GÖREV 2 — F2: Dikim Operasyonu Makine Tipi Satırları
─────────────────────────────────────
NewModelModal içindeki dikim operasyonu bölümünü bul.
ŞU AN nasıl çalışıyor? (tek input mu, çoklu mu?) → Bul, oku.

OLMASI GEREKEN yapı:
Her satır = Makine tipi + Adet + Detay + Sil butonu
Alt kısım = + Satır Ekle butonu

```javascript
// State
const [dikimSatirlari, setDikimSatirlari] = useState([
  { tip: 'duz', adet: 1, detay: '' }
]);

const makineTipleri = [
  { key: 'duz', label: '🔵 Düz Makina' },
  { key: 'overlok', label: '🟢 Overlok' },
  { key: 'recme', label: '🟡 Reçme' },
  { key: 'biye', label: '🟠 Biye Makinası' },
  { key: 'dugme', label: '⚫ Düğme Makinası' },
  { key: 'elle', label: '🤚 Elle Yapılır' },
  { key: 'diger', label: '⚪ Diğer' },
];

// UI
{dikimSatirlari.map((satir, i) => (
  <div key={i} style={{display:'flex',gap:'8px',marginBottom:'6px',alignItems:'center'}}>
    <select className="form-input" style={{flex:'0 0 160px'}} value={satir.tip}
      onChange={e=>{const yeni=[...dikimSatirlari];yeni[i]={...yeni[i],tip:e.target.value};setDikimSatirlari(yeni);}}>
      {makineTipleri.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
    </select>
    <input type="number" className="form-input" style={{width:'70px'}} placeholder="Adet" min="1" value={satir.adet}
      onChange={e=>{const yeni=[...dikimSatirlari];yeni[i]={...yeni[i],adet:e.target.value};setDikimSatirlari(yeni);}} />
    <input className="form-input" style={{flex:1}} placeholder="İşlem detayı..." value={satir.detay}
      onChange={e=>{const yeni=[...dikimSatirlari];yeni[i]={...yeni[i],detay:e.target.value};setDikimSatirlari(yeni);}} />
    <button onClick={()=>setDikimSatirlari(dikimSatirlari.filter((_,ii)=>ii!==i))}
      style={{padding:'0 10px',height:'36px',background:'rgba(231,76,60,0.15)',border:'none',borderRadius:'6px',cursor:'pointer'}}>✕</button>
  </div>
))}
<button onClick={()=>setDikimSatirlari([...dikimSatirlari,{tip:'duz',adet:1,detay:''}])}
  style={{padding:'6px 14px',background:'rgba(52,152,219,0.12)',border:'1px dashed rgba(52,152,219,0.4)',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>
  + Makine Satırı Ekle
</button>
```

─────────────────────────────────────
GÖREV 3 — D1/D2: Parça Listesi
─────────────────────────────────────
NewModelModal'da "Parça Listesi" bölümü YOKSA ekle:

```jsx
<div style={{marginTop:'14px',padding:'12px',background:'var(--bg-input)',borderRadius:'8px'}}>
  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'8px'}}>🧩 Parça Listesi</div>
  {(form.parcalar||[]).map((p,i)=>(
    <div key={i} style={{display:'flex',gap:'8px',marginBottom:'6px'}}>
      <input className="form-input" style={{flex:1}} placeholder={`Parça ${i+1} (Ön beden, Sol kol...)`}
        value={p.ad||''} onChange={e=>{const yeni=[...(form.parcalar||[])];yeni[i]={...yeni[i],ad:e.target.value};setForm(f=>({...f,parcalar:yeni}));}} />
      <button onClick={()=>setForm(f=>({...f,parcalar:(f.parcalar||[]).filter((_,ii)=>ii!==i)}))}
        style={{padding:'0 10px',background:'rgba(231,76,60,0.15)',border:'none',borderRadius:'6px',cursor:'pointer'}}>✕</button>
    </div>
  ))}
  <button onClick={()=>setForm(f=>({...f,parcalar:[...(f.parcalar||[]),{ad:''}]}))}
    style={{padding:'6px 14px',background:'rgba(52,152,219,0.12)',border:'1px dashed rgba(52,152,219,0.4)',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>
    + Parça Ekle
  </button>
</div>
```

─────────────────────────────────────
GÖREV 4 — E3/E4: Arka fotoğraf alanı
─────────────────────────────────────
Teknik Föy sekmesinde şu an sadece 1 fotoğraf yükleme varsa:
Ön görünüş + Arka görünüş + Detay fotoğrafı için 3 ayrı upload alanı ekle.

════════════════════════
RAPOR FORMATI
════════════════════════

Her görev için:
✅/❌ [Görev numarası]: [Ne yaptım] — [Hangi satırda, ne değiştirdim]

Hata aldıysam:
❌ [Görev]: [Hata mesajı] — [Ne denedim]

Yapamadıklarım:
[Görev]: [Neden yapamadım] — [Üsteğmene bildir]

GİT: git add -A && git commit -m "Modeller: beden-text+makine-tipi+parca-listesi+arka-foto" && git push

TAMAMLAYINCA: "ASKER GN:017A MODELLER PAZARTESİ GÖREVLERİ TAMAMLANDI"
════════════════════════════════════════════════════════════════
