════════════════════════════════════════════════════════════════
⚔️ MK:4721 — ASKER GÖREVİ (GN:013A) — ÜRETİM BAŞLAMA
════════════════════════════════════════════════════════════════

Proje: C:\Users\Admin\Desktop\Kamera-Panel
Dosya: app/app/page.js → ProductionPage
Stack: Next.js 14, React, SQLite

MEVCUT DURUM:

- handleStart() → activeSession oluşturur → timer başlar → handleStop() → kayıt
- Tek personel, tek işlem, tek model seçilir

EKSİK 1 — PARTİ BAĞLANTISI:
handleStart içinde parti_no seçimi ekle.
UretimTabBar'dan girilen partilerden seçim yapılabilmeli.

Şu değişikliği yap:

1. ProductionPage'e state ekle: const [seciliParti, setSeciliParti] = useState('');
2. Model seçim dropdown'ının ÜSTÜNE parti seçim ekle:

<div style={{marginBottom:'12px'}}>
  <label style={{fontSize:'12px',color:'var(--text-muted)',display:'block',marginBottom:'4px'}}>📦 Üretim Partisi</label>
  <PartiBaglantisi seciliModel={selectedModel} onSecim={setSeciliParti} />
</div>

1. Bu componenti ekle (ProductionPage'den ÖNCE):

function PartiBaglantisi({ seciliModel, onSecim }) {
  const [partiler, setPartiler] = React.useState([]);
  React.useEffect(() => {
    if (!seciliModel) return;
    fetch('/api/uretim-giris').then(r=>r.json()).then(d => {
      setPartiler(Array.isArray(d) ? d.filter(p => p.model_id === parseInt(seciliModel)) : []);
    }).catch(()=>{});
  }, [seciliModel]);
  if (!seciliModel || partiler.length === 0) return <div style={{fontSize:'12px',color:'var(--text-muted)',padding:'6px'}}>← Önce model seçin veya Üretim Girişi yapın</div>;
  return (
    <select className="form-input" onChange={e => onSecim(e.target.value)} defaultValue="">
      <option value="">-- Parti Seç (opsiyonel) --</option>
      {partiler.map(p => (
        <option key={p.id} value={p.id}>
          {p.parti_no || 'Parti #'+p.id} — {new Date(p.created_at).toLocaleDateString('tr-TR')}
        </option>
      ))}
    </select>
  );
}

1. handleStart içinde seciliParti'yi activeSession'a ekle:
   parti_id: seciliParti ? parseInt(seciliParti) : null

EKSİK 2 — ÜRETİM AKIŞ DURUMU:
handleStop sonrası bir sonraki işlem önerisi göster.

handleStop'un sonuna ekle (başarılı kayıt sonrası):
addToast('info', `⏭️ Sıradaki işlem: ${operations[currentOpIndex+1]?.name || 'Son işlem tamamlandı'}`);

KURALLAR:
❌ Başka fonksiyon silme/değiştirme
✅ Sadece belirtilen eklentiler
✅ git add -A && git commit -m "Uretim baslama: parti baglantisi + akis" && git push

TAMAMLAYINCA: "ASKER GN:013A TAMAMLANDI"
════════════════════════════════════════════════════════════════
