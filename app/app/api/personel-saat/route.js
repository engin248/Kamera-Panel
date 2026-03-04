import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function hesaplaMola(dakika) {
    if (dakika <= 120) return 0;
    if (dakika <= 240) return 15;
    return 30;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const tarih = searchParams.get('tarih') || new Date().toISOString().split('T')[0];

        const [{ data: kayitlar }, { data: personel }] = await Promise.all([
            supabaseAdmin
                .from('personel_saat_kayitlari')
                .select(`*, personnel (name, role)`)
                .eq('tarih', tarih)
                .order('personel_id'),
            supabaseAdmin
                .from('personnel')
                .select('id, name, role')
                .is('deleted_at', null)
                .order('name'),
        ]);

        const formatted = (kayitlar || []).map(r => ({
            ...r,
            personel_adi: r.personnel?.name,
            gorev: r.personnel?.role,
            personnel: undefined,
        }));

        return NextResponse.json({ kayitlar: formatted, personel: personel || [] });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { personel_id, tip } = await request.json();
        const simdi = new Date();
        const tarih = simdi.toISOString().split('T')[0];
        const saat = simdi.toTimeString().split(' ')[0].substring(0, 5);

        const { data: mevcut } = await supabaseAdmin
            .from('personel_saat_kayitlari')
            .select('*')
            .eq('personel_id', parseInt(personel_id))
            .eq('tarih', tarih)
            .single();

        if (tip === 'giris') {
            if (mevcut) {
                await supabaseAdmin
                    .from('personel_saat_kayitlari')
                    .update({ giris_saat: saat })
                    .eq('id', mevcut.id);
            } else {
                await supabaseAdmin
                    .from('personel_saat_kayitlari')
                    .insert({ personel_id: parseInt(personel_id), tarih, giris_saat: saat });
            }
        } else if (tip === 'cikis' && mevcut?.giris_saat) {
            const [gh, gm] = mevcut.giris_saat.split(':').map(Number);
            const [ch, cm] = saat.split(':').map(Number);
            const toplamDk = (ch * 60 + cm) - (gh * 60 + gm);
            const molaDk = hesaplaMola(toplamDk);
            const netDk = Math.max(0, toplamDk - molaDk);
            const mesaiDk = Math.max(0, (gh * 60 + gm + netDk) - (17 * 60 + 30));
            const gecDk = Math.max(0, (gh * 60 + gm) - (8 * 60));

            await supabaseAdmin
                .from('personel_saat_kayitlari')
                .update({ cikis_saat: saat, net_calisma_dakika: netDk, mesai_dakika: mesaiDk, gec_kalma_dakika: gecDk })
                .eq('id', mevcut.id);
        }

        return NextResponse.json({ success: true, saat });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
