import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Karar arşivi listesi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const bolum = searchParams.get('bolum');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabaseAdmin
            .from('karar_arsivi')
            .select('*')
            .order('tarih', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (bolum) query = query.eq('bolum', bolum);

        const { data, error } = await query;
        if (error) throw error;

        const kayitlar = (data || []).map(r => ({ ...r, sorumlu_ad: r.sorumlu_ad || r.personnel?.name, personnel: undefined }));

        // İstatistik
        const { data: stats } = await supabaseAdmin
            .from('karar_arsivi')
            .select('sistem_mi_dogru');

        const istatistik = {
            toplam: (stats || []).length,
            sistem_dogru: (stats || []).filter(s => s.sistem_mi_dogru === true).length,
            insan_dogru: (stats || []).filter(s => s.sistem_mi_dogru === false).length,
            belirsiz: (stats || []).filter(s => s.sistem_mi_dogru === null).length,
        };

        return NextResponse.json({ kayitlar, istatistik });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — Yeni karar kaydı
export async function POST(request) {
    try {
        const body = await request.json();
        const { tarih, konu, bolum, sistem_onerisi, yapilan_karar, sonuc, sonuc_sayisal, sistem_mi_dogru, ogrenim_notu, ilgili_ay, ilgili_yil, sorumlu_id, sorumlu_ad } = body;

        if (!konu) return NextResponse.json({ error: 'Konu zorunlu' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('karar_arsivi')
            .insert({
                tarih: tarih || new Date().toISOString().split('T')[0],
                konu, bolum: bolum || 'uretim',
                sistem_onerisi: sistem_onerisi || null,
                yapilan_karar: yapilan_karar || null,
                sonuc: sonuc || null,
                sonuc_sayisal: sonuc_sayisal || null,
                sistem_mi_dogru: sistem_mi_dogru !== undefined ? sistem_mi_dogru : null,
                ogrenim_notu: ogrenim_notu || null,
                ilgili_ay: ilgili_ay || null,
                ilgili_yil: ilgili_yil || null,
                sorumlu_id: sorumlu_id || null,
                sorumlu_ad: sorumlu_ad || null,
            })
            .select().single();

        if (error) throw error;
        return NextResponse.json({ success: true, id: data.id });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
