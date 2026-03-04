import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAuth, logActivity } from '@/lib/auth';

// ============================================================
// GET — Model maliyet kalemlerini getir
// ============================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');

        let query = supabaseAdmin
            .from('cost_entries')
            .select('*, models(name, code)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (model_id) {
            query = query.eq('model_id', model_id);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Düzleştir
        const entries = data.map(e => ({
            ...e,
            model_name: e.models?.name,
            model_code: e.models?.code,
            models: undefined,
        }));

        return NextResponse.json(entries);
    } catch (error) {
        console.error('Costs GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni maliyet kalemi ekle
// ============================================================
export async function POST(request) {
    try {
        // 🔒 Yetki kontrolü
        const user = await checkAuth(request, 'POST');
        if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        if (user._forbidden) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const body = await request.json();
        const { model_id, category, description, amount, unit, quantity } = body;

        if (!model_id || !category || !amount) {
            return NextResponse.json({ error: 'Model, kategori ve tutar zorunlu' }, { status: 400 });
        }

        const qty = parseFloat(quantity) || 1;
        const amt = parseFloat(amount) || 0;
        const total = amt * qty;

        const { data, error } = await supabaseAdmin
            .from('cost_entries')
            .insert({
                model_id: parseInt(model_id),
                category,
                description: description || '',
                amount: amt,
                unit: unit || '',
                quantity: qty,
                total,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Costs POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
