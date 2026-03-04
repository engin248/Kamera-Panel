import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/rapor/kapasite-tahmini?hafta=1
 * ✅ GÖREV 11: Haftalık Kapasite Tahmini
 * Aktif personel × OEE ortalaması × standart süre → tahmini haftalık kapasite
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        // Hedef hafta (kaç hafta sonrası, 0 = bu hafta)
        const hafta = parseInt(searchParams.get('hafta') || '0');

        // Hedef haftanın tarih aralığını hesapla
        const bugun = new Date();
        const gun = bugun.getDay(); // 0=Pazar... 1=Pazartesi
        const pazartesi = new Date(bugun);
        pazartesi.setDate(bugun.getDate() - (gun === 0 ? 6 : gun - 1) + (hafta * 7));
        pazartesi.setHours(0, 0, 0, 0);
        const pazar = new Date(pazartesi);
        pazar.setDate(pazartesi.getDate() + 6);
        pazar.setHours(23, 59, 59, 999);

        // Aktif personel sayısı
        const { data: personeller } = await supabaseAdmin
            .from('personnel')
            .select('id, name, role, efficiency_score, daily_avg_output')
            .eq('status', 'active')
            .is('deleted_at', null);

        const aktifPersonelSayisi = (personeller || []).length;

        // Son 30 günlük OEE ortalaması
        const otuzGunOnce = new Date();
        otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);

        const { data: oeeData } = await supabaseAdmin
            .from('production_logs')
            .select('oee_score, net_work_minutes')
            .is('deleted_at', null)
            .gt('oee_score', 0)
            .gte('start_time', otuzGunOnce.toISOString());

        const ortOEE = (oeeData || []).length > 0
            ? (oeeData || []).reduce((t, r) => t + (r.oee_score || 0), 0) / oeeData.length
            : 75; // Varsayılan %75

        // İş günlerini hesapla (9 saat / gün, 5 gün / hafta)
        const { data: workDays } = await supabaseAdmin
            .from('work_schedule')
            .select('type, start_time, end_time')
            .eq('type', 'mesai');

        // Standart çalışma dakikası: 9 saat × 60
        const gunlukCalisma = 9 * 60;

        // Tatil günlerini work_schedule'dan değil monthly_work_days'tan al
        const { data: aylikGunData } = await supabaseAdmin
            .from('monthly_work_days')
            .select('work_days')
            .eq('year', pazartesi.getFullYear())
            .eq('month', pazartesi.getMonth() + 1)
            .maybeSingle();

        const haftalikCalismaSayisi = aylikGunData
            ? Math.min(5, Math.round((aylikGunData.work_days / 4)))
            : 5;

        // Kapasite formülü:
        // Toplam kapasite = personel sayısı × günlük çalışma × haftalık iş günü × OEE
        const toplamDakika = aktifPersonelSayisi * gunlukCalisma * haftalikCalismaSayisi;
        const efektifDakika = Math.round(toplamDakika * (ortOEE / 100));

        // Ortalama personel üretim verimi (daily_avg_output bazlı)
        const ortPersonelCikisi = aktifPersonelSayisi > 0
            ? (personeller || []).reduce((t, p) => t + (p.daily_avg_output || 100), 0) / aktifPersonelSayisi
            : 100;

        const tahminiHaftalikUretim = Math.round(
            ortPersonelCikisi * aktifPersonelSayisi * haftalikCalismaSayisi
        );

        // Personel bazında bireysel kapasite
        const personelKapasite = (personeller || []).map(p => ({
            personel_id: p.id,
            personel_adi: p.name,
            rol: p.role,
            verimlilik: p.efficiency_score || 75,
            gunluk_cikis: p.daily_avg_output || 100,
            haftalik_kapasite: Math.round((p.daily_avg_output || 100) * haftalikCalismaSayisi),
        }));

        return NextResponse.json({
            hafta_baslangic: pazartesi.toISOString().split('T')[0],
            hafta_bitis: pazar.toISOString().split('T')[0],
            hafta_numarasi: hafta,
            kapasite: {
                aktif_personel: aktifPersonelSayisi,
                haftalik_is_gunu: haftalikCalismaSayisi,
                gunluk_calisma_dk: gunlukCalisma,
                toplam_kapasite_dakika: toplamDakika,
                efektif_kapasite_dakika: efektifDakika,
                ort_oee_yuzde: Math.round(ortOEE * 10) / 10,
                tahmini_haftalik_uretim: tahminiHaftalikUretim,
                kullanilan_oee_kayit_sayisi: (oeeData || []).length,
            },
            personel_bazinda: personelKapasite.sort((a, b) => b.haftalik_kapasite - a.haftalik_kapasite),
            not: 'Kapasite tahmini son 30 gün OEE ortalamasına ve personel çıkış datalarına dayanır.',
        });
    } catch (err) {
        console.error('Kapasite tahmini hatası:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
