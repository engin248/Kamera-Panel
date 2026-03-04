import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/imalat/kalite
 * İmalat inline kalite kontrol kaydı
 * quality_checks tablosuna yazar + faz bilgisiyle etiketler
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            model_id, operation_id, personnel_id, production_log_id,
            check_type, check_number, result, defect_type,
            photo_path, notes, checked_by, faz
        } = body;

        if (!result || !['ok', 'red', 'warning'].includes(result)) {
            return NextResponse.json(
                { error: 'result zorunlu: ok | red | warning' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('quality_checks')
            .insert({
                production_log_id: production_log_id || null,
                model_id: model_id ? parseInt(model_id) : null,
                operation_id: operation_id ? parseInt(operation_id) : null,
                personnel_id: personnel_id ? parseInt(personnel_id) : null,
                check_type: check_type || 'inline',
                check_number: check_number || 1,
                result,
                defect_type: defect_type || '',
                photo_path: photo_path || '',
                notes: notes ? `[İMALAT:${faz || 'dikim'}] ${notes}` : `[İMALAT:${faz || 'dikim'}]`,
                checked_by: checked_by || '',
            })
            .select()
            .single();

        if (error) throw error;

        // FPY hesapla — aynı model için bugünkü ortalama
        const today = new Date().toISOString().split('T')[0];
        const { data: bugunKontroller } = await supabaseAdmin
            .from('quality_checks')
            .select('result')
            .eq('model_id', model_id ? parseInt(model_id) : 0)
            .gte('checked_at', `${today}T00:00:00Z`);

        const toplam = (bugunKontroller || []).length;
        const hatali = (bugunKontroller || []).filter(k => k.result === 'red').length;
        const fpy = toplam > 0 ? ((toplam - hatali) / toplam * 100) : 100;
        const fpySignal = fpy >= 95 ? '🟢' : fpy >= 90 ? '🟡' : '🔴';

        return NextResponse.json({
            success: true,
            kayit: data,
            bugun_fpy: Math.round(fpy * 10) / 10,
            fpy_signal: fpySignal,
            uyari: fpy < 90 ? `⚠️ FPY %${fpy.toFixed(1)} — Kritik seviye!` : null,
        }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// GET — İmalat kalite kontrol kayıtları
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');
        const personnel_id = searchParams.get('personnel_id');

        let query = supabaseAdmin
            .from('quality_checks')
            .select(`*, models(name, code), personnel(name)`)
            .ilike('notes', '%[İMALAT%]%')
            .is('deleted_at', null)
            .order('checked_at', { ascending: false })
            .limit(100);

        if (model_id) query = query.eq('model_id', parseInt(model_id));
        if (personnel_id) query = query.eq('personnel_id', parseInt(personnel_id));

        const { data, error } = await query;
        if (error) throw error;

        const kontrollar = (data || []).map(r => ({
            ...r,
            model_adi: r.models?.name,
            personel_adi: r.personnel?.name,
            models: undefined, personnel: undefined,
        }));

        return NextResponse.json(kontrollar);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
