import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/rapor/ay-muhasebe?ay=3&yil=2026
 * POST { ay, yil, onay_notu } → Ay kapanışını kar_zarar_ozet'e kaydet
 */

function ayHesapla(ay, yil) {
    const ayStr = String(ay).padStart(2, '0');
    const baslangic = `${yil}-${ayStr}-01`;
    const sonrakiAy = ay === 12 ? 1 : ay + 1;
    const sonrakiYil = ay === 12 ? yil + 1 : yil;
    const bitis = `${sonrakiYil}-${String(sonrakiAy).padStart(2, '0')}-01`;
    return { baslangic, bitis };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ay = parseInt(searchParams.get('ay') || (new Date().getMonth() + 1));
        const yil = parseInt(searchParams.get('yil') || new Date().getFullYear());
        const { baslangic, bitis } = ayHesapla(ay, yil);

        // ── GELİRLER ──
        const { data: productionLogs } = await supabaseAdmin
            .from('production_logs')
            .select('total_produced, unit_value, operations(unit_price)')
            .is('deleted_at', null)
            .gte('start_time', `${baslangic}T00:00:00Z`)
            .lt('start_time', `${bitis}T00:00:00Z`);

        const uretimGeliri = (productionLogs || []).reduce((s, r) => s + (r.unit_value || 0), 0);

        const { data: tamamlananSiparisler } = await supabaseAdmin
            .from('orders')
            .select('total_price')
            .is('deleted_at', null)
            .in('status', ['tamamlandi', 'teslim_edildi'])
            .gte('updated_at', `${baslangic}T00:00:00Z`)
            .lt('updated_at', `${bitis}T00:00:00Z`);

        const siparisGeliri = (tamamlananSiparisler || []).reduce((s, r) => s + (r.total_price || 0), 0);

        // ── GİDERLER ──
        const { data: personeller } = await supabaseAdmin
            .from('personnel')
            .select('base_salary, transport_allowance, food_allowance')
            .eq('status', 'active')
            .is('deleted_at', null);

        let toplamIscilik = 0;
        (personeller || []).forEach(p => {
            const brut = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0);
            toplamIscilik += brut + brut * 0.225; // ✅ GÖREV 1: SGK işveren payı %22.5 (2024 oranı)
        });

        const { data: hammaddeler } = await supabaseAdmin
            .from('cost_entries')
            .select('amount')
            .is('deleted_at', null)
            .in('entry_type', ['hammadde', 'malzeme', 'material', 'fabric'])
            .gte('created_at', `${baslangic}T00:00:00Z`).lt('created_at', `${bitis}T00:00:00Z`); // ✅ GÖREV 2: entry_date → created_at
        const hammaddeGideri = (hammaddeler || []).reduce((s, r) => s + (r.amount || 0), 0);

        const { data: sabitGiderData } = await supabaseAdmin
            .from('cost_entries')
            .select('amount')
            .is('deleted_at', null)
            .in('entry_type', ['sabit', 'kira', 'elektrik', 'su', 'diger', 'fixed', 'overhead'])
            .gte('created_at', `${baslangic}T00:00:00Z`).lt('created_at', `${bitis}T00:00:00Z`); // ✅ GÖREV 2: entry_date → created_at
        const sabitGiderler = (sabitGiderData || []).reduce((s, r) => s + (r.amount || 0), 0);

        const { data: fasonData } = await supabaseAdmin
            .from('fason_orders')
            .select('quantity, unit_price')
            .is('deleted_at', null)
            .neq('status', 'iptal')
            .gte('expected_date', baslangic).lt('expected_date', bitis);
        const fasonGiderleri = (fasonData || []).reduce((s, r) => s + (r.quantity || 0) * (r.unit_price || 0), 0);

        const { data: primData } = await supabaseAdmin
            .from('prim_kayitlari')
            .select('prim_tutari')
            .eq('ay', ay).eq('yil', yil)
            .in('onay_durumu', ['onaylandi', 'odendi']);
        const primGiderleri = (primData || []).reduce((s, r) => s + (r.prim_tutari || 0), 0);

        // ── ÖZET ──
        // ✅ GÖREV 6: Çift sayım önleme — sipariş geliri varsa onu kullan, yoksa üretim değeri
        const toplamGelir = siparisGeliri > 0 ? siparisGeliri : uretimGeliri;
        const toplamGider = toplamIscilik + hammaddeGideri + sabitGiderler + fasonGiderleri + primGiderleri;
        const net_kar = toplamGelir - toplamGider;
        const kar_marji = toplamGelir > 0 ? (net_kar / toplamGelir) * 100 : 0;
        const sinyal = net_kar > 0 && kar_marji > 10 ? 'yesil' : net_kar >= 0 ? 'sari' : 'kirmizi';

        const { data: kapanis } = await supabaseAdmin
            .from('kar_zarar_ozet').select('*').eq('ay', ay).eq('yil', yil).maybeSingle();

        return NextResponse.json({
            ay, yil,
            gelirler: { uretim_geliri: uretimGeliri, siparis_geliri: siparisGeliri, toplam: toplamGelir },
            giderler: { iscilik: toplamIscilik, hammadde: hammaddeGideri, sabit: sabitGiderler, fason: fasonGiderleri, prim: primGiderleri, toplam: toplamGider },
            net_kar: Math.round(net_kar * 100) / 100,
            kar_marji: parseFloat(kar_marji.toFixed(2)),
            sinyal,
            kapama_durumu: kapanis,
            personel_sayisi: (personeller || []).length,
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { ay, yil, onay_notu } = body;
        if (!ay || !yil) return NextResponse.json({ error: 'ay ve yil zorunlu' }, { status: 400 });

        // GET ile hesaplamaları yeniden yap
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const resp = await fetch(`${baseUrl}/api/rapor/ay-muhasebe?ay=${ay}&yil=${yil}`);
        const hesap = await resp.json();

        const { error } = await supabaseAdmin
            .from('kar_zarar_ozet')
            .upsert({
                ay: parseInt(ay), yil: parseInt(yil),
                toplam_gelir: hesap.gelirler?.toplam || 0,
                toplam_gider: hesap.giderler?.toplam || 0,
                net_kar: hesap.net_kar || 0,
                kar_marji_yuzde: hesap.kar_marji || 0,
                durum: 'onaylandi',
                onay_notu: onay_notu || null,
                kapama_tarihi: new Date().toISOString(),
            }, { onConflict: 'ay,yil' });

        if (error) throw error;
        return NextResponse.json({ success: true, mesaj: `${ay}/${yil} ay kapanışı tamamlandı`, net_kar: hesap.net_kar });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
