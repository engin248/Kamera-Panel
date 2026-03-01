'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * VoiceCommandPanel — Sesli Komut Bileşeni
 *
 * Operatör:
 *   1. 🎙️ butona basar → konuşur
 *   2. Ekranda yazıya dönüşür
 *   3. "Doğru" veya "Yanlış" der / basar
 *   4. Doğruysa sistem otomatik kaydeder
 */

// ─── SESLI KOMUT PARSER ──────────────────────────────────────────────────────
function parseVoiceCommand(text, { personnel, models, operations }) {
    const t = text.toLowerCase().replace(/[,\.]/g, ' ');

    // Personeli bul — ada göre
    let foundPersonnel = null;
    for (const p of personnel) {
        const name = p.name.toLowerCase().split(' ')[0]; // İlk isim
        if (t.includes(name)) { foundPersonnel = p; break; }
    }

    // Modeli bul — koda göre (LS567, LS00000567)
    let foundModel = null;
    const modelMatch = t.match(/(?:ls|lS|LS)?(\d{3,10})/);
    if (modelMatch) {
        const code = modelMatch[0].toUpperCase().replace(/^(\d)/, 'LS$1');
        foundModel = models.find(m =>
            m.code?.toUpperCase().includes(modelMatch[1]) ||
            m.code?.toUpperCase() === code
        );
        if (!foundModel) foundModel = models[0]; // Varsayılan: ilk model
    }

    // Bedeni bul
    const sizeMatch = t.match(/\b(xxs|xs|s|m|l|xl|xxl|2xl|3xl|small|medium|large)\b/);
    const size = sizeMatch ? sizeMatch[1].toUpperCase() : null;

    // Rengi bul
    const colors = ['siyah', 'beyaz', 'kırmızı', 'mavi', 'yeşil', 'sarı', 'gri', 'lacivert', 'bej', 'kahve'];
    const colorMatch = colors.find(c => t.includes(c));

    // İşlemi bul — makine tipine veya adına göre
    let foundOperation = null;
    const opKeywords = {
        'overlok': ['overlok', 'overlock', 'oluk'],
        'düz makina': ['düz', 'duz makina', 'düz makine'],
        'reçme': ['reçme', 'recme', 'reçme'],
        'omuz': ['omuz'],
        'yan dikiş': ['yan', 'yan dikiş'],
        'beden': ['beden dikim'],
        'kol': ['kol'],
    };
    for (const op of operations) {
        const opName = op.name?.toLowerCase();
        for (const [key, keywords] of Object.entries(opKeywords)) {
            if (keywords.some(k => t.includes(k)) && opName?.includes(key.split(' ')[0])) {
                foundOperation = op;
                break;
            }
        }
        if (foundOperation) break;
        // Direkt isim eşleşmesi
        if (opName && t.includes(opName)) { foundOperation = op; break; }
    }

    // Aksiyon: başladım mı, bitti mi?
    const isStart = /başla|başlıyorum|başladım|start/.test(t);
    const isComplete = /bitti|tamamladım|tamamlandı|bitirdim|complete|finish/.test(t);

    // Adet sayısı
    const countMatch = t.match(/(\d+)\s*(?:adet|parça|tane)/);
    const total_produced = countMatch ? parseInt(countMatch[1]) : 0;

    return {
        personnel_id: foundPersonnel?.id || null,
        personnel_name: foundPersonnel?.name || null,
        model_id: foundModel?.id || null,
        model_code: foundModel?.code || null,
        operation_id: foundOperation?.id || null,
        operation_name: foundOperation?.name || null,
        size,
        color: colorMatch || null,
        action: isComplete ? 'complete' : isStart ? 'start' : null,
        total_produced,
    };
}

// ─── ANA BİLEŞEN ─────────────────────────────────────────────────────────────
export default function VoiceCommandPanel({ onLogAdded }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [parsed, setParsed] = useState(null);
    const [dbData, setDbData] = useState({ personnel: [], models: [], operations: [] });
    const [status, setStatus] = useState('idle'); // idle | listening | confirming | saving | success | error
    const [resultMsg, setResultMsg] = useState('');
    const [supported, setSupported] = useState(true);

    const recognitionRef = useRef(null);

    // DB verilerini yükle
    useEffect(() => {
        fetch('/api/voice-command')
            .then(r => r.json())
            .then(data => setDbData(data))
            .catch(() => { });
    }, []);

    // Browser Speech API kurulumu
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { setSupported(false); return; }

        const rec = new SpeechRecognition();
        rec.lang = 'tr-TR';
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (e) => {
            const text = Array.from(e.results)
                .map(r => r[0].transcript)
                .join('');
            setTranscript(text);

            if (e.results[e.results.length - 1].isFinal) {
                const p = parseVoiceCommand(text, dbData);
                setParsed(p);
                setStatus('confirming');
                setIsListening(false);
            }
        };

        rec.onerror = (e) => {
            setIsListening(false);
            setStatus('error');
            setResultMsg('Mikrofon hatası: ' + e.error);
        };

        rec.onend = () => setIsListening(false);

        recognitionRef.current = rec;
    }, [dbData]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        setTranscript('');
        setParsed(null);
        setResultMsg('');
        setStatus('listening');
        setIsListening(true);
        recognitionRef.current.start();
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const handleConfirm = async () => {
        if (!parsed?.action) {
            setStatus('error');
            setResultMsg('Başladım veya Tamamladım komutu tespit edilemedi.');
            return;
        }
        setStatus('saving');
        try {
            const res = await fetch('/api/voice-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, parsed }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setResultMsg(data.message);
                if (onLogAdded) onLogAdded(data.log);
                setTimeout(() => { setStatus('idle'); setTranscript(''); setParsed(null); }, 3000);
            } else {
                setStatus('error');
                setResultMsg(data.error);
            }
        } catch (e) {
            setStatus('error');
            setResultMsg('Bağlantı hatası');
        }
    };

    const handleRetry = () => {
        setStatus('idle');
        setTranscript('');
        setParsed(null);
        setResultMsg('');
    };

    if (!supported) return (
        <div style={styles.unsupported}>
            ⚠️ Tarayıcınız sesli komut desteklemiyor. Chrome veya Edge kullanın.
        </div>
    );

    return (
        <div style={styles.panel}>
            <div style={styles.header}>
                <span style={styles.headerIcon}>🎙️</span>
                <span style={styles.headerTitle}>SESLİ ÜRETİM KAYDI</span>
            </div>

            {/* MİKROFON BUTONU */}
            {status === 'idle' && (
                <div style={styles.centerSection}>
                    <button
                        style={{ ...styles.micBtn, background: '#1a1a2e' }}
                        onClick={startListening}
                    >
                        🎙️
                    </button>
                    <p style={styles.hint}>
                        Örnek: <em>"Ali, LS567, S beden, siyah overlok, omuz çatımı başladım"</em>
                    </p>
                </div>
            )}

            {/* KAYIT YAPILIYOR */}
            {status === 'listening' && (
                <div style={styles.centerSection}>
                    <button style={{ ...styles.micBtn, background: '#c0392b', animation: 'pulse 1s infinite' }} onClick={stopListening}>
                        ⏹️
                    </button>
                    <p style={{ ...styles.hint, color: '#e74c3c' }}>🔴 Dinleniyor... Durdurmak için tıkla</p>
                    {transcript && <div style={styles.liveTranscript}>{transcript}</div>}
                </div>
            )}

            {/* DOĞRULAMA EKRANI */}
            {status === 'confirming' && parsed && (
                <div style={styles.confirmBox}>
                    <p style={styles.confirmTitle}>Söyledikleriniz doğru mu?</p>
                    <div style={styles.transcriptBox}>"{transcript}"</div>

                    <div style={styles.parsedGrid}>
                        <Row label="👤 Personel" value={parsed.personnel_name} ok={!!parsed.personnel_id} />
                        <Row label="📦 Model" value={parsed.model_code} ok={!!parsed.model_id} />
                        <Row label="⚙️ İşlem" value={parsed.operation_name} ok={!!parsed.operation_id} />
                        <Row label="📐 Beden" value={parsed.size} ok={!!parsed.size} />
                        <Row label="🎨 Renk" value={parsed.color} ok={!!parsed.color} />
                        <Row label="▶️ Aksiyon" value={parsed.action === 'start' ? '🟢 BAŞLADI' : parsed.action === 'complete' ? '✅ TAMAMLADI' : '❓ Belirsiz'} ok={!!parsed.action} />
                        {parsed.action === 'complete' && (
                            <Row label="🔢 Adet" value={parsed.total_produced || '?'} ok={parsed.total_produced > 0} />
                        )}
                    </div>

                    <div style={styles.btnRow}>
                        <button style={styles.btnYes} onClick={handleConfirm}>✅ DOĞRU — KAYDET</button>
                        <button style={styles.btnNo} onClick={handleRetry}>❌ YANLIŞ — TEKRAR</button>
                    </div>
                </div>
            )}

            {/* KAYIT YAPILIYOR */}
            {status === 'saving' && (
                <div style={styles.centerSection}>
                    <div style={styles.spinner}>⏳</div>
                    <p style={styles.hint}>Kaydediliyor...</p>
                </div>
            )}

            {/* BAŞARILI */}
            {status === 'success' && (
                <div style={{ ...styles.centerSection, color: '#27ae60' }}>
                    <div style={{ fontSize: 48 }}>✅</div>
                    <p style={{ ...styles.hint, color: '#27ae60', fontWeight: 'bold' }}>{resultMsg}</p>
                </div>
            )}

            {/* HATA */}
            {status === 'error' && (
                <div style={styles.centerSection}>
                    <div style={{ fontSize: 48 }}>❌</div>
                    <p style={{ ...styles.hint, color: '#e74c3c' }}>{resultMsg}</p>
                    <button style={styles.btnNo} onClick={handleRetry}>Tekrar Dene</button>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(192,57,43,0.7); }
                    50% { transform: scale(1.08); box-shadow: 0 0 0 12px rgba(192,57,43,0); }
                }
            `}</style>
        </div>
    );
}

function Row({ label, value, ok }) {
    return (
        <div style={styles.parsedRow}>
            <span style={styles.parsedLabel}>{label}</span>
            <span style={{ ...styles.parsedValue, color: ok ? '#27ae60' : '#e74c3c' }}>
                {value || '⚠️ Tespit edilemedi'} {ok ? '✅' : '❌'}
            </span>
        </div>
    );
}

const styles = {
    panel: {
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        minHeight: 220,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 12,
    },
    headerIcon: { fontSize: 24 },
    headerTitle: { fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#a29bfe' },
    centerSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '12px 0' },
    micBtn: {
        width: 90, height: 90, borderRadius: '50%',
        border: '3px solid #a29bfe', fontSize: 36,
        cursor: 'pointer', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    hint: { color: '#b2bec3', fontSize: 13, textAlign: 'center', maxWidth: 400 },
    liveTranscript: {
        background: 'rgba(255,255,255,0.08)', borderRadius: 8,
        padding: '10px 16px', fontSize: 15, color: '#dfe6e9',
        fontStyle: 'italic', maxWidth: 460, textAlign: 'center',
    },
    confirmBox: { display: 'flex', flexDirection: 'column', gap: 14 },
    confirmTitle: { fontSize: 15, fontWeight: 700, color: '#a29bfe', textAlign: 'center', margin: 0 },
    transcriptBox: {
        background: 'rgba(255,255,255,0.07)', borderRadius: 8,
        padding: '10px 16px', fontSize: 14, color: '#dfe6e9',
        fontStyle: 'italic', textAlign: 'center',
    },
    parsedGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
    parsedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    parsedLabel: { fontSize: 13, color: '#b2bec3', minWidth: 110 },
    parsedValue: { fontSize: 13, fontWeight: 600 },
    btnRow: { display: 'flex', gap: 12, marginTop: 8 },
    btnYes: { flex: 1, padding: '12px 0', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    btnNo: { flex: 1, padding: '12px 0', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    spinner: { fontSize: 40, animation: 'spin 1s linear infinite' },
    unsupported: { background: '#c0392b22', borderRadius: 10, padding: 16, color: '#e74c3c', fontSize: 13 },
};
