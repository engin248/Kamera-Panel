'use client';
import { useState, useEffect, useCallback } from 'react';

export default function MachinesPage({ addToast }) {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({});

    const loadMachines = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/machines');
            const data = await res.json();
            setMachines(Array.isArray(data) ? data : []);
        } catch (e) { console.error('Machines load:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadMachines(); }, [loadMachines]);

    const kaydet = async () => {
        if (!form.name || !form.type) { addToast('error', 'Makine adı ve tipi zorunlu'); return; }
        try {
            const res = await fetch('/api/machines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    count: parseInt(form.count || 1),
                    purchase_date: form.purchase_date || null,
                    last_maintenance: form.last_maintenance || null,
                    next_maintenance: form.next_maintenance || null,
                }),
            });
            if (res.ok) {
                addToast('success', '✅ Makine eklendi');
                setShowForm(false);
                setForm({});
                loadMachines();
            } else {
                const d = await res.json();
                addToast('error', d.error || 'Hata');
            }
        } catch { addToast('error', 'Bağlantı hatası'); }
    };

    const durum_renk = {
        aktif: '#27ae60', bakimda: '#f39c12', arizali: '#e74c3c', pasif: '#95a5a6'
    };

    const hPC = { padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' };
    const cSt = { padding: '11px 14px', fontSize: '13px' };

    return (
        <>
            <div className="topbar">
                <h1 className="topbar-title">⚙️ Makineler</h1>
                <div className="topbar-actions">
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? '✕ Kapat' : '➕ Yeni Makine'}
                    </button>
                    <button onClick={loadMachines} style={{ padding: '8px 14px', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '8px', color: '#27ae60', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit' }}>
                        🔄 Yenile
                    </button>
                </div>
            </div>

            <div className="page-content">
                {/* KPI */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    {[
                        { label: 'Toplam Makine', val: machines.reduce((s, m) => s + (parseInt(m.count) || 1), 0), icon: '⚙️', color: '#3498db' },
                        { label: 'Aktif', val: machines.filter(m => m.status === 'aktif').length, icon: '🟢', color: '#27ae60' },
                        { label: 'Bakımda', val: machines.filter(m => m.status === 'bakimda').length, icon: '🔧', color: '#f39c12' },
                        { label: 'Arızalı', val: machines.filter(m => m.status === 'arizali').length, icon: '🔴', color: '#e74c3c' },
                    ].map((k, i) => (
                        <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '18px', border: '1px solid ' + k.color + '33', textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{k.icon}</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: k.color }}>{k.val}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{k.label}</div>
                        </div>
                    ))}
                </div>

                {/* Form */}
                {showForm && (
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '22px', border: '1px solid rgba(52,152,219,0.3)', marginBottom: '20px' }}>
                        <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>⚙️ Yeni Makine Ekle</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                            {[
                                { key: 'name', label: 'Makine Adı *', placeholder: 'Overlok A Hattı' },
                                { key: 'type', label: 'Tip *', placeholder: 'Overlok, Düz, Reçme...' },
                                { key: 'brand', label: 'Marka', placeholder: 'Brother, Juki...' },
                                { key: 'model_name', label: 'Model', placeholder: 'MO-6700' },
                                { key: 'serial_no', label: 'Seri No', placeholder: 'SN-001' },
                                { key: 'location', label: 'Konum', placeholder: 'A Hattı, B Bölümü' },
                            ].map(f => (
                                <div key={f.key}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{f.label}</div>
                                    <input type="text" className="form-input" placeholder={f.placeholder}
                                        value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                </div>
                            ))}
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ADET</div>
                                <input type="number" className="form-input" placeholder="1" min="1"
                                    value={form.count || ''} onChange={e => setForm({ ...form, count: e.target.value })} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>DURUM</div>
                                <select className="form-select" value={form.status || 'aktif'} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="aktif">🟢 Aktif</option>
                                    <option value="bakimda">🔧 Bakımda</option>
                                    <option value="arizali">🔴 Arızalı</option>
                                    <option value="pasif">⚫ Pasif</option>
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SON BAKIM</div>
                                <input type="date" className="form-input"
                                    value={form.last_maintenance || ''} onChange={e => setForm({ ...form, last_maintenance: e.target.value })} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SONRAKİ BAKIM</div>
                                <input type="date" className="form-input"
                                    value={form.next_maintenance || ''} onChange={e => setForm({ ...form, next_maintenance: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button className="btn btn-primary" onClick={kaydet}>💾 Kaydet</button>
                            <button onClick={() => { setShowForm(false); setForm({}); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
                        </div>
                    </div>
                )}

                {/* Tablo */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>⏳ Yükleniyor...</div>
                ) : machines.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚙️</div>
                        <div>Henüz makine eklenmemiş. ➕ Yeni makine ekleyin.</div>
                    </div>
                ) : (
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700', fontSize: '14px' }}>
                            ⚙️ Makine Listesi <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '12px' }}>({machines.length} kayıt)</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-input)' }}>
                                        {['Ad', 'Tip', 'Marka/Model', 'Seri No', 'Son Bakım', 'Sonraki', 'Durum', 'Duruş / Fırsat Zararı'].map(h => (
                                            <th key={h} style={hPC}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {machines.map((m, i) => {
                                        const dr = durum_renk[m.status] || '#888';
                                        const nextBakim = m.next_maintenance ? new Date(m.next_maintenance) : null;
                                        const yakinda = nextBakim && (nextBakim - new Date()) < 7 * 24 * 60 * 60 * 1000;

                                        // İşletme Zekası: Makine Duruş Kronometresi
                                        let durusMaliyetiUI = <span style={{ color: 'var(--text-muted)' }}>—</span>;
                                        if (m.status === 'arizali') {
                                            const arızaZaman = new Date(m.updated_at || new Date(Date.now() - 4 * 60 * 60 * 1000)); // varsayılan 4 saat eklendi
                                            const gecenSaat = Math.abs(new Date() - arızaZaman) / 36e5;
                                            const saatlikKayıp = 150; // Makine başı saatlik fırsat maliyeti (Örn: 150 TL)
                                            const toplamZarar = Math.round(gecenSaat * saatlikKayıp);
                                            durusMaliyetiUI = (
                                                <div style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                                    -₺{toplamZarar.toLocaleString('tr-TR')}
                                                    <div style={{ fontSize: '10px', color: '#c0392b' }}>⏱️ {Math.round(gecenSaat)} Saattir Yatıyor</div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <tr key={m.id || i} style={{ borderTop: '1px solid var(--border-color)' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                <td style={{ ...cSt, fontWeight: '700' }}>{m.name}</td>
                                                <td style={cSt}>{m.type || '—'}</td>
                                                <td style={{ ...cSt, color: 'var(--text-muted)' }}>{m.brand ? `${m.brand} ${m.model_name || ''}` : '—'}</td>
                                                <td style={{ ...cSt, color: 'var(--text-muted)', fontSize: '11px' }}>{m.serial_no || '—'}</td>
                                                <td style={cSt}>{m.last_maintenance || '—'}</td>
                                                <td style={{ ...cSt, color: yakinda ? '#e74c3c' : 'var(--text-primary)', fontWeight: yakinda ? '700' : '400' }}>
                                                    {m.next_maintenance ? `${yakinda ? '⚠️ ' : ''}${m.next_maintenance}` : '—'}
                                                </td>
                                                <td style={cSt}>
                                                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: dr + '20', color: dr, border: '1px solid ' + dr + '40' }}>
                                                        {m.status || 'aktif'}
                                                    </span>
                                                </td>
                                                <td style={cSt}>{durusMaliyetiUI}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
