import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const VALID_COLUMNS = new Set([
    'name', 'code', 'order_no', 'modelist', 'customer', 'customer_id', 'description',
    'fabric_type', 'sizes', 'size_range', 'total_order', 'total_order_text', 'completed_count',
    'fason_price', 'fason_price_text', 'model_difficulty',
    'front_image', 'back_image', 'measurement_table',
    'delivery_date', 'work_start_date', 'post_sewing', 'status',
    'garni', 'color_count', 'color_details', 'size_count', 'size_distribution', 'asorti',
    'total_operations', 'piece_count', 'piece_count_details',
    'op_kesim_count', 'op_kesim_details', 'op_dikim_count', 'op_dikim_details',
    'op_utu_paket_count', 'op_utu_paket_details', 'op_nakis_count', 'op_nakis_details',
    'op_yikama_count', 'op_yikama_details',
    'has_lining', 'lining_pieces', 'has_interlining', 'interlining_parts', 'interlining_count',
    'difficult_points', 'critical_points', 'customer_requests',
    'cutting_info', 'accessory_info', 'label_info',
]);

const DATE_FIELDS = ['delivery_date', 'work_start_date'];
const JSON_FIELDS = ['measurement_table'];

function sanitizeData(data) {
    const out = {};
    for (const [k, v] of Object.entries(data)) {
        if (!VALID_COLUMNS.has(k)) continue;
        if (DATE_FIELDS.includes(k)) { out[k] = v === '' ? null : v; continue; }
        if (JSON_FIELDS.includes(k) && typeof v === 'string') {
            try { out[k] = JSON.parse(v); } catch { out[k] = v; }
            continue;
        }
        out[k] = v;
    }
    return out;
}

// GET — Tüm modeller
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('models')
            .select('*, operations(count)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const models = (data || []).map(m => ({
            ...m,
            operation_count: m.operations?.[0]?.count ?? 0,
            operations: undefined,
        }));

        return NextResponse.json(models);
    } catch (error) {
        console.error('Models GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni model ekle
export async function POST(request) {
    try {
        const body = await request.json();
        if (!body.name || !body.code) {
            return NextResponse.json({ error: 'Model adı ve kodu zorunlu' }, { status: 400 });
        }

        // Kod benzersiz mi?
        const { data: mevcut } = await supabaseAdmin
            .from('models')
            .select('id')
            .eq('code', body.code)
            .is('deleted_at', null)
            .single();

        if (mevcut) {
            return NextResponse.json({ error: 'Bu model kodu zaten var' }, { status: 409 });
        }

        const insertData = sanitizeData(body);

        const { data, error } = await supabaseAdmin
            .from('models')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Models POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
