import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Audit trail kayıtları
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const tableName = searchParams.get('table');
        const recordId = searchParams.get('record_id');

        let query = supabaseAdmin
            .from('audit_trail')
            .select('*')
            .order('changed_at', { ascending: false })
            .limit(200);

        if (tableName) query = query.eq('table_name', tableName);
        if (recordId) query = query.eq('record_id', recordId);

        if (!tableName && !recordId) {
            // Tüm trail
        } else if (!tableName || !recordId) {
            return NextResponse.json({ error: 'table ve record_id zorunlu' }, { status: 400 });
        }

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Düzeltme kaydı ekle (5 saat kuralı ile)
export async function POST(request) {
    try {
        const body = await request.json();
        const { table_name, record_id, changes, changed_by, force_log } = body;

        const changeList = changes || [{
            field_name: body.field_name,
            old_value: body.old_value,
            new_value: body.new_value
        }];

        if (!table_name || !record_id) {
            return NextResponse.json({ error: 'table_name ve record_id zorunlu' }, { status: 400 });
        }

        // 5 SAAT KURALI
        let withinGracePeriod = false;
        if (!force_log) {
            try {
                const { data: rec } = await supabaseAdmin
                    .from(table_name)
                    .select('created_at')
                    .eq('id', record_id)
                    .single();

                if (rec?.created_at) {
                    const hoursDiff = (new Date() - new Date(rec.created_at)) / (1000 * 60 * 60);
                    withinGracePeriod = hoursDiff < 5;
                }
            } catch (_) { }
        }

        let loggedCount = 0;

        if (!withinGracePeriod) {
            const inserts = changeList
                .filter(c => c.old_value !== c.new_value)
                .map(c => ({
                    table_name,
                    record_id: String(record_id),
                    field_name: c.field_name,
                    old_value: String(c.old_value ?? ''),
                    new_value: String(c.new_value ?? ''),
                    changed_by: changed_by || 'admin',
                }));

            if (inserts.length > 0) {
                const { error } = await supabaseAdmin.from('audit_trail').insert(inserts);
                if (error) throw error;
                loggedCount = inserts.length;
            }
        }

        return NextResponse.json({
            logged: loggedCount,
            within_grace_period: withinGracePeriod,
            message: withinGracePeriod
                ? 'İlk 5 saat içinde — düzeltme kaydedilmedi (normal kurulum süresi)'
                : `${loggedCount} düzeltme kaydedildi`
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
