import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAuth, logActivity } from '@/lib/auth';

// ============================================================
// GET — Tekil karar detayı
// ============================================================
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('karar_arsivi')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'Karar bulunamadı' }, { status: 404 });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Karar Arşivi GET [id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// PUT — Karar sonucunu ve öğrenim notunu güncelle
// ============================================================
export async function PUT(request, { params }) {
    try {
        // 🔒 Yetki kontrolü
        const user = await checkAuth(request, 'PUT');
        if (!user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        if (user._forbidden) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const { id } = await params;
        const body = await request.json();

        const ALLOWED_FIELDS = [
            'yapilan_karar', 'yapilan_detay',
            'sonuc', 'sonuc_sayisal', 'sistem_mi_dogru',
            'ogrenim_notu',
        ];

        const updateData = {};
        for (const f of ALLOWED_FIELDS) {
            if (body[f] !== undefined) updateData[f] = body[f];
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('karar_arsivi')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await logActivity(user, 'UPDATE', 'karar_arsivi', id, `Karar güncellendi: ${Object.keys(updateData).join(', ')}`);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Karar Arşivi PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
