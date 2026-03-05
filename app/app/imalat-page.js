// ============================================================
// ImalatPage — 6 Sekme: Dashboard, Kesim, Hat, Faz, Yarı Mamul, Fire
// Bu dosya page.js'e append edilmek üzere oluşturulmuştur
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';

export default function ImalatPage({ models, personnel, addToast, currentUser }) {
    const [sekme, setSekme] = useState('ozet');
    const [ozet, setOzet] = useState(null);
    const [kesimler, setKesimler] = useState([]);
    const [hatlar, setHatlar] = useState([]);
    const [fazlar, setFazlar] = useState([]);
    const [yarimamul, setYarimamul] = useState([]);
    const [fireler, setFireler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({});

    const SEKMELER = [
        { id: 'ozet', icon: '📊', label: 'Dashboard' },
        { id: 'kesim', icon: '✂️', label: 'Kesim Planı' },
        { id: 'hat', icon: '🏭', label: 'Hat Planlama' },
        { id: 'faz', icon: '📋', label: 'Faz Takip' },
        { id: 'mamul', icon: '📦', label: 'Yarı Mamul' },
        { id: 'fire', icon: '🔥', label: 'Fire Kayıt' },
    ];

    const FAZ_RENK = {
        kesim: '#e67e22', dikim: '#3498db',
        kalite_inline: '#9b59b6', utu_paket: '#27ae60', sevkiyat: '#1abc9c'
    };
    const FAZ_LABEL = {
        kesim: '✂️ Kesim', dikim: '🧵 Dikim',
        kalite_inline: '🔍 Kalite', utu_paket: '🌡️ Ütü/Paket', sevkiyat: '🚚 Sevk'
    };

    const load = useCallback(async (s) => {
        setLoading(true);
        try {
            const EP = {
                ozet: '/api/imalat/ozet-dashboard',
                kesim: '/api/imalat/kesim-plani',
                hat: '/api/imalat/hat-planlama',
                faz: '/api/imalat/faz-takip',
                mamul: '/api/imalat/yari-mamul',
                fire: '/api/imalat/fire-kayit',
            };
            const r = await fetch(EP[s]);
            const d = await r.json();
            if (s === 'ozet') setOzet(d.error ? null : d);
            else if (s === 'kesim') setKesimler(Array.isArray(d) ? d : []);
            else if (s === 'hat') setHatlar(Array.isArray(d) ? d : []);
            else if (s === 'faz') setFazlar(Array.isArray(d) ? d : []);
            else if (s === 'mamul') setYarimamul(Array.isArray(d) ? d : []);
            else if (s === 'fire') setFireler(Array.isArray(d) ? d : []);
        } catch (e) { console.error('İmalat load:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(sekme); }, [sekme, load]);
    const handleSekme = (s) => { setSekme(s); setShowForm(false); setForm({}); };

    const kaydet = async (ep, data) => {
        try {
            const r = await fetch(ep, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const d = await r.json();
            if (r.ok) { addToast('success', 'Kaydedildi ✅'); setShowForm(false); setForm({}); load(sekme); }
            else addToast('error', d.error || 'Kayıt hatası');
        } catch { addToast('error', 'Bağlantı hatası'); }
    };

    const emptyState = (icon, msg) => (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
            <div style={{ fontSize: '14px' }}>{msg}</div>
        </div>
    );

    const headerStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' };
    const cellStyle = { padding: '10px 12px' };

    return (
        <>
            {/* TOPBAR */}
            <div className="topbar">
                <h1 className="topbar-title">🏭 İmalat Yönetimi</h1>
                <div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {sekme !== 'ozet' && (
                        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                            {showForm ? '✕ Kapat' : '➕ Yeni Ekle'}
                        </button>
                    )}
                    <button onClick={() => load(sekme)} style={{ padding: '8px 14px', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '8px', color: '#27ae60', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit' }}>
                        🔄 Yenile
                    </button>
                </div>
            </div>

            <div className="page-content">
                {/* SEKME NAVBARI */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap', padding: '4px', background: 'var(--bg-input)', borderRadius: '10px', width: 'fit-content' }}>
                    {SEKMELER.map(s => (
                        <button key={s.id} onClick={() => handleSekme(s.id)} style={{
                            padding: '7px 14px', borderRadius: '8px', border: 'none',
                            background: sekme === s.id ? 'var(--accent)' : 'transparent',
                            color: sekme === s.id ? '#fff' : 'var(--text-muted)',
                            fontWeight: sekme === s.id ? '700' : '500',
                            cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
                            transition: 'all 0.2s',
                        }}>
                            {s.icon} {s.label}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                        <div>Yükleniyor...</div>
                    </div>
                )}

                {/* ──────── ÖZET DASHBOARD ──────── */}
                {!loading && sekme === 'ozet' && (
                    <div>
                        {!ozet ? emptyState('🏭', 'Dashboard verisi yok. Kesim, Hat ve Faz kayıtları ekleyin.') : (
                            <>
                                {/* KPI KARTLAR */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                                    {[
                                        { label: 'Aktif Kesim Planı', val: ozet.aktif_kesim_plani ?? 0, icon: '✂️', color: '#e67e22' },
                                        { label: 'Aktif Hat', val: ozet.aktif_hat ?? 0, icon: '🏭', color: '#3498db' },
                                        { label: 'Devam Eden Faz', val: ozet.devam_eden_faz ?? 0, icon: '📋', color: '#9b59b6' },
                                        { label: 'Yarı Mamul Stok', val: ozet.toplam_yari_mamul ?? 0, icon: '📦', color: '#27ae60' },
                                        { label: 'Bu Ay Fire (m)', val: Number(ozet.bu_ay_fire ?? 0).toFixed(1), icon: '🔥', color: '#e74c3c' },
                                        { label: 'T. Üretim Maliyet Yükü', val: ozet.tahmini_maliyet ? (ozet.tahmini_maliyet + '₺') : 'Yükleniyor..', icon: '💰', color: '#f39c12' },
                                    ].map((k, i) => (
                                        <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '18px', border: '1px solid ' + k.color + '33', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                            <div style={{ fontSize: '30px', marginBottom: '6px' }}>{k.icon}</div>
                                            <div style={{ fontSize: '26px', fontWeight: '800', color: k.color }}>{k.val}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{k.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* FAZ KANBAN ÖZET */}
                                <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>📋 Üretim Fazları Özeti</div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {Object.entries(FAZ_LABEL).map(([faz, label]) => {
                                            const sayi = ozet.faz_ozet?.[faz] || 0;
                                            const renk = FAZ_RENK[faz];
                                            return (
                                                <div key={faz} style={{ flex: '1', minWidth: '100px', padding: '12px', background: renk + '15', borderRadius: '10px', border: '1px solid ' + renk + '33', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '20px', fontWeight: '800', color: renk }}>{sayi}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ──────── KESİM PLANI ──────── */}
                {!loading && sekme === 'kesim' && (
                    <div>
                        {showForm && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '22px', border: '1px solid rgba(230,126,34,0.3)', marginBottom: '20px' }}>
                                <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>✂️ Yeni Kesim Planı</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>MODEL *</div>
                                        <select className="form-select" value={form.model_id || ''} onChange={e => setForm({ ...form, model_id: e.target.value })}>
                                            <option value="">Model seçin</option>
                                            {(models || []).map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>PLAN TARİHİ *</div>
                                        <input type="date" className="form-input" value={form.plan_tarihi || new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, plan_tarihi: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>TOPLAM ADET *</div>
                                        <input type="number" className="form-input" placeholder="0" value={form.toplam_adet || ''} onChange={e => setForm({ ...form, toplam_adet: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>KAT SAYISI</div>
                                        <input type="number" className="form-input" placeholder="1" value={form.kat_sayisi || ''} onChange={e => setForm({ ...form, kat_sayisi: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>HARCANAN KUMAŞ (KG/METRE)</div>
                                        <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.harcanan_kumas || ''} onChange={e => setForm({ ...form, harcanan_kumas: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>PASTAL FİRE %</div>
                                        <input type="number" step="0.1" className="form-input" placeholder="0.0" value={form.pastal_fire_yuzde || ''} onChange={e => setForm({ ...form, pastal_fire_yuzde: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>KUMAŞ TİPİ</div>
                                        <input type="text" className="form-input" placeholder="Pamuk, Polyester..." value={form.kumas_tipi || ''} onChange={e => setForm({ ...form, kumas_tipi: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SARJ (metre)</div>
                                        <input type="number" className="form-input" step="0.01" placeholder="0.00" value={form.tahmini_sarj_metre || ''} onChange={e => setForm({ ...form, tahmini_sarj_metre: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Kesimcİ/USTA</div>
                                        <select className="form-select" value={form.kesimci_id || ''} onChange={e => setForm({ ...form, kesimci_id: e.target.value })}>
                                            <option value="">Seçin</option>
                                            {(personnel || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ background: 'rgba(142,68,173,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(142,68,173,0.3)' }}>
                                        <div style={{ fontSize: '11px', color: '#8e44ad', marginBottom: '4px', fontWeight: 'bold' }}>PARTİ / LOT NO *</div>
                                        <input type="text" className="form-input" placeholder="Kumaş Parti Numarası" value={form.parti_lot_no || ''} onChange={e => setForm({ ...form, parti_lot_no: e.target.value })} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1', padding: '12px', background: 'rgba(230,126,34,0.08)', borderRadius: '8px', border: '1px dashed rgba(230,126,34,0.3)', marginTop: '8px' }}>
                                        <div style={{ fontWeight: '700', fontSize: '12px', color: '#d35400', marginBottom: '8px' }}>⚖️ Kumaş Kullanım & Fire Kontrolü (Maliyet)</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#d35400', marginBottom: '4px' }}>TEORİK KULLANIM (Metre/Kg)</div>
                                                <input type="number" step="0.01" className="form-input" placeholder="TechPack Beklentisi" value={form.used_fabric_qty || ''} onChange={e => setForm({ ...form, used_fabric_qty: e.target.value })} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#d35400', marginBottom: '4px', fontWeight: 'bold' }}>USTANIN KESTİĞİ NET (KG/Metre) *</div>
                                                <input type="number" step="0.01" className="form-input" placeholder="Zorunlu Tartım!" value={form.actual_fabric_qty || ''} onChange={e => setForm({ ...form, actual_fabric_qty: e.target.value })} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#d35400', marginBottom: '4px' }}>KIRPINTI/FİRE MİKTARI (Metre/Kg)</div>
                                                <input type="number" step="0.01" className="form-input" placeholder="Geriye Kalan Zayiat" value={form.fabric_waste_qty || ''} onChange={e => setForm({ ...form, fabric_waste_qty: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                                    <button className="btn btn-primary" onClick={() => kaydet('/api/imalat/kesim-plani', {
                                        model_id: form.model_id ? parseInt(form.model_id) : null,
                                        plan_tarihi: form.plan_tarihi || new Date().toISOString().split('T')[0],
                                        toplam_adet: parseInt(form.toplam_adet || 0),
                                        kat_sayisi: parseInt(form.kat_sayisi || 1),
                                        kumas_tipi: form.kumas_tipi || '',
                                        tahmini_sarj_metre: parseFloat(form.tahmini_sarj_metre || 0),
                                        harcanan_kumas: parseFloat(form.harcanan_kumas || 0),
                                        pastal_fire_yuzde: parseFloat(form.pastal_fire_yuzde || 0),
                                        kesimci_id: form.kesimci_id ? parseInt(form.kesimci_id) : null,
                                        used_fabric_qty: parseFloat(form.used_fabric_qty || 0),
                                        actual_fabric_qty: parseFloat(form.actual_fabric_qty || 0),
                                        fabric_waste_qty: parseFloat(form.fabric_waste_qty || 0),
                                        parti_lot_no: form.parti_lot_no || ''
                                    })}>💾 Kaydet</button>
                                    <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { setShowForm(false); setForm({}); }}>İptal</button>
                                </div>
                            </div>
                        )}

                        {kesimler.length === 0 ? emptyState('✂️', 'Kesim planı yok. ➕ Yeni plan ekleyin.') : (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700', fontSize: '14px' }}>
                                    ✂️ Kesim Planları <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '12px' }}>({kesimler.length} kayıt)</span>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-input)' }}>
                                                {['Model', 'Plan Tarihi', 'Parti/Lot', 'Adet', 'Harcanan Kumaş', 'Pastal Fire', 'Durum'].map(h => (
                                                    <th key={h} style={headerStyle}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {kesimler.map((k, i) => {
                                                const durumRenk = { 'planland\u0131': '#f39c12', 'planlandı': '#f39c12', kesimde: '#3498db', 'tamamland\u0131': '#27ae60', 'tamamlandı': '#27ae60', iptal: '#e74c3c' };
                                                const dr = durumRenk[k.durum] || '#888';
                                                return (
                                                    <tr key={k.id || i} style={{ borderTop: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                        <td style={{ ...cellStyle, fontWeight: '600' }}>{k.models?.name || ('Model #' + k.model_id)}</td>
                                                        <td style={cellStyle}>{k.plan_tarihi}</td>
                                                        <td style={{ ...cellStyle, color: '#8e44ad', fontWeight: '700' }}>{k.parti_lot_no || '—'}</td>
                                                        <td style={{ ...cellStyle, fontWeight: '700', color: '#3498db' }}>{k.toplam_adet?.toLocaleString('tr-TR')}</td>
                                                        <td style={{ ...cellStyle, color: 'var(--text-muted)' }}>{k.actual_fabric_qty ? k.actual_fabric_qty + ' Kg/m' : (k.harcanan_kumas ? k.harcanan_kumas + ' Kg/m' : '—')}</td>
                                                        <td style={{ ...cellStyle, color: (k.fabric_waste_qty > 0 || k.pastal_fire_yuzde > 5) ? '#e74c3c' : 'var(--text-muted)' }}>{k.fabric_waste_qty ? k.fabric_waste_qty + ' Kg' : (k.pastal_fire_yuzde ? '%' + k.pastal_fire_yuzde : '—')}</td>
                                                        <td style={cellStyle}>
                                                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: dr + '22', color: dr, border: '1px solid ' + dr + '44' }}>
                                                                {k.durum || 'planlandı'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ──────── HAT PLANLAMA ──────── */}
                {!loading && sekme === 'hat' && (
                    <div>
                        {showForm && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '22px', border: '1px solid rgba(52,152,219,0.3)', marginBottom: '20px' }}>
                                <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>🏭 Yeni Üretim Hattı</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>HAT ADI *</div>
                                        <input type="text" className="form-input" placeholder="Hat 1, A Hattı..." value={form.hat_adi || ''} onChange={e => setForm({ ...form, hat_adi: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>MODEL</div>
                                        <select className="form-select" value={form.model_id || ''} onChange={e => setForm({ ...form, model_id: e.target.value })}>
                                            <option value="">Model seçin</option>
                                            {(models || []).map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>GÜNLÜK HEDEF</div>
                                        <input type="number" className="form-input" placeholder="0" value={form.gun_hedefi || ''} onChange={e => setForm({ ...form, gun_hedefi: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>FASON / İÇ ÜRETİM ZAMANI</div>
                                        <select className="form-select" value={form.fason_mu || 'ic'} onChange={e => setForm({ ...form, fason_mu: e.target.value })}>
                                            <option value="ic">İç Üretim (Bant)</option>
                                            <option value="fason">Dış Üretim (Fason)</option>
                                        </select>
                                    </div>
                                    {form.fason_mu === 'fason' && (
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>FASON ANLAŞMA BİRİM FİYATI (₺)</div>
                                            <input type="number" step="0.01" className="form-input" placeholder="₺ 0.00" value={form.fason_birim_fiyat || ''} onChange={e => setForm({ ...form, fason_birim_fiyat: e.target.value })} />
                                        </div>
                                    )}
                                    {form.fason_mu !== 'fason' && (
                                        <>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>TAHMİNİ BANT ZORLUK (1-5)</div>
                                                <input type="number" min="1" max="5" className="form-input" placeholder="1 = Kolay, 5 = Zor" value={form.bant_zorluk_derecesi || ''} onChange={e => setForm({ ...form, bant_zorluk_derecesi: e.target.value })} />
                                            </div>
                                            <div style={{ background: 'rgba(52,152,219,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(52,152,219,0.3)' }}>
                                                <div style={{ fontSize: '11px', color: '#2980b9', marginBottom: '4px', fontWeight: 'bold' }}>GÜNLÜK SABİT HAT MALİYETİ (₺) *</div>
                                                <input type="number" step="0.01" className="form-input" placeholder="Elektrik, Maaş, Amortisman" value={form.gunluk_hat_maliyeti || ''} onChange={e => setForm({ ...form, gunluk_hat_maliyeti: e.target.value })} />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                                    <button className="btn btn-primary" onClick={() => kaydet('/api/imalat/hat-planlama', {
                                        hat_adi: form.hat_adi,
                                        model_id: form.model_id ? parseInt(form.model_id) : null,
                                        gun_hedefi: parseInt(form.gun_hedefi || 0),
                                        fason_mu: form.fason_mu === 'fason',
                                        fason_birim_fiyat: parseFloat(form.fason_birim_fiyat || 0),
                                        bant_zorluk_derecesi: parseInt(form.bant_zorluk_derecesi || 1),
                                        gunluk_hat_maliyeti: parseFloat(form.gunluk_hat_maliyeti || 0),
                                        aktif: true,
                                    })}>💾 Kaydet</button>
                                    <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { setShowForm(false); setForm({}); }}>İptal</button>
                                </div>
                            </div>
                        )}

                        {hatlar.length === 0 ? emptyState('🏭', 'Hat tanımı yok. ➕ Yeni hat ekleyin.') : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                                {hatlar.map((h, i) => (
                                    <div key={h.id || i} style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '18px', border: '1px solid ' + (h.aktif ? 'rgba(39,174,96,0.4)' : 'var(--border-color)'), boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '16px' }}>🏭 {h.hat_adi}</div>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: h.aktif ? 'rgba(39,174,96,0.15)' : 'rgba(149,165,166,0.15)', color: h.aktif ? '#27ae60' : '#95a5a6' }}>
                                                {h.aktif ? '● Aktif' : '○ Pasif'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                            Model: <b style={{ color: 'var(--text-primary)' }}>{h.models?.name || h.model_id || '—'}</b>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Günlük Hedef</span>
                                            <span style={{ fontSize: '22px', fontWeight: '800', color: '#3498db' }}>{h.gun_hedefi || 0}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>adet</span>
                                        </div>
                                        {h.fason_mu && (
                                            <div style={{ fontSize: '11px', color: '#e67e22', fontWeight: 'bold' }}>Fason İşlem: {h.fason_birim_fiyat} ₺ / Adet</div>
                                        )}
                                        {!h.fason_mu && h.bant_zorluk_derecesi && (
                                            <div style={{ fontSize: '11px', color: '#2980b9', fontWeight: 'bold', marginTop: '4px' }}>Zorluk: {h.bant_zorluk_derecesi}/5 | Sabit Maliyet: {h.gunluk_hat_maliyeti ? '₺' + h.gunluk_hat_maliyeti : 'Bilinmiyor'}</div>
                                        )}
                                        {h.personel_listesi && Array.isArray(h.personel_listesi) && h.personel_listesi.length > 0 && (
                                            <div style={{ marginTop: '10px', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                👥 {h.personel_listesi.length} personel atanmış
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ──────── FAZ TAKİP (Kanban) ──────── */}
                {!loading && sekme === 'faz' && (
                    <div>
                        {showForm && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '22px', border: '1px solid rgba(155,89,182,0.3)', marginBottom: '20px' }}>
                                <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>📋 Yeni Faz Kaydı</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>MODEL *</div>
                                        <select className="form-select" value={form.model_id || ''} onChange={e => setForm({ ...form, model_id: e.target.value })}>
                                            <option value="">Model seçin</option>
                                            {(models || []).map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>FAZ *</div>
                                        <select className="form-select" value={form.faz || ''} onChange={e => setForm({ ...form, faz: e.target.value })}>
                                            <option value="">Faz seçin</option>
                                            {Object.entries(FAZ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>HEDEF ADET</div>
                                        <input type="number" className="form-input" placeholder="0" value={form.hedef_adet || ''} onChange={e => setForm({ ...form, hedef_adet: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SORUMLU</div>
                                        <select className="form-select" value={form.sorumlu_id || ''} onChange={e => setForm({ ...form, sorumlu_id: e.target.value })}>
                                            <option value="">Seçin</option>
                                            {(personnel || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                                    <button className="btn btn-primary" onClick={() => kaydet('/api/imalat/faz-takip', {
                                        model_id: form.model_id ? parseInt(form.model_id) : null,
                                        faz: form.faz,
                                        hedef_adet: parseInt(form.hedef_adet || 0),
                                        sorumlu_id: form.sorumlu_id ? parseInt(form.sorumlu_id) : null,
                                        baslangic: new Date().toISOString(),
                                    })}>💾 Kaydet</button>
                                    <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { setShowForm(false); setForm({}); }}>İptal</button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                            {Object.entries(FAZ_LABEL).map(([faz, label]) => {
                                const list = fazlar.filter(f => f.faz === faz);
                                const renk = FAZ_RENK[faz];
                                return (
                                    <div key={faz} style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid ' + renk + '44', overflow: 'hidden' }}>
                                        <div style={{ background: renk + '1a', padding: '10px 14px', borderBottom: '1px solid ' + renk + '33', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '700', fontSize: '13px', color: renk }}>{label}</span>
                                            <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: renk, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>{list.length}</span>
                                        </div>
                                        <div style={{ padding: '8px', minHeight: '130px' }}>
                                            {list.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '20px 8px', color: 'var(--text-muted)', fontSize: '12px' }}>Kayıt yok</div>
                                            ) : list.map((k, i) => {
                                                const pct = k.hedef_adet > 0 ? Math.min(100, ((k.tamamlanan_adet || 0) / k.hedef_adet * 100)) : 0;
                                                return (
                                                    <div key={k.id || i} style={{ background: 'var(--bg-input)', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', border: '1px solid var(--border-color)' }}>
                                                        <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>{k.models?.name || ('Model #' + k.model_id)}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>🎯 {k.tamamlanan_adet || 0} / {k.hedef_adet || 0}</div>
                                                        <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px' }}>
                                                            <div style={{ height: '100%', width: pct + '%', background: renk, borderRadius: '2px', transition: 'width 0.5s' }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ──────── YARI MAMUL STOK ──────── */}
                {!loading && sekme === 'mamul' && (
                    <div>
                        {showForm && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '22px', border: '1px solid rgba(39,174,96,0.3)', marginBottom: '20px' }}>
                                <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>📦 Stok Hareketi Kaydet</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>MODEL *</div>
                                        <select className="form-select" value={form.model_id || ''} onChange={e => setForm({ ...form, model_id: e.target.value })}>
                                            <option value="">Model seçin</option>
                                            {(models || []).map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>KAYNAK FAZ *</div>
                                        <select className="form-select" value={form.faz_kaynak || ''} onChange={e => setForm({ ...form, faz_kaynak: e.target.value })}>
                                            <option value="">Kaynak</option>
                                            {Object.entries(FAZ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>HEDEF FAZ *</div>
                                        <select className="form-select" value={form.faz_hedef || ''} onChange={e => setForm({ ...form, faz_hedef: e.target.value })}>
                                            <option value="">Hedef (veya Dış Fason)</option>
                                            <option value="fason_baski">Fason Baskı</option>
                                            <option value="fason_nakis">Fason Nakış</option>
                                            {Object.entries(FAZ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ADET *</div>
                                        <input type="number" className="form-input" placeholder="0" value={form.adet || ''} onChange={e => setForm({ ...form, adet: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>BOZULAN / FİRE ADET (Fasondan Gelen)</div>
                                        <input type="number" className="form-input" placeholder="0" value={form.bozulan_adet || ''} onChange={e => setForm({ ...form, bozulan_adet: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                                    <button className="btn btn-primary" onClick={() => kaydet('/api/imalat/yari-mamul', {
                                        model_id: form.model_id ? parseInt(form.model_id) : null,
                                        faz_kaynak: form.faz_kaynak,
                                        faz_hedef: form.faz_hedef,
                                        adet: parseInt(form.adet || 0),
                                    })}>💾 Kaydet</button>
                                    <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { setShowForm(false); setForm({}); }}>İptal</button>
                                </div>
                            </div>
                        )}
                        {yarimamul.length === 0 ? emptyState('📦', 'Yarı mamul kaydı yok. ➕ Stok hareketi ekleyin.') : (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700', fontSize: '14px' }}>
                                    📦 Yarı Mamul Stok Hareketleri <span style={{ fontWeight: '400', fontSize: '12px', color: 'var(--text-muted)' }}>({yarimamul.length})</span>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead><tr style={{ background: 'var(--bg-input)' }}>
                                            {['Model', 'Kaynak', 'Hedef', 'Sağlam Gelen', 'Bozulan Fire', 'Tarih'].map(h => <th key={h} style={headerStyle}>{h}</th>)}
                                        </tr></thead>
                                        <tbody>
                                            {yarimamul.map((y, i) => (
                                                <tr key={y.id || i} style={{ borderTop: '1px solid var(--border-color)' }}>
                                                    <td style={{ ...cellStyle, fontWeight: '600' }}>{y.models?.name || ('Model #' + y.model_id)}</td>
                                                    <td style={cellStyle}>
                                                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', background: (FAZ_RENK[y.faz_kaynak] || '#888') + '22', color: FAZ_RENK[y.faz_kaynak] || '#888' }}>
                                                            {FAZ_LABEL[y.faz_kaynak] || y.faz_kaynak}
                                                        </span>
                                                    </td>
                                                    <td style={cellStyle}>
                                                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', background: (FAZ_RENK[y.faz_hedef] || '#888') + '22', color: FAZ_RENK[y.faz_hedef] || '#888' }}>
                                                            {FAZ_LABEL[y.faz_hedef] || y.faz_hedef}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...cellStyle, fontWeight: '700', color: '#27ae60', fontSize: '15px' }}>{y.adet}</td>
                                                    <td style={{ ...cellStyle, fontWeight: '700', color: '#e74c3c', fontSize: '15px' }}>{y.bozulan_adet || 0}</td>
                                                    <td style={{ ...cellStyle, color: 'var(--text-muted)' }}>{y.tarih || (y.created_at || '').split('T')[0]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ──────── FİRE KAYIT ──────── */}
                {!loading && sekme === 'fire' && (
                    <div>
                        {showForm && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '22px', border: '1px solid rgba(231,76,60,0.3)', marginBottom: '20px' }}>
                                <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>🔥 Fire Kaydı Ekle</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>MODEL</div>
                                        <select className="form-select" value={form.model_id || ''} onChange={e => setForm({ ...form, model_id: e.target.value })}>
                                            <option value="">Model seçin</option>
                                            {(models || []).map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>KUMAŞ TİPİ</div>
                                        <input type="text" className="form-input" placeholder="Pamuk, Polyester..." value={form.kumas_tipi || ''} onChange={e => setForm({ ...form, kumas_tipi: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>FIRE METRE</div>
                                        <input type="number" className="form-input" step="0.01" placeholder="0.00" value={form.fire_metre || ''} onChange={e => setForm({ ...form, fire_metre: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>KULLANILAN METRE</div>
                                        <input type="number" className="form-input" step="0.01" placeholder="0.00" value={form.kullanilan_metre || ''} onChange={e => setForm({ ...form, kullanilan_metre: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>FIRE NEDENİ</div>
                                        <input type="text" className="form-input" placeholder="Kesim hatası, desen uyumsuz..." value={form.fire_nedeni || ''} onChange={e => setForm({ ...form, fire_nedeni: e.target.value })} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>HANGİ SAFHADA FİRE VERDİ? (Maliyet Çarpanı)</div>
                                        <select className="form-select" value={form.fire_safhasi || 'kesim'} onChange={e => setForm({ ...form, fire_safhasi: e.target.value })}>
                                            <option value="kesim">✂️ Kesim Aşamasında (Düşük Zarar)</option>
                                            <option value="dikim">🧵 Dikimde (İşçilik zararı var)</option>
                                            <option value="fason_sonrasi">🔁 Nakış / Fason Dönüşü (Ağır Maliyet)</option>
                                            <option value="utu_paket">📦 Ütü veya Pakette Çöpe Gitti (En Ağır Zarar)</option>
                                        </select>
                                    </div>
                                    <div style={{ background: 'rgba(231,76,60,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(231,76,60,0.3)' }}>
                                        <div style={{ fontSize: '11px', color: '#e74c3c', marginBottom: '4px', fontWeight: 'bold' }}>BİLİNEN/HESAPLANAN ZARAR (₺) *</div>
                                        <input type="number" step="0.01" className="form-input" placeholder="Manuel bedel giriniz" value={form.estimated_loss_amount || ''} onChange={e => setForm({ ...form, estimated_loss_amount: e.target.value })} />
                                        <div style={{ fontSize: '10px', color: '#c0392b', marginTop: '4px' }}>Fireyi yapan operatöre bu TL bedeli sistemden zimmetlenecektir (Prim Eksi Puan).</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ZİMMETLENECEK PERSONEL *</div>
                                        <select className="form-select" value={form.operator_id || ''} onChange={e => setForm({ ...form, operator_id: e.target.value })}>
                                            <option value="">Personel Seçin</option>
                                            {(personnel || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>TARİH</div>
                                        <input type="date" className="form-input" value={form.tarih || new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, tarih: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                                    <button className="btn btn-primary" onClick={() => kaydet('/api/imalat/fire-kayit', {
                                        model_id: form.model_id ? parseInt(form.model_id) : null,
                                        kumas_tipi: form.kumas_tipi || '',
                                        fire_metre: parseFloat(form.fire_metre || 0),
                                        kullanilan_metre: parseFloat(form.kullanilan_metre || 0),
                                        fire_yuzde: form.kullanilan_metre > 0 ? parseFloat(((form.fire_metre / form.kullanilan_metre) * 100).toFixed(2)) : 0,
                                        fire_nedeni: form.fire_nedeni || '',
                                        fire_safhasi: form.fire_safhasi || 'kesim',
                                        estimated_loss_amount: form.estimated_loss_amount ? parseFloat(form.estimated_loss_amount) : 0,
                                        operator_id: form.operator_id ? parseInt(form.operator_id) : null,
                                        tarih: form.tarih || new Date().toISOString().split('T')[0],
                                    })}>💾 Kaydet</button>
                                    <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { setShowForm(false); setForm({}); }}>İptal</button>
                                </div>
                            </div>
                        )}

                        {/* Fire İstatistik KPI */}
                        {fireler.length > 0 && (() => {
                            const topFire = fireler.reduce((t, f) => t + (parseFloat(f.fire_metre) || 0), 0);
                            const topKullan = fireler.reduce((t, f) => t + (parseFloat(f.kullanilan_metre) || 0), 0);
                            const ort = topKullan > 0 ? (topFire / topKullan * 100).toFixed(1) : '0.0';
                            return (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Toplam Fire', val: topFire.toFixed(2) + ' m', color: '#e74c3c', icon: '🔥' },
                                        { label: 'Toplam Kullanılan', val: topKullan.toFixed(2) + ' m', color: '#3498db', icon: '📏' },
                                        { label: 'Ortalama Fire %', val: '%' + ort, color: parseFloat(ort) > 10 ? '#e74c3c' : '#27ae60', icon: '📊' },
                                    ].map((k, i) => (
                                        <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid ' + k.color + '33' }}>
                                            <div style={{ fontSize: '22px', marginBottom: '4px' }}>{k.icon}</div>
                                            <div style={{ fontSize: '20px', fontWeight: '800', color: k.color }}>{k.val}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{k.label}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {fireler.length === 0 ? emptyState('🔥', 'Fire kaydı yok. ➕ Yeni fire ekleyin.') : (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700', fontSize: '14px' }}>
                                    🔥 Fire Kayıtları <span style={{ fontWeight: '400', fontSize: '12px', color: 'var(--text-muted)' }}>({fireler.length})</span>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead><tr style={{ background: 'var(--bg-input)' }}>
                                            {['Model', 'Zarar Safhası', 'Kayıp Bedel (₺)', 'Fire (m)', 'Kullanılan (m)', 'Fire %', 'Neden', 'Tarih'].map(h => <th key={h} style={headerStyle}>{h}</th>)}
                                        </tr></thead>
                                        <tbody>
                                            {fireler.map((f, i) => {
                                                const pct = (parseFloat(f.kullanilan_metre) || 0) > 0
                                                    ? ((parseFloat(f.fire_metre) || 0) / parseFloat(f.kullanilan_metre) * 100).toFixed(1)
                                                    : '0.0';
                                                return (
                                                    <tr key={f.id || i} style={{ borderTop: '1px solid var(--border-color)' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                        <td style={{ ...cellStyle, fontWeight: '600' }}>{f.models?.name || ('Model #' + f.model_id) || '—'}</td>
                                                        <td style={{ ...cellStyle, color: f.wasted_at_phase === 'utu_paket' ? '#e74c3c' : 'var(--text-muted)', fontWeight: 'bold' }}>{f.wasted_at_phase ? f.wasted_at_phase.replace('_', ' ').toUpperCase() : '—'}</td>
                                                        <td style={{ ...cellStyle, color: '#e74c3c', fontWeight: '800' }}>{f.estimated_loss_amount ? '₺' + Number(f.estimated_loss_amount).toFixed(0) : '—'}</td>
                                                        <td style={{ ...cellStyle, color: '#e74c3c', fontWeight: '700' }}>{Number(f.fire_metre || 0).toFixed(2)}</td>
                                                        <td style={cellStyle}>{Number(f.kullanilan_metre || 0).toFixed(2)}</td>
                                                        <td style={cellStyle}>
                                                            <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: parseFloat(pct) > 10 ? 'rgba(231,76,60,0.15)' : 'rgba(39,174,96,0.15)', color: parseFloat(pct) > 10 ? '#e74c3c' : '#27ae60' }}>
                                                                %{pct}
                                                            </span>
                                                        </td>
                                                        <td style={{ ...cellStyle, color: 'var(--text-muted)' }}>{f.fire_nedeni || '—'}</td>
                                                        <td style={{ ...cellStyle, color: 'var(--text-muted)' }}>{f.tarih || (f.created_at || '').split('T')[0]}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
