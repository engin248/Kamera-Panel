'use client';
import React, { useState, useEffect, useCallback } from 'react';
import BirimAsistanPanel from '../BirimAsistanPanel';
import { Award, Target, TrendingUp, TrendingDown, Users, ShieldCheck } from 'lucide-react';

export default function PrimPage({ models, personnel, addToast, currentUser }) {
    const [primData, setPrimData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ay, setAy] = useState(new Date().getMonth() + 1);
    const [yil, setYil] = useState(new Date().getFullYear());
    const [primOrani, setPrimOrani] = useState(30);

    const loadPrim = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ ay, yil });
            const res = await fetch(`/api/prim?${params.toString()}`);
            const data = await res.json();
            setPrimData(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Prim load:', e);
            addToast('error', 'Prim verileri yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [ay, yil, addToast]);

    useEffect(() => {
        loadPrim();
    }, [loadPrim]);

    const calculatePrim = async () => {
        setLoading(true);
        addToast('info', '🤖 Otonom Muhasip devrede: Üretim, fire cezaları ve maaş maliyetleri hesaplanıyor...');
        try {
            const res = await fetch('/api/prim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ay, yil, prim_orani: primOrani })
            });
            const result = await res.json();
            if (res.ok) {
                addToast('success', '✅ Prim ve Kazanç Dağılımı (SİL BAŞTAN) hesaplandı.');
                loadPrim();
            } else {
                addToast('error', result.error || 'Hesaplama hatası');
            }
        } catch (err) {
            addToast('error', err.message || 'Bağlantı hatası');
        } finally {
            setLoading(false);
        }
    };

    // Yalnızca Koordinatör tüm finansal tabloyu görür, diğerleri için erişim yasaktır.
    if (currentUser?.role !== 'koordinator') {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
                <h2 style={{ color: '#e74c3c' }}>Yetkisiz Erişim</h2>
                <p>Prim modülü şeffaflık ilkeleri gereği sistem tarafından maskelenmiştir. İşletme finansal bilgileri yalnızca Koordinatör ekranında görünür.</p>
            </div>
        );
    }

    return (
        <div className="page-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={28} color="#D4A847" /> Sil Baştan Prim Motoru
                    </h1>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Otonom Adalet Terazisi: İşletmeye kazanç bırakmadan personele prim yansıtılmaz. Fire/Rework kayıpları otomatik düşülür.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>AY</div>
                        <input type="number" className="form-input" min="1" max="12" value={ay} onChange={e => setAy(e.target.value)} style={{ width: '60px', padding: '6px' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>YIL</div>
                        <input type="number" className="form-input" value={yil} onChange={e => setYil(e.target.value)} style={{ width: '80px', padding: '6px' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>PRİM ORANI (%)</div>
                        <input type="number" className="form-input" value={primOrani} onChange={e => setPrimOrani(e.target.value)} style={{ width: '60px', padding: '6px' }} />
                    </div>
                    <button onClick={calculatePrim} className="btn" style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', alignSelf: 'flex-end', padding: '8px 16px' }} disabled={loading}>
                        {loading ? '⏳ Hesaplanıyor...' : '⚖️ Teraziyi Çalıştır'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Yükleniyor...</div>
            ) : primData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Bu ay için prim hesaplaması yapılmadı.</h3>
                    <p style={{ margin: 0 }}>Seçili aya ait üretimi analiz etmek ve prim dağıtmak için "Teraziyi Çalıştır" butonunu kullanın.</p>
                </div>
            ) : (
                <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Personel</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }} title="Hatayasız Üretim Değeri (Net Ciro)">Katkı (Üretim Ciro)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }} title="Maaş + Yol + Yemek + SGK">Aylık Maliyeti</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>Fire / Tamir Kaybı</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>Şirkete Kazancı</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)' }}>Hakediş (Prim)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {primData.map(p => {
                                const isKazancli = p.katki_maas_farki > 0;
                                const maasKarsilamaYuzdesi = p.maas_maliyeti > 0 ? ((p.katki_degeri / p.maas_maliyeti) * 100).toFixed(0) : 0;

                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{p.personel_adi}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FPY: %{p.fpy_yuzde} | Üretim: {p.toplam_uretilen} ad.</div>
                                        </td>

                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#D4A847' }}>
                                            ₺{p.katki_degeri.toLocaleString('tr-TR')}
                                        </td>

                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <div style={{ fontWeight: '500' }}>₺{p.maas_maliyeti.toLocaleString('tr-TR')}</div>
                                            <div style={{ fontSize: '10px', marginTop: '2px', color: isKazancli ? '#2ecc71' : '#e74c3c' }}>
                                                Maliyet Karşılama: %{maasKarsilamaYuzdesi}
                                            </div>
                                        </td>

                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: p.zayiat_cezasi > 0 ? '#e74c3c' : 'var(--text-muted)' }}>
                                            {p.zayiat_cezasi > 0 ? `-₺${p.zayiat_cezasi.toLocaleString('tr-TR')}` : '0 ₺'}
                                        </td>

                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            {isKazancli ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(46,204,113,0.15)', padding: '6px 12px', borderRadius: '20px', color: '#27ae60', fontWeight: '800' }}>
                                                    <TrendingUp size={14} /> ₺{p.katki_maas_farki.toLocaleString('tr-TR')}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(231,76,60,0.1)', padding: '6px 12px', borderRadius: '20px', color: '#c0392b', fontWeight: '800' }}>
                                                    <TrendingDown size={14} /> ₺{Math.abs(p.katki_maas_farki).toLocaleString('tr-TR')} Zarar
                                                </div>
                                            )}
                                            <div style={{ fontSize: '9px', marginTop: '6px', color: 'var(--text-muted)' }}>
                                                {isKazancli ? 'Maaşı aşan ekstra değer' : 'Maaş maliyetine ulaşamadı'}
                                            </div>
                                        </td>

                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            {p.prim_tutari > 0 ? (
                                                <div style={{ fontSize: '18px', fontWeight: '900', color: '#8e44ad', textShadow: '0 2px 4px rgba(142, 68, 173, 0.2)' }}>
                                                    +₺{p.prim_tutari.toLocaleString('tr-TR')}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.2)' }}>
                                                    Yok
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* AI Değerlendirme Çıktısı */}
            {primData.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '24px' }}>
                    {primData.map(p => {
                        if (!p.notlar) return null;
                        const hasPenalty = p.notlar.includes('Cezali:');
                        return (
                            <div key={`agent-${p.id}`} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: `1px solid ${hasPenalty ? 'rgba(231,76,60,0.3)' : 'rgba(155,89,182,0.3)'}` }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: hasPenalty ? '#e74c3c' : '#9b59b6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {hasPenalty ? '⚠️ Otonom Muhasip İhtarı' : '🤖 Otonom Muhasip Analizi'} — {p.personel_adi}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                                    {p.notlar}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
