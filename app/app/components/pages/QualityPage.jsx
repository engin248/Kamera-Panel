'use client';
import { useState, useEffect, useCallback } from 'react';
import BirimAsistanPanel from '../BirimAsistanPanel';

export default function QualityPage({ models, personnel, addToast }) {
    const [qualPageTab, setQualPageTab] = useState('liste');
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterModel, setFilterModel] = useState('');
    const [filterPersonnel, setFilterPersonnel] = useState('');
    const [filterResult, setFilterResult] = useState('');

    const loadChecks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterModel) params.set('model_id', filterModel);
            if (filterPersonnel) params.set('personnel_id', filterPersonnel);
            if (filterResult) params.set('result', filterResult);
            const res = await fetch(`/api/quality-checks?${params.toString()}`);
            const data = await res.json();
            setChecks(Array.isArray(data) ? data : []);
        } catch (e) { console.error('Quality load:', e); }
        finally { setLoading(false); }
    }, [filterModel, filterPersonnel, filterResult]);

    useEffect(() => { loadChecks(); }, [loadChecks]);

    const toplam = checks.length;
    const uygun = checks.filter(c => c.result === 'ok').length;
    const red = checks.filter(c => c.result === 'red').length;
    const oran = toplam > 0 ? ((uygun / toplam) * 100).toFixed(1) : '0.0';

    const renkMap = { ok: '#27ae60', red: '#e74c3c', beklemede: '#f39c12' };
    const etiketMap = { ok: '✅ Uygun', red: '❌ Red', beklemede: '⏳ Beklemede' };

    const hPC = { padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' };
    const cSt = { padding: '11px 14px', fontSize: '13px' };

    return (
        <>
            <div className="topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 className="topbar-title" style={{ margin: 0 }}>✅ Kalite Kontrol</h1>
                    <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
                        <button onClick={() => setQualPageTab('liste')} style={{ padding: '6px 16px', background: qualPageTab === 'liste' ? '#27ae60' : 'transparent', color: qualPageTab === 'liste' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }}>
                            📊 Denetimler
                        </button>
                        <button onClick={() => setQualPageTab('asistan')} style={{ padding: '6px 16px', background: qualPageTab === 'asistan' ? 'rgba(39,174,96,0.15)' : 'transparent', color: qualPageTab === 'asistan' ? '#27ae60' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            💬 Kalite Asistanı
                        </button>
                    </div>
                </div>
                <div className="topbar-actions">
                    <button onClick={loadChecks} style={{ padding: '8px 14px', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '8px', color: '#27ae60', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit' }}>
                        🔄 Yenile
                    </button>
                </div>
            </div>

            {qualPageTab === 'liste' && (
                <div className="page-content">
                    {/* KPI */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                        {[
                            { label: 'Toplam Kontrol', val: toplam, icon: '🔍', color: '#3498db' },
                            { label: 'Uygun', val: uygun, icon: '✅', color: '#27ae60' },
                            { label: 'Red', val: red, icon: '❌', color: '#e74c3c' },
                            { label: 'Başarı Oranı', val: `%${oran}`, icon: '📊', color: parseFloat(oran) >= 95 ? '#27ae60' : parseFloat(oran) >= 80 ? '#f39c12' : '#e74c3c' },
                        ].map((k, i) => (
                            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '18px', border: '1px solid ' + k.color + '33', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', marginBottom: '6px' }}>{k.icon}</div>
                                <div style={{ fontSize: '22px', fontWeight: '800', color: k.color }}>{k.val}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{k.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filtreler */}
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '16px 18px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '12px', color: 'var(--text-muted)' }}>🔎 Filtrele</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>MODEL</div>
                                <select className="form-select" value={filterModel} onChange={e => setFilterModel(e.target.value)}>
                                    <option value="">Tümü</option>
                                    {(models || []).map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>PERSONEL</div>
                                <select className="form-select" value={filterPersonnel} onChange={e => setFilterPersonnel(e.target.value)}>
                                    <option value="">Tümü</option>
                                    {(personnel || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SONUÇ</div>
                                <select className="form-select" value={filterResult} onChange={e => setFilterResult(e.target.value)}>
                                    <option value="">Tümü</option>
                                    <option value="ok">✅ Uygun</option>
                                    <option value="red">❌ Red</option>
                                    <option value="beklemede">⏳ Beklemede</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tablo */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>⏳ Yükleniyor...</div>
                    ) : checks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                            <div>Kalite kontrol kaydı bulunamadı. Operatör ekranından kayıt oluşturulur.</div>
                        </div>
                    ) : (
                        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700', fontSize: '14px' }}>
                                ✅ Kontrol Kayıtları <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '12px' }}>({checks.length} kayıt)</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-input)' }}>
                                            {['Model', 'Personel', 'İşlem', 'Kontrol Tipi', 'Kontrol #', 'Sonuç', 'Kontrol Eden', 'Tarih'].map(h => (
                                                <th key={h} style={hPC}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {checks.map((c, i) => {
                                            const renk = renkMap[c.result] || '#888';
                                            const etiket = etiketMap[c.result] || c.result;
                                            return (
                                                <tr key={c.id || i} style={{ borderTop: '1px solid var(--border-color)' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                    <td style={{ ...cSt, fontWeight: '600' }}>{c.model_name || `Model #${c.model_id}`}</td>
                                                    <td style={cSt}>{c.personnel_name || '—'}</td>
                                                    <td style={{ ...cSt, color: 'var(--text-muted)' }}>{c.operation_name || '—'}</td>
                                                    <td style={cSt}>{c.check_type || 'inline'}</td>
                                                    <td style={{ ...cSt, color: '#3498db', fontWeight: '700' }}>#{c.check_number || 1}</td>
                                                    <td style={cSt}>
                                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: renk + '20', color: renk, border: '1px solid ' + renk + '40' }}>
                                                            {etiket}
                                                        </span>
                                                        {c.result === 'ok' && (
                                                            <button
                                                                onClick={() => addToast('success', `${c.model_name || 'Bu ürün'} mağazaya sevkedildi! (Stoklara eklendi)`)}
                                                                style={{ marginLeft: '6px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                                Mağazaya Sevket ➔
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td style={{ ...cSt, color: 'var(--text-muted)' }}>{c.checked_by || '—'}</td>
                                                    <td style={{ ...cSt, color: 'var(--text-muted)', fontSize: '11px' }}>
                                                        {c.checked_at ? new Date(c.checked_at).toLocaleString('tr-TR') : '—'}
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

            {qualPageTab === 'asistan' && (
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                    <BirimAsistanPanel
                        birimAdi="Kalite Kontrol"
                        aciklama="Ara kontrol verileri, son kontrol oranları ve hatalı üretim analizlerinden sorumluyum."
                        renkHex="#27ae60"
                        apiEndpoint="/api/agent/kalite-asistan"
                    />
                </div>
            )}
        </>
    );
}
