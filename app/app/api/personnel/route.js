import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAuth, logActivity } from '@/lib/auth';

// ========================================================
// Supabase personnel tablosundaki geçerli kolonlar whitelist
// Tabloda olmayan alanlar (detail_work, hard_work_skill vb.)
// otomatik olarak filtrelenir - hata vermez
// ========================================================
const VALID_COLUMNS = new Set([
    'id', 'name', 'role', 'position', 'department',
    'work_start', 'work_end',
    'daily_wage', 'base_salary', 'transport_allowance', 'ssk_cost', 'food_allowance', 'compensation',
    'skill_level', 'technical_mastery', 'speed_level', 'quality_level', 'discipline_level',
    'versatility_level', 'operator_class',
    'machines', 'skills', 'capable_operations', 'operation_skill_scores', 'machine_adjustments',
    'machine_adjustment_care', 'preferred_machine', 'most_efficient_machine', 'maintenance_skill',
    'daily_avg_output', 'error_rate', 'efficiency_score', 'satisfaction_score',
    'learning_speed', 'independence_level',
    'finger_dexterity', 'color_perception', 'sample_reading',
    'adaptation_status', 'attendance', 'punctuality', 'initiative_level', 'teamwork_level', 'problem_solving',
    'physical_endurance', 'eye_health', 'health_restrictions',
    'body_type', 'work_capacity', 'isg_training_date', 'last_health_check',
    'leadership_potential', 'training_needs', 'general_evaluation',
    'new_machine_learning', 'hard_work_avoidance', 'self_improvement', 'recommend', 'weekly_note',
    'national_id', 'phone', 'photo_url', 'language', 'turkish_level',
    'birth_date', 'gender', 'education', 'children_count', 'blood_type', 'military_status',
    'smokes', 'prays', 'transport_type', 'living_status', 'disability_status',
    'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
    'contract_type', 'start_date', 'sgk_entry_date', 'previous_workplaces', 'leave_reason', 'leave_types',
    'fabric_experience', 'color_tone_matching', 'critical_matching_responsibility',
    'reliability', 'hygiene', 'change_openness', 'responsibility_acceptance', 'error_stance',
    'status', 'deleted_at', 'deleted_by', 'created_at', 'updated_at',
]);

const JSON_FIELDS = new Set(['operation_skill_scores', 'machine_adjustments', 'fabric_experience']);

// Gelen objeden sadece geçerli kolonları al, bilinmeyenleri at
function filterValidColumns(data) {
    const filtered = {};
    for (const [key, value] of Object.entries(data)) {
        if (VALID_COLUMNS.has(key)) {
            filtered[key] = value;
        }
    }
    return filtered;
}

// JSON string alanlarını parse et
function parseJsonFields(data) {
    for (const field of JSON_FIELDS) {
        if (data[field] !== undefined) {
            if (typeof data[field] === 'string') {
                try { data[field] = JSON.parse(data[field]); } catch { data[field] = {}; }
            }
            if (!data[field] || typeof data[field] !== 'object' || Array.isArray(data[field])) {
                data[field] = {};
            }
        }
    }
    return data;
}

// ========================================================
// GET — Tüm personeli getir
// ========================================================
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('personnel')
            .select('*')
            .is('deleted_at', null)
            .order('name', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Personnel GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ========================================================
// POST — Yeni personel ekle
// ========================================================
export async function POST(request) {
    try {
        // 🔒 Yetki kontrolü
        const user = await checkAuth(request, 'POST');
        if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        if (user._forbidden) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

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

        const daily_wage = totalMonthly > 0
            ? Math.round((totalMonthly / workDays) * 100) / 100
            : (parseFloat(body.daily_wage) || 0);

        // 1) Geçerli kolonları filtrele
        // 2) JSON alanlarını parse et
        // 3) Maaş alanlarını ekle
        const insertData = parseJsonFields(filterValidColumns({
            ...body,
            daily_wage,
            base_salary, transport_allowance, ssk_cost, food_allowance, compensation,
        }));

        // Sistem alanlarını temizle (Supabase otomatik doldurur)
        delete insertData.id;
        delete insertData.created_at;
        delete insertData.updated_at;
        delete insertData.deleted_at;
        delete insertData.deleted_by;

        // Boş string tarihleri null yap (PostgreSQL DATE tipi boş string kabul etmez)
        if (insertData.start_date === '') insertData.start_date = null;

        const { data, error } = await supabaseAdmin
            .from('personnel')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Personnel POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
