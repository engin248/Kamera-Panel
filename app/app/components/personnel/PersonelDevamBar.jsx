'use client';
import React, { useState, useEffect, useCallback } from 'react';

function PersonelDevamBar({ personnel, addToast }) {
  const [kayitlar, setKayitlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aktifSekme, setAktifSekme] = useState('gunluk');
  const [ozet, setOzet] = useState([]);
  const bugun = new Date().toISOString().split('T')[0];

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const res = await fetch(`/api/personel-saat?tarih=${bugun}`);
      const d = await res.json();
      setKayitlar(d.kayitlar || []);
    } catch { } finally { setYukleniyor(false); }
  }, [bugun]);

  const yukleHaftalik = useCallback(async () => {
    try {
      const res = await fetch('/api/personel-haftalik');
      const d = await res.json();
      setOzet(d.personel || []);
    } catch { }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);
  useEffect(() => { if (aktifSekme === 'haftalik') yukleHaftalik(); }, [aktifSekme, yukleHaftalik]);

  const kayitBul = (pid) => kayitlar.find(k => k.personel_id === pid);

  const tiklama = async (pid, tip) => {
    try {
      await fetch('/api/personel-saat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personel_id: pid, tip }) });
      addToast('success', `✅ ${tip === 'giris' ? 'Giriş' : 'Çıkış'} kaydedildi`);
      yukle();
    } catch (e) { addToast('error', e.message); }
  };

  const aktifler = (personnel || []).filter(p => p.status === 'active' || !p.status);
  const gelenler = kayitlar.filter(k => k.giris_saat).length;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--accent)' }}>⏱️ Personel Devam (Tablet Modu)</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAktifSekme('gunluk')} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', background: aktifSekme === 'gunluk' ? 'var(--accent)' : 'var(--bg-input)', color: aktifSekme === 'gunluk' ? '#fff' : 'var(--text-muted)' }}>📅 Günlük</button>
          <button onClick={() => setAktifSekme('haftalik')} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', background: aktifSekme === 'haftalik' ? 'var(--accent)' : 'var(--bg-input)', color: aktifSekme === 'haftalik' ? '#fff' : 'var(--text-muted)' }}>📊 Haftalık Özet</button>
          <div style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', fontWeight: '700', padding: '0 8px' }}>{gelenler}/{aktifler.length} Geldi</div>
        </div>
      </div>

      {aktifSekme === 'gunluk' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {aktifler.map(p => {
            const k = kayitBul(p.id);
            return (
              <div key={p.id} style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)' }}>👤 {p.name}</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {!k?.giris_saat ? (
                    <button onClick={() => tiklama(p.id, 'giris')} style={{ flex: 1, padding: '14px 20px', background: 'rgba(46,204,113,0.15)', color: '#27ae60', border: '2px solid rgba(46,204,113,0.4)', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '800', minHeight: '52px', transition: 'all 0.1s' }}>✅ GİRİŞ YAP</button>
                  ) : (
                    <div style={{ flex: 1, padding: '14px 20px', background: 'rgba(46,204,113,0.05)', borderRadius: '10px', border: '2px dashed rgba(46,204,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#27ae60', fontWeight: '800' }}>✅ {k.giris_saat}</div>
                  )}
                  {k?.giris_saat && !k?.cikis_saat && (
                    <button onClick={() => tiklama(p.id, 'cikis')} style={{ flex: 1, padding: '14px 20px', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '2px solid rgba(231,76,60,0.3)', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '800', minHeight: '52px' }}>🚪 ÇIKIŞ</button>
                  )}
                  {k?.cikis_saat && (
                    <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: '600' }}>
                      Çıkış: <span style={{ color: 'var(--text-primary)' }}>{k.cikis_saat}</span> | Net: <span style={{ color: 'var(--accent)' }}>{Math.floor((k.net_calisma_dakika || 0) / 60)}s {((k.net_calisma_dakika || 0) % 60)}dk</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aktifSekme === 'haftalik' && (
        <div style={{ overflowX: 'auto' }}>
          {ozet.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Bu hafta kayıt yok.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Ad</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontWeight: '700' }}>Saat</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontWeight: '700' }}>Mesai</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontWeight: '700', color: '#27ae60' }}>Net Maaş</th>
                </tr>
              </thead>
              <tbody>
                {ozet.map(p => (
                  <tr key={p.personel_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', fontWeight: '600' }}>{p.ad}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.normal_saat}s</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#e67e22' }}>{p.mesai_saat}s</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: '#27ae60' }}>{p.net_maas} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default PersonelDevamBar;
