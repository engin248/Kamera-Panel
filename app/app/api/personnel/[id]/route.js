import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        // Mevcut kaydı al (audit trail için)
        const oldPerson = db.prepare('SELECT * FROM personnel WHERE id = ?').get(id);
        if (!oldPerson) {
            return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
        }

        const changed_by = body.changed_by || 'admin';

        // Günlük ücret hesapla
        let calculatedDailyWage = body.daily_wage;
        if (body.base_salary !== undefined || body.transport_allowance !== undefined || body.ssk_cost !== undefined ||
            body.food_allowance !== undefined || body.compensation !== undefined) {
            const bs = body.base_salary !== undefined ? parseFloat(body.base_salary) : (oldPerson.base_salary || 0);
            const ta = body.transport_allowance !== undefined ? parseFloat(body.transport_allowance) : (oldPerson.transport_allowance || 0);
            const ss = body.ssk_cost !== undefined ? parseFloat(body.ssk_cost) : (oldPerson.ssk_cost || 0);
            const fa = body.food_allowance !== undefined ? parseFloat(body.food_allowance) : (oldPerson.food_allowance || 0);
            const co = body.compensation !== undefined ? parseFloat(body.compensation) : (oldPerson.compensation || 0);
            const totalMonthly = bs + ta + ss + fa + co;
            if (totalMonthly > 0) {
                const now = new Date();
                const monthRow = db.prepare('SELECT work_days FROM monthly_work_days WHERE year = ? AND month = ?').get(now.getFullYear(), now.getMonth() + 1);
                const workDays = monthRow?.work_days || 22;
                calculatedDailyWage = Math.round((totalMonthly / workDays) * 100) / 100;
            }
        }

        // Güncellenebilir tüm alanlar (P1-P11)
        const updateableFields = [
            'name', 'role', 'skill_level', 'machines', 'skills', 'language', 'work_start', 'work_end', 'status',
            'base_salary', 'transport_allowance', 'ssk_cost', 'food_allowance', 'compensation',
            'technical_mastery', 'speed_level', 'quality_level', 'discipline_level', 'versatility_level',
            'position', 'department',
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
            'operator_class', 'satisfaction_score', 'recommend', 'weekly_note'
        ];

        // Dinamik SET kısmı: sadece body'de gelen alanları güncelle
        const setClauses = [];
        const setValues = [];

        for (const field of updateableFields) {
            if (body[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                let val = body[field];
                if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                setValues.push(val);
            }
        }

        // Günlük ücret her zaman hesaplanır
        if (calculatedDailyWage !== undefined) {
            setClauses.push('daily_wage = ?');
            setValues.push(calculatedDailyWage);
        }

        if (setClauses.length > 0) {
            setValues.push(id);
            db.prepare(`UPDATE personnel SET ${setClauses.join(', ')} WHERE id = ?`).run(...setValues);
        }

        // Audit trail: değişen alanları kaydet
        const auditInsert = db.prepare(
            'INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)'
        );

        const fieldLabels = {
            name: 'İsim', role: 'Rol', daily_wage: 'Günlük Ücret',
            skill_level: 'Beceri Seviyesi', machines: 'Makineler',
            base_salary: 'Taban Maaş', transport_allowance: 'Yol',
            ssk_cost: 'SSK', food_allowance: 'Yemek', compensation: 'Tazminat',
            technical_mastery: 'Teknik Ustalık', speed_level: 'Hız',
            quality_level: 'Kalite', discipline_level: 'Disiplin',
            phone: 'Telefon', national_id: 'TC Kimlik',
            blood_type: 'Kan Grubu', operator_class: 'Operatör Sınıfı',
            contract_type: 'Sözleşme Tipi', body_type: 'Vücut Yapısı',
            work_capacity: 'İş Kapasitesi', reliability: 'Güvenilirlik',
            error_stance: 'Hata Duruşu', self_improvement: 'Kendini Geliştirme',
        };

        const auditTransaction = db.transaction(() => {
            for (const [field, label] of Object.entries(fieldLabels)) {
                const newVal = body[field];
                if (newVal !== undefined && newVal !== null) {
                    const oldVal = String(oldPerson[field] || '');
                    const newValStr = String(field === 'daily_wage' ? (calculatedDailyWage || newVal) : newVal);
                    if (oldVal !== newValStr) {
                        auditInsert.run('personnel', String(id), label, oldVal, newValStr, changed_by);
                    }
                }
            }
        });
        auditTransaction();

        const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(id);
        return NextResponse.json(person);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;

        const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(id);
        if (person) {
            db.prepare(
                'INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).run('personnel', String(id), 'SİLME İŞLEMİ', `${person.name} (${person.role})`, 'SİLİNDİ', 'admin');
        }

        db.prepare('DELETE FROM personnel WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
