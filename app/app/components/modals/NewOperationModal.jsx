'use client';

import { useState, useEffect, useCallback, useRef } from 'react';


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

export default NewOperationModal;
