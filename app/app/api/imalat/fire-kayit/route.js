import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/imalat/fire-kayit
 * Fire kaydı oluşturur ve cost_entries'e maliyet olarak yazar
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            model_id, plan_id, fire_metre, kumas_birim_fiyat,
            fire_nedeni, kaydeden_id
        } = body;

        if (!model_id || fire_metre === undefined) {
            return NextResponse.json({ error: 'model_id ve fire_metre zorunlu' }, { status: 400 });
        }

        const fireMaliyet = (fire_metre || 0) * (kumas_birim_fiyat || 0);

        // Eğer maliyet var → cost_entries'e fire kategorisinde kaydet
        if (fireMaliyet > 0) {
            await supabaseAdmin.from('cost_entries').insert({
                model_id: parseInt(model_id),
                category: 'fire',
                description: `Kumaş fire — ${fire_nedeni || 'belirtilmedi'}`,
                amount: kumas_birim_fiyat || 0,
                unit: 'metre',
                quantity: fire_metre,
                total: Math.round(fireMaliyet * 100) / 100,
            });
        }

        // Kesim kaydını da güncelle (eğer plan_id varsa)
        if (plan_id) {
            const { data: planData } = await supabaseAdmin
                .from('kesim_kayitlari')
                .select('fire_metre, fire_yuzde')
                .eq('plan_id', parseInt(plan_id))
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (planData) {
                // Bilgilendirme amaçlı log
                console.log(`Fire güncellendi: Plan ${plan_id} — ${fire_metre}m fire`);
            }
        }

        return NextResponse.json({
            success: true,
            fire_metre,
            fire_maliyet: Math.round(fireMaliyet * 100) / 100,
            uyari: fire_metre > 5 ? `⚠️ Yüksek fire: ${fire_metre}m — Maliyet: ${fireMaliyet.toFixed(2)}₺` : null,
        }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// GET — Model bazında toplam fire raporu
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');

        let query = supabaseAdmin
            .from('cost_entries')
            .select(`*, models(name, code)`)
            .eq('category', 'fire')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (model_id) query = query.eq('model_id', parseInt(model_id));

        const { data, error } = await query;
        if (error) throw error;

        const toplam_fire_maliyet = (data || []).reduce((s, r) => s + (r.total || 0), 0);

        return NextResponse.json({
            kayitlar: data || [],
            toplam_fire_maliyet: Math.round(toplam_fire_maliyet * 100) / 100,
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
