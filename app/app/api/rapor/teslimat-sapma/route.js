import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/rapor/teslimat-sapma?ay=3&yil=2026
 * ✅ GÖREV 8: Teslimat Sapma Raporu
 * Tamamlanan siparişlerin delivery_date vs tamamlanma tarihi farkını hesaplar
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

        // Tamamlanan siparişleri çek
        const { data: siparisler, error } = await supabaseAdmin
            .from('orders')
            .select('id, order_no, customer_name, model_name, quantity, delivery_date, updated_at, status')
            .is('deleted_at', null)
            .in('status', ['tamamlandi', 'teslim_edildi'])
            .gte('updated_at', `${baslangic}T00:00:00Z`)
            .lt('updated_at', `${bitis}T00:00:00Z`)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const liste = (siparisler || []).map(s => {
            const deliveryDate = s.delivery_date ? new Date(s.delivery_date) : null;
            const tamamlanmaDate = s.updated_at ? new Date(s.updated_at) : null;

            let gecikme_gun = null;
            let durum = 'bilinmiyor';

            if (deliveryDate && tamamlanmaDate) {
                // Pozitif = gecikme, Negatif = erken teslim
                gecikme_gun = Math.round((tamamlanmaDate - deliveryDate) / (1000 * 60 * 60 * 24));
                durum = gecikme_gun > 0 ? 'gecikti' : gecikme_gun === 0 ? 'zamaninda' : 'erken';
            }

            return {
                siparis_id: s.id,
                siparis_no: s.order_no,
                musteri: s.customer_name,
                model: s.model_name,
                adet: s.quantity,
                teslim_tarihi: s.delivery_date,
                tamamlanma_tarihi: s.updated_at?.split('T')[0],
                gecikme_gun,
                durum,
            };
        });

        // İstatistikler
        const gecikmisList = liste.filter(s => s.durum === 'gecikti');
        const zamanindaList = liste.filter(s => s.durum === 'zamaninda');
        const erkenList = liste.filter(s => s.durum === 'erken');
        const bilinmiyor = liste.filter(s => s.durum === 'bilinmiyor');

        const toplamGecikme = gecikmisList.reduce((t, s) => t + (s.gecikme_gun || 0), 0);
        const ortGecikme = gecikmisList.length > 0
            ? Math.round(toplamGecikme / gecikmisList.length)
            : 0;

        const zamanindaYuzde = liste.length > 0
            ? Math.round(((zamanindaList.length + erkenList.length) / liste.length) * 100)
            : 100;

        return NextResponse.json({
            ay, yil,
            ozet: {
                toplam_siparis: liste.length,
                zamaninda: zamanindaList.length + erkenList.length,
                gecikti: gecikmisList.length,
                erken: erkenList.length,
                bilinmiyor: bilinmiyor.length,
                zamaninda_yuzde: zamanindaYuzde,
                ortalama_gecikme_gun: ortGecikme,
                max_gecikme_gun: gecikmisList.length > 0
                    ? Math.max(...gecikmisList.map(s => s.gecikme_gun || 0))
                    : 0,
            },
            geciken_liste: gecikmisList.sort((a, b) => (b.gecikme_gun || 0) - (a.gecikme_gun || 0)),
            tum_liste: liste,
        });
    } catch (err) {
        console.error('Teslimat sapma raporu hatası:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
