import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/rapor/ay-ozet?ay=3&yil=2026
 * Rapor & Analiz — Sekme 5.1 Dashboard için aylık özet
 * Supabase versiyonu: ayrı sorgular → JavaScript'te birleştirme
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ay = parseInt(searchParams.get('ay') || new Date().getMonth() + 1);
    const yil = parseInt(searchParams.get('yil') || new Date().getFullYear());

    const ayStr = String(ay).padStart(2, '0');
    const baslangic = `${yil}-${ayStr}-01T00:00:00`;
    const sonrakiAy = ay === 12 ? 1 : ay + 1;
    const sonrakiYil = ay === 12 ? yil + 1 : yil;
    const bitis = `${sonrakiYil}-${String(sonrakiAy).padStart(2, '0')}-01T00:00:00`;

    // ── 1. Üretim logları (ay aralığı) ──────────────────────
    const { data: uretimLogs } = await supabaseAdmin
      .from('production_logs')
      .select('total_produced, defective_count, first_pass_yield, oee_score, unit_value, personnel_id, model_id')
      .is('deleted_at', null)
      .gte('start_time', baslangic)
      .lt('start_time', bitis);

    const logs = uretimLogs || [];
    const toplam_uretim = logs.reduce((s, r) => s + (r.total_produced || 0), 0);
    const toplam_hata = logs.reduce((s, r) => s + (r.defective_count || 0), 0);
    const fpy = toplam_uretim > 0 ? ((toplam_uretim - toplam_hata) / toplam_uretim) * 100 : 100;
    const aktif_personel = new Set(logs.map(r => r.personnel_id).filter(Boolean)).size;
    const uretilen_model = new Set(logs.map(r => r.model_id).filter(Boolean)).size;
    const toplam_ciro = logs.reduce((s, r) => s + (r.unit_value || 0), 0);

    // ── 2. İşletme giderleri ────────────────────────────────
    const { data: giderler } = await supabaseAdmin
      .from('business_expenses')
      .select('amount')
      .is('deleted_at', null)
      .eq('year', yil)
      .eq('month', ay);

    const toplam_gider = (giderler || []).reduce((s, g) => s + (g.amount || 0), 0);

    // ── 3. Personel maliyet (aktif) ─────────────────────────
    const { data: personeller } = await supabaseAdmin
      .from('personnel')
      .select('base_salary, transport_allowance, food_allowance')
      .eq('status', 'active')
      .is('deleted_at', null);

    const toplam_iscilik = (personeller || []).reduce((s, p) => {
      const brut = (p.base_salary || 0) + (p.transport_allowance || 0) + (p.food_allowance || 0);
      return s + brut * 1.225;
    }, 0);

    // ── 4. Sipariş geliri ───────────────────────────────────
    const { data: siparisler } = await supabaseAdmin
      .from('orders')
      .select('total_price')
      .is('deleted_at', null)
      .in('status', ['tamamlandi', 'teslim_edildi'])
      .gte('updated_at', baslangic)
      .lt('updated_at', bitis);

    const toplam_gelir = (siparisler || []).reduce((s, o) => s + (o.total_price || 0), 0);

    // ── 5. Prim ödemeleri ───────────────────────────────────
    let odenen_prim = 0;
    let prim_alan = 0;
    try {
      const { data: primler } = await supabaseAdmin
        .from('prim_kayitlari')
        .select('onaylanan_prim')
        .eq('ay', ay)
        .eq('yil', yil)
        .in('onay_durumu', ['onaylandi', 'odendi']);
      if (primler) {
        odenen_prim = primler.reduce((s, p) => s + (p.onaylanan_prim || 0), 0);
        prim_alan = primler.length;
      }
    } catch (e) { /* prim_kayitlari tablosu yoksa geç */ }

    // ── 6. En verimli 3 personel ────────────────────────────
    const personelMap = {};
    for (const log of logs) {
      const pid = log.personnel_id;
      if (!pid) continue;
      if (!personelMap[pid]) personelMap[pid] = { uretim: 0, hata: 0, katki: 0 };
      personelMap[pid].uretim += log.total_produced || 0;
      personelMap[pid].hata += log.defective_count || 0;
      personelMap[pid].katki += log.unit_value || 0;
    }

    // Personel isimlerini çek
    const pidList = Object.keys(personelMap).map(Number).slice(0, 20);
    let personelIsimler = {};
    if (pidList.length > 0) {
      const { data: pData } = await supabaseAdmin
        .from('personnel')
        .select('id, name')
        .in('id', pidList);
      (pData || []).forEach(p => { personelIsimler[p.id] = p.name; });
    }

    const en_verimli_3 = Object.entries(personelMap)
      .map(([pid, v]) => ({ name: personelIsimler[pid] || `P#${pid}`, ...v }))
      .sort((a, b) => b.katki - a.katki)
      .slice(0, 3);

    // ── 7. En sorunlu model ─────────────────────────────────
    const modelMap = {};
    for (const log of logs) {
      const mid = log.model_id;
      if (!mid) continue;
      if (!modelMap[mid]) modelMap[mid] = { toplam: 0, hata: 0 };
      modelMap[mid].toplam += log.total_produced || 0;
      modelMap[mid].hata += log.defective_count || 0;
    }
    const midList = Object.keys(modelMap).map(Number).slice(0, 20);
    let modelIsimler = {};
    if (midList.length > 0) {
      const { data: mData } = await supabaseAdmin
        .from('models')
        .select('id, name, code')
        .in('id', midList);
      (mData || []).forEach(m => { modelIsimler[m.id] = m; });
    }
    const sorunlu_model = Object.entries(modelMap)
      .map(([mid, v]) => ({
        model_adi: modelIsimler[mid]?.name || `M#${mid}`,
        model_kodu: modelIsimler[mid]?.code || '-',
        ...v,
        hata_oran: v.toplam > 0 ? (v.hata / v.toplam) * 100 : 0,
      }))
      .filter(m => m.hata_oran > 0)
      .sort((a, b) => b.hata_oran - a.hata_oran)[0] || null;

    // ── Hesaplamalar ────────────────────────────────────────
    const efektif_gelir = toplam_gelir > 0 ? toplam_gelir : toplam_ciro;
    const hammadde_tahmini = toplam_gider * 0.4;
    const net_kar = efektif_gelir - hammadde_tahmini - toplam_iscilik - (toplam_gider * 0.6) - odenen_prim;
    const kar_marji = efektif_gelir > 0 ? (net_kar / efektif_gelir) * 100 : 0;
    const prim_havuzu = net_kar > 0 ? net_kar * 0.1 : 0;
    const sinyal = net_kar > 0 ? 'yesil' : net_kar > -1000 ? 'sari' : 'kirmizi';

    return NextResponse.json({
      ay, yil, sinyal,
      toplam_uretim,
      toplam_hata,
      fpy: parseFloat(fpy.toFixed(1)),
      aktif_personel,
      uretilen_model,
      toplam_gelir: parseFloat(efektif_gelir.toFixed(2)),
      toplam_iscilik: parseFloat(toplam_iscilik.toFixed(2)),
      toplam_gider: parseFloat(toplam_gider.toFixed(2)),
      prim_gider: parseFloat(odenen_prim.toFixed(2)),
      net_kar: parseFloat(net_kar.toFixed(2)),
      kar_marji: parseFloat(kar_marji.toFixed(1)),
      prim_havuzu: parseFloat(prim_havuzu.toFixed(2)),
      en_verimli_3,
      sorunlu_model,
      prim_alan,
    });
  } catch (err) {
    console.error('/api/rapor/ay-ozet ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
