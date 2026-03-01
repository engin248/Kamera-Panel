════════════════════════════════════════════════════════════════
⚔️ MK:4721 — FİNAL ASKER GÖREVİ — MODELLER BÖLÜMÜ
GN:019-FİNAL | 01 Mart 2026 | Kurul Onaylı
YETKİ: Üsteğmen + Komutan tarafından verilmiştir.
════════════════════════════════════════════════════════════════

PROJE: C:\Users\Admin\Desktop\Kamera-Panel
SERVER: npm run dev — app/ klasöründe çalışıyor
TEST: <http://localhost:3000>

ÖNCELİKLE OKU:

- MODELLER-OZELLIK-LISTESI.md (TAM LİSTE — KURUL ONAYLI)
- PROJE-AMACI-MK4721.md

════════════════════════
📋 PAZARTESİ ZORUNLU — ASKER YAPACAK
════════════════════════

─────────────────────────────────────
✅ GÖREV 1 — C1: BEDEN SAYISI TEXT YAP
─────────────────────────────────────
page.js → NewModelModal → beden_sayisi input:
  type="number" → type="text"
  placeholder → "S M L XL  veya  36 38 40 42"

─────────────────────────────────────
✅ GÖREV 2 — F2: MAKİNE TİPİ SATIRLARI
─────────────────────────────────────
NewModelModal → dikim operasyonu bölümü:
Her satır: [Makine Tipi Select] [Adet] [Detay] [Sil]
Alt: + Makine Satırı Ekle butonu

Makine tipleri:
🔵 Düz Makina | 🟢 Overlok | 🟡 Reçme | 🟠 Biye | ⚫ Düğme | 🤚 Elle | ⚪ Diğer

─────────────────────────────────────
✅ GÖREV 3 — D1/D2: PARÇA LİSTESİ
─────────────────────────────────────
NewModelModal'a parça listesi bölümü ekle:
Her satır: [Parça adı] [Sil]
Alt: + Parça Ekle butonu

─────────────────────────────────────
✅ GÖREV 4 — BOM: HAMMADDE REÇETESİ
─────────────────────────────────────
NewModelModal'a "Malzeme" bölümü ekle:

```jsx
<div style={{marginTop:'14px',padding:'12px',background:'var(--bg-input)',borderRadius:'8px'}}>
  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'8px'}}>📦 Hammadde Reçetesi (BOM)</div>
  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
    <div>
      <label style={{fontSize:'11px',color:'var(--text-muted)'}}>Kumaş Miktarı (m/100 adet)</label>
      <input type="number" step="0.1" className="form-input" placeholder="85.5"
        value={form.kumas_metre||''} onChange={e=>setForm(f=>({...f,kumas_metre:e.target.value}))} />
    </div>
    <div>
      <label style={{fontSize:'11px',color:'var(--text-muted)'}}>Fire Oranı %</label>
      <input type="number" step="0.1" className="form-input" placeholder="5"
        value={form.fire_oran||''} onChange={e=>setForm(f=>({...f,fire_oran:e.target.value}))} />
    </div>
    <div>
      <label style={{fontSize:'11px',color:'var(--text-muted)'}}>Düğme Adedi (adet/ürün)</label>
      <input type="number" className="form-input" placeholder="7"
        value={form.dugme_adet||''} onChange={e=>setForm(f=>({...f,dugme_adet:e.target.value}))} />
    </div>
    <div>
      <label style={{fontSize:'11px',color:'var(--text-muted)'}}>Fermuar Adedi</label>
      <input type="number" className="form-input" placeholder="1"
        value={form.fermuar_adet||''} onChange={e=>setForm(f=>({...f,fermuar_adet:e.target.value}))} />
    </div>
  </div>
  <div style={{marginTop:'8px',fontSize:'12px',color:'var(--accent)',fontWeight:'600'}}>
    Net kumaş: {form.kumas_metre && form.fire_oran ?
      ((parseFloat(form.kumas_metre)||0) * (1 + (parseFloat(form.fire_oran)||0)/100)).toFixed(1) + ' m/100 adet (fire dahil)' : '—'}
  </div>
</div>
```

models tablosuna sütun ekle (lib/db.js veya API içinde):
kumas_metre REAL, fire_oran REAL, dugme_adet INTEGER, fermuar_adet INTEGER

─────────────────────────────────────
✅ GÖREV 5 — KK: KALİTE KONTROLEKRİTERLERİ
─────────────────────────────────────
NewModelModal'a "Kalite" bölümü ekle:

```jsx
<div style={{marginTop:'14px',padding:'12px',background:'var(--bg-input)',borderRadius:'8px'}}>
  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'8px'}}>✅ Kalite Kriterleri</div>
  <div>
    <label style={{fontSize:'11px',color:'var(--text-muted)'}}>Ölçü Toleransı (±cm)</label>
    <input type="number" step="0.5" className="form-input" style={{width:'80px'}} placeholder="1"
      value={form.olcu_tolerans||''} onChange={e=>setForm(f=>({...f,olcu_tolerans:e.target.value}))} />
  </div>
  <div style={{marginTop:'8px'}}>
    <label style={{fontSize:'11px',color:'var(--text-muted)'}}>Kabul Edilemez Kusurlar</label>
    <textarea className="form-input" style={{minHeight:'60px'}} 
      placeholder="Dikiş ayrılması, renk sapması >1 ton, beden hatası >1cm..."
      value={form.kusur_kriterleri||''} onChange={e=>setForm(f=>({...f,kusur_kriterleri:e.target.value}))} />
  </div>
</div>
```

models tablosuna: olcu_tolerans REAL, kusur_kriterleri TEXT

════════════════════════
🧪 TEST YETKİSİ VE SORUMLULUĞU
════════════════════════

Her görev sonrası HEMEN TEST ET:

1. localhost:3000 → Modeller
2. Yeni Model Oluştur butonuna bas
3. İlgili alanı doldur
4. Kaydet
5. Listede görünüyor mu? Kontrol et
6. Aynı modeli düzenle → değişiklik kalıcı mı?

⚠️ KURAL: Testi geçmeyen kod commit edilmez.

════════════════════════
RAPOR FORMATI
════════════════════════

Her görev için:
✅ GÖREV [N] TAMAMLANDI

- Yaptığım: [kısa açıklama]
- Test sonucu: ✅ Çalışıyor / ❌ Hata: [ne oldu]
- Commit: [commit hash]

GİT: git add -A && git commit -m "Modeller-Final: G[N]-[açıklama]" && git push

TAMAMLAYINCA: "ASKER GN:019-FİNAL MODELLER PAZARTESİ GÖREVLERİ TAMAMLANDI"
════════════════════════════════════════════════════════════════
