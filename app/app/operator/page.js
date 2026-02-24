'use client';

import { useState, useEffect, useCallback } from 'react';
import { t, setLanguage, getLanguage } from '@/lib/i18n';

// ========================================
// OPERATÖR TABLET GÖRÜNÜMÜ
// Makine başında tablet ekranından kullanılacak
// ========================================

export default function OperatorPage() {
    const [lang, setLang] = useState('tr');
    const [step, setStep] = useState('login'); // login | select | prepare | confirm | working | paused | done
    const [operators, setOperators] = useState([]);
    const [models, setModels] = useState([]);
    const [operations, setOperations] = useState([]);
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedOperation, setSelectedOperation] = useState(null);

    // Üretim state
    const [startTime, setStartTime] = useState(null);
    const [pauseStart, setPauseStart] = useState(null);
    const [pauseReason, setPauseReason] = useState('');
    const [producedCount, setProducedCount] = useState(0);
    const [defectiveCount, setDefectiveCount] = useState(0);
    const [defectReason, setDefectReason] = useState('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [checkCounter, setCheckCounter] = useState(0);
    const [qualityCheckNum, setQualityCheckNum] = useState(0);
    const [showQualityCheck, setShowQualityCheck] = useState(false);
    const [qualityResult, setQualityResult] = useState(null);
    const [lotChange, setLotChange] = useState('');
    const [productionLogId, setProductionLogId] = useState(null);

    // AYRI SÜRE TAKİBİ: mola / arıza / malzeme bekleme
    const [breakMs, setBreakMs] = useState(0);
    const [machineDownMs, setMachineDownMs] = useState(0);
    const [materialWaitMs, setMaterialWaitMs] = useState(0);

    // KAMERA: fotoğraf çekme
    const [showCamera, setShowCamera] = useState(false);
    const [cameraTarget, setCameraTarget] = useState(''); // 'quality_check' | 'first_product'
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [firstProductPhoto, setFirstProductPhoto] = useState(null);

    const totalPauseMs = breakMs + machineDownMs + materialWaitMs;

    // Veri yükleme
    useEffect(() => {
        fetch('/api/personnel').then(r => r.json()).then(d => setOperators(Array.isArray(d) ? d.filter(p => p.status === 'active') : []));
        fetch('/api/models').then(r => r.json()).then(d => setModels(Array.isArray(d) ? d : []));
    }, []);

    // Zamanlayıcı
    useEffect(() => {
        if (step === 'working' && startTime) {
            const timer = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - startTime - totalPauseMs) / 1000);
                setElapsedSeconds(elapsed);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step, startTime, totalPauseMs]);

    const loadOperations = async (modelId) => {
        const res = await fetch(`/api/models/${modelId}/operations`);
        const ops = await res.json();
        setOperations(Array.isArray(ops) ? ops : []);
    };

    const formatTime = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const unitTime = producedCount > 0 ? (elapsedSeconds / producedCount).toFixed(1) : '—';

    // Üretim başlat
    const startProduction = () => {
        setStartTime(Date.now());
        setStep('working');
        setProducedCount(0);
        setDefectiveCount(0);
        setBreakMs(0);
        setMachineDownMs(0);
        setMaterialWaitMs(0);
        setCheckCounter(0);
        setQualityCheckNum(0);
    };

    // Mola / duruş — AYRI SÜRE TAKİBİ
    const togglePause = (reason) => {
        if (step === 'working') {
            setPauseStart(Date.now());
            setPauseReason(reason);
            setStep('paused');
        } else if (step === 'paused') {
            const dur = Date.now() - pauseStart;
            if (pauseReason === 'Mola') setBreakMs(prev => prev + dur);
            else if (pauseReason === 'Arıza') setMachineDownMs(prev => prev + dur);
            else if (pauseReason === 'Bekleme') setMaterialWaitMs(prev => prev + dur);
            setPauseStart(null);
            setStep('working');
        }
    };

    // Adet artır
    const incrementCount = () => {
        const newCount = producedCount + 1;
        setProducedCount(newCount);
        const newCheck = checkCounter + 1;
        setCheckCounter(newCheck);
        if (newCheck >= 20) {
            setShowQualityCheck(true);
            setCheckCounter(0);
            setQualityCheckNum(prev => prev + 1);
        }
    };

    // ARA KONTROL SONUCUNU DB'YE KAYDET
    const saveQualityCheck = async (result, photoUrl) => {
        try {
            await fetch('/api/quality-checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    production_log_id: productionLogId,
                    model_id: selectedModel.id,
                    operation_id: selectedOperation.id,
                    personnel_id: selectedOperator.id,
                    check_type: 'inline',
                    check_number: qualityCheckNum,
                    result: result,
                    photo_path: photoUrl || null,
                    checked_by: selectedOperator.name,
                    notes: result === 'red' ? 'Düzeltilmeli' : 'Uygun'
                })
            });
        } catch (err) { console.error('Kalite kontrol kaydı hatası:', err); }
    };

    // FOTOĞRAF ÇEKME (tablet kamera)
    const openCamera = (target) => {
        setCameraTarget(target);
        setCapturedPhoto(null);
        setShowCamera(true);
    };

    const captureFromInput = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setCapturedPhoto(url);
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'photos');
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) {
                setCapturedPhoto(data.url);
                if (cameraTarget === 'first_product') setFirstProductPhoto(data.url);
            }
        } catch (err) { console.error('Upload hatası:', err); }
    };

    // Üretimi bitir — AYRI SÜRE KAYDI
    const finishProduction = async () => {
        if (!confirm('Üretimi bitirmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch('/api/production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_id: selectedModel.id,
                    operation_id: selectedOperation.id,
                    personnel_id: selectedOperator.id,
                    start_time: new Date(startTime).toISOString(),
                    end_time: new Date().toISOString(),
                    total_produced: producedCount,
                    defective_count: defectiveCount,
                    defect_reason: defectReason,
                    break_duration_min: Math.round(breakMs / 60000 * 10) / 10,
                    machine_down_min: Math.round(machineDownMs / 60000 * 10) / 10,
                    material_wait_min: Math.round(materialWaitMs / 60000 * 10) / 10,
                    lot_change: lotChange,
                    status: 'completed'
                })
            });
            const data = await res.json();
            if (data.id) setProductionLogId(data.id);
            setStep('done');
        } catch (err) {
            alert('Kayıt hatası: ' + err.message);
        }
    };

    // ===== EKRAN: GİRİŞ (Operatör Seçimi) =====
    if (step === 'login') {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏭</div>
                <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>{t('operator.login')}</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '30px' }}>{t('operator.select_name')}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', width: '100%', maxWidth: '700px' }}>
                    {operators.map(op => (
                        <button key={op.id} onClick={() => {
                            setSelectedOperator(op);
                            // Operatörün diline göre arayüz dilini değiştir
                            const opLang = op.language || 'tr';
                            setLanguage(opLang);
                            setLang(opLang);
                            setStep('select');
                        }}
                            style={{ padding: '20px 16px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit', backdropFilter: 'blur(10px)', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
                            {op.name}
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{op.role} {op.language === 'ar' ? '🇸🇦' : '🇹🇷'}</div>
                        </button>
                    ))}
                </div>

                <a href="/" style={{ marginTop: '30px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', textDecoration: 'none' }}>← Yönetici Paneline Dön</a>
            </div>
        );
    }

    // ===== EKRAN: MODEL & İŞLEM SEÇİMİ =====
    if (step === 'select') {
        // Günlük performans özeti
        const [dailyStats, setDailyStats] = useState(null);
        useEffect(() => {
            if (selectedOperator?.id) {
                const today = new Date().toISOString().split('T')[0];
                fetch(`/api/production?date=${today}&personnel_id=${selectedOperator.id}`)
                    .then(r => r.json())
                    .then(logs => {
                        if (Array.isArray(logs) && logs.length > 0) {
                            const produced = logs.reduce((s, l) => s + (l.total_produced || 0), 0);
                            const defective = logs.reduce((s, l) => s + (l.defective_count || 0), 0);
                            const value = logs.reduce((s, l) => s + ((l.total_produced || 0) * (l.unit_price || 0)), 0);
                            const totalMin = logs.reduce((s, l) => {
                                if (!l.start_time || !l.end_time) return s;
                                return s + (new Date(l.end_time) - new Date(l.start_time)) / 60000;
                            }, 0);
                            setDailyStats({ produced, defective, value, totalMin: Math.round(totalMin), records: logs.length });
                        }
                    }).catch(() => { });
            }
        }, [selectedOperator]);

        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <button onClick={() => { setStep('login'); setSelectedOperator(null); setLanguage('tr'); setLang('tr'); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>← {t('common.back')}</button>
                        <div>
                            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: 0 }}>Merhaba, {selectedOperator?.name} 👋</h1>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>{t('operator.select_model')}</p>
                        </div>
                    </div>

                    {/* GÜNLÜK PERFORMANS ÖZETİ */}
                    {dailyStats && (
                        <div style={{ background: 'rgba(46,204,113,0.08)', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', border: '1px solid rgba(46,204,113,0.2)' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#2ecc71', marginBottom: '10px' }}>📊 {t('operator.producing', 'Bugünkü Performansınız')}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>{dailyStats.produced}</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{t('operator.produced')}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: dailyStats.defective > 0 ? '#e74c3c' : '#2ecc71' }}>{dailyStats.produced > 0 ? Math.round((1 - dailyStats.defective / dailyStats.produced) * 100) : 100}%</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Kalite</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#3498db' }}>{dailyStats.totalMin} {t('common.minutes')}</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{t('operator.elapsed')}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#f39c12' }}>{dailyStats.value.toFixed(0)} ₺</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Değer</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!selectedModel ? (
                        <div>
                            <h2 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>📦 Model Seçin</h2>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {models.filter(m => m.status === 'uretimde' || m.status === 'prototip').map(model => (
                                    <button key={model.id} onClick={() => { setSelectedModel(model); loadOperations(model.id); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.3s' }}>
                                        <div style={{ fontSize: '28px' }}>👗</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '16px', fontWeight: '700' }}>{model.name}</div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Kod: {model.code} · {model.operation_count || 0} işlem</div>
                                        </div>
                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: model.status === 'uretimde' ? 'rgba(46,204,113,0.2)' : 'rgba(52,152,219,0.2)', color: model.status === 'uretimde' ? '#2ecc71' : '#3498db' }}>
                                            {model.status === 'uretimde' ? '🟢 Üretimde' : '🔵 Prototip'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h2 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: '600', margin: 0 }}>⚙️ İşlem Seçin — {selectedModel.name}</h2>
                                <button onClick={() => { setSelectedModel(null); setOperations([]); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Modeli Değiştir</button>
                            </div>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {operations.map(op => (
                                    <button key={op.id} onClick={() => { setSelectedOperation(op); setStep('prepare'); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.3s' }}>
                                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#3498db', minWidth: '35px', textAlign: 'center' }}>{op.order_number}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '700' }}>{op.name}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                                                {op.machine_type && `Makine: ${op.machine_type}`}
                                                {op.difficulty && ` · Zorluk: ${op.difficulty}/10`}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {op.video_path && <span title="Video var">🎬</span>}
                                            {op.audio_path && <span title="Ses var">🔊</span>}
                                            {op.how_to_do && <span title="Talimat var">📝</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ===== EKRAN: HAZIRLANIYOR (Video İzle, Ses Dinle, Talimatı Oku, Karşılaştır) =====
    if (step === 'prepare') {
        const op = selectedOperation;
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <button onClick={() => setStep('select')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>← Geri</button>
                        <div>
                            <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 }}>📋 İşleme Hazırlanın</h1>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>{op.name} — {selectedModel.name}</p>
                        </div>
                    </div>

                    {/* ADIMLAR */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* Adım 1: Video İzle */}
                        {op.video_path && (
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', background: 'rgba(52,152,219,0.15)', color: '#3498db', fontSize: '14px', fontWeight: '700' }}>📹 Adım 1: İşlem Videosunu İzleyin</div>
                                <div style={{ padding: '12px' }}>
                                    <video controls style={{ width: '100%', borderRadius: '10px', maxHeight: '350px', background: '#000' }}>
                                        <source src={op.video_path} />
                                    </video>
                                </div>
                            </div>
                        )}

                        {/* Adım 2: Ses Dinle */}
                        {op.audio_path && (
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', background: 'rgba(155,89,182,0.15)', color: '#9b59b6', fontSize: '14px', fontWeight: '700' }}>🔊 Adım 2: Sesli Anlatımı Dinleyin</div>
                                <div style={{ padding: '12px 18px' }}>
                                    <audio controls style={{ width: '100%' }}><source src={op.audio_path} /></audio>
                                </div>
                            </div>
                        )}

                        {/* Adım 3: Yazılı Talimat */}
                        {op.how_to_do && (
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', background: 'rgba(46,204,113,0.15)', color: '#2ecc71', fontSize: '14px', fontWeight: '700' }}>📝 Adım 3: Yazılı Talimatı Okuyun</div>
                                <div style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{op.how_to_do}</div>
                            </div>
                        )}

                        {/* Adım 4: Doğru/Yanlış Fotoğrafları İncele */}
                        {(op.correct_photo_path || op.incorrect_photo_path) && (
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', background: 'rgba(243,156,18,0.15)', color: '#f39c12', fontSize: '14px', fontWeight: '700' }}>📸 Adım 4: Doğru ve Yanlış Örnekleri İnceleyin</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px' }}>
                                    {op.correct_photo_path && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#2ecc71', marginBottom: '8px' }}>✅ DOĞRU Yapılmış</div>
                                            <img src={op.correct_photo_path} alt="Doğru" style={{ width: '100%', borderRadius: '8px', border: '2px solid #2ecc71' }} />
                                        </div>
                                    )}
                                    {op.incorrect_photo_path && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#e74c3c', marginBottom: '8px' }}>❌ YANLIŞ Yapılmış</div>
                                            <img src={op.incorrect_photo_path} alt="Yanlış" style={{ width: '100%', borderRadius: '8px', border: '2px solid #e74c3c' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Makine & Malzeme Bilgileri */}
                        {(op.machine_type || op.thread_material || op.needle_type) && (
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)', padding: '14px 18px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>⚙️ Makine & Malzeme Bilgileri</div>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                                    {op.machine_type && <div>🔧 <strong>Makine:</strong> {op.machine_type}</div>}
                                    {op.thread_material && <div>🧵 <strong>İplik:</strong> {op.thread_material}</div>}
                                    {op.needle_type && <div>🪡 <strong>İğne:</strong> {op.needle_type}</div>}
                                    {op.stitch_per_cm && <div>📏 <strong>Adım:</strong> {op.stitch_per_cm} vuruş/cm</div>}
                                </div>
                            </div>
                        )}

                        {/* HAZIR — Üretime Başla Butonu */}
                        <button onClick={() => setStep('confirm')}
                            style={{ padding: '20px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: '#fff', fontSize: '18px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '1px', boxShadow: '0 8px 24px rgba(46,204,113,0.3)' }}>
                            ✅ İnceledim, İlk Ürünü Hazırladım → Onaya Gönder
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ===== EKRAN: ONAY BEKLİYOR (+ İlk Ürün Fotoğrafı) =====
    if (step === 'confirm') {
        const sendApprovalRequest = async () => {
            try {
                await fetch('/api/approvals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        personnel_id: selectedOperator.id,
                        model_id: selectedModel.id,
                        operation_id: selectedOperation.id,
                        photo_path: firstProductPhoto
                    })
                });
                alert(t('operator.waiting_approval', 'Onay talebi gönderildi. Yönetici onayı bekleniyor...'));
            } catch (err) { console.error(err); }
        };

        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: '550px', textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📸</div>
                    <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>{t('operator.prepare', 'İlk Ürün Fotoğrafı & Onay')}</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '20px' }}>
                        {t('operator.compare_photos', 'İlk ürününüzün fotoğrafını çekin, prototiple karşılaştırın, sonra onaya gönderin.')}
                    </p>

                    {/* Fotoğraf çek */}
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '2px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', fontWeight: '600' }}>📷 {t('operator.ready', 'İlk Ürün Fotoğrafı')}</div>
                        {firstProductPhoto ? (
                            <div>
                                <img src={firstProductPhoto} alt="İlk ürün" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #3498db', marginBottom: '8px' }} />
                                <button onClick={() => setFirstProductPhoto(null)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>🔄 {t('common.back', 'Tekrar Çek')}</button>
                            </div>
                        ) : (
                            <label style={{ display: 'block', padding: '30px', border: '2px dashed rgba(52,152,219,0.4)', borderRadius: '12px', cursor: 'pointer', color: '#3498db', fontSize: '14px', fontWeight: '606' }}>
                                📷 {t('operator.ready', 'Fotoğraf Çek / Seç')}
                                <input type="file" accept="image/*" capture="environment" onChange={captureFromInput} onClick={() => setCameraTarget('first_product')} style={{ display: 'none' }} />
                            </label>
                        )}
                    </div>

                    {/* Karşılaştırma: Prototip vs Yapılan */}
                    {firstProductPhoto && selectedOperation?.correct_photo_path && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#2ecc71', fontWeight: '700', marginBottom: '6px' }}>✅ {t('operator.correct_example')}</div>
                                <img src={selectedOperation.correct_photo_path} alt="Referans" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '6px' }} />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#3498db', fontWeight: '700', marginBottom: '6px' }}>🔵 Yapılan Ürün</div>
                                <img src={firstProductPhoto} alt="Yapılan" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '6px' }} />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => setStep('prepare')} style={{ padding: '12px 24px', borderRadius: '10px', border: '2px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>← {t('common.back')}</button>
                            <button onClick={() => { sendApprovalRequest(); }} disabled={!firstProductPhoto}
                                style={{ padding: '12px 32px', borderRadius: '10px', border: 'none', background: firstProductPhoto ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'rgba(255,255,255,0.1)', color: firstProductPhoto ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '14px', fontWeight: '700', cursor: firstProductPhoto ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                                📤 Onaya Gönder
                            </button>
                        </div>
                        <button onClick={startProduction} disabled={!firstProductPhoto}
                            style={{ padding: '12px 32px', borderRadius: '10px', border: 'none', background: firstProductPhoto ? 'linear-gradient(135deg, #2ecc71, #27ae60)' : 'rgba(255,255,255,0.1)', color: firstProductPhoto ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '16px', fontWeight: '700', cursor: firstProductPhoto ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                            ✅ {t('operator.approved_start')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ===== EKRAN: ÜRETİMDE / MOLA =====
    if (step === 'working' || step === 'paused') {
        return (
            <div style={{ minHeight: '100vh', background: step === 'paused' ? 'linear-gradient(135deg, #2c1810, #4a2010)' : 'linear-gradient(135deg, #0a2e0a, #1a4a1a)', padding: '16px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>

                    {/* Üst Bar: Operatör + Model + İşlem */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                            👤 <strong style={{ color: '#fff' }}>{selectedOperator?.name}</strong>
                            <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
                            👗 {selectedModel?.name}
                            <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
                            ⚙️ {selectedOperation?.name}
                        </div>
                        <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: step === 'paused' ? 'rgba(231,76,60,0.2)' : 'rgba(46,204,113,0.2)', color: step === 'paused' ? '#e74c3c' : '#2ecc71' }}>
                            {step === 'paused' ? `⏸️ MOLA (${pauseReason})` : '▶️ ÜRETİMDE'}
                        </div>
                    </div>

                    {/* BÜYÜK SAYAÇLAR */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '2px solid rgba(46,204,113,0.2)' }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>ÜRETİLEN</div>
                            <div style={{ color: '#2ecc71', fontSize: '48px', fontWeight: '900' }}>{producedCount}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>adet</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '2px solid rgba(52,152,219,0.2)' }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>GEÇEN SÜRE</div>
                            <div style={{ color: '#3498db', fontSize: '36px', fontWeight: '800', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsedSeconds)}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>net çalışma</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '2px solid rgba(155,89,182,0.2)' }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>BİRİM SÜRE</div>
                            <div style={{ color: '#9b59b6', fontSize: '36px', fontWeight: '800' }}>{unitTime}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>sn/adet</div>
                        </div>
                    </div>

                    {/* HATA SAYACI */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(231,76,60,0.08)', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(231,76,60,0.2)' }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>{t('operator.defective')}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button onClick={() => setDefectiveCount(Math.max(0, defectiveCount - 1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: 'rgba(231,76,60,0.2)', color: '#e74c3c', fontSize: '20px', cursor: 'pointer' }}>−</button>
                                <span style={{ color: '#e74c3c', fontSize: '28px', fontWeight: '800', minWidth: '40px', textAlign: 'center' }}>{defectiveCount}</span>
                                <button onClick={() => setDefectiveCount(defectiveCount + 1)} style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: 'rgba(231,76,60,0.2)', color: '#e74c3c', fontSize: '20px', cursor: 'pointer' }}>+</button>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px 16px' }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>{t('operator.defect_reason')}</div>
                            <select value={defectReason} onChange={e => setDefectReason(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', fontFamily: 'inherit' }}>
                                <option value="">—</option>
                                <option value="iplik_kopma">{t('defect.thread_break')}</option>
                                <option value="igne_kirma">{t('defect.needle_break')}</option>
                                <option value="dikis_kaymasi">{t('defect.stitch_slip')}</option>
                                <option value="kumas_hatasi">{t('defect.fabric_defect')}</option>
                                <option value="opertor_hatasi">{t('defect.operator_error')}</option>
                                <option value="diger">{t('defect.other')}</option>
                            </select>
                        </div>
                    </div>

                    {/* ANA BUTONLAR */}
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                        {/* ADET ARTIR BUTONU */}
                        {step === 'working' && (
                            <button onClick={incrementCount}
                                style={{ padding: '28px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: '#fff', fontSize: '22px', fontWeight: '900', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(46,204,113,0.3)', letterSpacing: '1px' }}>
                                ➕ {t('operator.complete_item')} ({producedCount + 1}. {t('common.pieces')})
                            </button>
                        )}

                        {/* MOLA / DEVAM BUTONLARI */}
                        <div style={{ display: 'grid', gridTemplateColumns: step === 'paused' ? '1fr' : '1fr 1fr 1fr', gap: '8px' }}>
                            {step === 'paused' ? (
                                <button onClick={() => togglePause('')}
                                    style={{ padding: '16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    ▶️ {t('operator.resume')}
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => togglePause('Mola')} style={{ padding: '14px 12px', borderRadius: '12px', border: '2px solid rgba(243,156,18,0.3)', background: 'rgba(243,156,18,0.1)', color: '#f39c12', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>☕ {t('operator.break')}</button>
                                    <button onClick={() => togglePause('Arıza')} style={{ padding: '14px 12px', borderRadius: '12px', border: '2px solid rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>🔧 {t('operator.machine_fault')}</button>
                                    <button onClick={() => togglePause('Bekleme')} style={{ padding: '14px 12px', borderRadius: '12px', border: '2px solid rgba(155,89,182,0.3)', background: 'rgba(155,89,182,0.1)', color: '#9b59b6', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>⏳ {t('operator.waiting_material')}</button>
                                </>
                            )}
                        </div>

                        {/* LOT DEĞİŞİKLİK */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input value={lotChange} onChange={e => setLotChange(e.target.value)} placeholder={t('operator.lot_change')} style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '12px', fontFamily: 'inherit' }} />
                        </div>

                        {/* BİTİR */}
                        <button onClick={finishProduction}
                            style={{ padding: '14px', borderRadius: '12px', border: '2px solid rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                            ⏹️ {t('operator.finish')}
                        </button>
                    </div>
                </div>

                {/* ARA KONTROL MODAL */}
                {showQualityCheck && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div style={{ background: '#1a1a2e', borderRadius: '20px', padding: '30px', maxWidth: '550px', width: '100%', textAlign: 'center', border: '2px solid rgba(243,156,18,0.3)' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                            <h2 style={{ color: '#f39c12', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Ara Kontrol Zamanı!</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '16px' }}>20 ürün tamamlandı. Lütfen son ürünün fotoğrafını çekin ve kontrol edin.</p>

                            {/* Fotoğraf çekme */}
                            <div style={{ marginBottom: '14px' }}>
                                {capturedPhoto ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: selectedOperation?.correct_photo_path ? '1fr 1fr' : '1fr', gap: '10px' }}>
                                        {selectedOperation?.correct_photo_path && (
                                            <div><div style={{ fontSize: '11px', color: '#2ecc71', fontWeight: '700', marginBottom: '4px' }}>✅ Referans</div><img src={selectedOperation.correct_photo_path} alt="Ref" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '6px', border: '2px solid #2ecc71' }} /></div>
                                        )}
                                        <div><div style={{ fontSize: '11px', color: '#3498db', fontWeight: '700', marginBottom: '4px' }}>📷 Çekilen</div><img src={capturedPhoto} alt="Çekilen" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '6px', border: '2px solid #3498db' }} /></div>
                                    </div>
                                ) : (
                                    <>
                                        {selectedOperation?.correct_photo_path && (
                                            <div style={{ marginBottom: '10px' }}>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Referans (doğru örnek):</div>
                                                <img src={selectedOperation.correct_photo_path} alt="Ref" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #2ecc71' }} />
                                            </div>
                                        )}
                                        <label style={{ display: 'block', padding: '20px', border: '2px dashed rgba(243,156,18,0.4)', borderRadius: '12px', cursor: 'pointer', color: '#f39c12', fontSize: '13px', fontWeight: '600' }}>
                                            📷 Son Ürünün Fotoğrafını Çekin
                                            <input type="file" accept="image/*" capture="environment" onChange={captureFromInput} onClick={() => setCameraTarget('quality_check')} style={{ display: 'none' }} />
                                        </label>
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button onClick={() => { saveQualityCheck('ok', capturedPhoto); setShowQualityCheck(false); setQualityResult('ok'); setCapturedPhoto(null); }}
                                    style={{ padding: '18px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    ✅ Uygun
                                </button>
                                <button onClick={() => { saveQualityCheck('red', capturedPhoto); setShowQualityCheck(false); setQualityResult('red'); setCapturedPhoto(null); }}
                                    style={{ padding: '18px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    ❌ Düzeltilmeli
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ===== EKRAN: BİTTİ =====
    if (step === 'done') {
        const netMin = Math.round(elapsedSeconds / 60);
        const brkMin = Math.round(breakMs / 60000);
        const mchMin = Math.round(machineDownMs / 60000);
        const matMin = Math.round(materialWaitMs / 60000);
        const saglam = producedCount - defectiveCount;
        const fireOran = producedCount > 0 ? ((defectiveCount / producedCount) * 100).toFixed(1) : 0;

        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: '500px', textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎉</div>
                    <h1 style={{ color: '#2ecc71', fontSize: '28px', fontWeight: '800', marginBottom: '20px' }}>Üretim Tamamlandı!</h1>

                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'left', fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Üretilen:</span><br /><strong style={{ fontSize: '20px', color: '#2ecc71' }}>{producedCount} adet</strong></div>
                            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Sağlam:</span><br /><strong style={{ fontSize: '20px', color: '#3498db' }}>{saglam} adet</strong></div>
                            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Hatalı:</span><br /><strong style={{ fontSize: '20px', color: '#e74c3c' }}>{defectiveCount} adet (%{fireOran})</strong></div>
                            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Birim Süre:</span><br /><strong style={{ fontSize: '20px', color: '#9b59b6' }}>{unitTime} sn/adet</strong></div>
                            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Net Çalışma:</span><br /><strong>{netMin} dk</strong></div>
                            <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Toplam Duruş:</span><br /><strong>{brkMin + mchMin + matMin} dk</strong></div>
                        </div>
                        {/* Süre Dağılımı */}
                        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <span>☕ Mola: <strong style={{ color: '#f39c12' }}>{brkMin} dk</strong></span>
                                <span>🔧 Arıza: <strong style={{ color: '#e74c3c' }}>{mchMin} dk</strong></span>
                                <span>⏳ Bekleme: <strong style={{ color: '#9b59b6' }}>{matMin} dk</strong></span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button onClick={() => { setStep('select'); setSelectedModel(null); setSelectedOperation(null); }}
                            style={{ padding: '14px 28px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            🔄 Yeni İşlem Başlat
                        </button>
                        <button onClick={() => { setStep('login'); setSelectedOperator(null); setSelectedModel(null); setSelectedOperation(null); }}
                            style={{ padding: '14px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3498db, #2980b9)', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                            👤 Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
