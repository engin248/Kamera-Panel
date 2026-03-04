import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Güncellenebilir alanlar
const UPDATEABLE_FIELDS = [
    'name', 'type', 'brand', 'model_name', 'serial_no',
    'sub_type', 'count', 'category', 'location',
    'purchase_date', 'last_maintenance', 'next_maintenance',
    'notes', 'status',
];

const FIELD_LABELS = {
    name: 'Makine Adı',
    type: 'Tip',
    brand: 'Marka',
    model_name: 'Model',
    serial_no: 'Seri No',
    location: 'Konum',
    notes: 'Notlar',
    status: 'Durum',
    count: 'Adet',
    category: 'Kategori',
    sub_type: 'Alt Tip',
};

// ============================================================
// PUT — Makine güncelle
// ============================================================
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // 1. Mevcut kaydı al (audit trail için)
        const { data: oldMachine, error: fetchError } = await supabaseAdmin
            .from('machines')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !oldMachine) {
            return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 });
        }

        // 2. Güncelleme objesi — sadece body'de gelen geçerli alanlar
        const updateData = {};
        for (const field of UPDATEABLE_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // count integer olmalı
        if (updateData.count !== undefined) {
            updateData.count = parseInt(updateData.count) || 1;
        }

        // Boş string tarihleri null yap
        for (const dateField of ['purchase_date', 'last_maintenance', 'next_maintenance']) {
            if (updateData[dateField] === '') updateData[dateField] = null;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(oldMachine);
        }

        const { data, error } = await supabaseAdmin
            .from('machines')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 3. Audit trail — değişen alanları kaydet (Personnel ile aynı pattern)
        const changed_by = body.changed_by || 'admin';
        const auditEntries = [];
        for (const [field, label] of Object.entries(FIELD_LABELS)) {
            if (updateData[field] !== undefined) {
                const oldVal = String(oldMachine[field] || '');
                const newVal = String(updateData[field] || '');
                if (oldVal !== newVal) {
                    auditEntries.push({
                        table_name: 'machines',
                        record_id: parseInt(id),
                        field_name: label,
                        old_value: oldVal,
                        new_value: newVal,
                        changed_by,
                    });
                }
            }
        }
        if (auditEntries.length > 0) {
            supabaseAdmin.from('audit_trail').insert(auditEntries).then(() => { });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Machines PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// DELETE — Makine sil (soft delete — Personnel ile aynı pattern)
// ============================================================
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        // Önce kaydı kontrol et
        const { data: machine, error: fetchError } = await supabaseAdmin
            .from('machines')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchError || !machine) {
            return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 });
        }

        // Soft-delete
        const { error } = await supabaseAdmin
            .from('machines')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: 'Koordinatör',
            })
            .eq('id', id);

        if (error) throw error;

        // Audit trail
        supabaseAdmin.from('audit_trail').insert({
            table_name: 'machines',
            record_id: parseInt(id),
            field_name: 'SOFT-DELETE',
            old_value: `${machine.name} (${machine.type})`,
            new_value: 'SİLİNDİ (geri alınabilir)',
            changed_by: 'Koordinatör',
        }).then(() => { });

        return NextResponse.json({ success: true, message: 'Makine silindi (geri alınabilir)' });
    } catch (error) {
        console.error('Machines DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
