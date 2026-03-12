'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, Lightbulb, Scissors, CheckCircle, Clock, Database, TrendingUp, AlertCircle } from 'lucide-react';

// ── Renk Sabitleri (Emerald & Gold — THE ORDER Standardı) ──
const EMERALD = '#047857';
const EMERALD_LIGHT = 'rgba(4,120,87,0.15)';
const EMERALD_BORDER = 'rgba(4,120,87,0.4)';
const GOLD = '#D4A847';
const GOLD_LIGHT = 'rgba(212,168,71,0.15)';
const GOLD_BORDER = 'rgba(212,168,71,0.4)';

export default function ArgeTasarimPage({ addToast }) {
    const [activeTab, setActiveTab] = useState('istihbarat');

    // ── İstihbarat (Trend Arama) — API bağlantısı sona bırakıldı ──
    const [trendQuery, setTrendQuery] = useState('');
    const [trendResult, setTrendResult] = useState(null);
    const [trendLoading, setTrendLoading] = useState(false);

    const handleTrendSorgu = async () => {
        if (!trendQuery) { addToast('error', 'Araştırılacak konuyu girin.'); return; }
        setTrendLoading(true);
        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Şu konu hakkında siber istihbarat ve analiz raporu yaz (Kısa özet): ${trendQuery}`,
                    history: [],
                    bot: 'perplexity'
                })
            });
            const data = await res.json();
            setTrendResult(data.reply || 'Sonuç bulunamadı.');
            addToast('success', 'İstihbarat raporu Kâşif tarafından tamamlandı.');
        } catch {
            addToast('error', 'Ajan bağlantısı başarısız oldu.');
        } finally {
            setTrendLoading(false);
        }
    };

    // ── Numune Faz State + DB Entegrasyonu ──
    const [projeAdi, setProjeAdi] = useState('');
    const [faz1Aktif, setFaz1Aktif] = useState(false);
    const [faz2Aktif, setFaz2Aktif] = useState(false);
    const [fazYukleniyor, setFazYukleniyor] = useState(false);
    const [fazGecmisi, setFazGecmisi] = useState([]);
    const [gecmisYukleniyor, setGecmisYukleniyor] = useState(false);

    // Faz geçmişini yükle
    const fazGecmisiniYukle = useCallback(async () => {
        setGecmisYukleniyor(true);
        try {
            const res = await fetch('/api/arge-faz');
            const data = await res.json();
            if (Array.isArray(data)) {
                setFazGecmisi(data);
                // Aktif fazları tespit et
                const aktifFazlar = data.filter(f => f.durum === 'devam');
                setFaz1Aktif(aktifFazlar.some(f => f.faz_no === 1));
                setFaz2Aktif(aktifFazlar.some(f => f.faz_no === 2));
                // Aktif proje adını otomatik doldur
                if (aktifFazlar.length > 0 && !projeAdi) {
                    setProjeAdi(aktifFazlar[0].proje_adi);
                }
            }
        } catch {
            // Sessiz hata — tablo henüz yok olabilir
        } finally {
            setGecmisYukleniyor(false);
        }
    }, [projeAdi]);

    useEffect(() => { fazGecmisiniYukle(); }, []);

    const handleFaz = async (fazNo, islem) => {
        if (!projeAdi.trim()) {
            addToast('error', 'Önce proje adı girin.');
            return;
        }
        setFazYukleniyor(true);
        try {
            const res = await fetch('/api/arge-faz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    islem,
                    proje_adi: projeAdi.trim(),
                    faz_no: fazNo,
                })
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                addToast('error', data.error || 'İşlem başarısız.');
                return;
            }

            if (islem === 'baslat') {
                if (fazNo === 1) setFaz1Aktif(true);
                else setFaz2Aktif(true);
                addToast('success', `${fazNo}. Faz başlatıldı — Kronometre çalışıyor 🟢`);
            } else {
                if (fazNo === 1) setFaz1Aktif(false);
                else setFaz2Aktif(false);
                const sure = data.sure_dakika;
                addToast('success', `${fazNo}. Faz tamamlandı — Süre: ${sure} dk ✅`);
            }
            await fazGecmisiniYukle();
        } catch {
            addToast('error', 'Sunucu bağlantısı kesildi — lütfen tekrar deneyin.');
        } finally {
            setFazYukleniyor(false);
        }
    };

    // ── İmalata Devir ──
    const [modelAdi, setModelAdi] = useState('');
    const [devrediliyor, setDevrediliyor] = useState(false);

    const handleImalataDevret = async () => {
        if (!modelAdi.trim()) { addToast('error', 'Model adını girin.'); return; }
        setDevrediliyor(true);
        try {
            const res = await fetch('/api/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: modelAdi.trim(),
                    code: 'ARGE-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4),
                    status: 'tasarim',
                    description: `AR-GE modülünden devredildi. Proje: ${projeAdi || modelAdi}`
                })
            });
            if (!res.ok) throw new Error('API hatası');
            addToast('success', `"${modelAdi}" başarıyla İmalat Modellerine aktarıldı ✅`);
            setModelAdi('');
        } catch {
            addToast('error', 'Devir işlemi başarısız.');
        } finally {
            setDevrediliyor(false);
        }
    };

    // ── Faz durumu formatlayıcı ──
    const formatSure = (dk) => {
        if (!dk) return '—';
        if (dk < 60) return `${dk} dk`;
        return `${Math.floor(dk / 60)} sa ${dk % 60} dk`;
    };

    const tabStyle = (id) => ({
        padding: '10px 18px',
        borderRadius: '10px',
        background: activeTab === id ? EMERALD_LIGHT : 'transparent',
        border: `1px solid ${activeTab === id ? EMERALD_BORDER : 'transparent'}`,
        color: activeTab === id ? EMERALD : 'rgba(255,255,255,0.5)',
        display: 'flex', alignItems: 'center', gap: '8px',
        cursor: 'pointer',
        fontWeight: activeTab === id ? '700' : '400',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
        fontSize: '13px',
        whiteSpace: 'nowrap',
    });

    return (
        <div className="page-container fade-in">

            {/* ── HEADER ── */}
            <div className="page-header" style={{
                background: `linear-gradient(135deg, ${EMERALD_LIGHT}, ${GOLD_LIGHT})`,
                borderBottom: `1px solid ${EMERALD_BORDER}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: EMERALD_LIGHT, color: EMERALD,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${EMERALD_BORDER}`
                    }}>
                        <Globe size={26} />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ color: '#fff', fontSize: '24px', letterSpacing: '0.5px' }}>
                            AR-GE ve Siber İstihbarat
                        </h1>
                        <p className="page-subtitle" style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                            Trend Analizi · Numune Faz Takibi · İmalata Devir
                        </p>
                    </div>
                </div>
            </div>

            {/* ── SEKMELER ── */}
            <div style={{ padding: '0 24px', marginTop: '-14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button style={tabStyle('istihbarat')} onClick={() => setActiveTab('istihbarat')}>
                        <Lightbulb size={16} /> Trend İstihbarat
                    </button>
                    <button style={tabStyle('numune')} onClick={() => setActiveTab('numune')}>
                        <Scissors size={16} /> Numune Faz
                    </button>
                    <button style={tabStyle('karargah')} onClick={() => setActiveTab('karargah')}>
                        <CheckCircle size={16} /> İmalata Devir
                    </button>
                    <button style={tabStyle('gecmis')} onClick={() => { setActiveTab('gecmis'); fazGecmisiniYukle(); }}>
                        <Database size={16} /> Faz Geçmişi
                    </button>
                </div>
            </div>

            <div className="page-content" style={{ padding: '0 24px 24px' }}>

                {/* ── SEKME 1: TREND İSTİHBARAT ── */}
                {activeTab === 'istihbarat' && (
                    <div className="card fade-in">
                        <div className="card-header">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Globe size={20} color={GOLD} /> Küresel Moda Ağı İstihbaratı
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>

                            <div style={{
                                padding: '14px 18px', borderRadius: '10px', marginBottom: '20px',
                                background: 'rgba(212,168,71,0.08)', border: `1px solid ${GOLD_BORDER}`,
                                display: 'flex', gap: '10px', alignItems: 'flex-start'
                            }}>
                                <AlertCircle size={18} color={GOLD} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                                    <strong style={{ color: GOLD }}>Kaşif Ajanı</strong> — Şu an temel analiz modunda çalışıyor. Gelişmiş piyasa araştırması için AI bağlantısı aktifleştirilecek.
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                                <h3 style={{ color: '#fff', marginBottom: '8px' }}>Kâşif&apos;e Konu Verin</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
                                    Renk, kumaş, model trend analizi için sorunuzu girin.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', maxWidth: '640px', margin: '0 auto 20px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Örn: 2026 İlkbahar oversize tişört trendleri ve pamuk maliyetleri..."
                                    value={trendQuery}
                                    onChange={e => setTrendQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleTrendSorgu()}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${EMERALD_BORDER}`, background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                />
                                <button
                                    onClick={handleTrendSorgu}
                                    disabled={trendLoading}
                                    style={{
                                        padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: trendLoading ? 'wait' : 'pointer',
                                        background: trendLoading ? 'rgba(4,120,87,0.3)' : `linear-gradient(135deg, ${EMERALD}, #059669)`,
                                        color: '#fff', fontWeight: '700', fontFamily: 'inherit', whiteSpace: 'nowrap'
                                    }}>
                                    {trendLoading ? '⏳ Analiz...' : '🔍 Araştır'}
                                </button>
                            </div>

                            {trendResult && (
                                <div style={{
                                    background: EMERALD_LIGHT, padding: '20px', borderRadius: '12px',
                                    border: `1px solid ${EMERALD_BORDER}`, color: '#e0e0e0',
                                    textAlign: 'left', maxWidth: '800px', margin: '0 auto'
                                }}>
                                    <h4 style={{ color: GOLD, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <TrendingUp size={18} /> Kâşif Raporu
                                    </h4>
                                    <div dangerouslySetInnerHTML={{ __html: trendResult.replace(/\n/g, '<br/>') }}
                                        style={{ lineHeight: '1.7', fontSize: '14px' }} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── SEKME 2: NUMUNE FAZ ── */}
                {activeTab === 'numune' && (
                    <div className="card fade-in">
                        <div className="card-header">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Scissors size={20} color={EMERALD} /> Numune (Zombi) Faz Yönetimi
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>

                            {/* Proje Adı */}
                            <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    📁 Proje / Koleksiyon Adı
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Örn: 2026 Yaz Koleksiyonu — Oversize Tişört"
                                    value={projeAdi}
                                    onChange={e => setProjeAdi(e.target.value)}
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: `1px solid ${EMERALD_BORDER}`, background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                />
                            </div>

                            {/* Faz Kartları */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                                {/* FAZ 1 */}
                                <div style={{
                                    background: faz1Aktif ? 'rgba(4,120,87,0.08)' : 'rgba(255,255,255,0.02)',
                                    border: `2px solid ${faz1Aktif ? EMERALD_BORDER : 'rgba(255,255,255,0.08)'}`,
                                    borderRadius: '14px', padding: '20px', position: 'relative',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {faz1Aktif && (
                                        <div style={{
                                            position: 'absolute', top: 14, right: 14,
                                            width: 10, height: 10, borderRadius: '50%', background: EMERALD,
                                            boxShadow: `0 0 8px ${EMERALD}`, animation: 'pulse 1.5s infinite'
                                        }} />
                                    )}
                                    <h4 style={{ color: faz1Aktif ? EMERALD : '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                        <Clock size={16} color={faz1Aktif ? EMERALD : GOLD} />
                                        1. Faz: Kalıp Çizimi
                                    </h4>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', lineHeight: '1.5' }}>
                                        Tasarımın kalıba dökülme süreci. Süre otomatik hesaplanır.
                                    </p>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: faz1Aktif ? EMERALD : 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
                                        {faz1Aktif ? '🟢 DEVAM EDİYOR' : '⚪ BEKLEMEDE'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleFaz(1, 'baslat')}
                                            disabled={faz1Aktif || fazYukleniyor || !projeAdi.trim()}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${EMERALD_BORDER}`,
                                                background: faz1Aktif ? 'rgba(255,255,255,0.05)' : EMERALD_LIGHT,
                                                color: faz1Aktif ? '#555' : EMERALD,
                                                cursor: faz1Aktif || !projeAdi.trim() ? 'not-allowed' : 'pointer',
                                                fontWeight: '700', fontFamily: 'inherit', fontSize: '13px', transition: 'all 0.2s'
                                            }}>
                                            ▶ Başlat
                                        </button>
                                        <button
                                            onClick={() => handleFaz(1, 'bitir')}
                                            disabled={!faz1Aktif || fazYukleniyor}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '8px',
                                                border: `1px solid ${!faz1Aktif ? 'rgba(255,255,255,0.08)' : 'rgba(231,76,60,0.4)'}`,
                                                background: !faz1Aktif ? 'rgba(255,255,255,0.03)' : 'rgba(231,76,60,0.1)',
                                                color: !faz1Aktif ? '#444' : '#e74c3c',
                                                cursor: !faz1Aktif ? 'not-allowed' : 'pointer',
                                                fontWeight: '700', fontFamily: 'inherit', fontSize: '13px', transition: 'all 0.2s'
                                            }}>
                                            ⏹ Bitir
                                        </button>
                                    </div>
                                </div>

                                {/* FAZ 2 */}
                                <div style={{
                                    background: faz2Aktif ? GOLD_LIGHT : 'rgba(255,255,255,0.02)',
                                    border: `2px solid ${faz2Aktif ? GOLD_BORDER : 'rgba(255,255,255,0.08)'}`,
                                    borderRadius: '14px', padding: '20px', position: 'relative',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {faz2Aktif && (
                                        <div style={{
                                            position: 'absolute', top: 14, right: 14,
                                            width: 10, height: 10, borderRadius: '50%', background: GOLD,
                                            boxShadow: `0 0 8px ${GOLD}`, animation: 'pulse 1.5s infinite'
                                        }} />
                                    )}
                                    <h4 style={{ color: faz2Aktif ? GOLD : '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                        <Scissors size={16} color={faz2Aktif ? GOLD : GOLD} />
                                        2. Faz: İlk Zombi Dikimi
                                    </h4>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', lineHeight: '1.5' }}>
                                        Kalıbın kumaşa dökülüp dikildiği ilk numune evresi.
                                    </p>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: faz2Aktif ? GOLD : 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
                                        {faz2Aktif ? '🟡 DEVAM EDİYOR' : '⚪ BEKLEMEDE'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleFaz(2, 'baslat')}
                                            disabled={faz2Aktif || fazYukleniyor || !projeAdi.trim()}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${GOLD_BORDER}`,
                                                background: faz2Aktif ? 'rgba(255,255,255,0.05)' : GOLD_LIGHT,
                                                color: faz2Aktif ? '#555' : GOLD,
                                                cursor: faz2Aktif || !projeAdi.trim() ? 'not-allowed' : 'pointer',
                                                fontWeight: '700', fontFamily: 'inherit', fontSize: '13px', transition: 'all 0.2s'
                                            }}>
                                            ▶ Başlat
                                        </button>
                                        <button
                                            onClick={() => handleFaz(2, 'bitir')}
                                            disabled={!faz2Aktif || fazYukleniyor}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '8px',
                                                border: `1px solid ${!faz2Aktif ? 'rgba(255,255,255,0.08)' : 'rgba(231,76,60,0.4)'}`,
                                                background: !faz2Aktif ? 'rgba(255,255,255,0.03)' : 'rgba(231,76,60,0.1)',
                                                color: !faz2Aktif ? '#444' : '#e74c3c',
                                                cursor: !faz2Aktif ? 'not-allowed' : 'pointer',
                                                fontWeight: '700', fontFamily: 'inherit', fontSize: '13px', transition: 'all 0.2s'
                                            }}>
                                            ⏹ Mühürle
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {!projeAdi.trim() && (
                                <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(212,168,71,0.08)', border: `1px solid ${GOLD_BORDER}`, fontSize: '12px', color: GOLD }}>
                                    ⚠️ Faz başlatmak için proje adını girin.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── SEKME 3: İMALATA DEVİR ── */}
                {activeTab === 'karargah' && (
                    <div className="card fade-in">
                        <div className="card-header">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={20} color={EMERALD} /> Karargah — İmalata Devir Onayı
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>

                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: EMERALD_LIGHT, border: `2px solid ${EMERALD_BORDER}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
                                }}>
                                    <CheckCircle size={40} color={EMERALD} />
                                </div>

                                <h3 style={{ color: '#fff', marginBottom: '10px' }}>Yönetim Onayı & İmalata Devir</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '28px', lineHeight: '1.6', fontSize: '14px' }}>
                                    AR-GE fazları tamamlandı, maliyetler doğrulandı. Model adını girerek
                                    <strong style={{ color: EMERALD }}> İmalat Modelleri</strong>&apos;ne aktarın.
                                </p>

                                <div style={{ width: '100%', marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textAlign: 'left', fontWeight: '600' }}>
                                        Model Adı
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Projeye / Modele İsim Verin..."
                                        value={modelAdi}
                                        onChange={e => setModelAdi(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${EMERALD_BORDER}`, background: 'rgba(0,0,0,0.2)', color: '#fff', textAlign: 'center', fontSize: '14px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                    <button
                                        onClick={() => { setModelAdi(''); addToast('warning', 'Dosya reddedildi, arşive kaldırıldı.'); }}
                                        style={{
                                            flex: 1, padding: '13px 20px', borderRadius: '10px',
                                            background: 'transparent', border: '1px solid rgba(231,76,60,0.4)',
                                            color: '#e74c3c', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
                                        }}>
                                        ✖ Reddet
                                    </button>
                                    <button
                                        onClick={handleImalataDevret}
                                        disabled={devrediliyor || !modelAdi.trim()}
                                        style={{
                                            flex: 2, padding: '13px 20px', borderRadius: '10px',
                                            background: devrediliyor ? 'rgba(4,120,87,0.3)' : `linear-gradient(135deg, ${EMERALD}, #059669)`,
                                            border: 'none', color: '#fff', fontWeight: '800',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            boxShadow: `0 4px 15px rgba(4,120,87,0.3)`, cursor: devrediliyor ? 'wait' : 'pointer',
                                            fontFamily: 'inherit', fontSize: '14px'
                                        }}>
                                        <CheckCircle size={18} />
                                        {devrediliyor ? 'Aktarılıyor...' : 'İmalata Devret'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SEKME 4: FAZ GEÇMİŞİ (DB) ── */}
                {activeTab === 'gecmis' && (
                    <div className="card fade-in">
                        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={20} color={GOLD} /> Numune Faz Geçmişi
                            </div>
                            <button
                                onClick={fazGecmisiniYukle}
                                style={{ padding: '6px 14px', background: EMERALD_LIGHT, border: `1px solid ${EMERALD_BORDER}`, borderRadius: '8px', color: EMERALD, cursor: 'pointer', fontWeight: '600', fontSize: '12px', fontFamily: 'inherit' }}>
                                🔄 Yenile
                            </button>
                        </div>
                        <div style={{ padding: '0 20px 20px' }}>
                            {gecmisYukleniyor ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>⏳ Yükleniyor...</div>
                            ) : fazGecmisi.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                                    <div style={{ fontWeight: '700', marginBottom: '8px' }}>Henüz faz kaydı yok</div>
                                    <div style={{ fontSize: '13px' }}>Numune sekmesinden ilk fazı başlatın.</div>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                                    <thead>
                                        <tr>
                                            {['Proje', 'Faz', 'Durum', 'Başlangıç', 'Süre'].map(h => (
                                                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fazGecmisi.map(f => (
                                            <tr key={f.id}>
                                                <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{f.proje_adi}</td>
                                                <td style={{ padding: '10px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{f.faz_adi}</td>
                                                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <span style={{
                                                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                                                        background: f.durum === 'tamamlandi' ? 'rgba(4,120,87,0.15)' : f.durum === 'devam' ? GOLD_LIGHT : 'rgba(255,255,255,0.05)',
                                                        color: f.durum === 'tamamlandi' ? EMERALD : f.durum === 'devam' ? GOLD : 'rgba(255,255,255,0.4)'
                                                    }}>
                                                        {f.durum === 'tamamlandi' ? '✅ Tamamlandı' : f.durum === 'devam' ? '🟡 Devam' : '⚪ Bekleme'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>
                                                    {f.baslangic_zamani ? new Date(f.baslangic_zamani).toLocaleString('tr-TR') : '—'}
                                                </td>
                                                <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: f.sure_dakika ? GOLD : 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    {formatSure(f.sure_dakika)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
