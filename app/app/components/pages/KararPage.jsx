'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';

function KararEkleFormu({ onEkle, addToast, ay, yil }) {
  const [form, setForm] = useState({ konu: '', bolum: 'uretim', sistem_onerisi: '', yapilan_karar: '', sonuc: '', sistem_mi_dogru: '' });
  const [goster, setGoster] = useState(false);
  const kaydet = async () => {
    if (!form.konu) { addToast('warning', 'Konu zorunlu'); return; }
    const payload = { ...form, ilgili_ay: ay, ilgili_yil: yil };
    if (form.sistem_mi_dogru === 'true') payload.sistem_mi_dogru = true;
    else if (form.sistem_mi_dogru === 'false') payload.sistem_mi_dogru = false;
    else payload.sistem_mi_dogru = null;
    const r = await fetch('/api/rapor/karar-arsivi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const d = await r.json();
    if (d.success) { addToast('success', 'Karar kaydedildi'); setForm({ konu: '', bolum: 'uretim', sistem_onerisi: '', yapilan_karar: '', sonuc: '', sistem_mi_dogru: '' }); setGoster(false); onEkle(); }
    else addToast('error', d.error);
  };
  return (
    <div style={{ marginBottom: '20px' }}>
      <button onClick={() => setGoster(p => !p)} style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', marginBottom: '12px' }}>
        {goster ? '✕ İptal' : '＋ Yeni Karar Kaydı'}
      </button>
      {goster && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Konu *</label>
            <input className="form-input" value={form.konu} onChange={e => setForm(p => ({ ...p, konu: e.target.value }))} placeholder="Örn: Model X'in üretim hacmi artırıldı" />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Bölüm</label>
            <select className="form-input" value={form.bolum} onChange={e => setForm(p => ({ ...p, bolum: e.target.value }))}>
              <option value="uretim">Üretim</option>
              <option value="personel">Personel</option>
              <option value="maliyet">Maliyet</option>
              <option value="model">Model</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sistem Haklı mıydı?</label>
            <select className="form-input" value={form.sistem_mi_dogru} onChange={e => setForm(p => ({ ...p, sistem_mi_dogru: e.target.value }))}>
              <option value="">Belirlenemedi</option>
              <option value="true">✅ Sistem haklıydı</option>
              <option value="false">👤 İnsan haklıydı</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sistem Önerisi</label>
            <input className="form-input" value={form.sistem_onerisi} onChange={e => setForm(p => ({ ...p, sistem_onerisi: e.target.value }))} placeholder="Bot ne önerdi?" />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Yapılan Karar</label>
            <input className="form-input" value={form.yapilan_karar} onChange={e => setForm(p => ({ ...p, yapilan_karar: e.target.value }))} placeholder="Yönetici ne yaptı?" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sonuç</label>
            <input className="form-input" value={form.sonuc} onChange={e => setForm(p => ({ ...p, sonuc: e.target.value }))} placeholder="Ne oldu?" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <button onClick={kaydet} style={{ padding: '9px 20px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
              💾 Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default KararEkle;
