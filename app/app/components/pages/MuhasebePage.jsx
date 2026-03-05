'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import BirimAsistanPanel from '../BirimAsistanPanel';

// ========== COSTS PAGE ==========

function CostsPage({ models, personnel, addToast }) {
  const now = new Date();
  const [costTab, setCostTab] = useState('giderler');
  const [ay, setAy] = useState(now.getMonth() + 1);
  const [yil, setYil] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'elektrik', description: '', amount: '', is_recurring: false });
  const [primHavuzOrani, setPrimHavuzOrani] = useState(10);
  const [voiceLang, setVoiceLang] = useState('tr-TR');
  const [listeningField, setListeningField] = useState(null);
  const recRef = useRef(null);

  const startVoice = useCallback((fieldKey, setter) => {
    if (listeningField === fieldKey) { try { recRef.current?.stop(); } catch { } setListeningField(null); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Chrome/Edge kullanın'); return; }
    const rec = new SR(); rec.lang = voiceLang; rec.continuous = false; rec.interimResults = false;
    recRef.current = rec; setListeningField(fieldKey);
    rec.onresult = (ev) => { const t = ev.results[0][0].transcript.trim(); setter(t); setListeningField(null); };
    rec.onerror = () => setListeningField(null);
    rec.onend = () => setListeningField(null);
    rec.start();
  }, [listeningField, voiceLang]);

  const loadAll = useCallback(() => {
    fetch(`/api/expenses?year=${yil}&month=${ay}`).then(r => r.json()).then(d => setExpenses(Array.isArray(d) ? d : [])).catch(() => { });
    fetch(`/api/production?from=${yil}-${String(ay).padStart(2, '0')}-01`).then(r => r.json()).then(d => setLogs(Array.isArray(d) ? d : [])).catch(() => { });
    fetch('/api/orders').then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d.filter(o => !o.deleted_at) : [])).catch(() => { });
  }, [ay, yil]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const aktifPersonel = (personnel || []).filter(p => p.status === 'active');
  const toplamIscilik = aktifPersonel.reduce((t, p) => {
    const brut = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0);
    return t + brut * 1.225;
  }, 0);
  const toplamSabitGider = expenses.filter(e => !e.deleted_at).reduce((t, e) => t + (e.amount || 0), 0);
  const toplamGelir = orders
    .filter(o => (o.status === 'tamamlandi' || o.status === 'teslim_edildi'))
    .filter(o => { const d = new Date(o.updated_at || o.created_at); return d.getFullYear() === yil && d.getMonth() + 1 === ay; })
    .reduce((t, o) => t + (o.total_price || 0), 0);
  const toplamUretim = logs.reduce((t, l) => t + (l.total_produced || 0), 0);
  const toplamHata = logs.reduce((t, l) => t + (l.defective_count || 0), 0);
  const hammaddeGider = toplamSabitGider * 0.4;
  const netKar = toplamGelir - hammaddeGider - toplamIscilik - (toplamSabitGider * 0.6);
  const karMarji = toplamGelir > 0 ? (netKar / toplamGelir) * 100 : 0;
  const avgUnitPrice = logs.length > 0 ? logs.reduce((t, l) => t + (l.unit_price || 0), 0) / logs.length : 0;
  const basaBasAdet = avgUnitPrice > 0 ? (toplamIscilik + toplamSabitGider) / avgUnitPrice : 0;
  const karSinyali = netKar > 0 ? 'kar' : netKar > -500 ? 'basabas' : 'zarar';
  const sinjalRenk = { kar: '#27ae60', basabas: '#f39c12', zarar: '#e74c3c' };
  const sinjalEmoji = { kar: '🟢', basabas: '🟡', zarar: '🔴' };

  const personelSkor = aktifPersonel.map(p => {
    const pLogs = logs.filter(l => l.personnel_id === p.id);
    const adet = pLogs.reduce((t, l) => t + (l.total_produced || 0), 0);
    const hata = pLogs.reduce((t, l) => t + (l.defective_count || 0), 0);
    const fpy = adet > 0 ? ((adet - hata) / adet) * 100 : 100;
    const skor = adet * fpy / 100;
    const brut = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0);
    const gercekMaliyet = brut * 1.225;
    const birimMaliyet = adet > 0 ? gercekMaliyet / adet : 0;
    return { ...p, adet, hata, fpy, skor, gercekMaliyet, birimMaliyet };
  }).sort((a, b) => b.skor - a.skor);

  const toplamSkor = personelSkor.reduce((t, p) => t + p.skor, 0);

  // --- YENİ SİL BAŞTAN VAKIF VE ŞİRKET FONU (%51 / %49) MATEMATİĞİ ---
  const vakifPayi = netKar > 0 ? netKar * 0.51 : 0;
  const sirketFonu = netKar > 0 ? netKar * 0.49 : 0;

  // %49'un içindeki dağılımlar: Prim, Ekipman/ArGe, Tazminat ve Zarar Kapatma
  const primHavuzu = sirketFonu > 0 ? sirketFonu * (primHavuzOrani / 100) : 0;
  const geriyeKalanSirketFonu = sirketFonu - primHavuzu;
  const ekipmanArge = geriyeKalanSirketFonu * 0.40; // %40 Ekipman/ArGe
  const gecmisZararTazminat = geriyeKalanSirketFonu * 0.60; // %60 Geçmiş Zarar Kapatma / Tazminat Akçesi

  const expCats = [
    { value: 'kira', label: '🏭 Kira' }, { value: 'elektrik', label: '⚡ Elektrik' },
    { value: 'su', label: '💧 Su' }, { value: 'internet_telefon', label: '📡 Internet/Telefon' },
    { value: 'makine_bakim', label: '🔧 Makine Bakım' }, { value: 'kargo', label: '🚚 Kargo' },
    { value: 'sarf_malzeme', label: '🧵 Sarf Malzeme' }, { value: 'muhasebe', label: '🧾 Muhasebe' },
    { value: 'vergi', label: '🏛️ Vergi' }, { value: 'sigorta', label: '🛡️ Sigorta' },
    { value: 'diger', label: '📦 Diğer' },
  ];

  const addExpense = async () => {
    if (!expenseForm.amount) { addToast('error', 'Tutar giriniz'); return; }
    await fetch('/api/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount), year: yil, month: ay })
    });
    setExpenseForm({ category: 'elektrik', description: '', amount: '', is_recurring: false });
    setShowExpenseForm(false); loadAll(); addToast('success', '✅ Gider eklendi');
  };

  const deleteExpense = async (id) => {
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
    loadAll(); addToast('success', 'Gider silindi');
  };

  const costTabs = [
    { id: 'giderler', label: '📥 GİDERLER' },
    { id: 'personel', label: '👥 PERSONEL' },
    { id: 'karzarar', label: '📊 KAR/ZARAR' },
    { id: 'prim', label: '🏆 PRİM' },
    { id: 'analiz', label: '🔍 ANALİZ' },
    { id: 'asistan', label: '💬 FİNANS ASİSTANI' }
  ];

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">💰 Maliyet Yönetimi</h1>
        <div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button type="button" onClick={() => setVoiceLang(v => v === 'tr-TR' ? 'ar-SA' : 'tr-TR')}
            style={{ padding: '6px 12px', background: 'rgba(212,168,71,0.15)', border: '1px solid rgba(212,168,71,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#D4A847' }}>
            {voiceLang === 'tr-TR' ? '🇹🇷 Türkçe' : '🇸🇦 العربية'}
          </button>
          <select className="form-select" value={ay} onChange={e => setAy(+e.target.value)} style={{ minWidth: '90px' }}>
            {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-select" value={yil} onChange={e => setYil(+e.target.value)} style={{ minWidth: '80px' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="page-content">
        {/* ÖZET KARTLAR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Gelir', value: `₺${toplamGelir.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, color: '#27ae60', icon: '💰' },
            { label: 'Gider', value: `₺${(toplamIscilik + toplamSabitGider).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, color: '#e74c3c', icon: '💸' },
            { label: 'Net Kâr', value: `₺${netKar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, color: sinjalRenk[karSinyali], icon: sinjalEmoji[karSinyali] },
            { label: 'Marj', value: `%${karMarji.toFixed(1)}`, color: sinjalRenk[karSinyali], icon: '📈' },
          ].map((k, i) => (
            <div key={i} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: `1px solid ${k.color}33` }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{k.icon} {k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
        {/* SEKMELER */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {costTabs.map(t => (
            <button key={t.id} type="button" onClick={() => setCostTab(t.id)}
              style={{
                padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                border: costTab === t.id ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                background: costTab === t.id ? 'var(--accent-soft)' : 'var(--bg-input)',
                color: costTab === t.id ? 'var(--accent)' : 'var(--text-secondary)'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* S1: GİDERLER */}
        {costTab === 'giderler' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <b style={{ fontSize: '14px' }}>📥 Giderler ({ay}/{yil})</b>
                <button type="button" onClick={() => setShowExpenseForm(!showExpenseForm)}
                  style={{ padding: '6px 12px', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.35)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>+ Ekle</button>
              </div>
              {showExpenseForm && (
                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', marginBottom: '12px' }}>
                  <select className="form-select" style={{ marginBottom: '8px', fontSize: '12px' }} value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                    {expCats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input className="form-input" placeholder="Açıklama" style={{ marginBottom: '8px', fontSize: '12px' }} value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <input className="form-input" type="number" placeholder="Tutar (₺)" style={{ flex: 1, fontSize: '12px' }} value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                    <button type="button" onClick={() => startVoice('g_tutar', v => setExpenseForm(p => ({ ...p, amount: v.replace(/[^\d,.]/g, '') })))}
                      style={{ padding: '6px 10px', background: listeningField === 'g_tutar' ? 'rgba(231,76,60,0.25)' : 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: '6px', cursor: 'pointer' }}>
                      {listeningField === 'g_tutar' ? '🔴' : '🎤'}
                    </button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={expenseForm.is_recurring} onChange={e => setExpenseForm({ ...expenseForm, is_recurring: e.target.checked })} /> Tekrarlayan 🔄
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={addExpense} style={{ flex: 1, padding: '7px', background: 'rgba(46,204,113,0.2)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>💾 Ekle</button>
                    <button type="button" onClick={() => setShowExpenseForm(false)} style={{ padding: '7px 12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>İptal</button>
                  </div>
                </div>
              )}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {expenses.filter(e => !e.deleted_at).length === 0
                  ? <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>Bu ay gider yok</div>
                  : expenses.filter(e => !e.deleted_at).map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                      <div>
                        <span style={{ fontWeight: '600' }}>{expCats.find(c => c.value === e.category)?.label || e.category}</span>
                        {e.description && <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>— {e.description}</span>}
                        {e.is_recurring === 1 && <span style={{ marginLeft: '4px', fontSize: '10px', color: '#f39c12' }}>🔄</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', color: '#e74c3c' }}>₺{(e.amount || 0).toLocaleString('tr-TR')}</span>
                        <button type="button" onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }}>🗑️</button>
                      </div>
                    </div>
                  ))
                }
              </div>
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(231,76,60,0.08)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                <span>Toplam Gider</span><span style={{ color: '#e74c3c' }}>₺{toplamSabitGider.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <b style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>👥 İşçilik (SGK %22.5 Dahil)</b>
              <div style={{ maxHeight: '440px', overflowY: 'auto' }}>
                {aktifPersonel.map(p => {
                  const brut = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0);
                  const sgk = brut * 0.225; const ger = brut + sgk;
                  return (
                    <div key={p.id} style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', fontSize: '12px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{p.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', color: 'var(--text-muted)' }}>
                        <span>Brüt: <b style={{ color: 'var(--text-primary)' }}>₺{brut.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b></span>
                        <span>SGK: <b style={{ color: '#e67e22' }}>₺{sgk.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b></span>
                        <span>Gerçek: <b style={{ color: '#e74c3c' }}>₺{ger.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(231,76,60,0.08)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                <span>Toplam İşçilik (SGK)</span><span style={{ color: '#e74c3c' }}>₺{toplamIscilik.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* S2: PERSONEL VERİMLİLİK */}
        {costTab === 'personel' && (
          <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <b style={{ fontSize: '14px', display: 'block', marginBottom: '16px' }}>👥 Personel Maliyet & Verimlilik — {ay}/{yil}</b>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ background: 'var(--bg-input)' }}>
                  {['Sıra', 'Personel', 'Üretim', 'Hata', 'FPY', 'Skor', 'Maliyet', 'Birim', 'Durum'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {personelSkor.length === 0
                    ? <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Bu ay üretim verisi yok</td></tr>
                    : personelSkor.map((p, i) => {
                      const d = p.fpy >= 95 ? { l: '⭐ Mükemmel', c: '#27ae60' } : p.fpy >= 85 ? { l: '✅ İyi', c: '#3498db' } : p.fpy >= 70 ? { l: '⚠️ Orta', c: '#f39c12' } : { l: '🔴 Düşük', c: '#e74c3c' };
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 10px', fontWeight: '700', color: i < 3 ? '#D4A847' : 'var(--text-muted)' }}>{i + 1}</td>
                          <td style={{ padding: '8px 10px', fontWeight: '600' }}>{p.name}</td>
                          <td style={{ padding: '8px 10px' }}>{p.adet.toLocaleString('tr-TR')}</td>
                          <td style={{ padding: '8px 10px', color: p.hata > 0 ? '#e74c3c' : 'var(--text-muted)' }}>{p.hata}</td>
                          <td style={{ padding: '8px 10px', fontWeight: '700', color: p.fpy >= 90 ? '#27ae60' : p.fpy >= 75 ? '#f39c12' : '#e74c3c' }}>%{p.fpy.toFixed(1)}</td>
                          <td style={{ padding: '8px 10px' }}>{p.skor.toFixed(0)}</td>
                          <td style={{ padding: '8px 10px', color: '#e74c3c' }}>₺{p.gercekMaliyet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px 10px' }}>{p.birimMaliyet > 0 ? `₺${p.birimMaliyet.toFixed(2)}` : '—'}</td>
                          <td style={{ padding: '8px 10px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: d.c + '22', color: d.c }}>{d.l}</span></td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* S3: KAR/ZARAR */}
        {costTab === 'karzarar' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: `2px solid ${sinjalRenk[karSinyali]}55` }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px' }}>{sinjalEmoji[karSinyali]}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: sinjalRenk[karSinyali] }}>{karSinyali === 'kar' ? 'KÂR EDİYORUZ' : karSinyali === 'basabas' ? 'BAŞA BAŞ' : 'ZARAR EDİYORUZ'}</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: sinjalRenk[karSinyali], marginTop: '8px' }}>₺{Math.abs(netKar).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{ay}/{yil} Net {netKar >= 0 ? 'Kâr' : 'Zarar'}</div>
              </div>
              {[
                { label: 'Toplam Gelir', value: toplamGelir, color: '#27ae60', sign: '+' },
                { label: 'Hammadde (%40 gider)', value: hammaddeGider, color: '#e74c3c', sign: '-' },
                { label: 'İşçilik SGK Dahil', value: toplamIscilik, color: '#e74c3c', sign: '-' },
                { label: 'Diğer Giderler', value: toplamSabitGider * 0.6, color: '#e74c3c', sign: '-' },
                { label: 'Net Kâr/Zarar', value: netKar, color: sinjalRenk[karSinyali], sign: '=' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                  <span>{r.sign} {r.label}</span>
                  <span style={{ fontWeight: '700', color: r.color }}>₺{Math.abs(r.value).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
              {netKar > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(52,152,219,0.08)', borderRadius: '8px', border: '1px solid rgba(52,152,219,0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#3498db', marginBottom: '8px' }}>🔐 DİJİTAL FON DAĞILIMI (SİL BAŞTAN)</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>%51 Vakıf / Hayır İşleri Hesabı</span><b style={{ color: '#2ecc71' }}>₺{vakifPayi.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>%49 Şirket Yedek Fonu (ArGe/Prim/Zarar)</span><b style={{ color: '#D4A847' }}>₺{sirketFonu.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Kâr Marjı', value: `%${karMarji.toFixed(1)}`, sub: 'Net Kâr / Gelir', color: sinjalRenk[karSinyali] },
                { label: 'Toplam Üretim', value: `${toplamUretim.toLocaleString('tr-TR')} adet`, sub: 'Bu ay', color: '#3498db' },
                { label: 'Hata Oranı', value: `%${toplamUretim > 0 ? ((toplamHata / toplamUretim) * 100).toFixed(1) : 0}`, sub: `${toplamHata} hata`, color: toplamHata > 0 ? '#e74c3c' : '#27ae60' },
                { label: 'Başa Baş', value: `${basaBasAdet.toFixed(0)} adet`, sub: 'Min üretim hedefi', color: '#f39c12' },
                { label: 'Aktif Personel', value: `${aktifPersonel.length} kişi`, sub: '₺' + toplamIscilik.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' maliyet', color: '#9b59b6' },
              ].map((k, i) => (
                <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-card)', borderRadius: '10px', border: `1px solid ${k.color}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k.label}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k.sub}</div></div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* S4: PRİM */}
        {costTab === 'prim' && (
          <div>
            {netKar <= 0
              ? <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(231,76,60,0.08)', borderRadius: '12px' }}>
                <div style={{ fontSize: '48px' }}>🔴</div>
                <div style={{ fontWeight: '700', color: '#e74c3c', marginBottom: '8px', marginTop: '8px' }}>Bu ay prim dağıtılamaz</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Net: ₺{netKar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
              </div>
              : <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ padding: '16px', background: 'rgba(46,204,113,0.08)', borderRadius: '12px', border: '1px solid rgba(46,204,113,0.2)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>🏆 Prim Havuzu (Şirket Fonundan)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px' }}>%49 Fonun %</span>
                      <input type="number" min={1} max={50} value={primHavuzOrani} onChange={e => setPrimHavuzOrani(+e.target.value)}
                        style={{ width: '60px', padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', textAlign: 'center' }} />
                      <span style={{ fontSize: '13px' }}>'i 👉 <b style={{ color: '#27ae60' }}>₺{primHavuzu.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b></span>
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(212,168,71,0.08)', borderRadius: '12px', border: '1px solid rgba(212,168,71,0.2)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>⚒️ %49 Fon Kalan Dağılımı</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div style={{ background: 'var(--bg-card)', padding: '6px', borderRadius: '4px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Ekipman / ArGe</span>
                        <b style={{ color: '#D4A847' }}>₺{ekipmanArge.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '6px', borderRadius: '4px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Zarar / Tazminat</span>
                        <b style={{ color: '#e74c3c' }}>₺{gecmisZararTazminat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <b style={{ display: 'block', marginBottom: '12px' }}>Personel Prim Dağılımı</b>
                  {personelSkor.map((p, i) => {
                    const kisiPrim = toplamSkor > 0 ? (p.skor / toplamSkor) * primHavuzu : 0;
                    const pay = toplamSkor > 0 ? (p.skor / toplamSkor) * 100 : 0;
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '16px', minWidth: '28px', textAlign: 'center' }}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.name}</div>
                          <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', margin: '4px 0' }}>
                            <div style={{ height: '100%', width: `${pay}%`, background: i === 0 ? '#D4A847' : i === 1 ? '#95a5a6' : i === 2 ? '#CD7F32' : '#3498db', borderRadius: '3px' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Skor: {p.skor.toFixed(0)} | Pay: %{pay.toFixed(1)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '800', color: '#27ae60', fontSize: '15px' }}>₺{kisiPrim.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
                          <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '4px', color: '#27ae60', cursor: 'pointer' }}>✅ Onayla</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            }
          </div>
        )}

        {/* S5: ANALİZ */}
        {costTab === 'analiz' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <b style={{ fontSize: '14px', display: 'block', marginBottom: '12px', color: '#e74c3c' }}>⚠️ En Çok Hata Yapan</b>
              {personelSkor.filter(p => p.hata > 0).sort((a, b) => b.hata - a.hata).slice(0, 5).map((p, i) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                  <span>{i + 1}. {p.name}</span>
                  <div><b style={{ color: '#e74c3c' }}>{p.hata} hata</b><span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>FPY:%{p.fpy.toFixed(1)}</span></div>
                </div>
              ))}
              {personelSkor.filter(p => p.hata > 0).length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>✅ Bu ay hata yok!</div>}
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <b style={{ fontSize: '14px', display: 'block', marginBottom: '12px', color: '#f39c12' }}>📉 Düşük Verimlilik (%70 Altı)</b>
              {personelSkor.filter(p => p.fpy < 70 && p.adet > 0).map(p => (
                <div key={p.id} style={{ padding: '10px', background: 'rgba(231,76,60,0.06)', borderRadius: '8px', marginBottom: '6px', fontSize: '13px' }}>
                  <b>{p.name}</b>: FPY <b style={{ color: '#e74c3c' }}>%{p.fpy.toFixed(1)}</b> ({p.adet} üretim, {p.hata} hata)
                </div>
              ))}
              {personelSkor.filter(p => p.fpy < 70 && p.adet > 0).length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>✅ Sorun yok</div>}
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <b style={{ fontSize: '14px', display: 'block', marginBottom: '12px', color: '#9b59b6' }}>💸 Gider Dağılımı</b>
              {Object.entries(expenses.filter(e => !e.deleted_at).reduce((a, e) => { a[e.category] = (a[e.category] || 0) + e.amount; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cat, amt], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                  <span>{expCats.find(c => c.value === cat)?.label || cat}</span>
                  <div><b>₺{amt.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b><span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>%{toplamSabitGider > 0 ? ((amt / toplamSabitGider) * 100).toFixed(0) : 0}</span></div>
                </div>
              ))}
              {expenses.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Gider verisi yok</div>}
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <b style={{ fontSize: '14px', display: 'block', marginBottom: '12px', color: '#3498db' }}>🔎 Genel Özet</b>
              {[
                toplamUretim > 0 && { i: toplamHata / toplamUretim < 0.05 ? '✅' : '⚠️', t: `Hata %${((toplamHata / toplamUretim) * 100).toFixed(1)}`, c: toplamHata / toplamUretim < 0.05 ? '#27ae60' : '#e74c3c' },
                { i: netKar >= 0 ? '✅' : '❌', t: `Net ${netKar >= 0 ? 'Kâr' : 'Zarar'}: ₺${Math.abs(netKar).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, c: netKar >= 0 ? '#27ae60' : '#e74c3c' },
                toplamUretim > 0 && { i: toplamUretim >= basaBasAdet ? '✅' : '⚠️', t: `Başa baş ${basaBasAdet.toFixed(0)} adet`, c: toplamUretim >= basaBasAdet ? '#27ae60' : '#f39c12' },
                { i: '👥', t: `${personelSkor.filter(p => p.fpy >= 90).length}/${aktifPersonel.length} personel %90+ FPY`, c: '#3498db' },
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                  <span>{item.i}</span><span style={{ color: item.c, fontWeight: '500' }}>{item.t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* S6: ASİSTAN */}
        {costTab === 'asistan' && (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
            <BirimAsistanPanel
              birimAdi="Finans & Maliyet Müşaviri"
              aciklama="Kar/zarar takibi, başabaş noktası analizleri ve maliyet projeksiyonlarında uzmanım."
              renkHex="#e67e22"
              apiEndpoint="/api/agent/finans-asistan"
            />
          </div>
        )}

      </div>
    </>
  );
}

export default MuhasebePage;
