'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import BirimAsistanPanel from '../BirimAsistanPanel';

// ========== PERSONNEL PAGE ==========

function PersonnelPage({ personnel: personnelProp, loadPersonnel, addToast, userRole }) {
  // Güvenli başlangıç — API veri yüklenene kadar undefined crash önlenir
  const personnel = personnelProp || [];

  const [showModal, setShowModal] = useState(false);

  const [editPerson, setEditPerson] = useState(null);

  const [editPersonForm, setEditPersonForm] = useState({});

  const [personAuditHistory, setPersonAuditHistory] = useState(null);

  const [personAuditData, setPersonAuditData] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [sgkAcikId, setSgkAcikId] = useState(null);

  // C1+C2: Arama ve filtre
  const [persSearch, setPersSearch] = useState('');
  const [persRoleFilter, setPersRoleFilter] = useState('');
  const [persStatusFilter, setPersStatusFilter] = useState('');
  const [persPageTab, setPersPageTab] = useState('liste');


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

      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 className="topbar-title" style={{ margin: 0 }}>📋 Personel</h1>
          <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
            <button onClick={() => setPersPageTab('liste')} style={{ padding: '6px 16px', background: persPageTab === 'liste' ? 'var(--accent)' : 'transparent', color: persPageTab === 'liste' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }}>
              👥 Yönetim
            </button>
            <button onClick={() => setPersPageTab('asistan')} style={{ padding: '6px 16px', background: persPageTab === 'asistan' ? 'rgba(155,89,182,0.15)' : 'transparent', color: persPageTab === 'asistan' ? '#9b59b6' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💬 İK Asistanı
            </button>
          </div>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input className="form-input" placeholder="🔍 Ada göre ara..." value={persSearch} onChange={e => setPersSearch(e.target.value)} style={{ minWidth: '160px', fontSize: '13px' }} />
          <select className="form-select" value={persRoleFilter} onChange={e => setPersRoleFilter(e.target.value)} style={{ minWidth: '120px', fontSize: '13px' }}>
            <option value="">Tüm Roller</option>
            {[...new Set((personnel || []).flatMap(p => (p.role || '').split(',').map(r => r.trim()).filter(Boolean)))].sort().map(r => <option key={r} value={r}>{roleLabels[r] || r}</option>)}
          </select>
          <select className="form-select" value={persStatusFilter} onChange={e => setPersStatusFilter(e.target.value)} style={{ minWidth: '100px', fontSize: '13px' }}>
            <option value="">Tüm Durum</option>
            <option value="active">✅ Aktif</option>
            <option value="inactive">🔴 Pasif</option>
          </select>
          {userRole === 'koordinator' && (
            <button className="btn btn-primary" onClick={() => { setEditPerson(null); setShowModal(true); }}>➕ Yeni Personel</button>
          )}
        </div></div>

      {persPageTab === 'liste' && (
        <div className="page-content">

          {/* ⏱️ AMELE 1 — GÜNLÜK DEVAM (PersonelDevamBar) */}
          <PersonelDevamBar personnel={personnel} addToast={addToast} />

          {(() => {
            const filtered = (personnel || []).filter(p => {
              if (persSearch && !p.name?.toLowerCase().includes(persSearch.toLowerCase())) return false;
              if (persRoleFilter && !(p.role || '').split(',').map(r => r.trim()).includes(persRoleFilter)) return false;
              if (persStatusFilter && p.status !== persStatusFilter) return false;
              return true;
            });
            return (filtered || []).length === 0 ? (

              <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">{(personnel || []).length === 0 ? 'Henüz Personel Yok' : 'Sonuç Bulunamadı'}</div><div className="empty-state-text">{(personnel || []).length === 0 ? 'Personel ekleyerek başlayın.' : 'Arama veya filtre kriterlerini değiştirin.'}</div>{(personnel || []).length === 0 && <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ İlk Personeli Ekle</button>}</div></div>

            ) : (

              <div className="table-wrapper"><table className="table"><thead><tr><th>#</th><th>Foto</th><th>Ad Soyad</th><th>Pozisyon</th><th>Ustalık</th><th>Hız</th><th>Kalite</th><th>Sınıf</th><th>Devamsızlık</th><th>Günlük Ücret</th><th>Mesai</th><th title="Son 30 gün ortalaması">Ort.Üretim</th><th title="Son 30 gün hata oranı">Hata%</th><th title="Son 30 gün OEE/Verimlilik">OEE%</th><th>Haftalık Not</th><th>Durum</th><th style={{ width: '110px' }}>İşlem</th></tr></thead><tbody>

                {filtered.map((p, idx) => {
                  const trRow = (
                    <tr key={`tr-${p.id}`} style={{ borderBottom: sgkAcikId === p.id ? 'none' : '1px solid var(--border-color)' }}>

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

                      <td><span onClick={() => userRole === 'koordinator' && handleToggleStatus(p.id, p.status)} style={{ cursor: userRole === 'koordinator' ? 'pointer' : 'default' }} className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{p.status === 'active' ? '✅ Aktif' : '🔴 Pasif'}</span></td>

                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {userRole === 'koordinator' && <button onClick={() => { setEditPerson(p); setShowModal(true); }} title="Düzenle" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontSize: '13px' }}>✏️</button>}
                          <button onClick={() => openPersonAuditHistory(p.id)} title="Değişiklik Geçmişi" style={{ background: 'rgba(155,89,182,0.15)', color: '#9b59b6', border: 'none', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontSize: '13px' }}>📜</button>
                          <button
                            onClick={() => setSgkAcikId(sgkAcikId === p.id ? null : p.id)}
                            title="SGK Ödemeleri"
                            style={{ background: sgkAcikId === p.id ? 'rgba(39,174,96,0.2)' : 'rgba(39,174,96,0.08)', color: '#27ae60', border: '1px solid rgba(39,174,96,0.3)', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                          >💰 SGK</button>
                          {userRole === 'koordinator' && <button onClick={() => setDeleteConfirmId(p.id)} title="Sil" style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: 'none', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>}
                        </div>
                      </td>

                    </tr>
                  );
                  return (
                    <React.Fragment key={p.id}>
                      {trRow}
                      {sgkAcikId === p.id && <PersonelSGKSekme personel={p} addToast={addToast} />}
                    </React.Fragment>
                  );
                })}


              </tbody></table></div >

            );
          })()}

        </div >
      )}

      {persPageTab === 'asistan' && (
        <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <BirimAsistanPanel
            birimAdi="İnsan Kaynakları (İK)"
            aciklama="Personel verimliliği, mola/devam analizleri ve maaş/prim yönetimi uzmanıyım."
            renkHex="#9b59b6"
            apiEndpoint="/api/agent/ik-asistan"
          />
        </div>
      )}

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
      }} />
      }


      {/* ===== SİLME ONAY MODALI ===== */}
      {
        deleteConfirmId && (
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
        )
      }

      {/* ===== PERSONEL DEĞİŞİKLİK GEÇMİŞİ ===== */}

      {
        personAuditHistory && (

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

        )
      }

    </>

  );

}

export default PersonnelPage;
