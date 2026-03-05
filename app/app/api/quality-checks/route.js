import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Kalite kontrol kayıtları
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');
        const personnel_id = searchParams.get('personnel_id');
        const result_filter = searchParams.get('result');

        let query = supabaseAdmin
            .from('quality_checks')
            .select(`*, models (name, code), personnel (name), operations (name)`)
            .is('deleted_at', null)
            .order('checked_at', { ascending: false });

        if (model_id) query = query.eq('model_id', parseInt(model_id));
        if (personnel_id) query = query.eq('personnel_id', parseInt(personnel_id));
        if (result_filter) query = query.eq('result', result_filter);

        const { data, error } = await query;
        if (error) throw error;

        const checks = (data || []).map(row => ({
            ...row,
            model_name: row.models?.name,
            model_code: row.models?.code,
            personnel_name: row.personnel?.name,
            operation_name: row.operations?.name,
            models: undefined, personnel: undefined, operations: undefined,
        }));

        return NextResponse.json(checks);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni kalite kontrol kaydı
export async function POST(request) {
    try {
        const body = await request.json();
        const { production_log_id, model_id, operation_id, personnel_id,
            check_type, check_number, result, defect_type, photo_path, notes, checked_by } = body;

        if (!result) return NextResponse.json({ error: 'Kontrol sonucu zorunlu (ok/red/warning)' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('quality_checks')
            .insert({
                production_log_id: production_log_id || null,
                model_id: model_id || null,
                operation_id: operation_id || null,
                personnel_id: personnel_id || null,
                check_type: check_type || 'inline',
                check_number: check_number || 1,
                result,
                defect_type: defect_type || '',
                photo_path: photo_path || '',
                notes: notes || '',
                checked_by: checked_by || '',
            })
            .select()
            .single();

        if (error) throw error;

        // --- İŞLETME ZEKASI: TAMİR/REWORK MALİYET CEZASI ---
        // Eğer ürün hatalı (red) ise ve bir personnel_id varsa, 1.5 TL (veya hesaplanan) tamir cezasını Fire/Zayiat olarak kişinin hanesine yaz.
        if (result === 'red' && personnel_id) {
            const penaltyAmount = 1.50; // Varsayılan Sökme/Dikme Rework Maliyeti
            await supabaseAdmin.from('fire_kayitlari').insert({
                model_id: model_id || null,
                kumas_tipi: 'Tamir/Rework Kaybı',
                fire_metre: 0,
                kullanilan_metre: 0,
                fire_safhasi: 'kalite_kontrol',
                operator_id: personnel_id,
                estimated_loss_amount: penaltyAmount,
                fire_nedeni: `Kalite Reddi & Tamir (Hata: ${defect_type || 'Bilinmiyor'})`
            });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
