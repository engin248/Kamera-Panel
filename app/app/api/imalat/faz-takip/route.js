import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Faz durumları (Kanban verisi)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');
        const siparis_id = searchParams.get('siparis_id');

        let query = supabaseAdmin
            .from('imalat_fazlari')
            .select('*, models(name, code)')
            .order('faz', { ascending: true })
            .order('created_at', { ascending: false });

        if (model_id) query = query.eq('model_id', parseInt(model_id));
        if (siparis_id) query = query.eq('siparis_id', parseInt(siparis_id));

        const { data, error } = await query;
        if (error) throw error;

        const fazlar = (data || []).map(f => ({
            ...f,
            model_adi: f.models?.name,
            model_kodu: f.models?.code,
            siparis_no: f.orders?.order_no,
            siparis_adet: f.orders?.quantity,
            sorumlu_adi: f.personnel?.name,
            ilerleme_yuzde: f.hedef_adet > 0
                ? Math.min(100, Math.round((f.tamamlanan_adet / f.hedef_adet) * 100))
                : 0,
            models: undefined, orders: undefined, personnel: undefined,
        }));

        // Kanban formatında döndür
        const kanban = {
            kesim: fazlar.filter(f => f.faz === 'kesim'),
            dikim: fazlar.filter(f => f.faz === 'dikim'),
            kalite_inline: fazlar.filter(f => f.faz === 'kalite_inline'),
            utu_paket: fazlar.filter(f => f.faz === 'utu_paket'),
            sevkiyat: fazlar.filter(f => f.faz === 'sevkiyat'),
        };

        return NextResponse.json({ fazlar, kanban });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Yeni faz kaydı
export async function POST(request) {
    try {
        const body = await request.json();
        const { model_id, siparis_id, faz, hedef_adet, sorumlu_id, notlar } = body;

        if (!model_id || !faz) {
            return NextResponse.json({ error: 'model_id ve faz zorunlu' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('imalat_fazlari')
            .insert({
                model_id: parseInt(model_id),
                siparis_id: siparis_id ? parseInt(siparis_id) : null,
                faz,
                hedef_adet: hedef_adet || 0,
                tamamlanan_adet: 0,
                sorumlu_id: sorumlu_id ? parseInt(sorumlu_id) : null,
                durum: 'bekliyor',
                baslangic: new Date().toISOString(),
                notlar: notlar || '',
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT — Faz güncelle (tamamlanan adet, durum)
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, tamamlanan_adet, durum, notlar, bitis } = body;
        if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

        const updateData = { updated_at: new Date().toISOString() };
        if (tamamlanan_adet !== undefined) updateData.tamamlanan_adet = parseInt(tamamlanan_adet);
        if (durum) updateData.durum = durum;
        if (notlar !== undefined) updateData.notlar = notlar;
        if (durum === 'tamamlandi') updateData.bitis = bitis || new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('imalat_fazlari')
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
