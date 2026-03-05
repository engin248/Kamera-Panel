import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/rapor/personel-verimlilik?ay=3&yil=2026&prim_orani=20
 * 
 * Her personel için:
 * - Üretim adedi, hata adedi, FPY
 * - Katkı değeri, gerçek maliyet
 * - Prim önerisi
 * Supabase versiyonu: production_logs + personnel + prim_kayitlari
 */
export async function GET(request) {
  try {
    const ayParam = searchParams.get('ay');
    const isAllTime = ayParam === 'all';
    const ay = parseInt(ayParam || new Date().getMonth() + 1);
    const yil = parseInt(searchParams.get('yil') || new Date().getFullYear());
    const prim_orani = parseFloat(searchParams.get('prim_orani') || '20');

    let baslangic, bitis;
    if (!isAllTime) {
      const ayStr = String(ay).padStart(2, '0');
      baslangic = `${yil}-${ayStr}-01T00:00:00`;
      const sonrakiAy = ay === 12 ? 1 : ay + 1;
      const sonrakiYil = ay === 12 ? yil + 1 : yil;
      bitis = `${sonrakiYil}-${String(sonrakiAy).padStart(2, '0')}-01T00:00:00`;
    }

    // ── 1. Aktif personel listesi ────────────────────────────
    const { data: personeller, error: pErr } = await supabaseAdmin
      .from('personnel')
      .select('id, name, base_salary, daily_wage, transport_allowance, food_allowance, start_date, status, position')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (pErr) throw pErr;

    // ── 2. Bu ay / Tüm zamanlar üretim logları (personnel_id bazında grouped) ─
    let uretimQuery = supabaseAdmin
      .from('production_logs')
      .select('personnel_id, total_produced, defective_count, first_pass_yield, unit_value, start_time')
      .is('deleted_at', null);

    if (!isAllTime) {
      uretimQuery = uretimQuery.gte('start_time', baslangic).lt('start_time', bitis);
    }

    const { data: uretimLogs } = await uretimQuery;

    // GroupBy personnel_id
    const uretimMap = {};
    const gunSetMap = {};
    for (const log of (uretimLogs || [])) {
      const pid = log.personnel_id;
      if (!pid) continue;
      if (!uretimMap[pid]) {
        uretimMap[pid] = { toplam_uretilen: 0, toplam_hatali: 0, toplam_ciro: 0 };
        gunSetMap[pid] = new Set();
      }
      uretimMap[pid].toplam_uretilen += log.total_produced || 0;
      uretimMap[pid].toplam_hatali += log.defective_count || 0;
      uretimMap[pid].toplam_ciro += log.unit_value || 0;
      if (log.start_time) {
        gunSetMap[pid].add(log.start_time.substring(0, 10));
      }
    }

    // ── 3. Mevcut prim kayıtları ────────────────────────────
    const primMap = {};
    try {
      const { data: primKayitlari } = await supabaseAdmin
        .from('prim_kayitlari')
        .select('*')
        .eq('ay', ay)
        .eq('yil', yil);

      (primKayitlari || []).forEach(p => {
        primMap[p.personnel_id] = p;
      });
    } catch (e) { /* prim_kayitlari yoksa geç */ }

    // ── 4. Her personel için hesapla ────────────────────────
    const sonuclar = (personeller || []).map(p => {
      const u = uretimMap[p.id] || { toplam_uretilen: 0, toplam_hatali: 0, toplam_ciro: 0 };
      const prim = primMap[p.id] || {};

      const toplam_uretilen = u.toplam_uretilen;
      const toplam_hatali = u.toplam_hatali;
      const hata_orani = toplam_uretilen > 0 ? toplam_hatali / toplam_uretilen : 0;
      const fpy = toplam_uretilen > 0 ? ((toplam_uretilen - toplam_hatali) / toplam_uretilen) * 100 : 100;
      const toplam_ciro = u.toplam_ciro;
      const katki_degeri = toplam_ciro * (1 - hata_orani);
      const calisilan_gun = gunSetMap[p.id] ? gunSetMap[p.id].size : 0;

      // Gerçek maaş maliyeti
      const brut = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0);
      const sgk_isveren = brut * 0.225;
      const gercek_maas_maliyeti = brut + sgk_isveren;

      // Katkı-Maaş farkı
      const katki_maas_farki = katki_degeri - gercek_maas_maliyeti;
      const prim_hak_etti = katki_maas_farki > 0;
      const onerilen_prim = prim_hak_etti ? katki_maas_farki * (prim_orani / 100) : 0;

      let sinyal;
      if (katki_maas_farki >= 250) sinyal = 'yesil';
      else if (katki_maas_farki >= 0) sinyal = 'sari';
      else sinyal = 'kirmizi';

      return {
        personel_id: p.id,
        ad: p.name,
        pozisyon: p.position,
        toplam_uretilen,
        toplam_hatali,
        fpy: parseFloat(fpy.toFixed(1)),
        hata_yuzdesi: parseFloat((hata_orani * 100).toFixed(1)),
        calisilan_gun,
        katki_degeri: parseFloat(katki_degeri.toFixed(2)),
        brut_maas: parseFloat(brut.toFixed(2)),
        sgk_isveren: parseFloat(sgk_isveren.toFixed(2)),
        gercek_maas_maliyeti: parseFloat(gercek_maas_maliyeti.toFixed(2)),
        katki_maas_farki: parseFloat(katki_maas_farki.toFixed(2)),
        prim_hak_etti,
        prim_orani,
        onerilen_prim: parseFloat(onerilen_prim.toFixed(2)),
        sinyal,
        // Mevcut prim kaydı
        mevcut_prim: prim.onaylanan_prim || null,
        prim_onay_durumu: prim.onay_durumu || null,
        prim_kayit_id: prim.id || null,
      };
    });

    // ── 5. Özet istatistikler ────────────────────────────────
    const sirali = [...sonuclar].sort((a, b) => b.katki_degeri - a.katki_degeri);
    const ozet = {
      toplam_personel: sonuclar.length,
      prim_hak_eden: sonuclar.filter(s => s.prim_hak_etti).length,
      toplam_katki: parseFloat(sonuclar.reduce((t, s) => t + s.katki_degeri, 0).toFixed(2)),
      toplam_maas_maliyeti: parseFloat(sonuclar.reduce((t, s) => t + s.gercek_maas_maliyeti, 0).toFixed(2)),
      toplam_onerilen_prim: parseFloat(sonuclar.reduce((t, s) => t + s.onerilen_prim, 0).toFixed(2)),
      ort_fpy: sonuclar.length > 0
        ? parseFloat((sonuclar.reduce((t, s) => t + s.fpy, 0) / sonuclar.length).toFixed(1))
        : 0,
      en_verimli: sirali.slice(0, 3).map(s => ({ ad: s.ad, katki: s.katki_degeri, fpy: s.fpy })),
    };

    return NextResponse.json({
      ay, yil, prim_orani,
      ozet,
      personeller: sirali,
    });
  } catch (err) {
    console.error('/api/rapor/personel-verimlilik ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
