import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        // 1. Önce mevcut kaydı al (audit trail için)
        const oldPerson = db.prepare('SELECT * FROM personnel WHERE id = ?').get(id);
        if (!oldPerson) {
            return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
        }

        const { name, role, daily_wage, skill_level, machines, skills, language, work_start, work_end, status,
            base_salary, transport_allowance, ssk_cost, food_allowance, compensation,
            technical_mastery, speed_level, quality_level, discipline_level, versatility_level,
            position, department, changed_by,
            // Yeni alanlar
            daily_avg_output, error_rate, efficiency_score,
            capable_operations, operation_skill_scores, learning_speed, independence_level,
            attendance, punctuality, initiative_level, teamwork_level, problem_solving,
            physical_endurance, eye_health, health_restrictions,
            leadership_potential, training_needs, general_evaluation,
            photo_url, national_id, phone } = body;

        // Eğer maaş bileşenleri geldiyse, günlük ücreti yeniden hesapla
        let calculatedDailyWage = daily_wage;
        if (base_salary !== undefined || transport_allowance !== undefined || ssk_cost !== undefined ||
            food_allowance !== undefined || compensation !== undefined) {
            const bs = base_salary !== undefined ? base_salary : (oldPerson.base_salary || 0);
            const ta = transport_allowance !== undefined ? transport_allowance : (oldPerson.transport_allowance || 0);
            const ss = ssk_cost !== undefined ? ssk_cost : (oldPerson.ssk_cost || 0);
            const fa = food_allowance !== undefined ? food_allowance : (oldPerson.food_allowance || 0);
            const co = compensation !== undefined ? compensation : (oldPerson.compensation || 0);
            const totalMonthly = bs + ta + ss + fa + co;
            if (totalMonthly > 0) {
                const now = new Date();
                const monthRow = db.prepare('SELECT work_days FROM monthly_work_days WHERE year = ? AND month = ?').get(now.getFullYear(), now.getMonth() + 1);
                const workDays = monthRow?.work_days || 22;
                calculatedDailyWage = Math.round((totalMonthly / workDays) * 100) / 100;
            }
        }

        // 2. Güncellemeyi yap
        db.prepare(`UPDATE personnel SET
      name = COALESCE(?, name), role = COALESCE(?, role), daily_wage = COALESCE(?, daily_wage),
      skill_level = COALESCE(?, skill_level), machines = COALESCE(?, machines), skills = COALESCE(?, skills),
      language = COALESCE(?, language), work_start = COALESCE(?, work_start),
      work_end = COALESCE(?, work_end), status = COALESCE(?, status),
      base_salary = COALESCE(?, base_salary), transport_allowance = COALESCE(?, transport_allowance),
      ssk_cost = COALESCE(?, ssk_cost), food_allowance = COALESCE(?, food_allowance),
      compensation = COALESCE(?, compensation),
      technical_mastery = COALESCE(?, technical_mastery), speed_level = COALESCE(?, speed_level),
      quality_level = COALESCE(?, quality_level), discipline_level = COALESCE(?, discipline_level),
      versatility_level = COALESCE(?, versatility_level),
      position = COALESCE(?, position), department = COALESCE(?, department),
      daily_avg_output = COALESCE(?, daily_avg_output), error_rate = COALESCE(?, error_rate),
      efficiency_score = COALESCE(?, efficiency_score),
      capable_operations = COALESCE(?, capable_operations), operation_skill_scores = COALESCE(?, operation_skill_scores),
      learning_speed = COALESCE(?, learning_speed), independence_level = COALESCE(?, independence_level),
      attendance = COALESCE(?, attendance), punctuality = COALESCE(?, punctuality),
      initiative_level = COALESCE(?, initiative_level), teamwork_level = COALESCE(?, teamwork_level),
      problem_solving = COALESCE(?, problem_solving),
      physical_endurance = COALESCE(?, physical_endurance), eye_health = COALESCE(?, eye_health),
      health_restrictions = COALESCE(?, health_restrictions),
      leadership_potential = COALESCE(?, leadership_potential), training_needs = COALESCE(?, training_needs),
      general_evaluation = COALESCE(?, general_evaluation),
      photo_url = COALESCE(?, photo_url), national_id = COALESCE(?, national_id), phone = COALESCE(?, phone)
      WHERE id = ?
    `).run(name, role, calculatedDailyWage, skill_level, machines, skills, language, work_start, work_end, status,
            base_salary, transport_allowance, ssk_cost, food_allowance, compensation,
            technical_mastery, speed_level, quality_level, discipline_level, versatility_level,
            position, department,
            daily_avg_output, error_rate, efficiency_score,
            capable_operations, typeof operation_skill_scores === 'object' ? JSON.stringify(operation_skill_scores) : operation_skill_scores,
            learning_speed, independence_level,
            attendance, punctuality, initiative_level, teamwork_level, problem_solving,
            physical_endurance, eye_health, health_restrictions,
            leadership_potential, training_needs, general_evaluation,
            photo_url, national_id, phone, id);

        // 3. Değişen alanları audit_trail'e kaydet (SİLİNEMEZ)
        const auditInsert = db.prepare(
            'INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)'
        );

        const fieldLabels = {
            name: 'İsim', role: 'Rol', daily_wage: 'Günlük Ücret',
            skill_level: 'Beceri Seviyesi', machines: 'Makineler', skills: 'Yetenekler',
            language: 'Dil', work_start: 'Mesai Başlangıç', work_end: 'Mesai Bitiş', status: 'Durum',
            base_salary: 'Taban Maaş', transport_allowance: 'Yol Ücreti',
            ssk_cost: 'SSK Maliyeti', food_allowance: 'Yemek Ücreti', compensation: 'Tazminat',
            technical_mastery: 'Teknik Ustalık', speed_level: 'Hız Seviyesi',
            quality_level: 'Kalite Seviyesi', discipline_level: 'Disiplin',
            versatility_level: 'Çok Yönlülük', position: 'Pozisyon', department: 'Departman',
            learning_speed: 'Öğrenme Hızı', independence_level: 'Bağımsız Çalışma',
            attendance: 'Devamsızlık', punctuality: 'Dakiklik',
            leadership_potential: 'Liderlik Potansiyeli', phone: 'Telefon', national_id: 'TC Kimlik'
        };

        const auditTransaction = db.transaction(() => {
            for (const [field, label] of Object.entries(fieldLabels)) {
                const newVal = body[field];
                if (newVal !== undefined && newVal !== null) {
                    const oldVal = String(oldPerson[field] || '');
                    const newValStr = String(field === 'daily_wage' ? (calculatedDailyWage || newVal) : newVal);
                    if (oldVal !== newValStr) {
                        auditInsert.run('personnel', String(id), label, oldVal, newValStr, changed_by || 'admin');
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

        // Silmeden önce kaydı audit trail'e yaz
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
