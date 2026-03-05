'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceInput } from '../../../hooks/useVoiceInput';

// ========== FASON PAGE ==========

function FasonPage({ models, addToast }) {
  // EDIT system states
  const [editFason, setEditFason] = useState(null);
  const [editFasonForm, setEditFasonForm] = useState({});

  const openEditFason = (order) => {
    setEditFasonForm({
      quantity: order.quantity || 0, unit_price: order.unit_price || 0,
      sent_date: order.sent_date || '', expected_date: order.expected_date || '',
      received_quantity: order.received_quantity || 0, defective_count: order.defective_count || 0,
      quality_notes: order.quality_notes || '', status: order.status || 'beklemede'
    });
    setEditFason(order);
  };

  const handleUpdateFason = async (e) => {
    e.preventDefault();
    try {
      const changes = [];
      Object.keys(editFasonForm).forEach(key => {
        const oldVal = String(editFason[key] ?? '');
        const newVal = String(editFasonForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'fason_orders', record_id: editFason.id, changes, changed_by: 'admin' })
        });
      }
      const res = await fetch(`/api/fason/orders/${editFason.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFasonForm)
      });
      if (!res.ok) throw new Error('Guncelleme hatasi');
      setEditFason(null);
      addToast('success', 'Fason siparis guncellendi!');
    } catch (err) { addToast('error', err.message); }
  };


  const [providers, setProviders] = useState([]);

  const [orders, setOrders] = useState([]);

  const [showProviderModal, setShowProviderModal] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);

  const [pForm, setPForm] = useState({ name: '', company: '', phone: '', address: '', speciality: '' });

  const [oForm, setOForm] = useState({ provider_id: '', model_id: '', quantity: '', unit_price: '', expected_date: '', operation_type: '', technical_notes: '' });

  const loadAll = useCallback(async () => { const [r1, r2] = await Promise.all([fetch('/api/fason'), fetch('/api/fason/orders')]); const [d1, d2] = await Promise.all([r1.json(), r2.json()]); setProviders(Array.isArray(d1) ? d1 : []); setOrders(Array.isArray(d2) ? d2 : []); }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveProvider = async (e) => { e.preventDefault(); try { await fetch('/api/fason', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pForm) }); await loadAll(); setShowProviderModal(false); setPForm({ name: '', company: '', phone: '', address: '', speciality: '' }); addToast('success', 'Fasoncu eklendi!'); } catch (err) { addToast('error', 'Hata'); } };

  const saveOrder = async (e) => { e.preventDefault(); try { await fetch('/api/fason/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(oForm) }); await loadAll(); setShowOrderModal(false); setOForm({ provider_id: '', model_id: '', quantity: '', unit_price: '', expected_date: '', operation_type: '', technical_notes: '' }); addToast('success', 'Fason sipariş oluşturuldu!'); } catch (err) { addToast('error', 'Hata'); } };

  const statusLabels = { beklemede: '⏳ Beklemede', gonderildi: '📦 Gönderildi', uretimde: '🏭 Üretimde', teslim: '✅ Teslim', iptal: '❌ İptal' };

  const pVoice = useVoiceInput(setPForm);

  const oVoice = useVoiceInput(setOForm);



  return (

    <>

      <div className="topbar"><h1 className="topbar-title">🏭 Fason Yönetimi</h1><div className="topbar-actions"><button className="btn btn-secondary" onClick={() => setShowProviderModal(true)}>+ Fasoncu</button><button className="btn btn-primary" onClick={() => setShowOrderModal(true)}>+ Fason Sipariş</button></div></div>

      <div className="page-content">

        <div className="stats-grid">

          <div className="stat-card"><div className="stat-icon">🏭</div><div className="stat-value">{providers.length}</div><div className="stat-label">Fasoncu</div></div>

          <div className="stat-card"><div className="stat-icon">🏭</div><div className="stat-value">{orders.length}</div><div className="stat-label">Sipariş</div></div>

          <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-value">{orders.reduce((s, o) => s + (o.quantity || 0), 0).toLocaleString('tr-TR')}</div><div className="stat-label">Toplam Adet</div></div>

          <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{orders.reduce((s, o) => s + (o.total_price || 0), 0).toFixed(0)} ₺</div><div className="stat-label">Toplam Tutar</div></div>

        </div>

        {orders.length === 0 ? (

          <div className="card"><div className="empty-state"><div className="empty-state-icon">🏭</div><div className="empty-state-title">Henüz Fason Sipariş Yok</div><div className="empty-state-text">Fasoncu ekleyin ve sipariş oluşturun.</div></div></div>

        ) : (

          <div className="table-wrapper"><table className="table"><thead><tr><th>Fasoncu</th><th>Model</th><th>Operasyon</th><th>Adet</th><th>Birim ₺</th><th>Toplam ₺</th><th>Beklenen Tarih</th><th>Durum</th></tr></thead><tbody>

            {orders.map(o => (<tr key={o.id}><td style={{ fontWeight: '600' }}>{o.provider_name}</td><td>{o.model_name} <code style={{ fontSize: '11px', background: 'var(--bg-input)', padding: '1px 5px', borderRadius: '3px' }}>{o.model_code}</code></td><td><span style={{ fontSize: '12px', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>{o.operation_type || 'Sadece Dikim'}</span></td><td style={{ fontWeight: '700' }}>{o.quantity?.toLocaleString('tr-TR')}</td><td>{o.unit_price?.toFixed(2)} ₺</td><td style={{ fontWeight: '600', color: 'var(--accent)' }}>{o.total_price?.toFixed(0)} ₺</td><td>{o.expected_date || '—'}</td><td><span className="badge badge-info">{statusLabels[o.status] || o.status}</span></td></tr>))}

          </tbody></table></div>

        )}

      </div>

      {showProviderModal && (

        <div className="modal-overlay" onClick={() => setShowProviderModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>

          <div className="modal-header"><h2 className="modal-title">🏭 Yeni Fasoncu</h2><button className="modal-close" onClick={() => setShowProviderModal(false)}>✕</button></div>

          <form onSubmit={saveProvider}>

            <div className="form-row">

              <div className="form-group"><label className="form-label">Ad *</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} required /><VoiceBtn fieldKey="name" {...pVoice} /></div></div>

              <div className="form-group"><label className="form-label">Firma</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={pForm.company} onChange={e => setPForm({ ...pForm, company: e.target.value })} /><VoiceBtn fieldKey="company" {...pVoice} /></div></div>

            </div>

            <div className="form-row">

              <div className="form-group"><label className="form-label">Telefon</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={pForm.phone} onChange={e => setPForm({ ...pForm, phone: e.target.value })} /><VoiceBtn fieldKey="phone" {...pVoice} /></div></div>

              <div className="form-group"><label className="form-label">Uzmanlık</label><div style={{ position: 'relative' }}><input className="form-input" placeholder="örn: Overlok" style={{ paddingRight: '62px' }} value={pForm.speciality} onChange={e => setPForm({ ...pForm, speciality: e.target.value })} /><VoiceBtn fieldKey="speciality" {...pVoice} /></div></div>

            </div>

            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowProviderModal(false)}>İptal</button><button type="submit" className="btn btn-primary">💾 Kaydet</button></div>

          </form>

        </div></div>

      )}

      {showOrderModal && (

        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>

          <div className="modal-header"><h2 className="modal-title">📋 Fason Sipariş</h2><button className="modal-close" onClick={() => setShowOrderModal(false)}>✕</button></div>

          <form onSubmit={saveOrder}>

            <div className="form-row"><div className="form-group"><label className="form-label">Fasoncu *</label><select className="form-select" value={oForm.provider_id} onChange={e => setOForm({ ...oForm, provider_id: e.target.value })} required><option value="">Seçiniz...</option>{providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="form-group"><label className="form-label">Model *</label><select className="form-select" value={oForm.model_id} onChange={e => setOForm({ ...oForm, model_id: e.target.value })} required><option value="">Seçiniz...</option>{models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}</select></div></div>

            {oForm.model_id && (() => {
              const secilenModel = models.find(m => String(m.id) === String(oForm.model_id));
              if (!secilenModel) return null;
              return (
                <div style={{ padding: '10px 14px', background: 'rgba(52,152,219,0.08)', borderRadius: '8px', border: '1px solid rgba(52,152,219,0.2)', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#3498db', marginBottom: '4px' }}>ℹ️ Model Teknik Detayı (Fasoncuya İletilecek)</div>
                  <div style={{ fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span><b>Kumaş:</b> {secilenModel.fabric_type || 'Belirtilmedi'}</span>
                    <span><b>Maliyet:</b> {secilenModel.target_cost ? `₺${secilenModel.target_cost}` : 'Belirtilmedi'}</span>
                    <span><b>Bedenler:</b> S-M-L-XL</span>
                  </div>
                </div>
              );
            })()}

            <div className="form-row">
              <div className="form-group"><label className="form-label">Adet *</label><div style={{ position: 'relative' }}><input className="form-input" type="number" style={{ paddingRight: '62px' }} value={oForm.quantity} onChange={e => setOForm({ ...oForm, quantity: e.target.value })} required /><VoiceBtn fieldKey="quantity" {...oVoice} /></div></div>
              <div className="form-group"><label className="form-label">Birim Fiyat (₺)</label><div style={{ position: 'relative' }}><input className="form-input" type="number" step="0.01" style={{ paddingRight: '62px' }} value={oForm.unit_price} onChange={e => setOForm({ ...oForm, unit_price: e.target.value })} /><VoiceBtn fieldKey="unit_price" {...oVoice} /></div></div>
              <div className="form-group"><label className="form-label">Beklenen Tarih</label><input className="form-input" type="date" value={oForm.expected_date} onChange={e => setOForm({ ...oForm, expected_date: e.target.value })} /></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Operasyon Türü *</label>
                <select className="form-select" value={oForm.operation_type} onChange={e => setOForm({ ...oForm, operation_type: e.target.value })} required>
                  <option value="">Seçiniz...</option>
                  <option value="Sadece Dikim">✂️ Sadece Dikim</option>
                  <option value="Sadece Kesim">📐 Sadece Kesim</option>
                  <option value="Tam Paket">📦 Tam Paket (Kesim+Dikim+Paket)</option>
                  <option value="Baskı">🎨 Baskı</option>
                  <option value="Nakış">🪡 Nakış</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Teknik Talimatlar / Kalite Notları</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" style={{ paddingRight: '62px' }} placeholder="Örn: 3 iplik overlok, etiketler gizli..." value={oForm.technical_notes} onChange={e => setOForm({ ...oForm, technical_notes: e.target.value })} />
                  <VoiceBtn fieldKey="technical_notes" {...oVoice} />
                </div>
              </div>
            </div>

            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>İptal</button><button type="submit" className="btn btn-primary">💾 Fason Talimatı Oluştur</button></div>

          </form>

        </div></div>

      )}

    </>

  );

}

export default MuhasebeDashboard;
