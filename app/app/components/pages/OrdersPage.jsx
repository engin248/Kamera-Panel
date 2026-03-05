'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import BirimAsistanPanel from '../BirimAsistanPanel';
import { useVoiceInput } from '../../../hooks/useVoiceInput';

function OrdersPage({ models, addToast }) {
  const [orderTab, setOrderTab] = useState('liste');

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

  const SearchableDropdown = ({ options, value, onSelect, placeholder, onNew }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
      const selectedOpt = options.find(o => String(o.id) === String(value));
      if (selectedOpt) setSearch(selectedOpt.label);
      else setSearch('');
    }, [value, options]);

    useEffect(() => {
      const handleClick = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    return (
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <input
          className="form-input"
          value={isOpen ? search : (options.find(o => String(o.id) === String(value))?.label || '')}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setSearch(''); }}
          placeholder={placeholder}
          style={{ width: '100%' }}
        />
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</div>

        {isOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', marginTop: '4px', zIndex: 100, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}
              onClick={() => { onSelect(''); setIsOpen(false); }}
            >
              — Seçimi Temizle —
            </div>
            {filtered.map(o => (
              <div
                key={o.id}
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}
                onClick={() => { onSelect(String(o.id)); setIsOpen(false); }}
              >
                {o.label}
              </div>
            ))}
            {onNew && (
              <div
                style={{ padding: '8px 12px', cursor: 'pointer', background: 'rgba(52,152,219,0.1)', color: '#3498db', fontWeight: 'bold', fontSize: '13px' }}
                onClick={() => { onSelect('__new__'); setIsOpen(false); }}
              >
                ✍️ Yeni (Elle Yaz)
              </div>
            )}
            {filtered.length === 0 && <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>Sonuç bulunamadı.</div>}
          </div>
        )}
      </div>
    );
  };




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



  const updateStatus = async (o, ns) => {
    try {
      if (ns === 'uretimde' && o.model_id) {
        await fetch('/api/uretim-giris', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: o.model_id,
            parca_sayisi: o.quantity || 0,
            notlar: `${o.order_no} siparişinden otomatik üretildi`
          })
        });
        addToast('success', 'Üretim dosyası da açıldı!');
      } else if (ns === 'fason' && o.model_id) {
        await fetch('/api/fason/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider_id: 1,
            model_id: o.model_id,
            quantity: o.quantity || 0,
            notes: `${o.order_no} Siparişi - Fason'a sevkiyat`,
            operation_type: 'Tam Paket',
            unit_price: 0
          })
        });
        addToast('success', 'Fason sipariş taslağı oluşturuldu!');
      }

      await fetch(`/api/orders/${o.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: ns }) });
      await load();
      addToast('success', `Durum güncellendi`);
    } catch {
      addToast('error', 'Güncellenemedi');
    }
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

        <SearchableDropdown
          options={customers.map(c => ({ id: c.id, label: `${c.name}${c.company ? ` (${c.company})` : ''}` }))}
          value={f.customer_id}
          onSelect={(val) => setF({ ...f, customer_id: val })}
          placeholder="Ünvanla veya isimle ara..."
          onNew={true}
        />

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

        <SearchableDropdown
          options={models.map(m => ({ id: m.id, label: `${m.name} (Mod. No: ${m.code})` }))}
          value={f.model_id}
          onSelect={(val) => setF({ ...f, model_id: val })}
          placeholder="Model No veya isimle ara..."
          onNew={true}
        />

      )}

    </div>

  );



  const FormFields = ({ f, setF, v, isEdit, modelsList }) => {
    const selectedModel = modelsList?.find(m => m.id === parseInt(f.model_id || 0));
    // İşletme Zekası: Tarihsel Reçete Maliyeti (BOM Cost)
    // Gerçekte reçeteden (tech_pack/operations) hesaplanır, veritabanından simüle ediyoruz
    const bomCost = selectedModel ? (parseFloat(selectedModel.fason_price) || 85.50) : 0;
    const unitPrice = parseFloat(f.unit_price || 0);
    const isDangerMargin = selectedModel && unitPrice > 0 && (bomCost > (unitPrice * 0.8));

    return (<>

      {/* BÖLÜM 1: TEMEL BİLGİLER */}

      <div style={{ background: 'rgba(52,152,219,0.08)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', borderLeft: '3px solid #3498db' }}>

        <div style={{ fontSize: '13px', fontWeight: '700', color: '#3498db', marginBottom: '14px' }}>📋 1. Temel Bilgiler</div>

        <div className="form-row">

          <CustomerField f={f} setF={setF} v={v} />

          <ModelField f={f} setF={setF} v={v} />

        </div>

        <div className="form-row">

          <VF label="Adet" fk="quantity" type="number" req ph="100" fs={f} setFs={setF} vh={v} />

          <div>
            <VF label="Birim Fiyat (₺)" fk="unit_price" type="number" step="0.01" ph="0.00" fs={f} setFs={setF} vh={v} />
            {selectedModel && (
              <div style={{ marginTop: '4px', padding: '6px', borderRadius: '6px', background: isDangerMargin ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)', border: `1px solid ${isDangerMargin ? '#e74c3c' : '#2ecc71'}`, fontSize: '11px', fontWeight: 'bold' }}>
                <div style={{ color: isDangerMargin ? '#e74c3c' : '#27ae60' }}>
                  Tarihsel Reçete (BOM) Maliyeti: ~{bomCost.toFixed(2)} ₺
                </div>
                {isDangerMargin && (
                  <div style={{ marginTop: '4px', color: '#c0392b' }}>
                    ⚠️ DİKKAT: Maliyet satış fiyatının %80'ini aşıyor! İşletme kârı eriyor.
                  </div>
                )}
              </div>
            )}
            {isDangerMargin && (
              <div style={{ marginTop: '6px' }}>
                <input type="password" placeholder="Koordinatör Onay Şifresi *" className="form-input" style={{ borderColor: '#e74c3c' }} required />
              </div>
            )}
          </div>

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
  };



  const totalRevenue = orders.reduce((s, o) => s + (o.total_price || 0), 0);

  const activeOrders = orders.filter(o => !['tamamlandi', 'sevk_edildi'].includes(o.status)).length;



  return (

    <>

      <div className="topbar">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <h1 className="topbar-title" style={{ margin: 0 }}>📋 Siparişler</h1>
          <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
            <button onClick={() => setOrderTab('liste')} style={{ padding: '6px 16px', background: orderTab === 'liste' ? 'var(--accent)' : 'transparent', color: orderTab === 'liste' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }}>
              📋 Sipariş Listesi
            </button>
            <button onClick={() => setOrderTab('asistan')} style={{ padding: '6px 16px', background: orderTab === 'asistan' ? 'rgba(52,152,219,0.15)' : 'transparent', color: orderTab === 'asistan' ? 'var(--accent)' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💬 Sipariş Asistanı
            </button>
          </div>
        </div>
        <div className="topbar-actions"><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Yeni Sipariş</button></div>
      </div>

      {orderTab === 'liste' && (
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

                  <td>
                    <div style={{ fontWeight: '600' }}>{o.model_name || o.m_name || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{models.find(m => m.id === o.model_id)?.code ? `Mod. No: ${models.find(m => m.id === o.model_id).code}` : ''}</div>
                  </td>

                  <td style={{ fontWeight: '700' }}>{o.quantity?.toLocaleString('tr-TR')}</td>

                  <td style={{ color: 'var(--accent)', fontWeight: '600' }}>{o.total_price?.toLocaleString('tr-TR')} ₺</td>

                  <td>{o.delivery_date || '—'}</td>

                  <td><span style={{ fontSize: '12px' }}>{pLabels[o.priority] || o.priority}</span></td>

                  <td><span className="badge" style={{ background: sColors[o.status] || '#888', color: '#fff', fontSize: '11px' }}>{sLabels[o.status] || o.status}</span></td>

                  <td><div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>

                    {nxStatus[o.status] && <button onClick={() => updateStatus(o, nxStatus[o.status])} style={{ background: sColors[nxStatus[o.status]], color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{nxLabel[o.status]}</button>}

                    <button onClick={() => setDetailOrder(o)} title="Detay" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>👁️</button>

                    <button onClick={() => openEdit(o)} title="Düzenle" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✏️</button>

                    <button onClick={() => handleDelete(o.id, o.order_no)} title="Arşivle (kalıcı silinmez)" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>🗃️</button>

                  </div></td>

                </tr>

              ))}

            </tbody></table></div>

          )}

        </div>
      )}

      {orderTab === 'asistan' && (
        <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <BirimAsistanPanel
            birimAdi="Sipariş & Müşteri Sorumlusu"
            aciklama="Müşteri talepleri, termin tarihi takibi ve sipariş gecikme/risk analizlerinden sorumluyum."
            renkHex="#3498db"
            apiEndpoint="/api/agent/siparis-asistan"
          />
        </div>
      )}



      {/* YENİ SİPARİŞ MODAL */}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="modal-header"><h2 className="modal-title">📋 Yeni Sipariş</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>

        <div style={{ padding: '0 4px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>🎤 Her alana mikrofon butonu ile sesle yazabilirsiniz (🇹🇷/🇸🇦) — ✕ ile alanı temizleyebilirsiniz</div>

        <form onSubmit={handleSave}><FormFields f={form} setF={setForm} v={voice} isEdit={false} modelsList={models} />

          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button><button type="submit" className="btn btn-primary" style={{ background: (models.find(m => m.id === parseInt(form.model_id)) && parseFloat(form.unit_price) > 0 && (parseFloat(models.find(m => m.id === parseInt(form.model_id))?.fason_price || 85.50) > (parseFloat(form.unit_price) * 0.8))) ? '#e74c3c' : '' }}>{(models.find(m => m.id === parseInt(form.model_id)) && parseFloat(form.unit_price) > 0 && (parseFloat(models.find(m => m.id === parseInt(form.model_id))?.fason_price || 85.50) > (parseFloat(form.unit_price) * 0.8))) ? '🔒 Riskli Sipariş - Yetkiyle Oluştur' : '💾 Sipariş Oluştur'}</button></div>

        </form>

      </div></div>)}



      {/* DÜZENLEME MODAL */}

      {editOrder && (<div className="modal-overlay" onClick={() => setEditOrder(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="modal-header"><h2 className="modal-title">✏️ Düzenle — {editOrder.order_no}</h2><button className="modal-close" onClick={() => setEditOrder(null)}>✕</button></div>

        <form onSubmit={handleUpdate}><FormFields f={editForm} setF={setEditForm} v={editVoice} isEdit={true} modelsList={models} />

          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditOrder(null)}>İptal</button><button type="submit" className="btn btn-primary">💾 Güncelle</button></div>

        </form>

      </div></div>)}



      {/* DETAY MODAL */}

      {detailOrder && (<div className="modal-overlay" onClick={() => setDetailOrder(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="modal-header"><h2 className="modal-title">📋 {detailOrder.order_no} — Sipariş Detayı</h2><button className="modal-close" onClick={() => setDetailOrder(null)}>✕</button></div>

        <div style={{ display: 'grid', gap: '6px' }}>

          {detailOrder.product_image && <div style={{ textAlign: 'center', marginBottom: '8px' }}><img src={detailOrder.product_image} alt="Ürün" style={{ maxWidth: '200px', maxHeight: '160px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--border-color)' }} /></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>

            {[['Müşteri', detailOrder.customer_name || detailOrder.c_name], ['Model', detailOrder.model_name || detailOrder.m_name], ['Model No', detailOrder.model_id ? models.find(m => m.id === detailOrder.model_id)?.code : '—'], ['Adet', detailOrder.quantity?.toLocaleString('tr-TR')], ['Birim Fiyat', `${detailOrder.unit_price?.toFixed(2)} ₺`], ['Toplam Tutar', `${detailOrder.total_price?.toLocaleString('tr-TR')} ₺`], ['Teslim Tarihi', detailOrder.delivery_date], ['Öncelik', pLabels[detailOrder.priority]], ['Durum', sLabels[detailOrder.status]], ['Numune', smLabels[detailOrder.sample_status]], ['Kumaş', detailOrder.fabric_type], ['Renk', detailOrder.color], ['Bedenler', detailOrder.sizes]].map(([l, v], i) => (

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

export default OrdersPage;
