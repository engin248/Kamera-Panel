════════════════════════════════════════════════════════════════
⚔️ MK:4721 — AMELE 2 GÖREVİ (GN:013C) — GÜNLÜK ÜRETİM ÖZETİ
════════════════════════════════════════════════════════════════

Proje: C:\Users\Admin\Desktop\Kamera-Panel
Stack: Next.js 14, SQLite (better-sqlite3)

GÖREV: Günlük Üretim Özet API + Dashboard kartı

ADIM 1 — API ENDPOINT:
Dosya: app/app/api/uretim-ozet/route.js (YENİ OLUŞTUR)

import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const tarih = searchParams.get('tarih') || new Date().toISOString().split['T'](0);

    const ozet = db.prepare(`
      SELECT 
        COUNT(*) as kayit_sayisi,
        COALESCE(SUM(total_produced),0) as toplam_uretim,
        COALESCE(SUM(defective_count),0) as toplam_hata,
        COALESCE(AVG(oee_score),0) as ort_oee,
        COALESCE(SUM(unit_value),0) as toplam_deger,
        COUNT(DISTINCT personnel_id) as aktif_personel,
        COUNT(DISTINCT model_id) as farkli_model
      FROM production_logs
      WHERE DATE(created_at) = ? AND deleted_at IS NULL
    `).get(tarih);

    const fpy = ozet.toplam_uretim > 0 
      ? ((ozet.toplam_uretim - ozet.toplam_hata) / ozet.toplam_uretim * 100).toFixed(1) 
      : 100;

    const hedef = 500; // günlük hedef (sabit, sonra ayarlanabilir)
    const hedef_yuzdesi = Math.min(100, (ozet.toplam_uretim / hedef * 100)).toFixed(0);

    return NextResponse.json({ ...ozet, fpy, hedef, hedef_yuzdesi, tarih });
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

ADIM 2 — ProductionPage'e özet kartı ekle:
page.js içinde ProductionPage'de stat kartlarının ÜSTÜNE bir "Günlük Hedef" progress bar ekle:

<GunlukHedefBar tarih={filterDate} />

Ve componenti (ProductionPage'den ÖNCE) ekle:

function GunlukHedefBar({ tarih }) {
  const [ozet, setOzet] = React.useState(null);
  React.useEffect(() => {
    fetch(`/api/uretim-ozet?tarih=${tarih}`).then(r=>r.json()).then(setOzet).catch(()=>{});
  }, [tarih]);
  if (!ozet) return null;
  return (
    <div style={{background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:'12px',padding:'14px 16px',marginBottom:'12px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
        <span style={{fontWeight:'700',fontSize:'13px'}}>📈 Günlük Hedef Takibi</span>
        <span style={{fontSize:'12px',color:'var(--text-muted)'}}>{ozet.toplam_uretim} / {ozet.hedef} adet</span>
      </div>
      <div style={{height:'8px',background:'var(--bg-input)',borderRadius:'4px',overflow:'hidden'}}>
        <div style={{height:'100%',width:`${ozet.hedef_yuzdesi}%`,background:ozet.hedef_yuzdesi>=80?'#27ae60':ozet.hedef_yuzdesi>=50?'#f39c12':'#e74c3c',borderRadius:'4px',transition:'width 0.5s'}} />
      </div>
      <div style={{display:'flex',gap:'16px',marginTop:'8px',fontSize:'11px',color:'var(--text-muted)'}}>
        <span>FPY: <strong style={{color:'#27ae60'}}>{ozet.fpy}%</strong></span>
        <span>Aktif: <strong>{ozet.aktif_personel} kişi</strong></span>
        <span>Değer: <strong>{parseFloat(ozet.toplam_deger).toFixed(2)} ₺</strong></span>
      </div>
    </div>
  );
}

KURALLAR:
✅ app/app/api/uretim-ozet/route.js oluştur
✅ GunlukHedefBar componenti ekle
✅ ProductionPage'de UretimTabBar'ın ALTINA <GunlukHedefBar> koy
✅ git add -A && git commit -m "Gunluk uretim ozet API + hedef bar" && git push

TAMAMLAYINCA: "AMELE 2 GN:013C TAMAMLANDI"
════════════════════════════════════════════════════════════════
