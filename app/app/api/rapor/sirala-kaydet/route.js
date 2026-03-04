import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST — Personel sıralamasını prim_kayitlari'na kaydet
export async function POST(request) {
    try {
        const body = await request.json();
        const { ay, yil, prim_orani = 15, personeller } = body;

        if (!ay || !yil || !Array.isArray(personeller)) {
            return NextResponse.json({ error: 'ay, yil ve personeller zorunlu' }, { status: 400 });
        }

        const upsertList = personeller.map(p => {
            const katki_maas_farki = (p.katki_degeri || 0) - (p.maas_maliyeti || 0);
            const prim_tutari = katki_maas_farki > 0 ? katki_maas_farki * (prim_orani / 100) : 0;
            return {
                personel_id: parseInt(p.personel_id),
                ay: parseInt(ay),
                yil: parseInt(yil),
                katki_degeri: p.katki_degeri || 0,
                maas_maliyeti: p.maas_maliyeti || 0,
                katki_maas_farki,
                prim_orani: prim_orani,
                prim_tutari: parseFloat(prim_tutari.toFixed(2)),
                onay_durumu: 'hesaplandi',
            };
        });

        const { error } = await supabaseAdmin
            .from('prim_kayitlari')
            .upsert(upsertList, { onConflict: 'personel_id,ay,yil' });
        if (error) throw error;

        // Karar arşivine kayıt
        try {
            const ilk3 = personeller.slice(0, 3).map((p, i) => `${i + 1}. ${p.ad}: ${Math.round(p.katki_degeri || 0)} ₺`).join(', ');
            await supabaseAdmin.from('karar_arsivi').insert({
                konu: `${ay}/${yil} Verimlilik Sıralaması (${personeller.length} personel)`,
                bolum: 'personel', sistem_onerisi: `İlk 3: ${ilk3}`,
                ilgili_ay: parseInt(ay), ilgili_yil: parseInt(yil),
            });
        } catch (_) { }

        return NextResponse.json({ success: true, kaydedilen: upsertList.length, mesaj: `${ay}/${yil} için ${upsertList.length} personel sıralaması kaydedildi` });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET — Geçmiş sıralamalar
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const gecmis_ay = parseInt(searchParams.get('ay') || 0);
        const gecmis_yil = parseInt(searchParams.get('yil') || 0);

        let query = supabaseAdmin
            .from('prim_kayitlari')
            .select(`personel_id, ay, yil, katki_degeri, maas_maliyeti, katki_maas_farki, prim_tutari, onay_durumu, personnel (name, position)`)
            .order('yil', { ascending: false })
            .order('ay', { ascending: false })
            .order('katki_degeri', { ascending: false });

        if (gecmis_ay && gecmis_yil) {
            query = query.eq('ay', gecmis_ay).eq('yil', gecmis_yil);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Aylara göre grupla
        const ayMap = {};
        (data || []).forEach((k, idx) => {
            const key = `${k.yil}-${k.ay}`;
            if (!ayMap[key]) ayMap[key] = { ay: k.ay, yil: k.yil, personeller: [] };
            ayMap[key].personeller.push({ ...k, personel_ad: k.personnel?.name, pozisyon: k.personnel?.position, sira: ayMap[key].personeller.length + 1, personnel: undefined });
        });

        return NextResponse.json({ aylar: Object.values(ayMap), toplam_kayit: (data || []).length });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
