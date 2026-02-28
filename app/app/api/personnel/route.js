import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Tüm personeli getir
export async function GET() {
    try {
        const db = getDb();
        const personnel = db.prepare('SELECT * FROM personnel ORDER BY name').all();
        return NextResponse.json(personnel);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni personel ekle
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'Personel adı zorunlu' }, { status: 400 });
        }

        // Günlük ücret hesapla
        const base_salary = parseFloat(body.base_salary) || 0;
        const transport_allowance = parseFloat(body.transport_allowance) || 0;
        const ssk_cost = parseFloat(body.ssk_cost) || 0;
        const food_allowance = parseFloat(body.food_allowance) || 0;
        const compensation = parseFloat(body.compensation) || 0;
        const totalMonthly = base_salary + transport_allowance + ssk_cost + food_allowance + compensation;

        let calculatedDailyWage = parseFloat(body.daily_wage) || 0;
        if (totalMonthly > 0) {
            const now = new Date();
            const monthRow = db.prepare('SELECT work_days FROM monthly_work_days WHERE year = ? AND month = ?').get(now.getFullYear(), now.getMonth() + 1);
            const workDays = monthRow?.work_days || 22;
            calculatedDailyWage = Math.round((totalMonthly / workDays) * 100) / 100;
        }

        // Tüm personel alanları (P1-P11)
        const textFields = [
            'name', 'role', 'skill_level', 'machines', 'skills', 'language', 'work_start', 'work_end', 'start_date',
            'technical_mastery', 'speed_level', 'quality_level', 'discipline_level', 'versatility_level', 'position', 'department',
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

        const numericFields = ['daily_avg_output', 'error_rate', 'efficiency_score'];
        const moneyFields = ['daily_wage', 'base_salary', 'transport_allowance', 'ssk_cost', 'food_allowance', 'compensation'];

        const allFields = [...textFields, ...numericFields, ...moneyFields];
        const columns = allFields.join(', ');
        const placeholders = allFields.map(() => '?').join(', ');

        const values = [
            ...textFields.map(f => {
                const v = body[f];
                if (typeof v === 'object' && v !== null) return JSON.stringify(v);
                return v ?? '';
            }),
            ...numericFields.map(f => parseFloat(body[f]) || 0),
            calculatedDailyWage, base_salary, transport_allowance, ssk_cost, food_allowance, compensation
        ];

        const result = db.prepare(`INSERT INTO personnel (${columns}) VALUES (${placeholders})`).run(...values);
        const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(person, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
