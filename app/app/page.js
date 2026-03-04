'use client';



import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { EditModal, AuditTrailModal, EditButtons, EDIT_FIELDS } from '@/lib/edit-system';



// ========== GLOBAL VOICE INPUT HOOK ==========

function useVoiceInput(formSetter) {

  const [listeningField, setListeningField] = useState(null);

  const [voiceLang, setVoiceLang] = useState('tr-TR');

  const recognitionRef = useRef(null);

  const stopVoice = useCallback(() => {

    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { } recognitionRef.current = null; }

    setListeningField(null);

  }, []);

  const startVoice = useCallback((fieldKey) => {

    if (listeningField === fieldKey) { stopVoice(); return; }

    if (listeningField) stopVoice();

    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SR) { alert('Tarayıcınız sesle girişi desteklemiyor. Chrome veya Edge kullanın.'); return; }

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

      if (combined) formSetter(prev => ({ ...prev, [fieldKey]: combined }));

    };

    rec.onerror = (e) => { if (e.error !== 'no-speech') stopVoice(); };

    rec.onend = () => { setListeningField(null); recognitionRef.current = null; };

    rec.start();

    setTimeout(() => { if (recognitionRef.current === rec) stopVoice(); }, 30000);

  }, [listeningField, voiceLang, formSetter, stopVoice]);

  const toggleLang = useCallback(() => setVoiceLang(v => v === 'tr-TR' ? 'ar-SA' : 'tr-TR'), []);

  return { listeningField, voiceLang, startVoice, stopVoice, toggleLang };

}

// ========== GN:013 — GÜNLÜK HEDEF + PARTİ BAĞLANTISI ==========

function GunlukHedefBar({ tarih }) {
  const [ozet, setOzet] = useState(null);
  useEffect(() => { fetch(`/api/uretim-ozet?tarih=${tarih}`).then(r => r.json()).then(setOzet).catch(() => { }); }, [tarih]);
  if (!ozet || !ozet.kayit_sayisi) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontWeight: '700', fontSize: '13px' }}>📈 Günlük Hedef</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ozet.toplam_uretim} / {ozet.hedef} — %{ozet.hedef_yuzdesi}</span>
      </div>
      <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${ozet.hedef_yuzdesi}%`, background: ozet.hedef_yuzdesi >= 80 ? '#27ae60' : ozet.hedef_yuzdesi >= 50 ? '#f39c12' : '#e74c3c', borderRadius: '4px', transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>FPY: <strong style={{ color: '#27ae60' }}>{ozet.fpy}%</strong></span>
        <span>Aktif: <strong>{ozet.aktif_personel} kişi</strong></span>
        <span>Değer: <strong>{parseFloat(ozet.toplam_deger || 0).toFixed(0)} ₺</strong></span>
      </div>
    </div>
  );
}

function PartiBaglantisi({ seciliModel, onSecim }) {
  const [partiler, setPartiler] = useState([]);
  useEffect(() => {
    if (!seciliModel) return;
    fetch('/api/uretim-giris').then(r => r.json()).then(d => { setPartiler(Array.isArray(d) ? d.filter(p => p.model_id === parseInt(seciliModel)) : []); }).catch(() => { });
  }, [seciliModel]);
  if (!seciliModel || partiler.length === 0) return null;
  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>📦 Üretim Partisi</label>
      <select className="form-input" onChange={e => onSecim(e.target.value)} defaultValue="">
        <option value="">-- Parti Seç (opsiyonel) --</option>
        {partiler.map(p => <option key={p.id} value={p.id}>{p.parti_no || 'Parti #' + p.id} — {new Date(p.created_at).toLocaleDateString('tr-TR')}</option>)}
      </select>
    </div>
  );
}

// ========== GN:012A — SESLİ KOMUT MOTORU ==========

function parseVoiceCommand(transcript, models, personnel) {
  const t = transcript.toLowerCase().trim();
  // Türkçe karakter destekli regex (GPT+Perplexity kurul raporu GN015)
  const adetMatch = t.match(/([a-zşıöüçğ\s]+?)\s+(\d+)\s+adet\s+tamamla/i);
  if (adetMatch) {
    const kisi = adetMatch[1].trim();
    const person = personnel.find(p => p.name.toLowerCase().includes(kisi));
    return { action: 'production_add', params: { personnel_id: person?.id, total_produced: parseInt(adetMatch[2]), personAdi: kisi } };
  }
  const girisMatch = t.match(/([a-zşıöüçğ\s]+?)\s+giriş\s+yaptı/i);
  if (girisMatch) {
    const kisi = girisMatch[1].trim();
    const person = personnel.find(p => p.name.toLowerCase().includes(kisi));
    return { action: 'personel_giris', params: { personel_id: person?.id, personAdi: kisi } };
  }
  const cikisMatch = t.match(/([a-zşıöüçğ\s]+?)\s+çıkış\s+yaptı/i);
  if (cikisMatch) {
    const kisi = cikisMatch[1].trim();
    const person = personnel.find(p => p.name.toLowerCase().includes(kisi));
    return { action: 'personel_cikis', params: { personel_id: person?.id, personAdi: kisi } };
  }
  if (t.includes('bugünkü üretim') || t.includes('üretim kaç')) return { action: 'uretim_sorgu', params: {} };
  if (t.includes('vardiya')) return { action: 'vardiya', params: {} };
  return null;
}

async function executeVoiceCommand(parsed, addToast) {
  if (!parsed) { addToast('warning', '🎙️ Komut anlaşılamadı'); return; }
  const { action, params } = parsed;
  if (action === 'production_add') {
    await fetch('/api/production', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personnel_id: params.personnel_id, total_produced: params.total_produced, defective_count: 0 }) });
    addToast('success', `✅ ${params.personAdi}: ${params.total_produced} adet kaydedildi`);
  } else if (action === 'personel_giris') {
    await fetch('/api/personel-saat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personel_id: params.personel_id, tip: 'giris' }) });
    addToast('success', `✅ ${params.personAdi} giriş kaydedildi`);
  } else if (action === 'personel_cikis') {
    await fetch('/api/personel-saat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personel_id: params.personel_id, tip: 'cikis' }) });
    addToast('success', `✅ ${params.personAdi} çıkış kaydedildi`);
  } else if (action === 'uretim_sorgu') {
    const r = await fetch('/api/production?date=' + new Date().toISOString().split('T')[0]);
    const d = await r.json();
    addToast('info', `📊 Bugün: ${Array.isArray(d) ? d.reduce((s, l) => s + (l.total_produced || 0), 0) : 0} adet`);
  } else if (action === 'vardiya') {
    addToast('info', '🔄 Vardiya değişimi');
  }
}

function SesliKomutButonu({ models, personnel, addToast }) {
  const [aktif, setAktif] = useState(false);
  const [sonKomut, setSonKomut] = useState('');
  const baslat = () => {
    setAktif(true);
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.lang = 'tr-TR'; rec.interimResults = false;
    rec.onresult = async (e) => {
      const t = e.results[0][0].transcript;
      setSonKomut(t);
      const parsed = parseVoiceCommand(t, models, personnel);
      await executeVoiceCommand(parsed, addToast);
      setAktif(false);
    };
    rec.onerror = () => setAktif(false);
    rec.onend = () => setAktif(false);
    rec.start();
  };
  return (
    <>
      <button onClick={baslat} disabled={aktif} style={{ width: '44px', height: '44px', borderRadius: '50%', background: aktif ? '#e74c3c' : 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
        {aktif ? '⏹' : '🎙️'}
      </button>
      <div>
        <div style={{ fontWeight: '700', fontSize: '13px' }}>Sesli Komut {aktif && <span style={{ color: '#e74c3c' }}>● Dinliyor...</span>}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sonKomut || '"Ahmet 5 adet tamamladı" — "Mehmet giriş yaptı"'}</div>
      </div>
    </>
  );
}

// ========== GN:012C — FASON HESAP MİNİ ==========

function FasonHesapMini({ addToast }) {
  const [kar, setKar] = useState(20);
  const [malzeme, setMalzeme] = useState(0);
  const [sonuc, setSonuc] = useState(null);
  const hesapla = async () => {
    const r = await fetch('/api/fason-fiyat-hesapla', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kar_marji_yuzde: kar, ek_malzeme_tl: malzeme }) });
    setSonuc(await r.json());
  };
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kâr %</label><input type="number" className="form-input" style={{ width: '70px' }} value={kar} onChange={e => setKar(e.target.value)} /></div>
      <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ek Malzeme ₺</label><input type="number" className="form-input" style={{ width: '100px' }} value={malzeme} onChange={e => setMalzeme(e.target.value)} /></div>
      <button onClick={hesapla} style={{ padding: '8px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Hesapla</button>
      {sonuc && <div style={{ padding: '8px 12px', background: sonuc.kar_zarar_sinyal === 'karli' ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.1)', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
        {sonuc.kar_zarar_sinyal === 'karli' ? '✅' : '⚠️'} Fason: {sonuc.fason_fiyat}₺ | Birim: {sonuc.birim_fiyat}₺
      </div>}
    </div>
  );
}



function VoiceBtn({ fieldKey, listeningField, voiceLang, startVoice, toggleLang }) {

  return (

    <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '2px', zIndex: 2 }}>

      <button type="button" onClick={toggleLang}

        title={voiceLang === 'tr-TR' ? 'Türkçe → Arapça' : 'العربية → التركية'}

        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px', borderRadius: '4px', opacity: 0.7 }}>

        {voiceLang === 'tr-TR' ? '🇹🇷' : '🇸🇦'}

      </button>

      <button type="button" onClick={() => startVoice(fieldKey)}

        title={listeningField === fieldKey ? 'Durdur' : 'Sesle giriş'}

        style={{

          background: listeningField === fieldKey ? '#e74c3c' : 'transparent',

          color: listeningField === fieldKey ? '#fff' : 'var(--text-muted)',

          border: 'none', borderRadius: '50%', width: '26px', height: '26px',

          display: 'flex', alignItems: 'center', justifyContent: 'center',

          cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease',

          animation: listeningField === fieldKey ? 'mic-pulse 1s ease-in-out infinite' : 'none'

        }}>{listeningField === fieldKey ? '⏹' : '🎤'}

      </button>

    </div>

  );

}



// ========== SPEECH TO TEXT ==========

function SpeechToText() {

  const [isListening, setIsListening] = useState(false);

  const [transcript, setTranscript] = useState('');

  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);



  useEffect(() => {

    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) { setSupported(false); return; }

    const recognition = new SpeechRecognition();

    recognition.lang = 'tr-TR';

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.onresult = (e) => {

      let final = '', interim = '';

      for (let i = 0; i < e.results.length; i++) {

        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';

        else interim += e.results[i][0].transcript;

      }

      setTranscript(prev => {

        const base = prev.includes('...') ? prev.split('...')[0] : prev;

        return (final ? base + final : base) + (interim ? '...' + interim : '');

      });

    };

    recognition.onerror = () => setIsListening(false);

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => { try { recognition.stop(); } catch (e) { } };

  }, []);



  const toggleListening = () => {

    if (!recognitionRef.current) return;

    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }

    else { recognitionRef.current.start(); setIsListening(true); }

  };



  if (!supported) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>⚠️ Tarayıcınız ses tanıma desteklemiyor. Chrome veya Edge kullanmanız önerilir.</div>;



  return (

    <div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>

        <button onClick={toggleListening} style={{ width: '60px', height: '60px', borderRadius: '50%', border: 'none', background: isListening ? 'var(--danger)' : 'var(--accent)', color: '#fff', fontSize: '24px', cursor: 'pointer', animation: isListening ? 'pulse 1s infinite' : 'none', boxShadow: isListening ? '0 0 20px rgba(231,76,60,0.5)' : 'none', transition: 'all 0.3s' }}>

          {isListening ? '⏹️' : '📋'}

        </button>

        <div>

          <div style={{ fontWeight: '700', fontSize: '15px' }}>{isListening ? '📋 Dinleniyor...' : '📋 Kayda Başla'}</div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isListening ? 'Konuşmaya devam edin, durdurmak için butona basın' : 'Butona basarak konuşmaya başlayın'}</div>

        </div>

      </div>

      <textarea value={transcript.replace('...', '')} onChange={e => setTranscript(e.target.value)} placeholder="Ses tanıma sonucu burada görünecek..." style={{ width: '100%', minHeight: '150px', padding: '14px', fontSize: '14px', lineHeight: '1.8', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit' }} />

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>

        <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(transcript.replace('...', '')); }} disabled={!transcript}>📋 Kopyala</button>

        <button className="btn btn-secondary btn-sm" onClick={() => setTranscript('')} disabled={!transcript}>🗑️ Temizle</button>

      </div>

      <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>

    </div>

  );

}



// ========== CHATBOT PANELİ  4 BOT ==========

const BOTLAR = [
  { id: 'gemini', emoji: '🔩', ad: 'Kamera', uzmanlik: 'Operasyon', renk: '#2ecc71', aciklama: 'Anlık üretim, sipariş, personel' },
  { id: 'gpt', emoji: '📊', ad: 'Muhasip', uzmanlik: 'Muhasebe', renk: '#3498db', aciklama: 'Maliyet, karlılık, finansal analiz' },
  { id: 'perplexity', emoji: '🔍', ad: 'Kaşif', uzmanlik: 'Araştırma', renk: '#9b59b6', aciklama: 'Piyasa, sektör, kumaş fiyatları' },
  { id: 'deepseek', emoji: '🛠️', ad: 'Tekniker', uzmanlik: 'Teknik', renk: '#e67e22', aciklama: 'Model, BOM, dikim, kalite' },
];

// Sekme → Bot eşleşme tablosu
const SEKME_BOT_MAP = {
  models: 'deepseek',   // Modeller → Tekniker
  personnel: 'gemini',     // Personel → Kamera
  production: 'gemini',     // Üretim → Kamera
  costs: 'gpt',        // Maliyet → Muhasip
  muhasebe: 'gpt',        // Rapor & Analiz → Muhasip
  orders: 'gemini',     // Siparişler → Kamera
  quality: 'deepseek',   // Kalite → Tekniker
  fason: 'gpt',        // Fason → Muhasip
  shipments: 'gemini',     // Sevkiyat → Kamera
  prim: 'gpt',        // Prim → Muhasip
  machines: 'deepseek',   // Makineler → Tekniker
  customers: 'gemini',     // Müşteriler → Kamera
  reports: 'perplexity', // Raporlar → Kaşif
  dashboard: 'gemini',     // Ana Panel → Kamera
  settings: 'deepseek',  // Ayarlar → Tekniker
};

// Sekme etiketi tablosu
const SEKME_LABEL_MAP = {
  models: '👗 Modeller',
  personnel: '👥 Personel',
  production: '🔩 Üretim',
  costs: '💰 Maliyet',
  muhasebe: '📒 Rapor & Analiz',
  orders: '📋 Siparişler',
  quality: '✅ Kalite',
  fason: '🔧 Fason',
  shipments: '📦 Sevkiyat',
  prim: '🏆 Prim',
  machines: '⚙️ Makineler',
  customers: '🤝 Müşteriler',
  reports: '📈 Raporlar',
  dashboard: '📊 Ana Panel',
  settings: '⚙️ Ayarlar',
};

function ChatbotPanel({ onClose, activePage }) {
  const defaultBot = SEKME_BOT_MAP[activePage] || 'gemini';
  const [aktifBot, setAktifBot] = useState(defaultBot);

  // activePage değiştiğinde botu otomatik güncelle
  useEffect(() => {
    const yeniBot = SEKME_BOT_MAP[activePage];
    if (yeniBot) setAktifBot(yeniBot);
  }, [activePage]);

  const [konusmalar, setKonusmalar] = useState({
    gemini: [{ role: 'assistant', content: ' Merhaba! Ben **Kamera**, Operasyon Uzmanınız.\n\nBugünkü üretim, aktif siparişler, personel durumu hakkında anlık bilgi verebilirim.' }],
    gpt: [{ role: 'assistant', content: ' Merhaba! Ben **Muhasip**, Finans & Muhasebe Uzmanınız.\n\nMaliyet analizi, karlılık hesabı, personel/üretim oranları hakkında sorun.' }],
    perplexity: [{ role: 'assistant', content: ' Merhaba! Ben **Kaşif**, Araştırma Uzmanınız.\n\nPiyasa fiyatları, kumaş maliyetleri, sektör trendleri hakkında güncel bilgi alabilirim.' }],
    deepseek: [{ role: 'assistant', content: ' Merhaba! Ben **Tekniker**, Teknik Uzmanınız.\n\nModel detayları, BOM listesi, dikim sırası, kalite kontrol standartları hakkında sorun.' }],
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const bot = BOTLAR.find(b => b.id === aktifBot);
  const messages = konusmalar[aktifBot] || [];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aktifBot]);

  const quickCmds = {
    gemini: [' Bugünkü üretim?', ' Geciken sipariş?', ' Personel durumu?', ' Aktif model?'],
    gpt: [' Bu ay gider?', ' Karlılık analizi?', ' Maaş-üretim oranı?', ' Sipariş başı kar?'],
    perplexity: [' Pamuk fiyatı?', ' Sektör trendi?', ' Fason fiyatları?', ' Rakip analizi?'],
    deepseek: [' BOM nedir?', ' Dikim sırası?', ' Hata analizi?', ' Makine bakım?'],
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const yeniMsgs = [...messages, { role: 'user', content: msg }];
    setKonusmalar(prev => ({ ...prev, [aktifBot]: yeniMsgs }));
    setLoading(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: yeniMsgs.slice(-8), bot: aktifBot })
      });
      const data = await res.json();
      const cevap = { role: 'assistant', content: data.reply || 'Cevap alinamadi.', botEmoji: bot.emoji };
      setKonusmalar(prev => ({ ...prev, [aktifBot]: [...yeniMsgs, cevap] }));
    } catch {
      setKonusmalar(prev => ({ ...prev, [aktifBot]: [...yeniMsgs, { role: 'assistant', content: 'Baglanti hatasi.' }] }));
    } finally { setLoading(false); }
  };

  const formatText = (t) => (t || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-family:monospace">$1</code>')
    .replace(/\n/g, '<br/>');

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', width: '420px', height: '630px',
      background: 'var(--bg-card)', border: '2px solid ' + bot.renk + '40',
      borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      display: 'flex', flexDirection: 'column', zIndex: 500, overflow: 'hidden',
      animation: 'slideUp 0.3s ease'
    }}>
      <div style={{ padding: '14px 16px 10px', background: 'linear-gradient(135deg, #1a2e1a, #2c3e2d)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, ' + bot.renk + '90, ' + bot.renk + '50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              boxShadow: '0 0 0 3px ' + bot.renk + '30'
            }}>{bot.emoji}</div>
            <div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
                {bot.ad} <span style={{ fontSize: '11px', color: bot.renk }}>  {bot.uzmanlik}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                {bot.aciklama}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* AKTİF SEKME BADGE */}
            {activePage && SEKME_LABEL_MAP[activePage] && (
              <div style={{
                padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: '700',
                background: bot.renk + '25', border: '1px solid ' + bot.renk + '50',
                color: bot.renk, letterSpacing: '0.3px', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <span style={{ fontSize: '8px', opacity: 0.7 }}>📍</span>
                {SEKME_LABEL_MAP[activePage]}
              </div>
            )}
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' }}>X</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px' }}>
          {BOTLAR.map(b => (
            <button key={b.id} onClick={() => setAktifBot(b.id)} style={{
              padding: '6px 4px', borderRadius: '8px',
              border: '1px solid ' + (aktifBot === b.id ? b.renk : 'rgba(255,255,255,0.1)'),
              background: aktifBot === b.id ? b.renk + '25' : 'rgba(255,255,255,0.04)',
              color: aktifBot === b.id ? b.renk : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
            }}>
              <span style={{ fontSize: '16px' }}>{b.emoji}</span>
              <span style={{ fontSize: '9px', fontWeight: aktifBot === b.id ? '700' : '400' }}>{b.uzmanlik}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'linear-gradient(135deg, ' + bot.renk + '80, ' + bot.renk + '40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
                flexShrink: 0, marginRight: '7px', marginTop: '2px'
              }}>{msg.botEmoji || bot.emoji}</div>
            )}
            <div style={{
              maxWidth: '80%', padding: '9px 13px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, ' + bot.renk + 'cc, ' + bot.renk + '88)' : 'var(--bg-input)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              fontSize: '13px', lineHeight: '1.5',
              border: msg.role === 'assistant' ? '1px solid ' + bot.renk + '20' : 'none'
            }} dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} />
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,' + bot.renk + '80,' + bot.renk + '40)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>{bot.emoji}</div>
            <div style={{ padding: '9px 13px', background: 'var(--bg-input)', borderRadius: '4px 18px 18px 18px', border: '1px solid ' + bot.renk + '20' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2].map(j => <span key={j} style={{ width: '6px', height: '6px', background: bot.renk, borderRadius: '50%', display: 'inline-block', animation: 'pulse ' + (0.8 + j * 0.2) + 's ease infinite' }}></span>)}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '6px 12px', borderTop: '1px solid ' + bot.renk + '15', display: 'flex', gap: '5px', flexWrap: 'wrap', flexShrink: 0 }}>
        {(quickCmds[aktifBot] || []).map((cmd, i) => (
          <button key={i} onClick={() => sendMessage(cmd)} style={{
            padding: '3px 8px', background: bot.renk + '10', border: '1px solid ' + bot.renk + '25',
            borderRadius: '10px', cursor: 'pointer', fontSize: '10px', color: bot.renk,
            fontFamily: 'inherit', whiteSpace: 'nowrap'
          }}>{cmd}</button>
        ))}
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid ' + bot.renk + '20', display: 'flex', gap: '8px', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={bot.ad + " ile konuş..."}
          style={{
            flex: 1, padding: '9px 13px', background: 'var(--bg-input)',
            border: '1.5px solid ' + bot.renk + '30', borderRadius: '12px',
            fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none'
          }}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
          width: '40px', height: '40px', background: 'linear-gradient(135deg, ' + bot.renk + ', ' + bot.renk + '80)',
          border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#fff', fontSize: '17px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: (loading || !input.trim()) ? 0.45 : 1
        }}></button>
      </div>
    </div>
  );
}



// ========== SIDEBAR ==========

function Sidebar({ activePage, setActivePage, onChatbotToggle }) {

  const [uretimAcik, setUretimAcik] = useState(true);
  const [digerAcik, setDigerAcik] = useState(false);

  const uretimItems = [
    { id: 'models', icon: '👗', label: 'Modeller' },
    { id: 'personnel', icon: '👥', label: 'Personel' },
    { id: 'production', icon: '🔩', label: 'Üretim Aşaması' },
    { id: 'costs', icon: '💰', label: 'Maliyet' },
    { id: 'muhasebe', icon: '📒', label: 'Rapor & Analiz' },
  ];

  const digerItems = [
    { id: 'quality', icon: '✅', label: 'Kalite Kontrol' },
    { id: 'fason', icon: '🔧', label: 'Fason' },
    { id: 'shipments', icon: '📦', label: 'Sevkiyat' },
    { id: 'prim', icon: '🏆', label: 'Prim & Üret' },
    { id: 'machines', icon: '⚙️', label: 'Makineler' },
    { id: 'customers', icon: '🤝', label: 'Müşteriler' },
    { id: 'reports', icon: '📈', label: 'Raporlar' },
    { id: 'dashboard', icon: '📊', label: 'Ana Panel' },
    { id: 'settings', icon: '⚙️', label: 'Ayarlar' },
  ];

  const uretimAktif = uretimItems.some(i => i.id === activePage);

  return (

    <aside className="sidebar">

      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🧵</div>
          <div>
            <div className="sidebar-logo-text">47 Sil Baştan 01</div>
            <div className="sidebar-logo-sub" style={{ color: '#D4A847', fontSize: '12.5px', fontWeight: '600', letterSpacing: '0.3px' }}>Adil Şeffaf Veri Odaklı Üretim Kontrol Sistemleri</div>
          </div>
        </div>
      </div>

      {/* AI CHATBOT BUTONU */}
      <div style={{ padding: '12px 12px 0' }}>
        <button onClick={onChatbotToggle} style={{
          width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(106,158,110,0.2), rgba(91,142,194,0.2))',
          display: 'flex', alignItems: 'center', gap: '10px', color: '#7be88e', fontWeight: '700',
          fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.25s ease',
          borderLeft: '3px solid #6a9e6e',
        }}>
          <span style={{ fontSize: '22px', animation: 'breathe 3s ease infinite' }}>🤖</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#7be88e' }}>Kamera AI</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: '400' }}>Fabrika Asistanı</div>
          </div>
          <div style={{ marginLeft: 'auto', width: '8px', height: '8px', background: '#2ecc71', borderRadius: '50%', animation: 'pulse 2s ease infinite', flexShrink: 0 }} />
        </button>
      </div>

      <nav className="sidebar-nav">

        {/* SİPARİŞLER — Bağımsız (Mağazadan gelir) */}
        <button
          className={`nav-item ${activePage === 'orders' ? 'active' : ''}`}
          onClick={() => setActivePage('orders')}
        >
          <span className="nav-item-icon">📋</span>
          <span>Siparişler</span>
        </button>

        {/* ÜRETİM DEPARTMANI — Accordion kutu */}
        <div style={{
          marginTop: '8px',
          border: `2px solid ${uretimAktif || uretimAcik ? 'rgba(212,168,71,0.75)' : 'rgba(212,168,71,0.35)'}`,
          borderRadius: '14px',
          overflow: 'hidden',
          background: 'rgba(212,168,71,0.06)',
          boxShadow: uretimAktif || uretimAcik ? '0 0 12px rgba(212,168,71,0.15), inset 0 1px 0 rgba(212,168,71,0.1)' : 'none',
          transition: 'all 0.3s ease',
        }}>

          {/* Başlık / Toggle */}
          <button onClick={() => setUretimAcik(p => !p)} style={{
            width: '100%', padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'inherit',
            color: '#D4A847', fontWeight: '700', fontSize: '14px',
          }}>
            <span style={{ fontSize: '20px' }}>🏭</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Üretim Departmanı</span>
            <span style={{
              fontSize: '12px', opacity: 0.6, transition: 'transform 0.25s',
              transform: uretimAcik ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}>▼</span>
          </button>

          {/* İçerik — açık/kapalı */}
          {uretimAcik && (
            <div style={{ padding: '0 8px 10px' }}>
              {uretimItems.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    borderRadius: '10px',
                    paddingLeft: '18px',
                    borderLeft: activePage === item.id ? '3px solid #D4A847' : '3px solid transparent',
                  }}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

        </div>

        {/* DİĞER — küçük accordion */}
        <div style={{ marginTop: '8px' }}>
          <button onClick={() => setDigerAcik(p => !p)} style={{
            width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit',
            color: 'rgba(255,255,255,0.3)', fontWeight: '700', fontSize: '12px', letterSpacing: '1.2px',
            textTransform: 'uppercase',
          }}>
            <span style={{ flex: 1, textAlign: 'left' }}>Diğer</span>
            <span style={{
              fontSize: '10px', transition: 'transform 0.25s',
              transform: digerAcik ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}>▼</span>
          </button>

          {digerAcik && digerItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
        <a href="/operator" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(46,204,113,0.15), rgba(39,174,96,0.1))', color: '#2ecc71', textDecoration: 'none', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(46,204,113,0.2)' }}>
          <span>📱</span>
          <span>Operatör Tablet Ekranı</span>
        </a>
      </div>

    </aside>

  );

}



// ========== TOAST ==========

function Toast({ toasts }) {

  return (

    <div className="toast-container">

      {toasts.map(t => (

        <div key={t.id} className={`toast toast-${t.type}`}>

          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>

          <span>{t.message}</span>

        </div>

      ))}

    </div>

  );

}



// ========== MODAL: YENİ MODEL ==========

function NewModelModal({ onClose, onSave }) {

  const DRAFT_KEY = 'kamera_panel_new_model_draft';
  const getInitialForm = () => {
    const defaults = {
      name: '', code: '', order_no: '', customer: '', modelist: '',
      description: '', status: 'orijinal_numune', fabric_type: '', sizes: '',
      size_range: '', total_order: '', total_order_text: '',
      fason_price: '', fason_price_text: '',
      model_difficulty: 5,
      delivery_date: '', measurement_table: '', post_sewing: '',
      garni: '',
      color_count: '', color_details: '',
      size_count: '', size_distribution: '',
      asorti: '',
      // Operasyon alt kırılımları
      total_operations: '',
      op_kesim_count: '', op_kesim_details: '',
      op_dikim_count: '', op_dikim_details: '',
      op_dikim_rows: [
        { id: 1, makine: 'Düz Makina', adet: '', detay: '' },
        { id: 2, makine: 'Overlok', adet: '', detay: '' },
        { id: 3, makine: 'Reçme', adet: '', detay: '' },
      ],
      op_utu_paket_count: '', op_utu_paket_details: '',
      op_nakis_count: '', op_nakis_details: '',
      op_yikama_count: '', op_yikama_details: '',
      // Tela bilgisi
      has_lining: false, lining_pieces: '',
      has_interlining: false, interlining_parts: '', interlining_count: '',
      // Toplam parça
      piece_count: '', piece_count_details: '',
      difficult_points: '', critical_points: '', customer_requests: '',
      work_start_date: '', front_image: '', back_image: ''
    };
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) { const parsed = JSON.parse(saved); return { ...defaults, ...parsed }; }
      } catch { }
    }
    return defaults;
  };
  const [form, setForm] = useState(getInitialForm);

  // Otomatik taslak kaydetme (sayfa kapansa bile kaybolmaz)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [form]);

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(DRAFT_KEY); } catch { }
    }
  };

  const [saving, setSaving] = useState(false);

  const [frontPreview, setFrontPreview] = useState(null);

  const [backPreview, setBackPreview] = useState(null);

  const [uploading, setUploading] = useState({ front: false, back: false });

  const [themeColor, setThemeColor] = useState('emerald');



  const themes = {

    emerald: { name: 'Zümrüt Yeşili', primary: '#0D7C66', secondary: '#C5A038', gradient: 'linear-gradient(135deg, #0D7C66 0%, #14a085 50%, #0D7C66 100%)', accent: '#0D7C66', gold: '#C5A038', bg: 'rgba(13,124,102,0.06)', border: 'rgba(13,124,102,0.2)' },

    gold: { name: 'Altın Sarısı', primary: '#C5A038', secondary: '#0D7C66', gradient: 'linear-gradient(135deg, #C5A038 0%, #D4AF37 50%, #C5A038 100%)', accent: '#C5A038', gold: '#0D7C66', bg: 'rgba(197,160,56,0.06)', border: 'rgba(197,160,56,0.2)' },

    ocean: { name: 'Okyanus', primary: '#1a5276', secondary: '#C5A038', gradient: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #1a5276 100%)', accent: '#1a5276', gold: '#C5A038', bg: 'rgba(26,82,118,0.06)', border: 'rgba(26,82,118,0.2)' }

  };

  const T = themes[themeColor];



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    setSaving(true);
    try {
      // Dikim toplam adet — satırlardan otomatik hesapla
      const dikimToplam = form.op_dikim_rows.reduce((s, r) => s + (parseInt(r.adet) || 0), 0);
      // Dikim detay özeti — satırlardan oluştur
      const dikimDetay = form.op_dikim_rows
        .filter(r => r.makine || r.adet)
        .map(r => `${r.makine}${r.adet ? ': ' + r.adet + ' adet' : ''}${r.detay ? ' (' + r.detay + ')' : ''}`)
        .join(', ');
      // Toplam operasyon = alt kırılımların toplamı (otomatik hesapla)
      const autoTotalOps = (parseInt(form.op_kesim_count) || 0) + dikimToplam +
        (parseInt(form.op_utu_paket_count) || 0) + (parseInt(form.op_nakis_count) || 0) + (parseInt(form.op_yikama_count) || 0);
      await onSave({
        ...form,
        total_order: parseInt(form.total_order) || 0,
        fason_price: parseFloat(form.fason_price) || 0,
        model_difficulty: parseInt(form.model_difficulty) || 5,
        has_lining: form.has_lining ? 1 : 0,
        has_interlining: form.has_interlining ? 1 : 0,
        lining_pieces: parseInt(form.lining_pieces) || 0,
        color_count: parseInt(form.color_count) || 0,
        size_count: form.size_count,
        op_dikim_count: dikimToplam,
        op_dikim_details: dikimDetay,
        total_operations: autoTotalOps || parseInt(form.total_operations) || 0,
        piece_count: parseInt(form.piece_count) || 0,
      });
      clearDraft(); // Başarılı kayıt sonrası taslağı temizle
    } finally { setSaving(false); }
  };



  const postSewingOps = ['Ütü', 'Yıkama', 'Boyama', 'Baskı', 'Nakış', 'Paketleme', 'Etiketleme', 'Kalite Kontrol'];

  const togglePost = (op) => {

    const arr = form.post_sewing ? form.post_sewing.split(',').map(s => s.trim()).filter(Boolean) : [];

    const next = arr.includes(op) ? arr.filter(x => x !== op) : [...arr, op];

    setForm({ ...form, post_sewing: next.join(', ') });

  };



  // ===== GÖRSEL YÜKLEME =====

  const handleImageUpload = async (file, side) => {

    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowed.includes(file.type)) { alert('Sadece JPG, PNG, WebP veya GIF dosyaları yükleyebilirsiniz.'); return; }

    if (file.size > 10 * 1024 * 1024) { alert('Dosya boyutu 10MB\'dan küçük olmalı.'); return; }



    // Önizleme

    const reader = new FileReader();

    reader.onload = (e) => { if (side === 'front') setFrontPreview(e.target.result); else setBackPreview(e.target.result); };

    reader.readAsDataURL(file);



    // Sunucuya yükle

    setUploading(prev => ({ ...prev, [side]: true }));

    try {

      const fd = new FormData();

      fd.append('file', file);

      fd.append('type', 'photos');

      fd.append('model_code', form.code || 'yeni');

      fd.append('operation_name', side === 'front' ? 'on_gorsel' : 'arka_gorsel');

      const res = await fetch('/api/upload', { method: 'POST', body: fd });

      const data = await res.json();

      if (data.url) {

        setForm(prev => ({ ...prev, [side === 'front' ? 'front_image' : 'back_image']: data.url }));

      }

    } catch (err) { console.error('Upload hatası:', err); }

    finally { setUploading(prev => ({ ...prev, [side]: false })); }

  };



  const handleDrop = (e, side) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer?.files?.[0]; if (file) handleImageUpload(file, side); };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };



  // ===== SESLE GİRİŞ (Speech-to-Text) — Türkçe & Arapça =====

  const [listeningField, setListeningField] = useState(null);

  const [voiceLang, setVoiceLang] = useState('tr-TR');

  const recognitionRef = useRef(null);



  const stopVoiceInput = () => {

    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { } recognitionRef.current = null; }

    setListeningField(null);

  };



  const startVoiceInput = (fieldKey) => {

    if (listeningField === fieldKey) { stopVoiceInput(); return; }

    if (listeningField) stopVoiceInput();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) { alert('Tarayıcınız sesle girişi desteklemiyor. Chrome veya Edge kullanın.'); return; }

    const recognition = new SpeechRecognition();

    recognition.lang = voiceLang;

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    setListeningField(fieldKey);

    let finalTranscript = '';

    recognition.onresult = (event) => {

      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {

        const t = event.results[i][0].transcript;

        if (event.results[i].isFinal) { finalTranscript += t + ' '; } else { interim = t; }

      }

      const combined = (finalTranscript + interim).trim();

      if (combined) setForm(prev => ({ ...prev, [fieldKey]: prev[fieldKey] ? prev[fieldKey] + ' ' + combined : combined }));

    };

    recognition.onerror = (e) => { if (e.error !== 'no-speech') stopVoiceInput(); };

    recognition.onend = () => { setListeningField(null); recognitionRef.current = null; };

    recognition.start();

    setTimeout(() => { if (recognitionRef.current === recognition) stopVoiceInput(); }, 30000);

  };



  const sectionTitle = (icon, text) => (<div style={{ fontSize: '14px', fontWeight: '700', color: T.accent, marginBottom: '12px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${T.border}`, paddingBottom: '8px' }}>{icon} {text}</div>);



  const F = (label, key, placeholder, type = 'text', extra = {}) => (

    <div className="form-group">

      <label className="form-label">{label}</label>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>

        <input className="form-input" type={type} placeholder={placeholder}

          value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}

          style={{ paddingRight: '62px' }} {...extra} />

        <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '2px' }}>

          <button type="button" onClick={() => setVoiceLang(voiceLang === 'tr-TR' ? 'ar-SA' : 'tr-TR')}

            title={voiceLang === 'tr-TR' ? 'Türkçe — Arapçaya geçmek için tıklayın' : 'العربية — للتركية اضغط'}

            style={{

              background: 'transparent', border: 'none', cursor: 'pointer',

              fontSize: '12px', padding: '2px', borderRadius: '4px',

              opacity: 0.7, transition: 'opacity 0.2s'

            }}>{voiceLang === 'tr-TR' ? '🇹🇷' : '🇸🇦'}</button>

          <button type="button" onClick={() => startVoiceInput(key)}

            title={listeningField === key ? 'Dinlemeyi durdur' : (voiceLang === 'tr-TR' ? 'Sesle giriş — Türkçe konuşun' : 'الإدخال الصوتي — تحدث بالعربية')}

            style={{

              background: listeningField === key ? '#e74c3c' : 'transparent',

              color: listeningField === key ? '#fff' : 'var(--text-muted)',

              border: 'none', borderRadius: '50%', width: '26px', height: '26px',

              display: 'flex', alignItems: 'center', justifyContent: 'center',

              cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease',

              animation: listeningField === key ? 'mic-pulse 1s ease-in-out infinite' : 'none'

            }}>{listeningField === key ? '⏹' : '🎤'}</button>

        </div>

      </div>

    </div>

  );



  // Sesli textarea helper
  const FT = (label, key, placeholder, rows = 3) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <textarea className="form-textarea" rows={rows} placeholder={placeholder}
          value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
          style={{ paddingRight: '62px', fontSize: '13px' }} />
        <div style={{ position: 'absolute', right: '4px', top: '8px', display: 'flex', alignItems: 'center', gap: '2px', zIndex: 2 }}>
          <button type="button" onClick={() => setVoiceLang(voiceLang === 'tr-TR' ? 'ar-SA' : 'tr-TR')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px', borderRadius: '4px', opacity: 0.7 }}>{voiceLang === 'tr-TR' ? '🇹🇷' : '🇸🇦'}</button>
          <button type="button" onClick={() => startVoiceInput(key)}
            style={{
              background: listeningField === key ? '#e74c3c' : 'transparent',
              color: listeningField === key ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: '50%', width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease',
              animation: listeningField === key ? 'mic-pulse 1s ease-in-out infinite' : 'none'
            }}>{listeningField === key ? '⏹' : '🎤'}</button>
        </div>
      </div>
    </div>
  );

  // Sesli bare input helper (label dışarıda olacak şekilde)
  const VI = (key, placeholder, type = 'text', extraStyle = {}) => (
    <div style={{ position: 'relative' }}>
      <input className="form-input" type={type} placeholder={placeholder}
        value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
        style={{ paddingRight: '56px', ...extraStyle }} />
      <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button type="button" onClick={() => startVoiceInput(key)}
          style={{
            background: listeningField === key ? '#e74c3c' : 'transparent',
            color: listeningField === key ? '#fff' : 'var(--text-muted)',
            border: 'none', borderRadius: '50%', width: '24px', height: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s ease',
            animation: listeningField === key ? 'mic-pulse 1s ease-in-out infinite' : 'none'
          }}>{listeningField === key ? '⏹' : '🎤'}</button>
      </div>
    </div>
  );



  return (

    <div className="modal-overlay" onClick={onClose}>

      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px', borderTop: `3px solid ${T.primary}` }}>



        {/* ===== PREMIUM HEADER ===== */}

        <div style={{ background: T.gradient, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>

          {/* Dekoratif desen */}

          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

            <div>

              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px', fontFamily: 'Georgia, serif' }}>

                👗 Yeni Model Oluştur

              </h2>

              <div style={{ marginTop: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: '500', fontStyle: 'italic', letterSpacing: '1px', fontFamily: 'Georgia, serif' }}>

                ✧ 2026 İlkbahar / Yaz Sezonu Koleksiyonu

              </div>

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', padding: '5px 14px', borderRadius: '20px', fontWeight: '600', letterSpacing: '0.3px' }}>

                  📅 {new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}  {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}

                </span>

                <button className="modal-close" onClick={onClose} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>

              </div>

            </div>

          </div>

        </div>



        {/* ===== RENK SEÇENEKLERİ ===== */}

        <div style={{ padding: '10px 24px', background: T.bg, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <span style={{ fontSize: '11px', fontWeight: '600', color: T.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>🎨 Tema Rengi</span>

          <div style={{ display: 'flex', gap: '8px' }}>

            {Object.entries(themes).map(([key, t]) => (

              <button key={key} type="button" onClick={() => setThemeColor(key)}

                style={{

                  display: 'flex', alignItems: 'center', gap: '6px',

                  padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',

                  border: themeColor === key ? `2px solid ${t.primary}` : '2px solid var(--border-color)',

                  background: themeColor === key ? t.primary : 'var(--bg-input)',

                  color: themeColor === key ? '#fff' : 'var(--text-secondary)',

                  transition: 'all 0.2s ease'

                }}

              >

                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.primary, border: '1px solid rgba(0,0,0,0.1)' }} />

                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.secondary, border: '1px solid rgba(0,0,0,0.1)' }} />

                {t.name}

              </button>

            ))}

          </div>

        </div>



        <form onSubmit={handleSubmit} style={{ maxHeight: '65vh', overflowY: 'auto' }}>



          {/* ===== ÖN / ARKA GÖRSEL ALANI ===== */}

          <div style={{ padding: '16px 20px 0', marginBottom: '4px' }}>

            <div style={{ fontSize: '14px', fontWeight: '700', color: T.accent, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${T.border}`, paddingBottom: '8px' }}>📸 Ürün Görselleri</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {['front', 'back'].map(side => {

                const preview = side === 'front' ? frontPreview : backPreview;

                const isUp = uploading[side];

                const label = side === 'front' ? 'ÖN GÖRSEL' : 'ARKA GÖRSEL';

                return (

                  <div key={side}

                    onDrop={e => handleDrop(e, side)} onDragOver={handleDragOver}

                    onClick={() => { const inp = document.getElementById(`img-input-${side}`); if (inp) inp.click(); }}

                    style={{

                      position: 'relative', width: '100%', minHeight: '320px', background: preview ? 'transparent' : T.bg,

                      border: preview ? `2px solid ${T.accent}` : `2px dashed ${T.border}`,

                      borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',

                      cursor: 'pointer', overflow: 'hidden', transition: 'all 0.3s ease'

                    }}

                  >

                    <input type="file" id={`img-input-${side}`} accept="image/*" style={{ display: 'none' }}

                      onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], side); }} />

                    {preview ? (

                      <>

                        <img src={preview} alt={label} style={{ width: '100%', height: '300px', objectFit: 'contain', padding: '8px', borderRadius: '10px' }} />

                        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: T.primary, color: '#fff', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>

                          ✅ {label} Yüklendi — Değiştirmek için tıklayın

                        </div>

                      </>

                    ) : (

                      <div style={{ textAlign: 'center', padding: '20px' }}>

                        {isUp ? (

                          <>

                            <div style={{ fontSize: '32px', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>⏳</div>

                            <div style={{ fontSize: '13px', fontWeight: '600', color: T.accent }}>Yükleniyor...</div>

                          </>

                        ) : (

                          <>

                            <div style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.4 }}>{side === 'front' ? '👗' : '🧥'}</div>

                            <div style={{ fontSize: '14px', fontWeight: '700', color: T.accent, marginBottom: '6px' }}>{label}</div>

                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tıklayın veya sürükleyin</div>

                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 10px', background: 'var(--bg-card)', borderRadius: '12px', display: 'inline-block' }}>JPG, PNG, WebP  Max 10MB</div>

                          </>

                        )}

                      </div>

                    )}

                  </div>

                );

              })}

            </div>

          </div>



          {/* ===== TEMEL BİLGİLER ===== */}

          <div style={{ padding: '0 20px' }}>

            {sectionTitle('📋', 'Temel Bilgiler')}

            <div className="form-row">{F('Model Adı *', 'name', 'örn: Yazlık Gömlek')}{F('Model Kodu *', 'code', 'örn: GM-2025-001')}</div>

            <div className="form-row">{F('Sipariş No', 'order_no', 'SIP-001')}{F('Müşteri', 'customer', 'Müşteri adı')}</div>

            <div className="form-row">{F('Modelist', 'modelist', 'Modelist adı')}{F('Kumaş Türü', 'fabric_type', 'örn: Penye, Dokuma')}</div>

            <div className="form-row">
              {/* MADDE 1: Sipariş Adeti — Rakam + Yazı */}
              <div className="form-group">
                <label className="form-label">📦 Sipariş Adeti</label>
                {VI('total_order', 'örn: 5000 adet', 'text')}
                <div style={{ marginTop: '6px' }}>{VI('total_order_text', 'Açıklama (örn: 500 adet yazlık gömlek)', 'text', { fontSize: '12px' })}</div>
              </div>

              {/* MADDE 2: Fason Fiyat — Serbest Giriş */}
              <div className="form-group">
                <label className="form-label">💰 Fason Fiyat (₺)</label>
                {VI('fason_price', 'örn: 120 TL, KDV dahil', 'text')}
                <div style={{ marginTop: '6px' }}>{VI('fason_price_text', 'Ek açıklama (örn: kumaş hariç, astar dahil)')}</div>
              </div>
            </div>

          </div>



          {sectionTitle('📝', 'Ürün Detayları')}

          <div className="form-row">{F('Garni', 'garni', 'Garni bilgisi')}
            {/* MADDE 3: Renk Sayısı + Renk Detayları */}
            <div className="form-group">
              <label className="form-label">🎨 Renk Sayısı & Detayları</label>
              {VI('color_count', 'Renk sayısı (rakam)', 'number')}
              <div style={{ marginTop: '6px' }}>{VI('color_details', 'Renkleri yazın (örn: Siyah, Beyaz, Kırmızı, Mavi)')}</div>
            </div>
          </div>

          <div className="form-row">
            {/* MADDE 4: Beden Sayısı + Dağılım */}
            <div className="form-group">
              <label className="form-label">📐 Beden Sayısı & Dağılımı</label>
              {VI('size_count', 'Kaç beden? (örn: 4)', 'text')}
              <div style={{ marginTop: '6px' }}>{VI('size_distribution', 'Dağılım (örn: S:1, M:2, L:2, XL:1)')}</div>
            </div>

            {/* MADDE 5: Asorti — Rakam + Yazı */}
            {FT('🔢 Asorti', 'asorti', 'Asorti bilgisi yazın\nörn: S:1, M:2, L:2, XL:1 — toplam 6 adet', 2)}
          </div>

          {/* MADDE 6: Operasyon Alt Kırılımları */}
          {sectionTitle('⚙️', 'Operasyon Kırılımları')}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', margin: '0 0 12px 0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
              {(() => {
                const total = (parseInt(form.op_kesim_count) || 0) + (parseInt(form.op_dikim_count) || 0) +
                  (parseInt(form.op_utu_paket_count) || 0) + (parseInt(form.op_nakis_count) || 0) + (parseInt(form.op_yikama_count) || 0);
                return <span style={{ fontSize: '13px', fontWeight: '700', color: T.primary }}>Toplam Operasyon: {total || '--'}</span>;
              })()}
            </div>

            {/* Kesim */}
            <div style={{ marginBottom: '10px', padding: '10px', background: 'rgba(52,152,219,0.06)', borderRadius: '8px', border: '1px solid rgba(52,152,219,0.15)' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#2980b9', marginBottom: '6px', display: 'block' }}>✂️ Kesim Operasyonu</label>
              <div className="form-row" style={{ gap: '8px', marginBottom: '0' }}>
                <input className="form-input" type="number" placeholder="Adet" value={form.op_kesim_count} onChange={e => setForm({ ...form, op_kesim_count: e.target.value })} style={{ maxWidth: '80px' }} />
                {VI('op_kesim_details', 'Detay (örn: Beden kesimi, Garni kesimi, Tüp kesimi, Tela kesimi, Taş kesimi)')}
              </div>
            </div>

            {/* Dikim */}
            <div style={{ marginBottom: '10px', padding: '12px', background: 'rgba(155,89,182,0.06)', borderRadius: '8px', border: '1px solid rgba(155,89,182,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#8e44ad', margin: 0 }}>🧵 Dikim Operasyonu</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#8e44ad', fontWeight: '600' }}>
                    Toplam: {form.op_dikim_rows.reduce((s, r) => s + (parseInt(r.adet) || 0), 0) || '--'} adet
                  </span>
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, op_dikim_rows: [...prev.op_dikim_rows, { id: Date.now(), makine: '', adet: '', detay: '' }] }))}
                    style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #8e44ad', background: 'rgba(142,68,173,0.12)', color: '#8e44ad', cursor: 'pointer', fontWeight: '700' }}
                  >+ Satır Ekle</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '28px 140px 64px 1fr 28px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                <span></span>
                <span style={{ fontSize: '11px', color: '#8e44ad', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Makine Tipi</span>
                <span style={{ fontSize: '11px', color: '#8e44ad', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adet</span>
                <span style={{ fontSize: '11px', color: '#8e44ad', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Açıklama / Detay</span>
                <span></span>
              </div>
              {form.op_dikim_rows.map((row, idx) => (
                <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '28px 140px 64px 1fr 28px', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#8e44ad', fontWeight: '700', textAlign: 'center' }}>{idx + 1}</span>
                  <select
                    className="form-input"
                    value={row.makine}
                    onChange={e => {
                      const rows = form.op_dikim_rows.map((r, i) => i === idx ? { ...r, makine: e.target.value } : r);
                      setForm({ ...form, op_dikim_rows: rows });
                    }}
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  >
                    <option value="">Makine seç...</option>
                    <option value="Düz Makina">🖥️ Düz Makina</option>
                    <option value="Overlok">⚙️ Overlok</option>
                    <option value="Reçme">🔩 Reçme</option>
                    <option value="Çift İğne">🪡 Çift İğne</option>
                    <option value="Zincir Dikiş">🔗 Zincir Dikiş</option>
                    <option value="Nakış Makinesi">✨ Nakış Makinesi</option>
                    <option value="Diğer">📌 Diğer</option>
                  </select>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Adet"
                    min="0"
                    value={row.adet}
                    onChange={e => {
                      const rows = form.op_dikim_rows.map((r, i) => i === idx ? { ...r, adet: e.target.value } : r);
                      setForm({ ...form, op_dikim_rows: rows, op_dikim_count: rows.reduce((s, r) => s + (parseInt(r.adet) || 0), 0).toString() });
                    }}
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Açıklama (örn: Kol birleştirme, Yaka takma)"
                    value={row.detay}
                    onChange={e => {
                      const rows = form.op_dikim_rows.map((r, i) => i === idx ? { ...r, detay: e.target.value } : r);
                      setForm({ ...form, op_dikim_rows: rows });
                    }}
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
                  <button type="button"
                    onClick={() => {
                      if (form.op_dikim_rows.length === 1) return;
                      const rows = form.op_dikim_rows.filter((_, i) => i !== idx);
                      setForm({ ...form, op_dikim_rows: rows, op_dikim_count: rows.reduce((s, r) => s + (parseInt(r.adet) || 0), 0).toString() });
                    }}
                    title="Bu satırı sil"
                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', background: form.op_dikim_rows.length === 1 ? 'rgba(0,0,0,0.05)' : 'rgba(231,76,60,0.12)', color: form.op_dikim_rows.length === 1 ? '#ccc' : '#e74c3c', cursor: form.op_dikim_rows.length === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                </div>
              ))}
            </div>

            {/* Ütü & Paket */}
            <div style={{ marginBottom: '10px', padding: '10px', background: 'rgba(230,126,34,0.06)', borderRadius: '8px', border: '1px solid rgba(230,126,34,0.15)' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#d35400', marginBottom: '6px', display: 'block' }}>♨️ Ütü & Paket</label>
              <div className="form-row" style={{ gap: '8px', marginBottom: '0' }}>
                <input className="form-input" type="number" placeholder="Adet" value={form.op_utu_paket_count} onChange={e => setForm({ ...form, op_utu_paket_count: e.target.value })} style={{ maxWidth: '80px' }} />
                {VI('op_utu_paket_details', 'Detay (örn: Ara ütü, Son ütü, Katlama, Etiket, Paket)')}
              </div>
            </div>

            {/* Nakış */}
            <div style={{ marginBottom: '10px', padding: '10px', background: 'rgba(241,196,15,0.06)', borderRadius: '8px', border: '1px solid rgba(241,196,15,0.15)' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#f39c12', marginBottom: '6px', display: 'block' }}>🪡 Nakış</label>
              <div className="form-row" style={{ gap: '8px', marginBottom: '0' }}>
                <input className="form-input" type="number" placeholder="Adet" value={form.op_nakis_count} onChange={e => setForm({ ...form, op_nakis_count: e.target.value })} style={{ maxWidth: '80px' }} />
                {VI('op_nakis_details', 'Detay (örn: Logo nakış, Biye nakış, Desen nakış)')}
              </div>
            </div>

            {/* Yıkama */}
            <div style={{ padding: '10px', background: 'rgba(26,188,156,0.06)', borderRadius: '8px', border: '1px solid rgba(26,188,156,0.15)' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#16a085', marginBottom: '6px', display: 'block' }}>🌊 Yıkama</label>
              <div className="form-row" style={{ gap: '8px', marginBottom: '0' }}>
                <input className="form-input" type="number" placeholder="Adet" value={form.op_yikama_count} onChange={e => setForm({ ...form, op_yikama_count: e.target.value })} style={{ maxWidth: '80px' }} />
                {VI('op_yikama_details', 'Detay (örn: Taş yıkama, Enzim yıkama, Silikon yıkama)')}
              </div>
            </div>
          </div>

          {/* MADDE 7: Tela Bilgisi (Genişletilmiş) + MADDE 8: Toplam Parça */}
          {sectionTitle('🧵', 'Astar & Tela & Parça Bilgisi')}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={form.has_lining} onChange={e => setForm({ ...form, has_lining: e.target.checked })} /> Astar Var mı?
              </label>
              {form.has_lining && <input className="form-input" type="number" placeholder="Astar Parça Sayısı" value={form.lining_pieces} onChange={e => setForm({ ...form, lining_pieces: e.target.value })} style={{ marginTop: '8px' }} />}
            </div>

            {/* MADDE 7: Tela — Genişletilmiş */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={form.has_interlining} onChange={e => setForm({ ...form, has_interlining: e.target.checked })} /> Tela Var mı?
              </label>
              {form.has_interlining && (
                <div style={{ marginTop: '8px' }}>
                  <input className="form-input" type="number" placeholder="Toplamda kaç parçada tela var?" value={form.interlining_count} onChange={e => setForm({ ...form, interlining_count: e.target.value })} />
                  <div style={{ marginTop: '6px' }}>{VI('interlining_parts', 'Hangi parçalarda? (örn: Yaka, Manşet, Pat, Cep kapağı)')}</div>
                </div>
              )}
            </div>
          </div>

          {/* MADDE 8: Toplam Parça */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">🧩 Toplam Parça Sayısı</label>
              {VI('piece_count', 'örn: 7 parça', 'text')}
              <div style={{ marginTop: '6px' }}>{VI('piece_count_details', 'Detay (örn: Ön beden, Arka beden, 2 Kol, Yaka, 2 Cep = 7 parça)')}</div>
            </div>
          </div>



          {sectionTitle('⚠️', 'Zorluk & Kritik Noktalar')}

          {FT('⚠️ Zor & Dikkat Noktaları', 'difficult_points', 'Modeldeki zor noktaları belirtin...')}

          {FT('🚨 Kritik Noktalar', 'critical_points', 'Kesinlikle dikkat edilmesi gereken noktalar...')}

          {FT('📋 Müşteri Özel İstekleri', 'customer_requests', 'Müşterinin özel talepleri...')}



          {sectionTitle('📅', 'Tarihler & Ölçü')}

          <div className="form-row">

            {F('İşe Başlama Tarihi', 'work_start_date', '', 'date')}

            {F('Sevk Tarihi', 'delivery_date', '', 'date')}

          </div>

          <div className="form-row">{F('Bedenler', 'sizes', 'S, M, L, XL')}{F('Beden Aralığı', 'size_range', '36-44')}</div>



          {sectionTitle('✂️', 'Dikimden Sonra Yapılacak İşlemler')}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>

            {postSewingOps.map(op => {

              const sel = form.post_sewing?.includes(op);

              return (<button key={op} type="button" onClick={() => togglePost(op)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: sel ? '2px solid var(--accent)' : '2px solid var(--border-color)', background: sel ? 'var(--accent-soft)' : 'var(--bg-input)', color: sel ? 'var(--accent)' : 'var(--text-secondary)', fontFamily: 'inherit' }}>{op}</button>);

            })}

          </div>



          <div className="form-group"><label className="form-label">Zorluk (1-10)</label><input className="form-input" type="range" min="1" max="10" value={form.model_difficulty} onChange={e => setForm({ ...form, model_difficulty: e.target.value })} /><div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--accent)' }}>{form.model_difficulty}/10</div></div>

          <div className="form-group"><label className="form-label">📊 Ürün Durumu</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ padding: '10px', fontWeight: '600' }}><option value="orijinal_numune">🟢 Orijinal Numune</option><option value="ilk_uretim_numunesi">🔵 İlk Üretim Numunesi</option><option value="uretim_numunesi">🟡 Üretim Numunesi</option><option value="numune_onaylandi">✅ Numune Onaylandı</option><option value="uretimde">🟠 Üretimde</option><option value="uretim_tamamlandi">🏁 Üretim Tamamlandı</option><option value="sayi_seti">📦 Sayı Seti</option><option value="sevk_edildi">🚚 Sevk Edildi</option></select></div>

          {FT('📝 Açıklama', 'description', 'Model hakkında notlar...')}



          {/* MADDE 9: Otomatik Taslak Bilgilendirmesi */}
          <div style={{ padding: '8px 16px', background: 'rgba(46,204,113,0.08)', borderRadius: '8px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(46,204,113,0.2)' }}>
            <span style={{ fontSize: '11px', color: '#27ae60' }}>💾 Verileriniz otomatik kaydediliyor — sayfa kapansa bile form korunur</span>
            <button type="button" onClick={() => { if (confirm('Tüm form verilerini silmek istediğinize emin misiniz?')) { clearDraft(); setForm(getInitialForm()); } }} style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', color: '#e74c3c', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>🗑️ Taslağı Temizle</button>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
            </button>
          </div>

        </form>

      </div>

    </div>

  );

}



// ========== MODAL: YENİ İŞLEM ==========

function NewOperationModal({ modelId, operationCount, onClose, onSave }) {

  const [form, setForm] = useState({

    name: '', order_number: operationCount + 1, description: '',

    difficulty: 5, machine_type: '', thread_material: '',

    needle_type: '', stitch_per_cm: '',

    quality_notes: '', quality_tolerance: '', error_examples: '',

    standard_time_min: '', standard_time_max: '', unit_price: '',

    dependency: '', written_instructions: '', how_to_do: '',

    tolerance_minus: '1', tolerance_plus: '1', optical_appearance: '',

    video_path: null, audio_path: null,

    correct_photo_path: null, incorrect_photo_path: null,

    required_skill_level: '3_sinif', operation_category: 'dikim'

  });



  // ===== MEDYA YÜKLEME STATE =====

  const [videoUploading, setVideoUploading] = useState(false);

  const [audioUploading, setAudioUploading] = useState(false);

  const [videoProgress, setVideoProgress] = useState(0);

  const [audioProgress, setAudioProgress] = useState(0);

  const [dragOverVideo, setDragOverVideo] = useState(false);

  const [dragOverAudio, setDragOverAudio] = useState(false);



  // Dosya yükleme fonksiyonu

  const uploadFile = async (file, fileType) => {

    const isVideo = fileType === 'videos';

    if (isVideo) setVideoUploading(true); else setAudioUploading(true);

    if (isVideo) setVideoProgress(0); else setAudioProgress(0);



    try {

      const formData = new FormData();

      formData.append('file', file);

      formData.append('type', fileType);

      formData.append('model_id', modelId);

      formData.append('operation_id', 'new');



      // Simüle ilerleme (XHR kullanmıyoruz, fetch ile)

      const progressInterval = setInterval(() => {

        if (isVideo) setVideoProgress(p => Math.min(p + 8, 90));

        else setAudioProgress(p => Math.min(p + 8, 90));

      }, 200);



      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      clearInterval(progressInterval);



      if (!res.ok) {

        const err = await res.json();

        throw new Error(err.error || 'Yükleme hatası');

      }



      const data = await res.json();

      if (isVideo) {

        setForm(prev => ({ ...prev, video_path: data.url }));

        setVideoProgress(100);

      } else if (fileType === 'correct_photos') {

        setForm(prev => ({ ...prev, correct_photo_path: data.url }));

      } else if (fileType === 'incorrect_photos') {

        setForm(prev => ({ ...prev, incorrect_photo_path: data.url }));

      } else {

        setForm(prev => ({ ...prev, audio_path: data.url }));

        setAudioProgress(100);

      }

    } catch (err) {

      alert('Yükleme hatası: ' + err.message);

      if (isVideo) setVideoProgress(0); else setAudioProgress(0);

    } finally {

      if (isVideo) setVideoUploading(false); else setAudioUploading(false);

    }

  };



  // Dosya sürükle-bırak ve input handler

  const handleFileDrop = (e, fileType) => {

    e.preventDefault();

    setDragOverVideo(false);

    setDragOverAudio(false);

    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];

    if (file) uploadFile(file, fileType);

  };



  const handleFileSelect = (e, fileType) => {

    const file = e.target.files?.[0];

    if (file) uploadFile(file, fileType);

  };



  // Dosya silme

  const removeFile = async (fileType) => {

    const urlMap = { videos: 'video_path', audios: 'audio_path', correct_photos: 'correct_photo_path', incorrect_photos: 'incorrect_photo_path' };

    const fieldName = urlMap[fileType];

    const url = form[fieldName];

    if (url) {

      try { await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }); } catch { }

    }

    setForm(prev => ({ ...prev, [fieldName]: null }));

    if (fileType === 'videos') setVideoProgress(0);

    if (fileType === 'audios') setAudioProgress(0);

  };



  const formatFileSize = (bytes) => {

    if (bytes < 1024) return bytes + ' B';

    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';

    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  };

  const [activeTab, setActiveTab] = useState('temel');

  const [saving, setSaving] = useState(false);



  // ===== SES KAYDI & TRANSKRİPSİYON STATE =====

  const [isRecording, setIsRecording] = useState(false);

  const [transcript, setTranscript] = useState('');

  const [interimTranscript, setInterimTranscript] = useState('');

  const [recordingTime, setRecordingTime] = useState(0);

  const [transcriptStatus, setTranscriptStatus] = useState('idle'); // idle | recording | review | confirmed

  const [recognition, setRecognition] = useState(null);

  const [recordingTimer, setRecordingTimer] = useState(null);

  // ===== KAMERA ÇEKİM STATE =====
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraRecording, setCameraRecording] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraRecorder, setCameraRecorder] = useState(null);
  const [cameraChunks, setCameraChunks] = useState([]);
  const [cameraRecTime, setCameraRecTime] = useState(0);
  const [cameraTimer, setCameraTimer] = useState(null);
  const cameraVideoRef = useRef(null);

  // ===== SES DOSYA KAYDI STATE =====
  const [audioRecActive, setAudioRecActive] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioRecTime, setAudioRecTime] = useState(0);
  const [audioRecTimer, setAudioRecTimer] = useState(null);

  // Kamera stream'i video elementine bağla
  useEffect(() => {
    if (cameraActive && cameraStream && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraStream;
      cameraVideoRef.current.play().catch(() => { });
    }
  }, [cameraActive, cameraStream]);

  // Kamerayı aç
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      setCameraStream(stream);
      setCameraActive(true);
      if (cameraVideoRef.current) { cameraVideoRef.current.srcObject = stream; cameraVideoRef.current.play(); }
    } catch (err) { alert('Kamera erişim hatası: ' + err.message); }
  };

  // Kamera ile çekimi başlat
  const startCameraRecording = () => {
    if (!cameraStream) return;
    const chunks = [];
    const recorder = new MediaRecorder(cameraStream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], `kamera_kayit_${Date.now()}.webm`, { type: 'video/webm' });
      await uploadFile(file, 'videos');
      stopCamera();
    };
    setCameraChunks(chunks);
    setCameraRecorder(recorder);
    setCameraRecording(true);
    setCameraRecTime(0);
    recorder.start(1000);
    const t = setInterval(() => setCameraRecTime(s => s + 1), 1000);
    setCameraTimer(t);
  };

  // Kamera çekimini durdur
  const stopCameraRecording = () => {
    if (cameraRecorder && cameraRecorder.state !== 'inactive') cameraRecorder.stop();
    if (cameraTimer) clearInterval(cameraTimer);
    setCameraRecording(false);
    setCameraTimer(null);
  };

  // Kamerayı kapat
  const stopCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setCameraActive(false);
    setCameraRecording(false);
    if (cameraTimer) clearInterval(cameraTimer);
  };

  // Tarayıcıdan ses kaydı başlat (dosya olarak kayıt)
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `ses_kayit_${Date.now()}.webm`, { type: 'audio/webm' });
        await uploadFile(file, 'audios');
        setAudioRecActive(false);
      };
      setAudioChunks(chunks);
      setAudioRecorder(recorder);
      setAudioRecActive(true);
      setAudioRecTime(0);
      recorder.start(1000);
      const t = setInterval(() => setAudioRecTime(s => s + 1), 1000);
      setAudioRecTimer(t);
    } catch (err) { alert('Mikrofon erişim hatası: ' + err.message); }
  };

  // Ses kaydını durdur
  const stopAudioRecording = () => {
    if (audioRecorder && audioRecorder.state !== 'inactive') audioRecorder.stop();
    if (audioRecTimer) clearInterval(audioRecTimer);
    setAudioRecTimer(null);
  };



  // Ses kaydını başlat (hem yazıya çevir hem dosya olarak kaydet)

  const voiceMediaRecorderRef = useRef(null);
  const voiceAudioChunksRef = useRef([]);
  const voiceStreamRef = useRef(null);

  const startVoiceRecording = async () => {

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      alert('Tarayıcınız ses tanıma desteklemiyor. Lütfen Chrome veya Edge kullanın.');

      return;

    }

    // MediaRecorder ile ses dosyası kaydet (paralel)
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = audioStream;
      const audioChunks = [];
      voiceAudioChunksRef.current = audioChunks;
      const mediaRec = new MediaRecorder(audioStream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
      mediaRec.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRec.onstop = async () => {
        audioStream.getTracks().forEach(t => t.stop());
        if (audioChunks.length > 0 && !form.audio_path) {
          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          const file = new File([blob], `sesle_kayit_${Date.now()}.webm`, { type: 'audio/webm' });
          await uploadFile(file, 'audios');
        }
      };
      voiceMediaRecorderRef.current = mediaRec;
      mediaRec.start(1000);
    } catch (err) {
      console.warn('Ses dosya kaydı başlatılamadı (yazıya çevirme devam edecek):', err.message);
    }

    const rec = new SpeechRecognition();

    rec.lang = 'tr-TR';

    rec.continuous = true;

    rec.interimResults = true;

    rec.maxAlternatives = 1;



    let fullText = transcript || '';



    rec.onresult = (event) => {

      let interim = '';

      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {

        const t = event.results[i][0].transcript;

        if (event.results[i].isFinal) {

          final += t + ' ';

        } else {

          interim += t;

        }

      }

      if (final) {

        fullText += final;

        setTranscript(fullText);

      }

      setInterimTranscript(interim);

    };



    rec.onerror = (event) => {

      console.error('Ses tanıma hatası:', event.error);

      if (event.error !== 'no-speech') {

        stopVoiceRecording();

      }

    };



    rec.onend = () => {

      // Continuous modda bazen durur, yeniden başlat

      if (isRecording) {

        try { rec.start(); } catch (e) { /* zaten çalışıyor */ }

      }

    };



    rec.start();

    setRecognition(rec);

    setIsRecording(true);

    setTranscriptStatus('recording');

    setRecordingTime(0);



    // Kayıt süresi sayacı

    const timer = setInterval(() => setRecordingTime(t => t + 1), 1000);

    setRecordingTimer(timer);

  };



  // Ses kaydını durdur

  const stopVoiceRecording = () => {

    if (recognition) {

      recognition.onend = null; // Auto-restart'ı engelle

      recognition.stop();

      setRecognition(null);

    }

    // MediaRecorder'ı da durdur (ses dosyası otomatik kaydedilir)
    if (voiceMediaRecorderRef.current && voiceMediaRecorderRef.current.state !== 'inactive') {
      voiceMediaRecorderRef.current.stop();
      voiceMediaRecorderRef.current = null;
    }

    if (recordingTimer) {

      clearInterval(recordingTimer);

      setRecordingTimer(null);

    }

    setIsRecording(false);

    setInterimTranscript('');

    if (transcript.trim()) {

      setTranscriptStatus('review');

    } else {

      setTranscriptStatus('idle');

    }

  };



  // Transkripti onayla ve forma kaydet

  const confirmTranscript = () => {

    const numberedText = transcript.trim().split(/(?<=[.!?])\s+/).filter(Boolean).map((sentence, i) => `${i + 1}. ${sentence.trim()}`).join('\n');

    setForm({ ...form, how_to_do: (form.how_to_do ? form.how_to_do + '\n\n' : '') + numberedText });

    setTranscriptStatus('confirmed');

    setTranscript('');

  };



  // Transkripti reddet / yeniden kaydet

  const resetTranscript = () => {

    setTranscript('');

    setInterimTranscript('');

    setTranscriptStatus('idle');

    setRecordingTime(0);

  };



  const formatRecTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;



  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!form.name) return;

    setSaving(true);

    try {

      await onSave({

        ...form, order_number: parseInt(form.order_number) || 1,

        difficulty: parseInt(form.difficulty) || 5,

        standard_time_min: parseFloat(form.standard_time_min) || null,

        standard_time_max: parseFloat(form.standard_time_max) || null,

        unit_price: parseFloat(form.unit_price) || null,

        quality_tolerance: `${form.tolerance_minus || 0}/${form.tolerance_plus || 0}`

      });

    } finally { setSaving(false); }

  };



  const tabs = [

    { id: 'temel', label: '📏 Temel' },

    { id: 'medya', label: '📋 Medya Yükle' },

    { id: 'yapilis', label: '🎙️ Sesle Kayıt' },

    { id: 'makine', label: '⚙️ Makine' },

    { id: 'kalite', label: '✅ Kalite' },

    { id: 'sure', label: '⏱️ Süre & Fiyat' },

  ];



  return (

    <div className="modal-overlay" onClick={onClose}>

      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px' }}>

        <div className="modal-header">

          <h2 className="modal-title">⚙️ Yeni İşlem Ekle</h2>

          <button className="modal-close" onClick={onClose}>✕</button>

        </div>

        <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-input)' }}>

          {tabs.map(tab => (

            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}

              style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent', background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'inherit' }}>{tab.label}</button>

          ))}

        </div>

        <form onSubmit={handleSubmit} style={{ maxHeight: '65vh', overflowY: 'auto' }}>

          {activeTab === 'temel' && (

            <div style={{ padding: '16px 24px' }}>

              <div className="form-row">

                <div className="form-group"><label className="form-label">İşlem Adı *</label><input className="form-input" placeholder="örn: Yaka Takma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>

                <div className="form-group" style={{ maxWidth: '100px' }}><label className="form-label">Sıra No</label><input className="form-input" type="number" value={form.order_number} onChange={e => setForm({ ...form, order_number: e.target.value })} /></div>

              </div>

              <div className="form-group"><label className="form-label">Açıklama</label><textarea className="form-textarea" placeholder="İşlem hakkında kısa açıklama..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>

              <div className="form-group"><label className="form-label">Zorluk: {form.difficulty}/10</label><input className="form-input" type="range" min="1" max="10" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} /></div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{'\uD83D\uDCCB'} Operasyon Kategorisi</label>
                  <select className="form-input" value={form.operation_category} onChange={e => setForm({ ...form, operation_category: e.target.value })}>
                    <option value="kesim">{'\u2702\uFE0F'} Kesim</option>
                    <option value="nakis_baski">{'\uD83E\uDEA1'} Nak{'\u0131ş'} / Bask{'\u0131'}</option>
                    <option value="dikim">{'\uD83E\uDDF5'} Dikim</option>
                    <option value="temizlik">{'\uD83E\uDDF9'} Temizlik</option>
                    <option value="kalite_kontrol">{'\u2705'} Kalite Kontrol</option>
                    <option value="utu_paket">{'\uD83D\uDD25'} {'\u00DC'}t{'\u00FC'} / Paket</option>
                    <option value="yikama">{'\uD83E\uDDFC'} Y{'\u0131'}kama</option>
                    <option value="diger">{'\uD83D\uDCE6'} Di{'ğ'}er</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{'\u2B50'} Gereken Min. Ustal{'\u0131'}k Seviyesi</label>
                  <select className="form-input" value={form.required_skill_level} onChange={e => setForm({ ...form, required_skill_level: e.target.value })}>
                    <option value="1_sinif">{'\u2B50\u2B50\u2B50'} 1. S{'\u0131'}n{'\u0131'}f</option>
                    <option value="2_sinif">{'\u2B50\u2B50'} 2. S{'\u0131'}n{'\u0131'}f</option>
                    <option value="3_sinif">{'\u2B50'} 3. S{'\u0131'}n{'\u0131'}f</option>
                    <option value="4_sinif">4. S{'\u0131'}n{'\u0131'}f</option>
                    <option value="5_sinif">5. S{'\u0131'}n{'\u0131'}f</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{'\u2699\uFE0F'} Kullan{'\u0131'}lacak Makine</label>
                <select className="form-input" value={form.machine_type} onChange={e => setForm({ ...form, machine_type: e.target.value })}>
                  <option value="">-- Makine Se{'\u00E7'}in --</option>
                  <optgroup label={'\uD83E\uDDF5 Dikiş Makineleri'}>
                    <option value="Düz Dikiş (Tek İğne)">D{'\u00FC'}z Diki{'ş'} (Tek {'İğ'}ne)</option>
                    <option value="Çift İğne Düz Dikiş">{'\u00C7'}ift {'İğ'}ne D{'\u00FC'}z Diki{'ş'}</option>
                    <option value="Zincir Dikiş">Zincir Diki{'ş'}</option>
                    <option value="Çift İğne Zincir Dikiş">{'\u00C7'}ift {'İğ'}ne Zincir Diki{'ş'}</option>
                    <option value="Gizli Dikiş">Gizli Diki{'ş'}</option>
                    <option value="Zigzag">Zigzag</option>
                  </optgroup>
                  <optgroup label={'\uD83D\uDD04 Overlok'}>
                    <option value="3 İplik Overlok">3 {'İ'}plik Overlok</option>
                    <option value="4 İplik Overlok">4 {'İ'}plik Overlok</option>
                    <option value="5 İplik Overlok">5 {'İ'}plik Overlok</option>
                  </optgroup>
                  <optgroup label={'\uD83D\uDCCF Re\u00E7me & Flatlock'}>
                    <option value="2 İğne Reçme">2 {'İğ'}ne Re{'\u00E7'}me</option>
                    <option value="3 İğne Reçme">3 {'İğ'}ne Re{'\u00E7'}me</option>
                    <option value="Bıçaklı Reçme">B{'\u0131\u00E7'}akl{'\u0131'} Re{'\u00E7'}me</option>
                    <option value="Silindir Kol Reçme">Silindir Kol Re{'\u00E7'}me</option>
                    <option value="Flatlock">Flatlock</option>
                  </optgroup>
                  <optgroup label={'\u2699\uFE0F \u00D6zel Operasyon'}>
                    <option value="İlik Makinesi">{'İ'}lik Makinesi</option>
                    <option value="Düğme Dikme Makinesi">D{'\u00FCğ'}me Dikme Makinesi</option>
                    <option value="Punteriz (Bartack)">Punteriz (Bartack)</option>
                    <option value="Kemer Takma Makinesi">Kemer Takma Makinesi</option>
                    <option value="Kollu Makine (Feed-off-the-arm)">Kollu Makine (Feed-off-the-arm)</option>
                    <option value="Çıt Çıt / Rivet Makinesi">{'\u00C7\u0131'}t {'\u00C7\u0131'}t / Rivet Makinesi</option>
                    <option value="Cep Otomatı">Cep Otomat{'\u0131'}</option>
                    <option value="Fermuar Makinesi">Fermuar Makinesi</option>
                    <option value="Lastik Takma Makinesi">Lastik Takma Makinesi</option>
                    <option value="Biye Aparatlı Makine">Biye Aparat{'\u0131'} Makine</option>
                  </optgroup>
                  <optgroup label={'\u2702\uFE0F Kesim'}>
                    <option value="Düz Bıçak Kesim">D{'\u00FC'}z B{'\u0131\u00E7'}ak Kesim</option>
                    <option value="Şerit Bıçak (Band Knife)">{'\u015E'}erit B{'\u0131\u00E7'}ak (Band Knife)</option>
                    <option value="Pastal Serim Makinesi">Pastal Serim Makinesi</option>
                    <option value="CNC Otomatik Kesim">CNC Otomatik Kesim</option>
                  </optgroup>
                  <optgroup label={'\u2668\uFE0F \u00DCt\u00FC & Son İşlem'}>
                    <option value="Buharlı Ütü">Buharl{'\u0131'} {'\u00DC'}t{'\u00FC'}</option>
                    <option value="Vakum Ütü Masası">Vakum {'\u00DC'}t{'\u00FC'} Masas{'\u0131'}</option>
                    <option value="Ütü Presi">{'\u00DC'}t{'\u00FC'} Presi</option>
                    <option value="Buhar Kazanı">Buhar Kazan{'\u0131'}</option>
                  </optgroup>
                  <optgroup label={'\uD83D\uDCCB Yard\u0131mc\u0131'}>
                    <option value="Nakış / Brode Makinesi">Nak{'\u0131ş'} / Brode Makinesi</option>
                    <option value="Etiket Kesme Makinesi">Etiket Kesme Makinesi</option>
                    <option value="Baskı / Transfer Makinesi">Bask{'\u0131'} / Transfer Makinesi</option>
                    <option value="Elle (Makinesiz)">Elle (Makinesiz)</option>
                  </optgroup>
                </select>
              </div>

            </div>

          )}

          {activeTab === 'medya' && (

            <div style={{ padding: '16px 24px' }}>

              {/* BİLGİ KUTUSU */}

              <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.06))', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7', border: '1px solid rgba(245,158,11,0.2)' }}>

                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px', color: 'var(--warning)' }}>📋 Prototip Kayıt Yükleme</div>

                <strong>Nasıl Çalışır:</strong> Prototip üretimi sırasında tabletle çektiĞiniz video ve ses kayıtlarını buradan yükleyin. Dosyalar sisteme kaydedilir ve teknik föyle birlikte seri üretim işletmesine gönderilebilir.

              </div>



              {/* ===== VİDEO YÜKLEME ===== */}

              <div style={{ marginBottom: '20px' }}>

                <label className="form-label" style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>

                  📋 İşlem Videosu

                  {form.video_path && <span className="badge badge-success" style={{ fontSize: '10px' }}>✅ Yüklendi</span>}

                </label>



                {!form.video_path ? (

                  <div

                    onDragOver={e => { e.preventDefault(); setDragOverVideo(true); }}

                    onDragLeave={() => setDragOverVideo(false)}

                    onDrop={e => handleFileDrop(e, 'videos')}

                    onClick={() => document.getElementById('video-file-input').click()}

                    style={{

                      border: `2px dashed ${dragOverVideo ? 'var(--accent)' : 'var(--border-color)'}`,

                      borderRadius: 'var(--radius-lg)',

                      padding: '40px 20px',

                      textAlign: 'center',

                      cursor: 'pointer',

                      background: dragOverVideo ? 'rgba(99,102,241,0.04)' : 'var(--bg-input)',

                      transition: 'all 0.3s'

                    }}>

                    <input id="video-file-input" type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'videos')} />

                    {videoUploading ? (

                      <div>

                        <div style={{ fontSize: '32px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}>⏳</div>

                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Video yükleniyor... %{videoProgress}</div>

                        <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', maxWidth: '300px', margin: '0 auto' }}>

                          <div style={{ height: '100%', width: `${videoProgress}%`, background: 'var(--gradient-accent)', borderRadius: '3px', transition: 'width 0.3s' }} />

                        </div>

                      </div>

                    ) : (

                      <div>

                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>📏</div>

                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>

                          Videoyu buraya sürükleyin veya tıklayın

                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>

                          Tablet/telefon ile çektiĞiniz prototip üretim videosunu yükleyin

                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>

                          Desteklenen: MP4, WebM, MOV, AVI  Max: 500MB

                        </div>

                      </div>

                    )}

                  </div>

                ) : (

                  <div style={{ border: '2px solid var(--success)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-input)' }}>

                    {/* Video Önizleme */}

                    <video controls style={{ width: '100%', maxHeight: '300px', background: '#000' }}>

                      <source src={form.video_path} />

                      Tarayıcınız video oynatmayı desteklemiyor.

                    </video>

                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                        <span style={{ fontSize: '18px' }}>✅</span>

                        <div>

                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--success)' }}>Video başarıyla yüklendi</div>

                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{form.video_path}</div>

                        </div>

                      </div>

                      <button type="button" onClick={() => removeFile('videos')} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid var(--danger)', background: 'rgba(239,68,68,0.06)', color: 'var(--danger)', fontFamily: 'inherit' }}>🗑️ Kaldır</button>

                    </div>

                  </div>

                )}

              </div>



              {/* ===== KAMERADAN DOĞRUDAN ÇEKİM ===== */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  🎥 Kameradan Doğrudan Çek
                  {cameraRecording && <span className="badge badge-danger" style={{ fontSize: '10px', animation: 'pulse 1s infinite' }}>⏺ KAYIT</span>}
                </label>

                {!cameraActive ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={startCamera}
                      style={{ flex: 1, padding: '20px', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--accent)', background: 'rgba(99,102,241,0.04)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '36px' }}>📹</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>Tarayıcı Kamerasını Aç</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bilgisayar veya tablet kamerasıyla çekim yapın</div>
                    </button>
                    <label style={{ flex: 1, padding: '20px', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--success)', background: 'rgba(34,197,94,0.04)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
                      <input type="file" accept="video/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'videos')} />
                      <div style={{ fontSize: '36px' }}>📱</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--success)' }}>Telefon Kamerasıyla Çek</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mobil cihazda doğrudan kamera açılır</div>
                    </label>
                  </div>
                ) : (
                  <div style={{ border: '2px solid var(--accent)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000' }}>
                    <video ref={cameraVideoRef} autoPlay muted playsInline style={{ width: '100%', maxHeight: '300px', display: 'block' }} />
                    <div style={{ padding: '12px 16px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {cameraRecording && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444', fontFamily: 'monospace' }}>{formatRecTime(cameraRecTime)}</span>
                          </div>
                        )}
                        {!cameraRecording && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kamera hazır — çekime başlayın</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!cameraRecording ? (
                          <button type="button" onClick={startCameraRecording}
                            style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', border: 'none', background: '#ef4444', color: '#fff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ⏺ Çekimi Başlat
                          </button>
                        ) : (
                          <button type="button" onClick={stopCameraRecording}
                            style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', border: 'none', background: '#22c55e', color: '#fff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 1.5s infinite' }}>
                            ⏹ Çekimi Durdur & Kaydet
                          </button>
                        )}
                        <button type="button" onClick={stopCamera}
                          style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                          ✕ Kapat
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>



              {/* ===== SES DOSYASI YÜKLEME ===== */}

              <div>

                <label className="form-label" style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>

                  🎙️ İşlem Ses Kaydı

                  {form.audio_path && <span className="badge badge-success" style={{ fontSize: '10px' }}>✅ Yüklendi</span>}
                  {audioRecActive && <span className="badge badge-danger" style={{ fontSize: '10px', animation: 'pulse 1s infinite' }}>⏺ KAYIT</span>}
                </label>

                {/* Mikrofondan Doğrudan Kayıt */}
                {!form.audio_path && (
                  <div style={{ marginBottom: '14px' }}>
                    {!audioRecActive ? (
                      <button type="button" onClick={startAudioRecording}
                        style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)', border: '2px dashed #8b5cf6', background: 'rgba(139,92,246,0.04)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '24px' }}>🎙️</div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#8b5cf6' }}>Mikrofondan Doğrudan Kaydet</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ses kaydı dosya olarak sisteme kaydedilir</div>
                        </div>
                      </button>
                    ) : (
                      <div style={{ padding: '16px', border: '2px solid #ef4444', borderRadius: 'var(--radius-lg)', background: 'rgba(239,68,68,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444', fontFamily: 'monospace' }}>{formatRecTime(audioRecTime)}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Konuşun... Kayıt devam ediyor</span>
                        </div>
                        <button type="button" onClick={stopAudioRecording}
                          style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', border: 'none', background: '#22c55e', color: '#fff', fontFamily: 'inherit' }}>
                          ⏹ Kaydı Durdur & Kaydet
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!form.audio_path ? (

                  <div

                    onDragOver={e => { e.preventDefault(); setDragOverAudio(true); }}

                    onDragLeave={() => setDragOverAudio(false)}

                    onDrop={e => handleFileDrop(e, 'audios')}

                    onClick={() => document.getElementById('audio-file-input').click()}

                    style={{

                      border: `2px dashed ${dragOverAudio ? 'var(--accent)' : 'var(--border-color)'}`,

                      borderRadius: 'var(--radius-lg)',

                      padding: '32px 20px',

                      textAlign: 'center',

                      cursor: 'pointer',

                      background: dragOverAudio ? 'rgba(99,102,241,0.04)' : 'var(--bg-input)',

                      transition: 'all 0.3s'

                    }}>

                    <input id="audio-file-input" type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'audios')} />

                    {audioUploading ? (

                      <div>

                        <div style={{ fontSize: '28px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}>⏳</div>

                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Ses kaydı yükleniyor... %{audioProgress}</div>

                        <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', maxWidth: '300px', margin: '0 auto' }}>

                          <div style={{ height: '100%', width: `${audioProgress}%`, background: 'var(--gradient-accent)', borderRadius: '3px', transition: 'width 0.3s' }} />

                        </div>

                      </div>

                    ) : (

                      <div>

                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>📋</div>

                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>

                          Ses kaydını buraya sürükleyin veya tıklayın

                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>

                          Prototip üretimi sırasında yapılan sözlü anlatım kaydını yükleyin

                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>

                          Desteklenen: MP3, WAV, M4A, OGG, AAC  Max: 500MB

                        </div>

                      </div>

                    )}

                  </div>

                ) : (

                  <div style={{ border: '2px solid var(--success)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-input)' }}>

                    {/* Ses Önizleme */}

                    <div style={{ padding: '16px' }}>

                      <audio controls style={{ width: '100%' }}>

                        <source src={form.audio_path} />

                        Tarayıcınız ses oynatmayı desteklemiyor.

                      </audio>

                    </div>

                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                        <span style={{ fontSize: '18px' }}>✅</span>

                        <div>

                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--success)' }}>Ses kaydı başarıyla yüklendi</div>

                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{form.audio_path}</div>

                        </div>

                      </div>

                      <button type="button" onClick={() => removeFile('audios')} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid var(--danger)', background: 'rgba(239,68,68,0.06)', color: 'var(--danger)', fontFamily: 'inherit' }}>🗑️ Kaldır</button>

                    </div>

                  </div>

                )}

              </div>



              {/* ===== DOĞRU YAPILMIŞ FOTOĞRAF ===== */}

              <div style={{ marginTop: '20px' }}>

                <label className="form-label" style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>

                  ✅ DoĞru Yapılmış Örnek FotoĞraf

                  {form.correct_photo_path && <span className="badge badge-success" style={{ fontSize: '10px' }}>Yüklendi</span>}

                </label>

                {!form.correct_photo_path ? (

                  <div onClick={() => document.getElementById('correct-photo-input').click()}

                    style={{ border: '2px dashed var(--success)', borderRadius: 'var(--radius-md)', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: 'rgba(91,158,95,0.04)', transition: 'all 0.3s' }}>

                    <input id="correct-photo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'correct_photos'); }} />

                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>✅📏</div>

                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--success)' }}>DoĞru yapılmış fotoĞrafı yükleyin</div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Kabul edilebilir kalitede yapılmış örnek ürün fotoĞrafı</div>

                  </div>

                ) : (

                  <div style={{ border: '2px solid var(--success)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>

                    <img src={form.correct_photo_path} alt="DoĞru örnek" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#f9f9f9' }} />

                    <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                      <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>✅ DoĞru örnek yüklendi</span>

                      <button type="button" onClick={() => removeFile('correct_photos')} style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontFamily: 'inherit' }}>Kaldır</button>

                    </div>

                  </div>

                )}

              </div>



              {/* ===== YANLIŞ YAPILMIŞ FOTOĞRAF ===== */}

              <div style={{ marginTop: '16px' }}>

                <label className="form-label" style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>

                  ❌ Yanlış Yapılmış Örnek FotoĞraf

                  {form.incorrect_photo_path && <span className="badge badge-danger" style={{ fontSize: '10px' }}>Yüklendi</span>}

                </label>

                {!form.incorrect_photo_path ? (

                  <div onClick={() => document.getElementById('incorrect-photo-input').click()}

                    style={{ border: '2px dashed var(--danger)', borderRadius: 'var(--radius-md)', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: 'rgba(194,91,91,0.04)', transition: 'all 0.3s' }}>

                    <input id="incorrect-photo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'incorrect_photos'); }} />

                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>❌📏</div>

                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--danger)' }}>Yanlış yapılmış fotoĞrafı yükleyin</div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Kabul edilemez kalitede yapılmış hatalı ürün fotoĞrafı</div>

                  </div>

                ) : (

                  <div style={{ border: '2px solid var(--danger)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>

                    <img src={form.incorrect_photo_path} alt="Yanlış örnek" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#f9f9f9' }} />

                    <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                      <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}>❌ Yanlış örnek yüklendi</span>

                      <button type="button" onClick={() => removeFile('incorrect_photos')} style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontFamily: 'inherit' }}>Kaldır</button>

                    </div>

                  </div>

                )}

              </div>



              {/* İPUÇLARI */}

              <div style={{ marginTop: '20px', padding: '14px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.7' }}>

                <div style={{ fontWeight: '700', marginBottom: '6px' }}>📋 İpuçları:</div>

                <ul style={{ margin: 0, paddingLeft: '18px' }}>

                  <li>Tabletten çektiĞiniz videoyu bilgisayara aktardıktan sonra buradan yükleyebilirsiniz</li>

                  <li>DoĞru/yanlış fotoĞrafları mutlaka yükleyin — operatör karşılaştırma yapacak</li>

                  <li>Dosyalar otomatik olarak standart formatta isimlendirilir</li>

                  <li>Video ve ses kaydı teknik föyle beraber seri üretim işletmesine gönderilir</li>

                </ul>

              </div>

            </div>

          )}

          {activeTab === 'yapilis' && (

            <div style={{ padding: '16px 24px' }}>

              {/* BİLGİ KUTUSU */}

              <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.08))', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7', border: '1px solid rgba(99,102,241,0.2)' }}>

                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px', color: 'var(--accent)' }}>🎙️ Sesle İşlem Kaydı Sistemi</div>

                <strong>Nasıl Çalışır:</strong> Prototip üretimi sırasında işlemi yaparken sesle anlatın → Sistem sesi <strong>otomatik yazıya çevirir</strong> + <strong>ses dosyası olarak kaydeder</strong> → Kontrol edip onaylayın → İşlem talimatı olarak kaydedilir. Hem yazılı hem sesli doküman oluşturulmuş olur.

              </div>



              {/* ===== SES KAYDI PANELİ ===== */}

              <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: isRecording ? 'rgba(239,68,68,0.04)' : 'var(--bg-input)', transition: 'all 0.3s' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.12)', animation: isRecording ? 'pulse 1.5s infinite' : 'none' }}>

                      {isRecording ? '🔴' : '🎙️'}

                    </div>

                    <div>

                      <div style={{ fontSize: '15px', fontWeight: '700' }}>

                        {transcriptStatus === 'idle' && 'Sesle Kayıt Hazır'}

                        {transcriptStatus === 'recording' && '📋 Kayıt Devam Ediyor...'}

                        {transcriptStatus === 'review' && '📏 Transkripti Kontrol Edin'}

                        {transcriptStatus === 'confirmed' && '✅ Transkript Onaylandı'}

                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>

                        {isRecording ? `⏱️ ${formatRecTime(recordingTime)}  Konuşmaya devam edin...` : 'Türkçe ses tanıma  Chrome/Edge tavsiye edilir'}

                      </div>

                    </div>

                  </div>



                  {/* KAYIT BUTONLARI */}

                  <div style={{ display: 'flex', gap: '8px' }}>

                    {!isRecording ? (

                      <button type="button" onClick={startVoiceRecording}

                        style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(99,102,241,0.3)', transition: 'all 0.2s' }}>

                        🎙️ Kayda Başla

                      </button>

                    ) : (

                      <button type="button" onClick={stopVoiceRecording}

                        style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(239,68,68,0.3)', animation: 'pulse 1.5s infinite' }}>

                        ⏹️ Kaydı Durdur

                      </button>

                    )}

                  </div>

                </div>



                {/* CANLI TRANSKRİPSİYON GÖSTERİMİ */}

                {(isRecording || transcriptStatus === 'review') && (

                  <div style={{ marginTop: '12px' }}>

                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>

                      {isRecording ? '🔊 Canlı Transkripsiyon' : '📏 Transkript Sonucu'}

                    </div>

                    <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minHeight: '100px', maxHeight: '200px', overflowY: 'auto', fontSize: '14px', lineHeight: '1.8' }}>

                      {transcript && <span style={{ color: 'var(--text-primary)' }}>{transcript}</span>}

                      {interimTranscript && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.7 }}>{interimTranscript}</span>}

                      {!transcript && !interimTranscript && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Konuşmaya başlayın... Ses otomatik yazıya çevrilecek.</span>}

                    </div>

                  </div>

                )}



                {/* KONTROL & ONAY BUTONLARI */}

                {transcriptStatus === 'review' && transcript.trim() && (

                  <div style={{ marginTop: '16px' }}>

                    {/* Düzenlenebilir transkript */}

                    <div style={{ marginBottom: '12px' }}>

                      <label className="form-label" style={{ fontSize: '12px', color: 'var(--warning)' }}>✏️ Gerekirse düzenleyin, sonra onaylayın:</label>

                      <textarea className="form-textarea" value={transcript} onChange={e => setTranscript(e.target.value)}

                        style={{ minHeight: '120px', lineHeight: '1.8', fontSize: '13px', border: '2px solid var(--warning)', borderRadius: 'var(--radius-md)' }} />

                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>

                      <button type="button" onClick={resetTranscript}

                        style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '2px solid var(--danger)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontFamily: 'inherit' }}>

                        🗑️ İptal & Yeniden Kaydet

                      </button>

                      <button type="button" onClick={startVoiceRecording}

                        style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '2px solid var(--accent)', background: 'rgba(99,102,241,0.08)', color: 'var(--accent)', fontFamily: 'inherit' }}>

                        🎙️ Devam Kaydet (Ekle)

                      </button>

                      <button type="button" onClick={confirmTranscript}

                        style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>

                        ✅ Onayla & Kaydet

                      </button>

                    </div>

                  </div>

                )}



                {/* ONAY MESAJI */}

                {transcriptStatus === 'confirmed' && (

                  <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>

                    <span style={{ fontSize: '20px' }}>✅</span>

                    <div>

                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--success)' }}>Transkript onaylandı ve işlem talimatına eklendi!</div>

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Yeni bir ses kaydı daha eklemek isterseniz tekrar "Kayda Başla" butonuna tıklayın.</div>

                    </div>

                    <button type="button" onClick={resetTranscript} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>🎙️ Tekrar Kayıt</button>

                  </div>

                )}

              </div>



              {/* ===== YAZI İLE GİRİŞ (MEVCUT) ===== */}

              <div className="form-group">

                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                  📋 İşlemin Nasıl YapılacaĞı (Detaylı Anlatım)

                  {form.how_to_do && <span className="badge badge-success" style={{ fontSize: '10px' }}>✅ {form.how_to_do.split('\n').filter(l => l.trim()).length} adım</span>}

                </label>

                <textarea className="form-textarea"

                  placeholder={`Sesle kayıt yapın veya elle yazın...\n\nÖrnek:\n1. Ön beden ve arka bedeni yüz yüze getirin\n2. Omuz dikişlerini birleştirin\n3. Overlok ile dikişi kapatın`}

                  value={form.how_to_do} onChange={e => setForm({ ...form, how_to_do: e.target.value })}

                  style={{ minHeight: '200px', lineHeight: '1.8', fontSize: '13px' }} />

              </div>

              <div className="form-group">

                <label className="form-label">📏 Yazılı Talimatlar (Kısa Not)</label>

                <textarea className="form-textarea" placeholder="Kısa notlar veya hatırlatıcılar..."

                  value={form.written_instructions} onChange={e => setForm({ ...form, written_instructions: e.target.value })} />

              </div>

            </div>

          )}

          {activeTab === 'makine' && (

            <div style={{ padding: '16px 24px' }}>

              <div className="form-row">

                <div className="form-group"><label className="form-label">İplik Marka ve Numarası</label><input className="form-input" placeholder="örn: Gütermann 40 No Beyaz Polyester" value={form.thread_material} onChange={e => setForm({ ...form, thread_material: e.target.value })} /></div>

                <div className="form-group"><label className="form-label">İĞne Numarası ve Markası</label><input className="form-input" placeholder="örn: Schmetz 14 No (90) Blysk Uçlu" value={form.needle_type} onChange={e => setForm({ ...form, needle_type: e.target.value })} /></div>

              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>

                <label className="form-label">Makina Adım Ayarı (1 cm'de kaç vuruş)</label>

                <input className="form-input" placeholder="örn: 4 vuruş / cm" value={form.stitch_per_cm} onChange={e => setForm({ ...form, stitch_per_cm: e.target.value })} />

              </div>

              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '11px', color: 'var(--text-muted)' }}>

                📋 İplik ve iĞne bilgileri, farklı operatörlerin aynı kalitede üretim yapmasını saĞlar.

              </div>

            </div>

          )}

          {activeTab === 'kalite' && (

            <div style={{ padding: '16px 24px' }}>

              <div className="form-group"><label className="form-label">Kalite Notları</label><textarea className="form-textarea" placeholder="Dikkat edilecek kalite noktaları..." value={form.quality_notes} onChange={e => setForm({ ...form, quality_notes: e.target.value })} /></div>

              <label className="form-label" style={{ marginTop: '16px', marginBottom: '8px' }}>Kalite Tolerans Sınırları (Ölçü)</label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '14px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>

                  <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--danger)' }}>−</span>

                  <input className="form-input" type="number" step="0.1" min="0" placeholder="1" value={form.tolerance_minus} onChange={e => setForm({ ...form, tolerance_minus: e.target.value })} style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700' }} />

                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>cm</span>

                </div>

                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-muted)' }}>/</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '14px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>

                  <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--success)' }}>+</span>

                  <input className="form-input" type="number" step="0.1" min="0" placeholder="1" value={form.tolerance_plus} onChange={e => setForm({ ...form, tolerance_plus: e.target.value })} style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700' }} />

                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>cm</span>

                </div>

              </div>

              <div className="form-group"><label className="form-label">Hata Örnekleri</label><textarea className="form-textarea" placeholder="Sık yapılan hatalar ve çözümleri..." value={form.error_examples} onChange={e => setForm({ ...form, error_examples: e.target.value })} /></div>

              <div className="form-group"><label className="form-label">İstenilen Optik Görünüm</label><textarea className="form-textarea" placeholder="Dikişin nasıl görünmesi gerektiĞi, düzgünlük, simetri, kenar bitişi vb..." value={form.optical_appearance} onChange={e => setForm({ ...form, optical_appearance: e.target.value })} /></div>

            </div>

          )}

          {activeTab === 'sure' && (

            <div style={{ padding: '16px 24px' }}>

              <div className="form-row">

                <div className="form-group"><label className="form-label">Min Süre (sn)</label><input className="form-input" type="number" step="0.1" placeholder="30" value={form.standard_time_min} onChange={e => setForm({ ...form, standard_time_min: e.target.value })} /></div>

                <div className="form-group"><label className="form-label">Max Süre (sn)</label><input className="form-input" type="number" step="0.1" placeholder="60" value={form.standard_time_max} onChange={e => setForm({ ...form, standard_time_max: e.target.value })} /></div>

                <div className="form-group"><label className="form-label">Birim Fiyat (₺)</label><input className="form-input" type="number" step="0.01" placeholder="0.50" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} /></div>

              </div>

              <div className="form-group"><label className="form-label">Bağımlılık (Önceki İşlem)</label><input className="form-input" placeholder="örn: Yaka dikildikten sonra" value={form.dependency} onChange={e => setForm({ ...form, dependency: e.target.value })} /></div>

            </div>

          )}

          <div className="modal-footer">

            <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>

            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}</button>

          </div>

        </form>

      </div>

    </div>

  );

}



// ========== DÜZENLENEBILIR BILEŞENLER (Personel formu için) ==========

// ===== Düzenlenebilir Select Bileşeni =====
const EditableSelect = ({ fieldKey, value, onChange, defaultOptions, label }) => {
  const STORAGE_KEY = `SELECT_OPTIONS_${fieldKey}`;
  let options;
  try { const saved = localStorage.getItem(STORAGE_KEY); options = saved ? JSON.parse(saved) : [...defaultOptions]; } catch { options = [...defaultOptions]; }
  const saveOpts = (opts) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(opts)); };
  const handleRename = (idx) => {
    const old = options[idx][1];
    const newLabel = prompt(`"${old}" adını ne olarak değiştirmek istiyorsunuz?`, old);
    if (!newLabel || !newLabel.trim() || newLabel.trim() === old) return;
    const updated = [...options];
    const newKey = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_çşıöüğ]/g, '');
    const oldKey = updated[idx][0];
    updated[idx] = [newKey, newLabel.trim()];
    saveOpts(updated);
    if (value === oldKey) onChange(newKey); else onChange(value);
  };
  const handleDelete = (idx) => {
    if (!confirm(`"${options[idx][1]}" seçeneğini silmek istediğinize emin misiniz?`)) return;
    const updated = [...options];
    const removedKey = updated[idx][0];
    updated.splice(idx, 1);
    saveOpts(updated);
    if (value === removedKey && updated.length > 0) onChange(updated[0][0]);
    else onChange(value);
  };
  const handleAdd = () => {
    const name = prompt(`${label} bölümüne yeni seçenek ekleyin:`);
    if (!name || !name.trim()) return;
    const key = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_çşıöüğ]/g, '');
    if (options.some(([k]) => k === key)) { alert('Bu seçenek zaten mevcut!'); return; }
    const updated = [...options, [key, name.trim()]];
    saveOpts(updated);
    onChange(value);
  };
  return <div>
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginBottom: '4px' }}>
      <select className="form-select" value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1 }}>
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
      <button type="button" title="Seçenekleri Düzenle" onClick={(e) => {
        e.preventDefault();
        const idx = options.findIndex(([k]) => k === value);
        if (idx >= 0) handleRename(idx);
      }} style={{ fontSize: '11px', padding: '4px 5px', border: '1px solid var(--border-color)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '4px', minWidth: '26px' }}>✏️</button>
      <button type="button" title="Seçili Seçeneği Sil" onClick={(e) => {
        e.preventDefault();
        const idx = options.findIndex(([k]) => k === value);
        if (idx >= 0) handleDelete(idx);
      }} style={{ fontSize: '11px', padding: '4px 5px', border: '1px solid var(--border-color)', background: 'rgba(231,76,60,0.06)', color: '#e74c3c', cursor: 'pointer', borderRadius: '4px', minWidth: '26px' }}>❌</button>
      <button type="button" title="Yeni Seçenek Ekle" onClick={(e) => { e.preventDefault(); handleAdd(); }} style={{ fontSize: '11px', padding: '4px 5px', border: '1px dashed rgba(52,152,219,0.4)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '4px', minWidth: '26px' }}>➕</button>
    </div>
  </div>;
};

// ===== Düzenlenebilir Input Bileşeni =====
const EditableInput = ({ value, onChange, type = 'text', placeholder, maxLength, min, max, step, style }) => {
  const hasValue = value && value.toString().trim() !== '';
  return <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
    <input className="form-input" type={type} placeholder={placeholder} maxLength={maxLength} min={min} max={max} step={step} value={value || ''} onChange={e => onChange(e.target.value)} style={{ flex: 1, ...(style || {}) }} />
    <button type="button" title="Temizle" onClick={(e) => { e.preventDefault(); onChange(''); }} style={{ fontSize: '11px', padding: '4px 5px', border: '1px solid var(--border-color)', background: hasValue ? 'rgba(231,76,60,0.06)' : 'rgba(150,150,150,0.06)', color: hasValue ? '#e74c3c' : '#bbb', cursor: hasValue ? 'pointer' : 'default', borderRadius: '4px', minWidth: '26px', opacity: hasValue ? 1 : 0.5 }}>❌</button>
  </div>;
};


// ========== MODAL: YENİ PERSONEL ==========

function NewPersonnelModal({ onClose, onSave, editData, onUpdate }) {

  const DRAFT_KEY = 'personnel_draft';

  const defaultForm = {
    name: '', role: 'duz_makineci', daily_wage: '', skill_level: 'orta', work_start: '08:00', work_end: '19:00', machines: '', language: 'tr', base_salary: '', transport_allowance: '', ssk_cost: '', food_allowance: '', compensation: '', technical_mastery: 'operator', speed_level: 'normal', quality_level: 'standart', discipline_level: 'guvenilir', versatility_level: '1-2', department: 'dikim',
    daily_avg_output: '', error_rate: '', efficiency_score: '',
    capable_operations: '', learning_speed: 'normal', independence_level: 'kismen',
    attendance: 'az', punctuality: 'genelde', initiative_level: 'orta', teamwork_level: 'iyi', problem_solving: 'sorar',
    physical_endurance: 'iyi', eye_health: 'iyi', health_restrictions: '',
    leadership_potential: 'hayir', training_needs: '', general_evaluation: '',
    phone: '', national_id: '',
    operation_skill_scores: '{}', leave_types: '',
    birth_date: '', gender: 'erkek', education: 'ilkokul', children_count: '0',
    blood_type: '', military_status: '', emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
    smokes: 'hayir', prays: 'hayir', transport_type: '', turkish_level: 'ana_dil',
    living_status: 'ailesiyle', disability_status: 'yok',
    contract_type: 'belirsiz', sgk_entry_date: '', previous_workplaces: 'ilk_isi',
    leave_reason: '',
    finger_dexterity: 'normal', color_perception: 'normal', sample_reading: 'gosterilmeli',
    difficult_work: 'zorlanir', detail_work: 'orta', hard_work_skill: 'yapabilir',
    machine_adjustment_care: 'normal', preferred_machine: '', most_efficient_machine: '',
    maintenance_skill: 'basit',
    machine_adjustments: '{}',
    body_type: 'normal', work_capacity: 'normal_rahat',
    isg_training_date: '', last_health_check: '',
    reliability: 'guvenilir', hygiene: 'normal', change_openness: 'acik',
    responsibility_acceptance: 'kabul_eder', error_stance: 'soyler',
    color_tone_matching: 'fark_eder', critical_matching_responsibility: 'sorumluluk_alir',
    fabric_experience: '{}',
    new_machine_learning: 'istekli', hard_work_avoidance: 'kacmaz', self_improvement: 'gelisir',
    operator_class: 'B', satisfaction_score: '5', recommend: 'evet', weekly_note: ''
  };

  // localStorage'dan taslak yükle veya editData kullan
  const loadDraft = () => {
    if (editData) return { ...defaultForm, ...editData };
    try { const d = localStorage.getItem(DRAFT_KEY); return d ? { ...defaultForm, ...JSON.parse(d) } : defaultForm; } catch { return defaultForm; }
  };

  const [form, setForm] = useState(loadDraft);

  // Her değişiklikte otomatik kaydet (sadece yeni ekleme modunda)
  useEffect(() => {
    if (!editData) localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  // Kapatma onayı — veri varsa sor
  const handleClose = () => {
    if (form.name) {
      if (confirm('⚠️ Kaydedilmemiş veri var! Taslak olarak saklanacak.\nÇıkmak istediğinize emin misiniz?')) { onClose(); }
    } else { localStorage.removeItem(DRAFT_KEY); onClose(); }
  };

  const totalMonthly = (parseFloat(form.base_salary) || 0) + (parseFloat(form.transport_allowance) || 0) + (parseFloat(form.ssk_cost) || 0) + (parseFloat(form.food_allowance) || 0) + (parseFloat(form.compensation) || 0);

  const [saving, setSaving] = useState(false);



  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!form.name) return;

    setSaving(true);

    try {

      const submitData = {
        ...form, daily_wage: parseFloat(form.daily_wage) || 0, base_salary: parseFloat(form.base_salary) || 0, transport_allowance: parseFloat(form.transport_allowance) || 0, ssk_cost: parseFloat(form.ssk_cost) || 0, food_allowance: parseFloat(form.food_allowance) || 0, compensation: parseFloat(form.compensation) || 0,
        daily_avg_output: parseInt(form.daily_avg_output) || 0, error_rate: parseFloat(form.error_rate) || 0, efficiency_score: parseFloat(form.efficiency_score) || 0
      };
      if (editData && onUpdate) { await onUpdate(submitData); }
      else { await onSave(submitData); }
      if (!editData) localStorage.removeItem(DRAFT_KEY);

    } finally { setSaving(false); }

  };



  return (

    <div className="modal-overlay">

      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">

          <h2 className="modal-title">{editData ? `✏️ Düzenle — ${form.name}` : `📋 Yeni Personel ${form.name ? `— ${form.name}` : ''}`}</h2>

          <button className="modal-close" onClick={onClose}>✕</button>

        </div>

        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: '14px' }}>
            <div className="form-group"><label className="form-label">Ad Soyad *</label><EditableInput value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Ad Soyad" /></div>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}><label className="form-label">Pozisyon / Görev (birden fazla seçilebilir)</label>
            {(() => {
              const ROLE_STORAGE_KEY = 'ROLE_CATEGORIES_CUSTOM';
              const defaultCategories = [
                { label: '✂️ Kesim Bölümü', roles: [['makastar', 'Makastar'], ['makastar_yardimcisi', 'Makastar Yardımcısı'], ['kesimci', 'Kesimci'], ['kesimci_yardimcisi', 'Kesimci Yardımcısı'], ['kesim_ustasi', 'Kesim Ustası']] },
                { label: '🧵 Dikim', roles: [['duz_makineci', 'Düz Makineci'], ['overlokcu', 'Overlokçu'], ['recmeci', 'Reçmeci'], ['cift_igneci', 'Çift İğneci']] },
                { label: '♨️ Ütü & Son İşlem', roles: [['ara_utucu', 'Ara Ütücü'], ['son_utucu', 'Son Ütücü'], ['paketci', 'Paketçi'], ['kolileme_operatoru', 'Kolileme'], ['baski_operatoru', 'Baskıcı']] },
                { label: '📋 Kalite', roles: [['inline_kalite', 'Ara Kalite Kontrol'], ['son_kontrolcu', 'Son Kontrol']] },
                { label: '📋 Yönetim & Destek', roles: [['ustabasi', 'Usta Başı'], ['numuneci', 'Numuneci'], ['makinaci', 'Makinacı'], ['modelist', 'Modelist'], ['teknisyen', 'Teknisyen']] }
              ];
              let categories;
              try { const saved = localStorage.getItem(ROLE_STORAGE_KEY); categories = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultCategories)); } catch { categories = JSON.parse(JSON.stringify(defaultCategories)); }
              const saveCategories = (cats) => { localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(cats)); };
              const selectedRoles = (form.role || '').split(',').map(r => r.trim()).filter(Boolean);
              const toggleRole = (val) => {
                const current = selectedRoles.includes(val) ? selectedRoles.filter(r => r !== val) : [...selectedRoles, val];
                setForm({ ...form, role: current.join(',') });
              };
              const handleDeleteRole = (catIdx, roleIdx) => {
                const roleName = categories[catIdx].roles[roleIdx][1];
                if (!confirm(`"${roleName}" şıkkını silmek istediğinize emin misiniz?`)) return;
                const updated = JSON.parse(JSON.stringify(categories));
                const removedKey = updated[catIdx].roles[roleIdx][0];
                updated[catIdx].roles.splice(roleIdx, 1);
                saveCategories(updated);
                if (selectedRoles.includes(removedKey)) {
                  setForm({ ...form, role: selectedRoles.filter(r => r !== removedKey).join(',') });
                } else {
                  setForm({ ...form }); // re-render
                }
              };
              const handleRenameRole = (catIdx, roleIdx) => {
                const oldLabel = categories[catIdx].roles[roleIdx][1];
                const newLabel = prompt(`"${oldLabel}" adını ne olarak değiştirmek istiyorsunuz?`, oldLabel);
                if (!newLabel || !newLabel.trim() || newLabel.trim() === oldLabel) return;
                const updated = JSON.parse(JSON.stringify(categories));
                const newKey = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_çşıöüğ]/g, '');
                const oldKey = updated[catIdx].roles[roleIdx][0];
                updated[catIdx].roles[roleIdx] = [newKey, newLabel.trim()];
                saveCategories(updated);
                if (selectedRoles.includes(oldKey)) {
                  setForm({ ...form, role: selectedRoles.map(r => r === oldKey ? newKey : r).join(',') });
                } else {
                  setForm({ ...form });
                }
              };
              const handleAddRole = (catIdx, catLabel) => {
                const custom = prompt(catLabel + ' bölümüne yeni şık ekle:');
                if (!custom || !custom.trim()) return;
                const key = custom.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_çşıöüğ]/g, '');
                const updated = JSON.parse(JSON.stringify(categories));
                if (updated[catIdx].roles.some(([k]) => k === key)) { alert('Bu şık zaten mevcut!'); return; }
                updated[catIdx].roles.push([key, custom.trim()]);
                saveCategories(updated);
                setForm({ ...form });
              };
              return <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedRoles.length > 0 && <div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: '700' }}>{selectedRoles.length} pozisyon seçili</div>}
                {categories.map((cat, catIdx) => (
                  <div key={cat.label} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>{cat.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {cat.roles.map(([val, label], roleIdx) => {
                        const checked = selectedRoles.includes(val);
                        return <div key={val} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', padding: '6px 12px', borderRadius: '6px 0 0 6px', background: checked ? 'rgba(46,204,113,0.15)' : 'transparent', border: `1px solid ${checked ? '#27ae60' : 'var(--border-color)'}`, cursor: 'pointer', fontWeight: checked ? '700' : '400', color: checked ? '#27ae60' : 'var(--text-primary)' }}>
                            <input type="checkbox" checked={checked} onChange={() => toggleRole(val)} style={{ display: 'none' }} />{checked ? '✅' : ''} {label}
                          </label>
                          <button type="button" title="Adını Düzenle" onClick={() => handleRenameRole(catIdx, roleIdx)} style={{ fontSize: '11px', padding: '6px 4px', border: '1px solid var(--border-color)', borderLeft: 'none', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '0' }}>✏️</button>
                          <button type="button" title="Sil" onClick={() => handleDeleteRole(catIdx, roleIdx)} style={{ fontSize: '11px', padding: '6px 4px', border: '1px solid var(--border-color)', borderLeft: 'none', background: 'rgba(231,76,60,0.06)', color: '#e74c3c', cursor: 'pointer', borderRadius: '0 6px 6px 0' }}>❌</button>
                        </div>;
                      })}
                      <button type="button" onClick={() => handleAddRole(catIdx, cat.label)} style={{ fontSize: '14px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(52,152,219,0.08)', border: '1px dashed rgba(52,152,219,0.4)', color: '#3498db', cursor: 'pointer', fontWeight: '600' }}>➕ Ekle</button>
                    </div>
                  </div>
                ))}
              </div>;
            })()}
          </div>

          {/* ===== P1: KİMLİK & KİŞİSEL BİLGİLER ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(52,152,219,0.2)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#3498db', marginBottom: '8px' }}>🪪 Kimlik & Kişisel Bilgiler</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">TC Kimlik No</label><EditableInput value={form.national_id} onChange={v => setForm({ ...form, national_id: v })} maxLength={11} placeholder="11 hane" /></div>
              <div className="form-group"><label className="form-label">Telefon</label><EditableInput type="tel" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="05XX XXX XX XX" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Doğum Tarihi</label><EditableInput type="date" value={form.birth_date} onChange={v => setForm({ ...form, birth_date: v })} /></div>
              <div className="form-group"><label className="form-label">Cinsiyet</label>
                <EditableSelect fieldKey="gender" label="Cinsiyet" value={form.gender} onChange={v => setForm({ ...form, gender: v })} defaultOptions={[['erkek', 'Erkek'], ['kadin', 'Kadın']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Eğitim Durumu</label>
                <EditableSelect fieldKey="education" label="Eğitim" value={form.education} onChange={v => setForm({ ...form, education: v })} defaultOptions={[['yok', 'Eğitim almamış'], ['ilkokul', 'İlkokul'], ['ortaokul', 'Ortaokul'], ['lise', 'Lise'], ['universite', 'Üniversite']]} /></div>
              <div className="form-group"><label className="form-label">Kan Grubu *</label>
                <EditableSelect fieldKey="blood_type" label="Kan Grubu" value={form.blood_type} onChange={v => setForm({ ...form, blood_type: v })} defaultOptions={[['', '— Seçiniz —'], ['A+', 'A Rh+'], ['A-', 'A Rh-'], ['B+', 'B Rh+'], ['B-', 'B Rh-'], ['AB+', 'AB Rh+'], ['AB-', 'AB Rh-'], ['0+', '0 Rh+'], ['0-', '0 Rh-']]} /></div>
            </div>
            <div className="form-row">
              {form.gender !== 'kadin' && <div className="form-group"><label className="form-label">Askerlik Durumu</label>
                <EditableSelect fieldKey="military_status" label="Askerlik" value={form.military_status} onChange={v => setForm({ ...form, military_status: v })} defaultOptions={[['', '— Seçiniz —'], ['yapildi', 'Yapıldı'], ['tecilli', 'Tecilli'], ['muaf', 'Muaf']]} /></div>}
              <div className="form-group"><label className="form-label">Yaşam Durumu</label>
                <EditableSelect fieldKey="living_status" label="Yaşam" value={form.living_status} onChange={v => setForm({ ...form, living_status: v })} defaultOptions={[['ailesiyle', 'Ailesiyle yaşıyor'], ['esi_cocuklariyla', 'Eşi ve çocuklarıyla'], ['cocuguyla', 'Çocuğuyla yaşıyor'], ['yalniz', 'Yalnız yaşıyor'], ['arkadasla', 'Arkadaşla yaşıyor'], ['yurtta', 'Yurtta yaşıyor']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Çocuk Sayısı</label><EditableInput type="number" min={0} max={15} value={form.children_count} onChange={v => setForm({ ...form, children_count: v })} /></div>
              <div className="form-group"><label className="form-label">Ulaşım Şekli</label>
                <EditableSelect fieldKey="transport_type" label="Ulaşım" value={form.transport_type} onChange={v => setForm({ ...form, transport_type: v })} defaultOptions={[['', '— Seçiniz —'], ['yuruyerek', 'Yürüyerek'], ['toplu_tasima', 'Toplu taşıma'], ['servis', 'Servis'], ['kendi_araci', 'Kendi aracı']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Türkçe Anlama</label>
                <EditableSelect fieldKey="turkish_level" label="Türkçe" value={form.turkish_level} onChange={v => setForm({ ...form, turkish_level: v })} defaultOptions={[['ana_dil', 'Ana dil'], ['iyi', 'İyi anlıyor'], ['temel', 'Temel düzey'], ['cok_az', 'Çok az']]} /></div>
              <div className="form-group"><label className="form-label">Engel Durumu</label>
                <EditableSelect fieldKey="disability_status" label="Engel" value={form.disability_status} onChange={v => setForm({ ...form, disability_status: v })} defaultOptions={[['yok', 'Yok'], ['hafif', 'Hafif'], ['var', 'Var']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">🚬 Sigara İçiyor mu?</label>
                <EditableSelect fieldKey="smokes" label="Sigara" value={form.smokes} onChange={v => setForm({ ...form, smokes: v })} defaultOptions={[['hayir', 'Hayır'], ['evet', 'Evet']]} /></div>
              <div className="form-group"><label className="form-label">🕌 Namaz Molası İhtiyacı</label>
                <EditableSelect fieldKey="prays" label="Namaz" value={form.prays} onChange={v => setForm({ ...form, prays: v })} defaultOptions={[['hayir', 'Hayır'], ['evet', 'Evet']]} /></div>
            </div>
            <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(231,76,60,0.05)', borderRadius: '8px', border: '1px solid rgba(231,76,60,0.15)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#e74c3c', marginBottom: '6px' }}>🆘 Acil Durumda Ulaşılacak Kişi</div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Ad Soyad</label><EditableInput value={form.emergency_contact_name} onChange={v => setForm({ ...form, emergency_contact_name: v })} placeholder="Acil kişi adı" /></div>
                <div className="form-group"><label className="form-label">Telefon</label><EditableInput type="tel" value={form.emergency_contact_phone} onChange={v => setForm({ ...form, emergency_contact_phone: v })} placeholder="05XX XXX XX XX" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Yakınlık</label>
                  <EditableSelect fieldKey="emergency_relation" label="Yakınlık" value={form.emergency_contact_relation} onChange={v => setForm({ ...form, emergency_contact_relation: v })} defaultOptions={[['', '— Seçiniz —'], ['es', 'Eşi'], ['anne', 'Annesi'], ['baba', 'Babası'], ['kardes', 'Kardeşi'], ['cocuk', 'Çocuğu'], ['diger', 'Diğer']]} /></div>
                <div className="form-group"></div>
              </div>
            </div>
          </div>

          {/* MAAŞ BİLEŞENLERİ */}

          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>

            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>📋 Aylık Ücret Bileşenleri</div>

            <div className="form-row">
              <div className="form-group"><label className="form-label">Maaş (₺)</label><EditableInput type="number" step="0.01" placeholder="0" value={form.base_salary} onChange={v => setForm({ ...form, base_salary: v })} /></div>
              <div className="form-group"><label className="form-label">Yol (₺)</label><EditableInput type="number" step="0.01" placeholder="0" value={form.transport_allowance} onChange={v => setForm({ ...form, transport_allowance: v })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">SSK (₺)</label><EditableInput type="number" step="0.01" placeholder="0" value={form.ssk_cost} onChange={v => setForm({ ...form, ssk_cost: v })} /></div>
              <div className="form-group"><label className="form-label">Yemek (₺)</label><EditableInput type="number" step="0.01" placeholder="0" value={form.food_allowance} onChange={v => setForm({ ...form, food_allowance: v })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Tazminat (₺)</label><EditableInput type="number" step="0.01" placeholder="0" value={form.compensation} onChange={v => setForm({ ...form, compensation: v })} /></div>
              <div className="form-group">
                <label className="form-label">Toplam Aylık</label>
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', fontSize: '14px', fontWeight: '700', color: '#2ecc71' }}>{totalMonthly.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>⚙️ Günlük ücret = Toplam aylık / Ayın çalışma günü sayısı olarak otomatik hesaplanır</div>

          </div>

          {/* BECERİ MATRİSİ — 5 KRİTER */}

          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>

            <div style={{ fontSize: '14px', fontWeight: '700', color: '#e67e22', marginBottom: '8px' }}>📊 Operatör Beceri Matrisi</div>

            <div className="form-row">

              <div className="form-group"><label className="form-label">1️⃣ Teknik Ustalık</label>
                <EditableSelect fieldKey="technical_mastery" label="Teknik Ustalık" value={form.technical_mastery} onChange={v => setForm({ ...form, technical_mastery: v })} defaultOptions={[['egitici_usta', 'Eğitici Usta'], ['usta', 'Usta'], ['kalfa', 'Kalfa'], ['operator', 'Operatör'], ['cirak', 'Çırak'], ['stajyer', 'Stajyer']]} />
              </div>

              <div className="form-group"><label className="form-label">2️⃣ Hız (İş Alma-Verme)</label>
                <EditableSelect fieldKey="speed_level" label="Hız" value={form.speed_level} onChange={v => setForm({ ...form, speed_level: v })} defaultOptions={[['cok_seri', 'Çok Hızlı'], ['seri', 'Hızlı'], ['normal', 'Normal'], ['yavas', 'Yavaş']]} />
              </div>

            </div>

            <div className="form-row">

              <div className="form-group"><label className="form-label">3️⃣ Kalite / El Temizliği</label>
                <EditableSelect fieldKey="quality_level" label="Kalite" value={form.quality_level} onChange={v => setForm({ ...form, quality_level: v })} defaultOptions={[['premium', 'Premium'], ['iyi', 'İyi'], ['normal', 'Normal'], ['degisken', 'Değişken'], ['dusuk', 'Düşük']]} />
              </div>

              <div className="form-group"><label className="form-label">4️⃣ İş Disiplini</label>
                <EditableSelect fieldKey="discipline_level" label="İş Disiplini" value={form.discipline_level} onChange={v => setForm({ ...form, discipline_level: v })} defaultOptions={[['cok_guvenilir', 'Çok Güvenilir'], ['guvenilir', 'Güvenilir'], ['degisken', 'Değişken'], ['takip', 'Takip Gerektirir']]} />
              </div>

            </div>

            <div className="form-row">
              <div className="form-group"><label className="form-label">5️⃣ Çok Yönlülük</label>
                <EditableSelect fieldKey="versatility_level" label="Çok Yönlülük" value={form.versatility_level} onChange={v => setForm({ ...form, versatility_level: v })} defaultOptions={[['1', '1 operasyon'], ['2', '2 operasyon'], ['3', '3 operasyon'], ['4', '4 operasyon'], ['5', '5 operasyon'], ['6', '6+ operasyon']]} />
              </div>
              <div className="form-group"><label className="form-label">6️⃣ Parmak Becerisi</label>
                <EditableSelect fieldKey="finger_dexterity" label="Parmak Becerisi" value={form.finger_dexterity} onChange={v => setForm({ ...form, finger_dexterity: v })} defaultOptions={[['cok_iyi', 'Çok iyi'], ['iyi', 'İyi'], ['normal', 'Normal'], ['zayif', 'Zayıf']]} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">7️⃣ Renk Algısı</label>
                <EditableSelect fieldKey="color_perception" label="Renk Algısı" value={form.color_perception} onChange={v => setForm({ ...form, color_perception: v })} defaultOptions={[['cok_iyi', 'Çok iyi'], ['normal', 'Normal'], ['zayif', 'Zayıf']]} />
              </div>
              <div className="form-group"><label className="form-label">8️⃣ Numune Okuma</label>
                <EditableSelect fieldKey="sample_reading" label="Numune Okuma" value={form.sample_reading} onChange={v => setForm({ ...form, sample_reading: v })} defaultOptions={[['bagimsiz', 'Bağımsız okur'], ['gosterilmeli', 'Gösterilmeli'], ['yapamaz', 'Yapamaz']]} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">9️⃣ Zor/Yoğun İşe Tutumu</label>
                <EditableSelect fieldKey="hard_work_avoidance" label="Zor İş Tutumu" value={form.hard_work_avoidance} onChange={v => setForm({ ...form, hard_work_avoidance: v })} defaultOptions={[['istekle_alir', '💪 İstekle Alır'], ['kacmaz', '✅ Kaçmaz, Yapar'], ['zaman_zaman', '🟡 Duruma Göre'], ['soguk_bakar', '🟠 Soğuk Bakar'], ['kacinar', '🔴 Kaçınır']]} /></div>
              <div className="form-group"><label className="form-label">🔟 Yeni İş/Model Öğrenme</label>
                <EditableSelect fieldKey="new_machine_learning" label="Öğrenme İsteği" value={form.new_machine_learning} onChange={v => setForm({ ...form, new_machine_learning: v })} defaultOptions={[['cok_istekli', '🚀 Çok İstekli'], ['istekli', '✅ İstekli'], ['normal', '🟡 Normal'], ['isteksiz', '🟠 İsteksiz'], ['direncli', '🔴 Dirençli']]} /></div>
            </div>
          </div>

          <div className="form-row">

            <div className="form-group"><label className="form-label">Mesai Başlangıç</label><EditableInput type="time" value={form.work_start} onChange={v => setForm({ ...form, work_start: v })} /></div>

            <div className="form-group"><label className="form-label">Mesai Bitiş</label><EditableInput type="time" value={form.work_end} onChange={v => setForm({ ...form, work_end: v })} /></div>

          </div>

          {/* ===== MAKİNE YETKİNLİK MATRİSİ ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(52,152,219,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#2980b9', marginBottom: '8px' }}>🔧 Kullanabildiği Makineler & Yetkinlik Seviyesi</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Her makine için yetkinlik seviyesi seçin. Kullanmıyorsa boş bırakın.</div>
            {(() => {
              const defaultMachines = ['Düz Makina', 'Çift İğne', 'Zincir Dikiş', 'Overlok', '5İp Overlok', 'Mekanik Reçme', 'Bıçaklı Reçme', 'İlik Mak.', 'Düğme Mak.', 'Punteriz', 'Kemer Mak.', 'Zigzag', 'Gizli Dikiş', 'Ütü'];
              let machineSkills = {};
              try { machineSkills = JSON.parse(form.operation_skill_scores || '{}'); } catch { }
              const customMachines = Object.keys(machineSkills).filter(k => !defaultMachines.includes(k));
              const allMachines = [...defaultMachines, ...customMachines];
              const MACHINE_LEVELS_KEY = 'SELECT_OPTIONS_machine_skill_levels';
              let machineLevels;
              try { const saved = localStorage.getItem(MACHINE_LEVELS_KEY); machineLevels = saved ? JSON.parse(saved) : [['', '— Kullanmıyor'], ['usta_hizli', '🏅 Usta Hızlı'], ['usta_normal', '⭐ Usta Normal'], ['usta_yavas', '🟢 Usta Yavaş'], ['iyi_hizli', '💪 İyi Hızlı'], ['iyi_normal', '✅ İyi Normal'], ['normal', '🟡 Normal'], ['acemi_normal', '🔵 Acemi Normal'], ['acemi_yavas', '⚪ Acemi Yavaş']]; } catch { machineLevels = [['', '— Kullanmıyor'], ['usta_hizli', '🏅 Usta Hızlı'], ['usta_normal', '⭐ Usta Normal'], ['usta_yavas', '🟢 Usta Yavaş'], ['iyi_hizli', '💪 İyi Hızlı'], ['iyi_normal', '✅ İyi Normal'], ['normal', '🟡 Normal'], ['acemi_normal', '🔵 Acemi Normal'], ['acemi_yavas', '⚪ Acemi Yavaş']]; }
              const saveMachineLevels = (opts) => { localStorage.setItem(MACHINE_LEVELS_KEY, JSON.stringify(opts)); };
              const colors = { 'usta_hizli': '#27ae60', 'usta_normal': '#2ecc71', 'usta_yavas': '#27ae60', 'iyi_hizli': '#3498db', 'iyi_normal': '#2ecc71', 'normal': '#f39c12', 'acemi_normal': '#e67e22', 'acemi_yavas': '#95a5a6' };
              return <>
                <div style={{ marginBottom: '6px', display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={() => { const selLevel = machineLevels.find(([k]) => k !== ''); if (!selLevel) return; const nl = prompt(`Yetkinlik seçeneğini düzenle:`, selLevel[1]); if (!nl || !nl.trim()) return; const idx = machineLevels.findIndex(([k]) => k === selLevel[0]); if (idx >= 0) { const u = [...machineLevels]; u[idx] = [selLevel[0], nl.trim()]; saveMachineLevels(u); setForm({ ...form }); } }} style={{ fontSize: '11px', padding: '4px 8px', border: '1px solid var(--border-color)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '4px' }}>✏️ Seviye Düzenle</button>
                  <button type="button" onClick={() => { const name = prompt('Yeni yetkinlik seviyesi ekleyin:'); if (!name || !name.trim()) return; const key = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_çşıöüğ]/g, ''); const u = [...machineLevels, [key, name.trim()]]; saveMachineLevels(u); setForm({ ...form }); }} style={{ fontSize: '11px', padding: '4px 8px', border: '1px dashed rgba(52,152,219,0.4)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '4px' }}>➕ Seviye Ekle</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {allMachines.map(m => {
                    const level = machineSkills[m] || '';
                    return <div key={m} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 26px 26px', alignItems: 'center', gap: '4px', padding: '4px 6px', borderRadius: '6px', background: level ? `${colors[level] || '#999'}15` : 'transparent', border: `1px solid ${level ? (colors[level] || '#999') : 'var(--border-color)'}` }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: level ? (colors[level] || '#999') : 'var(--text-muted)' }}>{m}</span>
                      <select style={{ width: '100%', fontSize: '11px', padding: '3px 4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                        value={level} onChange={e => {
                          const updated = { ...machineSkills };
                          if (e.target.value) updated[m] = e.target.value; else delete updated[m];
                          setForm({ ...form, operation_skill_scores: JSON.stringify(updated), machines: Object.keys(updated).join(', ') });
                        }}>
                        {machineLevels.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                      </select>
                      <button type="button" title="Makina Adını Düzenle" onClick={() => { const newName = prompt(`"${m}" adını değiştir:`, m); if (!newName || !newName.trim() || newName.trim() === m) return; const updated = {}; Object.entries(machineSkills).forEach(([k, v]) => { updated[k === m ? newName.trim() : k] = v; }); setForm({ ...form, operation_skill_scores: JSON.stringify(updated), machines: Object.keys(updated).join(', ') }); }} style={{ fontSize: '10px', padding: '2px 4px', border: '1px solid var(--border-color)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '4px' }}>✏️</button>
                      <button type="button" title="Sil" onClick={() => { const updated = { ...machineSkills }; delete updated[m]; setForm({ ...form, operation_skill_scores: JSON.stringify(updated), machines: Object.keys(updated).join(', ') }); }} style={{ fontSize: '10px', padding: '2px 4px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', borderRadius: '4px', cursor: 'pointer' }}>❌</button>
                    </div>;
                  })}
                </div>
                <button type="button" onClick={() => { const name = prompt('Yeni makina adı yazın (ör: Singer, Juki, Özel Overlok):'); if (name && name.trim()) { const updated = { ...machineSkills, [name.trim()]: 'normal' }; setForm({ ...form, operation_skill_scores: JSON.stringify(updated), machines: Object.keys(updated).join(', ') }); } }} style={{ marginTop: '8px', background: 'rgba(52,152,219,0.08)', border: '1px dashed rgba(52,152,219,0.4)', color: '#3498db', padding: '6px 14px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>➕ Makina Ekle</button>
              </>;
            })()}
          </div>


          {/* ===== ÖZEL NOTLAR & GÖZLEMLER ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(46,204,113,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#27ae60', marginBottom: '8px' }}> Özel Notlar & Gözlemler</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">🧵 Güçlü Yönleri, Zayıf Yönleri, Sevdiği İşlemler</label>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-start' }}><textarea className="form-input" rows={3} placeholder="Örn: Gömlek dikiminde çok iyi, fermuar takmada tecrübeli. İnce kumaşlarda dikkatli, kalın kumaşta zorlanır. Overlok'ta çalışmayı seviyor..." value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} style={{ resize: 'vertical', flex: 1 }} /><button type="button" title="Temizle" onClick={() => setForm({ ...form, skills: '' })} style={{ fontSize: '11px', padding: '4px 5px', border: '1px solid var(--border-color)', background: form.skills ? 'rgba(231,76,60,0.06)' : 'rgba(150,150,150,0.06)', color: form.skills ? '#e74c3c' : '#bbb', cursor: form.skills ? 'pointer' : 'default', borderRadius: '4px', minWidth: '26px', marginTop: '2px', opacity: form.skills ? 1 : 0.5 }}>❌</button></div></div>
            </div>
          </div>
          {/* ===== P5: MAKİNE AYAR BECERİLERİ ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(155,89,182,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#8e44ad', marginBottom: '8px' }}>⚙️ Makine Ayar Becerileri</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Her makine için ayar becerilerini işaretleyin. ✅ = Yapabilir</div>
            {(() => {
              let adj = {};
              try { adj = JSON.parse(form.machine_adjustments || '{}'); } catch { }
              const ADJ_STORAGE_KEY = 'MACHINE_ADJ_SKILLS_CUSTOM';
              const defaultMachines = {
                'Singer Düz Makina': ['İplik ayarı', 'Konpile ayarı', 'Dişli ayarı', 'Çıtlama', 'Esneme ayarı', 'Toplama', 'Büzgü', 'Lastik esneme çıtlama'],
                'Overlok': ['İplik ayarı', 'Çıtlama', 'Bıçak ayarı', 'Loper ayarı', 'Esneme ayarı', 'Toplama', 'Büzgü'],
                'Reçme': ['İplik ayarı', 'Çıtlama', 'Bıçak ayarı', 'Loper ayarı', 'Esneme ayarı', 'Toplama', 'Büzgü']
              };
              let machines;
              try { const saved = localStorage.getItem(ADJ_STORAGE_KEY); machines = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultMachines)); } catch { machines = JSON.parse(JSON.stringify(defaultMachines)); }
              const saveMachines = (m) => { localStorage.setItem(ADJ_STORAGE_KEY, JSON.stringify(m)); };
              const handleRenameMachine = (oldName) => {
                const newName = prompt(`"${oldName}" makine adını ne olarak değiştirmek istiyorsunuz?`, oldName);
                if (!newName || !newName.trim() || newName.trim() === oldName) return;
                const updated = {}; const newAdj = { ...adj };
                Object.entries(machines).forEach(([k, v]) => { if (k === oldName) { updated[newName.trim()] = v; v.forEach(skill => { const oldKey = `${oldName}_${skill}`; const newKey = `${newName.trim()}_${skill}`; if (newAdj[oldKey]) { newAdj[newKey] = newAdj[oldKey]; delete newAdj[oldKey]; } }); } else { updated[k] = v; } });
                saveMachines(updated); setForm({ ...form, machine_adjustments: JSON.stringify(newAdj) });
              };
              const handleDeleteMachine = (name) => {
                if (!confirm(`"${name}" makinesini ve tüm becerilerini silmek istediğinize emin misiniz?`)) return;
                const updated = {}; const newAdj = { ...adj };
                Object.entries(machines).forEach(([k, v]) => { if (k !== name) { updated[k] = v; } else { v.forEach(skill => { delete newAdj[`${name}_${skill}`]; }); } });
                saveMachines(updated); setForm({ ...form, machine_adjustments: JSON.stringify(newAdj) });
              };
              const handleAddMachine = () => {
                const name = prompt('Yeni makine adı yazın:');
                if (!name || !name.trim()) return;
                if (machines[name.trim()]) { alert('Bu makine zaten mevcut!'); return; }
                const updated = { ...machines, [name.trim()]: [] };
                saveMachines(updated); setForm({ ...form });
              };
              const handleRenameSkill = (machine, skillIdx) => {
                const oldSkill = machines[machine][skillIdx];
                const newSkill = prompt(`"${oldSkill}" beceri adını ne olarak değiştirmek istiyorsunuz?`, oldSkill);
                if (!newSkill || !newSkill.trim() || newSkill.trim() === oldSkill) return;
                const updated = JSON.parse(JSON.stringify(machines));
                updated[machine][skillIdx] = newSkill.trim();
                const newAdj = { ...adj };
                const oldKey = `${machine}_${oldSkill}`; const newKey = `${machine}_${newSkill.trim()}`;
                if (newAdj[oldKey]) { newAdj[newKey] = newAdj[oldKey]; delete newAdj[oldKey]; }
                saveMachines(updated); setForm({ ...form, machine_adjustments: JSON.stringify(newAdj) });
              };
              const handleDeleteSkill = (machine, skillIdx) => {
                const skill = machines[machine][skillIdx];
                if (!confirm(`"${skill}" becerisini silmek istediğinize emin misiniz?`)) return;
                const updated = JSON.parse(JSON.stringify(machines));
                updated[machine].splice(skillIdx, 1);
                const newAdj = { ...adj }; delete newAdj[`${machine}_${skill}`];
                saveMachines(updated); setForm({ ...form, machine_adjustments: JSON.stringify(newAdj) });
              };
              const handleAddSkill = (machine) => {
                const skill = prompt(`"${machine}" makinesine yeni beceri ekleyin:`);
                if (!skill || !skill.trim()) return;
                if (machines[machine].includes(skill.trim())) { alert('Bu beceri zaten mevcut!'); return; }
                const updated = JSON.parse(JSON.stringify(machines));
                updated[machine].push(skill.trim());
                saveMachines(updated); setForm({ ...form });
              };
              return <>
                {Object.entries(machines).map(([machine, skills]) => (
                  <div key={machine} style={{ marginBottom: '8px', padding: '8px', borderRadius: '6px', background: 'rgba(155,89,182,0.04)', border: '1px solid rgba(155,89,182,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#8e44ad', flex: 1 }}>{machine}</div>
                      <button type="button" title="Makine Adını Düzenle" onClick={() => handleRenameMachine(machine)} style={{ fontSize: '10px', padding: '2px 4px', border: '1px solid var(--border-color)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '4px' }}>✏️</button>
                      <button type="button" title="Makineyi Sil" onClick={() => handleDeleteMachine(machine)} style={{ fontSize: '10px', padding: '2px 4px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', borderRadius: '4px', cursor: 'pointer' }}>❌</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {skills.map((skill, skillIdx) => {
                        const key = `${machine}_${skill}`;
                        const checked = adj[key] || false;
                        return <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', borderRadius: '4px 0 0 4px', background: checked ? 'rgba(46,204,113,0.1)' : 'transparent', border: `1px solid ${checked ? '#27ae60' : 'var(--border-color)'}`, cursor: 'pointer' }}>
                            <input type="checkbox" checked={checked} onChange={() => {
                              const updated = { ...adj, [key]: !checked };
                              if (!updated[key]) delete updated[key];
                              setForm({ ...form, machine_adjustments: JSON.stringify(updated) });
                            }} style={{ width: '12px', height: '12px', accentColor: '#27ae60' }} />{skill}
                          </label>
                          <button type="button" title="Beceri Adını Düzenle" onClick={() => handleRenameSkill(machine, skillIdx)} style={{ fontSize: '10px', padding: '4px 3px', border: '1px solid var(--border-color)', borderLeft: 'none', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '0' }}>✏️</button>
                          <button type="button" title="Beceriyi Sil" onClick={() => handleDeleteSkill(machine, skillIdx)} style={{ fontSize: '10px', padding: '4px 3px', border: '1px solid var(--border-color)', borderLeft: 'none', background: 'rgba(231,76,60,0.06)', color: '#e74c3c', cursor: 'pointer', borderRadius: '0 4px 4px 0' }}>❌</button>
                        </div>;
                      })}
                      <button type="button" onClick={() => handleAddSkill(machine)} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(52,152,219,0.08)', border: '1px dashed rgba(52,152,219,0.4)', color: '#3498db', cursor: 'pointer', fontWeight: '600' }}>➕ Beceri Ekle</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={handleAddMachine} style={{ marginTop: '6px', fontSize: '12px', padding: '6px 14px', borderRadius: '6px', background: 'rgba(155,89,182,0.08)', border: '1px dashed rgba(155,89,182,0.4)', color: '#8e44ad', cursor: 'pointer', fontWeight: '600' }}>➕ Yeni Makine Ekle</button>
              </>;
            })()}
            <div className="form-row" style={{ marginTop: '8px' }}>
              <div className="form-group"><label className="form-label">Genel Ayar Özeni</label>
                <EditableSelect fieldKey="machine_adjustment_care" label="Ayar Özeni" value={form.machine_adjustment_care} onChange={v => setForm({ ...form, machine_adjustment_care: v })} defaultOptions={[['ozenli', 'Özenli'], ['normal', 'Normal'], ['ozensiz', 'Özensiz']]} /></div>
              <div className="form-group"><label className="form-label">Bakım Becerisi</label>
                <EditableSelect fieldKey="maintenance_skill" label="Bakım" value={form.maintenance_skill} onChange={v => setForm({ ...form, maintenance_skill: v })} defaultOptions={[['tam', 'Tam bakım yapabilir'], ['basit', 'Basit bakım yapabilir'], ['sadece_temizlik', 'Sadece temizlik'], ['yapamaz', 'Yapamaz']]} /></div>
            </div>
            <div className="form-row" style={{ marginTop: '8px' }}>
              <div className="form-group"><label className="form-label">💚 Tercih Ettiği Makine</label>
                <EditableSelect fieldKey="preferred_machine" label="Makine Tercihi" value={form.preferred_machine} onChange={v => setForm({ ...form, preferred_machine: v })} defaultOptions={[['', '— Seçiniz —'], ['Duz_Dikiş', 'Düz Dikiş'], ['Overlok', 'Overlok'], ['Recme', 'Reçme'], ['Flatlock', 'Flatlock'], ['Cift_Igne', 'Çift İğne'], ['Zigzag', 'Zigzag'], ['Utu', 'Ütü'], ['Kesim', 'Kesim']]} /></div>
              <div className="form-group"><label className="form-label">⭐ En Verimli Olduğu Makine</label>
                <EditableSelect fieldKey="most_efficient_machine" label="Verimli Makine" value={form.most_efficient_machine} onChange={v => setForm({ ...form, most_efficient_machine: v })} defaultOptions={[['', '— Seçiniz —'], ['Duz_Dikiş', 'Düz Dikiş'], ['Overlok', 'Overlok'], ['Recme', 'Reçme'], ['Flatlock', 'Flatlock'], ['Cift_Igne', 'Çift İğne'], ['Zigzag', 'Zigzag'], ['Utu', 'Ütü'], ['Kesim', 'Kesim']]} /></div>
            </div>
          </div>

          {/* ===== 🏅 MAKİNE SINIFI & YAPABİLECEĞİ İŞLEMLER ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '2px solid rgba(212,168,71,0.4)' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#D4A847', marginBottom: '4px' }}>🏅 Makine Sınıfı & Yapabileceği İşlemler</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Her makine için usta sınıfını ve o makinede hangi özel dikişi/işlemi yapabildiğini belirtin. Sistem, üretim atamalarında bu bilgileri kullanır.</div>

            {(() => {
              const SINIF_KEY = 'MAKINE_SINIF_ISLEM_V1';
              // Varsayılan makine → işlem listesi
              const varsayilanMakineler = {
                'Düz Makina': ['Düz dikiş', 'Kemer dikme', 'Etek kenarı', 'Yaka dikme', 'Cep dikme', 'Fitil çekme', 'Özel dikiş'],
                'Overlok': ['5 iplik overlok', '4 iplik overlok', 'Beden birleştirme', 'Omuz birleştirme', 'Kolları takma', 'Yan dikiş'],
                'Reçme': ['Düz reçme', 'Kol ağzı reçme', 'Beden alt reçme', 'V yaka reçme', 'Logo reçme'],
                'Çift İğne': ['Çift iğne düz', 'Kemer dikme', 'Bant dikme', 'Dekortif dikiş'],
                'Ütü': ['Ara ütü', 'Son ütü', 'Tela yapıştırma', 'Şekil verme'],
              };

              let sinifData = {};
              try { sinifData = JSON.parse(form.capable_operations || '{}'); } catch { }

              let makineIslemler;
              try {
                const saved = localStorage.getItem(SINIF_KEY);
                makineIslemler = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(varsayilanMakineler));
              } catch { makineIslemler = JSON.parse(JSON.stringify(varsayilanMakineler)); }

              const kaydet = (m) => { localStorage.setItem(SINIF_KEY, JSON.stringify(m)); };

              const siniflar = [
                { key: '1_sinif_usta', label: '🏆 1. Sınıf Usta', renk: '#D4A847', aciklama: 'En yüksek seviye — tüm incelikleri bilir, hızlı ve hatasız çalışır' },
                { key: '2_sinif_usta', label: '🥈 2. Sınıf Usta', renk: '#95a5a6', aciklama: 'İyi seviye — çoğu işlemi yapabilir, zaman zaman kontrol gerekebilir' },
                { key: 'kalfa', label: '🔵 Kalfa', renk: '#3498db', aciklama: 'Orta seviye — temel işlemleri yapar, zor noktalarda yardım alır' },
                { key: 'cirak', label: '🟡 Çırak', renk: '#f39c12', aciklama: 'Başlangıç seviyesi — basit işlemler, sürekli gözetim gerektirir' },
              ];

              const guncelle = (makine, alan, deger) => {
                const yeni = { ...sinifData };
                if (!yeni[makine]) yeni[makine] = { sinif: '', islemler: [] };
                if (alan === 'sinif') { yeni[makine].sinif = deger; }
                else if (alan === 'islem_toggle') {
                  const arr = yeni[makine].islemler || [];
                  yeni[makine].islemler = arr.includes(deger) ? arr.filter(x => x !== deger) : [...arr, deger];
                }
                setForm({ ...form, capable_operations: JSON.stringify(yeni) });
              };

              return <>
                {Object.entries(makineIslemler).map(([makine, islemler]) => {
                  const d = sinifData[makine] || { sinif: '', islemler: [] };
                  const secilenSinif = siniflar.find(s => s.key === d.sinif);

                  return (
                    <div key={makine} style={{ marginBottom: '10px', border: `2px solid ${secilenSinif ? secilenSinif.renk + '60' : 'var(--border-color)'}`, borderRadius: '10px', overflow: 'hidden' }}>
                      {/* Makine başlık + sil/düzenle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: secilenSinif ? `${secilenSinif.renk}15` : 'var(--bg-card)' }}>
                        <span style={{ fontWeight: '800', fontSize: '13px', flex: 1, color: secilenSinif?.renk || 'var(--text-primary)' }}>🔧 {makine}</span>
                        <button type="button" onClick={() => {
                          const yeniIsim = prompt(`"${makine}" makinesinin adını değiştir:`, makine);
                          if (!yeniIsim || !yeniIsim.trim() || yeniIsim.trim() === makine) return;
                          const guncel = {};
                          Object.entries(makineIslemler).forEach(([k, v]) => { guncel[k === makine ? yeniIsim.trim() : k] = v; });
                          kaydet(guncel);
                          const yeniSinif = {};
                          Object.entries(sinifData).forEach(([k, v]) => { yeniSinif[k === makine ? yeniIsim.trim() : k] = v; });
                          setForm({ ...form, capable_operations: JSON.stringify(yeniSinif) });
                        }} style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid var(--border-color)', background: 'rgba(52,152,219,0.1)', color: '#3498db', cursor: 'pointer', borderRadius: '4px' }}>✏️ Ad</button>
                        <button type="button" onClick={() => {
                          if (!confirm(`"${makine}" makinesini sil?`)) return;
                          const guncel = { ...makineIslemler }; delete guncel[makine];
                          kaydet(guncel);
                          const yeniSinif = { ...sinifData }; delete yeniSinif[makine];
                          setForm({ ...form, capable_operations: JSON.stringify(yeniSinif) });
                        }} style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', borderRadius: '4px', cursor: 'pointer' }}>❌ Sil</button>
                      </div>

                      <div style={{ padding: '10px 12px' }}>
                        {/* SINIF SEÇİMİ */}
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>📊 Bu Makinedeki Sınıfı:</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {siniflar.map(s => (
                              <button key={s.key} type="button" title={s.aciklama} onClick={() => guncelle(makine, 'sinif', d.sinif === s.key ? '' : s.key)}
                                style={{
                                  padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                  background: d.sinif === s.key ? s.renk : 'var(--bg-input)',
                                  color: d.sinif === s.key ? '#fff' : s.renk,
                                  border: `2px solid ${s.renk}`
                                }}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                          {secilenSinif && <div style={{ fontSize: '11px', color: secilenSinif.renk, marginTop: '4px', fontStyle: 'italic' }}>ℹ️ {secilenSinif.aciklama}</div>}
                        </div>

                        {/* İŞLEM LİSTESİ */}
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>✅ Bu Makinede Yapabildiği Özel Dikişler/İşlemler:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {islemler.map((islem, idx) => {
                              const secili = (d.islemler || []).includes(islem);
                              return (
                                <div key={islem} style={{ display: 'flex', alignItems: 'center' }}>
                                  <label style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px', borderRadius: '6px 0 0 6px', border: `1px solid ${secili ? '#27ae60' : 'var(--border-color)'}`,
                                    background: secili ? 'rgba(46,204,113,0.12)' : 'var(--bg-input)', cursor: 'pointer', color: secili ? '#27ae60' : 'var(--text-primary)', fontWeight: secili ? '700' : '400'
                                  }}>
                                    <input type="checkbox" checked={secili} onChange={() => guncelle(makine, 'islem_toggle', islem)} style={{ width: '12px', height: '12px', accentColor: '#27ae60', display: 'none' }} />
                                    {secili ? '✅' : '○'} {islem}
                                  </label>
                                  <button type="button" title="Düzenle" onClick={() => {
                                    const yeni = prompt(`"${islem}" işlem adını değiştir:`, islem);
                                    if (!yeni || !yeni.trim() || yeni.trim() === islem) return;
                                    const guncel = JSON.parse(JSON.stringify(makineIslemler));
                                    guncel[makine][idx] = yeni.trim();
                                    kaydet(guncel);
                                    const yeniSinif = { ...sinifData };
                                    if (yeniSinif[makine]?.islemler) {
                                      yeniSinif[makine].islemler = yeniSinif[makine].islemler.map(x => x === islem ? yeni.trim() : x);
                                    }
                                    setForm({ ...form, capable_operations: JSON.stringify(yeniSinif) });
                                  }} style={{ fontSize: '9px', padding: '4px 3px', borderLeft: 'none', border: '1px solid var(--border-color)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: 0 }}>✏️</button>
                                  <button type="button" title="Sil" onClick={() => {
                                    if (!confirm(`"${islem}" işlemini listeden sil?`)) return;
                                    const guncel = JSON.parse(JSON.stringify(makineIslemler));
                                    guncel[makine].splice(idx, 1);
                                    kaydet(guncel);
                                    setForm({ ...form });
                                  }} style={{ fontSize: '9px', padding: '4px 3px', borderLeft: 'none', border: '1px solid rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.06)', color: '#e74c3c', cursor: 'pointer', borderRadius: '0 4px 4px 0' }}>❌</button>
                                </div>
                              );
                            })}
                            <button type="button" onClick={() => {
                              const yeni = prompt(`"${makine}" makinesine yeni işlem ekle (ör: Kemer dikme, Ferman takma):`);
                              if (!yeni || !yeni.trim()) return;
                              const guncel = JSON.parse(JSON.stringify(makineIslemler));
                              if (!guncel[makine].includes(yeni.trim())) guncel[makine].push(yeni.trim());
                              kaydet(guncel);
                              setForm({ ...form });
                            }} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(52,152,219,0.08)', border: '1px dashed rgba(52,152,219,0.4)', color: '#3498db', cursor: 'pointer', fontWeight: '600' }}>➕ İşlem Ekle</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Yeni makine ekleme */}
                <button type="button" onClick={() => {
                  const isim = prompt('Yeni makine adı (ör: Punteriz, Bantlama Mak., Kemer Mak.):');
                  if (!isim || !isim.trim()) return;
                  if (makineIslemler[isim.trim()]) { alert('Bu makine zaten var!'); return; }
                  const guncel = { ...makineIslemler, [isim.trim()]: [] };
                  kaydet(guncel);
                  setForm({ ...form });
                }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(212,168,71,0.08)', border: '2px dashed rgba(212,168,71,0.4)', color: '#D4A847', cursor: 'pointer', fontWeight: '700', fontSize: '13px', marginTop: '6px' }}>
                  ➕ Yeni Makine Ekle (Kemer Mak., Punteriz, Bantlama...)
                </button>
              </>;
            })()}
          </div>

          {/* ===== ÜRETİM KAPASİTESİ ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(46,204,113,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#27ae60', marginBottom: '8px' }}>📊 Üretim Kapasitesi</div>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(46,204,113,0.06)', border: '1px dashed rgba(46,204,113,0.3)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              ℹ️ Bu bölüm her ürün/model için farklılık gösterir.<br />
              Üretim modülü devreye girdiğinde <strong>günlük adet, hata oranı ve verimlilik skoru</strong> sistem tarafından otomatik hesaplanacaktır.
            </div>
          </div>

          {/* ===== BECERİ DETAYLARI ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(155,89,182,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#8e44ad', marginBottom: '8px' }}>🎯 Beceri Detayları</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">📚 Öğrenme Hızı</label>
                <EditableSelect fieldKey="learning_speed" label="Öğrenme Hızı" value={form.learning_speed} onChange={v => setForm({ ...form, learning_speed: v })} defaultOptions={[['cok_hizli', 'Çok Hızlı'], ['hizli', 'Hızlı'], ['normal', 'Normal'], ['yavas', 'Yavaş']]} />
              </div>
              <div className="form-group"><label className="form-label">🔓 Bağımsız Çalışma</label>
                <EditableSelect fieldKey="independence_level" label="Bağımsızlık" value={form.independence_level} onChange={v => setForm({ ...form, independence_level: v })} defaultOptions={[['tam', 'Tam Bağımsız'], ['kismen', 'Kısmen'], ['bagli', 'Bağımlı']]} />
              </div>
            </div>
          </div>

          {/* ===== ÇALIŞMA DİSİPLİNİ VE DAVRANIŞ ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(241,196,15,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f39c12', marginBottom: '8px' }}>⭐ Çalışma Disiplini & Davranış</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">📅 Aylık Devamsızlık</label>
                <EditableSelect fieldKey="attendance" label="Devamsızlık" value={form.attendance} onChange={v => setForm({ ...form, attendance: v })} defaultOptions={[['yok', 'Yok'], ['ayda_yarim', 'Ayda yarım gün (çok nadir)'], ['ayda_1', 'Ayda 1 gün'], ['ayda_2', 'Ayda 2 gün'], ['ayda_3_4', 'Ayda 3-4 gün'], ['ayda_5_ustu', 'Ayda 5+ gün (çok sık)']]} />
              </div>
              <div className="form-group"><label className="form-label">⏰ Sabah Geç Kalma</label>
                <EditableSelect fieldKey="punctuality" label="Geç Kalma" value={form.punctuality} onChange={v => setForm({ ...form, punctuality: v })} defaultOptions={[['herzaman', 'Asla geç kalmaz'], ['genelde', 'Nadiren'], ['bazen', 'Bazen'], ['sik', 'Sık'], ['surekli', 'Sürekli']]} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">📋 İzin Kullanımı (Çalışma Günlerinde)</label>
                {(() => {
                  const LEAVE_STORAGE_KEY = 'LEAVE_TYPES_CUSTOM';
                  const defaultLeaveTypes = [
                    { id: 'yillik_izin', label: '🏖️ Yıllık İzin', color: '#3498db' },
                    { id: 'saglik_raporu', label: '🏥 Sağlık Raporu', color: '#e74c3c' },
                    { id: 'ucretsiz_izin', label: '💤 Ücretsiz İzin', color: '#95a5a6' },
                    { id: 'aile_izni', label: '👨‍👩‍👧 Aile İzni (evlilik/ölüm)', color: '#8e44ad' },
                    { id: 'resmi_izin', label: '🏛️ Resmi Tatil', color: '#27ae60' },
                    { id: 'mazeret_izni', label: '📝 Mazeret İzni', color: '#f39c12' },
                  ];
                  let leaveTypes;
                  try { const saved = localStorage.getItem(LEAVE_STORAGE_KEY); leaveTypes = saved ? JSON.parse(saved) : [...defaultLeaveTypes]; } catch { leaveTypes = [...defaultLeaveTypes]; }
                  const saveLeaveTypes = (types) => { localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(types)); };
                  const handleRenameLeave = (idx) => {
                    const old = leaveTypes[idx].label;
                    const newLabel = prompt(`"${old}" adını ne olarak değiştirmek istiyorsunuz?`, old);
                    if (!newLabel || !newLabel.trim() || newLabel.trim() === old) return;
                    const updated = JSON.parse(JSON.stringify(leaveTypes));
                    const oldId = updated[idx].id;
                    const newId = newLabel.trim().toLowerCase().replace(/[^a-z0-9çşıöüğ]/g, '_').replace(/_+/g, '_');
                    updated[idx] = { ...updated[idx], id: newId, label: newLabel.trim() };
                    saveLeaveTypes(updated);
                    const izinler = (form.leave_types || '').split(',').map(s => s.trim()).filter(Boolean);
                    if (izinler.includes(oldId)) { setForm({ ...form, leave_types: izinler.map(s => s === oldId ? newId : s).join(', ') }); }
                    else { setForm({ ...form }); }
                  };
                  const handleDeleteLeave = (idx) => {
                    if (!confirm(`"${leaveTypes[idx].label}" izin tipini silmek istediğinize emin misiniz?`)) return;
                    const removedId = leaveTypes[idx].id;
                    const updated = leaveTypes.filter((_, i) => i !== idx);
                    saveLeaveTypes(updated);
                    const izinler = (form.leave_types || '').split(',').map(s => s.trim()).filter(Boolean);
                    setForm({ ...form, leave_types: izinler.filter(s => s !== removedId).join(', ') });
                  };
                  const handleAddLeave = () => {
                    const name = prompt('Yeni izin tipi ekleyin (ör: Doğum İzni):');
                    if (!name || !name.trim()) return;
                    const id = name.trim().toLowerCase().replace(/[^a-z0-9çşıöüğ]/g, '_').replace(/_+/g, '_');
                    if (leaveTypes.some(l => l.id === id)) { alert('Bu izin tipi zaten mevcut!'); return; }
                    const colors = ['#3498db', '#e74c3c', '#27ae60', '#8e44ad', '#f39c12', '#95a5a6', '#e67e22', '#1abc9c'];
                    const color = colors[leaveTypes.length % colors.length];
                    const updated = [...leaveTypes, { id, label: name.trim(), color }];
                    saveLeaveTypes(updated);
                    setForm({ ...form });
                  };
                  const izinler = (form.leave_types || '').split(',').map(s => s.trim()).filter(Boolean);
                  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {leaveTypes.map((izin, idx) => {
                      const isChecked = izinler.includes(izin.id);
                      return <div key={izin.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px 0 0 6px', background: isChecked ? `${izin.color}15` : 'var(--bg-input)', border: `1px solid ${isChecked ? izin.color : 'var(--border-color)'}`, cursor: 'pointer' }}>
                          <input type="checkbox" checked={isChecked} onChange={() => {
                            const newList = isChecked ? izinler.filter(s => s !== izin.id) : [...izinler, izin.id];
                            setForm({ ...form, leave_types: newList.join(', ') });
                          }} style={{ accentColor: izin.color }} />{izin.label}
                        </label>
                        <button type="button" title="İzin Adını Düzenle" onClick={() => handleRenameLeave(idx)} style={{ fontSize: '10px', padding: '4px 3px', border: '1px solid var(--border-color)', borderLeft: 'none', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '0' }}>✏️</button>
                        <button type="button" title="İzin Tipini Sil" onClick={() => handleDeleteLeave(idx)} style={{ fontSize: '10px', padding: '4px 3px', border: '1px solid var(--border-color)', borderLeft: 'none', background: 'rgba(231,76,60,0.06)', color: '#e74c3c', cursor: 'pointer', borderRadius: '0 6px 6px 0' }}>❌</button>
                      </div>;
                    })}
                    <button type="button" onClick={handleAddLeave} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(52,152,219,0.08)', border: '1px dashed rgba(52,152,219,0.4)', color: '#3498db', cursor: 'pointer', fontWeight: '600' }}>➕ İzin Tipi Ekle</button>
                  </div>;
                })()}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">💡 İnisiyatif Alma</label>
                <EditableSelect fieldKey="initiative_level" label="İnisiyatif" value={form.initiative_level} onChange={v => setForm({ ...form, initiative_level: v })} defaultOptions={[['yuksek', 'Yüksek'], ['orta', 'Orta'], ['dusuk', 'Düşük']]} />
              </div>
              <div className="form-group"><label className="form-label">🤝 Takım Çalışması</label>
                <EditableSelect fieldKey="teamwork_level" label="Takım" value={form.teamwork_level} onChange={v => setForm({ ...form, teamwork_level: v })} defaultOptions={[['cok_iyi', 'Çok İyi'], ['iyi', 'İyi'], ['orta', 'Orta'], ['zayif', 'Zayıf']]} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">🧩 Problem Çözme</label>
                <EditableSelect fieldKey="problem_solving" label="Problem" value={form.problem_solving} onChange={v => setForm({ ...form, problem_solving: v })} defaultOptions={[['cozer', 'Çözer'], ['sorar', 'Sorar'], ['bekler', 'Bekler']]} />
              </div>
              <div className="form-group"></div>
            </div>
          </div>

          {/* ===== P2: İŞ GEÇMİŞİ ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(142,68,173,0.2)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#8e44ad', marginBottom: '8px' }}>📂 İş Geçmişi</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Sözleşme Tipi</label>
                <EditableSelect fieldKey="contract_type" label="Sözleşme" value={form.contract_type} onChange={v => setForm({ ...form, contract_type: v })} defaultOptions={[['belirsiz', 'Belirsiz süreli'], ['belirli', 'Belirli süreli'], ['mevsimlik', 'Mevsimlik']]} /></div>
              <div className="form-group"><label className="form-label">SGK Giriş Tarihi</label><EditableInput type="date" value={form.sgk_entry_date} onChange={v => setForm({ ...form, sgk_entry_date: v })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Önceki İş Yeri</label>
                <EditableSelect fieldKey="previous_workplaces" label="Önceki İşyeri" value={form.previous_workplaces} onChange={v => setForm({ ...form, previous_workplaces: v })} defaultOptions={[['ilk_isi', 'İlk işi'], ['1-2', '1-2 iş yeri'], ['3-5', '3-5 iş yeri'], ['5+', '5+ iş yeri']]} /></div>
              <div className="form-group"><label className="form-label">Son İş Yeri Ayrılma Nedeni</label>
                <EditableSelect fieldKey="leave_reason" label="Ayrılma Nedeni" value={form.leave_reason} onChange={v => setForm({ ...form, leave_reason: v })} defaultOptions={[['', '— Seçiniz —'], ['maas', 'Maaş'], ['is_ortami', 'İş ortamı'], ['ailevi', 'Ailevi nedenler'], ['tasinma', 'Taşınma'], ['karsilikli', 'Karşılıklı ayrıldı'], ['ilk_isi', 'İlk işi'], ['belirtmek_istemiyor', 'Belirtmek istemiyor'], ['diger', 'Diğer']]} /></div>
            </div>
          </div>

          {/* ===== P6: FİZİKSEL & İŞ KAPASİTESİ (Sadeleştirildi) ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(231,76,60,0.2)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#e74c3c', marginBottom: '8px' }}>🏋️ Fiziksel & İş Kapasitesi</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Vücut Yapısı (iş ataması)</label>
                <EditableSelect fieldKey="body_type" label="Vücut Yapısı" value={form.body_type} onChange={v => setForm({ ...form, body_type: v })} defaultOptions={[['guclu_iri', 'Güçlü/İri'], ['normal', 'Normal'], ['ince_narin', 'İnce/Narin'], ['kilolu', 'Kilolu'], ['kisa_boylu', 'Kısa boylu']]} /></div>
              <div className="form-group"><label className="form-label">İş Kapasitesi</label>
                <EditableSelect fieldKey="work_capacity" label="Kapasite" value={form.work_capacity} onChange={v => setForm({ ...form, work_capacity: v })} defaultOptions={[['her_turlu', 'Her türlü işi yapar'], ['agir_yarim', 'Ağır işleri yapar'], ['agir_kisa', 'Ağır işleri kısa süre'], ['normal_rahat', 'Normal işleri rahat yapar'], ['normal_mola', 'Normal işler'], ['hafif', 'Hafif işlere uygun'], ['sadece_hafif', 'Sadece hafif işler']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">İSG Eğitimi Tarihi</label><EditableInput type="date" value={form.isg_training_date} onChange={v => setForm({ ...form, isg_training_date: v })} /></div>
              <div className="form-group"><label className="form-label">Son Sağlık Kontrolü</label><EditableInput type="date" value={form.last_health_check} onChange={v => setForm({ ...form, last_health_check: v })} /></div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>💡 Herkes kendi sağlığından sorumludur. Önce insan, sonra iş.</div>
          </div>

          {/* ===== P7: KARAKTERİSTİK ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(241,196,15,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1c40f', marginBottom: '8px' }}>🧠 Karakteristik & İnsan İlişkileri</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Güvenilirlik</label>
                <EditableSelect fieldKey="reliability" label="Güvenilirlik" value={form.reliability} onChange={v => setForm({ ...form, reliability: v })} defaultOptions={[['cok_guvenilir', 'Çok güvenilir'], ['guvenilir', 'Güvenilir'], ['normal', 'Normal'], ['degisken', 'Değişken']]} /></div>
              <div className="form-group"><label className="form-label">Temizlik/Hijyen</label>
                <EditableSelect fieldKey="hygiene" label="Hijyen" value={form.hygiene} onChange={v => setForm({ ...form, hygiene: v })} defaultOptions={[['cok_ozenli', 'Çok özenli'], ['normal', 'Normal'], ['dikkat', 'Dikkat gerekir']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Değişime Açıklık</label>
                <EditableSelect fieldKey="change_openness" label="Değişime Açıklık" value={form.change_openness} onChange={v => setForm({ ...form, change_openness: v })} defaultOptions={[['cok_acik', 'Çok açık'], ['acik', 'Açık'], ['direncli', 'Dirençli']]} /></div>
              <div className="form-group"><label className="form-label">Sorumluluğunu Kabul Etme</label>
                <EditableSelect fieldKey="responsibility_acceptance" label="Sorumluluk" value={form.responsibility_acceptance} onChange={v => setForm({ ...form, responsibility_acceptance: v })} defaultOptions={[['kabul_eder', 'Kabul eder'], ['kismen', 'Kısmen kabul eder'], ['reddeder', 'Başkasına atar']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Hata Görünce Duruş</label>
                <EditableSelect fieldKey="error_stance" label="Hata Duruş" value={form.error_stance} onChange={v => setForm({ ...form, error_stance: v })} defaultOptions={[['soyler_gosterir', 'Söyler ve gösterir'], ['soyler', 'Söyler ama çekinir'], ['susar', 'Susar'], ['fark_etmez', 'Fark etmez']]} /></div>
              <div className="form-group"></div>
            </div>
          </div>

          {/* ===== P9: İŞLEMLER & KUMAŞ DENEYİMİ ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(46,204,113,0.2)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#27ae60', marginBottom: '8px' }}>🎯 İşlem Becerileri & Kumaş Deneyimi</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Renk Tonu Eşleştirme</label>
                <EditableSelect fieldKey="color_tone_matching" label="Renk Eşleştirme" value={form.color_tone_matching} onChange={v => setForm({ ...form, color_tone_matching: v })} defaultOptions={[['fark_eder', 'Fark eder'], ['fark_eder_devam', 'Fark eder ama devam eder'], ['fark_etmez', 'Fark etmez']]} /></div>
              <div className="form-group"><label className="form-label">Kritik Eşleşme Sorumluluğu</label>
                <EditableSelect fieldKey="critical_matching" label="Kritik Eşleşme" value={form.critical_matching_responsibility} onChange={v => setForm({ ...form, critical_matching_responsibility: v })} defaultOptions={[['sorumluluk_alir', 'Sorumluluk alır'], ['sorulursa', 'Sorulursa söyler'], ['almaz', 'Sorumluluk almaz']]} /></div>
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#27ae60', marginTop: '10px', marginBottom: '6px' }}>🧵 Kumaş Tipi Deneyimi</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {(() => {
                let fabExp = {};
                try { fabExp = JSON.parse(form.fabric_experience || '{}'); } catch { }
                const FABRIC_KEY = 'SELECT_OPTIONS_fabric_types';
                let fabricTypes;
                try { const saved = localStorage.getItem(FABRIC_KEY); fabricTypes = saved ? JSON.parse(saved) : ['Penye', 'Esnek / Likralı', 'İnce Kumaş', 'Dokuma', 'Denim / Kot', 'Kadife', 'Astar / Tül', 'Triko']; } catch { fabricTypes = ['Penye', 'Esnek / Likralı', 'İnce Kumaş', 'Dokuma', 'Denim / Kot', 'Kadife', 'Astar / Tül', 'Triko']; }
                const saveFabricTypes = (types) => { localStorage.setItem(FABRIC_KEY, JSON.stringify(types)); };
                const FABRIC_LEVELS_KEY = 'SELECT_OPTIONS_fabric_levels';
                let fabricLevels;
                try { const saved = localStorage.getItem(FABRIC_LEVELS_KEY); fabricLevels = saved ? JSON.parse(saved) : [['', '— Deneyimi yok'], ['uzman', 'Uzman'], ['iyi', 'İyi'], ['orta', 'Orta'], ['zayif', 'Zayıf']]; } catch { fabricLevels = [['', '— Deneyimi yok'], ['uzman', 'Uzman'], ['iyi', 'İyi'], ['orta', 'Orta'], ['zayif', 'Zayıf']]; }
                const saveFabricLevels = (opts) => { localStorage.setItem(FABRIC_LEVELS_KEY, JSON.stringify(opts)); };
                return <>
                  {fabricTypes.map((fabric, idx) => (
                    <div key={fabric} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', minWidth: '80px', flex: '0 0 auto' }}>{fabric}</span>
                      <select style={{ flex: 1, fontSize: '11px', padding: '3px 4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                        value={fabExp[fabric] || ''} onChange={e => {
                          const updated = { ...fabExp };
                          if (e.target.value) updated[fabric] = e.target.value; else delete updated[fabric];
                          setForm({ ...form, fabric_experience: JSON.stringify(updated) });
                        }}>
                        {fabricLevels.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                      </select>
                      <button type="button" title="Kumaş Adını Düzenle" onClick={() => { const newName = prompt(`"${fabric}" adını değiştir:`, fabric); if (!newName || !newName.trim() || newName.trim() === fabric) return; const newTypes = [...fabricTypes]; newTypes[idx] = newName.trim(); saveFabricTypes(newTypes); const newExp = {}; Object.entries(fabExp).forEach(([k, v]) => { newExp[k === fabric ? newName.trim() : k] = v; }); setForm({ ...form, fabric_experience: JSON.stringify(newExp) }); }} style={{ fontSize: '10px', padding: '2px 4px', border: '1px solid var(--border-color)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '4px' }}>✏️</button>
                      <button type="button" title="Sil" onClick={() => { const newTypes = fabricTypes.filter((_, i) => i !== idx); saveFabricTypes(newTypes); const newExp = { ...fabExp }; delete newExp[fabric]; setForm({ ...form, fabric_experience: JSON.stringify(newExp) }); }} style={{ fontSize: '10px', padding: '2px 4px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', borderRadius: '4px', cursor: 'pointer' }}>❌</button>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <button type="button" onClick={() => { const name = prompt('Yeni kumaş tipi ekleyin:'); if (!name || !name.trim()) return; if (fabricTypes.includes(name.trim())) { alert('Bu kumaş zaten mevcut!'); return; } const newTypes = [...fabricTypes, name.trim()]; saveFabricTypes(newTypes); setForm({ ...form }); }} style={{ fontSize: '11px', padding: '4px 8px', border: '1px dashed rgba(52,152,219,0.4)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '4px' }}>➕ Kumaş Ekle</button>
                    <button type="button" onClick={() => { const selLevel = fabricLevels.find(([k]) => k !== ''); if (!selLevel) return; const nl = prompt(`Deneyim seviyesi düzenle:`, selLevel[1]); if (!nl || !nl.trim()) return; const i = fabricLevels.findIndex(([k]) => k === selLevel[0]); if (i >= 0) { const u = [...fabricLevels]; u[i] = [selLevel[0], nl.trim()]; saveFabricLevels(u); setForm({ ...form }); } }} style={{ fontSize: '11px', padding: '4px 8px', border: '1px solid var(--border-color)', background: 'rgba(52,152,219,0.06)', color: '#3498db', cursor: 'pointer', borderRadius: '4px' }}>✏️ Seviye Düzenle</button>
                    <button type="button" onClick={() => { const name = prompt('Yeni deneyim seviyesi ekleyin:'); if (!name || !name.trim()) return; const key = name.trim().toLowerCase().replace(/\s+/g, '_'); const u = [...fabricLevels, [key, name.trim()]]; saveFabricLevels(u); setForm({ ...form }); }} style={{ fontSize: '11px', padding: '4px 8px', border: '1px dashed rgba(46,204,113,0.4)', background: 'rgba(46,204,113,0.06)', color: '#27ae60', cursor: 'pointer', borderRadius: '4px' }}>➕ Seviye Ekle</button>
                  </div>
                </>;
              })()}
            </div>
          </div>

          {/* ===== P10: GELİŞİM ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(52,152,219,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#2980b9', marginBottom: '8px' }}>🚀 Gelişim & Kariyer</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">👑 Liderlik Potansiyeli</label>
                <EditableSelect fieldKey="leadership_potential" label="Liderlik" value={form.leadership_potential} onChange={v => setForm({ ...form, leadership_potential: v })} defaultOptions={[['yuksek', 'Yüksek'], ['potansiyel', 'Potansiyel'], ['hayir', 'Şu an uygun değil']]} /></div>
              <div className="form-group"><label className="form-label">🔧 Yeni Makina Öğrenme</label>
                <EditableSelect fieldKey="new_machine_learning" label="Yeni Makina" value={form.new_machine_learning} onChange={v => setForm({ ...form, new_machine_learning: v })} defaultOptions={[['aktif', 'Aktif öğreniyor'], ['istekli', 'İstekli'], ['destege_ihtiyac', 'Desteğe ihtiyacı var']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">💪 Zor İşten Kaçma</label>
                <EditableSelect fieldKey="hard_work_avoidance" label="Zor İş" value={form.hard_work_avoidance} onChange={v => setForm({ ...form, hard_work_avoidance: v })} defaultOptions={[['kacmaz', 'Kaçmaz'], ['isteksiz', 'İsteksiz'], ['kacar', 'Kaçar'], ['baskasinayikar', 'Başkasına yıkar']]} /></div>
              <div className="form-group"><label className="form-label">📈 Kendini Geliştirme</label>
                <EditableSelect fieldKey="self_improvement" label="Gelişim" value={form.self_improvement} onChange={v => setForm({ ...form, self_improvement: v })} defaultOptions={[['surekli', 'Sürekli gelişir'], ['gelisir', 'Gelişir'], ['yerinde', 'Yerinde sayar'], ['geriler', 'Geriler']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">📚 Eğitim İhtiyacı</label><EditableInput value={form.training_needs} onChange={v => setForm({ ...form, training_needs: v })} placeholder="Hangi konularda?" /></div>
              <div className="form-group"></div>
            </div>
          </div>

          {/* ===== P11: PERFORMANS ===== */}
          <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(212,168,71,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#D4A847', marginBottom: '8px' }}>⭐ Performans & Değerlendirme</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Operatör Sınıfı</label>
                <EditableSelect fieldKey="operator_class" label="Sınıf" value={form.operator_class} onChange={v => setForm({ ...form, operator_class: v })} defaultOptions={[['A', 'A'], ['B', 'B'], ['C', 'C']]} /></div>
              <div className="form-group"><label className="form-label">Tavsiye</label>
                <EditableSelect fieldKey="recommend" label="Tavsiye" value={form.recommend} onChange={v => setForm({ ...form, recommend: v })} defaultOptions={[['kesinlikle', 'Kesinlikle evet'], ['evet', 'Evet'], ['degerlendirmeli', 'Değerlendirmeli'], ['hayir', 'Hayır']]} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">📝 Genel Değerlendirme</label><div style={{ display: 'flex', gap: '2px', alignItems: 'flex-start' }}><textarea className="form-input" rows={2} placeholder="Yöneticinin kısa değerlendirmesi..." value={form.general_evaluation} onChange={e => setForm({ ...form, general_evaluation: e.target.value })} style={{ flex: 1 }} /><button type="button" title="Temizle" onClick={() => setForm({ ...form, general_evaluation: '' })} style={{ fontSize: '11px', padding: '4px 5px', border: '1px solid var(--border-color)', background: form.general_evaluation ? 'rgba(231,76,60,0.06)' : 'rgba(150,150,150,0.06)', color: form.general_evaluation ? '#e74c3c' : '#bbb', cursor: form.general_evaluation ? 'pointer' : 'default', borderRadius: '4px', minWidth: '26px', marginTop: '2px', opacity: form.general_evaluation ? 1 : 0.5 }}>❌</button></div></div>
            </div>
          </div>

          <div className="modal-footer">

            <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>

            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}</button>

          </div>

        </form>

      </div >

    </div >

  );

}



// ========== DIFFICULTY DISPLAY ==========

function DifficultyBar({ level }) {

  return (

    <div className="difficulty-bar">

      {Array.from({ length: 10 }, (_, i) => (

        <div key={i} className={`difficulty-dot ${i < level ? 'active' : ''} ${level <= 3 ? '' : level <= 6 ? 'medium' : 'high'

          }`} />

      ))}

      <span style={{

        marginLeft: '6px', fontSize: '12px', fontWeight: '600',

        color: level <= 3 ? 'var(--success)' : level <= 6 ? 'var(--warning)' : 'var(--danger)'

      }}>

        {level}

      </span>

    </div>

  );

}





// ========== DASHBOARD PAGE ==========

function DashboardPage({ models, personnel }) {

  const [todayStats, setTodayStats] = useState({ produced: 0, defective: 0, value: 0 });

  const [pendingApprovals, setPendingApprovals] = useState([]);

  const [lowPerformers, setLowPerformers] = useState([]);

  const [weeklyData, setWeeklyData] = useState([]);

  const [personnelPerf, setPersonnelPerf] = useState([]);

  const [dashExpenses, setDashExpenses] = useState([]);

  const [dashModelCosts, setDashModelCosts] = useState({});

  const totalOperations = models.reduce((sum, m) => sum + (m.operation_count || 0), 0);

  const totalOrders = models.reduce((sum, m) => sum + (m.total_order || 0), 0);

  const activeModels = models.filter(m => m.status === 'uretimde').length;



  const loadDashboardData = useCallback(async () => {

    const today = new Date().toISOString().split('T')[0];

    try {

      const [logsRes, approvalsRes] = await Promise.all([

        fetch(`/api/production?date=${today}`),

        fetch('/api/approvals?status=pending')

      ]);

      const logs = await logsRes.json();

      if (Array.isArray(logs)) {

        const produced = logs.reduce((s, l) => s + (l.total_produced || 0), 0);

        const defective = logs.reduce((s, l) => s + (l.defective_count || 0), 0);

        const value = logs.reduce((s, l) => s + ((l.total_produced || 0) * (l.unit_price || 0)), 0);

        setTodayStats({ produced, defective, value });

      }

      const approvals = await approvalsRes.json();

      setPendingApprovals(Array.isArray(approvals) ? approvals : []);

    } catch (err) { console.error(err); }



    // Düşük performans kontrolü (son 30 gün)

    try {

      const d30 = new Date(); d30.setDate(d30.getDate() - 30);

      const perfRes = await fetch(`/api/production?from=${d30.toISOString().split('T')[0]}`);

      const perfLogs = await perfRes.json();

      if (Array.isArray(perfLogs)) {

        const byPerson = {};

        perfLogs.forEach(log => {

          if (!byPerson[log.personnel_id]) byPerson[log.personnel_id] = { name: log.personnel_name, totalValue: 0, totalWage: 0, days: new Set() };

          byPerson[log.personnel_id].totalValue += (log.total_produced || 0) * (log.unit_price || 0);

          byPerson[log.personnel_id].totalWage += (log.daily_wage || 0);

          byPerson[log.personnel_id].days.add(log.start_time?.split('T')[0]);

        });

        const lowPerf = Object.entries(byPerson)

          .filter(([, p]) => p.days.size >= 5 && p.totalWage > 0 && (p.totalValue / p.totalWage) < 0.8)

          .map(([id, p]) => ({ id, name: p.name, coverage: Math.round((p.totalValue / p.totalWage) * 100), days: p.days.size }));

        setLowPerformers(lowPerf);

        // Personel performans tablosu (tüm personel)
        const allPerf = Object.entries(byPerson).map(([id, p]) => {
          const person = personnel.find(pr => pr.id == id);
          const totalCost = person ? ((person.base_salary || 0) + (person.ssk_cost || 0) + (person.transport_allowance || 0) + (person.food_allowance || 0) + (person.compensation || 0)) : 0;
          const daysCount = Math.max(1, p.days.size);
          const dailyWage = person?.daily_wage || 0;
          const wageCost = dailyWage * daysCount;
          const coverage = wageCost > 0 ? Math.round((p.totalValue / wageCost) * 100) : 0;
          return { id, name: p.name, days: daysCount, totalValue: Math.round(p.totalValue), wageCost: Math.round(wageCost), monthlyCost: totalCost, coverage };
        }).sort((a, b) => b.coverage - a.coverage);
        setPersonnelPerf(allPerf);

      }

    } catch (e) { }

    // Son 7 gün trend verisi
    try {
      const d7 = new Date(); d7.setDate(d7.getDate() - 7);
      const weekRes = await fetch(`/api/production?from=${d7.toISOString().split('T')[0]}`);
      const weekLogs = await weekRes.json();
      if (Array.isArray(weekLogs)) {
        const byDay = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          byDay[key] = { date: key, label: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }), produced: 0, defective: 0, value: 0 };
        }
        weekLogs.forEach(log => {
          const day = log.start_time?.split('T')[0];
          if (byDay[day]) {
            byDay[day].produced += log.total_produced || 0;
            byDay[day].defective += log.defective_count || 0;
            byDay[day].value += (log.total_produced || 0) * (log.unit_price || 0);
          }
        });
        setWeeklyData(Object.values(byDay));
      }
    } catch (e) { }

    // İşletme giderleri
    try {
      const n = new Date();
      const expRes = await fetch(`/api/expenses?year=${n.getFullYear()}&month=${n.getMonth() + 1}`);
      const expData = await expRes.json();
      setDashExpenses(Array.isArray(expData) ? expData : []);
    } catch (e) { }

    // Model bazlı maliyet (ay başından itibaren)
    try {
      const n = new Date();
      const monthStart = new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split('T')[0];
      const mcRes = await fetch(`/api/production?from=${monthStart}`);
      const mcLogs = await mcRes.json();
      if (Array.isArray(mcLogs)) {
        const mc = {};
        mcLogs.forEach(log => {
          const mid = log.model_id;
          if (!mc[mid]) mc[mid] = { name: log.model_name, code: log.model_code, totalProduced: 0, totalDefective: 0, totalValue: 0, totalLaborCost: 0 };
          mc[mid].totalProduced += log.total_produced || 0;
          mc[mid].totalDefective += log.defective_count || 0;
          mc[mid].totalValue += (log.total_produced || 0) * (log.unit_price || 0);
          mc[mid].totalLaborCost += (log.daily_wage || 0);
        });
        setDashModelCosts(mc);
      }
    } catch (e) { }

  }, [personnel]);



  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);



  const handleApproval = async (id, status) => {

    try {

      await fetch('/api/approvals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });

      setPendingApprovals(prev => prev.filter(a => a.id !== id));

    } catch (e) { console.error(e); }

  };



  const qualityRate = todayStats.produced > 0 ? Math.round((1 - todayStats.defective / todayStats.produced) * 100) : 100;



  return (

    <>

      <div className="topbar">

        <h1 className="topbar-title">📊 Ana Panel</h1>

        <div className="topbar-actions">

          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>

            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

          </span>

        </div>

      </div>

      <div className="page-content">

        <div className="stats-grid">

          <div className="stat-card"><div className="stat-icon">👗</div><div className="stat-value">{models.length}</div><div className="stat-label">Toplam Model</div></div>

          <div className="stat-card"><div className="stat-icon">⚙️</div><div className="stat-value">{totalOperations}</div><div className="stat-label">Toplam İşlem</div></div>

          <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{personnel.length}</div><div className="stat-label">Personel</div></div>

          <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-value">{totalOrders.toLocaleString('tr-TR')}</div><div className="stat-label">Toplam Sipariş</div></div>

        </div>



        {/* ONAY KUYRUĞU */}

        {pendingApprovals.length > 0 && (

          <div className="card" style={{ marginBottom: '16px', border: '2px solid rgba(243,156,18,0.3)' }}>

            <div className="card-header" style={{ background: 'rgba(243,156,18,0.05)' }}>

              <h3 className="card-title">✅✅ Onay Bekleyen İlk Ürünler ({pendingApprovals.length})</h3>

            </div>

            <div style={{ padding: '0' }}>

              {pendingApprovals.map(a => (

                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>

                  <div style={{ flex: 1 }}>

                    <strong>{a.personnel_name}</strong>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.model_name} ({a.model_code}) → {a.operation_name}</div>

                  </div>

                  {a.photo_path && <img src={a.photo_path} alt="Ürün" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--border-color)' }} />}

                  <div style={{ display: 'flex', gap: '6px' }}>

                    <button onClick={() => handleApproval(a.id, 'approved')} className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>✅ Onayla</button>

                    <button onClick={() => handleApproval(a.id, 'rejected')} className="btn btn-danger" style={{ fontSize: '12px', padding: '6px 12px' }}>❌ Red</button>

                  </div>

                </div>

              ))}

            </div>

          </div>

        )}



        {/* DÜŞÜK PERFORMANS UYARISI */}

        {lowPerformers.length > 0 && (

          <div className="card" style={{ marginBottom: '16px', border: '2px solid rgba(231,76,60,0.3)' }}>

            <div className="card-header" style={{ background: 'rgba(231,76,60,0.05)' }}>

              <h3 className="card-title">⚠️ Düşük Performans Uyarısı (Son 30 Gün)</h3>

            </div>

            <div style={{ padding: '12px 16px' }}>

              {lowPerformers.map(p => (

                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>

                  <span><strong>{p.name}</strong> <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({p.days} aktif gün)</span></span>

                  <span className="badge badge-danger">Ücret Karşılama: %{p.coverage}</span>

                </div>

              ))}

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>

                1. Ay: Uyarı verilir  2. Ay: Değerlendirme yapılır  3. Ay: Karar alınır

              </p>

            </div>

          </div>

        )}



        <div className="card" style={{ marginBottom: '16px' }}>

          <div className="card-header"><h3 className="card-title">🏭 Bugünkü Üretim</h3></div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '4px 0' }}>

            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)' }}>{todayStats.produced}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Üretilen Adet</div></div>

            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: '700', color: qualityRate >= 95 ? 'var(--success)' : 'var(--danger)' }}>%{qualityRate}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kalite Oranı</div></div>

            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--warning)' }}>{activeModels}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aktif Model</div></div>

            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>{todayStats.value.toFixed(0)} ₺</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Günlük Üretim Değeri</div></div>

          </div>

        </div>

        {models.length === 0 ? (

          <div className="card"><div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-title">Sisteme Hoş Geldiniz!</div><div className="empty-state-text">Başlamak için sol menüden "Modeller" sayfasına gidin ve ilk modelinizi ekleyin.</div></div></div>

        ) : (

          <div className="card">

            <div className="card-header"><h3 className="card-title">Son Modeller</h3></div>

            <div className="table-wrapper" style={{ border: 'none' }}>

              <table className="table"><thead><tr><th>Model</th><th>Kod</th><th>İşlem Sayısı</th><th>Sipariş</th><th>Durum</th></tr></thead>

                <tbody>{models.slice(0, 5).map(model => (

                  <tr key={model.id}>

                    <td style={{ fontWeight: '600' }}>{model.name}</td>

                    <td><code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>{model.code}</code></td>

                    <td>{model.operation_count || 0} işlem</td>

                    <td>{(model.total_order || 0).toLocaleString('tr-TR')} adet</td>

                    <td><span className={`badge ${model.status === 'prototip' ? 'badge-info' : model.status === 'uretimde' ? 'badge-success' : 'badge-warning'}`}>{model.status === 'prototip' ? '📋 Prototip' : model.status === 'uretimde' ? '📋ş Üretimde' : model.status}</span></td>

                  </tr>

                ))}</tbody>

              </table>

            </div>

          </div>

        )}

        {/* SON 7 GÜN TREND GRAFİĞİ */}
        {weeklyData.length > 0 && (() => {
          const maxProd = Math.max(1, ...weeklyData.map(d => d.produced));
          return (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><h3 className="card-title">📊 Son 7 Gün Üretim Trendi</h3></div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '180px' }}>
                  {weeklyData.map((d, i) => {
                    const barH = Math.max(4, (d.produced / maxProd) * 150);
                    const isToday = d.date === new Date().toISOString().split('T')[0];
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: d.produced > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {d.produced > 0 ? d.produced : ''}
                        </div>
                        <div style={{ width: '100%', maxWidth: '60px', height: `${barH}px`, borderRadius: '6px 6px 2px 2px', background: isToday ? 'linear-gradient(180deg, #3498db, rgba(52,152,219,0.4))' : d.produced > 0 ? 'linear-gradient(180deg, rgba(46,204,113,0.8), rgba(46,204,113,0.4))' : 'var(--bg-input)', transition: 'height 0.5s ease', position: 'relative' }}>
                          {d.defective > 0 && (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${Math.max(2, (d.defective / maxProd) * 150)}px`, background: 'rgba(231,76,60,0.7)', borderRadius: '0 0 2px 2px' }} />
                          )}
                        </div>
                        <div style={{ fontSize: '10px', color: isToday ? '#3498db' : 'var(--text-muted)', fontWeight: isToday ? '700' : '400', textAlign: 'center' }}>{d.label}</div>
                        {d.value > 0 && <div style={{ fontSize: '9px', color: 'var(--success)' }}>{d.value.toFixed(0)}₺</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>🟢 Üretim</span>
                  <span>🔴 Hatalı</span>
                  <span>🔵 Bugün</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* PERSONEL PERFORMANS TABLOSU */}
        {personnelPerf.length > 0 && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header"><h3 className="card-title">🏆 Personel Performans Sıralaması (Son 30 Gün)</h3></div>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="table">
                <thead><tr><th>#</th><th>Personel</th><th>Gün</th><th>Üretim Değeri</th><th>Ücret</th><th>Karşılama</th><th>Durum</th></tr></thead>
                <tbody>
                  {personnelPerf.map((p, i) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: '700', textAlign: 'center' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td style={{ fontWeight: '600' }}>{p.name}</td>
                      <td style={{ textAlign: 'center' }}>{p.days}</td>
                      <td style={{ fontWeight: '600', color: 'var(--success)' }}>{p.totalValue.toLocaleString('tr-TR')} ₺</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.wageCost.toLocaleString('tr-TR')} ₺</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ flex: 1, height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, p.coverage)}%`, height: '100%', borderRadius: '4px', background: p.coverage >= 100 ? 'var(--success)' : p.coverage >= 80 ? '#f39c12' : 'var(--danger)', transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: p.coverage >= 100 ? 'var(--success)' : p.coverage >= 80 ? '#f39c12' : 'var(--danger)', minWidth: '36px' }}>%{p.coverage}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${p.coverage >= 100 ? 'badge-success' : p.coverage >= 80 ? 'badge-warning' : 'badge-danger'}`}>
                          {p.coverage >= 120 ? '⭐ Yıldız' : p.coverage >= 100 ? '✅ İyi' : p.coverage >= 80 ? '⚠️ Takip' : '🔴 Düşük'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PERSONEL MALİYET ÖZETİ */}
        {personnelPerf.length > 0 && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header"><h3 className="card-title">💰 Aylık Personel Maliyet Özeti</h3></div>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="table">
                <thead><tr><th>Personel</th><th>Maaş</th><th>SSK</th><th>Ulaşım</th><th>Yemek</th><th>Toplam Maliyet</th><th>Üretim Değeri</th><th>Fark</th></tr></thead>
                <tbody>
                  {personnel.filter(p => p.status === 'active').map(p => {
                    const total = (p.base_salary || 0) + (p.ssk_cost || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0) + (p.compensation || 0);
                    const perf = personnelPerf.find(pp => pp.id == p.id);
                    const prodVal = perf?.totalValue || 0;
                    const diff = prodVal - total;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '600' }}>{p.name}</td>
                        <td>{(p.base_salary || 0).toLocaleString('tr-TR')} ₺</td>
                        <td>{(p.ssk_cost || 0).toLocaleString('tr-TR')} ₺</td>
                        <td>{(p.transport_allowance || 0).toLocaleString('tr-TR')} ₺</td>
                        <td>{(p.food_allowance || 0).toLocaleString('tr-TR')} ₺</td>
                        <td style={{ fontWeight: '700', color: '#8e44ad' }}>{total.toLocaleString('tr-TR')} ₺</td>
                        <td style={{ fontWeight: '600', color: 'var(--success)' }}>{prodVal.toLocaleString('tr-TR')} ₺</td>
                        <td style={{ fontWeight: '700', color: diff >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {diff >= 0 ? '+' : ''}{diff.toLocaleString('tr-TR')} ₺
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODEL BAZLI KARLILIK */}
        {Object.keys(dashModelCosts).length > 0 && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header"><h3 className="card-title">📦 Model Bazlı Karlılık (Bu Ay)</h3></div>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="table">
                <thead><tr><th>Model</th><th>Üretim</th><th>Fire %</th><th>Değer</th><th>İşçilik</th><th>Birim Maliyet</th><th>Karlılık</th></tr></thead>
                <tbody>
                  {Object.entries(dashModelCosts).map(([mid, mc]) => {
                    const model = models.find(m => m.id == mid);
                    const fireRate = mc.totalProduced > 0 ? (mc.totalDefective / mc.totalProduced * 100) : 0;
                    const unitCost = mc.totalProduced > 0 ? mc.totalLaborCost / mc.totalProduced : 0;
                    const fasonPrice = model?.fason_price || 0;
                    const profit = fasonPrice > 0 ? fasonPrice - unitCost : mc.totalProduced > 0 ? (mc.totalValue - mc.totalLaborCost) / mc.totalProduced : 0;
                    return (
                      <tr key={mid}>
                        <td><strong>{mc.name}</strong><br /><code style={{ fontSize: '11px', background: 'var(--bg-input)', padding: '1px 4px', borderRadius: '3px' }}>{mc.code}</code></td>
                        <td style={{ fontWeight: '700' }}>{mc.totalProduced} ad</td>
                        <td><span className={`badge ${fireRate > 5 ? 'badge-danger' : fireRate > 2 ? 'badge-warning' : 'badge-success'}`}>{fireRate.toFixed(1)}%</span></td>
                        <td style={{ fontWeight: '600', color: 'var(--accent)' }}>{mc.totalValue.toFixed(0)} ₺</td>
                        <td style={{ color: 'var(--danger)' }}>{mc.totalLaborCost.toFixed(0)} ₺</td>
                        <td style={{ fontWeight: '700' }}>{unitCost.toFixed(2)} ₺/ad</td>
                        <td><span style={{ fontWeight: '700', color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{profit >= 0 ? '+' : ''}{profit.toFixed(2)} ₺</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* İŞLETME GİDERLERİ DAĞILIMI */}
        {dashExpenses.length > 0 && (() => {
          const catTotals = {};
          dashExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + (e.amount || 0); });
          const totalExp = Object.values(catTotals).reduce((s, v) => s + v, 0);
          const catLabels = {
            elektrik: '⚡ Elektrik', su: '💧 Su', internet_telefon: '📡 İnternet/Tel',
            sigorta: '🛡️ Sigorta', iplik: '🧵 İplik/Malzeme', makine_bakim: '🔧 Makine Bakım',
            yedek_parca: '⚙️ Yedek Parça', araba_benzin: '⛽ Benzin', araba_bakim: '🚗 Araba Bakım',
            muhasebe: '🧾 Muhasebe', kdv: '📋 KDV', stopaj: '📄 Stopaj', vergi: '🏛️ Vergi',
            personel_maas: '💰 Personel Maaş', personel_yemek: '🍽️ Yemek', personel_yol: '🚌 Yol',
            personel_mesai: '⏰ Mesai', temizlik: '🧹 Temizlik', mutfak: '☕ Mutfak', diger: '📦 Diğer'
          };
          return (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">
                <h3 className="card-title">🏢 İşletme Giderleri — {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h3>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#e67e22' }}>{totalExp.toLocaleString('tr-TR')} ₺</span>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {
                    const pct = totalExp > 0 ? (total / totalExp * 100).toFixed(1) : 0;
                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', width: '130px' }}>{catLabels[cat] || cat}</span>
                        <div style={{ flex: 1, height: '20px', background: 'var(--bg-input)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), #e67e22)', borderRadius: '10px', minWidth: pct > 0 ? '4px' : '0' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '80px', textAlign: 'right' }}>{total.toLocaleString('tr-TR')} ₺</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '40px' }}>%{pct}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

      </div>

    </>

  );

}



// ========== ÜRETİM GİRİŞ BARI — ASKER GÖREVİ ==========

function UretimTabBar({ models, personnel, addToast }) {
  const [aktif, setAktif] = useState('giris');
  // Çok dil desteği — TR & AR
  const LANG = {
    tr: {
      parti_kabul: '📦 Parti Kabul', ilk_urun: '🧵 İlk Ürün', giris: '📥 Üretim Girişi', gecmis: '📋 Geçmiş',
      firma: 'Firma Adı', model: 'Model', getiren: 'Getiren Personel', kabul_eden: 'Kabul Eden',
      tarih: 'Geliş Tarihi', arac: 'Araç Plakası', toplam: 'Toplam Adet',
      parca_k: 'Parça Kontrolü', aksesuar_k: 'Aksesuar Kontrolü', kalip_k: 'Kalıp Arşivi',
      kaydet: 'Kaydet', temizle: 'Temizle', tam: 'Tam Kabul', eksikli: 'Eksikli Kabul', ret: 'Ret',
    },
    ar: {
      parti_kabul: '📦 استقبال', ilk_urun: '🧵 أول منتج', giris: '📥 إدخال', gecmis: '📋 السجل',
      firma: 'اسم الشركة', model: 'الموديل', getiren: 'الموظف الجالب', kabul_eden: 'المستقبل',
      tarih: 'تاريخ الوصول', arac: 'لوحة السيارة', toplam: 'الكمية الإجمالية',
      parca_k: 'فحص القطع', aksesuar_k: 'فحص الاكسسوارات', kalip_k: 'أرشيف القوالب',
      kaydet: 'حفظ', temizle: 'مسح', tam: 'قبول كامل', eksikli: 'قبول ناقص', ret: 'رفض',
    }
  };
  const [dil, setDil] = useState('tr');
  const L = LANG[dil];

  // M1 Parti Kabul State
  const [pkForm, setPkForm] = useState({
    model_id: '', firma_adi: '', getiren_personel_id: '', kabul_eden_id: '',
    gelis_tarihi: new Date().toISOString().slice(0, 16), arac_plaka: '', tasima_tipi: 'kendi_araci',
    toplam_adet: '', beden_listesi: [], beden_girisi: '',
    parca_eksik: false, parca_eksik_not: '', beden_eksik: false, beden_eksik_not: '',
    dugme_var: false, dugme_adet: '', fermuar_var: false, fermuar_tip: '',
    etiket_geldi: false, yikama_talimati_geldi: false, hang_tag_geldi: false, aksesuar_not: '',
    kabul_durum: 'tam', notlar: ''
  });
  const [pkKayit, setPkKayit] = useState(false);
  const [pkListesi, setPkListesi] = useState([]);
  const [kalipListesi, setKalipListesi] = useState([]);  // Her beden için kalıp kaydı

  // M2 İlk Ürün State
  const [iuForm, setIuForm] = useState({
    model_id: '', kalip_beden: '', ara_iscilik: [],
    makineci_sayi: '', kasar_sayi: '', utuku_sayi: '',
    ortaci_sayi: '', ara_isci_sayi: '', kalite_sayi: '1', notlar: ''
  });
  const [araIscilikGirisi, setAraIscilikGirisi] = useState('');
  const [iuKayit, setIuKayit] = useState(false);

  const bedenEkle = () => {
    const b = pkForm.beden_girisi.trim().toUpperCase();
    if (b && !pkForm.beden_listesi.includes(b)) {
      setPkForm(f => ({ ...f, beden_listesi: [...f.beden_listesi, b], beden_girisi: '' }));
      setKalipListesi(prev => [...prev, { beden: b, foto_url: '', saklama_yeri: '', kalip_alindi: false }]);
    }
  };

  const bedenSil = (b) => {
    setPkForm(f => ({ ...f, beden_listesi: f.beden_listesi.filter(x => x !== b) }));
    setKalipListesi(prev => prev.filter(k => k.beden !== b));
  };

  const araIscilikEkle = () => {
    if (araIscilikGirisi.trim()) {
      setIuForm(f => ({ ...f, ara_iscilik: [...f.ara_iscilik, { tanim: araIscilikGirisi.trim(), sure_dk: '' }] }));
      setAraIscilikGirisi('');
    }
  };

  const handlePkKaydet = async () => {
    if (!pkForm.firma_adi) { addToast('error', 'Firma adı zorunlu'); return; }
    setPkKayit(true);
    try {
      const res = await fetch('/api/parti-kabul', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pkForm, beden_listesi: pkForm.beden_listesi, toplam_adet: parseInt(pkForm.toplam_adet) || 0 })
      });
      if (!res.ok) throw new Error('Kayıt hatası');
      const data = await res.json();
      addToast('success', '✅ Parti Kabul kaydedildi!');
      setPkListesi(prev => [{ id: data.id, firma_adi: pkForm.firma_adi, model_adi: models.find(m => String(m.id) === String(pkForm.model_id))?.name || '—', kabul_durum: pkForm.kabul_durum, toplam_adet: pkForm.toplam_adet, created_at: new Date().toISOString() }, ...prev]);
      setPkForm(f => ({ ...f, firma_adi: '', notlar: '', toplam_adet: '', beden_listesi: [], beden_girisi: '' }));
      setKalipListesi([]);
    } catch (e) { addToast('error', e.message); }
    finally { setPkKayit(false); }
  };

  const handleIuKaydet = async () => {
    if (!iuForm.model_id) { addToast('error', 'Model seçin'); return; }
    setIuKayit(true);
    try {
      await fetch('/api/parti-kabul?tip=ilk_urun', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...iuForm, type: 'ilk_urun', ara_iscilik: JSON.stringify(iuForm.ara_iscilik) })
      });
      addToast('success', '✅ İlk Ürün hazırlık kaydedildi!');
    } catch (e) { addToast('error', e.message); }
    finally { setIuKayit(false); }
  };

  // ===== M5: ARA KONTROL STATE =====
  const [akForm, setAkForm] = useState({
    model_id: '', kontrol_eden_id: '', istasyon: 'Dikim',
    sira_no: '', beden: '', adet: '', hatali: '0',
    foto_url: '', numune_foto_url: '', onay: null, ret_nedeni: '', notlar: ''
  });
  const [akKayitlar, setAkKayitlar] = useState([]);
  const [akYukleniyor, setAkYukleniyor] = useState(false);

  const akFotoSec = (e, field) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAkForm(f => ({ ...f, [field]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleAkKaydet = async () => {
    if (!akForm.model_id) { addToast('error', 'Model seçin'); return; }
    if (akForm.onay === null) { addToast('error', 'Onay/Ret seçin'); return; }
    setAkYukleniyor(true);
    try {
      const res = await fetch('/api/ara-kontrol', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...akForm, adet: parseInt(akForm.adet) || 0, hatali: parseInt(akForm.hatali) || 0, sira_no: parseInt(akForm.sira_no) || null })
      });
      if (!res.ok) throw new Error('Kayıt hatası');
      addToast('success', '✅ Ara kontrol kaydedildi!');
      setAkKayitlar(prev => [{ ...akForm, id: Date.now() }, ...prev]);
      setAkForm(f => ({ ...f, sira_no: '', adet: '', hatali: '0', foto_url: '', onay: null, ret_nedeni: '', notlar: '' }));
    } catch (e) { addToast('error', e.message); }
    finally { setAkYukleniyor(false); }
  };

  // ===== M6: MALİYET+PRİM STATE =====
  const [mpData, setMpData] = useState([]);
  const [mpDonem, setMpDonem] = useState('gunluk');
  const [mpYukleniyor, setMpYukleniyor] = useState(false);

  const mpYukle = async (donem) => {
    setMpYukleniyor(true);
    try {
      const tarih = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/personel-maliyet?donem=${donem}&tarih=${tarih}`);
      const data = await res.json();
      setMpData(Array.isArray(data) ? data : []);
    } catch { addToast('error', 'Maliyet verisi yüklenemedi'); }
    finally { setMpYukleniyor(false); }
  };

  const [form, setForm] = useState({
    model_id: '', getiren_personel_id: '', acan_personel_id: '',
    acilis_tarihi: new Date().toISOString().slice(0, 16),
    parti_no: '', asorti: '',
    beden_eksik: false, beden_eksik_detay: '',
    aksesuar_eksik: false, aksesuar_eksik_detay: '',
    kumas_eksik: false, kumas_eksik_detay: '',
    numune_ayrildi: true, parca_sayisi: 0, notlar: ''
  });
  const [parcaFotolar, setParcaFotolar] = useState([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [gecmis, setGecmis] = useState([]);

  useEffect(() => {
    if (aktif === 'gecmis') fetch('/api/uretim-giris').then(r => r.json()).then(d => setGecmis(Array.isArray(d) ? d : [])).catch(() => { });
  }, [aktif]);

  useEffect(() => {
    const adet = parseInt(form.parca_sayisi) || 0;
    setParcaFotolar(Array.from({ length: adet }, (_, i) => ({ url: '', ad: `Parça ${i + 1}` })));
  }, [form.parca_sayisi]);

  const handleKaydet = async () => {
    if (!form.model_id) { addToast('error', 'Model seçin'); return; }
    setKaydediliyor(true);
    try {
      const res = await fetch('/api/uretim-giris', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, model_id: parseInt(form.model_id), getiren_personel_id: form.getiren_personel_id ? parseInt(form.getiren_personel_id) : null, acan_personel_id: form.acan_personel_id ? parseInt(form.acan_personel_id) : null, parca_sayisi: parseInt(form.parca_sayisi) || 0, parcalar: parcaFotolar })
      });
      if (!res.ok) throw new Error('Kayıt hatası');
      addToast('success', '✅ Üretim girişi kaydedildi!');
      setForm(f => ({ ...f, model_id: '', notlar: '', beden_eksik: false, aksesuar_eksik: false, kumas_eksik: false, parca_sayisi: 0 }));
    } catch (e) { addToast('error', e.message); }
    finally { setKaydediliyor(false); }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Dil seçici + sekme başlığı */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>🔩 ÜRETİM SÜRECİ</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['tr', 'ar'].map(d => (
            <button key={d} onClick={() => setDil(d)} style={{ padding: '2px 8px', fontSize: '11px', background: dil === d ? 'var(--accent)' : 'transparent', color: dil === d ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
              {d === 'tr' ? '🇹🇷 TR' : '🇸🇦 AR'}
            </button>
          ))}
        </div>
      </div>

      {/* Sekme bar */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '12px', borderBottom: '2px solid var(--border-color)', overflowX: 'auto' }}>
        {[
          ['parti_kabul', L.parti_kabul],
          ['ilk_urun', L.ilk_urun],
          ['ara_kontrol', '🔍 Ara Kontrol'],
          ['maliyet_prim', '💰 Maliyet & Prim'],
          ['giris', L.giris],
          ['gecmis', L.gecmis],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setAktif(id)} style={{ padding: '8px 14px', background: 'none', border: 'none', borderBottom: aktif === id ? '2px solid var(--accent)' : '2px solid transparent', color: aktif === id ? 'var(--accent)' : 'var(--text-muted)', fontWeight: aktif === id ? '700' : '500', cursor: 'pointer', fontSize: '12px', marginBottom: '-2px', whiteSpace: 'nowrap' }}>{lbl}</button>
        ))}
      </div>

      {/* =========== M1: PARTİ KABUL =========== */}
      {aktif === 'parti_kabul' && (
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '14px', color: 'var(--accent)' }}>📦 {L.parti_kabul} — Fabrika Kapısı Girişi</div>

            {/* Pencere 1: Getiriş Bilgileri */}
            <div style={{ background: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#3498db', marginBottom: '10px' }}>🚚 1. Getiriş Bilgileri</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px' }}>
                <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{L.firma} *</label>
                  <input className="form-input" value={pkForm.firma_adi} onChange={e => setPkForm(f => ({ ...f, firma_adi: e.target.value }))} placeholder="Örn: Robes Fashion" /></div>
                <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{L.model}</label>
                  <select className="form-input" value={pkForm.model_id} onChange={e => setPkForm(f => ({ ...f, model_id: e.target.value }))}>
                    <option value="">-- Model --</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                  </select></div>
                <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{L.getiren}</label>
                  <select className="form-input" value={pkForm.getiren_personel_id} onChange={e => setPkForm(f => ({ ...f, getiren_personel_id: e.target.value }))}>
                    <option value="">-- Personel --</option>
                    {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select></div>
                <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{L.kabul_eden}</label>
                  <select className="form-input" value={pkForm.kabul_eden_id} onChange={e => setPkForm(f => ({ ...f, kabul_eden_id: e.target.value }))}>
                    <option value="">-- Personel --</option>
                    {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select></div>
                <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{L.tarih}</label>
                  <input type="datetime-local" className="form-input" value={pkForm.gelis_tarihi} onChange={e => setPkForm(f => ({ ...f, gelis_tarihi: e.target.value }))} /></div>
                <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{L.toplam} (Adet)</label>
                  <input type="number" className="form-input" min="0" value={pkForm.toplam_adet} onChange={e => setPkForm(f => ({ ...f, toplam_adet: e.target.value }))} /></div>
                <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Taşıma Tipi</label>
                  <select className="form-input" value={pkForm.tasima_tipi} onChange={e => setPkForm(f => ({ ...f, tasima_tipi: e.target.value }))}>
                    <option value="kendi_araci">Kendi Aracı</option>
                    <option value="kargo">Kargo</option>
                    <option value="kurye">Kurye</option>
                  </select></div>
                <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{L.arac}</label>
                  <input className="form-input" value={pkForm.arac_plaka} onChange={e => setPkForm(f => ({ ...f, arac_plaka: e.target.value }))} placeholder="34 ABC 123" /></div>
              </div>
            </div>

            {/* Pencere 2: Beden Listesi */}
            <div style={{ background: 'rgba(46,204,113,0.06)', border: '1px solid rgba(46,204,113,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#27ae60', marginBottom: '10px' }}>📐 2. Beden Listesi</div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                <input className="form-input" style={{ flex: 1, fontSize: '12px' }} placeholder="Beden gir (örn: 36, S, XL)" value={pkForm.beden_girisi}
                  onChange={e => setPkForm(f => ({ ...f, beden_girisi: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && bedenEkle()} />
                <button type="button" onClick={bedenEkle} style={{ padding: '6px 14px', background: 'rgba(46,204,113,0.2)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>+ Ekle</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {pkForm.beden_listesi.map(b => (
                  <span key={b} style={{ padding: '3px 10px', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {b} <span onClick={() => bedenSil(b)} style={{ color: '#e74c3c', fontWeight: '900', cursor: 'pointer' }}>×</span>
                  </span>
                ))}
                {pkForm.beden_listesi.length === 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Henüz beden eklenmedi</span>}
              </div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={pkForm.beden_eksik} onChange={e => setPkForm(f => ({ ...f, beden_eksik: e.target.checked }))} />Beden Eksiği Var
                </label>
                {pkForm.beden_eksik && <input className="form-input" style={{ flex: 1, fontSize: '11px' }} placeholder="Hangi bedenler eksik?" value={pkForm.beden_eksik_not} onChange={e => setPkForm(f => ({ ...f, beden_eksik_not: e.target.value }))} />}
              </div>
            </div>

            {/* Pencere 3: Parça & Aksesuar Kontrolü */}
            <div style={{ background: 'rgba(231,76,60,0.05)', border: '1px solid rgba(231,76,60,0.15)', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#e74c3c', marginBottom: '10px' }}>🔩 3. Parça & Aksesuar Kontrolü</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '10px', marginBottom: '10px' }}>
                {[
                  ['parca_eksik', 'parca_eksik_not', '✂️ Parça Eksiği'],
                  ['dugme_var', null, '🔘 Düğme Geldi'],
                  ['fermuar_var', null, '🫧 Fermuar Geldi'],
                  ['etiket_geldi', null, '🏷️ Etiket Geldi'],
                  ['yikama_talimati_geldi', null, '🧺 Yıkama Talimatı'],
                  ['hang_tag_geldi', null, '🔖 Hang Tag Geldi'],
                ].map(([alan, detay, lbl]) => (
                  <label key={alan} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: pkForm[alan] ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.06)', border: `1px solid ${pkForm[alan] ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.2)'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    <input type="checkbox" checked={pkForm[alan]} onChange={e => setPkForm(f => ({ ...f, [alan]: e.target.checked }))} />
                    {lbl}
                  </label>
                ))}
              </div>
              <input className="form-input" style={{ fontSize: '11px' }} placeholder="Aksesuar notu..." value={pkForm.aksesuar_not} onChange={e => setPkForm(f => ({ ...f, aksesuar_not: e.target.value }))} />
            </div>

            {/* Pencere 4: Kalıp Arşivi */}
            {kalipListesi.length > 0 && (
              <div style={{ background: 'rgba(212,168,71,0.06)', border: '1px solid rgba(212,168,71,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#D4A847', marginBottom: '10px' }}>📐 4. {L.kalip_k} — Her Bedenden 1 Numune</div>
                {kalipListesi.map((k, i) => (
                  <div key={k.beden} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ padding: '2px 10px', background: 'rgba(212,168,71,0.15)', borderRadius: '12px', fontSize: '12px', fontWeight: '700', minWidth: '40px', textAlign: 'center' }}>{k.beden}</span>
                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={k.kalip_alindi} onChange={e => { const u = [...kalipListesi]; u[i] = { ...u[i], kalip_alindi: e.target.checked }; setKalipListesi(u); }} />Kalıp Alındı
                    </label>
                    <input className="form-input" style={{ flex: 1, fontSize: '11px' }} placeholder="Saklama yeri (raf, kasa vb.)" value={k.saklama_yeri} onChange={e => { const u = [...kalipListesi]; u[i] = { ...u[i], saklama_yeri: e.target.value }; setKalipListesi(u); }} />
                  </div>
                ))}
              </div>
            )}

            {/* Pencere 5: Kabul Durumu + Not */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600' }}>Kabul Durumu:</div>
              {[['tam', '✅ ' + L.tam, '#27ae60'], ['eksikli', '⚠️ ' + L.eksikli, '#f39c12'], ['ret', '❌ ' + L.ret, '#e74c3c']].map(([val, lbl, clr]) => (
                <button key={val} type="button" onClick={() => setPkForm(f => ({ ...f, kabul_durum: val }))}
                  style={{ padding: '5px 12px', background: pkForm.kabul_durum === val ? clr : 'transparent', color: pkForm.kabul_durum === val ? '#fff' : clr, border: `1px solid ${clr}`, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                  {lbl}
                </button>
              ))}
              <input className="form-input" style={{ flex: 1, fontSize: '11px' }} placeholder="Not..." value={pkForm.notlar} onChange={e => setPkForm(f => ({ ...f, notlar: e.target.value }))} />
            </div>

            <button onClick={handlePkKaydet} disabled={pkKayit || !pkForm.firma_adi}
              style={{ padding: '10px 28px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
              {pkKayit ? '⏳...' : '✅ ' + L.kaydet + ' — Parti Kabul'}
            </button>
          </div>

          {/* Son Kayıtlar */}
          {pkListesi.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>📋 Son Kabul Kayıtları</div>
              {pkListesi.slice(0, 5).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-input)', borderRadius: '6px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '12px' }}><b>{r.firma_adi}</b> — {r.model_adi} — {r.toplam_adet} adet</div>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: r.kabul_durum === 'tam' ? 'rgba(46,204,113,0.2)' : r.kabul_durum === 'eksikli' ? 'rgba(243,156,18,0.2)' : 'rgba(231,76,60,0.2)', color: r.kabul_durum === 'tam' ? '#27ae60' : r.kabul_durum === 'eksikli' ? '#f39c12' : '#e74c3c' }}>{r.kabul_durum}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========== M2: İLK ÜRÜN HAZIRLAMA =========== */}
      {aktif === 'ilk_urun' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '14px', color: '#9b59b6' }}>🧵 {L.ilk_urun} — Seri Üretime Hazırlık</div>

          {/* Model Seç */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px', marginBottom: '14px' }}>
            <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Model *</label>
              <select className="form-input" value={iuForm.model_id} onChange={e => setIuForm(f => ({ ...f, model_id: e.target.value }))}>
                <option value="">-- Model --</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
              </select></div>
            <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Kalıp Bedeni (İlk Ürün)</label>
              <input className="form-input" value={iuForm.kalip_beden} onChange={e => setIuForm(f => ({ ...f, kalip_beden: e.target.value }))} placeholder="Örn: M veya 40" /></div>
          </div>

          {/* Ara İşçilik */}
          <div style={{ background: 'rgba(155,89,182,0.06)', border: '1px solid rgba(155,89,182,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#9b59b6', marginBottom: '10px' }}>⚡ Ara İşçilik Listesi (Dikimden Önce)</div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input className="form-input" style={{ flex: 1, fontSize: '12px' }} placeholder="Ara işlem tanımı (örn: Yaka tela alma, Tel alıp çizme...)" value={araIscilikGirisi} onChange={e => setAraIscilikGirisi(e.target.value)} onKeyDown={e => e.key === 'Enter' && araIscilikEkle()} />
              <button type="button" onClick={araIscilikEkle} style={{ padding: '6px 14px', background: 'rgba(155,89,182,0.2)', border: '1px solid rgba(155,89,182,0.4)', borderRadius: '6px', color: '#9b59b6', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>+ Ekle</button>
            </div>
            {iuForm.ara_iscilik.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', flex: 1 }}>{i + 1}. {a.tanim}</span>
                <input type="number" className="form-input" style={{ width: '70px', fontSize: '11px' }} placeholder="dk" value={a.sure_dk} onChange={e => { const u = [...iuForm.ara_iscilik]; u[i] = { ...u[i], sure_dk: e.target.value }; setIuForm(f => ({ ...f, ara_iscilik: u })); }} />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>dk</span>
                <button type="button" onClick={() => setIuForm(f => ({ ...f, ara_iscilik: f.ara_iscilik.filter((_, j) => j !== i) }))} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: '900', fontSize: '14px' }}>×</button>
              </div>
            ))}
          </div>

          {/* Personel Kapasitesi */}
          <div style={{ background: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#3498db', marginBottom: '10px' }}>👷 Gereken Personel Sayıları</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '10px' }}>
              {[
                ['makineci_sayi', '🪡 Makineci'],
                ['kasar_sayi', '✂️ Kaşar/Kesimci'],
                ['utuku_sayi', '♨️ Ütücü'],
                ['ortaci_sayi', '🔗 Ortacı'],
                ['ara_isci_sayi', '⚡ Ara İşçi'],
                ['kalite_sayi', '✅ Kalite Kontrol'],
              ].map(([alan, lbl]) => (
                <div key={alan}><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{lbl}</label>
                  <input type="number" className="form-input" min="0" value={iuForm[alan]} onChange={e => setIuForm(f => ({ ...f, [alan]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <input className="form-input" placeholder="Ek notlar..." value={iuForm.notlar} onChange={e => setIuForm(f => ({ ...f, notlar: e.target.value }))} />
          </div>
          <button onClick={handleIuKaydet} disabled={iuKayit || !iuForm.model_id}
            style={{ padding: '10px 28px', background: '#9b59b6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            {iuKayit ? '⏳...' : '✅ İlk Ürün Hazırlığı Kaydet'}
          </button>
        </div>
      )}

      {/* =========== M5: ARA KONTROL =========== */}
      {aktif === 'ara_kontrol' && (
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '14px', color: '#e67e22' }}>🔍 Ara Kontrol — Fotoğraf & Numune Karşılaştırma</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px', marginBottom: '12px' }}>
              <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Model *</label>
                <select className="form-input" value={akForm.model_id} onChange={e => setAkForm(f => ({ ...f, model_id: e.target.value }))}>
                  <option value="">-- Model --</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select></div>
              <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Kontrol Eden</label>
                <select className="form-input" value={akForm.kontrol_eden_id} onChange={e => setAkForm(f => ({ ...f, kontrol_eden_id: e.target.value }))}>
                  <option value="">-- Personel --</option>
                  {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>İstasyon</label>
                <select className="form-input" value={akForm.istasyon} onChange={e => setAkForm(f => ({ ...f, istasyon: e.target.value }))}>
                  {['Kesim', 'Dikim', 'Ütü', 'Kalite', 'Paket'].map(s => <option key={s} value={s}>{s}</option>)}
                </select></div>
              <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Sıra No</label>
                <input type="number" className="form-input" placeholder="1, 2, 3..." value={akForm.sira_no} onChange={e => setAkForm(f => ({ ...f, sira_no: e.target.value }))} /></div>
              <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Beden</label>
                <input className="form-input" placeholder="S, M, 38..." value={akForm.beden} onChange={e => setAkForm(f => ({ ...f, beden: e.target.value }))} /></div>
              <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Kontrol Adet</label>
                <input type="number" className="form-input" min="1" value={akForm.adet} onChange={e => setAkForm(f => ({ ...f, adet: e.target.value }))} /></div>
              <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Hatalı Adet</label>
                <input type="number" className="form-input" min="0" value={akForm.hatali} onChange={e => setAkForm(f => ({ ...f, hatali: e.target.value }))} /></div>
            </div>

            {/* Yan Yana Fotoğraf Karşılaştırma */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ border: '2px solid rgba(52,152,219,0.3)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#3498db', marginBottom: '8px' }}>📸 Orijinal Numune (Referans)</div>
                {akForm.numune_foto_url
                  ? <div style={{ position: 'relative' }}>
                    <img src={akForm.numune_foto_url} alt="numune" style={{ width: '100%', borderRadius: '8px', maxHeight: '220px', objectFit: 'cover' }} />
                    <button onClick={() => setAkForm(f => ({ ...f, numune_foto_url: '' }))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(231,76,60,0.85)', border: 'none', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}>×</button>
                  </div>
                  : <label style={{ display: 'block', padding: '40px 20px', border: '2px dashed rgba(52,152,219,0.3)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    📁 Numune Fotoğrafı Seç
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => akFotoSec(e, 'numune_foto_url')} />
                  </label>}
              </div>
              <div style={{ border: '2px solid rgba(46,204,113,0.3)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#27ae60', marginBottom: '8px' }}>📷 Kontrol Edilen Ürün (Kamera)</div>
                {akForm.foto_url
                  ? <div style={{ position: 'relative' }}>
                    <img src={akForm.foto_url} alt="kontrol" style={{ width: '100%', borderRadius: '8px', maxHeight: '220px', objectFit: 'cover' }} />
                    <button onClick={() => setAkForm(f => ({ ...f, foto_url: '' }))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(231,76,60,0.85)', border: 'none', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}>×</button>
                  </div>
                  : <label style={{ display: 'block', padding: '40px 20px', border: '2px dashed rgba(46,204,113,0.3)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    📷 Fotoğraf Çek / Seç
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => akFotoSec(e, 'foto_url')} />
                  </label>}
              </div>
            </div>

            {akForm.foto_url && akForm.numune_foto_url && (
              <div style={{ background: 'rgba(155,89,182,0.08)', border: '1px solid rgba(155,89,182,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#9b59b6', fontWeight: '700' }}>🤖 İki fotoğraf hazır — Karşılaştır ve karar ver:</span>
              </div>
            )}

            {/* Onay / Ret */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '700' }}>Kontrol Sonucu:</span>
              {[true, false].map(val => (
                <button key={String(val)} type="button" onClick={() => setAkForm(f => ({ ...f, onay: val, ...(val && { ret_nedeni: '' }) }))}
                  style={{ padding: '7px 18px', background: akForm.onay === val ? (val ? '#27ae60' : '#e74c3c') : 'transparent', color: akForm.onay === val ? '#fff' : (val ? '#27ae60' : '#e74c3c'), border: `2px solid ${val ? '#27ae60' : '#e74c3c'}`, borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '14px' }}>
                  {val ? '✅ ONAY' : '❌ RET'}
                </button>
              ))}
              {akForm.onay === false && (
                <input className="form-input" style={{ flex: 1, minWidth: '180px', borderColor: '#e74c3c' }} placeholder="Ret nedeni (dikiş kayması, ölçü hatası...)" value={akForm.ret_nedeni} onChange={e => setAkForm(f => ({ ...f, ret_nedeni: e.target.value }))} />
              )}
            </div>
            <input className="form-input" style={{ marginBottom: '12px' }} placeholder="Not..." value={akForm.notlar} onChange={e => setAkForm(f => ({ ...f, notlar: e.target.value }))} />
            <button onClick={handleAkKaydet} disabled={akYukleniyor || !akForm.model_id || akForm.onay === null}
              style={{ padding: '10px 28px', background: '#e67e22', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              {akYukleniyor ? '⏳...' : '💾 Ara Kontrol Kaydet'}
            </button>
          </div>
          {akKayitlar.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>📋 Son Kontroller</div>
              {akKayitlar.slice(0, 8).map((k, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: k.onay ? 'rgba(46,204,113,0.06)' : 'rgba(231,76,60,0.06)', borderRadius: '6px', marginBottom: '4px', fontSize: '12px' }}>
                  <span><b>{k.istasyon}</b> — Sıra:{k.sira_no || '—'} Beden:{k.beden || '—'} {k.adet}ad/{k.hatali}hatalı</span>
                  <span style={{ fontWeight: '800', color: k.onay ? '#27ae60' : '#e74c3c' }}>{k.onay ? '✅ONAY' : '❌RET'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========== M6: MALİYET + PRİM =========== */}
      {aktif === 'maliyet_prim' && (() => {
        return (
          <div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#27ae60' }}>💰 Maliyet & Prim — {new Date().toLocaleDateString('tr-TR')}</div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[['gunluk', 'Günlük'], ['haftalik', 'Haftalık'], ['aylik', 'Aylık']].map(([k, l]) => (
                    <button key={k} onClick={() => { setMpDonem(k); mpYukle(k); }}
                      style={{ padding: '4px 12px', fontSize: '11px', background: mpDonem === k ? 'var(--accent)' : 'transparent', color: mpDonem === k ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>{l}</button>
                  ))}
                  <button onClick={() => mpYukle(mpDonem)} style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--accent)', borderRadius: '6px', cursor: 'pointer' }}>🔄</button>
                </div>
              </div>
              <div style={{ background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                <b style={{ color: '#27ae60' }}>Aylık Maliyet</b> = Brüt Maaş + SGK(%20.5) + Yol(gün×22) + Yemek(gün×22) + Tazminat(1/12) &nbsp;|&nbsp;
                <b style={{ color: '#D4A847' }}>Prim</b> = (Üretim Değeri − Dönem Maliyet) × %15
              </div>
              {mpYukleniyor ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>⏳ Yükleniyor...</div>
              ) : mpData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Personel maliyet verisi yok. Personel sekmesinden maaş bilgisi girin.
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
                    {[
                      ['Toplam Maliyet', mpData.reduce((s, p) => s + (mpDonem === 'aylik' ? p.aylikToplamMaliyet : mpDonem === 'haftalik' ? p.gunlukMaliyet * 5 : p.gunlukMaliyet), 0), '#e74c3c'],
                      ['Üretim Değeri', mpData.reduce((s, p) => s + p.toplamDeger, 0), '#3498db'],
                      ['Toplam Prim', mpData.reduce((s, p) => s + p.prim, 0), '#D4A847'],
                    ].map(([lbl, val, clr]) => (
                      <div key={lbl} style={{ background: `${clr}10`, border: `1px solid ${clr}30`, borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{lbl}</div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: clr }}>{Math.round(val).toLocaleString('tr-TR')} ₺</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead><tr style={{ background: 'var(--bg-input)' }}>
                        {['Personel', 'Aylık Maliyet', 'Gün Maliyet', 'Üretim', 'Değer', 'Net', 'Prim', 'FPY'].map(h => (
                          <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {mpData.map((p, i) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '7px 8px', fontWeight: '700' }}>{p.ad}</td>
                            <td style={{ padding: '7px 8px' }}>{p.aylikToplamMaliyet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</td>
                            <td style={{ padding: '7px 8px', color: '#e74c3c' }}>{p.gunlukMaliyet.toFixed(0)} ₺</td>
                            <td style={{ padding: '7px 8px' }}>{p.toplamUretim} ad</td>
                            <td style={{ padding: '7px 8px', color: '#3498db' }}>{p.toplamDeger.toFixed(0)} ₺</td>
                            <td style={{ padding: '7px 8px', fontWeight: '700', color: p.netKatmaDeğer >= 0 ? '#27ae60' : '#e74c3c' }}>{p.netKatmaDeğer >= 0 ? '+' : ''}{p.netKatmaDeğer.toFixed(0)} ₺</td>
                            <td style={{ padding: '7px 8px', fontWeight: '800', color: p.prim > 0 ? '#D4A847' : 'var(--text-muted)' }}>{p.prim > 0 ? p.prim.toFixed(0) + ' ₺' : '—'}</td>
                            <td style={{ padding: '7px 8px' }}><span style={{ padding: '2px 6px', borderRadius: '8px', fontWeight: '700', background: p.fpy >= 95 ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.12)', color: p.fpy >= 95 ? '#27ae60' : '#e74c3c', fontSize: '11px' }}>%{p.fpy}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {aktif === 'giris' && (

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>📥 Yeni Üretim Girişi</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div><label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Model *</label>
              <select className="form-input" value={form.model_id} onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))}>
                <option value="">-- Model Seç --</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
              </select></div>
            <div><label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Parti No *</label>
              <input className="form-input" placeholder="Örn: P2026-001" value={form.parti_no} onChange={e => setForm(f => ({ ...f, parti_no: e.target.value }))} /></div>
            <div><label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Asorti</label>
              <input className="form-input" placeholder="Örn: S(50) M(80) L(70)" value={form.asorti} onChange={e => setForm(f => ({ ...f, asorti: e.target.value }))} /></div>
            <div><label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kim Getirdi?</label>
              <select className="form-input" value={form.getiren_personel_id} onChange={e => setForm(f => ({ ...f, getiren_personel_id: e.target.value }))}>
                <option value="">-- Personel --</option>
                {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div><label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kim Açtı?</label>
              <select className="form-input" value={form.acan_personel_id} onChange={e => setForm(f => ({ ...f, acan_personel_id: e.target.value }))}>
                <option value="">-- Personel --</option>
                {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div><label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Açılış Tarihi</label>
              <input type="datetime-local" className="form-input" value={form.acilis_tarihi} onChange={e => setForm(f => ({ ...f, acilis_tarihi: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '12px' }}>
            {[['beden_eksik', 'beden_eksik_detay', '📐 Beden Eksiği'], ['aksesuar_eksik', 'aksesuar_eksik_detay', '🔩 Aksesuar Eksiği'], ['kumas_eksik', 'kumas_eksik_detay', '🧵 Kumaş Eksiği']].map(([alan, detay, lbl]) => (
              <div key={alan} style={{ padding: '10px', background: form[alan] ? 'rgba(231,76,60,0.08)' : 'rgba(46,204,113,0.06)', border: `1px solid ${form[alan] ? 'rgba(231,76,60,0.3)' : 'rgba(46,204,113,0.2)'}`, borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  <input type="checkbox" checked={form[alan]} onChange={e => setForm(f => ({ ...f, [alan]: e.target.checked }))} />{lbl}
                </label>
                {form[alan] && <input className="form-input" placeholder="Açıklama..." value={form[detay]} onChange={e => setForm(f => ({ ...f, [detay]: e.target.value }))} style={{ marginTop: '6px', fontSize: '12px' }} />}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.numune_ayrildi} onChange={e => setForm(f => ({ ...f, numune_ayrildi: e.target.checked }))} />✂️ Numune Ayrıldı
            </label>
            <div><label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Parça Sayısı</label>
              <input type="number" className="form-input" min="0" max="20" value={form.parca_sayisi} onChange={e => setForm(f => ({ ...f, parca_sayisi: e.target.value }))} style={{ width: '80px', marginLeft: '8px' }} /></div>
            <div style={{ flex: 1 }}><input className="form-input" placeholder="Notlar..." value={form.notlar} onChange={e => setForm(f => ({ ...f, notlar: e.target.value }))} /></div>
          </div>
          <button onClick={handleKaydet} disabled={kaydediliyor || !form.model_id} style={{ padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            {kaydediliyor ? '⏳ Kaydediliyor...' : '✅ Üretim Girişini Kaydet'}
          </button>
        </div>
      )}

      {aktif === 'gecmis' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontWeight: '700', marginBottom: '12px' }}>📋 Üretim Girişleri</div>
          {gecmis.length === 0 ? <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Kayıt yok</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr>{['Model', 'Getiren', 'Açan', 'Tarih', 'Eksik?', 'Parça'].map(h => <th key={h} style={{ padding: '8px', textAlign: 'left', fontWeight: '700', fontSize: '11px', borderBottom: '1px solid var(--border-color)' }}>{h}</th>)}</tr></thead>
              <tbody>{gecmis.map(g => <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px' }}><strong>{g.model_adi}</strong></td>
                <td style={{ padding: '8px' }}>{g.getiren_adi || '—'}</td>
                <td style={{ padding: '8px' }}>{g.acan_adi || '—'}</td>
                <td style={{ padding: '8px' }}>{new Date(g.created_at).toLocaleDateString('tr-TR')}</td>
                <td style={{ padding: '8px' }}>{[g.beden_eksik && 'B', g.aksesuar_eksik && 'A', g.kumas_eksik && 'K'].filter(Boolean).join('/') || '✅'}</td>
                <td style={{ padding: '8px' }}>{g.parca_sayisi}</td>
              </tr>)}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ========== PERSONEL DEVAM BARI — AMELE 1 GÖREVİ ==========

function PersonelDevamBar({ personnel, addToast }) {
  const [kayitlar, setKayitlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aktifSekme, setAktifSekme] = useState('gunluk');
  const [ozet, setOzet] = useState([]);
  const bugun = new Date().toISOString().split('T')[0];

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const res = await fetch(`/api/personel-saat?tarih=${bugun}`);
      const d = await res.json();
      setKayitlar(d.kayitlar || []);
    } catch { } finally { setYukleniyor(false); }
  }, [bugun]);

  const yukleHaftalik = useCallback(async () => {
    try {
      const res = await fetch('/api/personel-haftalik');
      const d = await res.json();
      setOzet(d.personel || []);
    } catch { }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);
  useEffect(() => { if (aktifSekme === 'haftalik') yukleHaftalik(); }, [aktifSekme, yukleHaftalik]);

  const kayitBul = (pid) => kayitlar.find(k => k.personel_id === pid);

  const tiklama = async (pid, tip) => {
    try {
      await fetch('/api/personel-saat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personel_id: pid, tip }) });
      addToast('success', `✅ ${tip === 'giris' ? 'Giriş' : 'Çıkış'} kaydedildi`);
      yukle();
    } catch (e) { addToast('error', e.message); }
  };

  const aktifler = personnel.filter(p => p.status === 'active' || !p.status);
  const gelenler = kayitlar.filter(k => k.giris_saat).length;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontWeight: '700', fontSize: '14px' }}>⏱️ Personel Devam</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setAktifSekme('gunluk')} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px', background: aktifSekme === 'gunluk' ? 'var(--accent)' : 'var(--bg-input)', color: aktifSekme === 'gunluk' ? '#fff' : 'var(--text-muted)' }}>📅 Günlük</button>
          <button onClick={() => setAktifSekme('haftalik')} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px', background: aktifSekme === 'haftalik' ? 'var(--accent)' : 'var(--bg-input)', color: aktifSekme === 'haftalik' ? '#fff' : 'var(--text-muted)' }}>📊 Haftalık Özet</button>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{gelenler}/{aktifler.length} geldi</div>
        </div>
      </div>

      {aktifSekme === 'gunluk' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {aktifler.map(p => {
            const k = kayitBul(p.id);
            return (
              <div key={p.id} style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px' }}>{p.name}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {!k?.giris_saat ? (
                    <button onClick={() => tiklama(p.id, 'giris')} style={{ padding: '4px 10px', background: 'rgba(46,204,113,0.15)', color: '#27ae60', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✅ Giriş</button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#27ae60', fontWeight: '600' }}>✅ {k.giris_saat}</span>
                  )}
                  {k?.giris_saat && !k?.cikis_saat && (
                    <button onClick={() => tiklama(p.id, 'cikis')} style={{ padding: '4px 10px', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🚪 Çıkış</button>
                  )}
                  {k?.cikis_saat && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Çıkış: {k.cikis_saat} | Net: {Math.floor((k.net_calisma_dakika || 0) / 60)}s {((k.net_calisma_dakika || 0) % 60)}dk</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aktifSekme === 'haftalik' && (
        <div style={{ overflowX: 'auto' }}>
          {ozet.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Bu hafta kayıt yok.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Ad</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontWeight: '700' }}>Saat</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontWeight: '700' }}>Mesai</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontWeight: '700', color: '#27ae60' }}>Net Maaş</th>
                </tr>
              </thead>
              <tbody>
                {ozet.map(p => (
                  <tr key={p.personel_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', fontWeight: '600' }}>{p.ad}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.normal_saat}s</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#e67e22' }}>{p.mesai_saat}s</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: '#27ae60' }}>{p.net_maas} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ========== İŞLETME GİDER FORMU — AMELE 2 GÖREVİ ==========

function IsletmeGiderForm({ addToast }) {
  const simdi = new Date();
  const [form, setForm] = useState({ ay: simdi.getMonth() + 1, yil: simdi.getFullYear(), elektrik: '', su: '', kira: '', yakit: '', diger: '', toplam_calisma_saati: '', toplam_personel_maliyeti: '' });
  const [saatlik, setSaatlik] = useState(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const toplam = ['elektrik', 'su', 'kira', 'yakit', 'diger', 'toplam_personel_maliyeti'].reduce((s, k) => s + (parseFloat(form[k]) || 0), 0);
  const hesaplananSaatlik = form.toplam_calisma_saati > 0 ? (toplam / parseFloat(form.toplam_calisma_saati)).toFixed(2) : null;

  const handleKaydet = async () => {
    setKaydediliyor(true);
    try {
      const res = await fetch('/api/isletme-gider', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSaatlik(d.saatlik_maliyet);
      addToast('success', `✅ Kaydedildi! Saatlik maliyet: ${d.saatlik_maliyet} TL/saat`);
    } catch (e) { addToast('error', e.message); } finally { setKaydediliyor(false); }
  };

  const inp = (alan, lbl, prefix = '₺') => (
    <div>
      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{lbl}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{prefix}</span>
        <input type="number" className="form-input" placeholder="0" value={form[alan]} onChange={e => setForm(f => ({ ...f, [alan]: e.target.value }))} />
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>💰 Aylık İşletme Giderleri</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <select className="form-input" style={{ width: '120px' }} value={form.ay} onChange={e => setForm(f => ({ ...f, ay: e.target.value }))}>
          {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" className="form-input" style={{ width: '90px' }} value={form.yil} onChange={e => setForm(f => ({ ...f, yil: e.target.value }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        {inp('elektrik', 'Elektrik (TL)')}
        {inp('su', 'Su (TL)')}
        {inp('kira', 'Kira (TL)')}
        {inp('yakit', 'Yakıt (TL)')}
        {inp('diger', 'Diğer (TL)')}
        {inp('toplam_personel_maliyeti', 'Personel Maliyeti (TL)')}
        {inp('toplam_calisma_saati', 'Toplam Çalışma Saati', '⏱')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '10px 16px', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.2)', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Toplam Gider</div>
          <div style={{ fontWeight: '700', fontSize: '16px', color: '#27ae60' }}>{toplam.toFixed(2)} TL</div>
        </div>
        {hesaplananSaatlik && (
          <div style={{ padding: '10px 16px', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saatlik Maliyet</div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#3498db' }}>{hesaplananSaatlik} TL/saat</div>
          </div>
        )}
        <button onClick={handleKaydet} disabled={kaydediliyor} style={{ padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
          {kaydediliyor ? '⏳...' : '💾 Kaydet'}
        </button>
      </div>
      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '8px' }}>
        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>🧮 Fason Fiyat Hesapla</div>
        <FasonHesapMini addToast={addToast} />
      </div>
    </div>
  );
}

// ========== MODELS PAGE ==========

function ModelsPage({ models, loadModels, addToast }) {

  const [showNewModal, setShowNewModal] = useState(false);

  const [expandedModel, setExpandedModel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showOperationModal, setShowOperationModal] = useState(null);

  const [modelOperations, setModelOperations] = useState({});

  const [detailTab, setDetailTab] = useState('genel');
  const [inlineGenel, setInlineGenel] = useState(false);
  const [inlineForm, setInlineForm] = useState({});

  const [expandedOp, setExpandedOp] = useState(null);

  // #1 İşlem düzenleme modalı
  const [editingOp, setEditingOp] = useState(null);
  const [editOpForm, setEditOpForm] = useState({ name: '', machine_type: '', difficulty: 5, unit_price: 0, description: '' });

  const openEditOp = (op) => {
    setEditOpForm({ name: op.name || '', machine_type: op.machine_type || '', difficulty: op.difficulty || 5, unit_price: op.unit_price || 0, description: op.description || '' });
    setEditingOp(op);
  };

  const handleSaveEditOp = async (modelId) => {
    try {
      const res = await fetch(`/api/models/${modelId}/operations`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation_id: editingOp.id, ...editOpForm })
      });
      if (!res.ok) throw new Error('Güncelleme hatası');
      await loadOperations(modelId);
      setEditingOp(null);
      addToast('success', '✅ İşlem güncellendi');
    } catch (err) { addToast('error', err.message); }
  };

  // İşlem silme
  const handleDeleteOp = async (modelId, opId) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/models/${modelId}/operations?opId=${opId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme hatası');
      await loadOperations(modelId);
      addToast('success', '🗑️ İşlem silindi');
    } catch (err) { addToast('error', err.message); }
  };


  // === MEDYA YÜKLEME FONKSİYONU ===
  const handleUploadMedia = async (modelId, opId, file, mediaType) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', mediaType); // videos | audios | correct_photos | incorrect_photos
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Dosya yükleme hatası');
      const { url } = await uploadRes.json();
      // İşleme kaydet
      const fieldMap = { videos: 'video_path', audios: 'audio_path', correct_photos: 'correct_photo_path', incorrect_photos: 'incorrect_photo_path' };
      await fetch(`/api/models/${modelId}/operations`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation_id: opId, [fieldMap[mediaType]]: url })
      });
      await loadOperations(modelId);
      addToast('success', `✅ ${mediaType === 'videos' ? 'Video' : mediaType === 'audios' ? 'Ses' : 'Fotoğraf'} yüklendi`);
    } catch (err) { addToast('error', err.message); }
  };

  // Yazılı talimat kaydetme
  const handleSaveOpDetails = async (modelId, opId, data) => {
    try {
      await fetch(`/api/models/${modelId}/operations`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation_id: opId, ...data })
      });
      await loadOperations(modelId);
      addToast('success', '✅ Detaylar kaydedildi');
    } catch (err) { addToast('error', err.message); }
  };

  // #4 Teslim tarihi uyarı rengi
  const getDeliveryWarning = (deliveryDate) => {
    if (!deliveryDate) return null;
    const diff = Math.ceil((new Date(deliveryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { color: '#e74c3c', bg: 'rgba(231,76,60,0.1)', text: `${Math.abs(diff)} gün GEÇTİ!`, icon: '🚨' };
    if (diff <= 3) return { color: '#e74c3c', bg: 'rgba(231,76,60,0.1)', text: `${diff} gün kaldı`, icon: '🔴' };
    if (diff <= 7) return { color: '#e67e22', bg: 'rgba(230,126,34,0.1)', text: `${diff} gün kaldı`, icon: '🟠' };
    if (diff <= 14) return { color: '#f39c12', bg: 'rgba(243,156,18,0.1)', text: `${diff} gün kaldı`, icon: '🟡' };
    return null;
  };

  const [editModel, setEditModel] = useState(null);
  const [editFrontPreview, setEditFrontPreview] = useState(null);
  const [editBackPreview, setEditBackPreview] = useState(null);

  const [editForm, setEditForm] = useState({});

  const [auditHistory, setAuditHistory] = useState(null);

  const [auditData, setAuditData] = useState([]);

  // Ölçü tablosu state

  const [measurePoints, setMeasurePoints] = useState([

    { name: 'GöĞüs', description: 'Koltuk altından yatay ölçü' },

    { name: 'Bel', description: 'Bel hizasından yatay ölçü' },

    { name: 'Basen', description: 'Kalça hizasından yatay ölçü' },

    { name: 'Boy', description: 'Omuzdan eteĞe dikey ölçü' },

    { name: 'Kol Boyu', description: 'Omuzdan bileĞe' },

    { name: 'Omuz', description: 'Omuz genişliĞi' }

  ]);

  const [measureSizes, setMeasureSizes] = useState(['S', 'M', 'L', 'XL']);

  const [measureData, setMeasureData] = useState({});

  const [newMeasurePoint, setNewMeasurePoint] = useState('');

  const [newMeasurePointDesc, setNewMeasurePointDesc] = useState('');

  const [newMeasureSize, setNewMeasureSize] = useState('');

  // ── BOM (Malzeme Listesi) State ──
  const [bomRows, setBomRows] = useState([]);
  const [newBomRow, setNewBomRow] = useState({
    malzeme: '', tip: 'Kumaş', renk_kodu: '', gramaj: '', tedarikci: '', birim: 'metre', miktar: '', birim_fiyat: '', notlar: ''
  });
  const [editBomIdx, setEditBomIdx] = useState(null);
  const [editBomRow, setEditBomRow] = useState({});

  // ── Onay Zinciri State ──
  const [onayZinciri, setOnayZinciri] = useState([]);
  const [newOnay, setNewOnay] = useState({ kisi: '', unvan: 'Modelist', durum: 'Bekliyor', not: '' });
  const [editOnayIdx, setEditOnayIdx] = useState(null);
  const [editOnayRow, setEditOnayRow] = useState({});
  const [onayArama, setOnayArama] = useState('');

  // Etiket state


  const [labelInfo, setLabelInfo] = useState({

    brand_label: '', brand_label_pos: 'Arka Yaka Ortası',

    size_label: '', size_label_pos: 'Arka Yaka Sol',

    care_label: '', care_label_pos: 'Sol Yan Dikiş',

    content_label: '', content_label_pos: 'Sol Yan Dikiş',

    hangtag: '', barcode: '',

    wash_icons: [],

    special_label_notes: ''

  });

  // Kesim & Aksesuar state
  const [cuttingInfo, setCuttingInfo] = useState({
    pre_cutting: '', cutting_type: 'Serileme (Elle)', pastal_count: '',
    cutting_steps: '', post_cutting_checks: [], post_cutting_notes: ''
  });

  const [accessoryInfo, setAccessoryInfo] = useState({
    accessories: {}, accessory_notes: '', wash_types: [], wash_notes: '',
    ironing_notes: '', packaging_notes: ''
  });

  const defaultFlowSteps = [
    { id: 1, icon: '🔄', title: 'Kesimden Once Islemler', desc: 'Plise, on yikama, boyama, sanfor gibi kumas islemleri', color: '#8e44ad', tab: 'kesim' },
    { id: 2, icon: '✂️', title: 'Kesim Islemleri', desc: 'Beden kesimi, garni kesimi, tela kesimi, tas kesimi', color: '#2980b9', tab: 'kesim' },
    { id: 3, icon: '⚡', title: 'Kesim Sonrasi / Dikim Oncesi', desc: 'Ilik, nakis, baski, tela yapistirma — dikime girmeden ONCE', color: '#e67e22', tab: 'kesim' },
    { id: 4, icon: '🧵', title: 'Dikim Islem Sirasi', desc: 'Her islem: hangi makine, nasil yapilacak, hangi sirayla', color: '#27ae60', tab: 'islemler' },
    { id: 5, icon: '🔧', title: 'Aksesuar Montaj', desc: 'Koc gozu, ilik, rivet, kemer, dugme, fermuar, citcit', color: '#c0392b', tab: 'aksesuar' },
    { id: 6, icon: '🌊', title: 'Yikama', desc: 'Tas yikama, enzim, silikon, boyama, softener', color: '#16a085', tab: 'aksesuar' },
    { id: 7, icon: '♨️', title: 'Utu & Kalite Kontrol', desc: 'Ara utu, son utu, kalite kontrol, AQL', color: '#d35400', tab: 'aksesuar' },
    { id: 8, icon: '🏷️', title: 'Etiket & Paketleme', desc: 'Firma etiketi, yikama talimati, katlama, posetleme, kolileme', color: '#2c3e50', tab: 'etiket' },
  ];
  const [flowSteps, setFlowSteps] = useState(defaultFlowSteps);
  const [editStepIdx, setEditStepIdx] = useState(null);
  const [editStepForm, setEditStepForm] = useState({});
  const [newStepForm, setNewStepForm] = useState({ icon: '📋', title: '', desc: '', color: '#3498db', tab: 'akis' });
  const [showNewStepForm, setShowNewStepForm] = useState(false);
  const [foyNotes, setFoyNotes] = useState([]);
  const [editFoyIdx, setEditFoyIdx] = useState(null);
  const [editFoyForm, setEditFoyForm] = useState({ title: '', content: '' });
  const [newFoyNote, setNewFoyNote] = useState({ title: '', content: '' });
  const [showNewFoyForm, setShowNewFoyForm] = useState(false);

  // Tab bilgilerini kaydetme
  const handleSaveTabInfo = async (modelId, field, data) => {
    try {
      const res = await fetch(`/api/models/${modelId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: JSON.stringify(data), changed_by: 'admin' })
      });
      if (!res.ok) throw new Error('Kaydetme hatası');
      await loadModels();
      addToast('success', '✅ Bilgiler kaydedildi!');
    } catch (err) { addToast('error', err.message); }
  };



  const handleSaveModel = async (formData) => {

    try {

      const res = await fetch('/api/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }

      await loadModels(); setShowNewModal(false); addToast('success', 'Model başarıyla eklendi!');

    } catch (err) { addToast('error', err.message || 'Hata oluştu'); }

  };



  const handleDeleteModel = async (id) => {

    const model = models.find(m => m.id === id);
    if (!confirm(`"${model?.name || ''}" (${model?.code || ''}) modelini silmek istediğinize emin misiniz?`)) return;

    try { await fetch(`/api/models/${id}`, { method: 'DELETE' }); await loadModels(); addToast('success', 'Model silindi'); } catch { addToast('error', 'Silinemedi'); }

  };



  // ===== DÜZENLEME =====

  const openEditModal = (model) => {
    setEditForm({
      name: model.name || '', code: model.code || '', order_no: model.order_no || '',
      modelist: model.modelist || '', customer: model.customer || '', description: model.description || '',
      fabric_type: model.fabric_type || '', sizes: model.sizes || '', size_range: model.size_range || '',
      total_order: model.total_order || 0, total_order_text: model.total_order_text || '',
      completed_count: model.completed_count || 0,
      fason_price: model.fason_price || 0, fason_price_text: model.fason_price_text || '',
      model_difficulty: model.model_difficulty || 5,
      delivery_date: model.delivery_date || '', work_start_date: model.work_start_date || '',
      garni: model.garni || '', color_count: model.color_count || 0, color_details: model.color_details || '',
      size_count: model.size_count || 0, size_distribution: model.size_distribution || '',
      asorti: model.asorti || '', total_operations: model.total_operations || 0,
      piece_count: model.piece_count || 0, piece_count_details: model.piece_count_details || '',
      op_kesim_count: model.op_kesim_count || 0, op_kesim_details: model.op_kesim_details || '',
      op_dikim_count: model.op_dikim_count || 0, op_dikim_details: model.op_dikim_details || '',
      op_utu_paket_count: model.op_utu_paket_count || 0, op_utu_paket_details: model.op_utu_paket_details || '',
      op_nakis_count: model.op_nakis_count || 0, op_nakis_details: model.op_nakis_details || '',
      op_yikama_count: model.op_yikama_count || 0, op_yikama_details: model.op_yikama_details || '',
      has_lining: model.has_lining || 0, lining_pieces: model.lining_pieces || 0,
      has_interlining: model.has_interlining || 0, interlining_parts: model.interlining_parts || '', interlining_count: model.interlining_count || 0,
      difficult_points: model.difficult_points || '', critical_points: model.critical_points || '',
      customer_requests: model.customer_requests || '', post_sewing: model.post_sewing || ''
    });
    setEditModel(model);
  };



  const handleEditImageUpload = async (file, side) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (side === 'front') setEditFrontPreview(ev.target.result); else setEditBackPreview(ev.target.result); };
    reader.readAsDataURL(file);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('type', 'photos');
      fd.append('model_code', editForm.code || 'edit');
      fd.append('operation_name', side === 'front' ? 'on_gorsel' : 'arka_gorsel');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setEditForm(prev => ({ ...prev, [side === 'front' ? 'front_image' : 'back_image']: data.url }));
    } catch (err) { console.error('Edit upload hatasi:', err); }
  };

  const handleUpdateModel = async (e) => {
    e.preventDefault();
    try {
      // Audit trail backend API tarafında otomatik kaydediliyor (çifte kayıt düzeltmesi)
      const res = await fetch(`/api/models/${editModel.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, changed_by: 'admin' })
      });
      if (!res.ok) throw new Error('Güncelleme hatası');
      await loadModels(); setEditModel(null);
      addToast('success', 'Model güncellendi! Değişiklikler kayıt altına alındı.');
    } catch (err) { addToast('error', err.message || 'Hata oluştu'); }
  };



  // ===== DEĞİŞİKLİK GEÇMİŞİ =====

  const openAuditHistory = async (modelId) => {

    try {

      const res = await fetch(`/api/audit-trail?table=models&record_id=${modelId}`);

      const data = await res.json();

      setAuditData(Array.isArray(data) ? data : []);

      setAuditHistory(modelId);

    } catch { setAuditData([]); setAuditHistory(modelId); }

  };



  const loadOperations = async (modelId) => {

    try { const res = await fetch(`/api/models/${modelId}/operations`); const ops = await res.json(); setModelOperations(prev => ({ ...prev, [modelId]: ops })); } catch (err) { console.error(err); }

  };



  const handleToggleModel = async (id) => {
    if (expandedModel === id) { setExpandedModel(null); return; }
    setExpandedModel(id);
    setDetailTab('genel');
    loadOperations(id);
    // Ölçü tablosu verilerini yükle
    const m = models.find(x => x.id === id);
    if (m?.measurement_table) {
      try {
        const mt = JSON.parse(m.measurement_table);
        setMeasurePoints(mt.points || measurePoints);
        setMeasureSizes(mt.sizes || measureSizes);
        setMeasureData(mt.data || {});
      } catch { }
    } else {
      setMeasurePoints([{ name: 'Göğüs', description: 'Koltuk altından yatay ölçü' }, { name: 'Bel', description: 'Bel hizasından yatay ölçü' }, { name: 'Basen', description: 'Kalça hizasından yatay ölçü' }, { name: 'Boy', description: 'Omuzdan eteğe dikey ölçü' }, { name: 'Kol Boyu', description: 'Omuzdan bileğe' }, { name: 'Omuz', description: 'Omuz genişliği' }]);
      setMeasureSizes(['S', 'M', 'L', 'XL']); setMeasureData({});
    }
    // Kesim bilgilerini yükle
    if (m?.cutting_info) {
      try { setCuttingInfo(JSON.parse(m.cutting_info)); } catch { }
    } else { setCuttingInfo({ pre_cutting: '', cutting_type: 'Serileme (Elle)', pastal_count: '', cutting_steps: '', post_cutting_checks: [], post_cutting_notes: '' }); }
    // Aksesuar bilgilerini yükle
    if (m?.accessory_info) {
      try { setAccessoryInfo(JSON.parse(m.accessory_info)); } catch { }
    } else { setAccessoryInfo({ accessories: {}, accessory_notes: '', wash_types: [], wash_notes: '', ironing_notes: '', packaging_notes: '' }); }
    // Etiket bilgilerini yükle
    if (m?.label_info) {
      try { setLabelInfo(JSON.parse(m.label_info)); } catch { }
    } else { setLabelInfo({ brand_label: '', brand_label_pos: 'Arka Yaka Ortası', size_label: '', size_label_pos: 'Arka Yaka Sol', care_label: '', care_label_pos: 'Sol Yan Dikiş', content_label: '', content_label_pos: 'Sol Yan Dikiş', hangtag: '', barcode: '', wash_icons: [], special_label_notes: '' }); }
  };



  const handleSaveOperation = async (modelId, formData) => {

    try {

      const res = await fetch(`/api/models/${modelId}/operations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }

      await loadOperations(modelId); await loadModels(); setShowOperationModal(null); addToast('success', 'İşlem eklendi!');

    } catch (err) { addToast('error', err.message || 'Hata oluştu'); }
  };

  // B3: İşlem silme
  const handleDeleteOperation = async (modelId, opId) => {
    try {
      const res = await fetch(`/api/models/${modelId}/operations?opId=${opId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme hatası');
      await loadOperations(modelId);
      await loadModels();
      addToast('success', 'İşlem silindi');
    } catch (err) { addToast('error', err.message); }
  };

  // B4: İşlem sıra değiştirme
  const handleMoveOperation = async (modelId, opId, direction) => {
    const ops = modelOperations[modelId] || [];
    const idx = ops.findIndex(o => o.id === opId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ops.length) return;
    const currentOp = ops[idx];
    const targetOp = ops[targetIdx];
    try {
      await fetch(`/api/models/${modelId}/operations`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation_id: currentOp.id, order_number: targetOp.order_number })
      });
      await fetch(`/api/models/${modelId}/operations`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation_id: targetOp.id, order_number: currentOp.order_number })
      });
      await loadOperations(modelId);
      addToast('success', 'Sıra değiştirildi');
    } catch (err) { addToast('error', err.message); }
  };


  // ===== ÖLÇÜ TABLOSU KAYDET =====
  const handleSaveMeasurements = async (modelId) => {
    try {
      const measurementData = JSON.stringify({ points: measurePoints, sizes: measureSizes, data: measureData });
      const res = await fetch(`/api/models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurement_table: measurementData, changed_by: 'admin' })
      });
      if (!res.ok) throw new Error('Kaydetme hatas\u0131');
      await loadModels();
      addToast('success', '\u2705 \u00D6l\u00E7\u00FC tablosu kaydedildi!');
    } catch (err) { addToast('error', err.message || 'Hata oluştu'); }
  };



  const washIcons = [

    { id: 'wash_normal', icon: '🧼', label: 'Normal Yıkama' },

    { id: 'wash_gentle', icon: '📋', label: 'Hassas Yıkama' },

    { id: 'wash_hand', icon: '🤝', label: 'Elde Yıkama' },

    { id: 'wash_no', icon: '⚠️', label: 'Yıkamayın' },

    { id: 'bleach_no', icon: '⛔', label: 'AĞartma Yok' },

    { id: 'iron_low', icon: '🌡️', label: 'Düşük Isı Ütü' },

    { id: 'iron_med', icon: '♨️', label: 'Orta Isı Ütü' },

    { id: 'iron_no', icon: '🚫', label: 'Ütüleme' },

    { id: 'dry_flat', icon: '➗', label: 'Yatay Kurutma' },

    { id: 'dry_hang', icon: '📏', label: 'Asarak Kurutma' },

    { id: 'dry_no', icon: '🚫', label: 'Kurutma Yok' },

    { id: 'dryclean', icon: '📋', label: 'Kuru Temizleme' },

  ];



  const labelPositions = ['Arka Yaka Ortası', 'Arka Yaka Sol', 'Arka Yaka SaĞ', 'Sol Yan Dikiş', 'SaĞ Yan Dikiş', 'İç Bel', 'Arka Bel Ortası', 'Sol İç Cep', 'SaĞ İç Cep', 'Ön Sol Alt', 'Arka Sol Alt'];



  const detailTabs = [
    { id: 'genel', label: '📋 Genel' },
    { id: 'olcu', label: '📏 Ölçü Tablosu' },
    { id: 'bom', label: '📦 Malzeme (BOM)' },
    { id: 'akis', label: '🗺️ Üretim Akış Planı' },
    { id: 'kesim', label: '✂️ Kesim & Ön İşlem' },
    { id: 'islemler', label: '🧵 Dikim İşlem Sırası' },
    { id: 'aksesuar', label: '🔧 Aksesuar & Son İşlem' },
    { id: 'etiket', label: '🏷️ Etiket & Yıkama' },
    { id: 'teknikfoy', label: '🔄 Teknik Föy' },
    { id: 'onay', label: '✅ Onay Zinciri' },
    { id: 'sesnotu', label: '🎤 Ses Notu' },
  ];




  const infoCell = (label, value) => (

    value ? <div><span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>{label}</span><div style={{ fontSize: '14px', fontWeight: '600', marginTop: '2px' }}>{value}</div></div> : null

  );



  return (

    <>

      <div className="topbar">
        <h1 className="topbar-title">📋 Modeller</h1>
        <div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input className="form-input" placeholder="🔍 Model ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '200px', fontSize: '13px', padding: '8px 12px' }} />
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '150px', fontSize: '13px', padding: '8px' }}>
            <option value="">Tüm Durumlar</option>
            <option value="prototip">🔵 Prototip</option>
            <option value="orijinal_numune">🟢 Orijinal Numune</option>
            <option value="uretimde">🟠 Üretimde</option>
            <option value="uretim_tamamlandi">🏁 Tamamlandı</option>
            <option value="sevk_edildi">🚚 Sevk Edildi</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>➕ Yeni Model</button>
        </div>

      </div>

      <div className="page-content">

        {models.length === 0 ? (

          <div className="card"><div className="empty-state"><div className="empty-state-icon">🗑️</div><div className="empty-state-title">Henüz Model Yok</div><div className="empty-state-text">İlk modelinizi ekleyerek başlayın.</div><button className="btn btn-primary btn-lg" onClick={() => setShowNewModal(true)}>➕ İlk Modeli Ekle</button></div></div>

        ) : (

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {models.filter(m => {
              const q = searchQuery.toLowerCase();
              const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q) || m.customer?.toLowerCase().includes(q) || m.order_no?.toLowerCase().includes(q);
              const matchStatus = !statusFilter || m.status === statusFilter;
              return matchSearch && matchStatus;
            }).map(model => (

              <div key={model.id} className="card" style={{ cursor: 'pointer' }}>

                <div className="card-header" onClick={() => handleToggleModel(model.id)}>

                  <div>

                    <h3 className="card-title" style={{ fontSize: '18px' }}>

                      {expandedModel === model.id ? '🔴' : '▶️'} {model.name}

                    </h3>

                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>

                      <code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px' }}>{model.code}</code>

                      {model.order_no && <>  <strong>Sipariş:</strong> {model.order_no}</>}

                      {'  '}{model.operation_count || 0} işlem

                      {'  '}{(model.total_order || 0).toLocaleString('tr-TR')} adet

                      {model.customer && <>  <strong>Müşteri:</strong> {model.customer}</>}

                    </div>

                    {/* ── ÜRETİM İLERLEME ÇUBUĞU ── */}
                    {(model.total_order > 0) && (() => {
                      const tamamlanan = model.completed_count || 0;
                      const toplam = model.total_order || 0;
                      const hatali = model.defective_count || 0;
                      const yuzde = toplam > 0 ? Math.round((tamamlanan / toplam) * 100) : 0;
                      const renk = yuzde >= 100 ? '#27ae60' : yuzde >= 60 ? '#f39c12' : '#3498db';
                      return (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                            <span>✅ {tamamlanan.toLocaleString('tr-TR')} / {toplam.toLocaleString('tr-TR')} adet</span>
                            <span style={{ display: 'flex', gap: '8px' }}>
                              {hatali > 0 && <span style={{ color: '#e74c3c' }}>❌ {hatali} hatali</span>}
                              <span style={{ fontWeight: '700', color: renk }}>%{yuzde}</span>
                            </span>
                          </div>
                          <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(yuzde, 100)}%`, height: '100%', background: renk, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      );
                    })()}

                  </div>


                  <div style={{ display: 'flex', gap: '8px' }}>

                    <span className={`badge ${model.status === 'prototip' ? 'badge-info' : 'badge-success'}`}

                      style={{ cursor: 'pointer' }}

                      onClick={async (e) => {

                        e.stopPropagation();

                        const statusOrder = ['prototip', 'orijinal_numune', 'ilk_uretim_numunesi', 'uretim_numunesi', 'numune_onaylandi', 'uretimde', 'uretim_tamamlandi', 'sayi_seti', 'sevk_edildi'];
                        const currentIdx = statusOrder.indexOf(model.status);
                        const nextIdx = (currentIdx + 1) % statusOrder.length;
                        const newStatus = statusOrder[nextIdx];

                        // Üretime alırken uygunluk kontrolü

                        if (newStatus === 'uretimde') {

                          const warnings = [];

                          if (!model.operation_count || model.operation_count === 0) warnings.push('⚠️ Hiç işlem tanımlanmamış');

                          try {

                            const opsRes = await fetch(`/api/models/${model.id}/operations`);

                            const ops = await opsRes.json();

                            const noMachine = (Array.isArray(ops) ? ops : []).filter(op => !op.machine_type);

                            if (noMachine.length > 0) warnings.push(`⚠️ ${noMachine.length} işlemde makine tipi belirtilmemiş`);

                            const noVideo = (Array.isArray(ops) ? ops : []).filter(op => !op.video_path);

                            if (noVideo.length > 0) warnings.push(`⚠️ ${noVideo.length} işlemde video yüklenmemiş`);

                          } catch (err) { }

                          if (warnings.length > 0) {

                            if (!confirm('İşletme Uygunluk Kontrolü:\n\n' + warnings.join('\n') + '\n\nYine de üretime almak istiyor musunuz?')) return;

                          }

                        }

                        try {

                          await fetch(`/api/models/${model.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });

                          await loadModels();

                          const statusLabels = { orijinal_numune: 'Orijinal Numune', ilk_uretim_numunesi: 'İlk Üretim Numunesi', uretim_numunesi: 'Üretim Numunesi', numune_onaylandi: 'Numune Onaylandı', uretimde: 'Üretimde', uretim_tamamlandi: 'Üretim Tamamlandı', sayi_seti: 'Sayı Seti', sevk_edildi: 'Sevk Edildi' };
                          addToast('success', `Durum: ${statusLabels[newStatus] || newStatus}`);

                        } catch (err) { addToast('error', 'Durum değiştirilemedi'); }

                      }}

                      title="Durumu değiştirmek için tıklayın (sonraki aşamaya geçer)"

                    >

                      {(() => {
                        const sl = { orijinal_numune: '🟢 Orijinal Numune', ilk_uretim_numunesi: '🔵 İlk Üretim', uretim_numunesi: '🟡 Üretim Numune', numune_onaylandi: '✅ Onaylandı', uretimde: '🟠 Üretimde', uretim_tamamlandi: '🏁 Tamamlandı', sayi_seti: '📦 Sayı Seti', sevk_edildi: '🚚 Sevk Edildi', prototip: '🔵 Prototip' };
                        return sl[model.status] || model.status;
                      })()}

                    </span>

                    <button className="btn btn-sm" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' }} onClick={(e) => { e.stopPropagation(); openEditModal(model); }} title="Düzenle">✏️</button>
                    <button className="btn btn-sm" style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60', border: '1px solid rgba(39,174,96,0.3)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' }} onClick={async (e) => { e.stopPropagation(); if (!confirm(`"${model.name}" modelini kopyalamak istiyor musunuz?`)) return; try { const res = await fetch('/api/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...model, name: model.name + ' — KOPYA', code: model.code + '-K', id: undefined, created_at: undefined }) }); if (!res.ok) throw new Error('Kopyalama hatası'); await loadModels(); addToast('success', '✅ Model kopyalandı'); } catch (err) { addToast('error', err.message); } }} title="Modeli Kopyala">📋</button>
                    <button className="btn btn-sm" style={{ background: 'rgba(155,89,182,0.15)', color: '#9b59b6', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' }} onClick={(e) => { e.stopPropagation(); openAuditHistory(model.id); }} title="Değişiklik Geçmişi">📜</button>
                    <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id); }}>🗑️</button>

                  </div>

                </div>



                {expandedModel === model.id && (

                  <div style={{ marginTop: '0', borderTop: '1px solid var(--border-color)' }}>

                    <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-input)' }}>

                      {detailTabs.map(tab => (

                        <button key={tab.id} type="button" onClick={(e) => { e.stopPropagation(); setDetailTab(tab.id); }}

                          style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: 'none', borderBottom: detailTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent', background: detailTab === tab.id ? 'var(--bg-card)' : 'transparent', color: detailTab === tab.id ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'inherit', transition: 'all 0.2s' }}>{tab.label}</button>

                      ))}

                    </div>



                    {/* ===== GENEL BİLGİLER TAB ===== */}

                    {detailTab === 'genel' && (() => {
                      const iF = inlineGenel ? inlineForm : model;
                      const inp = (key, label, type) => inlineGenel ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{label}</label>
                          {type === 'select-astar' ? (
                            <select className="form-select" style={{ fontSize: '12px' }} value={inlineForm.has_lining || 0} onChange={e => setInlineForm({ ...inlineForm, has_lining: parseInt(e.target.value) })}>
                              <option value={0}>Hayir</option><option value={1}>Evet</option>
                            </select>
                          ) : type === 'select-tela' ? (
                            <select className="form-select" style={{ fontSize: '12px' }} value={inlineForm.has_interlining || 0} onChange={e => setInlineForm({ ...inlineForm, has_interlining: parseInt(e.target.value) })}>
                              <option value={0}>Hayir</option><option value={1}>Evet</option>
                            </select>
                          ) : type === 'select-garni' ? (
                            <select className="form-select" style={{ fontSize: '12px' }} value={inlineForm.garni || 'Yok'} onChange={e => setInlineForm({ ...inlineForm, garni: e.target.value })}>
                              <option value="Yok">Yok</option><option value="Var">Var</option>
                            </select>
                          ) : (
                            <input className="form-input" style={{ fontSize: '12px' }} type={type || 'text'} value={inlineForm[key] || ''} onChange={e => setInlineForm({ ...inlineForm, [key]: e.target.value })} />
                          )}
                        </div>
                      ) : infoCell(label, model[key]);
                      return (
                        <div style={{ padding: '16px 20px' }}>
                          {/* Baslik + Eylem Butonlari */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Genel Bilgiler</div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {!inlineGenel ? (
                                <button type="button" onClick={() => { setInlineForm({ ...model }); setInlineGenel(true); }}
                                  style={{ background: 'rgba(212,168,71,0.15)', border: '1px solid rgba(212,168,71,0.3)', borderRadius: '6px', color: '#D4A847', cursor: 'pointer', fontSize: '12px', padding: '5px 12px', fontWeight: '600' }}>✏️ Düzenle</button>
                              ) : (
                                <>
                                  <button type="button" onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/models/${model.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inlineForm) });
                                      if (!res.ok) throw new Error();
                                      await loadModels();
                                      setInlineGenel(false);
                                      addToast('success', '✅ Kaydedildi');
                                    } catch { addToast('error', 'Kayıt hatası'); }
                                  }} style={{ background: 'rgba(46,204,113,0.2)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', padding: '5px 12px', fontWeight: '600' }}>💾 Kaydet</button>
                                  <button type="button" onClick={() => setInlineGenel(false)}
                                    style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '6px', color: '#e74c3c', cursor: 'pointer', fontSize: '12px', padding: '5px 12px', fontWeight: '600' }}>✕ İptal</button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* SATIR 1: Model Kodu | Siparis No | Musteri | Modelist | Kumas | Garni | Renk Sayisi | Beden Sayisi */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px', marginBottom: '10px' }}>
                            {inlineGenel ? (
                              <>
                                {inp('code', 'Model Kodu')}
                                {inp('order_no', 'Siparis No')}
                                {inp('customer', 'Musteri')}
                                {inp('modelist', 'Modelist')}
                                {inp('fabric_type', 'Kumas')}
                                {inp('garni', 'Garni', 'select-garni')}
                                {inp('color_count', 'Renk Sayisi', 'number')}
                                {inp('size_count', 'Beden Sayisi')}
                              </>
                            ) : (
                              <>
                                {infoCell('Model Kodu', model.code)}
                                {infoCell('Siparis No', model.order_no)}
                                {infoCell('Musteri', model.customer)}
                                {infoCell('Modelist', model.modelist)}
                                {infoCell('Kumas', model.fabric_type)}
                                {infoCell('Garni', model.garni)}
                                {infoCell('Renk Sayisi', model.color_count)}
                                {infoCell('Beden Sayisi', model.size_count)}
                              </>
                            )}
                          </div>

                          {/* SATIR 2: Asorti | Siparis Adeti | Parca Sayisi | Fason Fiyati | Zorluk | Astar | Tela | Ise Baslama | Sevk Tarihi */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '10px', marginBottom: '14px' }}>
                            {inlineGenel ? (
                              <>
                                {inp('asorti', 'Asorti')}
                                {inp('total_order', 'Siparis Adeti', 'number')}
                                {inp('piece_count', 'Parca Sayisi', 'number')}
                                {inp('fason_price', 'Fason Fiyati', 'number')}
                                {inp('model_difficulty', 'Zorluk', 'number')}
                                {inp('has_lining', 'Astar', 'select-astar')}
                                {inp('has_interlining', 'Tela', 'select-tela')}
                                {inp('work_start_date', 'Ise Baslama', 'date')}
                                {inp('delivery_date', 'Sevk Tarihi', 'date')}
                              </>
                            ) : (
                              <>
                                {infoCell('Asorti', model.asorti)}
                                {infoCell('Siparis Adeti', model.total_order?.toLocaleString('tr-TR'))}
                                {infoCell('Parca Sayisi', model.piece_count)}
                                {infoCell('Fason Fiyati', model.fason_price ? `${model.fason_price} TL` : null)}
                                {infoCell('Zorluk', `${model.model_difficulty || 5}/10`)}
                                {infoCell('Astar', model.has_lining ? 'Evet' : 'Hayir')}
                                {infoCell('Tela', model.has_interlining ? 'Evet' : 'Hayir')}
                                {infoCell('Ise Baslama', model.work_start_date ? new Date(model.work_start_date).toLocaleDateString('tr-TR') : null)}
                                {infoCell('Sevk Tarihi', model.delivery_date ? new Date(model.delivery_date).toLocaleDateString('tr-TR') : null)}
                              </>
                            )}
                          </div>

                          {/* Kritik Notlar */}
                          {model.difficult_points && !inlineGenel && (
                            <div style={{ marginBottom: '8px', padding: '10px 14px', background: 'rgba(255,193,7,0.1)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--warning)' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--warning)', marginBottom: '3px' }}>Ozenle Yapilacak Noktalar</div>
                              <div style={{ fontSize: '13px' }}>{model.difficult_points}</div>
                            </div>
                          )}
                          {model.critical_points && !inlineGenel && (
                            <div style={{ padding: '10px 14px', background: 'rgba(220,53,69,0.1)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--danger)' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--danger)', marginBottom: '3px' }}>Kritik Noktalar</div>
                              <div style={{ fontSize: '13px' }}>{model.critical_points}</div>
                            </div>
                          )}
                        </div>
                      );
                    })()}



                    {/* ===== ÖLÇÜ TABLOSU TAB ===== */}

                    {detailTab === 'olcu' && (

                      <div style={{ padding: '20px' }}>

                        {/* Model Bilgisi Başlığı */}
                        <div style={{ marginBottom: '20px', padding: '16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99,102,241,0.2)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>{'\uD83D\uDCCF'} {model.name} — {'\u00D6'}l{'\u00E7\u00FC'} Tablosu</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Model Kodu: <strong>{model.code}</strong>
                                {model.order_no && <> | Sipari{'ş'} No: <strong>{model.order_no}</strong></>}
                                {model.customer && <> | M{'\u00FCş'}teri: <strong>{model.customer}</strong></>}
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                              <div>Tarih: <strong>{model.created_at ? new Date(model.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</strong></div>
                              {model.delivery_date && <div>Teslim: <strong>{new Date(model.delivery_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>}
                            </div>
                          </div>
                        </div>

                        {/* Ölçü Noktaları Tanımları */}

                        <div style={{ marginBottom: '24px' }}>

                          <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>{'\uD83D\uDCCF'} {'\u00D6'}l{'\u00E7\u00FC'} Noktalar{'\u0131'} Tan{'\u0131'}mlar{'\u0131'}</h4>

                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Her {'\u00F6'}l{'\u00E7\u00FC'} noktas{'\u0131'}n{'\u0131'}n nerede ve nas{'\u0131'}l {'\u00F6'}l{'\u00E7\u00FC'}lece{'ğ'}ini tan{'\u0131'}mlay{'\u0131'}n.</p>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px', marginBottom: '12px' }}>

                            {measurePoints.map((point, i) => (

                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>

                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', minWidth: '20px' }}>{i + 1}</span>

                                <div style={{ flex: 1 }}>

                                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{point.name}</div>

                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{point.description}</div>

                                </div>

                                <button type="button" onClick={() => setMeasurePoints(measurePoints.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--danger)', padding: '2px' }}>✕</button>

                              </div>

                            ))}

                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>

                            <input className="form-input" placeholder="Ölçü noktası adı" value={newMeasurePoint} onChange={e => setNewMeasurePoint(e.target.value)} style={{ flex: 1, fontSize: '12px' }} />

                            <input className="form-input" placeholder="Nasıl ölçülür?" value={newMeasurePointDesc} onChange={e => setNewMeasurePointDesc(e.target.value)} style={{ flex: 2, fontSize: '12px' }} />

                            <button className="btn btn-primary btn-sm" type="button" onClick={() => {

                              if (newMeasurePoint) { setMeasurePoints([...measurePoints, { name: newMeasurePoint, description: newMeasurePointDesc || '' }]); setNewMeasurePoint(''); setNewMeasurePointDesc(''); }

                            }}>+ Ekle</button>

                          </div>

                        </div>



                        {/* Ölçü Matrisi */}

                        <div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>

                            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>📏 Ölçü Matrisi (Beden  Değer)</h4>

                            <div style={{ display: 'flex', gap: '4px' }}>

                              <input className="form-input" placeholder="Yeni beden" value={newMeasureSize} onChange={e => setNewMeasureSize(e.target.value)} style={{ width: '100px', fontSize: '12px' }} />

                              <button className="btn btn-primary btn-sm" type="button" onClick={() => {

                                if (newMeasureSize && !measureSizes.includes(newMeasureSize)) { setMeasureSizes([...measureSizes, newMeasureSize]); setNewMeasureSize(''); }

                              }}>+ Sütun</button>

                            </div>

                          </div>

                          <div className="table-wrapper">

                            <table className="table" style={{ fontSize: '13px' }}>

                              <thead>

                                <tr>

                                  <th style={{ minWidth: '120px', background: 'var(--accent)', color: '#fff' }}>Ölçü Noktası</th>

                                  <th style={{ minWidth: '70px', background: 'var(--accent)', color: '#fff', textAlign: 'center' }}>Tolerans (±cm)</th>

                                  {measureSizes.map(size => (<th key={size} style={{ textAlign: 'center', minWidth: '70px', background: 'var(--accent)', color: '#fff' }}>{size}</th>))}

                                </tr>

                              </thead>

                              <tbody>

                                {measurePoints.map((point, pi) => (

                                  <tr key={pi} style={{ background: pi % 2 === 0 ? 'var(--bg-input)' : 'transparent' }}>

                                    <td style={{ fontWeight: '600', fontSize: '12px' }} title={point.description}>{point.name}</td>

                                    <td style={{ textAlign: 'center' }}>

                                      <input style={{ width: '55px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', fontSize: '12px', background: 'var(--bg-card)' }}

                                        placeholder="±1" value={measureData[`${point.name}_tol`] || '1'} onChange={e => setMeasureData({ ...measureData, [`${point.name}_tol`]: e.target.value })} />

                                    </td>

                                    {measureSizes.map(size => (

                                      <td key={size} style={{ textAlign: 'center' }}>

                                        <input style={{ width: '60px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', fontSize: '12px', background: 'var(--bg-card)', fontWeight: '600' }}

                                          placeholder="—" type="number" step="0.5" value={measureData[`${point.name}_${size}`] || ''} onChange={e => setMeasureData({ ...measureData, [`${point.name}_${size}`]: e.target.value })} />

                                      </td>

                                    ))}

                                  </tr>

                                ))}

                              </tbody>

                            </table>
                          </div>

                          <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-muted)' }}>
                            📏 Ölçüler cm cinsindendir. Tolerans ±1 cm — yani gerçek ölçü, tablodaki değerden -1 cm ile +1 cm arasında ise kabul edilir. Tolerans değerini her ölçü noktası için ayrı ayrı değiştirebilirsiniz.
                          </div>

                          {/* KAYDET BUTONU */}
                          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" className="btn btn-primary" onClick={() => handleSaveMeasurements(model.id)} style={{ padding: '12px 32px', fontSize: '15px', fontWeight: '700', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              💾 Ölçü Tablosunu Kaydet
                            </button>
                          </div>

                        </div>

                      </div>

                    )}



                    {/* ===== ÜRETİM AKIŞ PLANI TAB ===== */}
                    {detailTab === 'akis' && (
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>🗺️ Üretim Akış Planı — {model.name}</h4>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button type="button" onClick={() => setShowNewStepForm(!showNewStepForm)} style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.35)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', padding: '5px 12px', fontWeight: '600' }}>+ Adim Ekle</button>
                            <button type="button" onClick={() => { if (confirm('Akis planini varsayilana sifirla?')) { setFlowSteps(defaultFlowSteps); setEditStepIdx(null); } }} style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: '6px', color: '#e74c3c', cursor: 'pointer', fontSize: '12px', padding: '5px 12px' }}>↺ Sifirla</button>
                          </div>
                        </div>

                        {showNewStepForm && (
                          <div style={{ marginBottom: '16px', padding: '14px', background: 'rgba(46,204,113,0.06)', borderRadius: '10px', border: '1px solid rgba(46,204,113,0.2)' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#27ae60', marginBottom: '10px' }}>+ Yeni Adim</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 2fr 80px', gap: '6px', marginBottom: '8px' }}>
                              <input className="form-input" style={{ fontSize: '12px' }} placeholder="Ikon" value={newStepForm.icon} onChange={e => setNewStepForm({ ...newStepForm, icon: e.target.value })} />
                              <input className="form-input" style={{ fontSize: '12px' }} placeholder="Adim adi..." value={newStepForm.title} onChange={e => setNewStepForm({ ...newStepForm, title: e.target.value })} />
                              <input className="form-input" style={{ fontSize: '12px' }} placeholder="Aciklama..." value={newStepForm.desc} onChange={e => setNewStepForm({ ...newStepForm, desc: e.target.value })} />
                              <input className="form-input" style={{ fontSize: '12px' }} placeholder="Renk" value={newStepForm.color} onChange={e => setNewStepForm({ ...newStepForm, color: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button type="button" onClick={() => { if (!newStepForm.title) return; setFlowSteps([...flowSteps, { ...newStepForm, id: Date.now() }]); setNewStepForm({ icon: '📋', title: '', desc: '', color: '#3498db', tab: 'akis' }); setShowNewStepForm(false); }} style={{ background: 'rgba(46,204,113,0.2)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', padding: '5px 12px', fontWeight: '600' }}>💾 Ekle</button>
                              <button type="button" onClick={() => setShowNewStepForm(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: '5px 12px' }}>Iptal</button>
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                          {flowSteps.map((s, i) => (
                            <div key={s.id || i}>
                              {editStepIdx === i ? (
                                <div style={{ padding: '12px', background: `${s.color}0D`, border: `1px solid ${s.color}30`, borderRadius: '10px', marginBottom: '2px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: '700', color: s.color, marginBottom: '8px' }}>✏️ Adimi Düzenle</div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 2fr 80px', gap: '6px', marginBottom: '8px' }}>
                                    <input className="form-input" style={{ fontSize: '12px' }} placeholder="Ikon" value={editStepForm.icon || ''} onChange={e => setEditStepForm({ ...editStepForm, icon: e.target.value })} />
                                    <input className="form-input" style={{ fontSize: '12px' }} placeholder="Adim adi" value={editStepForm.title || ''} onChange={e => setEditStepForm({ ...editStepForm, title: e.target.value })} />
                                    <input className="form-input" style={{ fontSize: '12px' }} placeholder="Aciklama" value={editStepForm.desc || ''} onChange={e => setEditStepForm({ ...editStepForm, desc: e.target.value })} />
                                    <input className="form-input" style={{ fontSize: '12px' }} placeholder="Renk" value={editStepForm.color || ''} onChange={e => setEditStepForm({ ...editStepForm, color: e.target.value })} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button type="button" onClick={() => { const u = [...flowSteps]; u[i] = { ...u[i], ...editStepForm }; setFlowSteps(u); setEditStepIdx(null); }} style={{ background: 'rgba(46,204,113,0.2)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', padding: '4px 10px', fontWeight: '600' }}>💾 Kaydet</button>
                                    <button type="button" onClick={() => setEditStepIdx(null)} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: '4px 10px' }}>Iptal</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: '10px', transition: 'all 0.15s' }}>
                                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>{i + 1}</div>
                                  <div style={{ fontSize: '18px', flexShrink: 0 }}>{s.icon}</div>
                                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { if (s.tab) setDetailTab(s.tab); }}>
                                    <div style={{ fontWeight: '700', fontSize: '13px', color: s.color }}>{s.title}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{s.desc}</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                    <button type="button" onClick={() => { setEditStepForm({ ...s }); setEditStepIdx(i); }} style={{ background: 'rgba(212,168,71,0.15)', border: 'none', borderRadius: '5px', color: '#D4A847', cursor: 'pointer', fontSize: '11px', padding: '3px 8px' }}>✏️</button>
                                    <button type="button" onClick={() => { if (i > 0) { const u = [...flowSteps];[u[i - 1], u[i]] = [u[i], u[i - 1]]; setFlowSteps(u); } }} style={{ background: 'rgba(52,152,219,0.1)', border: 'none', borderRadius: '5px', color: '#3498db', cursor: 'pointer', fontSize: '11px', padding: '3px 6px' }}>↑</button>
                                    <button type="button" onClick={() => { if (i < flowSteps.length - 1) { const u = [...flowSteps];[u[i], u[i + 1]] = [u[i + 1], u[i]]; setFlowSteps(u); } }} style={{ background: 'rgba(52,152,219,0.1)', border: 'none', borderRadius: '5px', color: '#3498db', cursor: 'pointer', fontSize: '11px', padding: '3px 6px' }}>↓</button>
                                    <button type="button" onClick={() => { if (confirm('Bu adimi sil?')) setFlowSteps(flowSteps.filter((_, j) => j !== i)); }} style={{ background: 'rgba(231,76,60,0.1)', border: 'none', borderRadius: '5px', color: '#e74c3c', cursor: 'pointer', fontSize: '11px', padding: '3px 6px' }}>🗑️</button>
                                  </div>
                                </div>
                              )}
                              {i < flowSteps.length - 1 && <div style={{ width: '2px', height: '8px', background: 'var(--border-color)', margin: '0 0 0 32px' }} />}
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: '14px', padding: '8px 12px', background: 'rgba(46,204,113,0.05)', borderRadius: '8px', border: '1px solid rgba(46,204,113,0.15)', fontSize: '11px', color: '#27ae60' }}>
                          💡 Her adima tikla → o sekmeye git. ✏️ → düzenle. ↑↓ → siralayi degistir. 🗑️ → sil.
                        </div>
                      </div>
                    )}



                    {/* ===== KESİM & ÖN İŞLEM TAB ===== */}
                    {detailTab === 'kesim' && (
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>✂️ Kesim &amp; Ön İşlem — {model.name}</h4>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button type="button" onClick={() => handleSaveTabInfo(model.id, 'cutting_info', cuttingInfo)} style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.35)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', padding: '5px 12px', fontWeight: '600' }}>💾 Kaydet</button>
                            <button type="button" onClick={() => { if (confirm('Kesim bilgilerini sifirla?')) setCuttingInfo({ pre_cutting: '', cutting_type: 'Serileme (Elle)', pastal_count: '', cutting_steps: '', post_cutting_checks: [], post_cutting_notes: '' }); }} style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: '6px', color: '#e74c3c', cursor: 'pointer', fontSize: '12px', padding: '5px 10px' }}>↺ Temizle</button>
                          </div>
                        </div>

                        <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(142,68,173,0.05)', borderRadius: '12px', border: '1px solid rgba(142,68,173,0.15)' }}>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#8e44ad', marginBottom: '14px' }}>🔄 1. KESİMDEN ÖNCE YAPILACAK İŞLEMLER</h5>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Kumaş kesime girmeden önce yapılması gereken işlemler (plise, ön yıkama, boyama, sanfor vb.)</div>
                          <textarea className="form-textarea" rows={3} placeholder={"İşlem sırası ile yazın:\n1. Kumaş kontrolü\n2. Plise işlemi (varsa)\n3. Ön yıkama / sanfor (varsa)"} style={{ fontSize: '13px' }} value={cuttingInfo.pre_cutting || ''} onChange={e => setCuttingInfo({ ...cuttingInfo, pre_cutting: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(41,128,185,0.05)', borderRadius: '12px', border: '1px solid rgba(41,128,185,0.15)' }}>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#2980b9', marginBottom: '14px' }}>✂️ 2. KESİM İŞLEMLERİ</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                            <div><label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Kesim Tipi</label>
                              <select className="form-select" style={{ fontSize: '12px' }} value={cuttingInfo.cutting_type || 'Serileme (Elle)'} onChange={e => setCuttingInfo({ ...cuttingInfo, cutting_type: e.target.value })}><option>Serileme (Elle)</option><option>Otomatik Kesim</option><option>Lazer Kesim</option><option>Kalıp Kesim</option></select></div>
                            <div><label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Pastal Katman Sayısı</label>
                              <input className="form-input" type="text" placeholder="örn: 40 kat" style={{ fontSize: '12px' }} value={cuttingInfo.pastal_count || ''} onChange={e => setCuttingInfo({ ...cuttingInfo, pastal_count: e.target.value })} /></div>
                          </div>
                          <textarea className="form-textarea" rows={4} placeholder={"Kesim işlem sırası:\n1. Beden kesimi — ana parçalar\n2. Garni kesimi — yaka, manşet, pat\n3. Tela kesimi — yaka tela, manşet tela\n4. Taş/Astar kesimi (varsa)\n5. Kontrol & eşleştirme"} style={{ fontSize: '13px' }} value={cuttingInfo.cutting_steps || ''} onChange={e => setCuttingInfo({ ...cuttingInfo, cutting_steps: e.target.value })} />
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(230,126,34,0.05)', borderRadius: '12px', border: '1px solid rgba(230,126,34,0.15)' }}>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#e67e22', marginBottom: '14px' }}>⚡ 3. KESİM SONRASI — DİKİM ÖNCESİ İŞLEMLER</h5>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Parçalar kesildikten sonra, dikime girmeden önce yapılması gereken işlemler</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                            {['İlik', 'Nakış', 'Baskı', 'Tela Yapıştırma', 'Plise', 'Taş Yapış.', 'Transfer Baskı', 'Lazer İşlem', 'Diğer'].map(item => {
                              const checks = cuttingInfo.post_cutting_checks || [];
                              const isChecked = checks.includes(item);
                              return (
                                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '5px 8px', background: isChecked ? 'rgba(230,126,34,0.15)' : 'var(--bg-input)', borderRadius: '6px', cursor: 'pointer', border: isChecked ? '1px solid #e67e22' : '1px solid transparent' }}>
                                  <input type="checkbox" checked={isChecked} onChange={() => {
                                    const next = isChecked ? checks.filter(x => x !== item) : [...checks, item];
                                    setCuttingInfo({ ...cuttingInfo, post_cutting_checks: next });
                                  }} /> {item}
                                </label>
                              );
                            })}
                          </div>
                          <textarea className="form-textarea" rows={4} placeholder={"İşlem sırası ve detayları:\n1. Tela yapıştırma — Yaka ve manşet, 160C, 15sn\n2. Nakış — Logo, ön göğüs sol, 8x3cm\n3. Baskı — Arka DTF, 40x30cm\n4. İlik — Ön pat, 7 adet düz ilik"} style={{ fontSize: '13px' }} value={cuttingInfo.post_cutting_notes || ''} onChange={e => setCuttingInfo({ ...cuttingInfo, post_cutting_notes: e.target.value })} />
                          <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(231,76,60,0.06)', borderRadius: '6px', fontSize: '11px', color: '#e74c3c' }}>
                            ⚠️ Bu işlemler dikime girmeden ÖNCE tamamlanmalıdır. Eksik işlemle dikime giren ürün hatalı üretilir.
                          </div>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" onClick={() => handleSaveTabInfo(model.id, 'cutting_info', cuttingInfo)} style={{ padding: '12px 32px', fontSize: '15px', fontWeight: '700', borderRadius: '10px' }}>💾 Kesim Bilgilerini Kaydet</button>
                        </div>
                      </div>
                    )}



                    {/* ===== AKSESUAR & SON İŞLEM TAB ===== */}
                    {detailTab === 'aksesuar' && (
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>🔧 Aksesuar &amp; Son İşlem — {model.name}</h4>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button type="button" onClick={() => handleSaveTabInfo(model.id, 'accessory_info', accessoryInfo)} style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.35)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', padding: '5px 12px', fontWeight: '600' }}>💾 Kaydet</button>
                            <button type="button" onClick={() => { if (confirm('Aksesuar bilgilerini sifirla?')) setAccessoryInfo({ accessories: {}, accessory_notes: '', wash_types: [], wash_notes: '', ironing_notes: '', packaging_notes: '' }); }} style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: '6px', color: '#e74c3c', cursor: 'pointer', fontSize: '12px', padding: '5px 10px' }}>↺ Temizle</button>
                          </div>
                        </div>

                        <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(192,57,43,0.05)', borderRadius: '12px', border: '1px solid rgba(192,57,43,0.15)' }}>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#c0392b', marginBottom: '14px' }}>🔧 AKSESUAR MONTAJ</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                            {[
                              { name: 'Düğme', ph: 'Adet, boyut, renk, konum' },
                              { name: 'İlik', ph: 'Adet, tip (düz/gözlü), konum' },
                              { name: 'Fermuar', ph: 'Uzunluk, tip (gizli/metal), konum' },
                              { name: 'Koç Gözü', ph: 'Adet, boyut, renk, konum' },
                              { name: 'Rivet', ph: 'Adet, boyut, konum' },
                              { name: 'Kemer', ph: 'Genişlik, uzunluk, toka tipi' },
                              { name: 'Kemer Tokası/İpi', ph: 'Tip, renk, malzeme' },
                              { name: 'Çıtçıt / Kuşgözü', ph: 'Adet, boyut, renk, konum' },
                            ].map(acc => (
                              <div key={acc.name} style={{ padding: '8px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>{acc.name}</label>
                                <input className="form-input" type="text" placeholder={acc.ph} style={{ fontSize: '12px' }} value={(accessoryInfo.accessories || {})[acc.name] || ''} onChange={e => setAccessoryInfo({ ...accessoryInfo, accessories: { ...(accessoryInfo.accessories || {}), [acc.name]: e.target.value } })} />
                              </div>
                            ))}
                          </div>
                          <textarea className="form-textarea" rows={3} placeholder={"Aksesuar montaj sırası:\n1. Koç gözü — ön cep köşeleri, 4 adet\n2. Düğme — ön pat, 7 adet, 18mm\n3. Kemer — 3.5cm, metal toka"} style={{ fontSize: '13px' }} value={accessoryInfo.accessory_notes || ''} onChange={e => setAccessoryInfo({ ...accessoryInfo, accessory_notes: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(22,160,133,0.05)', borderRadius: '12px', border: '1px solid rgba(22,160,133,0.15)' }}>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#16a085', marginBottom: '14px' }}>🌊 YIKAMA İŞLEMİ</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                            {['Yıkama Yok', 'Normal Yıkama', 'Taş Yıkama', 'Enzim Yıkama', 'Silikon Yıkama', 'Ağartma', 'Boyama', 'Softener', 'Diğer'].map(w => {
                              const wt = accessoryInfo.wash_types || [];
                              const isC = wt.includes(w);
                              return (
                                <label key={w} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '5px 8px', background: isC ? 'rgba(22,160,133,0.15)' : 'var(--bg-input)', borderRadius: '6px', cursor: 'pointer', border: isC ? '1px solid #16a085' : '1px solid transparent' }}>
                                  <input type="checkbox" checked={isC} onChange={() => {
                                    const next = isC ? wt.filter(x => x !== w) : [...wt, w];
                                    setAccessoryInfo({ ...accessoryInfo, wash_types: next });
                                  }} /> {w}
                                </label>
                              );
                            })}
                          </div>
                          <textarea className="form-textarea" rows={2} placeholder="Yıkama detayları: sıcaklık, süre, reçete..." style={{ fontSize: '13px' }} value={accessoryInfo.wash_notes || ''} onChange={e => setAccessoryInfo({ ...accessoryInfo, wash_notes: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(211,84,0,0.05)', borderRadius: '12px', border: '1px solid rgba(211,84,0,0.15)' }}>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#d35400', marginBottom: '14px' }}>♨️ ÜTÜ & KALİTE KONTROL</h5>
                          <textarea className="form-textarea" rows={3} placeholder={"1. Ara ütü talimatları\n2. Son ütü — sıcaklık, buharlı/kuru\n3. Kalite kontrol noktaları\n4. AQL seviyesi"} style={{ fontSize: '13px' }} value={accessoryInfo.ironing_notes || ''} onChange={e => setAccessoryInfo({ ...accessoryInfo, ironing_notes: e.target.value })} />
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(44,62,80,0.05)', borderRadius: '12px', border: '1px solid rgba(44,62,80,0.15)' }}>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#2c3e50', marginBottom: '14px' }}>📦 PAKETLEME</h5>
                          <textarea className="form-textarea" rows={3} placeholder={"1. Katlama şekli (standart/hadamlı)\n2. Poşetleme (tekli/çoklu)\n3. Koli düzeni (S:2, M:4, L:4, XL:2 = 12'li)\n4. Etiket yapıştırma konumu"} style={{ fontSize: '13px' }} value={accessoryInfo.packaging_notes || ''} onChange={e => setAccessoryInfo({ ...accessoryInfo, packaging_notes: e.target.value })} />
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" onClick={() => handleSaveTabInfo(model.id, 'accessory_info', accessoryInfo)} style={{ padding: '12px 32px', fontSize: '15px', fontWeight: '700', borderRadius: '10px' }}>💾 Aksesuar Bilgilerini Kaydet</button>
                        </div>
                      </div>
                    )}





                    {detailTab === 'teknikfoy' && (

                      <div style={{ padding: '20px' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>

                          <h4 style={{ fontSize: '15px', fontWeight: '700' }}>🔄 Teknik Föy — {model.name}</h4>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={async () => {
                              try {
                                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                                const recorder = new MediaRecorder(stream);
                                const chunks = [];
                                recorder.ondataavailable = e => chunks.push(e.data);
                                recorder.onstop = () => {
                                  const blob = new Blob(chunks, { type: 'video/webm' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url; a.download = `TeknikFoy_${model.code || model.id}_${Date.now()}.webm`;
                                  a.click(); URL.revokeObjectURL(url);
                                  stream.getTracks().forEach(t => t.stop());
                                  addToast('success', '✅ Video kaydedildi!');
                                };
                                recorder.start();
                                addToast('info', '🔴 Video kaydı başladı — tarayıcıdan "Paylaşımı Durdur" seçin');
                                setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 3600000);
                              } catch (e) {
                                if (e.name !== 'AbortError') addToast('error', 'Video başlatılamadı: ' + e.message);
                              }
                            }} style={{ padding: '6px 12px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', color: '#e74c3c', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                              🔴 Video Kayıt
                            </button>

                            <button className="btn btn-secondary btn-sm" onClick={() => {

                              const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
                              const w = window.open('', '_blank');

                              w.document.write(`<html><head><title>Teknik Föy — ${model.name}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#222}h1{font-size:20px;border-bottom:2px solid #333;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;font-size:12px}th{background:#f5f5f5;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.box{padding:10px;border:1px solid #ddd;border-radius:4px}.label{font-size:10px;color:#999;text-transform:uppercase}.val{font-size:13px;font-weight:600}@media print{button{display:none}}</style></head><body>

                              <h1>🔄 TEKNİK FÖY</h1>

                              <table><tr><th>Model Adı</th><td>${model.name}</td><th>Model Kodu</th><td>${model.code || '—'}</td></tr>

                              <tr><th>Müşteri</th><td>${model.customer || '—'}</td><th>Kumaş Tipi</th><td>${model.fabric_type || '—'}</td></tr>

                              <tr><th>Beden Aralığı</th><td>${model.size_range || '—'}</td><th>Renk Sayısı</th><td>${model.color_count || '—'}</td></tr>

                              <tr><th>Toplam İşlem</th><td>${model.operation_count || model.total_operations || '—'}</td><th>Parça Sayısı</th><td>${model.piece_count || '—'}</td></tr>

                              <tr><th>Astar</th><td>${model.has_lining ? 'Var (' + (model.lining_pieces || 0) + ' parça)' : 'Yok'}</td><th>Tela</th><td>${model.has_interlining ? 'Var' : 'Yok'}</td></tr>

                              <tr><th>Zorluk Noktaları</th><td colspan="3">${model.difficult_points || '—'}</td></tr>

                              <tr><th>Kritik Noktalar</th><td colspan="3">${model.critical_points || '—'}</td></tr>

                              <tr><th>Müşteri İstekleri</th><td colspan="3">${model.customer_requests || '—'}</td></tr></table>

                              <button onclick="window.print()" style="padding:8px 16px;cursor:pointer;margin-top:12px">🖨️ Yazdır / PDF</button>

                              <div style="margin-top:20px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:8px">Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}</div>

                            </body></html>`);

                              w.document.close();

                            }}> 🖨️ Yazdır / PDF</button>

                          </div>
                        </div>

                        {/* 🤖 GPT-4o VİSİON — OTOMATİK FÖY OKUMA */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(52,152,219,0.1), rgba(41,128,185,0.05))',
                          border: '1px solid rgba(52,152,219,0.3)',
                          borderRadius: '12px',
                          padding: '16px',
                          marginBottom: '20px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '20px' }}>🤖</span>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '14px' }}>Otomatik Teknik Föy Okuma</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fotoğraf yükle → GPT-4o Vision okusun → Bilgiler otomatik gelsin</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <label style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '8px 16px', background: 'rgba(52,152,219,0.15)',
                              border: '1px dashed rgba(52,152,219,0.4)', borderRadius: '8px',
                              cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#3498db'
                            }}>
                              <input type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  // Base64'e çevir
                                  const reader = new FileReader();
                                  reader.onload = async (ev) => {
                                    const base64 = ev.target.result.split(',')[1];
                                    addToast('info', '🤖 GPT-4o föyü okuyor...');
                                    try {
                                      const res = await fetch('/api/model-vision', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ image_base64: base64 })
                                      });
                                      const data = await res.json();
                                      if (data.success && data.data) {
                                        const d = data.data;
                                        // Sonucu göster
                                        const bilgiStr = [
                                          d.model_adi && `Model: ${d.model_adi}`,
                                          d.bedenler?.length && `Bedenler: ${d.bedenler.join(', ')}`,
                                          d.parca_sayisi && `Parça: ${d.parca_sayisi}`,
                                          d.islemler?.length && `${d.islemler.length} işlem bulundu`,
                                          d.aksesuarlar?.length && `Aksesuarlar: ${d.aksesuarlar.join(', ')}`,
                                        ].filter(Boolean).join(' | ');
                                        addToast('success', `✅ ${bilgiStr}`);
                                        // İşlem sırasını kaydet
                                        if (d.islemler?.length) {
                                          await fetch('/api/model-operasyonlar', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              model_id: model.id,
                                              islemler: d.islemler.map((op, i) => ({
                                                sira_no: op.sira || i + 1,
                                                islem_adi: op.islem_adi,
                                                makine_tipi: op.makine || '',
                                                zorluk_derecesi: op.zorluk || 3
                                              }))
                                            })
                                          });
                                          addToast('success', `🧵 ${d.islemler.length} işlem "Dikim İşlem Sırası" sekmesine kaydedildi`);
                                        }
                                      } else {
                                        addToast('error', '❌ Okuma başarısız: ' + (data.error || 'Bilinmeyen hata'));
                                      }
                                    } catch (err) {
                                      addToast('error', '❌ ' + err.message);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                  e.target.value = '';
                                }}
                              />
                              📄 Teknik Föy Fotoğrafı Seç
                            </label>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingTop: '10px' }}>
                              JPG / PNG — Firma tarafından gelen ölçü ve işlem tablosunun fotoğrafı
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>

                          {[

                            { label: 'Model Kodu', value: model.code, icon: '📋️' },

                            { label: 'Müşteri', value: model.customer, icon: '📋' },

                            { label: 'Kumaş Tipi', value: model.fabric_type, icon: '🧵' },

                            { label: 'Beden Aralığı', value: model.size_range, icon: '📏' },

                            { label: 'Renk Sayısı', value: model.color_count, icon: '📋' },

                            { label: 'Beden Sayısı', value: model.size_count, icon: '📏' },

                            { label: 'Parça Sayısı', value: model.piece_count, icon: '📋' },

                            { label: 'Toplam İşlem', value: model.operation_count || model.total_operations, icon: '⚙️' },

                            { label: 'Astar', value: model.has_lining ? `Var (${model.lining_pieces || 0} parça)` : 'Yok', icon: '🪡' },

                            { label: 'Tela', value: model.has_interlining ? 'Var' : 'Yok', icon: '📋' },

                            { label: 'Asorti', value: model.asorti, icon: '📦' },

                            { label: 'Durum', value: model.status, icon: '📊' },

                          ].map((item, i) => (

                            <div key={i} style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>

                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>{item.icon} {item.label}</div>

                              <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.value || '—'}</div>

                            </div>

                          ))}

                        </div>

                        {model.difficult_points && (

                          <div style={{ padding: '12px 16px', background: 'rgba(231,76,60,0.1)', borderRadius: '8px', border: '1px solid rgba(231,76,60,0.2)', marginBottom: '12px' }}>

                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--danger)', marginBottom: '4px' }}>⚠️ Zorluk Noktaları</div>

                            <div style={{ fontSize: '13px' }}>{model.difficult_points}</div>

                          </div>

                        )}

                        {model.critical_points && (

                          <div style={{ padding: '12px 16px', background: 'rgba(243,156,18,0.1)', borderRadius: '8px', border: '1px solid rgba(243,156,18,0.2)', marginBottom: '12px' }}>

                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#e67e22', marginBottom: '4px' }}>📋 Kritik Noktalar</div>

                            <div style={{ fontSize: '13px' }}>{model.critical_points}</div>

                          </div>

                        )}

                        {model.customer_requests && (

                          <div style={{ padding: '12px 16px', background: 'rgba(52,152,219,0.1)', borderRadius: '8px', border: '1px solid rgba(52,152,219,0.2)' }}>

                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>📏 Müşteri İstekleri</div>

                            <div style={{ fontSize: '13px' }}>{model.customer_requests}</div>

                          </div>

                        )}

                        {/* ===== MANUEL NOTLAR CRUD ===== */}
                        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(212,168,71,0.05)', borderRadius: '12px', border: '1px solid rgba(212,168,71,0.2)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#D4A847' }}>📝 Manuel Notlar ve Ek Talimatlar</div>
                            <button type="button" onClick={() => setShowNewFoyForm(!showNewFoyForm)} style={{ background: 'rgba(212,168,71,0.15)', border: '1px solid rgba(212,168,71,0.35)', borderRadius: '6px', color: '#D4A847', cursor: 'pointer', fontSize: '12px', padding: '4px 10px', fontWeight: '600' }}>+ Not Ekle</button>
                          </div>

                          {showNewFoyForm && (
                            <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(212,168,71,0.08)', borderRadius: '8px', border: '1px solid rgba(212,168,71,0.2)' }}>
                              <input className="form-input" style={{ fontSize: '12px', marginBottom: '6px' }} placeholder="Not basligini yaz..." value={newFoyNote.title} onChange={e => setNewFoyNote({ ...newFoyNote, title: e.target.value })} />
                              <textarea className="form-textarea" rows={3} style={{ fontSize: '12px', marginBottom: '8px' }} placeholder="Not icerigini yaz..." value={newFoyNote.content} onChange={e => setNewFoyNote({ ...newFoyNote, content: e.target.value })} />
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button type="button" onClick={() => { if (!newFoyNote.title && !newFoyNote.content) return; setFoyNotes([...foyNotes, { ...newFoyNote, id: Date.now() }]); setNewFoyNote({ title: '', content: '' }); setShowNewFoyForm(false); }} style={{ background: 'rgba(46,204,113,0.2)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', padding: '4px 12px', fontWeight: '600' }}>💾 Ekle</button>
                                <button type="button" onClick={() => { setShowNewFoyForm(false); setNewFoyNote({ title: '', content: '' }); }} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: '4px 10px' }}>Iptal</button>
                              </div>
                            </div>
                          )}

                          {foyNotes.length === 0 && !showNewFoyForm && (
                            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>Henuz not eklenmedi. "+ Not Ekle" ile baslayın.</div>
                          )}

                          {foyNotes.map((note, i) => (
                            <div key={note.id || i} style={{ marginBottom: '8px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              {editFoyIdx === i ? (
                                <div>
                                  <input className="form-input" style={{ fontSize: '12px', marginBottom: '6px' }} value={editFoyForm.title} onChange={e => setEditFoyForm({ ...editFoyForm, title: e.target.value })} placeholder="Baslik" />
                                  <textarea className="form-textarea" rows={3} style={{ fontSize: '12px', marginBottom: '8px' }} value={editFoyForm.content} onChange={e => setEditFoyForm({ ...editFoyForm, content: e.target.value })} placeholder="Icerik" />
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button type="button" onClick={() => { const u = [...foyNotes]; u[i] = { ...u[i], ...editFoyForm }; setFoyNotes(u); setEditFoyIdx(null); }} style={{ background: 'rgba(46,204,113,0.2)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', padding: '3px 10px', fontWeight: '600' }}>💾 Kaydet</button>
                                    <button type="button" onClick={() => setEditFoyIdx(null)} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: '3px 10px' }}>Iptal</button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#D4A847', marginBottom: '4px' }}>{note.title || 'Not ' + (i + 1)}</div>
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                      <button type="button" onClick={() => { setEditFoyForm({ title: note.title || '', content: note.content || '' }); setEditFoyIdx(i); }} style={{ background: 'rgba(212,168,71,0.15)', border: 'none', borderRadius: '4px', color: '#D4A847', cursor: 'pointer', fontSize: '11px', padding: '2px 7px' }}>✏️</button>
                                      <button type="button" onClick={() => { if (confirm('Bu notu sil?')) setFoyNotes(foyNotes.filter((_, j) => j !== i)); }} style={{ background: 'rgba(231,76,60,0.1)', border: 'none', borderRadius: '4px', color: '#e74c3c', cursor: 'pointer', fontSize: '11px', padding: '2px 7px' }}>🗑️</button>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{note.content}</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                      </div>

                    )}



                    {/* ===== ETİKET & YIKAMA TAB ===== */}

                    {detailTab === 'etiket' && (

                      <div style={{ padding: '20px' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>📋 Etiket &amp; Yikama Talimati</h4>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button type="button" onClick={() => handleSaveTabInfo(model.id, 'label_info', accessoryInfo)} style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.35)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '12px', padding: '5px 12px', fontWeight: '600' }}>💾 Kaydet</button>
                            <button type="button" onClick={() => { if (confirm('Etiket bilgilerini sifirla?')) setAccessoryInfo(p => ({ ...p, packaging_notes: '', ironing_notes: '' })); }} style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: '6px', color: '#e74c3c', cursor: 'pointer', fontSize: '12px', padding: '5px 10px' }}>↺ Temizle</button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

                          <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>

                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>📋️ MARKA ETİKETİ</div>

                            <input className="form-input" placeholder="Etiket açıklaması (örn: Dokuma etiket, 3x1 cm)" style={{ marginBottom: '8px', fontSize: '12px' }} value={labelInfo.brand_label} onChange={e => setLabelInfo({ ...labelInfo, brand_label: e.target.value })} />

                            <select className="form-select" style={{ fontSize: '12px' }} value={labelInfo.brand_label_pos} onChange={e => setLabelInfo({ ...labelInfo, brand_label_pos: e.target.value })}>{labelPositions.map(p => <option key={p} value={p}>{p}</option>)}</select>

                          </div>

                          <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>

                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>📏 BEDEN ETİKETİ</div>

                            <input className="form-input" placeholder="Beden etiketi bilgisi" style={{ marginBottom: '8px', fontSize: '12px' }} value={labelInfo.size_label} onChange={e => setLabelInfo({ ...labelInfo, size_label: e.target.value })} />

                            <select className="form-select" style={{ fontSize: '12px' }} value={labelInfo.size_label_pos} onChange={e => setLabelInfo({ ...labelInfo, size_label_pos: e.target.value })}>{labelPositions.map(p => <option key={p} value={p}>{p}</option>)}</select>

                          </div>

                          <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>

                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>📋 YIKAMA TALİMATI ETİKETİ</div>

                            <input className="form-input" placeholder="Yıkama talimatı etiketi bilgisi" style={{ marginBottom: '8px', fontSize: '12px' }} value={labelInfo.care_label} onChange={e => setLabelInfo({ ...labelInfo, care_label: e.target.value })} />

                            <select className="form-select" style={{ fontSize: '12px' }} value={labelInfo.care_label_pos} onChange={e => setLabelInfo({ ...labelInfo, care_label_pos: e.target.value })}>{labelPositions.map(p => <option key={p} value={p}>{p}</option>)}</select>

                          </div>

                          <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>

                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>📏 İÇERİK / MENŞE ETİKETİ</div>

                            <input className="form-input" placeholder="İçerik etiket bilgisi (örn: %100 Pamuk)" style={{ marginBottom: '8px', fontSize: '12px' }} value={labelInfo.content_label} onChange={e => setLabelInfo({ ...labelInfo, content_label: e.target.value })} />

                            <select className="form-select" style={{ fontSize: '12px' }} value={labelInfo.content_label_pos} onChange={e => setLabelInfo({ ...labelInfo, content_label_pos: e.target.value })}>{labelPositions.map(p => <option key={p} value={p}>{p}</option>)}</select>

                          </div>

                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

                          <div className="form-group"><label className="form-label">Askı Kartı (Hangtag)</label><input className="form-input" placeholder="Askı kartı bilgileri" value={labelInfo.hangtag} onChange={e => setLabelInfo({ ...labelInfo, hangtag: e.target.value })} /></div>

                          <div className="form-group"><label className="form-label">Barkod Etiketi</label><input className="form-input" placeholder="Barkod bilgileri" value={labelInfo.barcode} onChange={e => setLabelInfo({ ...labelInfo, barcode: e.target.value })} /></div>

                        </div>

                        <div style={{ marginBottom: '16px' }}>

                          <label className="form-label">Yıkama Talimatı İkonları</label>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>

                            {washIcons.map(wi => {

                              const sel = labelInfo.wash_icons.includes(wi.id);

                              return (<button key={wi.id} type="button" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', border: sel ? '2px solid var(--accent)' : '2px solid var(--border-color)', background: sel ? 'var(--accent-soft)' : 'var(--bg-input)', color: sel ? 'var(--accent)' : 'var(--text-secondary)' }}

                                onClick={() => { const next = sel ? labelInfo.wash_icons.filter(x => x !== wi.id) : [...labelInfo.wash_icons, wi.id]; setLabelInfo({ ...labelInfo, wash_icons: next }); }}

                              >{wi.icon} {wi.label}</button>);

                            })}

                          </div>

                        </div>

                        <div className="form-group"><label className="form-label">Etiket ile İlgili Özel Notlar</label><textarea className="form-textarea" placeholder="Etiketleme ile ilgili özel talimatlar..." value={labelInfo.special_label_notes} onChange={e => setLabelInfo({ ...labelInfo, special_label_notes: e.target.value })} /></div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" onClick={() => handleSaveTabInfo(model.id, 'label_info', labelInfo)} style={{ padding: '12px 32px', fontSize: '15px', fontWeight: '700', borderRadius: '10px' }}>💾 Etiket Bilgilerini Kaydet</button>
                        </div>

                      </div>

                    )}



                    {/* ===== İŞLEMLER TAB ===== */}

                    {detailTab === 'islemler' && (

                      <div style={{ padding: '20px' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>

                          <h4 style={{ fontSize: '15px', fontWeight: '700' }}>🧵 Dikim İşlem Sırası & Yapılış Şekli</h4>

                          <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setShowOperationModal(model.id); }}>➕ İşlem Ekle</button>

                        </div>

                        {/* 🎙️ SESLİ HIZLI EKLEME */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(46,204,113,0.08), rgba(39,174,96,0.04))',
                          border: '1px solid rgba(46,204,113,0.25)',
                          borderRadius: '10px', padding: '12px', marginBottom: '14px'
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#2ecc71', marginBottom: '8px' }}>
                            🎙️ Sesli Hızlı İşlem Ekleme — Modelci konuşsun, işlem listeye girersin
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              id={`voice-islem-${model.id}`}
                              type="text"
                              placeholder='Örnek: "Yaka çatımı — Overlok — zorluk 3"'
                              style={{
                                flex: 1, minWidth: '200px', padding: '8px 12px',
                                background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                                borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)'
                              }}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  const val = e.target.value.trim();
                                  const ops = modelOperations[model.id] || [];
                                  try {
                                    await fetch(`/api/models/${model.id}/operations`, {
                                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ name: val, order_number: ops.length + 1, difficulty: 3 })
                                    });
                                    await loadOperations(model.id);
                                    e.target.value = '';
                                    addToast('success', `✅ "${val}" eklendi`);
                                  } catch (err) { addToast('error', err.message); }
                                }
                              }}
                            />
                            <button
                              style={{
                                padding: '8px 12px', borderRadius: '8px', border: 'none',
                                background: 'rgba(46,204,113,0.2)', color: '#2ecc71',
                                cursor: 'pointer', fontSize: '18px', fontWeight: '700'
                              }}
                              onClick={() => {
                                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                                if (!SR) { addToast('error', 'Chrome/Edge kullanın'); return; }
                                const rec = new SR(); rec.lang = 'tr-TR'; rec.start();
                                addToast('info', '🎙️ Dinliyor...');
                                rec.onresult = (ev) => {
                                  const text = ev.results[0][0].transcript;
                                  const inp = document.getElementById(`voice-islem-${model.id}`);
                                  if (inp) inp.value = text;
                                };
                                rec.onerror = () => addToast('error', 'Ses alınamadı');
                              }}
                              title="Sesle söyle"
                            >🎤</button>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Enter ile ekle veya 🎤 basıp söyle
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', padding: '10px', background: 'rgba(39,174,96,0.06)', borderRadius: '8px', border: '1px solid rgba(39,174,96,0.15)' }}>
                          📌 Her işlem için <strong>makine tipi</strong> (Overlok/Singer/Reçme/Kollu/Çift İğne/Kontöre), <strong>iplik</strong>, <strong>iğne</strong>, <strong>vuruş/cm</strong> ve <strong>nasıl yapılacağını</strong> detaylı belirtin. İmalatçıya inisiyatif bırakmayın.
                        </div>

                        {(modelOperations[model.id] || []).length === 0 ? (

                          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>

                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>⚙️</div>

                            Henüz işlem eklenmedi. "İşlem Ekle" butonuna tıklayın.

                          </div>

                        ) : (

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                            {(modelOperations[model.id] || []).map(op => (

                              <div key={op.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-card)' }}>

                                <div onClick={() => setExpandedOp(expandedOp === op.id ? null : op.id)} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 120px 100px 80px 80px auto', alignItems: 'center', padding: '12px 16px', gap: '12px', background: 'var(--bg-input)', cursor: 'pointer', borderBottom: expandedOp === op.id ? '1px solid var(--border-color)' : 'none' }}>

                                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent)', textAlign: 'center' }}>{op.order_number}</div>

                                  <div>

                                    <div style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                                      {op.name}

                                      {op.video_path && <span title="Video mevcut" style={{ fontSize: '12px' }}>📋</span>}

                                      {op.audio_path && <span title="Ses kaydı mevcut" style={{ fontSize: '12px' }}>🔊</span>}

                                      {op.how_to_do && <span title="Yazılı talimat mevcut" style={{ fontSize: '12px' }}>📏</span>}

                                    </div>

                                    {op.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{op.description}</div>}

                                  </div>

                                  <div style={{ fontSize: '12px' }}><span style={{ color: 'var(--text-muted)' }}>Makine:</span><br /><strong>{op.machine_type || '—'}</strong></div>

                                  <div><DifficultyBar level={op.difficulty} /></div>

                                  <div style={{ fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>{op.standard_time_min && op.standard_time_max ? `${op.standard_time_min}–${op.standard_time_max} sn` : '—'}</div>

                                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', textAlign: 'center' }}>{op.unit_price ? `${op.unit_price.toFixed(2)} ₺` : '—'}</div>

                                  {/* B2+B3+B4: İşlem Düzenle/Sil/Sıra Değiştir */}
                                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <button onClick={() => handleMoveOperation(model.id, op.id, 'up')} title="Yukarı taşı" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px', opacity: op.order_number <= 1 ? 0.3 : 1 }} disabled={op.order_number <= 1}>↑</button>
                                    <button onClick={() => handleMoveOperation(model.id, op.id, 'down')} title="Aşağı taşı" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px', opacity: op.order_number >= (modelOperations[model.id] || []).length ? 0.3 : 1 }} disabled={op.order_number >= (modelOperations[model.id] || []).length}>↓</button>
                                    <button onClick={() => openEditOp(op)} title="Düzenle" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px' }}>✏️</button>
                                    <button onClick={() => handleDeleteOp(model.id, op.id)} title="Sil" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px', color: 'var(--danger)' }}>🗑️</button>
                                  </div>

                                </div>

                                {expandedOp === op.id && (

                                  <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>

                                    {/* ── MEDYA YÖNETİMİ ── */}
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>🎬 İlk Ürün Medya Kayıtları</div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>

                                      {/* VIDEO */}
                                      <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>📹 İşlem Videosu</div>
                                        {op.video_path ? (
                                          <div>
                                            <video controls style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', background: '#000', marginBottom: '6px' }}><source src={op.video_path} /></video>
                                            <button onClick={() => handleSaveOpDetails(model.id, op.id, { video_path: null })} className="btn btn-sm" style={{ fontSize: '10px', color: 'var(--danger)' }}>🗑️ Videoyu Kaldır</button>
                                          </div>
                                        ) : (
                                          <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>İşlemin nasıl yapıldığını gösteren video yükleyin</div>
                                            <input type="file" accept="video/*" onChange={e => handleUploadMedia(model.id, op.id, e.target.files[0], 'videos')} style={{ fontSize: '11px', width: '100%' }} />
                                          </div>
                                        )}
                                      </div>

                                      {/* SES */}
                                      <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>🎤 Sesli Anlatım</div>
                                        {op.audio_path ? (
                                          <div>
                                            <audio controls style={{ width: '100%', marginBottom: '6px' }}><source src={op.audio_path} /></audio>
                                            <button onClick={() => handleSaveOpDetails(model.id, op.id, { audio_path: null })} className="btn btn-sm" style={{ fontSize: '10px', color: 'var(--danger)' }}>🗑️ Sesi Kaldır</button>
                                          </div>
                                        ) : (
                                          <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>İşlemin sesli anlatımını yükleyin</div>
                                            <input type="file" accept="audio/*" onChange={e => handleUploadMedia(model.id, op.id, e.target.files[0], 'audios')} style={{ fontSize: '11px', width: '100%' }} />
                                          </div>
                                        )}
                                      </div>

                                      {/* DOĞRU FOTOĞRAF */}
                                      <div style={{ padding: '12px', background: 'rgba(39,174,96,0.05)', borderRadius: 'var(--radius-md)', border: '2px solid rgba(39,174,96,0.3)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#27ae60', marginBottom: '8px' }}>✅ Doğru Görünüş</div>
                                        {op.correct_photo_path ? (
                                          <div>
                                            <img src={op.correct_photo_path} alt="Doğru" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '6px', marginBottom: '6px', background: '#fff' }} />
                                            <button onClick={() => handleSaveOpDetails(model.id, op.id, { correct_photo_path: null })} className="btn btn-sm" style={{ fontSize: '10px', color: 'var(--danger)' }}>🗑️ Kaldır</button>
                                          </div>
                                        ) : (
                                          <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>İşlemin DOĞRU yapılmış halinin fotoğrafı</div>
                                            <input type="file" accept="image/*" onChange={e => handleUploadMedia(model.id, op.id, e.target.files[0], 'correct_photos')} style={{ fontSize: '11px', width: '100%' }} />
                                          </div>
                                        )}
                                      </div>

                                      {/* YANLIŞ FOTOĞRAF */}
                                      <div style={{ padding: '12px', background: 'rgba(231,76,60,0.05)', borderRadius: 'var(--radius-md)', border: '2px solid rgba(231,76,60,0.3)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#e74c3c', marginBottom: '8px' }}>❌ Yanlış Görünüş</div>
                                        {op.incorrect_photo_path ? (
                                          <div>
                                            <img src={op.incorrect_photo_path} alt="Yanlış" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '6px', marginBottom: '6px', background: '#fff' }} />
                                            <button onClick={() => handleSaveOpDetails(model.id, op.id, { incorrect_photo_path: null })} className="btn btn-sm" style={{ fontSize: '10px', color: 'var(--danger)' }}>🗑️ Kaldır</button>
                                          </div>
                                        ) : (
                                          <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>İşlemin YANLIŞ yapılmış halinin fotoğrafı</div>
                                            <input type="file" accept="image/*" onChange={e => handleUploadMedia(model.id, op.id, e.target.files[0], 'incorrect_photos')} style={{ fontSize: '11px', width: '100%' }} />
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* ── YAZILI TALİMATLAR ── */}
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>📝 Yazılı Talimatlar & Detaylar</div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                      <div style={{ fontSize: '12px' }}><span style={{ color: 'var(--text-muted)' }}>🧵 İplik:</span> <strong>{op.thread_material || '—'}</strong></div>
                                      <div style={{ fontSize: '12px' }}><span style={{ color: 'var(--text-muted)' }}>🪡 İğne:</span> <strong>{op.needle_type || '—'}</strong></div>
                                      <div style={{ fontSize: '12px' }}><span style={{ color: 'var(--text-muted)' }}>📏 Adım:</span> <strong>{op.stitch_per_cm || '—'} vuruş/cm</strong></div>
                                    </div>

                                    {op.how_to_do && (
                                      <div style={{ fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)', marginBottom: '8px' }}>{op.how_to_do}</div>
                                    )}

                                    {op.optical_appearance && (
                                      <div style={{ fontSize: '12px', padding: '8px 12px', background: 'rgba(52,152,219,0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #3498db', marginBottom: '8px' }}><strong>👁️ Optik Görünüş:</strong> {op.optical_appearance}</div>
                                    )}

                                    {op.quality_notes && (
                                      <div style={{ fontSize: '12px', padding: '8px 12px', background: 'rgba(255,193,7,0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--warning)' }}><strong>⚠️ Kalite:</strong> {op.quality_notes}</div>
                                    )}

                                  </div>

                                )}

                              </div>

                            ))}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '700' }}>

                              <span>Toplam İşlem: {(modelOperations[model.id] || []).length}</span>

                              <span style={{ color: 'var(--accent)' }}>Toplam Fiyat: {(modelOperations[model.id] || []).reduce((s, o) => s + (o.unit_price || 0), 0).toFixed(2)} ₺</span>

                            </div>

                          </div>

                        )}

                      </div>

                    )}




                    {/* ===== BOM — MALZEME LİSTESİ TAB ===== */}
                    {detailTab === 'bom' && (
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700' }}>📦 BOM — Malzeme Listesi ({model.name})</h4>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Toplam {bomRows.length} malzeme | Toplam: {bomRows.reduce((s, r) => s + (parseFloat(r.miktar || 0) * parseFloat(r.birim_fiyat || 0)), 0).toFixed(2)} ₺</div>
                        </div>

                        {/* YENİ SATIR EKLEME FORMU */}
                        <div style={{ padding: '14px', background: 'rgba(52,152,219,0.05)', borderRadius: '10px', border: '1px solid rgba(52,152,219,0.2)', marginBottom: '16px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#2980b9', marginBottom: '10px' }}>➕ Yeni Malzeme Ekle</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                            <input className="form-input" placeholder="Malzeme Adı *" style={{ fontSize: '12px' }} value={newBomRow.malzeme} onChange={e => setNewBomRow({ ...newBomRow, malzeme: e.target.value })} />
                            <select className="form-select" style={{ fontSize: '12px' }} value={newBomRow.tip} onChange={e => setNewBomRow({ ...newBomRow, tip: e.target.value })}>
                              {['Kumaş', 'Astar', 'Tela', 'İplik', 'Düğme', 'Fermuar', 'Etiket', 'Ambalaj', 'Aksesuarlar', 'Diğer'].map(t => <option key={t}>{t}</option>)}
                            </select>
                            <input className="form-input" placeholder="Renk Kodu" style={{ fontSize: '12px' }} value={newBomRow.renk_kodu} onChange={e => setNewBomRow({ ...newBomRow, renk_kodu: e.target.value })} />
                            <input className="form-input" placeholder="Gramaj (g/m²)" style={{ fontSize: '12px' }} value={newBomRow.gramaj} onChange={e => setNewBomRow({ ...newBomRow, gramaj: e.target.value })} />
                            <input className="form-input" placeholder="Tedarikçi" style={{ fontSize: '12px' }} value={newBomRow.tedarikci} onChange={e => setNewBomRow({ ...newBomRow, tedarikci: e.target.value })} />
                            <input className="form-input" placeholder="Miktar" type="number" style={{ fontSize: '12px' }} value={newBomRow.miktar} onChange={e => setNewBomRow({ ...newBomRow, miktar: e.target.value })} />
                            <input className="form-input" placeholder="Birim Fiyat ₺" type="number" style={{ fontSize: '12px' }} value={newBomRow.birim_fiyat} onChange={e => setNewBomRow({ ...newBomRow, birim_fiyat: e.target.value })} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '6px' }}>
                            <input className="form-input" placeholder="Not / Açıklama" style={{ fontSize: '12px' }} value={newBomRow.notlar} onChange={e => setNewBomRow({ ...newBomRow, notlar: e.target.value })} />
                            <select className="form-select" style={{ fontSize: '12px' }} value={newBomRow.birim} onChange={e => setNewBomRow({ ...newBomRow, birim: e.target.value })}>
                              {['metre', 'kg', 'adet', 'top', 'rulo', 'gram'].map(b => <option key={b}>{b}</option>)}
                            </select>
                            <button className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 20px' }} onClick={() => {
                              if (!newBomRow.malzeme) { alert('Malzeme adı zorunlu!'); return; }
                              setBomRows([...bomRows, { ...newBomRow, id: Date.now() }]);
                              setNewBomRow({ malzeme: '', tip: 'Kumaş', renk_kodu: '', gramaj: '', tedarikci: '', birim: 'metre', miktar: '', birim_fiyat: '', notlar: '' });
                            }}>➕ Ekle</button>
                          </div>
                        </div>

                        {/* BOM TABLOSU */}
                        {bomRows.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                            📦 Henüz malzeme eklenmedi. Yukarıdan ekleyin.
                          </div>
                        ) : (
                          <div className="table-wrapper">
                            <table className="table" style={{ fontSize: '12px' }}>
                              <thead>
                                <tr>
                                  <th style={{ background: 'var(--accent)', color: '#fff' }}>#</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff' }}>Malzeme</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff' }}>Tip</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff' }}>Renk Kodu</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff' }}>Gramaj</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff' }}>Tedarikçi</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff', textAlign: 'center' }}>Miktar</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff', textAlign: 'center' }}>Birim</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff', textAlign: 'right' }}>Birim Fiyat</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff', textAlign: 'right' }}>Toplam</th>
                                  <th style={{ background: 'var(--accent)', color: '#fff' }}>Not</th>
                                  <th style={{ background: '#e74c3c', color: '#fff' }}>İşlem</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bomRows.map((row, idx) => (
                                  <tr key={row.id || idx} style={{ background: idx % 2 === 0 ? 'var(--bg-input)' : 'transparent' }}>
                                    {editBomIdx === idx ? (
                                      <>
                                        <td>{idx + 1}</td>
                                        <td><input className="form-input" style={{ fontSize: '11px', padding: '3px 6px' }} value={editBomRow.malzeme} onChange={e => setEditBomRow({ ...editBomRow, malzeme: e.target.value })} /></td>
                                        <td><select className="form-select" style={{ fontSize: '11px', padding: '3px' }} value={editBomRow.tip} onChange={e => setEditBomRow({ ...editBomRow, tip: e.target.value })}>
                                          {['Kumaş', 'Astar', 'Tela', 'İplik', 'Düğme', 'Fermuar', 'Etiket', 'Ambalaj', 'Aksesuarlar', 'Diğer'].map(t => <option key={t}>{t}</option>)}
                                        </select></td>
                                        <td><input className="form-input" style={{ fontSize: '11px', padding: '3px 6px', width: '80px' }} value={editBomRow.renk_kodu} onChange={e => setEditBomRow({ ...editBomRow, renk_kodu: e.target.value })} /></td>
                                        <td><input className="form-input" style={{ fontSize: '11px', padding: '3px 6px', width: '70px' }} value={editBomRow.gramaj} onChange={e => setEditBomRow({ ...editBomRow, gramaj: e.target.value })} /></td>
                                        <td><input className="form-input" style={{ fontSize: '11px', padding: '3px 6px' }} value={editBomRow.tedarikci} onChange={e => setEditBomRow({ ...editBomRow, tedarikci: e.target.value })} /></td>
                                        <td><input className="form-input" type="number" style={{ fontSize: '11px', padding: '3px 6px', width: '60px' }} value={editBomRow.miktar} onChange={e => setEditBomRow({ ...editBomRow, miktar: e.target.value })} /></td>
                                        <td><select className="form-select" style={{ fontSize: '11px' }} value={editBomRow.birim} onChange={e => setEditBomRow({ ...editBomRow, birim: e.target.value })}>
                                          {['metre', 'kg', 'adet', 'top', 'rulo', 'gram'].map(b => <option key={b}>{b}</option>)}
                                        </select></td>
                                        <td><input className="form-input" type="number" style={{ fontSize: '11px', padding: '3px 6px', width: '70px' }} value={editBomRow.birim_fiyat} onChange={e => setEditBomRow({ ...editBomRow, birim_fiyat: e.target.value })} /></td>
                                        <td style={{ textAlign: 'right', fontWeight: '700' }}>{((editBomRow.miktar || 0) * (editBomRow.birim_fiyat || 0)).toFixed(2)} ₺</td>
                                        <td><input className="form-input" style={{ fontSize: '11px', padding: '3px 6px' }} value={editBomRow.notlar} onChange={e => setEditBomRow({ ...editBomRow, notlar: e.target.value })} /></td>
                                        <td style={{ display: 'flex', gap: '4px' }}>
                                          <button className="btn btn-success btn-sm" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => { const n = [...bomRows]; n[idx] = { ...editBomRow, id: row.id }; setBomRows(n); setEditBomIdx(null); }}>💾</button>
                                          <button className="btn btn-sm" style={{ fontSize: '11px', padding: '3px 8px', background: 'var(--bg-input)' }} onClick={() => setEditBomIdx(null)}>✕</button>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td style={{ fontWeight: '700' }}>{idx + 1}</td>
                                        <td style={{ fontWeight: '600' }}>{row.malzeme}</td>
                                        <td><span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(52,152,219,0.1)', color: '#2980b9', fontSize: '11px' }}>{row.tip}</span></td>
                                        <td>{row.renk_kodu && <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f1f3f4', fontSize: '11px', fontFamily: 'monospace' }}>{row.renk_kodu}</span>}</td>
                                        <td>{row.gramaj && `${row.gramaj} g/m²`}</td>
                                        <td>{row.tedarikci}</td>
                                        <td style={{ textAlign: 'center', fontWeight: '700' }}>{row.miktar}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{row.birim}</td>
                                        <td style={{ textAlign: 'right' }}>{row.birim_fiyat && `${parseFloat(row.birim_fiyat).toFixed(2)} ₺`}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#27ae60' }}>{((row.miktar || 0) * (row.birim_fiyat || 0) > 0) ? `${((row.miktar || 0) * (row.birim_fiyat || 0)).toFixed(2)} ₺` : '—'}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{row.notlar}</td>
                                        <td>
                                          <div style={{ display: 'flex', gap: '4px' }}>
                                            <button style={{ background: 'rgba(52,152,219,0.1)', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px', color: '#2980b9' }} onClick={() => { setEditBomIdx(idx); setEditBomRow({ ...row }); }} title="Düzenle">✏️</button>
                                            <button style={{ background: 'rgba(231,76,60,0.1)', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px', color: '#e74c3c' }} onClick={() => { if (confirm('Bu satırı silmek istiyor musunuz?')) setBomRows(bomRows.filter((_, i) => i !== idx)); }} title="Sil">🗑️</button>
                                          </div>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                                {/* TOPLAM SATIRI */}
                                <tr style={{ background: 'rgba(39,174,96,0.08)', fontWeight: '700' }}>
                                  <td colSpan={9} style={{ textAlign: 'right', fontSize: '13px' }}>💰 TOPLAM MALİYET:</td>
                                  <td style={{ textAlign: 'right', fontSize: '14px', color: '#27ae60' }}>{bomRows.reduce((s, r) => s + (parseFloat(r.miktar || 0) * parseFloat(r.birim_fiyat || 0)), 0).toFixed(2)} ₺</td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" onClick={() => handleSaveTabInfo(model.id, 'bom_data', bomRows)} style={{ padding: '10px 28px', fontWeight: '700' }}>💾 BOM Listesini Kaydet</button>
                        </div>
                      </div>
                    )}

                    {/* ===== ONAY ZİNCİRİ TAB ===== */}
                    {detailTab === 'onay' && (
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700' }}>✅ Onay Zinciri — {model.name}</h4>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input className="form-input" placeholder="🔍 Ara..." value={onayArama} onChange={e => setOnayArama(e.target.value)} style={{ width: '160px', fontSize: '12px' }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              ✅ {onayZinciri.filter(o => o.durum === 'Onaylandı').length} / {onayZinciri.length}
                            </span>
                          </div>
                        </div>

                        {/* Açıklama */}
                        <div style={{ padding: '10px 14px', background: 'rgba(52,152,219,0.06)', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#2980b9', border: '1px solid rgba(52,152,219,0.15)' }}>
                          ℹ️ Onay zinciri esnektir. Modelist, Bölüm Şefi, Müdür veya İç Yönetim — dilediğiniz kişiyi ekleyebilir, düzenleyebilir, silebilirsiniz. Onay sırasının şart değildir.
                        </div>

                        {/* YENİ ONAY EKLEME */}
                        <div style={{ padding: '14px', background: 'rgba(39,174,96,0.05)', borderRadius: '10px', border: '1px solid rgba(39,174,96,0.2)', marginBottom: '16px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#27ae60', marginBottom: '10px' }}>➕ Onay Adımı Ekle</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 2fr auto', gap: '8px', alignItems: 'end' }}>
                            <div>
                              <label style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kişi Adı *</label>
                              <input className="form-input" placeholder="örn: Hakan Bey" style={{ fontSize: '12px' }} value={newOnay.kisi} onChange={e => setNewOnay({ ...newOnay, kisi: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ünvan</label>
                              <select className="form-select" style={{ fontSize: '12px' }} value={newOnay.unvan} onChange={e => setNewOnay({ ...newOnay, unvan: e.target.value })}>
                                {['Modelist', 'Bölüm Şefi', 'Üretim Müdürü', 'Genel Müdür', 'İşletme Sahibi', 'Kalite Kontrol', 'Fason Sorumlusu', 'İç Yönetim', 'Müşteri'].map(u => <option key={u}>{u}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Durum</label>
                              <select className="form-select" style={{ fontSize: '12px' }} value={newOnay.durum} onChange={e => setNewOnay({ ...newOnay, durum: e.target.value })}>
                                {['Bekliyor', 'Onaylandı', 'Reddedildi', 'Düzeltme İstedi', 'Bilgi İçin'].map(d => <option key={d}>{d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Not</label>
                              <input className="form-input" placeholder="Onay notu..." style={{ fontSize: '12px' }} value={newOnay.not} onChange={e => setNewOnay({ ...newOnay, not: e.target.value })} />
                            </div>
                            <button className="btn btn-success" style={{ fontSize: '13px', padding: '10px 16px' }} onClick={() => {
                              if (!newOnay.kisi) { alert('Kişi adı zorunlu!'); return; }
                              setOnayZinciri([...onayZinciri, { ...newOnay, id: Date.now(), tarih: new Date().toLocaleDateString('tr-TR') }]);
                              setNewOnay({ kisi: '', unvan: 'Modelist', durum: 'Bekliyor', not: '' });
                            }}>➕ Ekle</button>
                          </div>
                        </div>

                        {/* ONAY ZİNCİRİ LİSTESİ */}
                        {onayZinciri.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                            ✅ Henüz onay adımı eklenmedi.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {onayZinciri
                              .filter(o => !onayArama || o.kisi.toLowerCase().includes(onayArama.toLowerCase()) || o.unvan.toLowerCase().includes(onayArama.toLowerCase()))
                              .map((onay, idx) => {
                                const durumRenk = { 'Onaylandı': '#27ae60', 'Reddedildi': '#e74c3c', 'Bekliyor': '#f39c12', 'Düzeltme İstedi': '#e67e22', 'Bilgi İçin': '#3498db' };
                                const durumBg = { 'Onaylandı': 'rgba(39,174,96,0.1)', 'Reddedildi': 'rgba(231,76,60,0.1)', 'Bekliyor': 'rgba(243,156,18,0.1)', 'Düzeltme İstedi': 'rgba(230,126,34,0.1)', 'Bilgi İçin': 'rgba(52,152,219,0.1)' };
                                const renk = durumRenk[onay.durum] || '#95a5a6';
                                const bg = durumBg[onay.durum] || 'rgba(149,165,166,0.1)';
                                return (
                                  <div key={onay.id || idx} style={{ padding: '12px 16px', background: bg, borderRadius: '10px', border: `1px solid ${renk}30`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {editOnayIdx === idx ? (
                                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 2fr auto', gap: '8px' }}>
                                        <input className="form-input" style={{ fontSize: '12px' }} value={editOnayRow.kisi} onChange={e => setEditOnayRow({ ...editOnayRow, kisi: e.target.value })} />
                                        <select className="form-select" style={{ fontSize: '12px' }} value={editOnayRow.unvan} onChange={e => setEditOnayRow({ ...editOnayRow, unvan: e.target.value })}>
                                          {['Modelist', 'Bölüm Şefi', 'Üretim Müdürü', 'Genel Müdür', 'İşletme Sahibi', 'Kalite Kontrol', 'Fason Sorumlusu', 'İç Yönetim', 'Müşteri'].map(u => <option key={u}>{u}</option>)}
                                        </select>
                                        <select className="form-select" style={{ fontSize: '12px' }} value={editOnayRow.durum} onChange={e => setEditOnayRow({ ...editOnayRow, durum: e.target.value })}>
                                          {['Bekliyor', 'Onaylandı', 'Reddedildi', 'Düzeltme İstedi', 'Bilgi İçin'].map(d => <option key={d}>{d}</option>)}
                                        </select>
                                        <input className="form-input" style={{ fontSize: '12px' }} value={editOnayRow.not} onChange={e => setEditOnayRow({ ...editOnayRow, not: e.target.value })} />
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          <button className="btn btn-success btn-sm" style={{ fontSize: '11px' }} onClick={() => { const n = [...onayZinciri]; n[idx] = { ...editOnayRow, id: onay.id }; setOnayZinciri(n); setEditOnayIdx(null); }}>💾</button>
                                          <button className="btn btn-sm" style={{ fontSize: '11px', background: 'var(--bg-input)' }} onClick={() => setEditOnayIdx(null)}>✕</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: renk, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>
                                          {idx + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: '700', fontSize: '14px' }}>{onay.kisi}</div>
                                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{onay.unvan} {onay.tarih && `· ${onay.tarih}`}</div>
                                          {onay.not && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>"{onay.not}"</div>}
                                        </div>
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', background: renk, color: '#fff', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{onay.durum}</span>
                                        {/* EYLEM BUTONLARI */}
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                          <button style={{ background: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: '#27ae60' }}
                                            onClick={() => { const n = [...onayZinciri]; n[idx] = { ...n[idx], durum: 'Onaylandı' }; setOnayZinciri(n); addToast('success', `✅ ${onay.kisi} onayladı`); }} title="İzin Ver / Onayla">✅ Onayla</button>
                                          <button style={{ background: 'rgba(52,152,219,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: '#2980b9' }}
                                            onClick={() => { setEditOnayIdx(idx); setEditOnayRow({ ...onay }); }} title="Düzenle">✏️</button>
                                          <button style={{ background: 'rgba(231,76,60,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: '#e74c3c' }}
                                            onClick={() => { if (confirm(`"${onay.kisi}" onay adımını silmek istiyor musunuz?`)) setOnayZinciri(onayZinciri.filter((_, i) => i !== idx)); }} title="Sil">🗑️</button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button className="btn btn-primary" onClick={() => handleSaveTabInfo(model.id, 'approval_chain', onayZinciri)} style={{ padding: '10px 28px', fontWeight: '700' }}>💾 Onay Zincirini Kaydet</button>
                        </div>
                      </div>
                    )}

                    {/* ===== SES NOTU TAB ===== */}

                    {detailTab === 'sesnotu' && (

                      <div style={{ padding: '20px' }}>

                        <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>📋 Ses Notu — Sesi Yazıya Dök</h4>

                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Mikrofon butonuna basarak konuşmaya başlayın. Konuşmanız otomatik olarak yazıya dönüştürülecektir. Tarayıcınız mikrofon izni isteyecektir.</p>

                        <SpeechToText />

                      </div>

                    )}


                  </div>

                )}

              </div>

            ))}

          </div>

        )}

      </div>

      {showNewModal && (<NewModelModal onClose={() => setShowNewModal(false)} onSave={handleSaveModel} />)}

      {showOperationModal && (<NewOperationModal modelId={showOperationModal} operationCount={(modelOperations[showOperationModal] || []).length} onClose={() => setShowOperationModal(null)} onSave={(data) => handleSaveOperation(showOperationModal, data)} />)}

      {/* ===== İŞLEM DÜZENLEME MODALI ===== */}
      {editingOp && (
        <div className="modal-overlay" onClick={() => setEditingOp(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ İşlem Düzenle</h2>
              <button className="modal-close" onClick={() => setEditingOp(null)}>✕</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>İşlem Adı</label>
                <input className="form-input" value={editOpForm.name} onChange={e => setEditOpForm({ ...editOpForm, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Makine Tipi</label>
                  <select className="form-select" value={editOpForm.machine_type} onChange={e => setEditOpForm({ ...editOpForm, machine_type: e.target.value })}>
                    <option value="">Seçiniz</option>
                    <option>Düz Dikiş</option><option>Overlok</option><option>Reçme</option><option>Baskı</option><option>Ütü</option><option>Kesim</option><option>El İşi</option><option>Nakış</option><option>Diğer</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Zorluk (1-10)</label>
                  <input className="form-input" type="number" min={1} max={10} value={editOpForm.difficulty} onChange={e => setEditOpForm({ ...editOpForm, difficulty: parseInt(e.target.value) || 5 })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Birim Fiyat (₺)</label>
                <input className="form-input" type="number" step="0.01" min={0} value={editOpForm.unit_price} onChange={e => setEditOpForm({ ...editOpForm, unit_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Açıklama</label>
                <textarea className="form-textarea" rows={2} value={editOpForm.description} onChange={e => setEditOpForm({ ...editOpForm, description: e.target.value })} placeholder="İşlem hakkında not..." />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn" onClick={() => setEditingOp(null)} style={{ padding: '10px 24px' }}>İptal</button>
                <button className="btn btn-primary" onClick={() => handleSaveEditOp(expandedModel)} style={{ padding: '10px 24px' }}>💾 Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DÜZENLEME MODALI ===== */}

      {editModel && (
        <div className="modal-overlay" onClick={() => setEditModel(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "980px", maxHeight: "94vh", overflowY: "auto" }}>
            <div style={{ padding: "14px 22px", background: "linear-gradient(135deg,#1a2e1a,#2c3e2d)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid rgba(212,168,71,0.45)" }}>
              <div>
                <div style={{ fontSize: "17px", fontWeight: "800", color: "#fff" }}>&#x270F;&#xFE0F; Model Düzenle &mdash; <span style={{ color: "#D4A847" }}>{editModel.name}</span></div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>{editForm.customer || ""}  {editModel.code}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ textAlign: "right", background: "rgba(212,168,71,0.15)", border: "1px solid rgba(212,168,71,0.35)", borderRadius: "10px", padding: "7px 14px" }}>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Düzenleme Tarihi</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#D4A847", marginTop: "2px" }}>&#x1F4C5; {new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <button onClick={() => setEditModel(null)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: "32px", height: "32px", color: "#fff", cursor: "pointer", fontSize: "16px" }}>&#x2715;</button>
              </div>
            </div>
            <div style={{ padding: "6px 16px", background: "rgba(243,156,18,0.1)", fontSize: "12px", color: "#f39c12", fontWeight: "600" }}>
              &#x26A0;&#xFE0F; Yapilan tüm degisiklikler tarih/saat ile kalici olarak kayit altina alinir.
            </div>
            <form onSubmit={handleUpdateModel}>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>

                {/* FOTOGRAF BOYUNA */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {[{ side: "front", label: "ON GORSEL", field: "front_image" }, { side: "back", label: "ARKA GORSEL", field: "back_image" }].map(({ side, label, field }) => {
                    const preview = side === "front" ? editFrontPreview : editBackPreview;
                    const currentImg = editForm[field];
                    return (
                      <div key={side} onDrop={e => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) handleEditImageUpload(f, side); }} onDragOver={e => e.preventDefault()}
                        style={{ border: "2px dashed rgba(212,168,71,0.4)", borderRadius: "12px", background: "rgba(212,168,71,0.03)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: "6px 12px", background: "rgba(212,168,71,0.1)", fontSize: "11px", fontWeight: "700", color: "#D4A847", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>&#x1F4F8; {label}</span>
                          {(preview || currentImg) && (<button type="button" onClick={() => { setEditForm(p => ({ ...p, [field]: "" })); if (side === "front") setEditFrontPreview(null); else setEditBackPreview(null); }} style={{ background: "rgba(231,76,60,0.2)", border: "none", borderRadius: "4px", color: "#e74c3c", cursor: "pointer", fontSize: "10px", padding: "2px 7px" }}>x Kaldir</button>)}
                        </div>
                        <div style={{ minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.04)" }}>
                          {(preview || currentImg) ? (<img src={preview || currentImg} alt={label} style={{ width: "100%", height: "300px", objectFit: "contain", display: "block" }} />) : (
                            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}><div style={{ fontSize: "40px", marginBottom: "8px" }}>&#x1F457;</div><div style={{ fontSize: "11px", fontWeight: "600" }}>Sürükle ve Birak</div></div>
                          )}
                        </div>
                        <div style={{ padding: "8px", borderTop: "1px solid rgba(212,168,71,0.15)", display: "flex", gap: "6px" }}>
                          <label style={{ flex: 1, padding: "6px", background: "rgba(212,168,71,0.1)", border: "1px solid rgba(212,168,71,0.25)", borderRadius: "6px", cursor: "pointer", fontSize: "10px", color: "#D4A847", textAlign: "center", fontWeight: "600" }}>
                            &#x1F4C1; Dosyadan<input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleEditImageUpload(f, side); e.target.value = ""; }} />
                          </label>
                          <label style={{ flex: 1, padding: "6px", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.25)", borderRadius: "6px", cursor: "pointer", fontSize: "10px", color: "#2ecc71", textAlign: "center", fontWeight: "600" }}>
                            &#x1F4F7; Kamera<input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleEditImageUpload(f, side); e.target.value = ""; }} />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SATIR 1 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                  {[{ label: "Model Adi *", key: "name", req: true }, { label: "Model Kodu *", key: "code", req: true }, { label: "Siparis Numarasi", key: "order_no" }, { label: "Modelist", key: "modelist" }].map(({ label, key, req }) => (
                    <div key={key}><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>{label}</label>
                      <input className="form-input" style={{ fontSize: "12px" }} value={editForm[key] || ""} required={!!req} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} /></div>
                  ))}
                </div>

                {/* SATIR 2 - Musteri Firma Adi | Kumasin Adi Cinsi | Ürün Kac Pastalda Kesildi | Varyant1 | Varyant2 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Müsteri Firma Adi</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.customer || ""} onChange={e => setEditForm({ ...editForm, customer: e.target.value })} /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Kumasin Adi Cinsi</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.fabric_type || ""} onChange={e => setEditForm({ ...editForm, fabric_type: e.target.value })} /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ürün Kac Pastalda Kesildi</label>
                    <input className="form-input" style={{ fontSize: "12px" }} type="number" value={editForm.op_kesim_count || ""} onChange={e => setEditForm({ ...editForm, op_kesim_count: e.target.value })} placeholder="0" /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Varyant 1</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={(editForm.color_details || "").split("|")[0] || ""} onChange={e => { const p = (editForm.color_details || "").split("|"); p[0] = e.target.value; setEditForm({ ...editForm, color_details: p.join("|") }); }} placeholder="Renk/Model..." /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Varyant 2</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={(editForm.color_details || "").split("|")[1] || ""} onChange={e => { const p = (editForm.color_details || "").split("|"); p[1] = e.target.value; setEditForm({ ...editForm, color_details: p.join("|") }); }} placeholder="Renk/Model..." /></div>
                </div>

                {/* SATIR 3 - Gramaj | Kullanilan Kumas Miktari | Astar | Garni Var/Yok | Tela */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>m2 Gramaji</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.size_range || ""} onChange={e => setEditForm({ ...editForm, size_range: e.target.value })} placeholder="gr/m2" /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Kullanilan Kumas Miktari</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.op_kesim_details || ""} onChange={e => setEditForm({ ...editForm, op_kesim_details: e.target.value })} placeholder="metre" /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Astar</label>
                    <select className="form-select" style={{ fontSize: "12px" }} value={editForm.has_lining || 0} onChange={e => setEditForm({ ...editForm, has_lining: parseInt(e.target.value) })}><option value={0}>Yok</option><option value={1}>Var</option></select></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Garni</label>
                    <select className="form-select" style={{ fontSize: "12px" }} value={editForm.garni || "Yok"} onChange={e => setEditForm({ ...editForm, garni: e.target.value })}><option value="Yok">Yok</option><option value="Var">Var</option></select></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Tela</label>
                    <select className="form-select" style={{ fontSize: "12px" }} value={editForm.has_interlining || 0} onChange={e => setEditForm({ ...editForm, has_interlining: parseInt(e.target.value) })}><option value={0}>Yok</option><option value={1}>Var</option></select></div>
                </div>

                {/* SATIR 4 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Siparis Adeti</label>
                    <input className="form-input" style={{ fontSize: "12px" }} type="number" value={editForm.total_order || 0} onChange={e => setEditForm({ ...editForm, total_order: parseInt(e.target.value) || 0 })} /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Beden (S-M-L-XL)</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.size_count || ""} onChange={e => setEditForm({ ...editForm, size_count: e.target.value })} placeholder="S M L XL" /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Asorti</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.asorti || ""} onChange={e => setEditForm({ ...editForm, asorti: e.target.value })} /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Hangi Renkler</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.size_distribution || ""} onChange={e => setEditForm({ ...editForm, size_distribution: e.target.value })} placeholder="Kirmizi, Mavi..." /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Fason Fiyati (TL)</label>
                    <input className="form-input" style={{ fontSize: "12px" }} type="number" step="0.01" value={editForm.fason_price || 0} onChange={e => setEditForm({ ...editForm, fason_price: parseFloat(e.target.value) || 0 })} /></div>
                </div>

                {/* SATIR 5 - Parca | Makiaci | Makinalar | Ortaci | Ara Ütücü */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ürün Kac Parcadan Olusuyor</label>
                    <input className="form-input" style={{ fontSize: "12px" }} type="number" value={editForm.piece_count || 0} onChange={e => setEditForm({ ...editForm, piece_count: parseInt(e.target.value) || 0 })} /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Kac Makinaci Lazim</label>
                    <input className="form-input" style={{ fontSize: "12px" }} type="number" value={editForm.op_dikim_count || 0} onChange={e => setEditForm({ ...editForm, op_dikim_count: parseInt(e.target.value) || 0 })} /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Hangi Makinalar Lazim</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.piece_count_details || ""} onChange={e => setEditForm({ ...editForm, piece_count_details: e.target.value })} placeholder="Düz, Overlok, Recme..." /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ortaci</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.op_utu_paket_details || ""} onChange={e => setEditForm({ ...editForm, op_utu_paket_details: e.target.value })} placeholder="Kisi adi..." /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ara Ütücü</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.op_nakis_details || ""} onChange={e => setEditForm({ ...editForm, op_nakis_details: e.target.value })} placeholder="Kisi adi..." /></div>
                </div>

                {/* SATIR 6 - Toplam | Uzmanlik Alani Var | Kritik | Ozenle */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Toplam Gereken Personel</label>
                    <input className="form-input" style={{ fontSize: "12px" }} type="number" value={editForm.total_operations || 0} onChange={e => setEditForm({ ...editForm, total_operations: parseInt(e.target.value) || 0 })} /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Kac Uzmanlik Alani Var</label>
                    <input className="form-input" style={{ fontSize: "12px" }} type="number" min="0" value={editForm.model_difficulty ?? 0} onChange={e => setEditForm({ ...editForm, model_difficulty: e.target.value === "" ? 0 : parseInt(e.target.value) || 0 })} /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Kritik Noktalar</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.critical_points || ""} onChange={e => setEditForm({ ...editForm, critical_points: e.target.value })} placeholder="Hassas dikkat noktalari..." /></div>
                  <div><label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ozenle Yapilacak Yer</label>
                    <input className="form-input" style={{ fontSize: "12px" }} value={editForm.difficult_points || ""} onChange={e => setEditForm({ ...editForm, difficult_points: e.target.value })} placeholder="Dikkatle yapilacak bolgeler..." /></div>
                </div>

                {/* OPERASYON LISTESI */}
                <div style={{ border: "1px solid rgba(212,168,71,0.3)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", background: "rgba(212,168,71,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#D4A847" }}>&#x1F9F5; Üretim Sürecinde Sirayla Yapilacak Islemler</div>
                    <button type="button" onClick={() => { let ops = []; try { ops = JSON.parse(editForm.op_dikim_details || "[]"); if (!Array.isArray(ops)) ops = []; } catch { ops = []; } ops.push({ sira: ops.length + 1, islem: "", calisan: "", tip: "" }); setEditForm({ ...editForm, op_dikim_details: JSON.stringify(ops) }); }} style={{ background: "rgba(212,168,71,0.2)", border: "1px solid rgba(212,168,71,0.4)", borderRadius: "6px", color: "#D4A847", cursor: "pointer", fontSize: "12px", padding: "4px 10px", fontWeight: "600" }}>+ Islem Ekle</button>
                  </div>
                  <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto" }}>
                    {(() => {
                      let ops = []; try { ops = JSON.parse(editForm.op_dikim_details || "[]"); if (!Array.isArray(ops)) ops = []; } catch { ops = []; }
                      if (ops.length === 0) return (<div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "12px" }}>Henüz islem eklenmedi.</div>);
                      return ops.map((op, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "34px 1fr 1fr 1fr 28px", gap: "6px", alignItems: "center", background: "var(--bg-input)", borderRadius: "8px", padding: "6px 10px", border: "1px solid var(--border-color)" }}>
                          <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(212,168,71,0.2)", border: "2px solid rgba(212,168,71,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", color: "#D4A847" }}>{String(idx + 1).padStart(2, "0")}</div>
                          <input className="form-input" style={{ fontSize: "12px", margin: 0 }} placeholder="Islem adi" value={op.islem || ""} onChange={e => { let u = [...ops]; u[idx] = { ...u[idx], islem: e.target.value }; setEditForm({ ...editForm, op_dikim_details: JSON.stringify(u) }); }} />
                          <input className="form-input" style={{ fontSize: "12px", margin: 0 }} placeholder="Calisan / Rol" value={op.calisan || ""} onChange={e => { let u = [...ops]; u[idx] = { ...u[idx], calisan: e.target.value }; setEditForm({ ...editForm, op_dikim_details: JSON.stringify(u) }); }} />
                          <input className="form-input" style={{ fontSize: "12px", margin: 0 }} placeholder="Makine / Hiz / Talimat" value={op.tip || ""} onChange={e => { let u = [...ops]; u[idx] = { ...u[idx], tip: e.target.value }; setEditForm({ ...editForm, op_dikim_details: JSON.stringify(u) }); }} />
                          <button type="button" onClick={() => { let u = ops.filter((_, i) => i !== idx); setEditForm({ ...editForm, op_dikim_details: JSON.stringify(u) }); }} style={{ background: "rgba(231,76,60,0.15)", border: "none", borderRadius: "5px", color: "#e74c3c", cursor: "pointer", fontSize: "14px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>&#x2715;</button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* DIKIMDEN SONRA 6 PANEL */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent)", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>&#x2702;&#xFE0F; Dikimden Sonra Yapilacak Islemler</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    {[
                      { key: "ilik_dugme", label: "&#x1F535; Ilik ve Dügme", ph: "Ilik tipi, adet, konumu, dügme cinsi..." },
                      { key: "el_isciligi", label: "&#x1F48E; El Isciligi", ph: "Tas, boncuk, nakis, elle yapilan isler..." },
                      { key: "utu_paket", label: "&#x2668;&#xFE0F; Ütü / Paket / Kalite Kontrol", ph: "Ütü derecesi, katlama sekli, paket tipi..." },
                      { key: "kalite_guvence", label: "&#x2705; Kalite Güvence ve Sevk Okeyi", ph: "Kontrol kriterleri, onaylayan kisi..." },
                      { key: "sevk_noktasi", label: "&#x1F4CD; Sevk Noktasi Neresi", ph: "Müsteri, adres, depo, sehir..." },
                      { key: "sevk_personeli", label: "&#x1F69B; Sevk Personeli", ph: "Kisi adi, arac bilgisi, tarih..." },
                    ].map(({ key, label, ph }) => {
                      let postData = {}; try { postData = JSON.parse(editForm.post_sewing || "{}"); if (typeof postData !== "object" || Array.isArray(postData)) postData = {}; } catch { postData = {}; }
                      return (
                        <div key={key} style={{ border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "hidden", background: "var(--bg-card)" }}>
                          <div style={{ padding: "7px 12px", background: "var(--bg-input)", fontSize: "11px", fontWeight: "700", color: "var(--accent)", borderBottom: "1px solid var(--border-color)" }} dangerouslySetInnerHTML={{ __html: label }} />
                          <textarea style={{ width: "100%", padding: "10px", background: "transparent", border: "none", outline: "none", resize: "vertical", fontSize: "12px", color: "var(--text-primary)", fontFamily: "inherit", minHeight: "78px", boxSizing: "border-box" }}
                            placeholder={ph} value={postData[key] || ""}
                            onChange={e => { const u = { ...postData, [key]: e.target.value }; setEditForm({ ...editForm, post_sewing: JSON.stringify(u) }); }} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GELISMIS OLCU TABLOSU */}
                {(() => {
                  let olcu = {}; try { olcu = JSON.parse(editForm.measurement_table || "{}"); if (Array.isArray(olcu) || typeof olcu !== "object") olcu = {}; } catch { olcu = {}; }
                  const cols = olcu.cols || [{ id: "c1", label: "36 / XS" }, { id: "c2", label: "38 / S" }, { id: "c3", label: "40 / M" }, { id: "c4", label: "42 / L" }, { id: "c5", label: "44 / XL" }];
                  const rows = olcu.rows || [];
                  const save = (newCols, newRows) => setEditForm({ ...editForm, measurement_table: JSON.stringify({ cols: newCols, rows: newRows }) });

                  return (
                    <div style={{ border: "1px solid rgba(52,152,219,0.35)", borderRadius: "12px", overflow: "hidden" }}>
                      <div style={{ padding: "10px 16px", background: "rgba(52,152,219,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#3498db" }}>&#x1F4D0; Ölçü Tablosu</div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button type="button" onClick={() => { const nc = [...cols, { id: "c" + Date.now(), label: "Yeni Beden" }]; save(nc, rows); }} style={{ background: "rgba(52,152,219,0.2)", border: "1px solid rgba(52,152,219,0.4)", borderRadius: "6px", color: "#3498db", cursor: "pointer", fontSize: "11px", padding: "4px 8px", fontWeight: "600" }}>+ Beden Ekle</button>
                          <button type="button" onClick={() => { const nr = [...rows, { id: "r" + Date.now(), bolge: "", values: {}, tolPos: {}, tolNeg: {} }]; save(cols, nr); }} style={{ background: "rgba(46,204,113,0.2)", border: "1px solid rgba(46,204,113,0.4)", borderRadius: "6px", color: "#2ecc71", cursor: "pointer", fontSize: "11px", padding: "4px 8px", fontWeight: "600" }}>+ Ölçü Satiri Ekle</button>
                        </div>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ background: "var(--bg-input)" }}>
                              <th style={{ padding: "6px 8px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)", minWidth: "120px" }}>Ölçü Bölgesi</th>
                              {cols.map((col, ci) => (
                                <th key={col.id} style={{ borderBottom: "1px solid var(--border-color)", minWidth: "90px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "4px" }}>
                                    <input value={col.label} onChange={e => { const nc = cols.map((c, i) => i === ci ? { ...c, label: e.target.value } : c); save(nc, rows); }}
                                      style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-primary)", background: "rgba(52,152,219,0.08)", border: "1px solid rgba(52,152,219,0.2)", borderRadius: "4px", padding: "2px 4px", textAlign: "center", width: "100%", boxSizing: "border-box" }} />
                                    <button type="button" onClick={() => { const nc = cols.filter((_, i) => i !== ci); const nr = rows.map(r => { const v = { ...r.values }; const tp = { ...r.tolPos }; const tn = { ...r.tolNeg }; delete v[col.id]; delete tp[col.id]; delete tn[col.id]; return { ...r, values: v, tolPos: tp, tolNeg: tn }; }); save(nc, nr); }}
                                      style={{ fontSize: "9px", background: "rgba(231,76,60,0.15)", border: "none", borderRadius: "3px", color: "#e74c3c", cursor: "pointer", padding: "1px 4px" }}>Sil</button>
                                    <div style={{ fontSize: "9px", color: "var(--text-muted)", display: "flex", gap: "2px", justifyContent: "center" }}><span style={{ color: "#2ecc71" }}>+</span><span style={{ color: "#e74c3c" }}>-</span> Tolerans</div>
                                  </div>
                                </th>
                              ))}
                              <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--border-color)", minWidth: "28px" }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 ? (
                              <tr><td colSpan={cols.length + 2} style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "12px" }}>
                                Henüz ölçü satiri yok  Satir Ekle butonuna tiklayin<br /><span style={{ fontSize: "11px", opacity: 0.55 }}>Örn: Gogüs  Bel  Kalca  Etek boyu  Boy</span>
                              </td></tr>
                            ) : rows.map((row, ri) => (
                              <tr key={row.id} style={{ borderBottom: "1px solid var(--border-color)", background: ri % 2 === 0 ? "transparent" : "rgba(52,152,219,0.02)" }}>
                                <td style={{ padding: "4px 6px" }}>
                                  <input className="form-input" style={{ fontSize: "12px", margin: 0, width: "100%", boxSizing: "border-box" }} placeholder="Gogüs / Bel / Boy..." value={row.bolge || ""}
                                    onChange={e => { const nr = rows.map((r, i) => i === ri ? { ...r, bolge: e.target.value } : r); save(cols, nr); }} />
                                </td>
                                {cols.map(col => (
                                  <td key={col.id} style={{ padding: "3px 3px", verticalAlign: "top" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                      <input className="form-input" style={{ fontSize: "12px", margin: 0, textAlign: "center", width: "100%", boxSizing: "border-box" }} placeholder="" value={(row.values || {})[col.id] || ""}
                                        onChange={e => { const nr = rows.map((r, i) => i === ri ? { ...r, values: { ...r.values, [col.id]: e.target.value } } : r); save(cols, nr); }} />
                                      <div style={{ display: "flex", gap: "2px" }}>
                                        <input style={{ width: "50%", fontSize: "10px", padding: "1px 3px", background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.25)", borderRadius: "3px", color: "#2ecc71", textAlign: "center", boxSizing: "border-box" }} placeholder="+mm" value={(row.tolPos || {})[col.id] || ""}
                                          onChange={e => { const nr = rows.map((r, i) => i === ri ? { ...r, tolPos: { ...r.tolPos, [col.id]: e.target.value } } : r); save(cols, nr); }} />
                                        <input style={{ width: "50%", fontSize: "10px", padding: "1px 3px", background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.25)", borderRadius: "3px", color: "#e74c3c", textAlign: "center", boxSizing: "border-box" }} placeholder="-mm" value={(row.tolNeg || {})[col.id] || ""}
                                          onChange={e => { const nr = rows.map((r, i) => i === ri ? { ...r, tolNeg: { ...r.tolNeg, [col.id]: e.target.value } } : r); save(cols, nr); }} />
                                      </div>
                                    </div>
                                  </td>
                                ))}
                                <td style={{ padding: "4px 4px", textAlign: "center", verticalAlign: "middle" }}>
                                  <button type="button" onClick={() => { const nr = rows.filter((_, i) => i !== ri); save(cols, nr); }} style={{ background: "rgba(231,76,60,0.15)", border: "none", borderRadius: "5px", color: "#e74c3c", cursor: "pointer", fontSize: "13px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>&#x2715;</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* DURUM */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Durum {editForm.status !== editModel?.status && <span style={{ fontSize: "11px", color: "var(--warning)" }}>Degistirildi</span>}
                  </label>
                  <select className="form-select" value={editForm.status || ""} style={{ fontWeight: "600" }} onChange={e => {
                    const ord = ["orijinal_numune", "ilk_uretim_numunesi", "uretim_numunesi", "numune_onaylandi", "uretimde", "uretim_tamamlandi", "sayi_seti", "sevk_edildi"];
                    if (ord.indexOf(e.target.value) < ord.indexOf(editModel?.status)) { if (!confirm("Durumu geri almak istiyorsunuz. Emin misiniz?")) return; }
                    setEditForm({ ...editForm, status: e.target.value });
                  }}>
                    <option value="orijinal_numune">Orijinal Numune</option>
                    <option value="ilk_uretim_numunesi">Ilk Üretim Numunesi</option>
                    <option value="uretim_numunesi">Üretim Numunesi</option>
                    <option value="numune_onaylandi">Numune Onaylandi</option>
                    <option value="uretimde">Üretimde</option>
                    <option value="uretim_tamamlandi">Üretim Tamamlandi</option>
                    <option value="sayi_seti">Sayi Seti</option>
                    <option value="sevk_edildi">Sevk Edildi</option>
                  </select>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModel(null)}>Iptal</button>
                <button type="submit" className="btn btn-primary">Kaydet ve Logla</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );

}





// ========== PERSONNEL PAGE ==========

function PersonnelPage({ personnel, loadPersonnel, addToast }) {

  const [showModal, setShowModal] = useState(false);

  const [editPerson, setEditPerson] = useState(null);

  const [editPersonForm, setEditPersonForm] = useState({});

  const [personAuditHistory, setPersonAuditHistory] = useState(null);

  const [personAuditData, setPersonAuditData] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // C1+C2: Arama ve filtre
  const [persSearch, setPersSearch] = useState('');
  const [persRoleFilter, setPersRoleFilter] = useState('');
  const [persStatusFilter, setPersStatusFilter] = useState('');



  const roleLabels = {

    pastalci: '✂️ Pastalcı', serimci: '✂️ Serimci', kesim_operatoru: '✂️ Kesim Op.', kesim_yardimcisi: '✂️ Kesim Yrd.',

    duz_makineci: '🧵 Düz Makineci', overlokcu: '🔄 Overlokçu', recmeci: '📏 Reçmeci', flatlock_operatoru: '📏 Flatlockçu',

    cift_igneci: '🧵 Çift İĞneci', zincir_dikisci: '🧵 Z.Dikişçi', zigzagci: '🧵 Zigzagcı', gizli_dikisci: '🧵 G.Dikişçi',

    kolcu: '💪 Kolcu', ortaci: '📐 Ortacı', kemerci: '🎗️ Kemerci', yakalikci: '👔 Yakalıkçı',

    mansetci: '🧤 Manşetçi', cepci: '📋 Cepçi', fermuar_operatoru: '🔗 Fermuar Op.', lastik_operatoru: '🔄 Lastik Op.',

    biye_operatoru: '📏 Biye Op.', ilikci: '🪡 İlikçi', dugmeci: '🔘 DüĞmeci',

    punterizci: '⚙️ Punterizcı', kopru_operatoru: '⚙️ Köprü Op.', aksesuar_operatoru: '⚙️ Aksesuar Op.',

    ara_utucu: '♨️ Ara Ütücü', son_utucu: '♨️ Son Ütücü', iplik_temizleme: '🧹 İplik Temizleme',

    etiketci: '🏷️ Etiketçi', katlama_operatoru: '📦 Katlama Op.', paketci: '📦 Paketçi', kolileme_operatoru: '📦 Kolileme Op.',

    baski_operatoru: '🖨️ Baskı Op.', inline_kalite: '👁️ Ara Kalite Kontrol', son_kontrolcu: '✅ Son Kontrol',

    olcum_kontrol: '📐 Ölçüm Kontrol', aql_kalite: '🏆 AQL Kalite', hat_sefi: '👔 Hat Şefi', ustabasi: '👔 Ustabaşı',

    numuneci: '🧪 Numuneci', modelci: '📐 Modelci', modelhane_operatoru: '🏭 Modelhane Op.',

    makine_teknisyeni: '🔧 Bak.Tekn.', yardimci_operator: '🤝 Yardımcı Op.',

    // eski roller (geriye uyumluluk)

    singerci: '🧵 Singerci', utucu: '♨️ Ütücü', temizlemeci: '🧹 Temizlemeci',

    kalite_kontrol: '✅ Kalite Kontrol', model_makinaci: '🏭 Model Makinacı', yonetici: '💼 Yönetici'

  };



  const masteryLabels = { egitici_usta: '👑 Eğitici Usta', usta: '🟣 Usta', kalfa: '🔵 Kalfa', operator: '🟢 Operatör', cirak: '🟡 Çırak', stajyer: '⚪ Stajyer' };

  const speedLabels = { cok_seri: '⚡⚡', seri: '⚡', normal: '▶️', yavas: '🐢' };

  const qualityLabels = { premium: '💎', iyi: '✨', normal: '✅', degisken: '🟡', dusuk: '⚠️', kaliteli: '✨', standart: '✅' };

  // Çoklu rol gösterimi için yardımcı
  const formatRoles = (roleStr) => {
    if (!roleStr) return '—';
    return roleStr.split(',').map(r => r.trim()).filter(Boolean).map(r => roleLabels[r] || r).join(', ');
  };



  const handleSave = async (formData) => {

    try {

      const res = await fetch('/api/personnel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });

      if (!res.ok) throw new Error('Hata');

      await loadPersonnel(); setShowModal(false); addToast('success', 'Personel eklendi!');

    } catch (err) { addToast('error', err.message || 'Hata oluştu'); }

  };



  const handleDelete = async (id) => {
    try { await fetch(`/api/personnel/${id}`, { method: 'DELETE' }); await loadPersonnel(); setDeleteConfirmId(null); addToast('success', 'Personel silindi'); } catch { addToast('error', 'Silinemedi'); }
  };



  const handleToggleStatus = async (id, currentStatus) => {

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try { await fetch(`/api/personnel/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus, changed_by: 'admin' }) }); await loadPersonnel(); } catch (err) { addToast('error', 'Durum değiştirilemedi'); }

  };



  const openEditPerson = (p) => {

    setEditPersonForm({

      name: p.name || '', role: p.role || '', daily_wage: p.daily_wage || 0,

      skill_level: p.skill_level || '', machines: p.machines || '', language: p.language || 'tr',

      work_start: p.work_start || '08:00', work_end: p.work_end || '18:00',

      base_salary: p.base_salary || 0, transport_allowance: p.transport_allowance || 0,

      ssk_cost: p.ssk_cost || 0, food_allowance: p.food_allowance || 0, compensation: p.compensation || 0,

      technical_mastery: p.technical_mastery || 'operator', speed_level: p.speed_level || 'normal',

      quality_level: p.quality_level || 'standart', discipline_level: p.discipline_level || 'guvenilir',

      versatility_level: p.versatility_level || '1-2', position: p.position || p.role || '', department: p.department || ''

    });

    setEditPerson(p);

  };



  const handleUpdatePerson = async (e) => {
    e.preventDefault();
    try {
      // Audit trail: değişen alanları logla
      const changes = [];
      Object.keys(editPersonForm).forEach(key => {
        const oldVal = String(editPerson[key] ?? '');
        const newVal = String(editPersonForm[key] ?? '');
        if (oldVal !== newVal) {
          changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
        }
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'personnel', record_id: editPerson.id, changes, changed_by: 'admin' })
        });
      }
      const res = await fetch(`/api/personnel/${editPerson.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editPersonForm, changed_by: 'admin' })
      });
      if (!res.ok) throw new Error('Güncelleme hatası');
      await loadPersonnel(); setEditPerson(null);
      addToast('success', 'Personel güncellendi! Değişiklikler kayıt altına alındı.');
    } catch (err) { addToast('error', err.message || 'Hata oluştu'); }
  };



  const openPersonAuditHistory = async (personId) => {

    try {

      const res = await fetch(`/api/audit-trail?table=personnel&record_id=${personId}`);

      const data = await res.json();

      setPersonAuditData(Array.isArray(data) ? data : []);

      setPersonAuditHistory(personId);

    } catch { setPersonAuditData([]); setPersonAuditHistory(personId); }

  };



  return (

    <>

      <div className="topbar"><h1 className="topbar-title">📋 Personel</h1><div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input className="form-input" placeholder="🔍 Ada göre ara..." value={persSearch} onChange={e => setPersSearch(e.target.value)} style={{ minWidth: '160px', fontSize: '13px' }} />
        <select className="form-select" value={persRoleFilter} onChange={e => setPersRoleFilter(e.target.value)} style={{ minWidth: '120px', fontSize: '13px' }}>
          <option value="">Tüm Roller</option>
          {[...new Set(personnel.flatMap(p => (p.role || '').split(',').map(r => r.trim()).filter(Boolean)))].sort().map(r => <option key={r} value={r}>{roleLabels[r] || r}</option>)}
        </select>
        <select className="form-select" value={persStatusFilter} onChange={e => setPersStatusFilter(e.target.value)} style={{ minWidth: '100px', fontSize: '13px' }}>
          <option value="">Tüm Durum</option>
          <option value="active">✅ Aktif</option>
          <option value="inactive">🔴 Pasif</option>
        </select>
        <button className="btn btn-primary" onClick={() => { setEditPerson(null); setShowModal(true); }}>➕ Yeni Personel</button>
      </div></div>

      <div className="page-content">

        {/* ⏱️ AMELE 1 — GÜNLÜK DEVAM (PersonelDevamBar) */}
        <PersonelDevamBar personnel={personnel} addToast={addToast} />

        {(() => {
          const filtered = personnel.filter(p => {
            if (persSearch && !p.name?.toLowerCase().includes(persSearch.toLowerCase())) return false;
            if (persRoleFilter && !(p.role || '').split(',').map(r => r.trim()).includes(persRoleFilter)) return false;
            if (persStatusFilter && p.status !== persStatusFilter) return false;
            return true;
          });
          return filtered.length === 0 ? (

            <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">{personnel.length === 0 ? 'Henüz Personel Yok' : 'Sonuç Bulunamadı'}</div><div className="empty-state-text">{personnel.length === 0 ? 'Personel ekleyerek başlayın.' : 'Arama veya filtre kriterlerini değiştirin.'}</div>{personnel.length === 0 && <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ İlk Personeli Ekle</button>}</div></div>

          ) : (

            <div className="table-wrapper"><table className="table"><thead><tr><th>#</th><th>Foto</th><th>Ad Soyad</th><th>Pozisyon</th><th>Ustalık</th><th>Hız</th><th>Kalite</th><th>Sınıf</th><th>Devamsızlık</th><th>Günlük Ücret</th><th>Mesai</th><th title="Son 30 gün ortalaması">Ort.Üretim</th><th title="Son 30 gün hata oranı">Hata%</th><th title="Son 30 gün OEE/Verimlilik">OEE%</th><th>Haftalık Not</th><th>Durum</th><th style={{ width: '110px' }}>İşlem</th></tr></thead><tbody>

              {filtered.map((p, idx) => (

                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>

                  <td style={{ fontWeight: '600', color: 'var(--text-muted)', textAlign: 'center', minWidth: '30px' }}>{idx + 1}</td>

                  {/* FOTOĞRAF */}
                  <td style={{ textAlign: 'center', padding: '4px' }}>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #27ae60)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '14px', margin: '0 auto' }}>
                        {(p.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </td>

                  <td style={{ fontWeight: '700', fontSize: '14px' }}>
                    <div>{p.name}</div>
                    {p.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>📞 {p.phone}</div>}
                  </td>

                  <td><span className="badge badge-info" style={{ fontSize: '11px' }}>{formatRoles(p.role)}</span></td>

                  <td style={{ fontSize: '13px' }}>{masteryLabels[p.technical_mastery] || masteryLabels.operator}</td>

                  <td style={{ textAlign: 'center', fontSize: '16px' }}>{speedLabels[p.speed_level] || speedLabels.normal}</td>

                  <td style={{ textAlign: 'center', fontSize: '16px' }}>{qualityLabels[p.quality_level] || qualityLabels.standart}</td>

                  <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '15px' }}>{p.operator_class === 'A' ? '🏆 A' : p.operator_class === 'B' ? '🔵 B' : p.operator_class === 'C' ? '🟡 C' : p.operator_class === 'D' ? '⚪ D' : '🔵 B'}</td>
                  <td style={{ textAlign: 'center' }}>{p.attendance === 'yok' ? '❌' : p.attendance === 'ayda_5_ustu' ? '🔴 5+' : p.attendance === 'ayda_3_4' ? '🟠 3-4' : p.attendance === 'ayda_2' ? '🟡 2' : '✅'}</td>
                  <td style={{ fontWeight: '700', color: 'var(--accent)' }}>{(p.daily_wage || 0).toFixed(0)} ₺</td>

                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.work_start || '08:00'} – {p.work_end || '18:00'}</td>

                  <td style={{ textAlign: 'center', fontWeight: '700', color: (p.daily_avg_output || 0) > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>{(p.daily_avg_output || 0) > 0 ? p.daily_avg_output : '—'}</td>
                  <td style={{ textAlign: 'center' }}>{(p.error_rate || 0) > 0 ? <span className={`badge ${p.error_rate <= 2 ? 'badge-success' : p.error_rate <= 5 ? 'badge-warning' : 'badge-danger'}`}>%{p.error_rate}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ textAlign: 'center' }}>{(p.efficiency_score || 0) > 0 ? <span className={`badge ${p.efficiency_score >= 70 ? 'badge-success' : p.efficiency_score >= 50 ? 'badge-warning' : 'badge-danger'}`}>%{p.efficiency_score}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>

                  {/* HAFTALIK NOT INLINE */}
                  <td style={{ maxWidth: '160px' }}>
                    <textarea
                      defaultValue={p.weekly_note || ''}
                      placeholder="Not ekle..."
                      rows={2}
                      onBlur={async (e) => {
                        const yeniNot = e.target.value;
                        if (yeniNot === (p.weekly_note || '')) return;
                        try {
                          await fetch(`/api/personnel/${p.id}`, {
                            method: 'PUT', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ weekly_note: yeniNot, changed_by: 'admin' })
                          });
                          await loadPersonnel();
                          addToast('success', `${p.name} — haftalık not güncellendi`);
                        } catch { addToast('error', 'Not güncellenemedi'); }
                      }}
                      style={{ width: '100%', fontSize: '11px', padding: '4px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', resize: 'none', fontFamily: 'inherit' }}
                    />
                  </td>

                  <td><span onClick={() => handleToggleStatus(p.id, p.status)} style={{ cursor: 'pointer' }} className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{p.status === 'active' ? '✅ Aktif' : '🔴 Pasif'}</span></td>

                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button onClick={() => { setEditPerson(p); setShowModal(true); }} title="Düzenle" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                      <button onClick={() => openPersonAuditHistory(p.id)} title="Değişiklik Geçmişi" style={{ background: 'rgba(155,89,182,0.15)', color: '#9b59b6', border: 'none', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontSize: '13px' }}>📜</button>
                      <button onClick={() => setDeleteConfirmId(p.id)} title="Sil" style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: 'none', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                    </div>
                  </td>

                </tr>

              ))}

            </tbody></table></div>

          );
        })()}

      </div>

      {showModal && <NewPersonnelModal onClose={() => { setShowModal(false); setEditPerson(null); }} onSave={handleSave} editData={editPerson} onUpdate={async (data) => {
        try {
          const changes = [];
          for (const key of Object.keys(data)) {
            const oldVal = String(editPerson[key] ?? '');
            const newVal = String(data[key] ?? '');
            if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
          }
          if (changes.length > 0) {
            await fetch('/api/audit-trail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table_name: 'personnel', record_id: editPerson.id, changes, changed_by: 'admin' }) });
          }
          const res = await fetch(`/api/personnel/${editPerson.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, changed_by: 'admin' }) });
          if (!res.ok) throw new Error('G\u00fcncelleme hatas\u0131');
          await loadPersonnel(); setEditPerson(null); setShowModal(false);
          addToast('success', 'Personel g\u00fcncellendi!');
        } catch (err) { addToast('error', err.message); }
      }} />}


      {/* ===== SİLME ONAY MODALI ===== */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ marginBottom: '8px' }}>Personeli Silmek İstediğinize Emin Misiniz?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              <strong>{personnel.find(p => p.id === deleteConfirmId)?.name}</strong> silinecek. Bu işlem geri alınabilir.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn" style={{ background: '#e74c3c', color: '#fff', padding: '10px 30px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700' }} onClick={() => handleDelete(deleteConfirmId)}>🗑️ Evet, Sil</button>
              <button className="btn" style={{ padding: '10px 30px' }} onClick={() => setDeleteConfirmId(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PERSONEL DEĞİŞİKLİK GEÇMİŞİ ===== */}

      {personAuditHistory && (

        <div className="modal-overlay" onClick={() => setPersonAuditHistory(null)}>

          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>

            <div className="modal-header">

              <h2 className="modal-title">📜 Personel Değişiklik Geçmişi</h2>

              <button className="modal-close" onClick={() => setPersonAuditHistory(null)}>✕</button>

            </div>

            <div style={{ padding: '8px 16px', background: 'rgba(46,204,113,0.1)', borderBottom: '1px solid rgba(46,204,113,0.3)', fontSize: '12px', color: '#2ecc71', fontWeight: '600' }}>

              🔒 Bu kayıtlar silinemez. Tüm değişiklikler kalıcı olarak saklanır.

            </div>

            <div style={{ padding: '20px' }}>

              {personAuditData.length === 0 ? (

                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>

                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>

                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Henüz değişiklik kaydı yok</div>

                </div>

              ) : (

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {personAuditData.map((entry, i) => (

                    <div key={entry.id || i} style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>

                        <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent)' }}>{entry.field_name}</span>

                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px' }}>

                          🕐 {new Date(entry.changed_at).toLocaleString('tr-TR')}

                        </span>

                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>

                        <div style={{ padding: '8px 12px', background: 'rgba(231,76,60,0.08)', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-word', borderLeft: '3px solid var(--danger)' }}>

                          <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--danger)', marginBottom: '2px' }}>ESKİ</div>

                          {entry.old_value || '—'}

                        </div>

                        <div style={{ fontSize: '18px', color: 'var(--text-muted)' }}>→</div>

                        <div style={{ padding: '8px 12px', background: 'rgba(46,204,113,0.08)', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-word', borderLeft: '3px solid var(--success)' }}>

                          <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--success)', marginBottom: '2px' }}>YENİ</div>

                          {entry.new_value || '—'}

                        </div>

                      </div>

                      <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>👤 {entry.changed_by || 'admin'}</div>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </>

  );

}



// ========== PRODUCTION PAGE ==========

function ProductionPage({ models, personnel, addToast }) {
  // EDIT system states
  const [editProduction, setEditProduction] = useState(null);
  const [editProductionForm, setEditProductionForm] = useState({});
  const [prodAuditHistory, setProdAuditHistory] = useState(null);
  const [prodAuditData, setProdAuditData] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(null); // { type: 'video'|'audio'|'image', src, title }

  const openEditProduction = (log) => {
    setEditProductionForm({
      total_produced: log.total_produced || 0, defective_count: log.defective_count || 0,
      defect_reason: log.defect_reason || '', defect_source: log.defect_source || 'operator',
      lot_change: log.lot_change || '', quality_score: log.quality_score || 100,
      break_duration_min: log.break_duration_min || 0, machine_down_min: log.machine_down_min || 0,
      material_wait_min: log.material_wait_min || 0, passive_time_min: log.passive_time_min || 0,
      defect_classification: log.defect_classification || '', notes: log.notes || ''
    });
    setEditProduction(log);
  };

  const handleUpdateProduction = async (e) => {
    e.preventDefault();
    try {
      const changes = [];
      Object.keys(editProductionForm).forEach(key => {
        const oldVal = String(editProduction[key] ?? '');
        const newVal = String(editProductionForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'production_logs', record_id: editProduction.id, changes, changed_by: 'koordinator' })
        });
      }
      const res = await fetch(`/api/production/${editProduction.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProductionForm)
      });
      if (!res.ok) throw new Error('Güncelleme hatası');
      setEditProduction(null);
      await loadLogs();
      addToast('success', 'Üretim kaydı güncellendi!');
    } catch (err) { addToast('error', err.message); }
  };

  const openProdAuditHistory = async (logId) => {
    try {
      const res = await fetch(`/api/audit-trail?table=production_logs&record_id=${logId}`);
      const data = await res.json();
      setProdAuditData(Array.isArray(data) ? data : []);
      setProdAuditHistory(logId);
    } catch { setProdAuditData([]); setProdAuditHistory(logId); }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('Bu üretim kaydını silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/production/${logId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme hatası');
      await loadLogs();
      addToast('success', 'Kayıt silindi (geri alınabilir)');
    } catch (err) { addToast('error', err.message); }
  };

  const [selectedModel, setSelectedModel] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [seciliPartiId, setSeciliPartiId] = useState('');
  const [operations, setOperations] = useState([]);
  const [activeSession, setActiveSession] = useState(() => {
    try { const s = typeof window !== 'undefined' && sessionStorage.getItem('activeSession'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [timer, setTimer] = useState(() => {
    try { const t = typeof window !== 'undefined' && sessionStorage.getItem('prodTimer'); return t ? parseInt(t) : 0; } catch { return 0; }
  });
  const [logs, setLogs] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [form, setForm] = useState({
    total_produced: '', defective_count: '0', defect_reason: '', defect_source: 'operator',
    machine_down_min: '0', material_wait_min: '0', break_duration_min: '0', passive_time_min: '0',
    lot_change: '', lot_old: '', lot_new: '', quality_score: '100', defect_classification: '', notes: '', defect_photo: ''
  });

  // #7 OEE hedef değeri
  const [oeeTarget, setOeeTarget] = useState(85);

  // #12 Tablo filtreleme
  const [tableFilter, setTableFilter] = useState({ personnel: '', model: '' });

  const defectSources = [
    { value: 'operator', label: '👷 Operatör Hatası' },
    { value: 'machine', label: '⚙️ Makine Hatası' },
    { value: 'material', label: '🧵 Malzeme Hatası' },
    { value: 'design', label: '📐 Tasarım/Model Hatası' },
    { value: 'management', label: '📋 Yönetim/Planlama Hatası' }
  ];

  const defectTypes = [
    'Atlanmış dikiş', 'Eğri dikiş', 'İplik kopması', 'Kumaş hatası',
    'Ölçü hatası', 'Leke/iz',
    'Düşen ilmek', 'Beden uyumsuzluğu', 'Yıkama/ütü hatası',
    'Renk/ton farkı', 'Aksesuar hatası', 'İplik rengi yanlış', 'Diğer'
  ];

  const formatTimer = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/production?date=${filterDate}`);
      const d = await res.json();
      setLogs(Array.isArray(d) ? d : []);
    } catch { setLogs([]); }
  }, [filterDate]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Timer ve session'ı sessionStorage'a yedekle (5 sn debounce — performans optimizasyonu)
  const lastSaveRef = useRef(0);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeSession) {
        const now = Date.now();
        if (now - lastSaveRef.current > 5000) {
          sessionStorage.setItem('activeSession', JSON.stringify(activeSession));
          sessionStorage.setItem('prodTimer', String(timer));
          lastSaveRef.current = now;
        }
      } else { sessionStorage.removeItem('activeSession'); sessionStorage.removeItem('prodTimer'); }
    }
  }, [activeSession, timer]);

  useEffect(() => {
    if (selectedModel) {
      setSelectedOperation(''); // Önce sıfırla, sonra yeni işlemleri yükle
      fetch(`/api/models/${selectedModel}/operations`).then(r => r.json()).then(d => {
        const ops = Array.isArray(d) ? d.sort((a, b) => a.order_number - b.order_number) : [];
        setOperations(ops);
        // Otomatik olarak sıradaki (ilk) işlemi seç
        if (ops.length > 0) {
          setSelectedOperation(String(ops[0].id));
        }
      });
    } else { setOperations([]); setSelectedOperation(''); }
  }, [selectedModel]);

  // İşlemi yapabilecek personelleri bul
  const getCapablePersonnel = useCallback((op) => {
    if (!op || !personnel) return [];
    const machineType = (op.machine_type || '').toLowerCase();
    return personnel.filter(p => {
      if (p.status !== 'active') return false;
      try {
        const machines = typeof p.machines === 'string' ? JSON.parse(p.machines) : (p.machines || {});
        const roleStr = (p.role || '').toLowerCase();
        // Makine tipinde eşleşme
        const hasMatch = Object.keys(machines).some(m => m.toLowerCase().includes(machineType.split(' ')[0]));
        const roleMatch = machineType && roleStr.includes(machineType.split(' ')[0]);
        return hasMatch || roleMatch;
      } catch { return true; }
    });
  }, [personnel]);


  useEffect(() => { let iv; if (activeSession) { iv = setInterval(() => setTimer(t => t + 1), 1000); } return () => clearInterval(iv); }, [activeSession]);

  // ===== OTOMATİK PERSONEL ÖNERİSİ =====
  const [suggestedPerson, setSuggestedPerson] = useState(null);

  const suggestBestPersonnel = useCallback((op) => {
    if (!op || !personnel || personnel.length === 0) return null;
    const machineType = (op.machine_type || '').toLowerCase().trim();
    const opDifficulty = op.difficulty || 5;
    const reqSkill = op.required_skill_level || '3_sinif';
    const skillLevelMap = { '1_sinif': 1, '2_sinif': 2, '3_sinif': 3, 'usta': 4, 'kalfa': 3 };
    const reqSkillNum = skillLevelMap[reqSkill] || 3;

    let bestScore = -1;
    let bestPerson = null;

    personnel.filter(p => p.status === 'active').forEach(p => {
      let score = 0;

      // 1. Makine uyumu (0-40 puan)
      try {
        const machines = typeof p.machines === 'string' ? JSON.parse(p.machines) : (p.machines || {});
        const roleStr = (p.role || '').toLowerCase();
        // Makine becerileri JSON'da arama
        Object.entries(machines).forEach(([machine, level]) => {
          if (machineType && machine.toLowerCase().includes(machineType.toLowerCase().split(' ')[0])) {
            const lvl = String(level).toLowerCase();
            if (lvl === 'cok_iyi' || lvl === 'çok_iyi' || lvl === 'çok iyi') score += 40;
            else if (lvl === 'iyi') score += 30;
            else if (lvl === 'orta') score += 20;
            else if (lvl === 'normal' || lvl === 'yeni') score += 10;
            else score += 15;
          }
        });
        // Role'da makine geçiyor mu
        if (machineType && roleStr.includes(machineType.split(' ')[0].toLowerCase())) score += 15;
      } catch { }

      // 2. Beceri seviyesi vs zorluk (0-30 puan)
      const pSkill = skillLevelMap[p.skill_level] || 2;
      if (pSkill >= reqSkillNum) score += 30;
      else if (pSkill === reqSkillNum - 1) score += 15;
      else score += 5;

      // 3. İşlem deneyimi (0-20 puan) — daha önce bu işlemi yapmış mı
      const prevLogs = logs.filter(l => l.operation_id === op.id && l.personnel_id === p.id);
      if (prevLogs.length > 0) {
        score += 20;
        // Daha önceki FPY yüksekse bonus
        const avgFpy = prevLogs.reduce((s, l) => s + (l.first_pass_yield || 100), 0) / prevLogs.length;
        if (avgFpy > 95) score += 10;
      }

      if (score > bestScore) { bestScore = score; bestPerson = p; }
    });

    return bestPerson;
  }, [personnel, logs]);

  // İşlem seçildiğinde otomatik personel öner
  useEffect(() => {
    if (selectedOperation && operations.length > 0 && !activeSession) {
      const op = operations.find(o => o.id === parseInt(selectedOperation));
      const best = suggestBestPersonnel(op);
      if (best) {
        setSuggestedPerson(best.id);
        if (!selectedPerson) {
          setSelectedPerson(String(best.id));
        }
      }
    }
  }, [selectedOperation, operations, suggestBestPersonnel, activeSession]);

  // Otomatik hesaplamalar
  const tp = parseInt(form.total_produced) || 0;
  const dc = parseInt(form.defective_count) || 0;
  const fpy = tp > 0 ? ((tp - dc) / tp) * 100 : 100;
  const brk = parseFloat(form.break_duration_min) || 0;
  const mch = parseFloat(form.machine_down_min) || 0;
  const mat = parseFloat(form.material_wait_min) || 0;
  const pas = parseFloat(form.passive_time_min) || 0;
  const netWorkMin = timer > 0 ? Math.max(0, (timer / 60) - brk - mch - mat - pas) : 0;
  const unitTimeSec = tp > 0 && netWorkMin > 0 ? (netWorkMin * 60) / tp : 0;
  const selectedOp = operations.find(o => o.id === parseInt(selectedOperation));
  const unitValue = tp * (selectedOp?.unit_price || 0);

  // Stat kartları hesaplamaları
  const todayProduced = logs.reduce((s, l) => s + (l.total_produced || 0), 0);
  const todayDefects = logs.reduce((s, l) => s + (l.defective_count || 0), 0);
  const todayFPY = todayProduced > 0 ? ((todayProduced - todayDefects) / todayProduced * 100) : 100;

  // #6 OEE ve toplam ₺ hesaplamaları
  const todayValue = logs.reduce((s, l) => s + (l.unit_value || 0), 0);
  const todayOEE = logs.length > 0 ? (logs.reduce((s, l) => s + (l.oee_score || 0), 0) / logs.length) : 0;
  // DHU% = (toplam hata / toplam üretim) * 100
  const todayDHU = todayProduced > 0 ? (todayDefects / todayProduced * 100) : 0;
  // Verimlilik = ((toplam üretim * ideal süre) / toplam çalışma süresi) * 100
  const todayTotalMinutes = logs.reduce((s, l) => s + ((l.duration_seconds || 0) / 60), 0);
  const todayNetMinutes = todayTotalMinutes - logs.reduce((s, l) => s + (l.break_duration_min || 0) + (l.machine_down_min || 0) + (l.material_wait_min || 0), 0);
  const todayEfficiency = todayNetMinutes > 0 && todayProduced > 0 ? Math.min(100, (todayProduced / (todayNetMinutes / 2)) * 100) : 0;
  // Birim Süre = net çalışma süresi / toplam üretim
  const todayUnitTime = todayProduced > 0 && todayNetMinutes > 0 ? (todayNetMinutes / todayProduced) : 0;

  // #10 Düşük FPY uyarı fonksiyonu
  const getFPYStyle = (fpy) => {
    if (fpy >= 95) return { color: '#27ae60', bg: 'rgba(39,174,96,0.12)' };
    if (fpy >= 85) return { color: '#f39c12', bg: 'rgba(243,156,18,0.12)' };
    return { color: '#e74c3c', bg: 'rgba(231,76,60,0.12)' };
  };

  // #5 Filtrelenmiş loglar (useMemo ile optimize)
  const filteredLogs = useMemo(() => logs.filter(l => {
    if (tableFilter.personnel && l.personnel_id !== parseInt(tableFilter.personnel)) return false;
    if (tableFilter.model && l.model_id !== parseInt(tableFilter.model)) return false;
    return true;
  }), [logs, tableFilter]);

  const handleStart = () => {
    if (!selectedModel || !selectedOperation || !selectedPerson) return;
    const model = models.find(m => m.id === parseInt(selectedModel));
    const op = operations.find(o => o.id === parseInt(selectedOperation));
    const person = personnel.find(p => p.id === parseInt(selectedPerson));
    setActiveSession({
      model_id: parseInt(selectedModel), operation_id: parseInt(selectedOperation),
      personnel_id: parseInt(selectedPerson), model_name: model?.name, model_code: model?.code,
      operation_name: op?.name, personnel_name: person?.name, unit_price: op?.unit_price || 0,
      parti_id: seciliPartiId ? parseInt(seciliPartiId) : null,
      start_time: new Date().toISOString()
    });
    setTimer(0);
  };

  const handleStop = async () => {
    if (!activeSession) return;
    const produced = parseInt(form.total_produced) || 0;
    // #1 Hatalı Adet > Yapılan Adet kontrol
    if (dc > produced) { addToast('error', '❌ Hatalı adet, yapılan adetten fazla olamaz!'); return; }
    if (produced === 0 && timer < 120) {
      if (!confirm('2 dakikadan kısa ve 0 adet — emin misiniz?')) return;
    }
    if (produced === 0) { addToast('error', 'Yapılan adet giriniz'); return; }
    try {
      // #7 Fetch timeout (30sn)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch('/api/production', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({
          ...activeSession, end_time: new Date().toISOString(),
          total_produced: produced, defective_count: dc,
          defect_reason: form.defect_reason, defect_source: form.defect_source,
          break_duration_min: brk, machine_down_min: mch,
          material_wait_min: mat, passive_time_min: pas,
          quality_score: parseFloat(form.quality_score) || 100,
          lot_change: form.lot_change, defect_classification: form.defect_classification,
          defect_photo: form.defect_photo || '',
          notes: form.notes, changed_by: 'koordinator'
        })
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Kayıt hatası');
      setActiveSession(null); setTimer(0);
      setForm({ total_produced: '', defective_count: '0', defect_reason: '', defect_source: 'operator', machine_down_min: '0', material_wait_min: '0', break_duration_min: '0', passive_time_min: '0', lot_change: '', quality_score: '100', defect_classification: '', notes: '', defect_photo: '' });
      await loadLogs(); addToast('success', '✅ Üretim kaydı oluşturuldu');
    } catch (err) { addToast('error', err.message); }
  };

  // Clear input helper
  const ClearBtn = ({ field, defaultVal = '' }) => (
    <button type="button" onClick={() => setForm(p => ({ ...p, [field]: defaultVal }))}
      title="Temizle" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', opacity: 0.6 }}>❌</button>
  );

  const InputField = ({ label, field, type = 'text', placeholder = '', defaultVal = '' }) => (
    <div className="form-group" style={{ marginBottom: '8px' }}>
      <label className="form-label" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {label} <ClearBtn field={field} defaultVal={defaultVal} />
      </label>
      <input className="form-input" type={type} placeholder={placeholder}
        value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
        style={type === 'number' ? { textAlign: 'center', fontWeight: '600' } : {}} />
    </div>
  );

  return (
    <>
      <div className="topbar"><h1 className="topbar-title">🏭 Üretim Takip</h1><div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><input type="date" className="form-input" value={filterDate} onChange={e => { setFilterDate(e.target.value); }} style={{ fontSize: '13px', padding: '6px 10px' }} /><button className="btn btn-sm" onClick={() => setFilterDate(new Date().toISOString().split('T')[0])} style={{ fontSize: '12px', padding: '6px 10px' }}>Bugün</button><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(filterDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div></div>

      <div className="page-content">

        {/* ── ÜRETİM SEKME BAR ── */}
        {(() => {
          const [prodTab, setProdTab] = [
            typeof window !== 'undefined' ? (window._prodTab || 'takip') : 'takip',
            (v) => { if (typeof window !== 'undefined') { window._prodTab = v; } document.dispatchEvent(new CustomEvent('prodTabChange', { detail: v })); }
          ];
          return null;
        })()}
        <UretimTabBar models={models} personnel={personnel} addToast={addToast} />

        {/* 📈 #4 GÜNLÜK HEDEF BAR */}
        <GunlukHedefBar tarih={filterDate} />

        {/* ── SESLİ KOMUT BUTONU ── */}
        <div style={{ background: 'rgba(52,152,219,0.08)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SesliKomutButonu models={models} personnel={personnel} addToast={addToast} />
        </div>

        {/* ── STAT KARTLARI ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.15)', color: '#3498db' }}>📦</div>
            <div><div className="stat-value">{todayProduced}</div><div className="stat-label">Bugün Üretilen</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: todayFPY >= 95 ? 'rgba(46,204,113,0.15)' : todayFPY >= 85 ? 'rgba(243,156,18,0.15)' : 'rgba(231,76,60,0.15)', color: todayFPY >= 95 ? '#2ecc71' : todayFPY >= 85 ? '#f39c12' : '#e74c3c' }}>✅</div>
            <div><div className="stat-value">%{todayFPY.toFixed(1)}</div><div className="stat-label">Kalite (FPY)</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(231,76,60,0.15)', color: '#e74c3c' }}>❌</div>
            <div><div className="stat-value">{todayDefects}</div><div className="stat-label">Toplam Hata</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: todayOEE >= oeeTarget ? 'rgba(46,204,113,0.15)' : 'rgba(243,156,18,0.15)', color: todayOEE >= oeeTarget ? '#2ecc71' : '#f39c12' }}>⚙️</div>
            <div><div className="stat-value">%{todayOEE.toFixed(1)}</div><div className="stat-label">OEE {oeeTarget > 0 && <span style={{ fontSize: '10px' }}>(hedef %{oeeTarget})</span>}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60' }}>💰</div>
            <div><div className="stat-value">{todayValue.toFixed(2)} ₺</div><div className="stat-label">Toplam Değer</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(155,89,182,0.15)', color: '#9b59b6' }}>📊</div>
            <div><div className="stat-value">%{todayDHU.toFixed(1)}</div><div className="stat-label">DHU%</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: todayEfficiency >= 80 ? 'rgba(46,204,113,0.15)' : 'rgba(243,156,18,0.15)', color: todayEfficiency >= 80 ? '#2ecc71' : '#f39c12' }}>⚡</div>
            <div><div className="stat-value">%{todayEfficiency.toFixed(0)}</div><div className="stat-label">Verimlilik</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.15)', color: '#3498db' }}>⏱️</div>
            <div><div className="stat-value">{todayUnitTime > 0 ? `${todayUnitTime.toFixed(1)} dk` : '—'}</div><div className="stat-label">Birim Süre</div></div>
          </div>
        </div>

        {/* ── AKTİF ÜRETİM / YENİ BAŞLAT ── */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">{activeSession ? '⏱️ Aktif Üretim' : '🏭 Yeni Üretim Başlat'}</h3></div>

          {!activeSession ? (
            <div>
              <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '13px' }}>① Model Seçin *</label>
                  <select className="form-select" value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ fontSize: '15px', padding: '12px' }}>
                    <option value="">— Model seçin —</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, opacity: selectedModel ? 1 : 0.5 }}>
                  <label className="form-label" style={{ fontSize: '13px' }}>② İşlem Sırası {!selectedModel && <span style={{ color: 'var(--warning)', fontSize: '11px' }}>(önce model seçin)</span>} {operations.length > 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({operations.length} işlem)</span>}</label>

                  {/* ── Görsel İşlem Sırası Kartları ── */}
                  {operations.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0 8px', marginBottom: '8px' }}>
                      {operations.map((o, i) => {
                        const isSelected = selectedOperation === String(o.id);
                        const capable = getCapablePersonnel(o);
                        return (
                          <div key={o.id} onClick={() => setSelectedOperation(String(o.id))} style={{
                            minWidth: '120px', padding: '8px 10px', borderRadius: '10px', cursor: 'pointer',
                            background: isSelected ? 'linear-gradient(135deg, var(--accent), #27ae60)' : 'var(--bg-input)',
                            color: isSelected ? '#fff' : 'var(--text-primary)',
                            border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                            transition: 'all 0.2s', flex: '0 0 auto'
                          }}>
                            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '2px' }}>{o.order_number}</div>
                            <div style={{ fontSize: '12px', fontWeight: '700' }}>{o.name}</div>
                            <div style={{ fontSize: '10px', opacity: 0.8 }}>{o.machine_type || '—'}</div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '9px', background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)', padding: '1px 5px', borderRadius: '6px' }}>⚡{o.difficulty}/10</span>
                              <span style={{ fontSize: '9px', background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)', padding: '1px 5px', borderRadius: '6px' }}>👥{capable.length}</span>
                              {(o.video_path || o.audio_path || o.correct_photo_path) && <span style={{ fontSize: '9px', background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(46,204,113,0.15)', padding: '1px 5px', borderRadius: '6px', color: isSelected ? '#fff' : '#2ecc71' }}>{o.video_path ? '📹' : ''}{o.audio_path ? '🎤' : ''}{o.correct_photo_path ? '📸' : ''}</span>}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Manuel Dropdown (yedek) ── */}
                  <select className="form-select" value={selectedOperation} onChange={e => setSelectedOperation(e.target.value)} disabled={!selectedModel || operations.length === 0} style={{ fontSize: '13px', padding: '8px' }}>
                    <option value="">{!selectedModel ? '— Önce model seçin —' : operations.length === 0 ? '— Bu modelde işlem yok —' : '— Manuel seçim —'}</option>
                    {operations.map(o => <option key={o.id} value={o.id}>{o.order_number}. {o.name}{o.machine_type ? ` (${o.machine_type})` : ''} — {getCapablePersonnel(o).length} kişi yapabilir</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '13px' }}>③ Personel Seçin * {suggestedPerson && parseInt(selectedPerson) === suggestedPerson && <span style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', marginLeft: '6px', fontWeight: '700' }}>🤖 Önerilen</span>}</label>
                  <select className="form-select" value={selectedPerson} onChange={e => { setSelectedPerson(e.target.value); }} disabled={!selectedModel || !selectedOperation} style={{ fontSize: '15px', padding: '12px', opacity: (!selectedModel || !selectedOperation) ? 0.5 : 1 }}>
                    <option value="">— Personel seçin —</option>
                    {personnel.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name} ({p.role}){p.id === suggestedPerson ? ' ★ ÖNERİLEN' : ''}</option>)}
                  </select>
                </div>
              </div>
              {selectedOp && (<div style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}><strong>Seçilen İşlem:</strong> {selectedOp.name}  Makine: {selectedOp.machine_type || '—'}  Zorluk: {selectedOp.difficulty}/10{selectedOp.unit_price > 0 && <>  Birim: {selectedOp.unit_price.toFixed(2)} ₺</>}  <strong>Yapabilecek:</strong> {getCapablePersonnel(selectedOp).map(p => p.name).join(', ') || 'Belirsiz'}
                {(selectedOp.video_path || selectedOp.audio_path || selectedOp.correct_photo_path) && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedOp.video_path && <button onClick={() => setShowMediaModal({ type: 'video', src: selectedOp.video_path, title: selectedOp.name })} className="btn btn-sm" style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(52,152,219,0.15)', color: '#3498db', border: '1px solid rgba(52,152,219,0.3)' }}>📹 Videoyu İzle</button>}
                    {selectedOp.audio_path && <button onClick={() => setShowMediaModal({ type: 'audio', src: selectedOp.audio_path, title: selectedOp.name })} className="btn btn-sm" style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(155,89,182,0.15)', color: '#9b59b6', border: '1px solid rgba(155,89,182,0.3)' }}>🎤 Sesli Anlatım</button>}
                    {selectedOp.correct_photo_path && <button onClick={() => setShowMediaModal({ type: 'image', src: selectedOp.correct_photo_path, title: selectedOp.name + ' — Doğru Görünüş' })} className="btn btn-sm" style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(39,174,96,0.15)', color: '#27ae60', border: '1px solid rgba(39,174,96,0.3)' }}>📸 Doğru Görünüş</button>}
                    {selectedOp.incorrect_photo_path && <button onClick={() => setShowMediaModal({ type: 'image', src: selectedOp.incorrect_photo_path, title: selectedOp.name + ' — Yanlış Görünüş' })} className="btn btn-sm" style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(231,76,60,0.15)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.3)' }}>❌ Yanlış Görünüş</button>}
                  </div>
                )}
              </div>)}
              <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={!selectedModel || !selectedOperation || !selectedPerson} style={{ width: '100%', padding: '16px', fontSize: '18px' }}>🏭 İŞLEMİ BAŞLAT</button>
            </div>
          ) : (
            <div>
              {/* Timer */}
              <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{activeSession.model_name} → {activeSession.operation_name} → {activeSession.personnel_name}</div>
                <div style={{ fontSize: '48px', fontWeight: '800', fontFamily: 'monospace', color: 'var(--accent)', letterSpacing: '4px' }}>{formatTimer(timer)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Başlangıç: {new Date(activeSession.start_time).toLocaleTimeString('tr-TR')} <button onClick={() => { const newTime = prompt('Başlangıç saatini düzeltin (HH:MM):', new Date(activeSession.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })); if (newTime) { const [h, m] = newTime.split(':').map(Number); if (!isNaN(h) && !isNaN(m)) { const d = new Date(activeSession.start_time); d.setHours(h, m, 0); setActiveSession(prev => ({ ...prev, start_time: d.toISOString() })); const diff = Math.floor((Date.now() - d.getTime()) / 1000); setTimer(Math.max(0, diff)); addToast('success', 'Başlangıç saati düzeltildi'); } } }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--accent)', textDecoration: 'underline' }}>✏️ düzelt</button></div>
              </div>

              {/* A. SÜREÇ KRİTERLERİ */}
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>📋 Süreç Kriterleri</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <InputField label="Yapılan Adet *" field="total_produced" type="number" placeholder="0" />
                <InputField label="Hatalı Adet" field="defective_count" type="number" placeholder="0" defaultVal="0" />
              </div>

              {dc > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label className="form-label" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>Hata Kaynağı <ClearBtn field="defect_source" defaultVal="operator" /></label>
                    <select className="form-select" value={form.defect_source} onChange={e => setForm({ ...form, defect_source: e.target.value })}>
                      {defectSources.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <InputField label="Hata Açıklaması" field="defect_reason" placeholder="Kısa açıklama..." />
                </div>
              )}

              {dc > 0 && (
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>Hata Tipi Sınıflandırma <ClearBtn field="defect_classification" /></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {defectTypes.map(dt => {
                      const selected = (form.defect_classification || '').split(',').map(s => s.trim()).includes(dt);
                      return (
                        <button key={dt} type="button" onClick={() => {
                          const arr = (form.defect_classification || '').split(',').map(s => s.trim()).filter(Boolean);
                          const next = selected ? arr.filter(x => x !== dt) : [...arr, dt];
                          setForm({ ...form, defect_classification: next.join(', ') });
                        }} style={{
                          padding: '4px 10px', borderRadius: '12px', fontSize: '11px', border: '1px solid var(--border-color)',
                          background: selected ? 'var(--accent)' : 'var(--bg-input)', color: selected ? '#fff' : 'var(--text-primary)',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}>{dt}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>İşlem Durumu <ClearBtn field="lot_change" /></label>
                  <select className="form-select" value={form.lot_change || ''} onChange={e => setForm({ ...form, lot_change: e.target.value })}>
                    <option value="">🟢 Lot değişimi yok</option>
                    <option value="renk">🎨 Renk değişimi</option>
                    <option value="beden">📏 Beden değişimi</option>
                    <option value="ikisi">🔄 Renk + Beden birden</option>
                    <option value="model">👗 Model değişimi</option>
                    <option value="makine">⚙️ Makine değişimi</option>
                    <option value="vardiya">🌙 Vardiya sonu teslim</option>
                  </select>
                </div>
                <InputField label="Kalite Puanı (0-100)" field="quality_score" type="number" placeholder="100" defaultVal="100" />
              </div>

              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', marginTop: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>⏱️ Zaman Kriterleri</div>
              {/* B6: Hızlı Butonlar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {[
                  { label: '☕ Mola', field: 'break_duration_min', color: '#27ae60' },
                  { label: '🔧 Arıza', field: 'machine_down_min', color: '#e74c3c' },
                  { label: '⏳ Bekleme', field: 'material_wait_min', color: '#f39c12' },
                  { label: '😴 Pasif', field: 'passive_time_min', color: '#9b59b6' },
                ].map(btn => (
                  <div key={btn.field} style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: btn.color, minWidth: '60px' }}>{btn.label}</span>
                    {[5, 10, 15, 30].map(v => (
                      <button key={v} type="button" onClick={() => setForm(f => ({ ...f, [btn.field]: String((parseInt(f[btn.field]) || 0) + v) }))}
                        style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '10px', border: `1px solid ${btn.color}30`, background: `${btn.color}15`, color: btn.color, cursor: 'pointer', fontWeight: '700' }}>+{v}</button>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                <InputField label="Mola (dk)" field="break_duration_min" type="number" placeholder="0" defaultVal="0" />
                <InputField label="Arıza (dk)" field="machine_down_min" type="number" placeholder="0" defaultVal="0" />
                <InputField label="Bekleme (dk)" field="material_wait_min" type="number" placeholder="0" defaultVal="0" />
                <InputField label="Pasif (dk)" field="passive_time_min" type="number" placeholder="0" defaultVal="0" />
              </div>

              {/* HATA FOTOĞRAFI — sadece hatalı adet > 0 ise göster */}
              {dc > 0 && (
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    📸 Hata Fotoğrafı
                    {form.defect_photo && <button type="button" onClick={() => setForm(f => ({ ...f, defect_photo: '' }))} style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', borderRadius: '4px', cursor: 'pointer' }}>❌ Kaldır</button>}
                  </label>
                  {form.defect_photo ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={form.defect_photo} alt="Hata fotoğrafı" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: '1px dashed rgba(231,76,60,0.4)', background: 'rgba(231,76,60,0.04)', cursor: 'pointer', fontSize: '12px', color: '#e74c3c' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        try {
                          const fd = new FormData(); fd.append('file', file); fd.append('type', 'defect');
                          const r = await fetch('/api/upload', { method: 'POST', body: fd });
                          const d = await r.json();
                          if (d.path) setForm(f => ({ ...f, defect_photo: d.path }));
                        } catch { }
                      }} />
                      📷 Fotoğraf Seç / Çek
                    </label>
                  )}
                </div>
              )}

              {/* Not */}
              <InputField label="📝 Not / Açıklama" field="notes" placeholder="İsteğe bağlı not..." />

              {/* D. OTOMATİK HESAPLAMALAR */}
              <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(13,124,102,0.08), rgba(52,152,219,0.08))', borderRadius: 'var(--radius-md)', marginTop: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase' }}>📊 Otomatik Hesaplamalar</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: fpy >= 95 ? '#2ecc71' : fpy >= 85 ? '#f39c12' : '#e74c3c' }}>%{fpy.toFixed(1)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>FPY (İlk Geçiş)</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>{netWorkMin.toFixed(1)} dk</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Net Çalışma</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>{unitTimeSec.toFixed(1)} sn</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Birim Süre</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#C5A038' }}>{unitValue.toFixed(2)} ₺</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>İşlem Değeri</div>
                  </div>
                </div>
              </div>

              {/* Butonlar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => { setActiveSession(null); setTimer(0); setForm({ total_produced: '', defective_count: '0', defect_reason: '', defect_source: 'operator', machine_down_min: '0', material_wait_min: '0', break_duration_min: '0', passive_time_min: '0', lot_change: '', quality_score: '100', defect_classification: '', notes: '' }); }} style={{ padding: '14px' }}>🗑️ İptal</button>
                <button className="btn btn-danger btn-lg" onClick={handleStop} style={{ padding: '14px', fontSize: '16px' }}>✅ TAMAMLA & KAYDET</button>
              </div>
            </div>
          )}
        </div>

        {/* ── BUGÜNÜN KAYITLARI ── */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className="card-title">📋 Bugünün Üretim Kayıtları ({filteredLogs.length}{filteredLogs.length !== logs.length ? ` / ${logs.length}` : ''})</h3>
            {logs.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select className="form-select" value={tableFilter.personnel} onChange={e => setTableFilter(p => ({ ...p, personnel: e.target.value }))} style={{ fontSize: '11px', padding: '4px 6px', minWidth: '120px' }}>
                  <option value="">Tüm Personel</option>
                  {[...new Set(logs.map(l => l.personnel_id))].map(pid => {
                    const p = logs.find(l => l.personnel_id === pid);
                    return <option key={pid} value={pid}>{p?.personnel_name}</option>;
                  })}
                </select>
                <select className="form-select" value={tableFilter.model} onChange={e => setTableFilter(p => ({ ...p, model: e.target.value }))} style={{ fontSize: '11px', padding: '4px 6px', minWidth: '120px' }}>
                  <option value="">Tüm Modeller</option>
                  {[...new Set(logs.map(l => l.model_id))].map(mid => {
                    const m = logs.find(l => l.model_id === mid);
                    return <option key={mid} value={mid}>{m?.model_code}</option>;
                  })}
                </select>
                {(tableFilter.personnel || tableFilter.model) && <button className="btn btn-sm" onClick={() => setTableFilter({ personnel: '', model: '' })} style={{ fontSize: '11px', padding: '3px 8px' }}>✕ Temizle</button>}
              </div>
            )}
          </div>

          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏭</div>
              <div>{logs.length > 0 ? 'Filtre sonucu boş.' : 'Bugün henüz üretim kaydı yok.'}</div>
              {logs.length === 0 && <div style={{ fontSize: '12px', marginTop: '4px' }}>Yukarıdan yeni üretim başlatabilirsiniz.</div>}
            </div>
          ) : (
            <div className="table-wrapper"><table className="table"><thead><tr>
              <th>Personel</th><th>Model</th><th>İşlem</th><th>Adet</th><th>Hata</th><th>FPY</th><th>Süre</th><th>Değer ₺</th><th>İşlemler</th>
            </tr></thead><tbody>
                {filteredLogs.map(log => {
                  const duration = log.end_time ? Math.floor((new Date(log.end_time) - new Date(log.start_time)) / 60000) : 0;
                  const value = log.unit_value || ((log.total_produced || 0) * (log.unit_price || 0));
                  const logFpy = log.total_produced > 0 ? ((log.total_produced - (log.defective_count || 0)) / log.total_produced * 100) : 100;
                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: '600' }}>{log.personnel_name}</td>
                      <td><code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{log.model_code}</code></td>
                      <td>{log.operation_name}</td>
                      <td style={{ fontWeight: '700' }}>{log.total_produced}</td>
                      <td>{log.defective_count > 0 ? (<span className="badge badge-danger" title={log.defect_reason}>{log.defective_count}</span>) : '✔'}</td>
                      <td><span className={`badge ${logFpy >= 95 ? 'badge-success' : logFpy >= 85 ? 'badge-warning' : 'badge-danger'}`}>%{logFpy.toFixed(0)}</span></td>
                      <td style={{ fontSize: '13px' }}>{duration} dk</td>
                      <td style={{ fontWeight: '600', color: 'var(--accent)' }}>{value.toFixed(2)} ₺</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-sm" onClick={() => openEditProduction(log)} title="Düzenle" style={{ padding: '4px 8px', fontSize: '12px' }}>✏️</button>
                          <button className="btn btn-sm" onClick={() => handleDeleteLog(log.id)} title="Sil" style={{ padding: '4px 8px', fontSize: '12px' }}>🗑️</button>
                          <button className="btn btn-sm" onClick={() => openProdAuditHistory(log.id)} title="Geçmiş" style={{ padding: '4px 8px', fontSize: '12px' }}>📜</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody></table></div>
          )}
        </div>

      </div>

      {/* ── DÜZENLEME MODALI ── */}
      {editProduction && (
        <EditModal title={`Üretim #${editProduction.id} Düzenle`} onClose={() => setEditProduction(null)} onSave={async (id, formData) => {
          try {
            const res = await fetch(`/api/production/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            if (!res.ok) throw new Error('Güncelleme hatası');
            // Refresh logs
            const today = new Date().toISOString().slice(0, 10);
            const logsRes = await fetch(`/api/production?date=${today}`);
            const data = await logsRes.json();
            setLogs(Array.isArray(data) ? data : []);
            addToast('success', 'Kayıt güncellendi');
          } catch (err) { addToast('error', err.message); }
        }} record={editProduction} tableName="production_logs" fields={[
          { key: 'total_produced', label: 'Yapılan Adet', type: 'number' },
          { key: 'defective_count', label: 'Hatalı Adet', type: 'number' },
          { key: 'defect_reason', label: 'Hata Nedeni' },
          { key: 'quality_score', label: 'Kalite Puanı', type: 'number' },
          { key: 'break_duration_min', label: 'Mola (dk)', type: 'number' },
          { key: 'machine_down_min', label: 'Arıza (dk)', type: 'number' },
          { key: 'material_wait_min', label: 'Bekleme (dk)', type: 'number' },
          { key: 'passive_time_min', label: 'Pasif (dk)', type: 'number' },
          { key: 'notes', label: 'Not' },
        ]} />
      )}

      {/* ── MEDYA MODAL ── */}
      {showMediaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowMediaModal(null)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{showMediaModal.type === 'video' ? '📹' : showMediaModal.type === 'audio' ? '🎤' : '📸'} {showMediaModal.title}</h3>
              <button onClick={() => setShowMediaModal(null)} style={{ background: 'rgba(231,76,60,0.15)', border: 'none', color: '#e74c3c', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              {showMediaModal.type === 'video' && (
                <video controls autoPlay style={{ width: '100%', maxHeight: '500px', borderRadius: '12px', background: '#000' }}>
                  <source src={showMediaModal.src} />
                </video>
              )}
              {showMediaModal.type === 'audio' && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎤</div>
                  <audio controls autoPlay style={{ width: '100%' }}>
                    <source src={showMediaModal.src} />
                  </audio>
                </div>
              )}
              {showMediaModal.type === 'image' && (
                <img src={showMediaModal.src} alt={showMediaModal.title} style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '12px' }} />
              )}
            </div>
          </div>
        </div>
      )}

      {prodAuditHistory && (
        <AuditTrailModal data={prodAuditData} onClose={() => setProdAuditHistory(null)} title={`Üretim #${prodAuditHistory} Düzenme Geçmişi`} />
      )}
    </>
  );
}




// ========== PRİM SAYFASI ==========

function PrimPage({ personnel, addToast }) {
  const now = new Date();
  const [ay, setAy] = useState(now.getMonth() + 1);
  const [yil, setYil] = useState(now.getFullYear());
  const [primOrani, setPrimOrani] = useState(30);
  const [primler, setPrimler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hesaplaniyor, setHesaplaniyor] = useState(false);
  const [detay, setDetay] = useState(null);
  const AYLAR = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
  const loadPrimler = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch('/api/prim?ay=' + ay + '&yil=' + yil); const d = await r.json(); setPrimler(Array.isArray(d) ? d : []); }
    catch { setPrimler([]); } finally { setLoading(false); }
  }, [ay, yil]);
  useEffect(() => { loadPrimler(); }, [loadPrimler]);
  const hesapla = async () => {
    setHesaplaniyor(true);
    try {
      const r = await fetch('/api/prim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ay, yil, prim_orani: primOrani }) });
      const d = await r.json();
      if (d.success) { addToast('success', d.personel_sayisi + ' personel icin prim hesaplandi'); loadPrimler(); }
      else { addToast('error', d.error || 'Hesaplama hatasi'); }
    } catch { addToast('error', 'Baglanti hatasi'); } finally { setHesaplaniyor(false); }
  };
  const onayla = async (id, durum) => {
    try {
      const r = await fetch('/api/prim', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, onay_durumu: durum }) });
      if (r.ok) { addToast('success', durum === 'onaylandi' ? 'Prim onaylandi' : 'Prim reddedildi'); loadPrimler(); }
    } catch { addToast('error', 'Guncelleme hatasi'); }
  };
  const toplamPrim = primler.reduce((t, p) => t + (p.prim_tutari || 0), 0);
  const toplamKatki = primler.reduce((t, p) => t + (p.katki_degeri || 0), 0);
  const onaylanan = primler.filter(p => p.onay_durumu === 'onaylandi').length;
  const durumRenk = { hesaplandi: '#f39c12', onaylandi: '#27ae60', reddedildi: '#e74c3c', odendi: '#3498db' };
  const durumLabel = { hesaplandi: 'Hesaplandi', onaylandi: 'Onaylandi', reddedildi: 'Reddedildi', odendi: 'Odendi' };
  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Prim &amp; Tesvik Sistemi</h1>
        <div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="form-select" value={ay} onChange={e => setAy(+e.target.value)} style={{ minWidth: '100px' }}>
            {AYLAR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-select" value={yil} onChange={e => setYil(+e.target.value)}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Prim %</span>
          <input type="number" min={1} max={100} value={primOrani} onChange={e => setPrimOrani(+e.target.value)}
            style={{ width: '60px', padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', textAlign: 'center' }} />
          <button onClick={hesapla} disabled={hesaplaniyor}
            style={{ padding: '8px 16px', background: hesaplaniyor ? 'rgba(212,168,71,0.3)' : 'var(--accent)', color: hesaplaniyor ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>
            {hesaplaniyor ? 'Hesaplaniyor...' : 'Hesapla'}
          </button>
        </div>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Toplam Katki', value: '&#x20BA;' + toplamKatki.toLocaleString('tr-TR', { maximumFractionDigits: 0 }), color: '#3498db', icon: '&#x1F4B0;' },
            { label: 'Dagitilacak Prim', value: '&#x20BA;' + toplamPrim.toLocaleString('tr-TR', { maximumFractionDigits: 0 }), color: '#27ae60', icon: '&#x1F3C6;' },
            { label: 'Personel', value: primler.length + ' kisi', color: '#9b59b6', icon: '&#x1F465;' },
            { label: 'Onaylanan', value: onaylanan + '/' + primler.length, color: '#f39c12', icon: '&#x2705;' },
          ].map((k, i) => (
            <div key={i} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid ' + k.color + '33' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: k.icon + ' ' + k.label }} />
              <div style={{ fontSize: '20px', fontWeight: '800', color: k.color }} dangerouslySetInnerHTML={{ __html: k.value }} />
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: '14px' }}>Personel Prim Dagilimi  {AYLAR[ay - 1]} {yil}</b>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Formul: (Katki - Maas) x %{primOrani}</span>
          </div>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Yukleniyor...</div>
          ) : primler.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}></div>
              <div style={{ fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>Bu ay icin prim kaydi yok</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Hesapla butonuna basin</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    {['#', 'Personel', 'Uretim', 'FPY', 'Katki', 'Maas', 'Fark', 'Prim', 'Durum', 'Islem'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...primler].sort((a, b) => (b.prim_tutari || 0) - (a.prim_tutari || 0)).map((p, i) => {
                    const fark = (p.katki_degeri || 0) - (p.maas_maliyeti || 0);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setDetay(detay && detay.id === p.id ? null : p)}>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: i < 3 ? '#D4A847' : 'var(--text-muted)' }}>{i < 3 ? ['', '', ''][i] : i + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: '600' }}>{p.personel_adi || 'Personel #' + p.personel_id}</td>
                        <td style={{ padding: '10px 12px' }}>{(p.toplam_uretilen || 0).toLocaleString('tr-TR')}</td>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: (p.fpy_yuzde || 0) >= 90 ? '#27ae60' : (p.fpy_yuzde || 0) >= 75 ? '#f39c12' : '#e74c3c' }}>%{(p.fpy_yuzde || 0).toFixed(1)}</td>
                        <td style={{ padding: '10px 12px', color: '#3498db', fontWeight: '600' }}>₺{(p.katki_degeri || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                        <td style={{ padding: '10px 12px', color: '#e74c3c' }}>₺{(p.maas_maliyeti || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: fark > 0 ? '#27ae60' : '#e74c3c' }}>{fark > 0 ? '+' : ''}₺{fark.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                        <td style={{ padding: '10px 12px', fontWeight: '800', color: '#D4A847', fontSize: '15px' }}>{(p.prim_tutari || 0) > 0 ? '₺' + (p.prim_tutari || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : ''}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: (durumRenk[p.onay_durumu] || '#95a5a6') + '22', color: durumRenk[p.onay_durumu] || '#95a5a6', fontWeight: '600' }}>
                            {durumLabel[p.onay_durumu] || p.onay_durumu}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                          {p.onay_durumu === 'hesaplandi' && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => onayla(p.id, 'onaylandi')} style={{ padding: '4px 8px', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '6px', color: '#27ae60', cursor: 'pointer', fontSize: '11px', fontWeight: '700', fontFamily: 'inherit' }}>Onayla</button>
                              <button onClick={() => onayla(p.id, 'reddedildi')} style={{ padding: '4px 8px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '6px', color: '#e74c3c', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>X</button>
                            </div>
                          )}
                          {p.onay_durumu === 'onaylandi' && (
                            <button onClick={() => onayla(p.id, 'odendi')} style={{ padding: '4px 8px', background: 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: '6px', color: '#3498db', cursor: 'pointer', fontSize: '11px', fontWeight: '700', fontFamily: 'inherit' }}>Odendi</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {detay && (
          <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '2px solid rgba(212,168,71,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <b style={{ fontSize: '14px' }}>{detay.personel_adi}  Prim Detayi</b>
              <button onClick={() => setDetay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }}>X</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
              {[
                { label: 'Uretim', value: (detay.toplam_uretilen || 0).toLocaleString('tr-TR') + ' adet' },
                { label: 'Hatali', value: (detay.toplam_hatali || 0) + ' adet' },
                { label: 'FPY', value: '%' + (detay.fpy_yuzde || 0).toFixed(1) },
                { label: 'Katki Degeri', value: '₺' + (detay.katki_degeri || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) },
                { label: 'Maas Maliyeti', value: '₺' + (detay.maas_maliyeti || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) },
                { label: 'Fazla Deger', value: '₺' + (detay.katki_maas_farki || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) },
                { label: 'Prim', value: '₺' + (detay.prim_tutari || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) },
                { label: 'Durum', value: durumLabel[detay.onay_durumu] || detay.onay_durumu },
              ].map((it, i) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{it.label}</div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{it.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ========== RAPORLAR SAYFASI ==========

function ReportsPage({ models, personnel, addToast }) {
  const now = new Date();
  const [raporTab, setRaporTab] = useState('ozet');
  const [ay, setAy] = useState(now.getMonth() + 1);
  const [yil, setYil] = useState(now.getFullYear());
  const [ozet, setOzet] = useState(null);
  const [verimlilik, setVerimlilik] = useState([]);
  const [karlilik, setKarlilik] = useState([]);
  const [kararlar, setKararlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const AYLAR = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ozetR, veriR, karR, kararR] = await Promise.allSettled([
        fetch('/api/rapor/ay-ozet?ay=' + ay + '&yil=' + yil).then(r => r.json()),
        fetch('/api/rapor/personel-verimlilik?ay=' + ay + '&yil=' + yil).then(r => r.json()),
        fetch('/api/rapor/model-karlilik?ay=' + ay + '&yil=' + yil).then(r => r.json()),
        fetch('/api/rapor/karar-arsivi?limit=20').then(r => r.json()),
      ]);
      if (ozetR.status === 'fulfilled') {
        const d = ozetR.value;
        // ay-ozet API: fpy → fpy_ortalama, toplam_iscilik → iscilik_maliyeti normalization
        setOzet(d && !d.error ? {
          ...d,
          fpy_ortalama: d.fpy ?? d.fpy_ortalama ?? 0,
          toplam_gelir: d.toplam_gelir ?? 0,
          toplam_gider: d.toplam_gider ?? 0,
          net_kar: d.net_kar ?? 0,
          kar_marji: d.kar_marji ?? 0,
          aktif_personel: d.aktif_personel ?? 0,
          toplam_uretim: d.toplam_uretim ?? 0,
          toplam_hata: d.toplam_hata ?? 0,
          tamamlanan_siparis: d.tamamlanan_siparis ?? 0,
          iscilik_maliyeti: d.toplam_iscilik ?? d.iscilik_maliyeti ?? 0,
          hammadde_maliyeti: d.hammadde_tahmini ?? d.hammadde_maliyeti ?? 0,
          sabit_gider: d.toplam_gider ?? 0,
          siparis_geliri: d.toplam_gelir ?? 0,
        } : null);
      }
      if (veriR.status === 'fulfilled') {
        const d = veriR.value;
        // personel-verimlilik API: { personeller: [...], ozet: {...} }
        const arr = Array.isArray(d) ? d : (d && Array.isArray(d.personeller) ? d.personeller : []);
        // Normalize field names: ad → name, toplam_uretilen → toplam_uretim, fpy → fpy_yuzde
        setVerimlilik(arr.map(p => ({
          ...p,
          name: p.name || p.ad || '',
          toplam_uretim: p.toplam_uretim ?? p.toplam_uretilen ?? 0,
          fpy: p.fpy ?? p.fpy_yuzde ?? 0,
          fpy_yuzde: p.fpy_yuzde ?? p.fpy ?? 0,
          hata: p.hata ?? p.toplam_hatali ?? p.defective_count ?? 0,
          katki_degeri: p.katki_degeri ?? 0,
        })));
      }
      if (karR.status === 'fulfilled') setKarlilik(Array.isArray(karR.value) ? karR.value : (karR.value?.modeller || []));
      if (kararR.status === 'fulfilled') setKararlar(Array.isArray(kararR.value) ? kararR.value : (kararR.value?.kayitlar || kararR.value?.kararlar || []));
    } catch { } finally { setLoading(false); }
  }, [ay, yil]);

  useEffect(() => { loadAll(); }, [loadAll]);
  const raporTabs = [
    { id: 'ozet', label: 'Aylik Ozet' },
    { id: 'personel', label: 'Personel Verimliligi' },
    { id: 'model', label: 'Model Karliligi' },
    { id: 'karar', label: 'Karar Arsivi' },
  ];
  const karSinyali = ozet && ozet.net_kar > 0 ? '#27ae60' : ozet && ozet.net_kar < 0 ? '#e74c3c' : '#f39c12';
  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Raporlar &amp; Analiz</h1>
        <div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="form-select" value={ay} onChange={e => setAy(+e.target.value)} style={{ minWidth: '100px' }}>
            {AYLAR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-select" value={yil} onChange={e => setYil(+e.target.value)}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={loadAll} style={{ padding: '8px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>Yenile</button>
        </div>
      </div>
      <div className="page-content">
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {raporTabs.map(t => (
            <button key={t.id} type="button" onClick={() => setRaporTab(t.id)}
              style={{
                padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                border: raporTab === t.id ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                background: raporTab === t.id ? 'var(--accent-soft)' : 'var(--bg-input)',
                color: raporTab === t.id ? 'var(--accent)' : 'var(--text-secondary)'
              }}>
              {t.label}
            </button>
          ))}
        </div>
        {loading && <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Yukleniyor...</div>}
        {raporTab === 'ozet' && !loading && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Gelir', value: '₺' + ((ozet && ozet.toplam_gelir) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }), color: '#27ae60' },
                { label: 'Gider', value: '₺' + ((ozet && ozet.toplam_gider) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }), color: '#e74c3c' },
                { label: 'Net Kar', value: '₺' + Math.abs((ozet && ozet.net_kar) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }), color: karSinyali },
                { label: 'Kar Marji', value: '%' + ((ozet && ozet.kar_marji) || 0).toFixed(1), color: karSinyali },
              ].map((k, i) => (
                <div key={i} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid ' + k.color + '33' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <b style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>Uretim Istatistikleri</b>
                {[
                  { label: 'Toplam Uretim', value: ((ozet && ozet.toplam_uretim) || 0).toLocaleString('tr-TR') + ' adet' },
                  { label: 'Toplam Hata', value: ((ozet && ozet.toplam_hata) || 0) + ' adet', color: '#e74c3c' },
                  { label: 'FPY Ort.', value: '%' + ((ozet && ozet.fpy_ortalama) || 0).toFixed(1), color: ((ozet && ozet.fpy_ortalama) || 0) >= 90 ? '#27ae60' : '#f39c12' },
                  { label: 'Aktif Personel', value: ((ozet && ozet.aktif_personel) || 0) + ' kisi' },
                  { label: 'Tamamlanan Siparis', value: ((ozet && ozet.tamamlanan_siparis) || 0) + ' adet' },
                ].map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{it.label}</span>
                    <b style={{ color: it.color || 'var(--text-primary)' }}>{it.value}</b>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <b style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>Gelir / Gider Detayi</b>
                {[
                  { label: '+ Siparis Geliri', value: (ozet && ozet.siparis_geliri) || 0, color: '#27ae60' },
                  { label: '- Iscilik', value: (ozet && ozet.iscilik_maliyeti) || 0, color: '#e74c3c' },
                  { label: '- Hammadde', value: (ozet && ozet.hammadde_maliyeti) || 0, color: '#e74c3c' },
                  { label: '- Sabit Gider', value: (ozet && ozet.sabit_gider) || 0, color: '#e74c3c' },
                  { label: '= Net Kar', value: (ozet && ozet.net_kar) || 0, color: karSinyali },
                ].map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                    <span>{it.label}</span>
                    <b style={{ color: it.color }}>₺{Math.abs(it.value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {raporTab === 'personel' && !loading && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <b style={{ fontSize: '14px' }}>Personel Performans Raporu  {AYLAR[ay - 1]} {yil}</b>
            </div>
            {verimlilik.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Bu ay icin veri yok</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ background: 'var(--bg-input)' }}>
                    {['Sira', 'Personel', 'Uretim', 'Hata', 'FPY', 'Katki', 'Performans'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...verimlilik].sort((a, b) => (b.toplam_uretim || b.total_produced || 0) - (a.toplam_uretim || a.total_produced || 0)).map((p, i) => {
                      const fpy = p.fpy || p.fpy_yuzde || 0;
                      const pr = fpy >= 95 ? '#27ae60' : fpy >= 85 ? '#3498db' : fpy >= 70 ? '#f39c12' : '#e74c3c';
                      const pl = fpy >= 95 ? 'Mukemmel' : fpy >= 85 ? 'Iyi' : fpy >= 70 ? 'Orta' : 'Dusuk';
                      return (
                        <tr key={p.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: '700', color: i < 3 ? '#D4A847' : 'var(--text-muted)' }}>{i + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: '600' }}>{p.name || p.personel_adi || '#' + (p.personnel_id || '')}</td>
                          <td style={{ padding: '10px 12px' }}>{(p.toplam_uretim || p.total_produced || 0).toLocaleString('tr-TR')}</td>
                          <td style={{ padding: '10px 12px', color: (p.hata || p.defective_count || 0) > 0 ? '#e74c3c' : 'var(--text-muted)' }}>{p.hata || p.defective_count || 0}</td>
                          <td style={{ padding: '10px 12px', fontWeight: '700', color: pr }}>%{fpy.toFixed(1)}</td>
                          <td style={{ padding: '10px 12px', color: '#3498db' }}>₺{(p.katki_degeri || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '10px 12px' }}><span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: pr + '22', color: pr, fontWeight: '700' }}>{pl}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {raporTab === 'model' && !loading && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <b style={{ fontSize: '14px' }}>Model Karliligi  {AYLAR[ay - 1]} {yil}</b>
            </div>
            {karlilik.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Bu ay icin model karliligi verisi yok</div>
            ) : (
              <div style={{ padding: '16px' }}>
                {[...karlilik].sort((a, b) => (b.net_kar || b.kar || 0) - (a.net_kar || a.kar || 0)).map((m, i) => {
                  const kar = m.net_kar || m.kar || 0;
                  const kr = kar > 0 ? '#27ae60' : kar < 0 ? '#e74c3c' : '#f39c12';
                  const mxk = Math.max(...karlilik.map(x => Math.abs(x.net_kar || x.kar || 0)));
                  const bar = mxk > 0 ? (Math.abs(kar) / mxk) * 100 : 0;
                  return (
                    <div key={m.id || i} style={{ marginBottom: '12px', padding: '14px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid ' + kr + '33' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px' }}>{i + 1}. {m.model_adi || m.name || 'Model #' + m.model_id}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '800', color: kr, fontSize: '16px' }}>₺{Math.abs(kar).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{kar >= 0 ? 'Kar' : 'Zarar'}</div>
                        </div>
                      </div>
                      <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: bar + '%', background: kr, borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {raporTab === 'karar' && !loading && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <b style={{ fontSize: '14px' }}>Karar Arsivi</b>
            </div>
            {kararlar.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Henuz karar kaydi yok</div>
            ) : (
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                {kararlar.map((k, i) => (
                  <div key={k.id || i} style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: '10px', borderLeft: '3px solid ' + (k.sonuc === 'basarili' ? '#27ae60' : k.sonuc === 'basarisiz' ? '#e74c3c' : '#f39c12') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{k.karar_tipi || k.tip || 'Karar'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k.created_at ? new Date(k.created_at).toLocaleDateString('tr-TR') : ''}</span>
                    </div>
                    {k.sistem_onerisi && <div style={{ fontSize: '12px', marginBottom: '6px' }}><b style={{ color: '#3498db' }}>Sistem Onerisi:</b> {k.sistem_onerisi}</div>}
                    {k.yapilan_islem && <div style={{ fontSize: '12px', marginBottom: '6px' }}><b style={{ color: '#f39c12' }}>Yapilan:</b> {k.yapilan_islem}</div>}
                    {k.sonuc_notu && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{k.sonuc_notu}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ========== ORDERS PAGE ==========

function OrdersPage({ models, addToast }) {

  const emptyForm = {

    customer_id: '', customer_name: '', model_id: '', model_name: '',

    quantity: '', unit_price: '', delivery_date: '', priority: 'normal',

    fabric_type: '', color: '', sizes: '', size_distribution: '',

    color_details: '', model_description: '', accessories: '', lining_info: '',

    quality_criteria: '', stitch_details: '', washing_instructions: '',

    sample_status: 'yok', delivery_method: '', packaging: '',

    label_info: '', special_requests: '', notes: '', product_image: ''

  };

  const [orders, setOrders] = useState([]);

  const [customers, setCustomers] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({ ...emptyForm });

  const [editOrder, setEditOrder] = useState(null);

  const [editForm, setEditForm] = useState({});

  const [detailOrder, setDetailOrder] = useState(null);

  const voice = useVoiceInput(setForm);

  const editVoice = useVoiceInput(setEditForm);



  const load = useCallback(async () => {

    try {

      const [r1, r2] = await Promise.all([fetch('/api/orders'), fetch('/api/customers')]);

      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);

      setOrders(Array.isArray(d1) ? d1 : []);

      setCustomers(Array.isArray(d2) ? d2 : []);

    } catch { setOrders([]); setCustomers([]); }

  }, []);

  useEffect(() => { load(); }, [load]);



  const handleSave = async (e) => {

    e.preventDefault();

    if (!form.quantity) { addToast('error', 'Adet zorunludur'); return; }

    const isNewC = form.customer_id === '__new__';

    const isNewM = form.model_id === '__new__';

    const sc = !isNewC ? customers.find(c => c.id === parseInt(form.customer_id)) : null;

    const sm = !isNewM ? models.find(m => m.id === parseInt(form.model_id)) : null;

    const payload = {

      ...form,

      customer_id: isNewC ? null : (form.customer_id || null),

      customer_name: isNewC ? form.customer_name : (sc?.name || form.customer_name || ''),

      model_id: isNewM ? null : (form.model_id || null),

      model_name: isNewM ? form.model_name : (sm?.name || form.model_name || '')

    };

    try {

      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Hata'); }

      await load(); setShowModal(false); setForm({ ...emptyForm }); addToast('success', 'Sipariş oluşturuldu!');

    } catch (err) { addToast('error', err.message || 'Hata oluştu'); }

  };



  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Audit trail
      const changes = [];
      Object.keys(editForm).forEach(key => {
        const oldVal = String(editOrder[key] ?? '');
        const newVal = String(editForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'orders', record_id: editOrder.id, changes, changed_by: 'admin' })
        });
      }
      const res = await fetch(`/api/orders/${editOrder.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
      if (!res.ok) throw new Error('Hata');
      await load(); setEditOrder(null); addToast('success', 'Güncellendi');
    } catch { addToast('error', 'Güncellenemedi'); }
  };



  const updateStatus = async (id, ns) => {

    try { await fetch(`/api/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: ns }) }); await load(); addToast('success', `Durum güncellendi`); } catch { addToast('error', 'Güncellenemedi'); }

  };



  const handleDelete = async (id, orderNo) => {

    const reason = prompt(`"${orderNo}" siparişini arşivlemek istediğinize emin misiniz?\n\nArşivleme sebebini yazın (zorunlu):`);

    if (reason === null) return; // İptal

    if (!reason.trim()) { addToast('error', 'Arşivleme sebebi boş olamaz'); return; }

    try {

      const res = await fetch(`/api/orders/${id}`, {

        method: 'DELETE',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ reason: reason.trim(), deleted_by: 'yönetici' })

      });

      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }

      await load();

      addToast('success', `"${orderNo}" arşivlendi. Kayıt kalıcı olarak saklanıyor.`);

    } catch (err) { addToast('error', err.message || 'Arşivlenemedi'); }

  };



  const openEdit = (o) => {

    setEditOrder(o);

    const ef = {};

    Object.keys(emptyForm).forEach(k => ef[k] = (o[k] !== undefined && o[k] !== null) ? String(o[k]) : emptyForm[k]);

    ef.status = o.status || 'siparis_alindi';

    setEditForm(ef);

  };



  const sLabels = { siparis_alindi: ' Sipariş Alındı', onaylandi: ' Onaylandı', uretimde: ' Üretimde', tamamlandi: ' Tamamlandı', sevk_edildi: ' Sevk Edildi' };

  const sColors = { siparis_alindi: '#3498db', onaylandi: '#2ecc71', uretimde: '#f39c12', tamamlandi: '#27ae60', sevk_edildi: '#8e44ad' };

  const nxStatus = { siparis_alindi: 'onaylandi', onaylandi: 'uretimde', uretimde: 'tamamlandi', tamamlandi: 'sevk_edildi' };

  const nxLabel = { siparis_alindi: ' Onayla', onaylandi: ' Üretime Al', uretimde: ' Tamamla', tamamlandi: ' Sevk Et' };

  const pLabels = { acil: ' Acil', yuksek: ' Yüksek', normal: ' Normal', dusuk: ' Düşük' };

  const smLabels = { yok: '', beklemede: ' Beklemede', onaylandi: ' Onaylı', reddedildi: ' Red' };



  // Alan bileşeni: mikrofon + temizle butonu

  const VF = ({ label, fk, type = 'text', ph = '', req, fs, setFs, vh, ta, step }) => (

    <div className="form-group">

      <label className="form-label">{label}{req ? ' *' : ''}</label>

      <div style={{ position: 'relative' }}>

        {ta

          ? <textarea className="form-input" rows="2" style={{ paddingRight: '90px', resize: 'vertical' }} placeholder={ph} value={fs[fk] || ''} onChange={e => setFs({ ...fs, [fk]: e.target.value })} />

          : <input className="form-input" type={type} step={step} style={{ paddingRight: '90px' }} placeholder={ph} value={fs[fk] || ''} onChange={e => setFs({ ...fs, [fk]: e.target.value })} required={req} />}

        <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '2px', zIndex: 2 }}>

          {fs[fk] && <button type="button" onClick={() => setFs({ ...fs, [fk]: '' })} title="Temizle" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#e74c3c', padding: '2px 3px', borderRadius: '4px' }}>✕</button>}

          <button type="button" onClick={vh.toggleLang} title={vh.voiceLang === 'tr-TR' ? 'Türkçe → Arapça' : 'Arapça → Türkçe'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', padding: '1px' }}>{vh.voiceLang === 'tr-TR' ? '🇹🇷' : '🇸🇦'}</button>

          <button type="button" onClick={() => vh.startVoice(fk)} title={vh.listeningField === fk ? 'Durdur' : 'Sesle giriş'} style={{ background: vh.listeningField === fk ? '#e74c3c' : 'transparent', color: vh.listeningField === fk ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px' }}>{vh.listeningField === fk ? '⏹' : '🎤'}</button>

        </div>

      </div>

    </div>

  );



  // Müşteri/Model combo (dropdown + yeni yazma)

  const CustomerField = ({ f, setF, v }) => (

    <div className="form-group">

      <label className="form-label">Müşteri</label>

      {f.customer_id === '__new__' ? (

        <div style={{ display: 'flex', gap: '4px' }}>

          <div style={{ flex: 1, position: 'relative' }}>

            <input className="form-input" style={{ paddingRight: '90px' }} placeholder="Müşteri adını yazın..." value={f.customer_name || ''} onChange={e => setF({ ...f, customer_name: e.target.value })} />

            <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '2px', zIndex: 2 }}>

              {f.customer_name && <button type="button" onClick={() => setF({ ...f, customer_name: '' })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#e74c3c', padding: '2px' }}>✕</button>}

              <button type="button" onClick={v.toggleLang} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', padding: '1px' }}>{v.voiceLang === 'tr-TR' ? '🇹🇷' : '🇸🇦'}</button>

              <button type="button" onClick={() => v.startVoice('customer_name')} style={{ background: v.listeningField === 'customer_name' ? '#e74c3c' : 'transparent', color: v.listeningField === 'customer_name' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px' }}>{v.listeningField === 'customer_name' ? '⏹' : '🎤'}</button>

            </div>

          </div>

          <button type="button" onClick={() => setF({ ...f, customer_id: '', customer_name: '' })} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>↩ Liste</button>

        </div>

      ) : (

        <select className="form-select" value={f.customer_id} onChange={e => setF({ ...f, customer_id: e.target.value })}>

          <option value="">— Müşteri Seçiniz —</option>

          {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}

          <option value="__new__">✍️ Yeni Müşteri (Elle Yaz)</option>

        </select>

      )}

    </div>

  );



  const ModelField = ({ f, setF, v }) => (

    <div className="form-group">

      <label className="form-label">Model</label>

      {f.model_id === '__new__' ? (

        <div style={{ display: 'flex', gap: '4px' }}>

          <div style={{ flex: 1, position: 'relative' }}>

            <input className="form-input" style={{ paddingRight: '90px' }} placeholder="Model adını yazın..." value={f.model_name || ''} onChange={e => setF({ ...f, model_name: e.target.value })} />

            <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '2px', zIndex: 2 }}>

              {f.model_name && <button type="button" onClick={() => setF({ ...f, model_name: '' })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#e74c3c', padding: '2px' }}>✕</button>}

              <button type="button" onClick={v.toggleLang} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', padding: '1px' }}>{v.voiceLang === 'tr-TR' ? '🇹🇷' : '🇸🇦'}</button>

              <button type="button" onClick={() => v.startVoice('model_name')} style={{ background: v.listeningField === 'model_name' ? '#e74c3c' : 'transparent', color: v.listeningField === 'model_name' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px' }}>{v.listeningField === 'model_name' ? '⏹' : '🎤'}</button>

            </div>

          </div>

          <button type="button" onClick={() => setF({ ...f, model_id: '', model_name: '' })} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>↩ Liste</button>

        </div>

      ) : (

        <select className="form-select" value={f.model_id} onChange={e => setF({ ...f, model_id: e.target.value })}>

          <option value="">— Model Seçiniz —</option>

          {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}

          <option value="__new__">✍️ Yeni Model (Elle Yaz)</option>

        </select>

      )}

    </div>

  );



  const FormFields = ({ f, setF, v, isEdit }) => (<>

    {/* BÖLÜM 1: TEMEL BİLGİLER */}

    <div style={{ background: 'rgba(52,152,219,0.08)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', borderLeft: '3px solid #3498db' }}>

      <div style={{ fontSize: '13px', fontWeight: '700', color: '#3498db', marginBottom: '14px' }}>📋 1. Temel Bilgiler</div>

      <div className="form-row">

        <CustomerField f={f} setF={setF} v={v} />

        <ModelField f={f} setF={setF} v={v} />

      </div>

      <div className="form-row">

        <VF label="Adet" fk="quantity" type="number" req ph="100" fs={f} setFs={setF} vh={v} />

        <VF label="Birim Fiyat (₺)" fk="unit_price" type="number" step="0.01" ph="0.00" fs={f} setFs={setF} vh={v} />

        <div className="form-group"><label className="form-label">Teslim Tarihi</label><input className="form-input" type="date" value={f.delivery_date || ''} onChange={e => setF({ ...f, delivery_date: e.target.value })} /></div>

      </div>

      <div className="form-row">

        <div className="form-group"><label className="form-label">Öncelik</label><select className="form-select" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}><option value="acil">🔴 Acil</option><option value="yuksek">🟠 Yüksek</option><option value="normal">🟢 Normal</option><option value="dusuk">⚪ Düşük</option></select></div>

        {isEdit && <div className="form-group"><label className="form-label">Durum</label><select className="form-select" value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="siparis_alindi">📋 Sipariş Alındı</option><option value="onaylandi">✅ Onaylandı</option><option value="uretimde">🏭 Üretimde</option><option value="tamamlandi">✔️ Tamamlandı</option><option value="sevk_edildi">📦 Sevk Edildi</option></select></div>}

        <VF label="Ürün Görseli (URL)" fk="product_image" ph="https://..." fs={f} setFs={setF} vh={v} />

      </div>

    </div>



    {/* BÖLÜM 2: ÜRÜN & KUMAŞ DETAYLARI */}

    <div style={{ background: 'rgba(212,168,71,0.08)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', borderLeft: '3px solid #D4A847' }}>

      <div style={{ fontSize: '13px', fontWeight: '700', color: '#D4A847', marginBottom: '14px' }}>👗 2. Ürün & Kumaş Detayları</div>

      <VF label="Model Açıklaması / Tarifi" fk="model_description" ta ph="Modelin kesimi, şekli, yaka tipi, kol boyu, detaylar..." fs={f} setFs={setF} vh={v} />

      <div className="form-row">

        <VF label="Kumaş Tipi" fk="fabric_type" ph="Penye, Denim, Poplin, Viskon..." fs={f} setFs={setF} vh={v} />

        <VF label="Ana Renk" fk="color" ph="Siyah, Beyaz, Lacivert..." fs={f} setFs={setF} vh={v} />

      </div>

      <VF label="Renk Detayları / Kombinasyonlar" fk="color_details" ta ph="Hangi renk kaç adet? Pantone kodu var mı? Birden fazla renk varsa hepsini yazın..." fs={f} setFs={setF} vh={v} />

      <div className="form-row">

        <VF label="Bedenler" fk="sizes" ph="XS, S, M, L, XL, XXL" fs={f} setFs={setF} vh={v} />

        <VF label="Beden Dağılımı" fk="size_distribution" ph="S:50, M:100, L:150, XL:80, XXL:20" fs={f} setFs={setF} vh={v} />

      </div>

      <div className="form-row">

        <VF label="Aksesuar / Malzeme" fk="accessories" ph="Düğme tipi, fermuar, rivet, çıtçıt, ip, etiket tipi..." fs={f} setFs={setF} vh={v} />

        <VF label="Astar Bilgisi" fk="lining_info" ph="Astar var mı? Varsa tipi ve rengi..." fs={f} setFs={setF} vh={v} />

      </div>

    </div>



    {/* BÖLÜM 3: KALİTE & ÜRETİM KRİTERLERİ */}

    <div style={{ background: 'rgba(46,204,113,0.08)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', borderLeft: '3px solid #2ecc71' }}>

      <div style={{ fontSize: '13px', fontWeight: '700', color: '#2ecc71', marginBottom: '14px' }}>✅ 3. Kalite & Üretim Kriterleri</div>

      <VF label="Kalite Kriterleri" fk="quality_criteria" ta ph="AQL seviyesi, tolerans değerleri, kabul/ret kriteri, fire oranı..." fs={f} setFs={setF} vh={v} />

      <div className="form-row">

        <VF label="Dikiş Detayları" fk="stitch_details" ph="Dikiş tipi, cm'de dikiş sayısı, overlok..." fs={f} setFs={setF} vh={v} />

        <VF label="Yıkama Talimatları" fk="washing_instructions" ph="30C yıkama, düşük devir, elde yıka..." fs={f} setFs={setF} vh={v} />

      </div>

      <div className="form-group"><label className="form-label">Numune Durumu</label><select className="form-select" value={f.sample_status} onChange={e => setF({ ...f, sample_status: e.target.value })}><option value="yok">— Numune Yok</option><option value="beklemede">⏳ Numune Beklemede</option><option value="onaylandi">✅ Numune Onaylı</option><option value="reddedildi">❌ Numune Reddedildi</option></select></div>

    </div>



    {/* BÖLÜM 4: TESLİMAT & PAKETLEME */}

    <div style={{ background: 'rgba(142,68,173,0.08)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', borderLeft: '3px solid #8e44ad' }}>

      <div style={{ fontSize: '13px', fontWeight: '700', color: '#8e44ad', marginBottom: '14px' }}>📦 4. Teslimat & Paketleme</div>

      <div className="form-row">

        <VF label="Teslimat Şekli" fk="delivery_method" ph="Kargo, elden teslim, araçla..." fs={f} setFs={setF} vh={v} />

        <VF label="Ambalaj Şekli" fk="packaging" ph="Poşet içinde askılı, kutulu, katlanmış..." fs={f} setFs={setF} vh={v} />

      </div>

      <VF label="Etiket Bilgisi" fk="label_info" ph="Marka etiketi, beden etiketi, yıkama etiketi, barkod..." fs={f} setFs={setF} vh={v} />

      <VF label="Özel İstekler" fk="special_requests" ta ph="Müşterinin özel istekleri, dikkat edilmesi gereken noktalar..." fs={f} setFs={setF} vh={v} />

      <VF label="Genel Notlar" fk="notes" ta ph="Ek bilgiler, hatırlatmalar..." fs={f} setFs={setF} vh={v} />

    </div>

  </>);



  const totalRevenue = orders.reduce((s, o) => s + (o.total_price || 0), 0);

  const activeOrders = orders.filter(o => !['tamamlandi', 'sevk_edildi'].includes(o.status)).length;



  return (

    <>

      <div className="topbar"><h1 className="topbar-title">📋 Siparişler</h1><div className="topbar-actions"><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Yeni Sipariş</button></div></div>

      <div className="page-content">

        <div className="stats-grid">

          <div className="stat-card"><div className="stat-icon">🏭</div><div className="stat-value">{orders.length}</div><div className="stat-label">Toplam Sipariş</div></div>

          <div className="stat-card"><div className="stat-icon">🏭</div><div className="stat-value">{activeOrders}</div><div className="stat-label">Aktif Sipariş</div></div>

          <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-value">{orders.reduce((s, o) => s + (o.quantity || 0), 0).toLocaleString('tr-TR')}</div><div className="stat-label">Toplam Adet</div></div>

          <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-value">{totalRevenue.toLocaleString('tr-TR')} ₺</div><div className="stat-label">Toplam Tutar</div></div>

        </div>

        {orders.length === 0 ? (

          <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">Henüz Sipariş Yok</div><div className="empty-state-text">İlk siparişinizi ekleyerek başlayın.</div><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ İlk Siparişi Ekle</button></div></div>

        ) : (

          <div className="table-wrapper"><table className="table"><thead><tr><th>No</th><th>Müşteri</th><th>Model</th><th>Adet</th><th>Toplam</th><th>Teslim</th><th>Öncelik</th><th>Durum</th><th style={{ width: '180px' }}>İşlem</th></tr></thead><tbody>

            {orders.map(o => (

              <tr key={o.id}>

                <td style={{ fontWeight: '700', color: 'var(--accent)' }}>{o.order_no}</td>

                <td>{o.customer_name || o.c_name || '—'}</td>

                <td>{o.model_name || o.m_name || '—'}</td>

                <td style={{ fontWeight: '700' }}>{o.quantity?.toLocaleString('tr-TR')}</td>

                <td style={{ color: 'var(--accent)', fontWeight: '600' }}>{o.total_price?.toLocaleString('tr-TR')} ₺</td>

                <td>{o.delivery_date || '—'}</td>

                <td><span style={{ fontSize: '12px' }}>{pLabels[o.priority] || o.priority}</span></td>

                <td><span className="badge" style={{ background: sColors[o.status] || '#888', color: '#fff', fontSize: '11px' }}>{sLabels[o.status] || o.status}</span></td>

                <td><div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>

                  {nxStatus[o.status] && <button onClick={() => updateStatus(o.id, nxStatus[o.status])} style={{ background: sColors[nxStatus[o.status]], color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{nxLabel[o.status]}</button>}

                  <button onClick={() => setDetailOrder(o)} title="Detay" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>👁️</button>

                  <button onClick={() => openEdit(o)} title="Düzenle" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✏️</button>

                  <button onClick={() => handleDelete(o.id, o.order_no)} title="Arşivle (kalıcı silinmez)" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>🗃️</button>

                </div></td>

              </tr>

            ))}

          </tbody></table></div>

        )}

      </div>



      {/* YENİ SİPARİŞ MODAL */}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="modal-header"><h2 className="modal-title">📋 Yeni Sipariş</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>

        <div style={{ padding: '0 4px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>🎤 Her alana mikrofon butonu ile sesle yazabilirsiniz (🇹🇷/🇸🇦) — ✕ ile alanı temizleyebilirsiniz</div>

        <form onSubmit={handleSave}><FormFields f={form} setF={setForm} v={voice} isEdit={false} />

          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button><button type="submit" className="btn btn-primary">💾 Sipariş Oluştur</button></div>

        </form>

      </div></div>)}



      {/* DÜZENLEME MODAL */}

      {editOrder && (<div className="modal-overlay" onClick={() => setEditOrder(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="modal-header"><h2 className="modal-title">✏️ Düzenle — {editOrder.order_no}</h2><button className="modal-close" onClick={() => setEditOrder(null)}>✕</button></div>

        <form onSubmit={handleUpdate}><FormFields f={editForm} setF={setEditForm} v={editVoice} isEdit={true} />

          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditOrder(null)}>İptal</button><button type="submit" className="btn btn-primary">💾 Güncelle</button></div>

        </form>

      </div></div>)}



      {/* DETAY MODAL */}

      {detailOrder && (<div className="modal-overlay" onClick={() => setDetailOrder(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="modal-header"><h2 className="modal-title">📋 {detailOrder.order_no} — Sipariş Detayı</h2><button className="modal-close" onClick={() => setDetailOrder(null)}>✕</button></div>

        <div style={{ display: 'grid', gap: '6px' }}>

          {detailOrder.product_image && <div style={{ textAlign: 'center', marginBottom: '8px' }}><img src={detailOrder.product_image} alt="Ürün" style={{ maxWidth: '200px', maxHeight: '160px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--border-color)' }} /></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>

            {[['Müşteri', detailOrder.customer_name || detailOrder.c_name], ['Model', detailOrder.model_name || detailOrder.m_name], ['Adet', detailOrder.quantity?.toLocaleString('tr-TR')], ['Birim Fiyat', `${detailOrder.unit_price?.toFixed(2)} ₺`], ['Toplam Tutar', `${detailOrder.total_price?.toLocaleString('tr-TR')} ₺`], ['Teslim Tarihi', detailOrder.delivery_date], ['Öncelik', pLabels[detailOrder.priority]], ['Durum', sLabels[detailOrder.status]], ['Numune', smLabels[detailOrder.sample_status]], ['Kumaş', detailOrder.fabric_type], ['Renk', detailOrder.color], ['Bedenler', detailOrder.sizes]].map(([l, v], i) => (

              <div key={i} style={{ padding: '6px 8px', background: 'var(--bg-input)', borderRadius: '6px' }}><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{l}</div><div style={{ fontWeight: '600', fontSize: '14px' }}>{v || '—'}</div></div>

            ))}

          </div>

          {[['Beden Dağılımı', detailOrder.size_distribution], ['Renk Detayları', detailOrder.color_details], ['Model Açıklaması', detailOrder.model_description], ['Aksesuar', detailOrder.accessories], ['Astar', detailOrder.lining_info], ['Kalite Kriterleri', detailOrder.quality_criteria], ['Dikiş Detayları', detailOrder.stitch_details], ['Yıkama Talimatları', detailOrder.washing_instructions], ['Teslimat Şekli', detailOrder.delivery_method], ['Ambalaj', detailOrder.packaging], ['Etiket Bilgisi', detailOrder.label_info], ['Özel İstekler', detailOrder.special_requests], ['Notlar', detailOrder.notes]].filter(([, v]) => v).map(([l, v], i) => (

            <div key={i} style={{ padding: '6px 8px', background: 'var(--bg-input)', borderRadius: '6px' }}><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{l}</div><div style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>{v}</div></div>

          ))}

        </div>

        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setDetailOrder(null)}>Kapat</button><button className="btn btn-primary" onClick={() => { openEdit(detailOrder); setDetailOrder(null); }}>✏️ Düzenle</button></div>

      </div></div>)}

    </>

  );

}

















// ========== CUSTOMERS PAGE ==========

function CustomersPage({ addToast }) {

  const [customers, setCustomers] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '', tax_no: '', notes: '' });

  const [editCustomer, setEditCustomer] = useState(null);

  const [editForm, setEditForm] = useState({});

  const [auditHistory, setAuditHistory] = useState(null);

  const [auditData, setAuditData] = useState([]);

  const load = useCallback(async () => { const res = await fetch('/api/customers'); const d = await res.json(); setCustomers(Array.isArray(d) ? d : []); }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => { e.preventDefault(); if (!form.name) return; try { const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (!res.ok) throw new Error('Hata'); await load(); setShowModal(false); setForm({ name: '', company: '', phone: '', email: '', address: '', tax_no: '', notes: '' }); addToast('success', 'Müşteri eklendi!'); } catch (err) { addToast('error', 'Hata oluştu'); } };

  const handleDelete = async (id) => { if (!confirm('Bu müşteriyi silmek istediĞinize emin misiniz?')) return; try { await fetch(`/api/customers/${id}`, { method: 'DELETE' }); await load(); addToast('success', 'Müşteri silindi'); } catch { addToast('error', 'Silinemedi'); } };

  const openEditCustomer = (c) => { setEditCustomer(c); setEditForm({ name: c.name || '', company: c.company || '', phone: c.phone || '', email: c.email || '', address: c.address || '', tax_no: c.tax_no || '', notes: c.notes || '' }); };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      // Audit trail
      const changes = [];
      Object.keys(editForm).forEach(key => {
        const oldVal = String(editCustomer[key] ?? '');
        const newVal = String(editForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'customers', record_id: editCustomer.id, changes, changed_by: 'admin' })
        });
      }
      const res = await fetch(`/api/customers/${editCustomer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, changed_by: 'admin' }) });
      if (!res.ok) throw new Error('Hata');
      await load(); setEditCustomer(null); addToast('success', 'Müşteri güncellendi');
    } catch { addToast('error', 'Güncellenemedi'); }
  };

  const openCustomerAudit = async (cId) => { try { const res = await fetch(`/api/audit-trail?table_name=customers&record_id=${cId}`); const d = await res.json(); setAuditData(Array.isArray(d) ? d : []); setAuditHistory(cId); } catch { setAuditData([]); setAuditHistory(cId); } };

  const voice = useVoiceInput(setForm);



  return (

    <>

      <div className="topbar"><h1 className="topbar-title">👥 Müşteriler</h1><div className="topbar-actions"><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Yeni Müşteri</button></div></div>

      <div className="page-content">

        {customers.length === 0 ? (

          <div className="card"><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-title">Henüz Müşteri Yok</div><div className="empty-state-text">Müşterilerinizi ekleyin.</div><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ İlk Müşteriyi Ekle</button></div></div>

        ) : (

          <div className="table-wrapper"><table className="table"><thead><tr><th>Ad</th><th>Firma</th><th>Telefon</th><th>E-posta</th><th>Vergi No</th><th style={{ width: '120px' }}>İşlem</th></tr></thead><tbody>

            {customers.map(c => (<tr key={c.id}><td style={{ fontWeight: '600' }}>{c.name}</td><td>{c.company || '—'}</td><td>{c.phone || '—'}</td><td>{c.email || '—'}</td><td style={{ fontSize: '12px' }}>{c.tax_no || '—'}</td><td>

              <div style={{ display: 'flex', gap: '4px' }}>

                <button onClick={() => openEditCustomer(c)} title="Düzenle" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '3px' }}>✏️</button>

                <button onClick={() => openCustomerAudit(c.id)} title="Geçmiş" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '3px' }}>📜</button>

                <button onClick={() => handleDelete(c.id)} title="Sil" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '3px' }}>🗑️</button>

              </div>

            </td></tr>))}

          </tbody></table></div>

        )}

      </div>

      {showModal && (

        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>

          <div className="modal-header"><h2 className="modal-title">👥 Yeni Müşteri</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>

          <form onSubmit={handleSave}>

            <div className="form-row">

              <div className="form-group"><label className="form-label">Ad Soyad *</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /><VoiceBtn fieldKey="name" {...voice} /></div></div>

              <div className="form-group"><label className="form-label">Firma</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /><VoiceBtn fieldKey="company" {...voice} /></div></div>

            </div>

            <div className="form-row">

              <div className="form-group"><label className="form-label">Telefon</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><VoiceBtn fieldKey="phone" {...voice} /></div></div>

              <div className="form-group"><label className="form-label">E-posta</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><VoiceBtn fieldKey="email" {...voice} /></div></div>

            </div>

            <div className="form-row">

              <div className="form-group"><label className="form-label">Adres</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /><VoiceBtn fieldKey="address" {...voice} /></div></div>

              <div className="form-group"><label className="form-label">Vergi No</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={form.tax_no} onChange={e => setForm({ ...form, tax_no: e.target.value })} /><VoiceBtn fieldKey="tax_no" {...voice} /></div></div>

            </div>

            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button><button type="submit" className="btn btn-primary">💾 Kaydet</button></div>

          </form>

        </div></div>

      )}

      {editCustomer && (

        <div className="modal-overlay" onClick={() => setEditCustomer(null)}><div className="modal" onClick={e => e.stopPropagation()}>

          <div className="modal-header"><h2 className="modal-title">✏️ Müşteri Düzenle — {editCustomer.name}</h2><button className="modal-close" onClick={() => setEditCustomer(null)}>✕</button></div>

          <form onSubmit={handleUpdateCustomer}>

            <div className="form-row"><div className="form-group"><label className="form-label">Ad Soyad</label><input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div><div className="form-group"><label className="form-label">Firma</label><input className="form-input" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} /></div></div>

            <div className="form-row"><div className="form-group"><label className="form-label">Telefon</label><input className="form-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div><div className="form-group"><label className="form-label">E-posta</label><input className="form-input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div></div>

            <div className="form-row"><div className="form-group"><label className="form-label">Adres</label><input className="form-input" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div><div className="form-group"><label className="form-label">Vergi No</label><input className="form-input" value={editForm.tax_no} onChange={e => setEditForm({ ...editForm, tax_no: e.target.value })} /></div></div>

            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditCustomer(null)}>İptal</button><button type="submit" className="btn btn-primary">💾 Güncelle</button></div>

          </form>

        </div></div>

      )}

      {auditHistory && (

        <div className="modal-overlay" onClick={() => setAuditHistory(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>

          <div className="modal-header"><h2 className="modal-title">📜 Değişiklik Geçmişi</h2><button className="modal-close" onClick={() => setAuditHistory(null)}>✕</button></div>

          {auditData.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Henüz değişiklik kaydı yok.</p> : (

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>

              {auditData.map((a, i) => (

                <div key={i} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>

                    <strong style={{ color: 'var(--accent)' }}>{a.field_name}</strong>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(a.changed_at).toLocaleString('tr-TR')} — {a.changed_by}</span>

                  </div>

                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>

                    <span style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '4px' }}>Eski: {a.old_value || '—'}</span>

                    <span>→</span>

                    <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 8px', borderRadius: '4px' }}>Yeni: {a.new_value}</span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div></div>

      )}

    </>

  );

}



// ========== FASON PAGE ==========

function FasonPage({ models, addToast }) {
  // EDIT system states
  const [editFason, setEditFason] = useState(null);
  const [editFasonForm, setEditFasonForm] = useState({});

  const openEditFason = (order) => {
    setEditFasonForm({
      quantity: order.quantity || 0, unit_price: order.unit_price || 0,
      sent_date: order.sent_date || '', expected_date: order.expected_date || '',
      received_quantity: order.received_quantity || 0, defective_count: order.defective_count || 0,
      quality_notes: order.quality_notes || '', status: order.status || 'beklemede'
    });
    setEditFason(order);
  };

  const handleUpdateFason = async (e) => {
    e.preventDefault();
    try {
      const changes = [];
      Object.keys(editFasonForm).forEach(key => {
        const oldVal = String(editFason[key] ?? '');
        const newVal = String(editFasonForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'fason_orders', record_id: editFason.id, changes, changed_by: 'admin' })
        });
      }
      const res = await fetch(`/api/fason/orders/${editFason.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFasonForm)
      });
      if (!res.ok) throw new Error('Guncelleme hatasi');
      setEditFason(null);
      addToast('success', 'Fason siparis guncellendi!');
    } catch (err) { addToast('error', err.message); }
  };


  const [providers, setProviders] = useState([]);

  const [orders, setOrders] = useState([]);

  const [showProviderModal, setShowProviderModal] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);

  const [pForm, setPForm] = useState({ name: '', company: '', phone: '', address: '', speciality: '' });

  const [oForm, setOForm] = useState({ provider_id: '', model_id: '', quantity: '', unit_price: '', expected_date: '' });

  const loadAll = useCallback(async () => { const [r1, r2] = await Promise.all([fetch('/api/fason'), fetch('/api/fason/orders')]); const [d1, d2] = await Promise.all([r1.json(), r2.json()]); setProviders(Array.isArray(d1) ? d1 : []); setOrders(Array.isArray(d2) ? d2 : []); }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveProvider = async (e) => { e.preventDefault(); try { await fetch('/api/fason', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pForm) }); await loadAll(); setShowProviderModal(false); setPForm({ name: '', company: '', phone: '', address: '', speciality: '' }); addToast('success', 'Fasoncu eklendi!'); } catch (err) { addToast('error', 'Hata'); } };

  const saveOrder = async (e) => { e.preventDefault(); try { await fetch('/api/fason/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(oForm) }); await loadAll(); setShowOrderModal(false); setOForm({ provider_id: '', model_id: '', quantity: '', unit_price: '', expected_date: '' }); addToast('success', 'Fason sipariş oluşturuldu!'); } catch (err) { addToast('error', 'Hata'); } };

  const statusLabels = { beklemede: '⏳ Beklemede', gonderildi: '📦 Gönderildi', uretimde: '🏭 Üretimde', teslim: '✅ Teslim', iptal: '❌ İptal' };

  const pVoice = useVoiceInput(setPForm);

  const oVoice = useVoiceInput(setOForm);



  return (

    <>

      <div className="topbar"><h1 className="topbar-title">🏭 Fason Yönetimi</h1><div className="topbar-actions"><button className="btn btn-secondary" onClick={() => setShowProviderModal(true)}>+ Fasoncu</button><button className="btn btn-primary" onClick={() => setShowOrderModal(true)}>+ Fason Sipariş</button></div></div>

      <div className="page-content">

        <div className="stats-grid">

          <div className="stat-card"><div className="stat-icon">🏭</div><div className="stat-value">{providers.length}</div><div className="stat-label">Fasoncu</div></div>

          <div className="stat-card"><div className="stat-icon">🏭</div><div className="stat-value">{orders.length}</div><div className="stat-label">Sipariş</div></div>

          <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-value">{orders.reduce((s, o) => s + (o.quantity || 0), 0).toLocaleString('tr-TR')}</div><div className="stat-label">Toplam Adet</div></div>

          <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{orders.reduce((s, o) => s + (o.total_price || 0), 0).toFixed(0)} ₺</div><div className="stat-label">Toplam Tutar</div></div>

        </div>

        {orders.length === 0 ? (

          <div className="card"><div className="empty-state"><div className="empty-state-icon">🏭</div><div className="empty-state-title">Henüz Fason Sipariş Yok</div><div className="empty-state-text">Fasoncu ekleyin ve sipariş oluşturun.</div></div></div>

        ) : (

          <div className="table-wrapper"><table className="table"><thead><tr><th>Fasoncu</th><th>Model</th><th>Adet</th><th>Birim ₺</th><th>Toplam ₺</th><th>Beklenen Tarih</th><th>Durum</th></tr></thead><tbody>

            {orders.map(o => (<tr key={o.id}><td style={{ fontWeight: '600' }}>{o.provider_name}</td><td>{o.model_name} <code style={{ fontSize: '11px', background: 'var(--bg-input)', padding: '1px 5px', borderRadius: '3px' }}>{o.model_code}</code></td><td style={{ fontWeight: '700' }}>{o.quantity?.toLocaleString('tr-TR')}</td><td>{o.unit_price?.toFixed(2)} ₺</td><td style={{ fontWeight: '600', color: 'var(--accent)' }}>{o.total_price?.toFixed(0)} ₺</td><td>{o.expected_date || '—'}</td><td><span className="badge badge-info">{statusLabels[o.status] || o.status}</span></td></tr>))}

          </tbody></table></div>

        )}

      </div>

      {showProviderModal && (

        <div className="modal-overlay" onClick={() => setShowProviderModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>

          <div className="modal-header"><h2 className="modal-title">🏭 Yeni Fasoncu</h2><button className="modal-close" onClick={() => setShowProviderModal(false)}>✕</button></div>

          <form onSubmit={saveProvider}>

            <div className="form-row">

              <div className="form-group"><label className="form-label">Ad *</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} required /><VoiceBtn fieldKey="name" {...pVoice} /></div></div>

              <div className="form-group"><label className="form-label">Firma</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={pForm.company} onChange={e => setPForm({ ...pForm, company: e.target.value })} /><VoiceBtn fieldKey="company" {...pVoice} /></div></div>

            </div>

            <div className="form-row">

              <div className="form-group"><label className="form-label">Telefon</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={pForm.phone} onChange={e => setPForm({ ...pForm, phone: e.target.value })} /><VoiceBtn fieldKey="phone" {...pVoice} /></div></div>

              <div className="form-group"><label className="form-label">Uzmanlık</label><div style={{ position: 'relative' }}><input className="form-input" placeholder="örn: Overlok" style={{ paddingRight: '62px' }} value={pForm.speciality} onChange={e => setPForm({ ...pForm, speciality: e.target.value })} /><VoiceBtn fieldKey="speciality" {...pVoice} /></div></div>

            </div>

            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowProviderModal(false)}>İptal</button><button type="submit" className="btn btn-primary">💾 Kaydet</button></div>

          </form>

        </div></div>

      )}

      {showOrderModal && (

        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>

          <div className="modal-header"><h2 className="modal-title">📋 Fason Sipariş</h2><button className="modal-close" onClick={() => setShowOrderModal(false)}>✕</button></div>

          <form onSubmit={saveOrder}>

            <div className="form-row"><div className="form-group"><label className="form-label">Fasoncu *</label><select className="form-select" value={oForm.provider_id} onChange={e => setOForm({ ...oForm, provider_id: e.target.value })} required><option value="">Seçiniz...</option>{providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="form-group"><label className="form-label">Model *</label><select className="form-select" value={oForm.model_id} onChange={e => setOForm({ ...oForm, model_id: e.target.value })} required><option value="">Seçiniz...</option>{models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}</select></div></div>

            <div className="form-row">

              <div className="form-group"><label className="form-label">Adet *</label><div style={{ position: 'relative' }}><input className="form-input" type="number" style={{ paddingRight: '62px' }} value={oForm.quantity} onChange={e => setOForm({ ...oForm, quantity: e.target.value })} required /><VoiceBtn fieldKey="quantity" {...oVoice} /></div></div>

              <div className="form-group"><label className="form-label">Birim Fiyat (₺)</label><div style={{ position: 'relative' }}><input className="form-input" type="number" step="0.01" style={{ paddingRight: '62px' }} value={oForm.unit_price} onChange={e => setOForm({ ...oForm, unit_price: e.target.value })} /><VoiceBtn fieldKey="unit_price" {...oVoice} /></div></div>

              <div className="form-group"><label className="form-label">Beklenen Tarih</label><input className="form-input" type="date" value={oForm.expected_date} onChange={e => setOForm({ ...oForm, expected_date: e.target.value })} /></div>

            </div>

            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>İptal</button><button type="submit" className="btn btn-primary">💾 Kaydet</button></div>

          </form>

        </div></div>

      )}

    </>

  );

}



// ========== SHIPMENTS PAGE ==========

function ShipmentsPage({ models, addToast }) {

  const [shipments, setShipments] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({ model_id: '', quantity: '', destination: '', shipping_date: '', tracking_no: '', notes: '' });

  const [editShipment, setEditShipment] = useState(null);

  const [editForm, setEditForm] = useState({});

  const [auditHistory, setAuditHistory] = useState(null);

  const [auditData, setAuditData] = useState([]);

  const load = useCallback(async () => { const res = await fetch('/api/shipments'); const d = await res.json(); setShipments(Array.isArray(d) ? d : []); }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => { e.preventDefault(); try { const res = await fetch('/api/shipments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (!res.ok) throw new Error('Hata'); await load(); setShowModal(false); setForm({ model_id: '', quantity: '', destination: '', shipping_date: '', tracking_no: '', notes: '' }); addToast('success', 'Sevkiyat kaydedildi!'); } catch (err) { addToast('error', 'Hata oluştu'); } };

  const handleDelete = async (id) => { if (!confirm('Bu sevkiyatı silmek istediĞinize emin misiniz?')) return; try { await fetch(`/api/shipments/${id}`, { method: 'DELETE' }); await load(); addToast('success', 'Sevkiyat silindi'); } catch { addToast('error', 'Silinemedi'); } };

  const openEditShipment = (s) => { setEditShipment(s); setEditForm({ status: s.status || 'pending', tracking_no: s.tracking_no || '', notes: s.notes || '' }); };

  const handleUpdateShipment = async (e) => {
    e.preventDefault();
    try {
      // Audit trail
      const changes = [];
      Object.keys(editForm).forEach(key => {
        const oldVal = String(editShipment[key] ?? '');
        const newVal = String(editForm[key] ?? '');
        if (oldVal !== newVal) changes.push({ field_name: key, old_value: oldVal, new_value: newVal });
      });
      if (changes.length > 0) {
        await fetch('/api/audit-trail', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: 'shipments', record_id: editShipment.id, changes, changed_by: 'admin' })
        });
      }
      const res = await fetch(`/api/shipments/${editShipment.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, changed_by: 'admin' }) });
      if (!res.ok) throw new Error('Hata');
      await load(); setEditShipment(null); addToast('success', 'Sevkiyat güncellendi');
    } catch { addToast('error', 'Güncellenemedi'); }
  };

  const openShipmentAudit = async (sId) => { try { const res = await fetch(`/api/audit-trail?table_name=shipments&record_id=${sId}`); const d = await res.json(); setAuditData(Array.isArray(d) ? d : []); setAuditHistory(sId); } catch { setAuditData([]); setAuditHistory(sId); } };

  const voice = useVoiceInput(setForm);



  return (

    <>

      <div className="topbar"><h1 className="topbar-title">📦 Sevkiyat</h1><div className="topbar-actions"><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Yeni Sevkiyat</button></div></div>

      <div className="page-content">

        {shipments.length === 0 ? (

          <div className="card"><div className="empty-state"><div className="empty-state-icon">🚚</div><div className="empty-state-title">Henüz Sevkiyat Yok</div><div className="empty-state-text">Sevkiyatlarınızı buradan takip edebilirsiniz.</div></div></div>

        ) : (

          <div className="table-wrapper"><table className="table"><thead><tr><th>Tarih</th><th>Model</th><th>Adet</th><th>Hedef</th><th>Takip No</th><th>Notlar</th><th style={{ width: '120px' }}>İşlem</th></tr></thead><tbody>

            {shipments.map(s => (<tr key={s.id}><td>{s.shipping_date || '—'}</td><td style={{ fontWeight: '600' }}>{s.model_name || '—'}</td><td style={{ fontWeight: '700' }}>{s.quantity}</td><td>{s.destination || '—'}</td><td style={{ fontSize: '12px' }}>{s.tracking_no || '—'}</td><td style={{ fontSize: '13px' }}>{s.notes || '—'}</td><td>

              <div style={{ display: 'flex', gap: '4px' }}>

                <button onClick={() => openEditShipment(s)} title="Düzenle" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '3px' }}>✏️</button>

                <button onClick={() => openShipmentAudit(s.id)} title="Geçmiş" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '3px' }}>📜</button>

                <button onClick={() => handleDelete(s.id)} title="Sil" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '3px' }}>🗑️</button>

              </div>

            </td></tr>))}

          </tbody></table></div>

        )}

      </div>

      {showModal && (

        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>

          <div className="modal-header"><h2 className="modal-title">📦 Yeni Sevkiyat</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>

          <form onSubmit={handleSave}>

            <div className="form-row"><div className="form-group"><label className="form-label">Model</label><select className="form-select" value={form.model_id} onChange={e => setForm({ ...form, model_id: e.target.value })}><option value="">Seçiniz...</option>{models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}</select></div><div className="form-group"><label className="form-label">Adet</label><div style={{ position: 'relative' }}><input className="form-input" type="number" style={{ paddingRight: '62px' }} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /><VoiceBtn fieldKey="quantity" {...voice} /></div></div></div>

            <div className="form-row"><div className="form-group"><label className="form-label">Hedef</label><div style={{ position: 'relative' }}><input className="form-input" placeholder="Adres veya depo" style={{ paddingRight: '62px' }} value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} /><VoiceBtn fieldKey="destination" {...voice} /></div></div><div className="form-group"><label className="form-label">Sevk Tarihi</label><input className="form-input" type="date" value={form.shipping_date} onChange={e => setForm({ ...form, shipping_date: e.target.value })} /></div></div>

            <div className="form-row"><div className="form-group"><label className="form-label">Takip No</label><div style={{ position: 'relative' }}><input className="form-input" style={{ paddingRight: '62px' }} value={form.tracking_no} onChange={e => setForm({ ...form, tracking_no: e.target.value })} /><VoiceBtn fieldKey="tracking_no" {...voice} /></div></div></div>

            <div className="form-group"><label className="form-label">Notlar</label><div style={{ position: 'relative' }}><textarea className="form-textarea" style={{ paddingRight: '62px' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /><VoiceBtn fieldKey="notes" {...voice} /></div></div>

            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button><button type="submit" className="btn btn-primary">💾 Kaydet</button></div>

          </form>

        </div></div>

      )}

      {editShipment && (

        <div className="modal-overlay" onClick={() => setEditShipment(null)}><div className="modal" onClick={e => e.stopPropagation()}>

          <div className="modal-header"><h2 className="modal-title">✏️ Sevkiyat Düzenle</h2><button className="modal-close" onClick={() => setEditShipment(null)}>✕</button></div>

          <form onSubmit={handleUpdateShipment}>

            <div className="form-group"><label className="form-label">Durum</label><select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option value="pending">Bekliyor</option><option value="shipped">Gönderildi</option><option value="delivered">Teslim Edildi</option></select></div>

            <div className="form-group"><label className="form-label">Takip No</label><input className="form-input" value={editForm.tracking_no} onChange={e => setEditForm({ ...editForm, tracking_no: e.target.value })} /></div>

            <div className="form-group"><label className="form-label">Notlar</label><textarea className="form-textarea" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>

            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditShipment(null)}>İptal</button><button type="submit" className="btn btn-primary">💾 Güncelle</button></div>

          </form>

        </div></div>

      )}

      {auditHistory && (

        <div className="modal-overlay" onClick={() => setAuditHistory(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>

          <div className="modal-header"><h2 className="modal-title">📜 Değişiklik Geçmişi</h2><button className="modal-close" onClick={() => setAuditHistory(null)}>✕</button></div>

          {auditData.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Henüz değişiklik kaydı yok.</p> : (

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>

              {auditData.map((a, i) => (

                <div key={i} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>

                    <strong style={{ color: 'var(--accent)' }}>{a.field_name}</strong>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(a.changed_at).toLocaleString('tr-TR')} — {a.changed_by}</span>

                  </div>

                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>

                    <span style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '4px' }}>Eski: {a.old_value || '—'}</span>

                    <span>→</span>

                    <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 8px', borderRadius: '4px' }}>Yeni: {a.new_value}</span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div></div>

      )}

    </>

  );

}



// ========== SETTINGS PAGE ==========

function SettingsPage({ addToast }) {

  const [currentLang, setCurrentLang] = useState('tr');

  const [schedule, setSchedule] = useState([]);

  const [workDays, setWorkDays] = useState([]);

  const currentYear = new Date().getFullYear();



  useEffect(() => {

    const saved = typeof window !== 'undefined' ? localStorage.getItem('kamera-panel-lang') || 'tr' : 'tr';

    setCurrentLang(saved);

    // Mola çizelgesi ve çalışma günlerini yükle

    fetch('/api/work-schedule').then(r => r.json()).then(d => { if (Array.isArray(d)) setSchedule(d); }).catch(() => { });

    fetch(`/api/work-schedule?type=workdays&year=${currentYear}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setWorkDays(d); }).catch(() => { });

  }, []);



  const changeLang = (lang) => {

    localStorage.setItem('kamera-panel-lang', lang);

    setCurrentLang(lang);

    if (lang === 'ar') {

      document.documentElement.dir = 'rtl';

      document.documentElement.lang = 'ar';

    } else {

      document.documentElement.dir = 'ltr';

      document.documentElement.lang = 'tr';

    }

    addToast('success', lang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Dil Türkçe olarak değiştirildi');

  };



  const updateWorkDays = async (month, newDays) => {

    await fetch('/api/work-schedule', {

      method: 'PUT',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ type: 'workdays', year: currentYear, month, work_days: parseInt(newDays) })

    });

    setWorkDays(prev => prev.map(w => w.month === month ? { ...w, work_days: parseInt(newDays) } : w));

    addToast('success', `${month}. ay çalışma günü güncellendi`);

  };



  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'AĞustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  const totalBreakMin = schedule.filter(s => s.type === 'break').reduce((sum, s) => {

    const [sh, sm] = s.start_time.split(':').map(Number);

    const [eh, em] = s.end_time.split(':').map(Number);

    return sum + (eh * 60 + em) - (sh * 60 + sm);

  }, 0);

  const totalWorkMin = schedule.filter(s => s.type === 'work').reduce((sum, s) => {

    const [sh, sm] = s.start_time.split(':').map(Number);

    const [eh, em] = s.end_time.split(':').map(Number);

    return sum + (eh * 60 + em) - (sh * 60 + sm);

  }, 0);



  return (

    <>

      <div className="topbar"><h1 className="topbar-title">⚙️ Ayarlar</h1></div>

      <div className="page-content">

        <div style={{ display: 'grid', gap: '16px', maxWidth: '900px' }}>

          {/* DİL SEÇİMİ */}

          <div className="card">

            <div className="card-header"><h3 className="card-title">🌐 Dil Ayarları</h3></div>

            <div style={{ padding: '16px' }}>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Sistem ve operatör ekranı dilini seçin. Arapça seçildiĞinde arayüz saĞdan sola (RTL) moduna geçer.</p>

              <div style={{ display: 'flex', gap: '10px' }}>

                <button onClick={() => changeLang('tr')}

                  style={{ flex: 1, padding: '16px', borderRadius: '12px', border: currentLang === 'tr' ? '3px solid var(--accent)' : '2px solid var(--border-color)', background: currentLang === 'tr' ? 'rgba(99,102,241,0.1)' : 'var(--bg-input)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>

                  🇹🇷 Türkçe

                </button>

                <button onClick={() => changeLang('ar')}

                  style={{ flex: 1, padding: '16px', borderRadius: '12px', border: currentLang === 'ar' ? '3px solid var(--accent)' : '2px solid var(--border-color)', background: currentLang === 'ar' ? 'rgba(99,102,241,0.1)' : 'var(--bg-input)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>

                  🇸🇦 العربية

                </button>

              </div>

            </div>

          </div>



          {/* MOLA ÇİZELGESİ */}

          <div className="card">

            <div className="card-header"><h3 className="card-title">📋 Günlük Çalışma & Mola Çizelgesi</h3></div>

            <div style={{ padding: '16px' }}>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', fontSize: '12px' }}>

                <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', fontWeight: '600' }}>📋ş Mesai: {Math.floor(totalWorkMin / 60)}s {totalWorkMin % 60}dk</span>

                <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(241,196,15,0.1)', color: '#f1c40f', fontWeight: '600' }}>📋ş Mola: {totalBreakMin} dk</span>

                <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(52,152,219,0.1)', color: '#3498db', fontWeight: '600' }}>📊 Net Çalışma: {Math.floor(totalWorkMin / 60)}s {totalWorkMin % 60}dk / gün</span>

              </div>



              {/* Zaman çizelgesi */}

              <div style={{ display: 'flex', gap: '0px', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', height: '40px' }}>

                {schedule.map((s, i) => {

                  const [sh, sm] = s.start_time.split(':').map(Number);

                  const [eh, em] = s.end_time.split(':').map(Number);

                  const dur = (eh * 60 + em) - (sh * 60 + sm);

                  const totalAll = totalWorkMin + totalBreakMin;

                  return (

                    <div key={i} title={`${s.name}: ${s.start_time} - ${s.end_time} (${dur} dk)`}

                      style={{ flex: dur, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.type === 'work' ? 'rgba(46,204,113,0.15)' : 'rgba(241,196,15,0.25)', borderRight: i < schedule.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'default', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 4px' }}>

                      {dur >= 30 ? `${s.start_time}` : ''}

                    </div>

                  );

                })}

              </div>



              {/* Detay listesi */}

              <div style={{ display: 'grid', gap: '6px' }}>

                {schedule.map((s, i) => {

                  const [sh, sm] = s.start_time.split(':').map(Number);

                  const [eh, em] = s.end_time.split(':').map(Number);

                  const dur = (eh * 60 + em) - (sh * 60 + sm);

                  return (

                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>

                      <span style={{ fontSize: '16px' }}>{s.type === 'work' ? '📋ş' : '☕'}</span>

                      <span style={{ flex: 1, fontSize: '13px', fontWeight: '600' }}>{s.name}</span>

                      <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent)' }}>{s.start_time} — {s.end_time}</span>

                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '50px', textAlign: 'right' }}>{dur} dk</span>

                    </div>

                  );

                })}

              </div>

            </div>

          </div>



          {/* AYLIK ÇALIŞMA GÜNLERİ */}

          <div className="card">

            <div className="card-header"><h3 className="card-title">📅 {currentYear} Aylık Çalışma Günleri</h3></div>

            <div style={{ padding: '16px' }}>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>

                Her ay hafta içi (Pazartesi-Cuma) gün sayısı otomatik hesaplanır. Resmi tatil veya özel durumlar için düzenleyebilirsiniz.

                <br /><strong>Günlük ücret = Toplam aylık maliyet  O aydaki çalışma günü sayısı</strong>

              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>

                {workDays.map(w => {

                  const isCurrent = w.month === new Date().getMonth() + 1;

                  return (

                    <div key={w.month} style={{ padding: '10px', borderRadius: '10px', background: isCurrent ? 'rgba(99,102,241,0.1)' : 'var(--bg-input)', border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--border-color)', textAlign: 'center' }}>

                      <div style={{ fontSize: '11px', color: isCurrent ? 'var(--accent)' : 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>

                        {isCurrent ? '📏 ' : ''}{monthNames[w.month - 1]}

                      </div>

                      <input type="number" value={w.work_days} min={15} max={26}

                        onChange={e => updateWorkDays(w.month, e.target.value)}

                        style={{ width: '50px', textAlign: 'center', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: '800', fontFamily: 'inherit' }} />

                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>gün</div>

                    </div>

                  );

                })}

              </div>

            </div>

          </div>



          {/* OPERATÖR TABLET BİLGİSİ */}

          <div className="card">

            <div className="card-header"><h3 className="card-title">📏 Operatör Tablet Ekranı</h3></div>

            <div style={{ padding: '16px' }}>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Operatörler bu adresi tablette açarak üretim yapabilir:</p>

              <div style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                <span>{typeof window !== 'undefined' ? `${window.location.origin}/operator` : '/operator'}</span>

                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/operator'); addToast('success', 'URL kopyalandı!'); }}

                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>📋 Kopyala</button>

              </div>

            </div>

          </div>



          {/* SİSTEM BİLGİSİ */}

          <div className="card">

            <div className="card-header"><h3 className="card-title">ℹ️ Sistem Bilgisi</h3></div>

            <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>

                <span style={{ color: 'var(--text-muted)' }}>Versiyon:</span><strong>1.1.0</strong>

                <span style={{ color: 'var(--text-muted)' }}>Veritabanı:</span><strong>SQLite (yerel)</strong>

                <span style={{ color: 'var(--text-muted)' }}>Video Depolama:</span><strong>Yerel disk (/uploads)</strong>

                <span style={{ color: 'var(--text-muted)' }}>Max Dosya Boyutu:</span><strong>500 MB</strong>

                <span style={{ color: 'var(--text-muted)' }}>Desteklenen Diller:</span><strong>Türkçe, Arapça</strong>

                <span style={{ color: 'var(--text-muted)' }}>Mesai:</span><strong>08:00 — 19:00 ({totalBreakMin} dk mola)</strong>

              </div>

            </div>

          </div>

        </div>

      </div>

    </>

  );

}



// ========== COSTS PAGE ==========

function CostsPage({ models, personnel, addToast }) {
  // EDIT system states
  const [editCost, setEditCost] = useState(null);
  const [editCostForm, setEditCostForm] = useState({});

  const openEditCost = (entry) => {
    setEditCostForm({
      category: entry.category || '', description: entry.description || '',
      amount: entry.amount || 0, unit: entry.unit || '', quantity: entry.quantity || 1,
      total: entry.total || 0
    });
    setEditCost(entry);
  };

  const handleUpdateCost = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editCost.id, ...editCostForm })
      });
      if (!res.ok) throw new Error('Güncelleme hatası');
      setEditCost(null);
      loadExpenses();
      addToast('success', '✅ Gider güncellendi!');
    } catch (err) { addToast('error', err.message); }
  };


  const [logs, setLogs] = useState([]);

  const [period, setPeriod] = useState('month');

  const [workDaysInfo, setWorkDaysInfo] = useState(null);

  const [expenses, setExpenses] = useState([]);

  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [expenseForm, setExpenseForm] = useState({ category: 'elektrik', description: '', amount: '', is_recurring: false });

  const [expenseCatFilter, setExpenseCatFilter] = useState('');

  const now_ref = new Date();



  const expenseCategories = [
    { value: 'elektrik', label: '\u26A1 Elektrik', icon: '\u26A1' },
    { value: 'su', label: '\uD83D\uDCA7 Su', icon: '\uD83D\uDCA7' },
    { value: 'internet_telefon', label: '\uD83D\uDCE1 İnternet / Telefon', icon: '\uD83D\uDCE1' },
    { value: 'sigorta', label: '\uD83D\uDEE1\uFE0F Sigorta', icon: '\uD83D\uDEE1\uFE0F' },
    { value: 'iplik', label: '\uD83E\uDDF5 İplik / Malzeme', icon: '\uD83E\uDDF5' },
    { value: 'makine_bakim', label: '\uD83D\uDD27 Makine Tamiri / Bak\u0131m', icon: '\uD83D\uDD27' },
    { value: 'yedek_parca', label: '\u2699\uFE0F Yedek Par\u00E7a', icon: '\u2699\uFE0F' },
    { value: 'araba_benzin', label: '\u26FD Araba Benzin', icon: '\u26FD' },
    { value: 'araba_bakim', label: '\uD83D\uDE97 Araba Bak\u0131m', icon: '\uD83D\uDE97' },
    { value: 'muhasebe', label: '\uD83E\uDDFE Muhasebe', icon: '\uD83E\uDDFE' },
    { value: 'kdv', label: '\uD83D\uDCCB KDV', icon: '\uD83D\uDCCB' },
    { value: 'stopaj', label: '\uD83D\uDCC4 Stopaj', icon: '\uD83D\uDCC4' },
    { value: 'vergi', label: '\uD83C\uDFDB\uFE0F Vergi', icon: '\uD83C\uDFDB\uFE0F' },
    { value: 'personel_maas', label: '\uD83D\uDCB0 Personel Maaş\u0131', icon: '\uD83D\uDCB0' },
    { value: 'personel_yemek', label: '\uD83C\uDF7D\uFE0F Personel Yemeği', icon: '\uD83C\uDF7D\uFE0F' },
    { value: 'personel_yol', label: '\uD83D\uDE8C Personel Yol Paras\u0131', icon: '\uD83D\uDE8C' },
    { value: 'personel_mesai', label: '\u23F0 Fazla Mesai \u00DCcreti', icon: '\u23F0' },
    { value: 'temizlik', label: '\uD83E\uDDF9 Temizlik Malzemesi', icon: '\uD83E\uDDF9' },
    { value: 'mutfak', label: '\u2615 Mutfak (\u00C7ay/\u015Eeker/İ\u00E7ecek)', icon: '\u2615' },
    { value: 'diger', label: '\uD83D\uDCE6 Diğer', icon: '\uD83D\uDCE6' },
  ];



  const loadExpenses = useCallback(() => {

    fetch(`/api/expenses?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`)

      .then(r => r.json()).then(d => setExpenses(Array.isArray(d) ? d : [])).catch(() => { });

  }, []);



  useEffect(() => {

    const n = new Date();

    let url = '/api/production';

    if (period === 'today') url += `?date=${n.toISOString().split('T')[0]}`;

    else if (period === 'week') { const d = new Date(n); d.setDate(d.getDate() - 7); url += `?from=${d.toISOString().split('T')[0]}`; }

    else if (period === 'month') { url += `?from=${new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split('T')[0]}`; }

    fetch(url).then(r => r.json()).then(d => setLogs(Array.isArray(d) ? d : [])).catch(() => { });

    fetch(`/api/work-schedule?type=workdays&year=${n.getFullYear()}`).then(r => r.json()).then(d => {

      if (Array.isArray(d)) { const curr = d.find(w => w.month === n.getMonth() + 1); setWorkDaysInfo(curr); }

    }).catch(() => { });

    loadExpenses();

  }, [period, loadExpenses]);



  const addExpense = async () => {

    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) { addToast('error', 'Tutar giriniz'); return; }

    const n = new Date();

    await fetch('/api/expenses', {

      method: 'POST', headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount), year: n.getFullYear(), month: n.getMonth() + 1 })

    });

    setExpenseForm({ category: 'elektrik', description: '', amount: '', is_recurring: false });

    setShowExpenseForm(false);

    loadExpenses();

    addToast('success', 'Gider eklendi');

  };



  const deleteExpense = async (id) => {

    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });

    loadExpenses();

    addToast('success', 'Gider silindi');

  };



  const modelCosts = {};

  logs.forEach(log => {

    const mid = log.model_id;

    if (!modelCosts[mid]) modelCosts[mid] = { name: log.model_name, code: log.model_code, totalProduced: 0, totalDefective: 0, totalValue: 0, totalLaborCost: 0 };

    const mc = modelCosts[mid];

    mc.totalProduced += log.total_produced || 0;

    mc.totalDefective += log.defective_count || 0;

    mc.totalValue += (log.total_produced || 0) * (log.unit_price || 0);

    if (log.start_time && log.end_time) { mc.totalLaborCost += (log.daily_wage || 0) / 480 * ((new Date(log.end_time) - new Date(log.start_time)) / 60000); }

  });



  const personnelCosts = {};

  logs.forEach(log => {

    if (!personnelCosts[log.personnel_id]) personnelCosts[log.personnel_id] = { name: log.personnel_name, dailyWage: log.daily_wage || 0, totalProduced: 0, totalValue: 0, days: new Set() };

    const pc = personnelCosts[log.personnel_id];

    pc.totalProduced += log.total_produced || 0;

    pc.totalValue += (log.total_produced || 0) * (log.unit_price || 0);

    if (log.start_time) pc.days.add(log.start_time.split('T')[0]);

  });



  const totalLabor = Object.values(personnelCosts).reduce((s, p) => s + p.dailyWage * Math.max(1, p.days.size), 0);

  const totalProduction = Object.values(modelCosts).reduce((s, m) => s + m.totalValue, 0);

  const totalPieces = Object.values(modelCosts).reduce((s, m) => s + m.totalProduced, 0);

  const totalDefective = Object.values(modelCosts).reduce((s, m) => s + m.totalDefective, 0);

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  // Entegrasyon 2a: Personel toplam maliyet (maaş + SSK + ulaşım + yemek + tazminat)
  const personnelFullCost = personnel.filter(p => p.status === 'active').reduce((s, p) => {
    const brut = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0);
    const sgk = brut * 0.225; // SGK işveren payı %22.5
    return s + brut + sgk;
  }, 0);

  // Entegrasyon 2c: Fire maliyeti = hatalı adet × ortalama birim fiyat
  const avgUnitPrice = totalPieces > 0 ? totalProduction / totalPieces : 0;
  const fireCost = totalDefective * avgUnitPrice;

  const totalCost = totalLabor + totalExpenses;

  const netProfit = totalProduction - totalCost;

  // Entegrasyon 2b: Birim maliyet ve kar marjı
  const unitCost = totalPieces > 0 ? totalCost / totalPieces : 0;
  const unitProfit = totalPieces > 0 ? netProfit / totalPieces : 0;



  const categoryTotals = {};

  expenses.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount; });



  return (

    <>

      <div className="topbar">

        <h1 className="topbar-title">💰 Maliyet Analizi</h1>

        <div className="topbar-actions" style={{ display: 'flex', gap: '8px' }}>

          <button className="btn btn-primary" onClick={() => setShowExpenseForm(!showExpenseForm)}>➕ Gider Ekle</button>

          <select className="form-select" value={period} onChange={e => setPeriod(e.target.value)} style={{ minWidth: '160px' }}>

            <option value="today">Bugün</option><option value="week">Bu Hafta</option>

            <option value="month">Bu Ay</option><option value="all">Tüm Zamanlar</option>

          </select>

        </div>

      </div>

      <div className="page-content">

        {/* 💰 AMELE 2 — İŞLETME GİDER FORMU */}
        <IsletmeGiderForm addToast={addToast} />

        {showExpenseForm && (

          <div className="card" style={{ marginBottom: '16px', border: '2px solid var(--accent)' }}>

            <div className="card-header"><h3 className="card-title">➕ Yeni İşletme Gideri</h3></div>

            <div style={{ padding: '16px' }}>

              <div className="form-row">

                <div className="form-group"><label className="form-label">Kategori</label>

                  <select className="form-select" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>

                    {expenseCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}

                  </select></div>

                <div className="form-group"><label className="form-label">Tutar (₺)</label>

                  <input className="form-input" type="number" step="0.01" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} /></div>

                <div className="form-group"><label className="form-label">Açıklama</label>

                  <input className="form-input" placeholder="Opsiyonel..." value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} /></div>

              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>

                  <input type="checkbox" checked={expenseForm.is_recurring} onChange={e => setExpenseForm({ ...expenseForm, is_recurring: e.target.checked })} /> 📋 Her ay tekrarlanan

                </label>

                <div style={{ flex: 1 }} />

                <button className="btn btn-secondary" onClick={() => setShowExpenseForm(false)}>İptal</button>

                <button className="btn btn-primary" onClick={addExpense}>💾 Kaydet</button>

              </div>

            </div>

          </div>

        )}



        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '16px' }}>

          <div className="card" style={{ textAlign: 'center', padding: '14px' }}>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>📋 İşçilik</div>

            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--danger)' }}>{totalLabor.toLocaleString('tr-TR')} ₺</div>

          </div>

          <div className="card" style={{ textAlign: 'center', padding: '14px' }}>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>📋 İşletme Gideri</div>

            <div style={{ fontSize: '22px', fontWeight: '800', color: '#e67e22' }}>{totalExpenses.toLocaleString('tr-TR')} ₺</div>

          </div>

          <div className="card" style={{ textAlign: 'center', padding: '14px' }}>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>🧮 Toplam Maliyet</div>

            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--danger)' }}>{totalCost.toLocaleString('tr-TR')} ₺</div>

          </div>

          <div className="card" style={{ textAlign: 'center', padding: '14px' }}>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>📋 Üretim Değeri</div>

            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--success)' }}>{totalProduction.toLocaleString('tr-TR')} ₺</div>

          </div>

          <div className="card" style={{ textAlign: 'center', padding: '14px' }}>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>📈 Net Kar/Zarar</div>

            <div style={{ fontSize: '22px', fontWeight: '800', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>

              {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('tr-TR')} ₺

            </div>

          </div>

          {personnelFullCost > 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>👤 Personel Tam Maliyet</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#8e44ad' }}>{personnelFullCost.toLocaleString('tr-TR')} ₺</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Maaş+SSK+Ulaşım+Yemek</div>
            </div>
          )}

          {totalDefective > 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>🔥 Fire Maliyeti</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#e74c3c' }}>{fireCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{totalDefective} hatalı adet</div>
            </div>
          )}

          {totalPieces > 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>📐 Birim Maliyet</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#3498db' }}>{unitCost.toFixed(2)} ₺</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{totalPieces} adet üretim</div>
            </div>
          )}

          {totalPieces > 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>💎 Birim Kar</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: unitProfit >= 0 ? '#27ae60' : '#e74c3c' }}>{unitProfit >= 0 ? '+' : ''}{unitProfit.toFixed(2)} ₺</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>adet başına</div>
            </div>
          )}

        </div>



        <div className="card" style={{ marginBottom: '16px' }}>

          <div className="card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <h3 className="card-title">🏢 İşletme Giderleri — {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h3>
            <select className="form-select" style={{ width: '180px', fontSize: '12px', padding: '6px 10px' }} value={expenseCatFilter} onChange={e => setExpenseCatFilter(e.target.value)}>
              <option value="">Tüm Kategoriler</option>
              {expenseCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {expenses.length === 0 ? (

            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>

              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>Henüz gider girilmemiş. "➕ Gider Ekle" butonuyla başlayın.

            </div>

          ) : (

            <div style={{ padding: '16px' }}>

              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>

                {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {

                  const catInfo = expenseCategories.find(c => c.value === cat);

                  const pct = totalExpenses > 0 ? (total / totalExpenses * 100).toFixed(1) : 0;

                  return (

                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                      <span style={{ fontSize: '18px', width: '28px' }}>{catInfo?.icon || '📦'}</span>

                      <span style={{ fontSize: '12px', fontWeight: '600', width: '130px' }}>{catInfo?.label || cat}</span>

                      <div style={{ flex: 1, height: '20px', background: 'var(--bg-input)', borderRadius: '10px', overflow: 'hidden' }}>

                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), #e67e22)', borderRadius: '10px', minWidth: pct > 0 ? '4px' : '0' }} />

                      </div>

                      <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '80px', textAlign: 'right' }}>{total.toLocaleString('tr-TR')} ₺</span>

                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '40px' }}>%{pct}</span>

                    </div>

                  );

                })}

              </div>

              <div className="table-wrapper"><table className="table"><thead><tr><th>Kategori</th><th>Açıklama</th><th>Tutar</th><th>Tekrar</th><th></th></tr></thead><tbody>

                {expenses.filter(e => !expenseCatFilter || e.category === expenseCatFilter).map(e => {

                  const catInfo = expenseCategories.find(c => c.value === e.category);

                  return (<tr key={e.id}><td>{catInfo?.icon} {catInfo?.label || e.category}</td><td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{e.description || '—'}</td><td style={{ fontWeight: '700' }}>{e.amount.toLocaleString('tr-TR')} ₺</td><td>{e.is_recurring ? <span className="badge badge-info">📋 Aylık</span> : '—'}</td><td style={{ display: 'flex', gap: '4px' }}><button onClick={() => openEditCost(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }} title="Düzenle">✏️</button><button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }} title="Sil">🗑️</button></td></tr>);

                })}

              </tbody></table></div>

            </div>

          )}

        </div>



        <div className="card" style={{ marginBottom: '16px' }}>

          <div className="card-header"><h3 className="card-title">📦 Model Bazlı Maliyet</h3></div>

          {Object.keys(modelCosts).length === 0 ? (

            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Üretim verisi yok.</div>

          ) : (

            <div className="table-wrapper"><table className="table"><thead><tr><th>Model</th><th>Üretim</th><th>Fire</th><th>Değer</th><th>İşçilik</th><th>Birim</th><th>Karlılık</th></tr></thead><tbody>

              {Object.entries(modelCosts).map(([mid, mc]) => {

                const model = models.find(m => m.id == mid);

                const unitCost = mc.totalProduced > 0 ? mc.totalLaborCost / mc.totalProduced : 0;

                const fasonPrice = model?.fason_price || 0;

                const profit = fasonPrice > 0 ? fasonPrice - unitCost : 0;

                return (<tr key={mid}><td><strong>{mc.name}</strong><br /><code style={{ fontSize: '11px', background: 'var(--bg-input)', padding: '1px 4px', borderRadius: '3px' }}>{mc.code}</code></td><td style={{ fontWeight: '700' }}>{mc.totalProduced} ad</td><td><span className={`badge ${mc.totalDefective > 0 ? 'badge-danger' : 'badge-success'}`}>{mc.totalProduced > 0 ? ((mc.totalDefective / mc.totalProduced) * 100).toFixed(1) : 0}%</span></td><td style={{ fontWeight: '600', color: 'var(--accent)' }}>{mc.totalValue.toFixed(0)} ₺</td><td style={{ color: 'var(--danger)' }}>{mc.totalLaborCost.toFixed(0)} ₺</td><td style={{ fontWeight: '700' }}>{unitCost.toFixed(2)} ₺/ad</td><td>{fasonPrice > 0 ? <span style={{ fontWeight: '700', color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{profit >= 0 ? '+' : ''}{profit.toFixed(2)} ₺</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td></tr>);

              })}

            </tbody></table></div>

          )}

        </div>



        <div className="card">

          <div className="card-header"><h3 className="card-title">👥 Personel Maliyet</h3></div>

          {Object.keys(personnelCosts).length === 0 ? (

            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Veri yok.</div>

          ) : (

            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="table">
                <thead><tr><th>Personel</th><th>Maaş</th><th>SSK</th><th>Ulaşım</th><th>Yemek</th><th>Toplam</th><th>Üretim</th><th>Fark</th><th>Verimlilik</th></tr></thead>
                <tbody>
                  {Object.entries(personnelCosts).map(([pid, pc]) => {
                    const p = personnel.find(pp => pp.id == pid);
                    const salary = p?.base_salary || 0;
                    const ssk = p?.ssk_cost || 0;
                    const transport = p?.transport_allowance || 0;
                    const food = p?.food_allowance || 0;
                    const totalCost = salary + ssk + transport + food + (p?.compensation || 0);
                    const totalWage = pc.dailyWage * Math.max(1, pc.days.size);
                    const diff = pc.totalValue - totalCost;
                    const efficiency = totalCost > 0 ? Math.round((pc.totalValue / totalCost) * 100) : 0;
                    return (
                      <tr key={pid}>
                        <td style={{ fontWeight: '700' }}>{pc.name}</td>
                        <td>{salary.toLocaleString('tr-TR')} ₺</td>
                        <td>{ssk.toLocaleString('tr-TR')} ₺</td>
                        <td>{transport.toLocaleString('tr-TR')} ₺</td>
                        <td>{food.toLocaleString('tr-TR')} ₺</td>
                        <td style={{ fontWeight: '700', color: '#8e44ad' }}>{totalCost.toLocaleString('tr-TR')} ₺</td>
                        <td style={{ fontWeight: '600', color: 'var(--accent)' }}>{pc.totalValue.toFixed(0)} ₺</td>
                        <td style={{ fontWeight: '700', color: diff >= 0 ? 'var(--success)' : 'var(--danger)' }}>{diff >= 0 ? '+' : ''}{diff.toLocaleString('tr-TR')} ₺</td>
                        <td><span className={`badge ${efficiency >= 100 ? 'badge-success' : efficiency >= 70 ? 'badge-warning' : 'badge-danger'}`}>%{efficiency}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          )}

        </div>

      </div>

      {/* EDIT COST MODAL */}
      {editCost && (
        <div className="modal-overlay" onClick={() => setEditCost(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div className="modal-header"><h2 className="modal-title">✏️ Gider Düzenle</h2><button className="modal-close" onClick={() => setEditCost(null)}>✕</button></div>
          <form onSubmit={handleUpdateCost}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Kategori</label>
              <select className="form-select" value={editCostForm.category} onChange={e => setEditCostForm({ ...editCostForm, category: e.target.value })}>
                {expenseCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Tutar (₺)</label><input className="form-input" type="number" step="0.01" value={editCostForm.amount} onChange={e => setEditCostForm({ ...editCostForm, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="form-group"><label className="form-label">Açıklama</label><input className="form-input" value={editCostForm.description} onChange={e => setEditCostForm({ ...editCostForm, description: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>💾 Kaydet</button>
              <button type="button" className="btn" onClick={() => setEditCost(null)} style={{ flex: 1 }}>İptal</button>
            </div>
          </form>
        </div></div>
      )}

    </>

  );

}





// ========== ÜRETİM BÖLÜMÜ MUHASEBE DEPARTMANI ==========

function MuhasebeDepartmaniPage({ models, personnel, addToast }) {
  const [rapor, setRapor] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aiRapor, setAiRapor] = useState('');
  const [aiYukleniyor, setAiYukleniyor] = useState(false);
  const [aktifBolum, setAktifBolum] = useState('ozet');

  useEffect(() => {
    const veriCek = async () => {
      setYukleniyor(true);
      try {
        const bugun = new Date().toISOString().split('T')[0];
        const [ordersRes, prodRes, costsRes, uretimRes] = await Promise.all([
          fetch('/api/orders').then(r => r.json()),
          fetch('/api/production').then(r => r.json()),
          fetch('/api/costs').then(r => r.json()),
          fetch(`/api/uretim-ozet?tarih=${bugun}`).then(r => r.json()),
        ]);
        const orders = Array.isArray(ordersRes) ? ordersRes : [];
        const prod = Array.isArray(prodRes) ? prodRes : [];
        const costs = Array.isArray(costsRes) ? costsRes : [];
        const uretimOzet = uretimRes || {};
        const toplamUretim = prod.reduce((s, p) => s + (p.total_produced || 0), 0);
        const toplamHata = prod.reduce((s, p) => s + (p.defective_count || 0), 0);
        const toplamMaliyet = costs.reduce((s, c) => s + (c.total || c.amount || 0), 0);
        setRapor({
          siparis: {
            toplam: orders.length,
            aktif: orders.filter(o => !['tamamlandi', 'iptal'].includes(o.status)).length,
            gecikmus: orders.filter(o => o.delivery_date && new Date(o.delivery_date) < new Date() && !['tamamlandi', 'iptal'].includes(o.status)).length,
            tamamlanan: orders.filter(o => o.status === 'tamamlandi').length,
          },
          model: { toplam: models.length },
          uretim: {
            bugunUretim: uretimOzet.toplam_uretim || 0,
            hedefYuzdesi: uretimOzet.hedef_yuzdesi || 0,
            fpy: uretimOzet.fpy || 100,
            toplamUretim, toplamHata,
            hataOrani: toplamUretim > 0 ? ((toplamHata / toplamUretim) * 100).toFixed(1) : 0,
          },
          personel: {
            toplam: personnel.length,
            aktif: personnel.filter(p => p.status === 'active').length,
          },
          maliyet: { toplam: toplamMaliyet.toFixed(0) },
        });
      } catch (err) { console.error('Muhasebe veri hatası:', err); }
      finally { setYukleniyor(false); }
    };
    veriCek();
  }, [models, personnel]);

  const aiRaporOlustur = async () => {
    if (!rapor) return;
    setAiYukleniyor(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Fabrika yöneticisi için kapsamlı haftalık rapor hazırla. Veriler:\n- Aktif sipariş: ${rapor.siparis.aktif}, Gecikmiş: ${rapor.siparis.gecikmus}\n- Toplam model: ${rapor.model.toplam}\n- Bugün üretim: ${rapor.uretim.bugunUretim} adet, Hedef: %${rapor.uretim.hedefYuzdesi}, FPY: %${rapor.uretim.fpy}\n- Hata oranı: %${rapor.uretim.hataOrani}\n- Aktif personel: ${rapor.personel.aktif}/${rapor.personel.toplam}\n- Toplam maliyet kaydı: ${rapor.maliyet.toplam} TL\n\nÖnemli bulgular, riskler ve 3 somut öneri ver. Türkçe, özlü, yönetim kurulu düzeyi.`
        })
      });
      const data = await res.json();
      setAiRapor(data.reply || 'Rapor oluşturulamadı.');
    } catch { setAiRapor('Rapor oluşturulamadı.'); }
    finally { setAiYukleniyor(false); }
  };

  const bolumler = [
    { id: 'ozet', label: '📊 Genel Özet' },
    { id: 'siparis', label: '📋 Siparişler' },
    { id: 'model', label: '👗 Modeller' },
    { id: 'uretim', label: '🏭 Üretim' },
    { id: 'personel', label: '👥 Personel' },
    { id: 'final', label: '🤖 Final Raporu' },
  ];

  if (yukleniyor) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
      <div style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Veriler yükleniyor...</div>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">📊 Üretim Bölümü — Muhasebe Departmanı</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
            4 panelin iş analizi — {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <button className="btn btn-primary" onClick={aiRaporOlustur} disabled={aiYukleniyor}>
          {aiYukleniyor ? '⏳ Hazırlanıyor...' : '🤖 AI Final Raporu Oluştur'}
        </button>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {bolumler.map(b => (
            <button key={b.id} onClick={() => setAktifBolum(b.id)} style={{
              padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
              background: aktifBolum === b.id ? 'var(--accent)' : 'var(--bg-card)',
              color: aktifBolum === b.id ? '#fff' : 'var(--text-primary)',
              fontWeight: '600', fontSize: '15px',
              border: `1px solid ${aktifBolum === b.id ? 'var(--accent)' : 'var(--border-color)'}`,
              transition: 'all 0.2s'
            }}>{b.label}</button>
          ))}
        </div>

        {aktifBolum === 'ozet' && rapor && (
          <div>
            <div className="stats-grid">
              {[
                { icon: '📋', val: rapor.siparis.aktif, label: 'Aktif Sipariş', sub: rapor.siparis.gecikmus > 0 ? `⚠️ ${rapor.siparis.gecikmus} gecikmiş` : null, subColor: 'var(--danger)' },
                { icon: '👗', val: rapor.model.toplam, label: 'Toplam Model' },
                { icon: '🏭', val: rapor.uretim.bugunUretim, label: 'Bugünkü Üretim', sub: `Hedef: %${rapor.uretim.hedefYuzdesi}`, subColor: rapor.uretim.hedefYuzdesi >= 80 ? 'var(--success)' : 'var(--warning)' },
                { icon: '👥', val: rapor.personel.aktif, label: 'Aktif Personel' },
                { icon: '✅', val: `%${rapor.uretim.fpy}`, label: 'FPY Verimi' },
                { icon: '⚠️', val: `%${rapor.uretim.hataOrani}`, label: 'Hata Oranı', valColor: parseFloat(rapor.uretim.hataOrani) > 5 ? 'var(--danger)' : 'var(--success)' },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-value" style={s.valColor ? { color: s.valColor } : {}}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                  {s.sub && <div style={{ color: s.subColor, fontSize: '13px', marginTop: '4px' }}>{s.sub}</div>}
                </div>
              ))}
            </div>
            {rapor.siparis.gecikmus > 0 && (
              <div style={{ padding: '16px 20px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>🚨</span>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--danger)', fontSize: '16px' }}>{rapor.siparis.gecikmus} Gecikmiş Sipariş!</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px' }}>Müşteri ilişkileri riski — acil aksiyon gerekiyor.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {aktifBolum === 'siparis' && rapor && (
          <div className="card">
            <div className="card-header"><div className="card-title">📋 Sipariş Analizi</div></div>
            <div className="stats-grid">
              {[
                { label: 'Toplam Sipariş', val: rapor.siparis.toplam },
                { label: 'Aktif', val: rapor.siparis.aktif },
                { label: 'Tamamlanan', val: rapor.siparis.tamamlanan },
                { label: 'Gecikmiş', val: rapor.siparis.gecikmus },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-value">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aktifBolum === 'model' && (
          <div className="card">
            <div className="card-header"><div className="card-title">👗 Model Analizi</div></div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Model</th><th>Müşteri</th><th>Sipariş Adedi</th><th>Fason Fiyat</th><th>Zorluk</th></tr></thead>
                <tbody>
                  {models.slice(0, 15).map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.name}</strong><br /><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.code}</span></td>
                      <td>{m.customer || '—'}</td>
                      <td>{m.total_order || 0}</td>
                      <td>{m.fason_price ? m.fason_price + ' ₺' : '—'}</td>
                      <td>{m.model_difficulty || 5}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {aktifBolum === 'uretim' && rapor && (
          <div className="card">
            <div className="card-header"><div className="card-title">🏭 Üretim Performans Analizi</div></div>
            <div className="stats-grid">
              {[
                { label: 'Bugün Üretim', val: rapor.uretim.bugunUretim + ' adet' },
                { label: 'Hedef', val: '%' + rapor.uretim.hedefYuzdesi },
                { label: 'FPY', val: '%' + rapor.uretim.fpy },
                { label: 'Toplam Hata', val: rapor.uretim.toplamHata + ' adet' },
                { label: 'Hata Oranı', val: '%' + rapor.uretim.hataOrani },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-value">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aktifBolum === 'personel' && (
          <div className="card">
            <div className="card-header"><div className="card-title">👥 Personel Analizi</div></div>
            <div className="stats-grid" style={{ marginBottom: '20px' }}>
              <div className="stat-card"><div className="stat-value">{personnel.length}</div><div className="stat-label">Toplam</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{personnel.filter(p => p.status === 'active').length}</div><div className="stat-label">Aktif</div></div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Ad Soyad</th><th>Görev</th><th>Seviye</th><th>Durum</th></tr></thead>
                <tbody>
                  {personnel.slice(0, 15).map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.role || '—'}</td>
                      <td>{p.skill_level || 'başlangıç'}</td>
                      <td><span className={`badge badge-${p.status === 'active' ? 'success' : 'warning'}`}>{p.status === 'active' ? '✅ Aktif' : '⏸ Pasif'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {aktifBolum === 'final' && (
          <div className="card">
            <div className="card-header"><div className="card-title">🤖 AI Destekli Final Raporu</div></div>
            {!aiRapor ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>🤖</div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Final Raporu Hazır Değil</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>Fabrika verilerini analiz edip yönetim kurulu düzeyinde rapor hazırlayacağım.</div>
                <button className="btn btn-primary btn-lg" onClick={aiRaporOlustur} disabled={aiYukleniyor}>
                  {aiYukleniyor ? '⏳ Analiz yapılıyor...' : '🚀 AI Final Raporu Oluştur'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '24px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', lineHeight: '1.9', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                {aiRapor}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



// ========== MAIN APP ==========

export default function Home() {

  const [activePage, setActivePage] = useState('dashboard');

  const [models, setModels] = useState([]);

  const [personnel, setPersonnel] = useState([]);

  const [toasts, setToasts] = useState([]);

  const [chatbotAcik, setChatbotAcik] = useState(false);



  const addToast = useCallback((type, message) => {

    const id = Date.now();

    setToasts(prev => [...prev, { id, type, message }]);

    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);

  }, []);



  const loadModels = useCallback(async () => {

    try { const res = await fetch('/api/models'); const data = await res.json(); setModels(Array.isArray(data) ? data : []); } catch (err) { console.error('Models load error:', err); }

  }, []);



  const loadPersonnel = useCallback(async () => {

    try { const res = await fetch('/api/personnel'); const data = await res.json(); setPersonnel(Array.isArray(data) ? data : []); } catch (err) { console.error('Personnel load error:', err); }

  }, []);



  useEffect(() => { loadModels(); loadPersonnel(); }, [loadModels, loadPersonnel]);



  const renderPage = () => {

    switch (activePage) {

      case 'dashboard': return <DashboardPage models={models} personnel={personnel} />;

      case 'models': return <ModelsPage models={models} loadModels={loadModels} addToast={addToast} />;

      case 'personnel': return <PersonnelPage personnel={personnel} loadPersonnel={loadPersonnel} addToast={addToast} />;

      case 'production': return <ProductionPage models={models} personnel={personnel} addToast={addToast} />;

      case 'reports': return <ReportsPage models={models} personnel={personnel} addToast={addToast} />;

      case 'machines': return <MachinesPage addToast={addToast} />;

      case 'quality': return <QualityPage models={models} personnel={personnel} addToast={addToast} />;

      case 'prim': return <PrimPage models={models} personnel={personnel} addToast={addToast} />;

      case 'orders': return <OrdersPage models={models} addToast={addToast} />;

      case 'customers': return <CustomersPage addToast={addToast} />;

      case 'fason': return <FasonPage models={models} addToast={addToast} />;

      case 'shipments': return <ShipmentsPage models={models} addToast={addToast} />;

      case 'settings': return <SettingsPage addToast={addToast} />;

      case 'costs': return <CostsPage models={models} personnel={personnel} addToast={addToast} />;

      case 'muhasebe': return <MuhasebeDepartmaniPage models={models} personnel={personnel} addToast={addToast} />;

      default: return <DashboardPage models={models} personnel={personnel} />;

    }

  };



  return (

    <div className="app-layout">

      <Sidebar activePage={activePage} setActivePage={setActivePage} onChatbotToggle={() => setChatbotAcik(prev => !prev)} />

      <main className="main-content">

        {renderPage()}

      </main>

      <Toast toasts={toasts} />

      {chatbotAcik && <ChatbotPanel onClose={() => setChatbotAcik(false)} activePage={activePage} />}

    </div>

  );

}

