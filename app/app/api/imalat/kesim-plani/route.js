import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Kesim planları listesi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');
        const siparis_id = searchParams.get('siparis_id');
        const durum = searchParams.get('durum');

        let query = supabaseAdmin
            .from('kesim_planlari')
            .select('*, models(name, code)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (model_id) query = query.eq('model_id', parseInt(model_id));
        if (siparis_id) query = query.eq('siparis_id', parseInt(siparis_id));
        if (durum) query = query.eq('durum', durum);

        const { data, error } = await query;
        if (error) throw error;

        const plans = (data || []).map(r => ({
            ...r,
            model_adi: r.models?.name,
            model_kodu: r.models?.code,
            siparis_no: r.orders?.order_no,
            kesimci_adi: r.personnel?.name,
            models: undefined, orders: undefined, personnel: undefined,
        }));

        return NextResponse.json(plans);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Yeni kesim planı oluştur
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            model_id, siparis_id, plan_tarihi, toplam_adet,
            beden_dagitimi, kat_sayisi, tahmini_sarj_metre,
            tahmini_fire_yuzde, kesimci_id, notlar
        } = body;

        if (!model_id || !plan_tarihi || !toplam_adet) {
            return NextResponse.json(
                { error: 'model_id, plan_tarihi ve toplam_adet zorunlu' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('kesim_planlari')
            .insert({
                model_id: parseInt(model_id),
                siparis_id: siparis_id ? parseInt(siparis_id) : null,
                plan_tarihi,
                toplam_adet: parseInt(toplam_adet),
                beden_dagitimi: beden_dagitimi || {},
                kat_sayisi: kat_sayisi || 1,
                tahmini_sarj_metre: tahmini_sarj_metre || 0,
                tahmini_fire_yuzde: tahmini_fire_yuzde || 5,
                kesimci_id: kesimci_id ? parseInt(kesimci_id) : null,
                notlar: notlar || '',
                durum: 'planlandı',
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT — Kesim planı güncelle (durum, gerçek kesim)
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, durum, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

        const ALLOWED = ['durum', 'notlar', 'tahmini_sarj_metre', 'kat_sayisi', 'kesimci_id'];
        const updateData = {};
        if (durum) updateData.durum = durum;
        for (const f of ALLOWED) {
            if (updates[f] !== undefined) updateData[f] = updates[f];
        }

        const { data, error } = await supabaseAdmin
            .from('kesim_planlari')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE — Soft delete
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('kesim_planlari')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
