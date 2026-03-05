'use client';

import { useState, useEffect, useCallback } from 'react';
export { EditableSelect, EditableInput };


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

export default NewPersonnelModal;
