import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Çalışma takvimi / aylık çalışma günleri
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'schedule' | 'workdays'
        const year = searchParams.get('year') || new Date().getFullYear();

        if (type === 'workdays') {
            const { data, error } = await supabaseAdmin
                .from('monthly_work_days')
                .select('*')
                .eq('year', parseInt(year))
                .order('month');
            if (error) throw error;
            return NextResponse.json(data || []);
        }

        // Default: mola/çalışma çizelgesi
        const { data, error } = await supabaseAdmin
            .from('work_schedule')
            .select('*')
            .order('order_number');
        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Çalışma günü veya çizelge güncelle
export async function PUT(request) {
    try {
        const body = await request.json();

        if (body.type === 'workdays') {
            const { year, month, work_days } = body;
            if (!year || !month || !work_days) {
                return NextResponse.json({ error: 'Yıl, ay ve çalışma günü zorunlu' }, { status: 400 });
            }
            const { error } = await supabaseAdmin
                .from('monthly_work_days')
                .upsert({ year: parseInt(year), month: parseInt(month), work_days: parseInt(work_days) },
                    { onConflict: 'year,month' });
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (body.type === 'schedule') {
            const { id, name, start_time, end_time } = body;
            if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });
            const { error } = await supabaseAdmin
                .from('work_schedule')
                .update({ name, start_time, end_time })
                .eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Geçersiz tip' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
