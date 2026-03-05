import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Güncellenebilir alan listesi
const UPDATEABLE_FIELDS = [
    'name', 'role', 'skill_level', 'machines', 'skills', 'language', 'work_start', 'work_end', 'status',
    'base_salary', 'transport_allowance', 'ssk_cost', 'food_allowance', 'compensation',
    'technical_mastery', 'speed_level', 'quality_level', 'discipline_level', 'versatility_level',
    'position', 'department', 'start_date',
    'daily_avg_output', 'error_rate', 'efficiency_score',
    'capable_operations', 'operation_skill_scores', 'learning_speed', 'independence_level',
    'attendance', 'punctuality', 'initiative_level', 'teamwork_level', 'problem_solving',
    'physical_endurance', 'eye_health', 'health_restrictions',
    'leadership_potential', 'training_needs', 'general_evaluation',
    'photo_url', 'national_id', 'phone', 'leave_types',
    // P1: Kimlik
    'birth_date', 'gender', 'education', 'children_count', 'blood_type', 'military_status',
    'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
    'smokes', 'prays', 'transport_type', 'turkish_level', 'living_status', 'disability_status',
    // P2: İş Geçmişi
    'contract_type', 'sgk_entry_date', 'previous_workplaces', 'leave_reason',
    // P4: Beceri
    'finger_dexterity', 'color_perception', 'sample_reading',
    // P5: Makine Ayar
    'machine_adjustment_care', 'preferred_machine', 'most_efficient_machine', 'maintenance_skill', 'machine_adjustments',
    // P6: Fiziksel
    'body_type', 'work_capacity', 'isg_training_date', 'last_health_check',
    // P7: Karakteristik
    'reliability', 'hygiene', 'change_openness', 'responsibility_acceptance', 'error_stance',
    // P9: İşlemler
    'color_tone_matching', 'critical_matching_responsibility', 'fabric_experience',
    // P10: Gelişim
    'new_machine_learning', 'hard_work_avoidance', 'self_improvement',
    // P11: Performans
    'operator_class', 'satisfaction_score', 'recommend', 'weekly_note',
    // Maaş
    'daily_wage',
];

const JSON_FIELDS = ['operation_skill_scores', 'machine_adjustments', 'fabric_experience', 'capable_operations'];

// ========================================================
// PUT — Personel güncelle
// ========================================================
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Mevcut kaydı al
        const { data: oldPerson, error: fetchError } = await supabaseAdmin
            .from('personnel')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !oldPerson) {
            return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
        }

        // Günlük ücret hesapla
        let daily_wage = body.daily_wage !== undefined ? parseFloat(body.daily_wage) : undefined;
        const hasSalaryField = ['base_salary', 'transport_allowance', 'ssk_cost', 'food_allowance', 'compensation']
            .some(f => body[f] !== undefined);

        if (hasSalaryField) {
            const bs = parseFloat(body.base_salary ?? oldPerson.base_salary) || 0;
            const ta = parseFloat(body.transport_allowance ?? oldPerson.transport_allowance) || 0;
            const ss = parseFloat(body.ssk_cost ?? oldPerson.ssk_cost) || 0;
            const fa = parseFloat(body.food_allowance ?? oldPerson.food_allowance) || 0;
            const co = parseFloat(body.compensation ?? oldPerson.compensation) || 0;
            const totalMonthly = bs + ta + ss + fa + co;
            if (totalMonthly > 0) {
                let workDays = 22;
                try {
                    const now = new Date();
                    const { data: monthRow } = await supabaseAdmin
                        .from('monthly_work_days')
                        .select('work_days')
                        .eq('year', now.getFullYear())
                        .eq('month', now.getMonth() + 1)
                        .single();
                    if (monthRow?.work_days) workDays = monthRow.work_days;
                } catch { }
                daily_wage = Math.round((totalMonthly / workDays) * 100) / 100;
            }
        }

        // Güncelleme objesi — sadece body'de gelen alanlar
        const updateData = {};
        for (const field of UPDATEABLE_FIELDS) {
            if (body[field] !== undefined) {
                let val = body[field];
                // JSON alanlarını parse et
                if (JSON_FIELDS.includes(field)) {
                    if (typeof val === 'string') {
                        try { val = JSON.parse(val); } catch { }
                    }
                    if (!val || typeof val !== 'object') val = {};
                }

                // PostgreSQL DATE kolonları boş text (empty string) kabul etmez, null yapılmalı
                if (['start_date', 'sgk_entry_date', 'birth_date', 'isg_training_date', 'last_health_check'].includes(field)) {
                    if (val === '') val = null;
                }

                updateData[field] = val;
            }
        }
        if (daily_wage !== undefined) updateData.daily_wage = daily_wage;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(oldPerson);
        }

        const { data, error } = await supabaseAdmin
            .from('personnel')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Audit trail — Supabase audit_trail tablosu varsa log yaz
        const changed_by = body.changed_by || 'admin';
        const auditEntries = [];
        const auditLabels = {
            name: 'İsim', role: 'Rol', daily_wage: 'Günlük Ücret',
            base_salary: 'Taban Maaş', status: 'Durum',
            operator_class: 'Operatör Sınıfı', phone: 'Telefon',
        };
        for (const [field, label] of Object.entries(auditLabels)) {
            if (updateData[field] !== undefined) {
                const oldVal = String(oldPerson[field] || '');
                const newVal = String(updateData[field] || '');
                if (oldVal !== newVal) {
                    auditEntries.push({
                        table_name: 'personnel', record_id: parseInt(id),
                        field_name: label, old_value: oldVal, new_value: newVal, changed_by,
                    });
                }
            }
        }
        if (auditEntries.length > 0) {
            supabaseAdmin.from('audit_trail').insert(auditEntries).then(() => { });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Personnel PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ========================================================
// DELETE — Personel sil (soft delete)
// ========================================================
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const { data: person, error: fetchError } = await supabaseAdmin
            .from('personnel')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchError || !person) {
            return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
        }

        // Hard-delete (Kalıcı Silme) İstendi (Soft-delete iptal)
        const { error } = await supabaseAdmin
            .from('personnel')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Audit trail (Log bırak)
        supabaseAdmin.from('audit_trail').insert({
            table_name: 'personnel',
            record_id: parseInt(id),
            field_name: 'HARD-DELETE',
            old_value: `${person.name} (${person.role})`,
            new_value: 'KALICI OLARAK SİLİNDİ',
            changed_by: 'Koordinatör / Yönetici',
        }).then(() => { });

        return NextResponse.json({ success: true, message: 'Personel silindi (geri alınabilir)' });
    } catch (error) {
        console.error('Personnel DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
