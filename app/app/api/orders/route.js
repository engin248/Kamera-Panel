import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAuth, logActivity } from '@/lib/auth';

const PRIORITY_ORDER = { acil: 1, yuksek: 2, normal: 3, dusuk: 4 };

// ============================================================
// GET — Sipariş listesi
// ============================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const archived = searchParams.get('archived') === '1';
        const status = searchParams.get('status');
        const model_id = searchParams.get('model_id');
        const customer_id = searchParams.get('customer_id');

        let query = supabaseAdmin
            .from('orders')
            .select(`*, customers (name, company), models (name, code)`)
            .order('created_at', { ascending: false });

        if (archived) {
            query = query.not('deleted_at', 'is', null);
        } else {
            query = query.is('deleted_at', null);
        }
        if (status) query = query.eq('status', status);
        if (model_id) query = query.eq('model_id', parseInt(model_id));
        if (customer_id) query = query.eq('customer_id', parseInt(customer_id));

        const { data, error } = await query;
        if (error) throw error;

        // Düzleştir + öncelik sırala
        const orders = (data || [])
            .map(row => ({
                ...row,
                c_name: row.customers?.name,
                c_company: row.customers?.company,
                m_name: row.models?.name,
                m_code: row.models?.code,
                customers: undefined, models: undefined,
            }))
            .sort((a, b) => (PRIORITY_ORDER[a.priority] || 9) - (PRIORITY_ORDER[b.priority] || 9));

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni sipariş
// ============================================================
export async function POST(request) {
    try {
        // 🔒 Yetki kontrolü
        const user = await checkAuth(request, 'POST');
        if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        if (user._forbidden) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const body = await request.json();

        // Sipariş no: otomatik oluştur
        let orderNo = body.order_no;
        if (!orderNo) {
            const { count } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });
            orderNo = `SIP-${String((count || 0) + 1).padStart(4, '0')}`;
        }

        const totalPrice = (parseFloat(body.quantity) || 0) * (parseFloat(body.unit_price) || 0);

        const insertData = {
            order_no: orderNo,
            customer_id: body.customer_id || null,
            customer_name: body.customer_name || '',
            model_id: body.model_id || null,
            model_name: body.model_name || '',
            quantity: parseInt(body.quantity) || 0,
            unit_price: parseFloat(body.unit_price) || 0,
            total_price: totalPrice,
            delivery_date: body.delivery_date || null,
            priority: body.priority || 'normal',
            fabric_type: body.fabric_type || '',
            color: body.color || '',
            sizes: body.sizes || '',
            notes: body.notes || '',
            status: body.status || 'siparis_alindi',
        };

        const { data, error } = await supabaseAdmin
            .from('orders')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
