# GÖREV M7 — Karar Arşivi UI

**Zorluk:** ⭐⭐ Orta  
**Sorumlu:** _____________

---

## Sorun

`/api/rapor/karar-arsivi` API'si çalışıyor (200 OK) ama Muhasebe sayfasında görsel arayüzü yok.

## Yapılacak

### 1. Muhasebe bolumler dizisine ekle

Dosya: `app/page.js` — MuhasebeDepartmaniPage içindeki `bolumler` dizisi:

```javascript
{ id: 'karar', label: '📜 Karar Arşivi' },
```

(Final'den hemen önce ekle)

### 2. State ekle

MuhasebeDepartmaniPage içinde:

```javascript
const [kararlar, setKararlar] = useState([]);
```

### 3. loadExtraRapor'a ekle

```javascript
else if (bolum === 'karar' && kararlar.length === 0) {
  setExtraLoading(true);
  try { const r = await fetch('/api/rapor/karar-arsivi'); const d = await r.json(); setKararlar(Array.isArray(d) ? d : d.data || []); }
  catch { }
  finally { setExtraLoading(false); }
}
```

### 4. Render bloğu ekle

Final bloğunun hemen önüne:

```jsx
{aktifBolum === 'karar' && (
  <div>
    {kararlar.length === 0 ? (
      <div style={{textAlign:'center',padding:'60px',color:'var(--text-muted)'}}>
        📜 Karar arşivi boş
      </div>
    ) : (
      <div style={{background:'var(--bg-card)',borderRadius:'14px',border:'1px solid var(--border-color)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
          <thead><tr style={{background:'var(--bg-input)'}}>
            {['Tarih','Konu','Karar','Sorumlu'].map(h=>(
              <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:'600',color:'var(--text-muted)',fontSize:'11px'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {kararlar.map((k,i)=>(
              <tr key={k.id||i} style={{borderTop:'1px solid var(--border-color)'}}>
                <td style={{padding:'10px 12px'}}>{k.tarih}</td>
                <td style={{padding:'10px 12px',fontWeight:'600'}}>{k.konu}</td>
                <td style={{padding:'10px 12px'}}>{k.karar}</td>
                <td style={{padding:'10px 12px',color:'var(--text-muted)'}}>{k.sorumlu_ad || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}
```

## Test

- [ ] Muhasebe → sekmeler arasında "📜 Karar Arşivi" var
- [ ] Tıklayınca tablo veya boş mesaj görünüyor
- [ ] Kayıt varsa satırlar doğru gösteriliyor

## DOKUNMA

İmalat, API route dosyaları, Sidebar'a DOKUNMA!
