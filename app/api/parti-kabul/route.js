import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Parti kabul listesi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const modelId = searchParams.get('model_id');

        let query = supabaseAdmin
            .from('parti_kabul')
            .select(`*, models (name)`)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(50);

        if (modelId) query = query.eq('model_id', parseInt(modelId));

        const { data, error } = await query;
        if (error) throw error;

        const rows = (data || []).map(r => ({ ...r, model_adi: r.models?.name, models: undefined }));
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Yeni parti kabul kaydı
export async function POST(request) {
    try {
        const body = await request.json();
        const { model_id, firma_adi, getiren_personel_id, kabul_eden_id,
            gelis_tarihi, arac_plaka, tasima_tipi, toplam_adet,
            beden_listesi, parca_listesi, parca_eksik, parca_eksik_not,
            beden_eksik, beden_eksik_not, dugme_var, dugme_adet,
            fermuar_var, fermuar_tip, etiket_geldi, yikama_talimati_geldi,
            hang_tag_geldi, aksesuar_not, kabul_durum, foto_url, notlar } = body;

        if (!firma_adi) return NextResponse.json({ error: 'Firma adı zorunlu' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('parti_kabul')
            .insert({
                model_id: model_id ? parseInt(model_id) : null,
                firma_adi, getiren_personel_id: getiren_personel_id || null,
                kabul_eden_id: kabul_eden_id || null,
                gelis_tarihi: gelis_tarihi || new Date().toISOString(),
                arac_plaka: arac_plaka || '', tasima_tipi: tasima_tipi || 'kendi_araci',
                toplam_adet: toplam_adet || 0,
                beden_listesi: beden_listesi || [], parca_listesi: parca_listesi || [],
                parca_eksik: !!parca_eksik, parca_eksik_not: parca_eksik_not || '',
                beden_eksik: !!beden_eksik, beden_eksik_not: beden_eksik_not || '',
                dugme_var: !!dugme_var, dugme_adet: dugme_adet || 0,
                fermuar_var: !!fermuar_var, fermuar_tip: fermuar_tip || '',
                etiket_geldi: !!etiket_geldi, yikama_talimati_geldi: !!yikama_talimati_geldi,
                hang_tag_geldi: !!hang_tag_geldi, aksesuar_not: aksesuar_not || '',
                kabul_durum: kabul_durum || 'tam', foto_url: foto_url || '', notlar: notlar || '',
            })
            .select().single();

        if (error) throw error;
        return NextResponse.json({ success: true, id: data.id }, { status: 201 });
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

        const { error } = await supabaseAdmin.from('parti_kabul').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
