════════════════════════════════════════════════════════════════
⚔️ MK:4721 — AMELE 1 GÖREVİ (GN:013B) — ÜRETİM TAKİP TABLO
════════════════════════════════════════════════════════════════

Proje: C:\Users\Admin\Desktop\Kamera-Panel
Dosya: app/app/page.js → ProductionPage
Stack: Next.js 14, React, SQLite

GÖREV: Üretim kayıtları tablosuna 3 yeni sütun ekle

Mevcut tablo: filteredLogs üzerinde döngü var.
Her satırda: personel, model, işlem, üretilen, hatalı, süre, FPY%, OEE, değer

EKLENECEK 3 SÜTUN:

1. Parti No — log.parti_no (API'den gelmesi lazım)
2. Birim Süre — (duration_seconds / total_produced).toFixed(1) + "s"
3. Durum badge — FPY >= 95 → 🟢 İyi | 85-95 → 🟡 Dikkat | <85 → 🔴 Müdahale

ADIM 1: /api/production/route.js dosyasına bak.
SELECT sorgusuna ekle: ug.parti_no (LEFT JOIN uretim_girisleri ug ON ug.model_id = pl.model_id)

ADIM 2: Tablodaki satırlarda şu 3 hücreyi ekle:
<td style={{padding:'6px 10px'}}>{log.parti_no || '—'}</td>
<td style={{padding:'6px 10px'}}>{log.total_produced > 0 ? ((log.duration_seconds||0)/log.total_produced).toFixed(1)+'s' : '—'}</td>
<td style={{padding:'6px 10px'}}>
  <span style={{padding:'2px 8px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',
    background: (log.first_pass_yield||100)>=95?'rgba(46,204,113,0.15)':(log.first_pass_yield||100)>=85?'rgba(243,156,18,0.15)':'rgba(231,76,60,0.15)',
    color: (log.first_pass_yield||100)>=95?'#27ae60':(log.first_pass_yield||100)>=85?'#f39c12':'#e74c3c'
  }}>
    {(log.first_pass_yield||100)>=95?'🟢 İyi':(log.first_pass_yield||100)>=85?'🟡 Dikkat':'🔴 Müdahale'}
  </span>
</td>

ADIM 3: Tablo başlığına da ekle:
<th>Parti</th><th>Birim Süre</th><th>Durum</th>

KURALLAR:
❌ Mevcut sütun silme
✅ Sadece 3 sütun ekle
✅ git add -A && git commit -m "Uretim tablosuna parti+birim sure+durum sutunlari" && git push

TAMAMLAYINCA: "AMELE 1 GN:013B TAMAMLANDI"
════════════════════════════════════════════════════════════════
