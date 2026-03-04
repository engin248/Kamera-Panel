import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// PRİM MOTORU — Supabase versiyonu
// Formül (SISTEM-GENEL.md):
//   Katki Degeri = SUM(uretilen × birim_deger × (1 - hata_orani))
//   Maas Maliyeti = base_salary + yol + yemek + SGK(%20.5)
//   Fazla Deger = Katki - Maas
//   Prim = Fazla Deger > 0 ise (Fazla × prim_orani%) yoksa 0
// ============================================================

// GET — Aylık prim kayıtları
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ay = searchParams.get('ay');
        const yil = searchParams.get('yil');
        const personel_id = searchParams.get('personel_id');

        if (!ay || !yil) return NextResponse.json({ error: 'ay ve yil zorunlu' }, { status: 400 });

        let query = supabaseAdmin
            .from('prim_kayitlari')
            .select(`*, personnel (name, base_salary, transport_allowance, food_allowance)`)
            .eq('ay', parseInt(ay))
            .eq('yil', parseInt(yil))
            .order('katki_degeri', { ascending: false });

        if (personel_id) query = query.eq('personel_id', parseInt(personel_id));

        const { data, error } = await query;
        if (error) throw error;

        const primler = (data || []).map(row => ({
            ...row,
            personel_adi: row.personnel?.name,
            base_salary: row.personnel?.base_salary,
            personnel: undefined,
        }));

        return NextResponse.json(primler);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Aylık prim hesapla ve kaydet
export async function POST(request) {
    try {
        const body = await request.json();
        const { ay, yil, prim_orani = 30 } = body;

        if (!ay || !yil) return NextResponse.json({ error: 'ay ve yil zorunlu' }, { status: 400 });

        // Bu ay üretim yapan personeller + üretim verileri
        const startDate = `${yil}-${String(ay).padStart(2, '0')}-01`;
        const nextMonth = ay === 12 ? `${parseInt(yil) + 1}-01-01` : `${yil}-${String(ay + 1).padStart(2, '0')}-01`;

        const { data: logs } = await supabaseAdmin
            .from('production_logs')
            .select(`
                personnel_id, total_produced, defective_count,
                operations (birim_deger, unit_price),
                personnel (id, name, base_salary, transport_allowance, food_allowance)
            `)
            .is('deleted_at', null)
            .gte('start_time', startDate)
            .lt('start_time', nextMonth);

        if (!logs || logs.length === 0) {
            return NextResponse.json({ success: true, mesaj: 'Bu ay için üretim verisi yok', dagitim: [] });
        }

        // Personnel bazında grupla
        const personelMap = {};
        for (const log of logs) {
            const pid = log.personnel_id;
            if (!pid) continue;
            if (!personelMap[pid]) {
                personelMap[pid] = {
                    personnel_id: pid,
                    personnel: log.personnel,
                    toplam_uretilen: 0,
                    toplam_hatali: 0,
                    katki_degeri: 0,
                };
            }
            const tp = log.total_produced || 0;
            const dc = log.defective_count || 0;
            const birim = log.operations?.birim_deger || log.operations?.unit_price || 0; // GÖREV 4: fallback
            const hata_orani = tp > 0 ? dc / tp : 0;

            personelMap[pid].toplam_uretilen += tp;
            personelMap[pid].toplam_hatali += dc;
            personelMap[pid].katki_degeri += tp * birim * (1 - hata_orani);
        }

        const sonuclar = [];
        for (const [pid, veri] of Object.entries(personelMap)) {
            const p = veri.personnel || {};
            const sgk_prim = (p.base_salary || 0) * 0.205;
            const maas_maliyeti = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0) + sgk_prim;
            const katki = Math.round(veri.katki_degeri * 100) / 100;
            const fark = katki - maas_maliyeti;
            const prim = fark > 0 ? Math.round(fark * (prim_orani / 100) * 100) / 100 : 0;
            const fpy = veri.toplam_uretilen > 0
                ? Math.round(((veri.toplam_uretilen - veri.toplam_hatali) / veri.toplam_uretilen) * 1000) / 10
                : 100;

            const upsertData = {
                personel_id: parseInt(pid),
                ay: parseInt(ay),
                yil: parseInt(yil),
                toplam_uretilen: veri.toplam_uretilen,
                toplam_hatali: veri.toplam_hatali,
                fpy_yuzde: fpy,
                katki_degeri: katki,
                maas_maliyeti: Math.round(maas_maliyeti * 100) / 100,
                katki_maas_farki: Math.round(fark * 100) / 100,
                prim_orani: prim_orani,
                prim_tutari: prim,
                onay_durumu: 'hesaplandi',
            };

            const { error: upsertErr } = await supabaseAdmin
                .from('prim_kayitlari')
                .upsert(upsertData, { onConflict: 'personel_id,ay,yil' });

            if (upsertErr) console.error('Prim kayıt hatası:', upsertErr);

            sonuclar.push({ ...upsertData, personel_adi: p.name });
        }

        return NextResponse.json({
            success: true,
            ay, yil,
            personel_sayisi: sonuclar.length,
            dagitim: sonuclar,
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT — Onay / ödendi güncelle
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, onay_durumu, onaylayan_id, odeme_tarihi, notlar } = body;
        if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });

        const updateData = { updated_at: new Date().toISOString() };
        if (onay_durumu) updateData.onay_durumu = onay_durumu;
        if (onaylayan_id) updateData.onaylayan_id = onaylayan_id;
        if (onay_durumu === 'onaylandi') updateData.onay_tarihi = new Date().toISOString();
        if (odeme_tarihi) updateData.odeme_tarihi = odeme_tarihi;
        if (notlar) updateData.notlar = notlar;

        const { data, error } = await supabaseAdmin
            .from('prim_kayitlari')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
