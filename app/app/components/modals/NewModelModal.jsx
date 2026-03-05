'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
      total_operations: '',
      op_kesim_count: '', op_kesim_details: '',
      op_dikim_count: '', op_dikim_details: '',
      op_dikim_rows: [
        { id: 1, makine: 'Düz Makina', adet: '', detay: '' },
        { id: 2, makine: 'Overlok', adet: '', detay: '' },
      ],
      op_utu_paket_count: '', op_utu_paket_details: '',
      op_nakis_count: '', op_nakis_details: '',
      op_yikama_count: '', op_yikama_details: '',
      has_lining: false, lining_pieces: '',
      has_interlining: false, interlining_parts: '', interlining_count: '',
      piece_count: '', piece_count_details: '',
      difficult_points: '', critical_points: '', customer_requests: '',
      work_start_date: '', front_image: '', back_image: '',

      // YENİ PLM ALANLARI
      collection_name: '',
      target_audience: '',
      designer_name: '',
      tech_pack_data: {
        bom_trims: '',
        stitching_tolerance: '',
        fit_sample_feedback: '',
        pre_production_notes: '',
        estimated_consumption: ''
      }
    };
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaults, ...parsed };
        }
      } catch { }
    }
    return defaults;
  };
  const [form, setForm] = useState(getInitialForm);

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
  const [frontPreview, setFrontPreview] = useState(form.front_image || null);
  const [backPreview, setBackPreview] = useState(form.back_image || null);
  const [uploading, setUploading] = useState({ front: false, back: false });
  const [themeColor, setThemeColor] = useState('emerald');
  const [activeTab, setActiveTab] = useState('kimlik'); // kimlik, bom, plm

  const themes = {
    emerald: { name: 'Zümrüt', primary: '#0D7C66', bg: 'rgba(13,124,102,0.06)', border: '#0D7C66' },
  };
  const T = themes[themeColor];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    setSaving(true);
    try {
      const dikimToplam = form.op_dikim_rows.reduce((s, r) => s + (parseInt(r.adet) || 0), 0);
      const dikimDetay = form.op_dikim_rows
        .filter(r => r.makine || r.adet)
        .map(r => `${r.makine}${r.adet ? ': ' + r.adet + ' adet' : ''}${r.detay ? ' (' + r.detay + ')' : ''}`)
        .join(', ');

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
        tech_pack_data: JSON.stringify(form.tech_pack_data)
      });
      clearDraft();
    } finally { setSaving(false); }
  };

  const handleImageUpload = async (file, side) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) return alert('Sadece JPG/PNG/WebP');

    const reader = new FileReader();
    reader.onload = (e) => { if (side === 'front') setFrontPreview(e.target.result); else setBackPreview(e.target.result); };
    reader.readAsDataURL(file);

    setUploading(prev => ({ ...prev, [side]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('operation_name', side === 'front' ? 'on_gorsel' : 'arka_gorsel');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm(prev => ({ ...prev, [side === 'front' ? 'front_image' : 'back_image']: data.url }));
    } catch { } finally { setUploading(prev => ({ ...prev, [side]: false })); }
  };

  const F = (label, key, placeholder, type = 'text') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  const FT = (label, key, placeholder, rows = 2) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <textarea className="form-textarea" rows={rows} placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', borderTop: '4px solid #0D7C66', background: '#fcfcfc' }}>

        <div style={{ background: 'linear-gradient(135deg, #0D7C66 0%, #14a085 100%)', padding: '16px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>👗 İleri Düzey AR-GE & Model Kartı</h2>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>PLM (Product Lifecycle Management) Standardı</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* SEKME YAPISI */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ddd', background: '#f4f4f4' }}>
          <div onClick={() => setActiveTab('kimlik')} style={{ padding: '12px 24px', cursor: 'pointer', fontWeight: activeTab === 'kimlik' ? '700' : '500', background: activeTab === 'kimlik' ? '#fff' : 'transparent', borderBottom: activeTab === 'kimlik' ? '3px solid #0D7C66' : 'none' }}>🏷️ 1. Kimlik & Görsel</div>
          <div onClick={() => setActiveTab('bom')} style={{ padding: '12px 24px', cursor: 'pointer', fontWeight: activeTab === 'bom' ? '700' : '500', background: activeTab === 'bom' ? '#fff' : 'transparent', borderBottom: activeTab === 'bom' ? '3px solid #0D7C66' : 'none' }}>🧵 2. Malzeme & Dikim (BOM)</div>
          <div onClick={() => setActiveTab('plm')} style={{ padding: '12px 24px', cursor: 'pointer', fontWeight: activeTab === 'plm' ? '700' : '500', background: activeTab === 'plm' ? '#fff' : 'transparent', borderBottom: activeTab === 'plm' ? '3px solid #0D7C66' : 'none' }}>📐 3. Kalıp & Tech-Pack</div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>

          {/* TAB 1: KİMLİK */}
          {activeTab === 'kimlik' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ border: '2px dashed #ccc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('f_img').click()}>
                  <input type="file" id="f_img" style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files[0], 'front')} />
                  {frontPreview ? <img src={frontPreview} style={{ height: '100%', objectFit: 'contain' }} /> : <span>ÖN GÖRSEL YÜKLE</span>}
                </div>
                <div style={{ border: '2px dashed #ccc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('b_img').click()}>
                  <input type="file" id="b_img" style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files[0], 'back')} />
                  {backPreview ? <img src={backPreview} style={{ height: '100%', objectFit: 'contain' }} /> : <span>ARKA GÖRSEL YÜKLE</span>}
                </div>
              </div>

              <div className="form-row">{F('Model Adı *', 'name', 'Yazlık Elbise')}{F('Model Kodu *', 'code', 'ELB-01')}</div>
              <div className="form-row">{F('Koleksiyon (Sezon)', 'collection_name', 'SS26 (İlkbahar/Yaz)')}{F('Hedef Kitle', 'target_audience', 'Genç / 18-25 Yaş')}</div>
              <div className="form-row">{F('Tasarımcı / Modelist', 'designer_name', 'Ahmet Yılmaz')}{F('Müşteri (Eğer Fason ise)', 'customer', 'Müşteri Firma')}</div>
              <div className="form-row">{F('Dış Giyim Türü (Açıklama)', 'description', 'Elbise detayları')}</div>
            </div>
          )}

          {/* TAB 2: BOM & OPERASYONLAR */}
          {activeTab === 'bom' && (
            <div>
              <h4 style={{ color: '#0D7C66', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Kumaş & Malzeme Reçetesi (BOM)</h4>
              <div className="form-row">{F('Ana Kumaş Cinsi', 'fabric_type', '%80 Pamuk, %20 Elastan')}{F('Garni / Ekstra Kumaş', 'garni', 'Dantel Yaka')}</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Astar Var mı?</label>
                  <input type="checkbox" checked={form.has_lining} onChange={e => setForm({ ...form, has_lining: e.target.checked })} />
                </div>
                {form.has_lining && F('Astar Parça Sayısı', 'lining_pieces', '3 parça astar')}
              </div>

              <div className="form-group">
                <label className="form-label">Aksesuarlar (Fermuar, Düğme, Etiket vb.) & Sarfiyatları</label>
                <textarea className="form-textarea" rows="2" placeholder="Örn: 1 Adet 50cm gizli fermuar, 4 adet kemik düğme" value={form.tech_pack_data.bom_trims}
                  onChange={e => setForm({ ...form, tech_pack_data: { ...form.tech_pack_data, bom_trims: e.target.value } })} />
              </div>
              <div className="form-group">
                <label className="form-label">Kumaş Ön-Sarfiyat Tahmini (Metre/Kg)</label>
                <input className="form-input" placeholder="Örn: 1.25 Metre Kumaş / Elbise başı" value={form.tech_pack_data.estimated_consumption}
                  onChange={e => setForm({ ...form, tech_pack_data: { ...form.tech_pack_data, estimated_consumption: e.target.value } })} />
              </div>

              <h4 style={{ color: '#0D7C66', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginTop: '20px' }}>Dikim Talimatları</h4>
              {form.op_dikim_rows.map((row, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input className="form-input" style={{ flex: 1 }} value={row.makine} onChange={e => { const r = [...form.op_dikim_rows]; r[idx].makine = e.target.value; setForm({ ...form, op_dikim_rows: r }); }} />
                  <input className="form-input" placeholder="Adet" style={{ width: '80px' }} value={row.adet} onChange={e => { const r = [...form.op_dikim_rows]; r[idx].adet = e.target.value; setForm({ ...form, op_dikim_rows: r }); }} />
                  <input className="form-input" placeholder="Operasyon Detayı (Yaka takma vb)" style={{ flex: 2 }} value={row.detay} onChange={e => { const r = [...form.op_dikim_rows]; r[idx].detay = e.target.value; setForm({ ...form, op_dikim_rows: r }); }} />
                </div>
              ))}
              <button type="button" onClick={() => setForm({ ...form, op_dikim_rows: [...form.op_dikim_rows, { makine: '', adet: '', detay: '' }] })} style={{ fontSize: '12px', padding: '5px', cursor: 'pointer' }}>+ Dikim Satırı Ekle</button>
            </div>
          )}

          {/* TAB 3: PLM & KALIP */}
          {activeTab === 'plm' && (
            <div>
              <h4 style={{ color: '#0D7C66', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Model Kalıp & Ölçüm Bilgileri</h4>
              <div className="form-row">{F('Beden Numaraları', 'sizes', '36, 38, 40, 42')}{F('Beden Skalası (Range)', 'size_range', 'S-XL veya 36-44')}</div>
              <div className="form-row">{F('Asorti Dağılım Formatı', 'asorti', '1x36, 2x38, 2x40, 1x42')}{F('Renk Sayısı / İsimleri', 'color_details', '4 Renk (Siyah, Kırmızı vs)')}</div>

              <h4 style={{ color: '#0D7C66', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginTop: '20px' }}>Numune İzleme (Prototyping)</h4>
              <div className="form-group">
                <label className="form-label">1. Numune (Fit Sample) Yorumları</label>
                <textarea className="form-textarea" rows="2" placeholder="Omuzlardan kastı, yaka 1cm düşecek..." value={form.tech_pack_data.fit_sample_feedback}
                  onChange={e => setForm({ ...form, tech_pack_data: { ...form.tech_pack_data, fit_sample_feedback: e.target.value } })} />
              </div>

              <div className="form-group">
                <label className="form-label">Üretim Öncesi (Pre-Production) Kalite Notları</label>
                <textarea className="form-textarea" rows="2" placeholder="Kumaş yıkamada %2 çekiyor, kesim 2cm bol atılacak." value={form.tech_pack_data.pre_production_notes}
                  onChange={e => setForm({ ...form, tech_pack_data: { ...form.tech_pack_data, pre_production_notes: e.target.value } })} />
              </div>

              <div className="form-group">
                <label className="form-label">Dikiş ve Ölçü Tolerans Sınırları (+/- cm)</label>
                <input className="form-input" placeholder="Etek ucu +/- 1cm kabul edilir, Kol boyu +/- 0.5cm" value={form.tech_pack_data.stitching_tolerance}
                  onChange={e => setForm({ ...form, tech_pack_data: { ...form.tech_pack_data, stitching_tolerance: e.target.value } })} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Model Hazırlık Durumu</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="orijinal_numune">Orijinal Numune Deneniyor</option>
                    <option value="numune_onaylandi">Numune Onaylandı (Tech-Pack Hazır)</option>
                    <option value="uretimde">Üretime/Fasona Verildi</option>
                  </select>
                </div>
              </div>

            </div>
          )}

          <div className="modal-footer" style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '💾 Kaydediliyor...' : '💾 Modeli ve Tech-Pack Kaydet'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewModelModal;
