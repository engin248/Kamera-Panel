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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontWeight: '700', fontSize: '14px' }}>⏱️ Personel Devam</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setAktifSekme('gunluk')} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px', background: aktifSekme === 'gunluk' ? 'var(--accent)' : 'var(--bg-input)', color: aktifSekme === 'gunluk' ? '#fff' : 'var(--text-muted)' }}>📅 Günlük</button>
          <button onClick={() => setAktifSekme('haftalik')} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px', background: aktifSekme === 'haftalik' ? 'var(--accent)' : 'var(--bg-input)', color: aktifSekme === 'haftalik' ? '#fff' : 'var(--text-muted)' }}>📊 Haftalık Özet</button>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{gelenler}/{aktifler.length} geldi</div>
        </div>
      </div>

      {aktifSekme === 'gunluk' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {aktifler.map(p => {
            const k = kayitBul(p.id);
            return (
              <div key={p.id} style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px' }}>{p.name}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {!k?.giris_saat ? (
                    <button onClick={() => tiklama(p.id, 'giris')} style={{ padding: '4px 10px', background: 'rgba(46,204,113,0.15)', color: '#27ae60', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✅ Giriş</button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#27ae60', fontWeight: '600' }}>✅ {k.giris_saat}</span>
                  )}
                  {k?.giris_saat && !k?.cikis_saat && (
                    <button onClick={() => tiklama(p.id, 'cikis')} style={{ padding: '4px 10px', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🚪 Çıkış</button>
                  )}
                  {k?.cikis_saat && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Çıkış: {k.cikis_saat} | Net: {Math.floor((k.net_calisma_dakika || 0) / 60)}s {((k.net_calisma_dakika || 0) % 60)}dk</span>
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
