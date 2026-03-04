import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Üretim girişleri (lot/parti listesi)
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('uretim_girisleri')
            .select('*, models(name, code)')
            .order('created_at', { ascending: false });

        if (error) {
            // Tablo yoksa boş dön (Supabase'de henüz oluşturulmamış olabilir)
            if (error.code === '42P01') {
                return NextResponse.json([]);
            }
            throw error;
        }

        const rows = (data || []).map(r => ({
            ...r,
            model_adi: r.models?.name,
            model_kodu: r.models?.code,
            getiren_adi: r.getiren?.name,
            acan_adi: r.acan?.name,
            models: undefined, getiren: undefined, acan: undefined,
        }));

        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Yeni üretim girişi (lot aç)
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            model_id, getiren_personel_id, acilis_tarihi, acan_personel_id,
            beden_eksik, beden_eksik_detay, aksesuar_eksik, aksesuar_eksik_detay,
            kumas_eksik, kumas_eksik_detay, numune_ayrildi, parca_sayisi,
            notlar, parcalar
        } = body;

        if (!model_id) return NextResponse.json({ error: 'Model seçilmedi' }, { status: 400 });

        const { data: giris, error: girisErr } = await supabaseAdmin
            .from('uretim_girisleri')
            .insert({
                model_id: parseInt(model_id),
                getiren_personel_id: getiren_personel_id || null,
                acilis_tarihi: acilis_tarihi || null,
                acan_personel_id: acan_personel_id || null,
                beden_eksik: beden_eksik ? true : false,
                beden_eksik_detay: beden_eksik_detay || '',
                aksesuar_eksik: aksesuar_eksik ? true : false,
                aksesuar_eksik_detay: aksesuar_eksik_detay || '',
                kumas_eksik: kumas_eksik ? true : false,
                kumas_eksik_detay: kumas_eksik_detay || '',
                numune_ayrildi: numune_ayrildi ? true : false,
                parca_sayisi: parca_sayisi || 0,
                notlar: notlar || '',
                durum: 'beklemede',
            })
            .select()
            .single();

        if (girisErr) throw girisErr;

        // Parça listesi ekle
        if (parcalar && Array.isArray(parcalar) && parcalar.length > 0) {
            const parcaInserts = parcalar.map(p => ({
                giris_id: giris.id,
                parca_adi: p.parca_adi || '',
                fotograf_url: p.fotograf_url || '',
            }));
            await supabaseAdmin.from('uretim_giris_parcalar').insert(parcaInserts);
        }

        return NextResponse.json({ success: true, id: giris.id }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT — Durum güncelle
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, durum } = body;
        if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('uretim_girisleri')
            .update({ durum: durum || 'tamamlandi' })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
