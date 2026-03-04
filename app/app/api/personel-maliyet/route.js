import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Personel maliyet analizi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const personelId = searchParams.get('personel_id');
        const tarih = searchParams.get('tarih') || new Date().toISOString().split('T')[0];
        const donem = searchParams.get('donem') || 'gunluk'; // gunluk | haftalik | aylik

        let personelQuery = supabaseAdmin.from('personnel').select('*').eq('status', 'active').is('deleted_at', null).order('name');
        if (personelId) personelQuery = personelQuery.eq('id', parseInt(personelId));
        const { data: personeller } = await personelQuery;

        // Dönem sınırları
        let baslangic, bitis;
        const [yil, ay] = tarih.split('-');
        if (donem === 'aylik') {
            baslangic = `${yil}-${ay}-01T00:00:00Z`;
            const nextM = parseInt(ay) === 12 ? 1 : parseInt(ay) + 1;
            const nextY = parseInt(ay) === 12 ? parseInt(yil) + 1 : parseInt(yil);
            bitis = `${nextY}-${String(nextM).padStart(2, '0')}-01T00:00:00Z`;
        } else if (donem === 'haftalik') {
            const d = new Date(tarih);
            d.setDate(d.getDate() - 7);
            baslangic = d.toISOString();
            bitis = new Date(tarih + 'T23:59:59Z').toISOString();
        } else {
            baslangic = `${tarih}T00:00:00Z`;
            bitis = `${tarih}T23:59:59Z`;
        }

        // Üretim verisi toplu çek
        const { data: logs } = await supabaseAdmin
            .from('production_logs')
            .select('personnel_id, total_produced, defective_count, unit_value, net_work_minutes')
            .is('deleted_at', null)
            .gte('start_time', baslangic)
            .lte('start_time', bitis);

        const logMap = {};
        for (const l of (logs || [])) {
            const pid = l.personnel_id;
            if (!logMap[pid]) logMap[pid] = { toplam_uretim: 0, toplam_hata: 0, toplam_deger: 0, toplam_sure: 0, kayit_sayisi: 0 };
            logMap[pid].toplam_uretim += l.total_produced || 0;
            logMap[pid].toplam_hata += l.defective_count || 0;
            logMap[pid].toplam_deger += l.unit_value || 0;
            logMap[pid].toplam_sure += l.net_work_minutes || 0;
            logMap[pid].kayit_sayisi += 1;
        }

        const sonuc = (personeller || []).map(p => {
            const brutMaas = p.base_salary || 0;

            // ── İŞVEREN MALİYETLERİ ──────────────────────────────
            const sgk_isveren = Math.round(brutMaas * 0.225);       // %22.5 işveren SGK
            const issizlik_isveren = Math.round(brutMaas * 0.02);   // %2 işsizlik işveren payı
            const sgk_toplam_isveren = sgk_isveren + issizlik_isveren;

            // ── ÇALIŞAN KESİNTİLERİ (bilgi amaçlı) ──────────────
            const sgk_calisan = Math.round(brutMaas * 0.14);        // %14 çalışan SGK
            const issizlik_calisan = Math.round(brutMaas * 0.01);   // %1 çalışan işsizlik
            const damga_vergisi = Math.round(brutMaas * 0.00759);   // %0.759 damga vergisi
            const net_maas = brutMaas - sgk_calisan - issizlik_calisan - damga_vergisi;

            // ── EK HAKLAR ────────────────────────────────────────
            const yol = p.transport_allowance || 0;
            const yemek = p.food_allowance || 0;
            const kidem_tazminat_karsiligi = Math.round(brutMaas / 12); // Aylık kıdem karşılığı

            // ── TOPLAM GERÇEK İŞVEREN MALİYETİ ──────────────────
            const aylik_toplam_maliyet = brutMaas + sgk_toplam_isveren + yol + yemek + kidem_tazminat_karsiligi;
            const gunluk_maliyet = Math.round((aylik_toplam_maliyet / 22) * 100) / 100;
            const saatlik_maliyet = Math.round((gunluk_maliyet / 9) * 100) / 100;
            const dakika_maliyet = Math.round((saatlik_maliyet / 60) * 1000) / 1000;

            const donem_maliyet = donem === 'aylik' ? aylik_toplam_maliyet
                : donem === 'haftalik' ? gunluk_maliyet * 5 : gunluk_maliyet;

            const uretim = logMap[p.id] || { toplam_uretim: 0, toplam_hata: 0, toplam_deger: 0, toplam_sure: 0, kayit_sayisi: 0 };
            const net_katki = uretim.toplam_deger - donem_maliyet;
            const prim = net_katki > 0 ? Math.round(net_katki * 0.30 * 100) / 100 : 0; // %30 prim oranı
            const fpy = uretim.toplam_uretim > 0
                ? Math.round((1 - uretim.toplam_hata / uretim.toplam_uretim) * 10000) / 100 : 100;

            return {
                id: p.id, ad: p.name, rol: p.role, pozisyon: p.position,
                // Brüt ve net
                brut_maas: brutMaas,
                net_maas,
                // İşveren kalemleri
                sgk_isveren,
                issizlik_isveren,
                sgk_toplam_isveren,
                kidem_karsiligi: kidem_tazminat_karsiligi,
                yol, yemek,
                // Çalışan kalemleri (bilgi)
                sgk_calisan,
                issizlik_calisan,
                damga_vergisi,
                // Toplam maliyet
                aylik_toplam_maliyet,
                gunluk_maliyet,
                saatlik_maliyet,
                dakika_maliyet,
                donem_maliyet,
                // Üretim verisi
                toplam_uretim: uretim.toplam_uretim,
                toplam_hata: uretim.toplam_hata,
                toplam_deger: Math.round(uretim.toplam_deger * 100) / 100,
                toplam_sure_dk: Math.round(uretim.toplam_sure),
                net_katki: Math.round(net_katki * 100) / 100,
                prim, fpy,
            };
        });

        return NextResponse.json(sonuc);

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
