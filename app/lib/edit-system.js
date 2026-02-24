'use client';
import { useState, useEffect } from 'react';

// ============================================================
// DÜZELTME SİSTEMİ — Tüm bölümlerde kullanılır
// 5 saat kuralı: İlk 5 saat düzeltmeler loglanmaz
// 5 saatten sonra: eski/yeni değerler tarih-saat ile kaydedilir
// Bu kayıtlar silinemez — delil niteliğindedir
// ============================================================

// ============================================================
// 1. DÜZELTME MODAL — Kayıt düzenleme penceresi
// ============================================================
export function EditModal({ title, fields, record, onClose, onSave, tableName }) {
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (record) {
            const initial = {};
            fields.forEach(f => {
                initial[f.key] = record[f.key] ?? '';
            });
            setForm(initial);
        }
    }, [record]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1) Değişen alanları bul
            const changes = [];
            fields.forEach(f => {
                const oldVal = String(record[f.key] ?? '');
                const newVal = String(form[f.key] ?? '');
                if (oldVal !== newVal) {
                    changes.push({
                        field_name: f.label || f.key,
                        old_value: oldVal,
                        new_value: newVal,
                    });
                }
            });

            // 2) Audit trail API'ye gönder (5 saat kuralı orada kontrol edilir)
            if (changes.length > 0) {
                await fetch('/api/audit-trail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table_name: tableName,
                        record_id: record.id,
                        changes,
                        changed_by: 'admin',
                    }),
                });
            }

            // 3) Kaydı güncelle
            await onSave(record.id, form);
            onClose();
        } catch (err) {
            console.error('Düzeltme hatası:', err);
            alert('Düzeltme kaydedilemedi: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!record) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #e67e22, #d35400)', color: '#fff' }}>
                    <h2 className="modal-title" style={{ color: '#fff' }}>✏️ {title}</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
                            style={{
                                background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                                padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >📜 Düzeltme Geçmişi</button>
                        <button className="modal-close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
                    </div>
                </div>

                {showHistory && (
                    <AuditTrailPanel tableName={tableName} recordId={record.id} />
                )}

                <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {fields.map(f => (
                        <div key={f.key} className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{f.label || f.key}</span>
                                {String(record[f.key] ?? '') !== String(form[f.key] ?? '') && (
                                    <span style={{ fontSize: '10px', color: '#e67e22', fontWeight: '700' }}>● DEĞİŞTİ</span>
                                )}
                            </label>
                            {f.type === 'select' ? (
                                <select className="form-select" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                                    {f.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : f.type === 'textarea' ? (
                                <textarea className="form-textarea" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={3} />
                            ) : f.type === 'checkbox' ? (
                                <input type="checkbox" checked={!!form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.checked ? 1 : 0 })} />
                            ) : (
                                <input className="form-input" type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                            )}
                            {String(record[f.key] ?? '') !== String(form[f.key] ?? '') && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Eski: <span style={{ textDecoration: 'line-through', color: '#e74c3c' }}>{String(record[f.key] ?? '—')}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}
                        style={{ background: '#e67e22', borderColor: '#e67e22' }}>
                        {saving ? '⏳ Kaydediliyor...' : '✏️ Düzeltmeyi Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// 2. DÜZELTME GEÇMİŞİ PANELİ — Silinemez kayıtlar
// ============================================================
export function AuditTrailPanel({ tableName, recordId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [tableName, recordId]);

    const loadHistory = async () => {
        try {
            const res = await fetch(`/api/audit-trail?table=${tableName}&record_id=${recordId}`);
            const data = await res.json();
            setHistory(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Geçmiş yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: 'rgba(231,76,60,0.05)', border: '1px solid rgba(231,76,60,0.2)',
            margin: '0 20px', borderRadius: '8px', padding: '12px', marginTop: '10px'
        }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#e74c3c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔒 Düzeltme Geçmişi <span style={{ fontSize: '10px', fontWeight: '400', color: 'var(--text-muted)' }}>(silinemez)</span>
            </div>

            {loading ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Yükleniyor...</div>
            ) : history.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Henüz düzeltme yapılmamış (veya ilk 5 saat içinde yapılmış)</div>
            ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {history.map((h, idx) => (
                        <div key={idx} style={{
                            padding: '8px 10px', borderRadius: '6px', marginBottom: '6px',
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            fontSize: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <strong style={{ color: '#e67e22' }}>{h.field_name}</strong>
                                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                    📅 {new Date(h.changed_at).toLocaleString('tr-TR')} · {h.changed_by}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <span style={{ color: '#e74c3c' }}>❌ <s>{h.old_value || '—'}</s></span>
                                <span style={{ color: '#27ae60' }}>✅ {h.new_value || '—'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// 3. DÜZELTME GEÇMİŞİ MODAL — Bağımsız pencere
// ============================================================
export function AuditTrailModal({ tableName, recordId, recordName, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #c0392b, #e74c3c)', color: '#fff' }}>
                    <h2 className="modal-title" style={{ color: '#fff' }}>🔒 Düzeltme Geçmişi</h2>
                    <button className="modal-close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
                </div>
                <div style={{ padding: '8px 0' }}>
                    {recordName && (
                        <div style={{ padding: '8px 20px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            📋 {recordName}
                        </div>
                    )}
                    <div style={{ padding: '0 10px' }}>
                        <AuditTrailPanel tableName={tableName} recordId={recordId} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Kapat</button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// 4. DÜZELT BUTONU — Satıriçi düzelt & geçmiş butonları
// ============================================================
export function EditButtons({ onEdit, onHistory }) {
    return (
        <div style={{ display: 'flex', gap: '4px' }}>
            <button
                onClick={onEdit}
                title="Düzelt"
                style={{
                    background: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.3)',
                    color: '#e67e22', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: '600', transition: 'all 0.2s'
                }}
            >✏️</button>
            <button
                onClick={onHistory}
                title="Düzeltme Geçmişi"
                style={{
                    background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
                    color: '#e74c3c', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: '600', transition: 'all 0.2s'
                }}
            >📜</button>
        </div>
    );
}

// ============================================================
// 5. ALAN TANIMLAMALARI — Her bölüm için düzenlenebilir alanlar
// ============================================================
export const EDIT_FIELDS = {
    models: [
        { key: 'name', label: 'Model Adı' },
        { key: 'code', label: 'Model Kodu' },
        { key: 'order_no', label: 'Sipariş No' },
        { key: 'customer', label: 'Müşteri' },
        { key: 'modelist', label: 'Modelist' },
        { key: 'fabric_type', label: 'Kumaş Türü' },
        { key: 'total_order', label: 'Sipariş Adedi', type: 'number' },
        { key: 'fason_price', label: 'Fason Fiyat', type: 'number' },
        { key: 'sizes', label: 'Bedenler' },
        { key: 'size_range', label: 'Beden Aralığı' },
        { key: 'garni', label: 'Garni' },
        { key: 'color_count', label: 'Renk Sayısı', type: 'number' },
        { key: 'size_count', label: 'Beden Sayısı', type: 'number' },
        { key: 'delivery_date', label: 'Sevk Tarihi', type: 'date' },
        { key: 'work_start_date', label: 'İşe Başlama Tarihi', type: 'date' },
        { key: 'difficult_points', label: 'Zor Noktalar', type: 'textarea' },
        { key: 'critical_points', label: 'Kritik Noktalar', type: 'textarea' },
        { key: 'customer_requests', label: 'Müşteri İstekleri', type: 'textarea' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        {
            key: 'status', label: 'Durum', type: 'select', options: [
                { value: 'prototip', label: 'Prototip' },
                { value: 'uretimde', label: 'Üretimde' },
                { value: 'tamamlandi', label: 'Tamamlandı' },
            ]
        },
    ],
    operations: [
        { key: 'name', label: 'İşlem Adı' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'machine_type', label: 'Makine Tipi' },
        { key: 'thread_material', label: 'İplik/Malzeme' },
        { key: 'needle_type', label: 'İğne Tipi' },
        { key: 'tension_setting', label: 'Gerginlik Ayarı' },
        { key: 'speed_setting', label: 'Hız Ayarı' },
        { key: 'standard_time_min', label: 'Min Süre (sn)', type: 'number' },
        { key: 'standard_time_max', label: 'Max Süre (sn)', type: 'number' },
        { key: 'unit_price', label: 'Birim Fiyat', type: 'number' },
        { key: 'quality_notes', label: 'Kalite Notları', type: 'textarea' },
        { key: 'written_instructions', label: 'Yazılı Talimat', type: 'textarea' },
        { key: 'difficulty', label: 'Zorluk (1-10)', type: 'number' },
    ],
    personnel: [
        { key: 'name', label: 'Ad Soyad' },
        { key: 'role', label: 'Pozisyon' },
        { key: 'base_salary', label: 'Maaş (₺)', type: 'number' },
        { key: 'transport_allowance', label: 'Yol (₺)', type: 'number' },
        { key: 'ssk_cost', label: 'SSK (₺)', type: 'number' },
        { key: 'food_allowance', label: 'Yemek (₺)', type: 'number' },
        { key: 'compensation', label: 'Tazminat (₺)', type: 'number' },
        { key: 'technical_mastery', label: 'Teknik Ustalık' },
        { key: 'speed_level', label: 'Hız' },
        { key: 'quality_level', label: 'Kalite' },
        { key: 'discipline_level', label: 'Disiplin' },
        { key: 'versatility_level', label: 'Çok Yönlülük' },
        { key: 'machines', label: 'Makineler' },
        { key: 'skills', label: 'Beceriler' },
        { key: 'work_start', label: 'Mesai Başlangıç' },
        { key: 'work_end', label: 'Mesai Bitiş' },
        { key: 'language', label: 'Dil' },
    ],
    orders: [
        { key: 'order_no', label: 'Sipariş No' },
        { key: 'customer_name', label: 'Müşteri' },
        { key: 'model_name', label: 'Model' },
        { key: 'quantity', label: 'Adet', type: 'number' },
        { key: 'unit_price', label: 'Birim Fiyat', type: 'number' },
        { key: 'total_price', label: 'Toplam', type: 'number' },
        { key: 'delivery_date', label: 'Teslim Tarihi', type: 'date' },
        { key: 'fabric_type', label: 'Kumaş' },
        { key: 'color', label: 'Renk' },
        { key: 'sizes', label: 'Bedenler' },
        { key: 'notes', label: 'Notlar', type: 'textarea' },
        {
            key: 'priority', label: 'Öncelik', type: 'select', options: [
                { value: 'dusuk', label: 'Düşük' },
                { value: 'normal', label: 'Normal' },
                { value: 'yuksek', label: 'Yüksek' },
                { value: 'acil', label: 'Acil' },
            ]
        },
        {
            key: 'status', label: 'Durum', type: 'select', options: [
                { value: 'siparis_alindi', label: 'Sipariş Alındı' },
                { value: 'uretimde', label: 'Üretimde' },
                { value: 'sevk_edildi', label: 'Sevk Edildi' },
                { value: 'tamamlandi', label: 'Tamamlandı' },
            ]
        },
    ],
    machines: [
        { key: 'name', label: 'Makine Adı' },
        { key: 'type', label: 'Tip' },
        { key: 'brand', label: 'Marka' },
        { key: 'model_name', label: 'Model' },
        { key: 'serial_no', label: 'Seri No' },
        { key: 'location', label: 'Konum' },
        { key: 'count', label: 'Adet', type: 'number' },
        { key: 'notes', label: 'Notlar', type: 'textarea' },
        {
            key: 'status', label: 'Durum', type: 'select', options: [
                { value: 'active', label: 'Aktif' },
                { value: 'maintenance', label: 'Bakımda' },
                { value: 'inactive', label: 'Devre Dışı' },
            ]
        },
    ],
    customers: [
        { key: 'name', label: 'Müşteri Adı' },
        { key: 'company', label: 'Firma' },
        { key: 'phone', label: 'Telefon' },
        { key: 'email', label: 'E-posta' },
        { key: 'address', label: 'Adres', type: 'textarea' },
        { key: 'tax_no', label: 'Vergi No' },
        { key: 'notes', label: 'Notlar', type: 'textarea' },
    ],
    shipments: [
        { key: 'quantity', label: 'Adet', type: 'number' },
        { key: 'shipment_date', label: 'Sevk Tarihi', type: 'date' },
        { key: 'tracking_no', label: 'Takip No' },
        { key: 'cargo_company', label: 'Kargo Firması' },
        { key: 'destination', label: 'Varış Yeri' },
        { key: 'notes', label: 'Notlar', type: 'textarea' },
        {
            key: 'status', label: 'Durum', type: 'select', options: [
                { value: 'hazirlaniyor', label: 'Hazırlanıyor' },
                { value: 'sevk_edildi', label: 'Sevk Edildi' },
                { value: 'teslim_edildi', label: 'Teslim Edildi' },
            ]
        },
    ],
    fason_orders: [
        { key: 'quantity', label: 'Adet', type: 'number' },
        { key: 'unit_price', label: 'Birim Fiyat', type: 'number' },
        { key: 'sent_date', label: 'Gönderim Tarihi', type: 'date' },
        { key: 'expected_date', label: 'Beklenen Tarih', type: 'date' },
        { key: 'received_quantity', label: 'Alınan Adet', type: 'number' },
        { key: 'defective_count', label: 'Hatalı Adet', type: 'number' },
        { key: 'quality_notes', label: 'Kalite Notları', type: 'textarea' },
        {
            key: 'status', label: 'Durum', type: 'select', options: [
                { value: 'beklemede', label: 'Beklemede' },
                { value: 'uretimde', label: 'Üretimde' },
                { value: 'teslim_edildi', label: 'Teslim Edildi' },
            ]
        },
    ],
    production_logs: [
        { key: 'total_produced', label: 'Üretilen Adet', type: 'number' },
        { key: 'defective_count', label: 'Hatalı Adet', type: 'number' },
        { key: 'defect_reason', label: 'Hata Nedeni' },
        { key: 'lot_change', label: 'Parti Değişikliği' },
        { key: 'quality_score', label: 'Kalite Puanı', type: 'number' },
    ],
};
