════════════════════════════════════════════════════════════════
⚔️ MK:4721 — AMELE 1 GÖREVİ — MODELLER PENCERESİ EKSİK RAPOR
GN:017B | 01 Mart 2026
════════════════════════════════════════════════════════════════

SEN: Amele 1 (Analiz + Rapor)
KOMUTAN: Üsteğmen (Antigravity)
PROJE: Kamera-Panel — C:\Users\Admin\Desktop\Kamera-Panel

GÖREV: Modeller penceresinde GN016 raporunda belirlenen 2 eksiği uygula + rapor ver.

══════════════════════════════════════════
EKSİK 1 — MODEL STANDARTLARI DETAY
══════════════════════════════════════════

Modeller penceresinde her modelin detay sayfasında şunlar OLMALI:

- Kumaş cinsi (örn: Poplin, Gabardin, Brode)
- Kumaş gramajı (gr/m²)
- Renk seçenekleri
- Sezon (İlkbahar/Yaz/Sonbahar/Kış)
- Müşteri/Marka adı

Yapılacak:
NewModelModal içinde "Temel Bilgiler" sekmesine (veya formu yoksa doğrudan) şu alanları ekle:

```jsx
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'10px'}}>
  <div>
    <label style={{fontSize:'12px',color:'var(--text-muted)'}}>Kumaş Cinsi</label>
    <input className="form-input" placeholder="Poplin, Gabardin..." 
      value={form.kumas_cinsi||''} onChange={e=>setForm(f=>({...f,kumas_cinsi:e.target.value}))} />
  </div>
  <div>
    <label style={{fontSize:'12px',color:'var(--text-muted)'}}>Gramaj (gr/m²)</label>
    <input className="form-input" type="number" placeholder="120"
      value={form.gramaj||''} onChange={e=>setForm(f=>({...f,gramaj:e.target.value}))} />
  </div>
  <div>
    <label style={{fontSize:'12px',color:'var(--text-muted)'}}>Sezon</label>
    <select className="form-input" value={form.sezon||''} onChange={e=>setForm(f=>({...f,sezon:e.target.value}))}>
      <option value="">-- Sezon --</option>
      <option>İlkbahar/Yaz</option><option>Sonbahar/Kış</option><option>4 Mevsim</option>
    </select>
  </div>
  <div>
    <label style={{fontSize:'12px',color:'var(--text-muted)'}}>Müşteri/Marka</label>
    <input className="form-input" placeholder="Marka adı..."
      value={form.musteri||''} onChange={e=>setForm(f=>({...f,musteri:e.target.value}))} />
  </div>
</div>
```

Bu alanları models tablosuna ALTER TABLE ile ekle (lib/db.js veya API içinde):

```sql
ALTER TABLE models ADD COLUMN kumas_cinsi TEXT;
ALTER TABLE models ADD COLUMN gramaj INTEGER;
ALTER TABLE models ADD COLUMN sezon TEXT;
ALTER TABLE models ADD COLUMN musteri TEXT;
```

══════════════════════════════════════════
EKSİK 2 — PARÇA TAKİBİ
══════════════════════════════════════════

Her modelin kaç parçadan oluştuğu ve parça adları belli olmalı.
Örnek: Ön beden, Arka beden, Sol kol, Sağ kol, Yaka = 5 parça

NewModelModal'a "Parça Listesi" bölümü ekle:

```jsx
{/* PARÇA LİSTESİ */}
<div style={{marginTop:'12px'}}>
  <label style={{fontSize:'13px',fontWeight:'700'}}>🧩 Parça Listesi</label>
  {(form.parcalar||[{ad:''}]).map((p,i)=>(
    <div key={i} style={{display:'flex',gap:'8px',marginTop:'6px'}}>
      <input className="form-input" placeholder={`Parça ${i+1} adı (Ön beden, Kol...)`}
        value={p.ad} onChange={e=>{const yeni=[...(form.parcalar||[])];yeni[i]={...yeni[i],ad:e.target.value};setForm(f=>({...f,parcalar:yeni}));}} />
      <button onClick={()=>{const yeni=(form.parcalar||[]).filter((_,ii)=>ii!==i);setForm(f=>({...f,parcalar:yeni}));}}
        style={{padding:'0 10px',background:'rgba(231,76,60,0.2)',border:'none',borderRadius:'6px',cursor:'pointer'}}>✕</button>
    </div>
  ))}
  <button onClick={()=>setForm(f=>({...f,parcalar:[...(f.parcalar||[]),{ad:''}]}))}
    style={{marginTop:'8px',padding:'6px 12px',background:'rgba(52,152,219,0.15)',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>
    + Parça Ekle
  </button>
</div>
```

══════════════════════════════════════════
RAPOR FORMATI
══════════════════════════════════════════

YAPTIKLARIM:

- EKSİK 1: [nasıl yaptım, hangi satır değiştirdim]
- EKSİK 2: [nasıl yaptım]

YAPAMADIM:

- [neden yapamadım]

Git: git add -A && git commit -m "Modeller: kumas+sezon+musteri+parca takibi eklendi" && git push

TAMAMLAYINCA: "AMELE 1 GN:017B MODELLER EKSİK TAMAMLANDI"
════════════════════════════════════════════════════════════════
