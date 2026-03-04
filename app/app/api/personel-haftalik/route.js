import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Haftalık personel çalışma özeti
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const d = new Date();
    const haftaBaslangic = searchParams.get('baslangic') ||
      new Date(d.setDate(d.getDate() - d.getDay() + 1)).toISOString().split('T')[0];
    const haftaSonu = new Date(new Date(haftaBaslangic).getTime() + 6 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('personel_saat_kayitlari')
      .select(`personel_id, net_calisma_dakika, mesai_dakika, tarih, personnel (name, daily_wage)`)
      .gte('tarih', haftaBaslangic)
      .lte('tarih', haftaSonu);

    if (error) throw error;

    // Personel bazında grupla
    const personelMap = {};
    for (const row of (data || [])) {
      const pid = row.personel_id;
      if (!personelMap[pid]) {
        personelMap[pid] = {
          personel_id: pid,
          ad: row.personnel?.name,
          daily_wage: row.personnel?.daily_wage || 0,
          toplam_dk: 0,
          mesai_dk: 0,
          gun_sayisi: 0,
        };
      }
      personelMap[pid].toplam_dk += row.net_calisma_dakika || 0;
      personelMap[pid].mesai_dk += row.mesai_dakika || 0;
      personelMap[pid].gun_sayisi += 1;
    }

    const sonuc = Object.values(personelMap).map(k => {
      const saatlik = (k.daily_wage || 0) / 8;
      const normal = (k.toplam_dk || 0) / 60;
      const mesai = (k.mesai_dk || 0) / 60;
      const net_maas = (normal * saatlik + mesai * saatlik * 1.5);
      return { ...k, saatlik_ucret: saatlik.toFixed(2), normal_saat: normal.toFixed(1), mesai_saat: mesai.toFixed(1), net_maas: net_maas.toFixed(2) };
    }).sort((a, b) => a.ad?.localeCompare(b.ad));

    return NextResponse.json({ baslangic: haftaBaslangic, bitis: haftaSonu, personel: sonuc });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
