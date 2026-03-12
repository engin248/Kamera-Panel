'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, Lightbulb, Scissors, CheckCircle, Clock, Database, TrendingUp, AlertCircle, Search, ShoppingBag, Instagram, Target, BarChart3, Calendar, Factory, RefreshCw, ChevronRight } from 'lucide-react';

// ── Renk Sabitleri (Emerald & Gold — THE ORDER Standardı) ──
const EMERALD = '#047857';
const EMERALD_LIGHT = 'rgba(4,120,87,0.15)';
const EMERALD_BORDER = 'rgba(4,120,87,0.4)';
const GOLD = '#D4A847';
const GOLD_LIGHT = 'rgba(212,168,71,0.15)';
const GOLD_BORDER = 'rgba(212,168,71,0.4)';

// ── Ürün tipleri ──
const URUN_TIPLERI = [
    'Abiye Elbise', 'Gece Elbisesi', 'Nikah Elbisesi', 'Mezuniyet Elbisesi',
    'Kokteyl Elbise', 'Tesettür Abiye', 'Abiye Takım', 'Diğer'
];
const HEDEF_SEGMENTLER = ['Toptan (B2B)', 'Perakende (B2C)', 'İhracat', 'Karma'];
const SEZONLAR = ['Mart 2026', 'Nisan 2026', 'Mayıs 2026', 'Haziran 2026', 'Temmuz 2026', 'Ağustos 2026', 'Eylül 2026', 'Ekim 2026', 'Kasım 2026', 'Aralık 2026'];

// ── Sinyal kart bileşeni ──
function SinyalKart({ ikon, baslik, puan, yorum, ekstra }) {
    const renkSinif =
        puan >= 75 ? { bg: 'rgba(4,120,87,0.12)', border: 'rgba(4,120,87,0.4)', text: '#34d399', label: '🟢 GÜÇLÜ' } :
            puan >= 50 ? { bg: 'rgba(212,168,71,0.10)', border: 'rgba(212,168,71,0.4)', text: '#fbbf24', label: '🟡 ORTA' } :
                { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.3)', text: '#f87171', label: '🔴 ZAYIF' };
    return (
        <div style={{ background: renkSinif.bg, border: `1px solid ${renkSinif.border}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{ikon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{baslik}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: renkSinif.text }}>{puan}</span>
                    <span style={{ fontSize: '9px', color: renkSinif.text, fontWeight: '700' }}>{renkSinif.label}</span>
                </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${puan}%`, background: `linear-gradient(90deg, ${renkSinif.text}, ${renkSinif.text}88)`, borderRadius: '2px', transition: 'width 1s ease' }} />
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', margin: 0 }}>{yorum}</p>
            {ekstra && <div style={{ marginTop: '4px' }}>{ekstra}</div>}
        </div>
    );
}

// ── Kategori bloku ──
function KategoriBlok({ ikon, baslik, renk, sinyaller }) {
    const puanlar = Object.values(sinyaller).map(s => s?.puan || 0);
    const ortPuan = puanlar.length > 0 ? Math.round(puanlar.reduce((a, b) => a + b, 0) / puanlar.length) : 0;
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: `${renk}15`, borderBottom: `1px solid ${renk}30`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{ikon}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{baslik}</span>
                </div>
                <div style={{ padding: '4px 12px', borderRadius: '20px', background: `${renk}20`, border: `1px solid ${renk}40`, fontSize: '13px', fontWeight: '800', color: renk }}>
                    Ort: {ortPuan}/100
                </div>
            </div>
            <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {Object.entries(sinyaller).map(([key, sinyal]) => {
                    if (!sinyal) return null;
                    const ikonMap = {
                        signal1: '🛒', signal2: '📦', signal3: '⭐', signal4: '❤️',
                        signal5: '🎵', signal6: '📸', signal7: '📌',
                        signal8: '🕵️', signal9: '🤝',
                        signal11: '💍', signal12: '🎓', signal13: '🎆',
                        signal14: '🔄', signal15: '💰',
                    };
                    const baslikMap = {
                        signal1: 'Trendyol Satış Gücü',
                        signal2: 'Stok Tükenme Sinyali',
                        signal3: 'Yorum & Güven Yükü',
                        signal4: 'Favori Listesi Trafiği',
                        signal5: 'TikTok Viral Sinyali',
                        signal6: 'Instagram Etki Alanı',
                        signal7: 'Pinterest Trend Tahmini',
                        signal8: 'Rakip Frekans Analizi',
                        signal9: `B2B Toptan Talebi`,
                        signal11: 'Düğün Sezonu Puanı',
                        signal12: 'Mezuniyet Sezonu Puanı',
                        signal13: 'Yılbaşı Sezonu Puanı',
                        signal14: 'Tekrar Sipariş Müşterileri',
                        signal15: 'Kar Marjı Analizi',
                    };
                    const ekstra = sinyal.renkler ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {sinyal.renkler.map(r => (
                                <span key={r} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{r}</span>
                            ))}
                        </div>
                    ) : sinyal.viralHashtaglar ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {sinyal.viralHashtaglar.slice(0, 4).map(h => (
                                <span key={h} style={{ padding: '2px 8px', background: 'rgba(139,92,246,0.15)', borderRadius: '6px', fontSize: '10px', color: '#a78bfa' }}>{h}</span>
                            ))}
                        </div>
                    ) : null;
                    return (
                        <SinyalKart
                            key={key}
                            ikon={ikonMap[key] || '📊'}
                            baslik={baslikMap[key] || key}
                            puan={sinyal.puan || 0}
                            yorum={sinyal.yorum || ''}
                            ekstra={ekstra}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default function ArgeTasarimPage({ addToast }) {
    const [activeTab, setActiveTab] = useState('istihbarat');

    // ── Trend İstihbarat State ──
    const [urunTipi, setUrunTipi] = useState('Abiye Elbise');
    const [hedefSegment, setHedefSegment] = useState('Toptan (B2B)');
    const [sezon, setSezon] = useState('');
    const [trendLoading, setTrendLoading] = useState(false);
    const [trendSonuc, setTrendSonuc] = useState(null);
    const [trendHata, setTrendHata] = useState('');

    // ── Numune Faz State ──
    const [projeAdi, setProjeAdi] = useState('');
    const [faz1Aktif, setFaz1Aktif] = useState(false);
    const [faz2Aktif, setFaz2Aktif] = useState(false);
    const [fazYukleniyor, setFazYukleniyor] = useState(false);
    const [fazGecmisi, setFazGecmisi] = useState([]);
    const [gecmisYukleniyor, setGecmisYukleniyor] = useState(false);
    const [modelAdi, setModelAdi] = useState('');
    const [devrediliyor, setDevrediliyor] = useState(false);

    // ── Trend Analizi ──
    const handleTrendAnaliz = async () => {
        if (!urunTipi) { addToast('error', 'Ürün tipi seçin.'); return; }
        setTrendLoading(true);
        setTrendSonuc(null);
        setTrendHata('');
        try {
            const res = await fetch('/api/arge-trend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urunTipi, hedefSegment, sezon }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'API hatası');
            setTrendSonuc(data);
            addToast('success', `✅ ${urunTipi} için 15 sinyal analizi tamamlandı.`);
        } catch (err) {
            setTrendHata(err.message || 'Analiz başarısız.');
            addToast('error', 'Trend analizi başarısız oldu.');
        } finally {
            setTrendLoading(false);
        }
    };

    // ── Faz işlemleri ──
    const fazGecmisiniYukle = useCallback(async () => {
        setGecmisYukleniyor(true);
        try {
            const res = await fetch('/api/arge-faz');
            const data = await res.json();
            if (Array.isArray(data)) {
                setFazGecmisi(data);
                const aktifFazlar = data.filter(f => f.durum === 'devam');
                setFaz1Aktif(aktifFazlar.some(f => f.faz_no === 1));
                setFaz2Aktif(aktifFazlar.some(f => f.faz_no === 2));
                if (aktifFazlar.length > 0 && !projeAdi) setProjeAdi(aktifFazlar[0].proje_adi);
            }
        } catch { /* sessiz */ } finally { setGecmisYukleniyor(false); }
    }, [projeAdi]);

    useEffect(() => { fazGecmisiniYukle(); }, []);

    const handleFaz = async (fazNo, islem) => {
        if (!projeAdi.trim()) { addToast('error', 'Önce proje adı girin.'); return; }
        setFazYukleniyor(true);
        try {
            const res = await fetch('/api/arge-faz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ islem, proje_adi: projeAdi.trim(), faz_no: fazNo }),
            });
            const data = await res.json();
            if (!res.ok || data.error) { addToast('error', data.error || 'İşlem başarısız.'); return; }
            if (islem === 'baslat') {
                if (fazNo === 1) setFaz1Aktif(true); else setFaz2Aktif(true);
                addToast('success', `${fazNo}. Faz başlatıldı — Kronometre çalışıyor 🟢`);
            } else {
                if (fazNo === 1) setFaz1Aktif(false); else setFaz2Aktif(false);
                addToast('success', `${fazNo}. Faz tamamlandı — Süre: ${data.sure_dakika} dk ✅`);
            }
            await fazGecmisiniYukle();
        } catch { addToast('error', 'Sunucu bağlantısı kesildi.'); } finally { setFazYukleniyor(false); }
    };

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
                    description: `AR-GE modülünden devredildi. Proje: ${projeAdi || modelAdi}`,
                }),
            });
            if (!res.ok) throw new Error();
            addToast('success', `"${modelAdi}" başarıyla İmalat Modellerine aktarıldı ✅`);
            setModelAdi('');
        } catch { addToast('error', 'Devir işlemi başarısız.'); } finally { setDevrediliyor(false); }
    };

    const formatSure = (dk) => {
        if (!dk) return '—';
        return dk < 60 ? `${dk} dk` : `${Math.floor(dk / 60)} sa ${dk % 60} dk`;
    };

    const tabStyle = (id) => ({
        padding: '10px 18px', borderRadius: '10px',
        background: activeTab === id ? EMERALD_LIGHT : 'transparent',
        border: `1px solid ${activeTab === id ? EMERALD_BORDER : 'transparent'}`,
        color: activeTab === id ? EMERALD : 'rgba(255,255,255,0.5)',
        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
        fontWeight: activeTab === id ? '700' : '400',
        transition: 'all 0.2s', fontFamily: 'inherit', fontSize: '13px', whiteSpace: 'nowrap',
    });

    return (
        <div className="page-container fade-in">

            {/* ── HEADER ── */}
            <div className="page-header" style={{ background: `linear-gradient(135deg, ${EMERALD_LIGHT}, ${GOLD_LIGHT})`, borderBottom: `1px solid ${EMERALD_BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: EMERALD_LIGHT, color: EMERALD, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${EMERALD_BORDER}` }}>
                        <Globe size={26} />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ color: '#fff', fontSize: '24px', letterSpacing: '0.5px' }}>AR-GE ve Siber İstihbarat</h1>
                        <p className="page-subtitle" style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                            15 Sinyal · 5 Kategori · Piyasa Kararı · Numune Faz Takibi
                        </p>
                    </div>
                </div>
            </div>

            {/* ── SEKMELER ── */}
            <div style={{ padding: '0 24px', marginTop: '-14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button style={tabStyle('istihbarat')} onClick={() => setActiveTab('istihbarat')}><Lightbulb size={16} /> Trend İstihbarat</button>
                    <button style={tabStyle('numune')} onClick={() => setActiveTab('numune')}><Scissors size={16} /> Numune Faz</button>
                    <button style={tabStyle('karargah')} onClick={() => setActiveTab('karargah')}><CheckCircle size={16} /> İmalata Devir</button>
                    <button style={tabStyle('gecmis')} onClick={() => { setActiveTab('gecmis'); fazGecmisiniYukle(); }}><Database size={16} /> Faz Geçmişi</button>
                </div>
            </div>

            <div className="page-content" style={{ padding: '0 24px 24px' }}>

                {/* ══════════════════════════════════════════════ */}
                {/* SEKME 1: TREND İSTİHBARAT — TAM YENİ TASARIM */}
                {/* ══════════════════════════════════════════════ */}
                {activeTab === 'istihbarat' && (
                    <div className="fade-in">

                        {/* ── GİRİŞ PANELİ ── */}
                        <div className="card" style={{ marginBottom: '20px' }}>
                            <div className="card-header">
                                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Search size={20} color={GOLD} /> Piyasa İstihbarat Parametreleri
                                </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>

                                    {/* Ürün Tipi */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            🏷️ Ürün Tipi
                                        </label>
                                        <select
                                            value={urunTipi}
                                            onChange={e => setUrunTipi(e.target.value)}
                                            className="form-input"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${EMERALD_BORDER}`, background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                                        >
                                            {URUN_TIPLERI.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    {/* Hedef Segment */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            🎯 Hedef Segment
                                        </label>
                                        <select
                                            value={hedefSegment}
                                            onChange={e => setHedefSegment(e.target.value)}
                                            className="form-input"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${GOLD_BORDER}`, background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                                        >
                                            {HEDEF_SEGMENTLER.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    {/* Sezon */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            📅 Hedef Sezon
                                        </label>
                                        <select
                                            value={sezon}
                                            onChange={e => setSezon(e.target.value)}
                                            className="form-input"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                                        >
                                            <option value="">Otomatik (Bu Ay)</option>
                                            {SEZONLAR.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Analiz Butonu */}
                                <button
                                    onClick={handleTrendAnaliz}
                                    disabled={trendLoading}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                                        background: trendLoading ? 'rgba(4,120,87,0.3)' : `linear-gradient(135deg, ${EMERALD}, #059669)`,
                                        color: '#fff', fontWeight: '800', fontFamily: 'inherit', fontSize: '15px',
                                        cursor: trendLoading ? 'wait' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        boxShadow: trendLoading ? 'none' : `0 4px 20px rgba(4,120,87,0.4)`,
                                        transition: 'all 0.3s',
                                    }}
                                >
                                    {trendLoading ? (
                                        <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> 15 Sinyal Analiz Ediliyor...</>
                                    ) : (
                                        <><Search size={18} /> 15 Sinyal ile Piyasa Analizi Başlat</>
                                    )}
                                </button>

                                {/* Sinyal listesi özeti */}
                                <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {['🛒 Trendyol Satış', '📦 Stok Tükenme', '⭐ Yorum Yükü', '❤️ Favori', '🎵 TikTok', '📸 Instagram', '📌 Pinterest', '🕵️ Rakip', '🤝 B2B Talep', '💍 Düğün', '🎓 Mezuniyet', '🎆 Yılbaşı', '🔄 Tekrar Sipariş', '💰 Kar Marjı'].map((s, i) => (
                                        <span key={i} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{s}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── HATA ── */}
                        {trendHata && (
                            <div style={{ padding: '14px 18px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', display: 'flex', gap: '10px' }}>
                                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                <span>{trendHata}</span>
                            </div>
                        )}

                        {/* ── SONUÇ PANELİ ── */}
                        {trendSonuc && (
                            <div className="fade-in">

                                {/* ── KARAR BANNER ── */}
                                <div style={{
                                    padding: '24px', borderRadius: '16px', marginBottom: '20px',
                                    background: `linear-gradient(135deg, ${trendSonuc.kararRenk}20, ${trendSonuc.kararRenk}08)`,
                                    border: `2px solid ${trendSonuc.kararRenk}50`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                                            {trendSonuc.urunTipi} · {trendSonuc.hedefSegment} · {trendSonuc.sezon}
                                        </div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', color: trendSonuc.kararRenk, letterSpacing: '1px' }}>
                                            {trendSonuc.karar}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '6px', maxWidth: '500px' }}>
                                            {trendSonuc.kararAciklama}
                                        </div>
                                    </div>

                                    {/* ── GENEL SKOR HALKA ── */}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            width: '90px', height: '90px', borderRadius: '50%',
                                            background: `conic-gradient(${trendSonuc.kararRenk} ${trendSonuc.genelSkor * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: `0 0 20px ${trendSonuc.kararRenk}40`,
                                        }}>
                                            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#0f1f18', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '22px', fontWeight: '900', color: trendSonuc.kararRenk }}>{trendSonuc.genelSkor}</span>
                                                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>/ 100</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>Genel Skor</div>
                                    </div>
                                </div>

                                {/* ── ÖNERİLER SATIRI ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    {/* Renkler */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: GOLD, marginBottom: '10px' }}>🎨 Önerilen Renkler</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {(trendSonuc.oneriler?.renkler || []).map(r => (
                                                <span key={r} style={{ padding: '4px 12px', background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: '20px', fontSize: '12px', color: GOLD }}>{r}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Stiller */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: EMERALD, marginBottom: '10px' }}>✂️ Önerilen Stiller</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {(trendSonuc.oneriler?.stiller || []).map(s => (
                                                <span key={s} style={{ padding: '4px 12px', background: `${EMERALD}15`, border: `1px solid ${EMERALD}40`, borderRadius: '20px', fontSize: '12px', color: EMERALD }}>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── 5 KATEGORİ BLOKLARI ── */}
                                {trendSonuc.kategoriler && Object.entries(trendSonuc.kategoriler).map(([key, kat]) => (
                                    <KategoriBlok
                                        key={key}
                                        ikon={kat.ikon}
                                        baslik={kat.baslik}
                                        renk={kat.renk}
                                        sinyaller={kat.sinyaller}
                                    />
                                ))}

                                {/* ── YENİ ANALİZ BUTONU ── */}
                                <button
                                    onClick={() => setTrendSonuc(null)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${EMERALD_BORDER}`, background: 'transparent', color: EMERALD, fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px' }}
                                >
                                    🔄 Yeni Ürün Analizi Yap
                                </button>
                            </div>
                        )}
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {/* FAZ 1 */}
                                <div style={{ background: faz1Aktif ? 'rgba(4,120,87,0.08)' : 'rgba(255,255,255,0.02)', border: `2px solid ${faz1Aktif ? EMERALD_BORDER : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '20px', position: 'relative', transition: 'all 0.3s' }}>
                                    {faz1Aktif && <div style={{ position: 'absolute', top: 14, right: 14, width: 10, height: 10, borderRadius: '50%', background: EMERALD, boxShadow: `0 0 8px ${EMERALD}`, animation: 'pulse 1.5s infinite' }} />}
                                    <h4 style={{ color: faz1Aktif ? EMERALD : '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                        <Clock size={16} color={faz1Aktif ? EMERALD : GOLD} /> 1. Faz: Kalıp Çizimi
                                    </h4>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Tasarımın kalıba dökülme süreci. Süre otomatik hesaplanır.</p>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: faz1Aktif ? EMERALD : 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>{faz1Aktif ? '🟢 DEVAM EDİYOR' : '⚪ BEKLEMEDE'}</div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleFaz(1, 'baslat')} disabled={faz1Aktif || fazYukleniyor || !projeAdi.trim()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${EMERALD_BORDER}`, background: faz1Aktif ? 'rgba(255,255,255,0.05)' : EMERALD_LIGHT, color: faz1Aktif ? '#555' : EMERALD, cursor: faz1Aktif || !projeAdi.trim() ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: 'inherit', fontSize: '13px' }}>▶ Başlat</button>
                                        <button onClick={() => handleFaz(1, 'bitir')} disabled={!faz1Aktif || fazYukleniyor} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${!faz1Aktif ? 'rgba(255,255,255,0.08)' : 'rgba(231,76,60,0.4)'}`, background: !faz1Aktif ? 'rgba(255,255,255,0.03)' : 'rgba(231,76,60,0.1)', color: !faz1Aktif ? '#444' : '#e74c3c', cursor: !faz1Aktif ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: 'inherit', fontSize: '13px' }}>⏹ Bitir</button>
                                    </div>
                                </div>
                                {/* FAZ 2 */}
                                <div style={{ background: faz2Aktif ? GOLD_LIGHT : 'rgba(255,255,255,0.02)', border: `2px solid ${faz2Aktif ? GOLD_BORDER : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '20px', position: 'relative', transition: 'all 0.3s' }}>
                                    {faz2Aktif && <div style={{ position: 'absolute', top: 14, right: 14, width: 10, height: 10, borderRadius: '50%', background: GOLD, boxShadow: `0 0 8px ${GOLD}`, animation: 'pulse 1.5s infinite' }} />}
                                    <h4 style={{ color: faz2Aktif ? GOLD : '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                        <Scissors size={16} color={GOLD} /> 2. Faz: İlk Zombi Dikimi
                                    </h4>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Kalıbın kumaşa dökülüp dikildiği ilk numune evresi.</p>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: faz2Aktif ? GOLD : 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>{faz2Aktif ? '🟡 DEVAM EDİYOR' : '⚪ BEKLEMEDE'}</div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleFaz(2, 'baslat')} disabled={faz2Aktif || fazYukleniyor || !projeAdi.trim()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${GOLD_BORDER}`, background: faz2Aktif ? 'rgba(255,255,255,0.05)' : GOLD_LIGHT, color: faz2Aktif ? '#555' : GOLD, cursor: faz2Aktif || !projeAdi.trim() ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: 'inherit', fontSize: '13px' }}>▶ Başlat</button>
                                        <button onClick={() => handleFaz(2, 'bitir')} disabled={!faz2Aktif || fazYukleniyor} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${!faz2Aktif ? 'rgba(255,255,255,0.08)' : 'rgba(231,76,60,0.4)'}`, background: !faz2Aktif ? 'rgba(255,255,255,0.03)' : 'rgba(231,76,60,0.1)', color: !faz2Aktif ? '#444' : '#e74c3c', cursor: !faz2Aktif ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: 'inherit', fontSize: '13px' }}>⏹ Mühürle</button>
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
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: EMERALD_LIGHT, border: `2px solid ${EMERALD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <CheckCircle size={40} color={EMERALD} />
                                </div>
                                <h3 style={{ color: '#fff', marginBottom: '10px' }}>Yönetim Onayı & İmalata Devir</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '28px', lineHeight: '1.6', fontSize: '14px' }}>
                                    AR-GE fazları tamamlandı, maliyetler doğrulandı. Model adını girerek <strong style={{ color: EMERALD }}>İmalat Modelleri</strong>&apos;ne aktarın.
                                </p>
                                <div style={{ width: '100%', marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textAlign: 'left', fontWeight: '600' }}>Model Adı</label>
                                    <input type="text" className="form-input" placeholder="Modele İsim Verin..." value={modelAdi} onChange={e => setModelAdi(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${EMERALD_BORDER}`, background: 'rgba(0,0,0,0.2)', color: '#fff', textAlign: 'center', fontSize: '14px' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                    <button onClick={() => { setModelAdi(''); addToast('warning', 'Dosya reddedildi, arşive kaldırıldı.'); }}
                                        style={{ flex: 1, padding: '13px 20px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(231,76,60,0.4)', color: '#e74c3c', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        ✖ Reddet
                                    </button>
                                    <button onClick={handleImalataDevret} disabled={devrediliyor || !modelAdi.trim()}
                                        style={{ flex: 2, padding: '13px 20px', borderRadius: '10px', background: devrediliyor ? 'rgba(4,120,87,0.3)' : `linear-gradient(135deg, ${EMERALD}, #059669)`, border: 'none', color: '#fff', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: devrediliyor ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>
                                        <CheckCircle size={18} /> {devrediliyor ? 'Aktarılıyor...' : 'İmalata Devret'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SEKME 4: FAZ GEÇMİŞİ ── */}
                {activeTab === 'gecmis' && (
                    <div className="card fade-in">
                        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={20} color={GOLD} /> Numune Faz Geçmişi
                            </div>
                            <button onClick={fazGecmisiniYukle} style={{ padding: '6px 14px', background: EMERALD_LIGHT, border: `1px solid ${EMERALD_BORDER}`, borderRadius: '8px', color: EMERALD, cursor: 'pointer', fontWeight: '600', fontSize: '12px', fontFamily: 'inherit' }}>
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
                                                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: f.durum === 'tamamlandi' ? 'rgba(4,120,87,0.15)' : f.durum === 'devam' ? GOLD_LIGHT : 'rgba(255,255,255,0.05)', color: f.durum === 'tamamlandi' ? EMERALD : f.durum === 'devam' ? GOLD : 'rgba(255,255,255,0.4)' }}>
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
