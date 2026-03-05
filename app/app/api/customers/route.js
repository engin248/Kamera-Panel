import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// GET — Müşteri listesi
// ============================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('customers')
            .select('*')
            .is('deleted_at', null)
            .order('name', { ascending: true });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;

        // --- İŞLETME ZEKASI: MÜŞTERİ ROI/KÂRLILIK HESAPLAMASI ---
        const { data: orders } = await supabaseAdmin.from('orders').select('customer_id, quantity, unit_price, status').is('deleted_at', null);
        const customerStats = {};
        orders?.forEach(o => {
            if (!customerStats[o.customer_id]) customerStats[o.customer_id] = { totalVolume: 0, orderCount: 0, cancelledCount: 0 };
            customerStats[o.customer_id].orderCount++;
            if (o.status === 'iptal') customerStats[o.customer_id].cancelledCount++;
            else customerStats[o.customer_id].totalVolume += (o.quantity || 0) * (parseFloat(o.unit_price) || 250);
        });

        const enrichedCustomers = (data || []).map(c => {
            const stat = customerStats[c.id] || { totalVolume: 0, orderCount: 0, cancelledCount: 0 };
            let rating = 'C';
            let margin = 'Düşük Margin';
            let color = '#e74c3c';

            if (stat.totalVolume > 50000 && stat.cancelledCount === 0) { rating = 'A+'; margin = 'Yüksek Kâr'; color = '#27ae60'; }
            else if (stat.totalVolume > 15000) { rating = 'A'; margin = 'İyi Kâr'; color = '#2ecc71'; }
            else if (stat.totalVolume > 0 || stat.orderCount > 0) {
                if (stat.cancelledCount > stat.orderCount / 2) { rating = 'RİSK'; margin = 'Zarar Eden İş'; color = '#c0392b'; }
                else { rating = 'B'; margin = 'Standart'; color = '#f39c12'; }
            } else { rating = '—'; margin = 'Yeni/İş Yok'; color = 'var(--text-muted)'; }

            return {
                ...c,
                total_volume: stat.totalVolume,
                roi_rating: rating,
                margin_desc: margin,
                rating_color: color
            };
        });

        return NextResponse.json(enrichedCustomers);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni müşteri
// ============================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, company, phone, email, address, tax_no, notes } = body;

        if (!name) return NextResponse.json({ error: 'Müşteri adı zorunlu' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('customers')
            .insert({ name, company: company || '', phone: phone || '', email: email || '', address: address || '', tax_no: tax_no || '', notes: notes || '' })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
