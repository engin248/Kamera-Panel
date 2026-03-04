import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAuth, logActivity } from '@/lib/auth';

// ============================================================
// GET — Karar arşivi listesi (filtreleme destekli)
// ============================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const konu = searchParams.get('konu');
        const bolum = searchParams.get('bolum');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabaseAdmin
            .from('karar_arsivi')
            .select('*')
            .order('tarih', { ascending: false })
            .limit(limit);

        if (konu) query = query.ilike('konu', `%${konu}%`);
        if (bolum) query = query.eq('bolum', bolum);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Karar Arşivi GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni karar kaydı oluştur
// ============================================================
export async function POST(request) {
    try {
        // 🔒 Yetki kontrolü — sadece koordinator ve ustabasi
        const user = await checkAuth(request, 'POST');
        if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        if (user._forbidden) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const body = await request.json();
        const { konu, bolum, sistem_onerisi, oneri_detay, yapilan_karar, yapilan_detay, sorumlu_id } = body;

        if (!konu) {
            return NextResponse.json({ error: 'Karar konusu zorunlu' }, { status: 400 });
        }

        const insertData = {
            konu,
            bolum: bolum || 'uretim',
            sistem_onerisi: sistem_onerisi || '',
            oneri_detay: oneri_detay || null,
            yapilan_karar: yapilan_karar || '',
            yapilan_detay: yapilan_detay || null,
            sorumlu_id: sorumlu_id || null,
        };

        const { data, error } = await supabaseAdmin
            .from('karar_arsivi')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;

        // Audit log
        await logActivity(user, 'CREATE', 'karar_arsivi', data.id, `Yeni karar: ${konu}`);

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Karar Arşivi POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
