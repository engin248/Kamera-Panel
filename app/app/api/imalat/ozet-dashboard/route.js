import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/imalat/ozet-dashboard
 * İmalat bölümü özet dashboard verisi:
 * - Aktif sipariş sayısı
 * - Faz bazında tamamlanma oranları
 * - Toplam fire maliyeti (bu ay)
 * - OEE ortalaması (imalat)
 * - FPY ortalaması
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ay = parseInt(searchParams.get('ay') || new Date().getMonth() + 1);
        const yil = parseInt(searchParams.get('yil') || new Date().getFullYear());

        const ayStr = String(ay).padStart(2, '0');
        const baslangic = `${yil}-${ayStr}-01`;
        const sonrakiAy = ay === 12 ? 1 : ay + 1;
        const sonrakiYil = ay === 12 ? yil + 1 : yil;
        const bitis = `${sonrakiYil}-${String(sonrakiAy).padStart(2, '0')}-01`;

        // Parallel sorgular
        const [
            { data: aktifSiparisler },
            { data: fazDurumlari },
            { data: fireMaliyetleri },
            { data: uretimLoglari },
            { data: kesimIstatistik },
        ] = await Promise.all([
            // Aktif siparişler
            supabaseAdmin.from('orders')
                .select('id, order_no, quantity, delivery_date, status, models(name)')
                .is('deleted_at', null)
                .not('status', 'in', '("tamamlandi","iptal")')
                .order('delivery_date'),

            // Faz durumları
            supabaseAdmin.from('imalat_fazlari')
                .select('faz, durum, tamamlanan_adet, hedef_adet')
                .gte('created_at', `${baslangic}T00:00:00Z`)
                .lt('created_at', `${bitis}T00:00:00Z`),

            // Fire maliyetleri
            supabaseAdmin.from('cost_entries')
                .select('total')
                .eq('category', 'fire')
                .is('deleted_at', null)
                .gte('created_at', `${baslangic}T00:00:00Z`)
                .lt('created_at', `${bitis}T00:00:00Z`),

            // Üretim OEE/FPY
            supabaseAdmin.from('production_logs')
                .select('oee_score, first_pass_yield, total_produced, defective_count')
                .is('deleted_at', null)
                .gte('start_time', `${baslangic}T00:00:00Z`)
                .lt('start_time', `${bitis}T00:00:00Z`),

            // Kesim istatistiği
            supabaseAdmin.from('kesim_kayitlari')
                .select('gercek_adet, fire_adet, fire_yuzde, kullanilan_metre')
                .gte('created_at', `${baslangic}T00:00:00Z`)
                .lt('created_at', `${bitis}T00:00:00Z`),
        ]);

        // Hesaplamalar
        const toplam_fire_maliyet = (fireMaliyetleri || []).reduce((s, r) => s + (r.total || 0), 0);
        const ort_oee = uretimLoglari?.length
            ? uretimLoglari.reduce((s, r) => s + (r.oee_score || 0), 0) / uretimLoglari.length
            : 0;
        const ort_fpy = uretimLoglari?.length
            ? uretimLoglari.reduce((s, r) => s + (r.first_pass_yield || 0), 0) / uretimLoglari.length
            : 0;
        const toplam_uretim = (uretimLoglari || []).reduce((s, r) => s + (r.total_produced || 0), 0);

        // Faz özeti
        const fazOzet = {};
        for (const f of (fazDurumlari || [])) {
            if (!fazOzet[f.faz]) fazOzet[f.faz] = { toplam: 0, tamamlanan: 0, hedef: 0 };
            fazOzet[f.faz].toplam++;
            if (f.durum === 'tamamlandi') fazOzet[f.faz].tamamlanan++;
            fazOzet[f.faz].hedef += f.hedef_adet || 0;
        }

        // Kesim özeti
        const ort_fire = kesimIstatistik?.length
            ? kesimIstatistik.reduce((s, r) => s + (r.fire_yuzde || 0), 0) / kesimIstatistik.length
            : 0;

        return NextResponse.json({
            ay, yil,
            aktif_siparis_sayisi: (aktifSiparisler || []).length,
            aktif_siparisler: (aktifSiparisler || []).slice(0, 5).map(s => ({
                id: s.id, order_no: s.order_no, model_adi: s.models?.name,
                quantity: s.quantity, delivery_date: s.delivery_date, status: s.status,
            })),
            uretim: {
                toplam_adet: toplam_uretim,
                ort_oee: Math.round(ort_oee * 10) / 10,
                ort_fpy: Math.round(ort_fpy * 10) / 10,
            },
            fazlar: fazOzet,
            fire: {
                ort_fire_yuzde: Math.round(ort_fire * 10) / 10,
                toplam_maliyet: Math.round(toplam_fire_maliyet * 100) / 100,
                uyari: ort_fire > 3,
            },
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
