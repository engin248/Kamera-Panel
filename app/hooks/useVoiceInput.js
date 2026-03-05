import { useState, useCallback, useRef } from 'react';

export function useVoiceInput(formSetter) {
    const [listeningField, setListeningField] = useState(null);
    const [voiceLang, setVoiceLang] = useState('tr-TR');
    const recognitionRef = useRef(null);

    const stopVoice = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
            recognitionRef.current = null;
        }
        setListeningField(null);
    }, []);

    const startVoice = useCallback((fieldKey) => {
        if (listeningField === fieldKey) { stopVoice(); return; }
        if (listeningField) stopVoice();

        const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
        if (!SR) {
            alert('Tarayıcınız sesle girişi desteklemiyor. Chrome veya Edge kullanın.');
            return;
        }

        const rec = new SR();
        rec.lang = voiceLang;
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        recognitionRef.current = rec;
        setListeningField(fieldKey);

        let finalT = '';
        rec.onresult = (ev) => {
            let interim = '';
            for (let i = ev.resultIndex; i < ev.results.length; i++) {
                const t = ev.results[i][0].transcript;
                if (ev.results[i].isFinal) finalT += t + ' '; else interim = t;
            }
            const combined = (finalT + interim).trim();
            if (combined) {
                formSetter(prev => ({ ...prev, [fieldKey]: combined }));
            }
        };

        rec.onerror = (e) => { if (e.error !== 'no-speech') stopVoice(); };
        rec.onend = () => { setListeningField(null); recognitionRef.current = null; };

        rec.start();
        setTimeout(() => { if (recognitionRef.current === rec) stopVoice(); }, 30000);

    }, [listeningField, voiceLang, formSetter, stopVoice]);

    const toggleLang = useCallback(() => setVoiceLang(v => v === 'tr-TR' ? 'ar-SA' : 'tr-TR'), []);

    return { listeningField, voiceLang, startVoice, stopVoice, toggleLang };
}
