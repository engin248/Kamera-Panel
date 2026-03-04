import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAuth, logActivity } from '@/lib/auth';

// ============================================================
// OEE / FPY / Net Work hesaplama
// ============================================================
// ✅ GÖREV 3: OEE Formülü Düzenlenmiş — standart süre parametreli
function calcMetrics({ total_produced, defective_count, start_time, end_time,
    break_duration_min, machine_down_min, material_wait_min, passive_time_min,
    standard_time_min = 0 }) {  // GÖREV 3: standard_time_min eklendi
    const tp = total_produced || 0;
    const dc = defective_count || 0;
    const fpy = tp > 0 ? ((tp - dc) / tp) * 100 : 100;
    const brk = break_duration_min || 0;
    const mch = machine_down_min || 0;
    const mat = material_wait_min || 0;
    const pas = passive_time_min || 0;
    const standardTimMin = standard_time_min || 0;

    let netWork = 0;
    let oeeScore = 0;
    if (end_time && start_time) {
        const totalMin = (new Date(end_time) - new Date(start_time)) / 60000;
        netWork = Math.max(0, totalMin - brk - mch - mat - pas);
        if (tp > 0 && totalMin > 0) {
            const availability = Math.max(0, netWork / totalMin);
            // GÖREV 3: standard_time_min varsa takt time kullan, yoksa dakikada 1 adet varsay
            const idealAdet = standardTimMin > 0 ? netWork / standardTimMin : netWork;
            const performance = netWork > 0 ? Math.min(1, tp / idealAdet) : 0;
            const quality = tp > 0 ? (tp - dc) / tp : 1;
            oeeScore = Math.round(availability * performance * quality * 10000) / 100;
        }
    }

    return {
        first_pass_yield: Math.round(fpy * 10) / 10,
        net_work_minutes: Math.round(netWork * 10) / 10,
        oee_score: oeeScore,
    };
}

// ============================================================
// GET — Üretim kayıtları listesi (filtreli)
// ============================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const personnel_id = searchParams.get('personnel_id');
        const model_id = searchParams.get('model_id');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabaseAdmin
            .from('production_logs')
            .select(`
                *,
                models (name, code),
                operations (name, unit_price, difficulty),
                personnel (name, role, daily_wage)
            `)
            .is('deleted_at', null)
            .order('start_time', { ascending: false })
            .limit(limit);

        if (date) {
            const start = `${date}T00:00:00.000Z`;
            const end = `${date}T23:59:59.999Z`;
            query = query.gte('start_time', start).lte('start_time', end);
        } else if (from) {
            query = query.gte('start_time', `${from}T00:00:00.000Z`);
            if (to) query = query.lte('start_time', `${to}T23:59:59.999Z`);
        }

        if (personnel_id) query = query.eq('personnel_id', parseInt(personnel_id));
        if (model_id) query = query.eq('model_id', parseInt(model_id));

        const { data, error } = await query;
        if (error) throw error;

        // Düzleştir
        const logs = (data || []).map(row => ({
            ...row,
            model_name: row.models?.name,
            model_code: row.models?.code,
            operation_name: row.operations?.name,
            unit_price: row.operations?.unit_price,
            difficulty: row.operations?.difficulty,
            personnel_name: row.personnel?.name,
            personnel_role: row.personnel?.role,
            daily_wage: row.personnel?.daily_wage,
            models: undefined, operations: undefined, personnel: undefined,
        }));

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Production GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni üretim kaydı
// ============================================================
export async function POST(request) {
    try {
        // 🔒 Yetki kontrolü
        const user = await checkAuth(request, 'POST');
        if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        if (user._forbidden) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const body = await request.json();
        const {
            model_id, operation_id, personnel_id,
            start_time, end_time,
            total_produced, defective_count, defect_reason, defect_source,
            break_duration_min, machine_down_min, material_wait_min, passive_time_min,
            quality_score, lot_change, status,
            defect_photo, defect_classification, notes
        } = body;

        if (!model_id || !operation_id || !personnel_id || !start_time) {
            return NextResponse.json(
                { error: 'model_id, operation_id, personnel_id ve start_time zorunlu' },
                { status: 400 }
            );
        }

        // Operasyon birim değerlerini Supabase'den çek
        let unit_value = 0;
        let katki_degeri_tutari = 0;
        let stdTime = 0; // ✅ GÖREV 3: standart süre (dakika/adet)
        try {
            const { data: op } = await supabaseAdmin
                .from('operations')
                .select('unit_price, birim_deger, standart_sure_dk, standard_time_min')
                .eq('id', parseInt(operation_id))
                .single();

            if (op) {
                const tp = total_produced || 0;
                const dc = defective_count || 0;
                const hataOrani = tp > 0 ? dc / tp : 0;
                unit_value = (op.unit_price || 0) * tp;
                katki_degeri_tutari = (op.birim_deger || 0) * tp * (1 - hataOrani);
                // ✅ GÖREV 3: standart süreyi séç — Türkçe veya İngilizce kolon
                stdTime = op.standart_sure_dk || op.standard_time_min || 0;
            }
        } catch (_) { }

        const metrics = calcMetrics({
            total_produced, defective_count, start_time, end_time,
            break_duration_min, machine_down_min, material_wait_min, passive_time_min,
            standard_time_min: stdTime // ✅ GÖREV 3
        });

        const insertData = {
            model_id: parseInt(model_id),
            operation_id: parseInt(operation_id),
            personnel_id: parseInt(personnel_id),
            start_time,
            end_time: end_time || null,
            total_produced: total_produced || 0,
            defective_count: defective_count || 0,
            defect_reason: defect_reason || '',
            defect_source: defect_source || 'operator',
            break_duration_min: break_duration_min || 0,
            machine_down_min: machine_down_min || 0,
            material_wait_min: material_wait_min || 0,
            passive_time_min: passive_time_min || 0,
            quality_score: quality_score || 100,
            lot_change: lot_change || '',
            status: status || 'completed',
            defect_photo: defect_photo || '',
            defect_classification: defect_classification || '',
            notes: notes || '',
            unit_value,
            katki_degeri_tutari,
            first_pass_yield: metrics.first_pass_yield,
            net_work_minutes: metrics.net_work_minutes,
            oee_score: metrics.oee_score,
        };

        const { data: newLog, error: insertErr } = await supabaseAdmin
            .from('production_logs')
            .insert(insertData)
            .select(`
                *,
                models (name, code),
                operations (name, unit_price),
                personnel (name, role)
            `)
            .single();

        if (insertErr) throw insertErr;

        // ── Arka plan: personnel performans güncelle (son 30 gün) ──
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: rows } = await supabaseAdmin
                .from('production_logs')
                .select('total_produced, defective_count, oee_score')
                .eq('personnel_id', parseInt(personnel_id))
                .is('deleted_at', null)
                .gte('start_time', thirtyDaysAgo.toISOString());

            if (rows && rows.length > 0) {
                const avgOutput = Math.round(rows.reduce((s, r) => s + (r.total_produced || 0), 0) / rows.length);
                const totalProd = rows.reduce((s, r) => s + (r.total_produced || 0), 0);
                const totalDef = rows.reduce((s, r) => s + (r.defective_count || 0), 0);
                const errRate = totalProd > 0 ? Math.round((totalDef / totalProd) * 1000) / 10 : 0;
                const effScore = Math.round(rows.reduce((s, r) => s + (r.oee_score || 0), 0) / rows.length * 10) / 10;

                await supabaseAdmin
                    .from('personnel')
                    .update({ daily_avg_output: avgOutput, error_rate: errRate, efficiency_score: effScore })
                    .eq('id', parseInt(personnel_id));
            }
        } catch (_) { }

        // ── Arka plan: models.completed_count güncelle ──
        try {
            const { data: totals } = await supabaseAdmin
                .from('production_logs')
                .select('total_produced')
                .eq('model_id', parseInt(model_id))
                .is('deleted_at', null);

            const total = (totals || []).reduce((s, r) => s + (r.total_produced || 0), 0);
            await supabaseAdmin.from('models').update({ completed_count: total }).eq('id', parseInt(model_id));
        } catch (_) { }

        // ✅ GÖREV 10: FPY Uyarı Sistemi
        const fpy = metrics.first_pass_yield;
        const uyari = fpy < 80
            ? { uyari: true, seviye: fpy < 60 ? 'kritik' : 'dikkat', mesaj: `FPY Kritik! %${fpy} — Hata oranı çok yüksek!` }
            : { uyari: false };

        return NextResponse.json({
            ...newLog,
            model_name: newLog.models?.name,
            model_code: newLog.models?.code,
            operation_name: newLog.operations?.name,
            unit_price: newLog.operations?.unit_price,
            personnel_name: newLog.personnel?.name,
            models: undefined, operations: undefined, personnel: undefined,
            ...uyari,
        }, { status: 201 });

    } catch (error) {
        console.error('Production POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// PUT — Üretim kaydı güncelle
// ============================================================
export async function PUT(request) {
    try {
        // 🔒 Yetki kontrolü
        const user = await checkAuth(request, 'PUT');
        if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        if (user._forbidden) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const body = await request.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

        const ALLOWED_FIELDS = [
            'total_produced', 'defective_count', 'defect_reason', 'defect_source',
            'end_time', 'break_duration_min', 'machine_down_min', 'material_wait_min',
            'passive_time_min', 'quality_score', 'lot_change', 'status', 'notes',
            'defect_photo', 'defect_classification',
        ];

        const updateData = {};
        for (const f of ALLOWED_FIELDS) {
            if (updates[f] !== undefined) updateData[f] = updates[f];
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('production_logs')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// DELETE — Soft delete
// ============================================================
export async function DELETE(request) {
    try {
        // 🔒 Yetki kontrolü — sadece koordinator silebilir
        const user = await checkAuth(request, 'DELETE');
        if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        if (user._forbidden) return NextResponse.json({ error: 'Silme yetkiniz yok. Sadece Koordinatör silebilir.' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('production_logs')
            .update({ deleted_at: new Date().toISOString(), deleted_by: 'admin' })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
