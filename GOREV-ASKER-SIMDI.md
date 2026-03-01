════════════════════════════════════════════════════════════════
⚔️ MK:4721 — ASKER GÖREVİ (GN:012A)
Engin Bey'in 3 çocuğu için. Vatan ve insanlık hayrına.
════════════════════════════════════════════════════════════════

SEN: Asker (uygulayıcı yazılım geliştirici)
KOMUTAn: Üsteğmen (Antigravity/Claude)
PROJE: Kamera-Panel → Tekstil Üretim Takip Sistemi
STACK: Next.js 14 (App Router), SQLite (better-sqlite3), React hooks

════════════════════════════════════════════════════════════════
GÖREVİN — SESLİ KOMUT PARSER UYGULAMASI
════════════════════════════════════════════════════════════════

Dosya: app/app/page.js
Mevcut: useVoiceInput hook var (satır ~1-80 arası)
Eklenecek: parseVoiceCommand fonksiyonu + useVoiceCommands hook

### ADIM 1 — parseVoiceCommand fonksiyonu

GN012 raporundaki kodu AYNEN kullanarak bu fonksiyonu page.js'e ekle.
Ekleme yeri: useVoiceInput hooku'nun HEMEN ALTINA.

```javascript
// ========== SESLİ KOMUT PARSER ==========
function parseVoiceCommand(transcript, models, personnel) {
  const t = transcript.toLowerCase().trim();
  const words = t.split(' ');

  // 1. "X Y adet tamamladı"
  const adetMatch = t.match(/(.+?)\s+(\d+)\s+adet\s+tamamla/);
  if (adetMatch) {
    const personAdi = adetMatch[1];
    const adet = parseInt(adetMatch[2]);
    const person = personnel.find(p => p.name.toLowerCase().includes(personAdi));
    return { action: 'production_add', params: { personnel_id: person?.id, total_produced: adet, personAdi } };
  }

  // 2. "X giriş yaptı"
  const girisMatch = t.match(/(.+?)\s+giriş\s+yaptı/);
  if (girisMatch) {
    const personAdi = girisMatch[1];
    const person = personnel.find(p => p.name.toLowerCase().includes(personAdi));
    return { action: 'personel_giris', params: { personel_id: person?.id, personAdi } };
  }

  // 3. "X çıkış yaptı"
  const cikisMatch = t.match(/(.+?)\s+çıkış\s+yaptı/);
  if (cikisMatch) {
    const personAdi = cikisMatch[1];
    const person = personnel.find(p => p.name.toLowerCase().includes(personAdi));
    return { action: 'personel_cikis', params: { personel_id: person?.id, personAdi } };
  }

  // 4. "bugünkü üretim kaç"
  if (t.includes('bugünkü üretim') || t.includes('bugunki uretim')) return { action: 'uretim_sorgu', params: {} };

  // 5. "makine X arızalı"
  const arizaMatch = t.match(/makine\s+(\w+)\s+arızal/);
  if (arizaMatch) return { action: 'makine_ariza', params: { makine: arizaMatch[1] } };

  // 6. "vardiya değişimi"
  if (t.includes('vardiya')) return { action: 'vardiya', params: {} };

  // 7. "üretim raporu"
  if (t.includes('üretim raporu') || t.includes('rapor')) return { action: 'uretim_rapor', params: {} };

  return null;
}

// ========== SESLİ KOMUT YÜRÜTÜCÜ ==========
async function executeVoiceCommand(parsed, addToast) {
  if (!parsed) { addToast('warning', '🎙️ Komut anlaşılamadı'); return; }
  const { action, params } = parsed;
  try {
    if (action === 'production_add') {
      await fetch('/api/production', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personnel_id: params.personnel_id, total_produced: params.total_produced, defective_count: 0, notes: 'Sesli komut' })
      });
      addToast('success', `✅ ${params.personAdi}: ${params.total_produced} adet kaydedildi`);
    } else if (action === 'personel_giris') {
      await fetch('/api/personel-saat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personel_id: params.personel_id, tip: 'giris' })
      });
      addToast('success', `✅ ${params.personAdi} giriş kaydedildi`);
    } else if (action === 'personel_cikis') {
      await fetch('/api/personel-saat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personel_id: params.personel_id, tip: 'cikis' })
      });
      addToast('success', `✅ ${params.personAdi} çıkış kaydedildi`);
    } else if (action === 'uretim_sorgu') {
      const r = await fetch('/api/production?date=' + new Date().toISOString().split('T')[0]);
      const d = await r.json();
      const toplam = Array.isArray(d) ? d.reduce((s,l) => s+(l.total_produced||0),0) : 0;
      addToast('info', `📊 Bugün toplam: ${toplam} adet`);
    } else if (action === 'vardiya') {
      addToast('info', '🔄 Vardiya değişimi bildirisi: Kontrol edin');
    } else if (action === 'uretim_rapor') {
      addToast('info', '📄 Üretim raporu: Üretim Takip sayfasına gidin');
    } else if (action === 'makine_ariza') {
      addToast('warning', `⚠️ Makine ${params.makine} arıza kaydı oluşturuldu`);
    }
  } catch(e) { addToast('error', '❌ ' + e.message); }
}
```

### ADIM 2 — Üretim Takip sayfasında Sesli Komut butonu ekle

ProductionPage fonksiyonu içinde, stat kartlarının HEMEN ÜSTÜNE ekle:

```jsx
{/* 🎙️ SESLİ KOMUT BOTU */}
{(() => {
  const [sesliAktif, setSesliAktif] = useState(false);
  const [sonKomut, setSonKomut] = useState('');
  return (
    <div style={{ background: sesliAktif ? 'rgba(231,76,60,0.1)' : 'rgba(52,152,219,0.08)', border: `1px solid ${sesliAktif ? 'rgba(231,76,60,0.4)' : 'rgba(52,152,219,0.2)'}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={() => {
        if (!sesliAktif) {
          setSesliAktif(true);
          const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
          rec.lang = 'tr-TR'; rec.interimResults = false; rec.maxAlternatives = 1;
          rec.onresult = async (e) => {
            const t = e.results[0][0].transcript;
            setSonKomut(t);
            const parsed = parseVoiceCommand(t, models, personnel);
            await executeVoiceCommand(parsed, addToast);
            setSesliAktif(false);
          };
          rec.onerror = () => setSesliAktif(false);
          rec.onend = () => setSesliAktif(false);
          rec.start();
        }
      }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: sesliAktif ? '#e74c3c' : 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {sesliAktif ? '⏹' : '🎙️'}
      </button>
      <div>
        <div style={{ fontWeight: '700', fontSize: '13px' }}>Sesli Komut Botu {sesliAktif && <span style={{color:'#e74c3c'}}>● Dinliyor...</span>}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sonKomut || '"Ahmet 5 adet tamamladı" — "Mehmet giriş yaptı" — "Bugünkü üretim kaç"'}</div>
      </div>
    </div>
  );
})()}
```

### KURALLAR

❌ Başka dosyaya dokunma
❌ Mevcut kodu silme
✅ Sadece page.js'e ekle
✅ git add + commit + push yap

TAMAMLAYINCA YAZ: "ASKER GN:012A UYGULAMA TAMAMLANDI"
════════════════════════════════════════════════════════════════
