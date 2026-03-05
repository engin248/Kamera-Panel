'use client';

import { useState, useEffect } from 'react';
import { Globe, Lightbulb, Scissors, CheckCircle, Clock } from 'lucide-react';

export default function ArgeTasarimPage({ addToast }) {
    const [activeTab, setActiveTab] = useState('istihbarat');

    // İstihbarat State
    const [trendQuery, setTrendQuery] = useState('');
    const [trendResult, setTrendResult] = useState(null);
    const [trendLoading, setTrendLoading] = useState(false);

    const handleTrendSorgu = async () => {
        if (!trendQuery) { addToast('error', 'Lütfen araştırılacak trend/kumaş bilgisini girin.'); return; }
        setTrendLoading(true);
        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Şu konu hakkında siber istihbarat ve analiz raporu yaz (Kısa özet): ${trendQuery}`, history: [], bot: 'perplexity' })
            });
            const data = await res.json();
            setTrendResult(data.reply || 'Sonuç bulunamadı.');
            addToast('success', 'İstihbarat raporu Kâşif tarafından tamamlandı.');
        } catch (error) {
            addToast('error', 'Ajan bağlantısı başarısız oldu.');
        } finally {
            setTrendLoading(false);
        }
    };

    // Numune Faz State
    const [faz1Aktif, setFaz1Aktif] = useState(false);
    const [faz2Aktif, setFaz2Aktif] = useState(false);

    const handleFaz = (fazNo, islem) => {
        if (fazNo === 1) {
            setFaz1Aktif(islem === 'baslat');
            addToast(islem === 'baslat' ? 'success' : 'info', islem === 'baslat' ? 'Kalıp Çizimi kronometresi başladı.' : 'Kalıp Çizimi mühürlendi / bitirildi.');
        } else {
            setFaz2Aktif(islem === 'baslat');
            addToast(islem === 'baslat' ? 'success' : 'info', islem === 'baslat' ? 'İlk Zombi Dikimi başladı.' : 'Zombi model mühürlendi ve testlere alındı.');
        }
    };

    // Karargah State
    const [modelAdi, setModelAdi] = useState('');
    const handleImalataDevret = async () => {
        if (!modelAdi) { addToast('error', 'Lütfen imalata devredilecek modelin adını girin.'); return; }
        try {
            const res = await fetch('/api/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: modelAdi,
                    code: 'ARGE-' + Math.floor(Math.random() * 1000),
                    status: 'tasarim',
                    description: 'AR-GE İstihbarat ve Tasarım fazından devredildi.'
                })
            });
            if (!res.ok) throw new Error('Hata');
            addToast('success', `"${modelAdi}" başarıyla İmalat (Modeller) sekmesine aktarıldı!`);
            setModelAdi('');
            setActiveTab('istihbarat'); // Başa dön
        } catch (error) {
            addToast('error', 'Model imalata devredilirken hata oluştu.');
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, rgba(41,128,185,0.1), rgba(142,68,173,0.1))', borderBottom: '1px solid rgba(142,68,173,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(142,68,173,0.15)', color: '#8e44ad', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={26} />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ color: '#fff', fontSize: '24px', letterSpacing: '0.5px' }}>AR-GE ve Siber İstihbarat</h1>
                        <p className="page-subtitle" style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Siber Trend, Zombi/Numune Dikimi ve Kumaş Doğrulama Merkezi</p>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 24px', marginTop: '-14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button
                        onClick={() => setActiveTab('istihbarat')}
                        style={{ padding: '10px 18px', borderRadius: '10px', background: activeTab === 'istihbarat' ? 'rgba(142,68,173,0.2)' : 'transparent', border: activeTab === 'istihbarat' ? '1px solid rgba(142,68,173,0.5)' : '1px solid transparent', color: activeTab === 'istihbarat' ? '#9b59b6' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: activeTab === 'istihbarat' ? '600' : '400', transition: 'all 0.2s' }}
                    >
                        <Lightbulb size={18} /> Trend & Siber İstihbarat
                    </button>

                    <button
                        onClick={() => setActiveTab('numune')}
                        style={{ padding: '10px 18px', borderRadius: '10px', background: activeTab === 'numune' ? 'rgba(52,152,219,0.2)' : 'transparent', border: activeTab === 'numune' ? '1px solid rgba(52,152,219,0.5)' : '1px solid transparent', color: activeTab === 'numune' ? '#3498db' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: activeTab === 'numune' ? '600' : '400', transition: 'all 0.2s' }}
                    >
                        <Scissors size={18} /> Zombi & Numune Fazı
                    </button>

                    <button
                        onClick={() => setActiveTab('karargah')}
                        style={{ padding: '10px 18px', borderRadius: '10px', background: activeTab === 'karargah' ? 'rgba(46,204,113,0.2)' : 'transparent', border: activeTab === 'karargah' ? '1px solid rgba(46,204,113,0.5)' : '1px solid transparent', color: activeTab === 'karargah' ? '#2ecc71' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: activeTab === 'karargah' ? '600' : '400', transition: 'all 0.2s' }}
                    >
                        <CheckCircle size={18} /> Yönetim Onayı & İmalata Devir
                    </button>
                </div>
            </div>

            <div className="page-content" style={{ padding: '0 24px 24px' }}>

                {activeTab === 'istihbarat' && (
                    <div className="card fade-in">
                        <div className="card-header">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={20} color="#9b59b6" /> Küresel Moda Ağı İstihbaratı</div>
                        </div>
                        <div style={{ padding: '24px', color: 'rgba(255,255,255,0.5)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👁️</div>
                                <h3 style={{ color: '#fff', marginBottom: '8px' }}>Dijital Kâşif&apos;e Konu Verin</h3>
                                <p style={{ marginBottom: '16px' }}>Yeni bir projede web scraping yapmak veya renk/kumaş/model trend analizi başlatmak için sorunuzu girin.</p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto 20px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Örn: 2026 İlkbahar oversize tişört renk trendleri ve pamuk maliyetleri..."
                                    value={trendQuery}
                                    onChange={e => setTrendQuery(e.target.value)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #9b59b6', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                />
                                <button
                                    onClick={handleTrendSorgu}
                                    disabled={trendLoading}
                                    className="btn btn-primary"
                                    style={{ background: 'linear-gradient(135deg, #8e44ad, #9b59b6)', border: 'none', padding: '0 24px', cursor: 'pointer' }}>
                                    {trendLoading ? 'Siber Ağ Aranıyor...' : 'Araştır & Raporla'}
                                </button>
                            </div>

                            {trendResult && (
                                <div style={{ background: 'rgba(155, 89, 182, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(155, 89, 182, 0.3)', color: '#e0e0e0', textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
                                    <h4 style={{ color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Globe size={18} color="#9b59b6" /> Kâşif Raporu Çıktısı
                                    </h4>
                                    <div dangerouslySetInnerHTML={{ __html: trendResult.replace(/\n/g, '<br/>') }} style={{ lineHeight: '1.6', fontSize: '14px' }} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'numune' && (
                    <div className="card fade-in">
                        <div className="card-header">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Scissors size={20} color="#3498db" /> Numune (Zombi) Faz Yönetimi</div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ background: 'rgba(52,152,219,0.05)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                                    {faz1Aktif && <div style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: '50%', background: '#2ecc71', animation: 'pulse 1s infinite' }}></div>}
                                    <h4 style={{ color: '#3498db', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> 1. Faz: Kalıp Çizimi</h4>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>Tasarımın kalıba dökülme süreci. Kronometre personel performansını ölçer.</p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleFaz(1, 'baslat')} disabled={faz1Aktif} className="btn btn-primary" style={{ flex: 1, background: faz1Aktif ? 'rgba(255,255,255,0.1)' : 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', color: faz1Aktif ? '#888' : '#2ecc71', cursor: faz1Aktif ? 'not-allowed' : 'pointer' }}>▶ Başlat</button>
                                        <button onClick={() => handleFaz(1, 'bitir')} disabled={!faz1Aktif} className="btn btn-secondary" style={{ flex: 1, background: !faz1Aktif ? 'rgba(255,255,255,0.1)' : 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: !faz1Aktif ? '#888' : '#e74c3c', cursor: !faz1Aktif ? 'not-allowed' : 'pointer' }}>⏹ Bitir</button>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(243,156,18,0.05)', border: '1px solid rgba(243,156,18,0.2)', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                                    {faz2Aktif && <div style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: '50%', background: '#e67e22', animation: 'pulse 1s infinite' }}></div>}
                                    <h4 style={{ color: '#f39c12', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Scissors size={16} /> 2. Faz: İlk Zombi Dikimi</h4>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>Kalıbın kumaşa dökülüp dikildiği ilk numune evresi.</p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleFaz(2, 'baslat')} disabled={faz2Aktif} className="btn btn-primary" style={{ flex: 1, background: faz2Aktif ? 'rgba(255,255,255,0.1)' : 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)', color: faz2Aktif ? '#888' : '#f39c12', cursor: faz2Aktif ? 'not-allowed' : 'pointer' }}>▶ Başlat</button>
                                        <button onClick={() => handleFaz(2, 'mühürle')} disabled={!faz2Aktif} className="btn btn-secondary" style={{ flex: 1, background: !faz2Aktif ? 'rgba(255,255,255,0.1)' : 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: !faz2Aktif ? '#888' : '#e74c3c', cursor: !faz2Aktif ? 'not-allowed' : 'pointer' }}>⏹ Mühürle</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'karargah' && (
                    <div className="card fade-in">
                        <div className="card-header">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={20} color="#2ecc71" /> Karargah Dosya Onayı</div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(46,204,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                    <CheckCircle size={40} color="#2ecc71" />
                                </div>
                                <h3 style={{ color: '#fff', marginBottom: '8px' }}>Yönetim ve Fiyatlandırma Onayı Bekleniyor</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '400px', marginBottom: '24px' }}>
                                    3D Medya Sunumu izlendi, maliyetler çıkarıldı. &quot;İmalata Devret&quot; talimatı Başkomutan tarafından onaylandıktan sonra model otomatik olarak <b>Modeller (Üretim)</b> sekmesine düşecektir.
                                </p>

                                <div style={{ marginBottom: '20px', width: '100%', maxWidth: '300px' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Projeye / Modele İsim Verin..."
                                        value={modelAdi}
                                        onChange={e => setModelAdi(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2ecc71', background: 'rgba(0,0,0,0.2)', color: '#fff', textAlign: 'center' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => { setModelAdi(''); addToast('error', 'Dosya reddedildi, arşive kaldırıldı.'); }} className="btn" style={{ padding: '12px 24px', borderRadius: '8px', background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer' }}>✖ Reddet / Çöpe At</button>
                                    <button onClick={handleImalataDevret} className="btn" style={{ padding: '12px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #27ae60, #2ecc71)', border: 'none', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(46,204,113,0.3)', cursor: 'pointer' }}>
                                        <CheckCircle size={18} /> Teknik Dosyayı Modele Devret
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
