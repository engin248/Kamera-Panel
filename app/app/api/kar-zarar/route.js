import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAuth, logActivity } from '@/lib/auth';

// ============================================================
// GET — Aylık kar/zarar özeti
// ============================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ay = searchParams.get('ay');
        const yil = searchParams.get('yil');

        let query = supabaseAdmin
            .from('kar_zarar_ozet')
            .select('*')
            .order('yil', { ascending: false })
            .order('ay', { ascending: false });

        if (ay) query = query.eq('ay', parseInt(ay));
        if (yil) query = query.eq('yil', parseInt(yil));

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Kar/Zarar GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni dönem özeti oluştur veya güncelle
// ============================================================
export async function POST(request) {
    try {
        // 🔒 Yetki kontrolü — sadece koordinator ve muhasip
        const user = await checkAuth(request, 'POST');
        if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        if (user._forbidden) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const body = await request.json();
        const { ay, yil } = body;

        if (!ay || !yil) {
            return NextResponse.json({ error: 'Ay ve yıl zorunlu' }, { status: 400 });
        }

        // Aynı ay/yıl varsa güncelle (upsert)
        const insertData = {
            ay: parseInt(ay),
            yil: parseInt(yil),
            toplam_gelir: parseFloat(body.toplam_gelir) || 0,
            hammadde_gider: parseFloat(body.hammadde_gider) || 0,
            iscilik_gider: parseFloat(body.iscilik_gider) || 0,
            fason_gider: parseFloat(body.fason_gider) || 0,
            sabit_gider: parseFloat(body.sabit_gider) || 0,
            prim_gider: parseFloat(body.prim_gider) || 0,
            toplam_uretim_adedi: parseInt(body.toplam_uretim_adedi) || 0,
            ortalama_fpy: parseFloat(body.ortalama_fpy) || 0,
            ortalama_oee: parseFloat(body.ortalama_oee) || 0,
            durum: body.durum || 'taslak',
        };

        // Brüt ve net kar hesapla
        const toplamGider = insertData.hammadde_gider + insertData.iscilik_gider +
            insertData.fason_gider + insertData.sabit_gider + insertData.prim_gider;
        insertData.brut_kar = insertData.toplam_gelir - toplamGider;
        insertData.net_kar = insertData.brut_kar; // Vergi hesaplaması ileride eklenecek
        insertData.kar_marji_yuzde = insertData.toplam_gelir > 0
            ? Math.round((insertData.net_kar / insertData.toplam_gelir) * 10000) / 100
            : 0;

        const { data, error } = await supabaseAdmin
            .from('kar_zarar_ozet')
            .upsert(insertData, { onConflict: 'ay,yil' })
            .select()
            .single();

        if (error) throw error;

        await logActivity(user, 'UPSERT', 'kar_zarar_ozet', data.id, `Kar/Zarar: ${ay}/${yil} — Net: ${insertData.net_kar} TL`);

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Kar/Zarar POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
