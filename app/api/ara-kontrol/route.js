import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Ara kontrol listesi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const modelId = searchParams.get('model_id');
        const limit = parseInt(searchParams.get('limit') || '30');

        let query = supabaseAdmin
            .from('ara_kontrol')
            .select(`*, personnel (name)`)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (modelId) query = query.eq('model_id', parseInt(modelId));

        const { data, error } = await query;
        if (error) throw error;

        const rows = (data || []).map(r => ({ ...r, kontrol_eden_adi: r.personnel?.name, personnel: undefined }));
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Yeni ara kontrol kaydı
export async function POST(request) {
    try {
        const body = await request.json();
        const { parti_id, model_id, kontrol_eden_id, istasyon,
            sira_no, beden, adet, hatali, foto_url,
            numune_foto_url, ai_uyum_skoru, onay, ret_nedeni, notlar } = body;

        const { data, error } = await supabaseAdmin
            .from('ara_kontrol')
            .insert({
                parti_id: parti_id || null,
                model_id: model_id ? parseInt(model_id) : null,
                kontrol_eden_id: kontrol_eden_id ? parseInt(kontrol_eden_id) : null,
                istasyon: istasyon || 'Dikim',
                sira_no: sira_no || null,
                beden: beden || '',
                adet: adet || 0,
                hatali: hatali || 0,
                foto_url: foto_url || '',
                numune_foto_url: numune_foto_url || '',
                ai_uyum_skoru: ai_uyum_skoru || null,
                onay: !!onay,
                ret_nedeni: ret_nedeni || '',
                notlar: notlar || '',
                tarih: new Date().toISOString().split('T')[0],
            })
            .select().single();

        if (error) throw error;
        return NextResponse.json({ success: true, id: data.id }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
