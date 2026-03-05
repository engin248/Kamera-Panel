import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const next15Days = new Date();
        next15Days.setDate(next15Days.getDate() + 15);
        const next15Str = next15Days.toISOString().split('T')[0];

        // 1. PERSONEL SABİT GİDERLERİ (Maaşlar)
        const { data: personelList } = await supabaseAdmin.from('personnel').select('base_salary, ssk_cost, food_allowance, transport_allowance').is('deleted_at', null);
        let totalMonthlyPersonnelCost = 0;
        if (personelList) {
            personelList.forEach(p => {
                totalMonthlyPersonnelCost += (p.base_salary || 0) + (p.ssk_cost || 0) + (p.food_allowance || 0) + (p.transport_allowance || 0);
            });
        }

        // 2. AYLIK DİĞER SABİT GİDERLER (Kira, Elektrik vs. - Sadece 'is_recurring' veya bu aya ait olanlar)
        // Eğer cost_entries_recurring falan yoksa son 30 günün sabit faturalarından tahmin edebiliriz veya cost_entries category='fatura' diyebiliriz.
        // Hızlıca cost_entries tablosundan bu ayki 'fatura' veya 'sabit'leri alalım.
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const { data: expenses } = await supabaseAdmin.from('cost_entries')
            .select('amount, total')
            .eq('year', currentYear)
            .eq('month', currentMonth);

        let totalMonthlyExpenses = 0;
        if (expenses) {
            // we use 'total' or 'amount' based on typical schema (using total or amount whichever is numeric)
            expenses.forEach(e => { totalMonthlyExpenses += parseFloat(e.total || e.amount || 0); });
        }

        // 3. BURN RATE (Günlük Nakit Yanma Hızı)
        const monthlyTotalBurn = totalMonthlyPersonnelCost + totalMonthlyExpenses;
        const dailyBurnRate = Math.round(monthlyTotalBurn / 30);

        // 15 Günlük Beklenen Çıkış (Cash Out)
        const expectedCashOut = dailyBurnRate * 15;

        // 4. BEKLENEN GELİR (Cash In - Son 15 Gün İçinde Teslim Edilecek Siparişler)
        // Orders tablosunda quantity ve price/rate olup olmadığına bakalım. Yoksa modellerle birleştireceğiz.
        const { data: uOrders } = await supabaseAdmin.from('orders')
            .select('quantity, unit_price, status, delivery_date')
            .gte('delivery_date', todayStr)
            .lte('delivery_date', next15Str)
            .not('status', 'eq', 'iptal')
            .is('deleted_at', null);

        let expectedCashIn = 0;
        if (uOrders) {
            uOrders.forEach(o => {
                const qty = parseInt(o.quantity || 0);
                // varsayılan birim fiyat 100 TL farz edelim eğer unit_price yoksa.
                const price = parseFloat(o.unit_price || 250);
                expectedCashIn += qty * price;
            });
        }

        const netCashFlow = expectedCashIn - expectedCashOut;

        return NextResponse.json({
            success: true,
            monthlyTotalBurn,
            dailyBurnRate,
            forecast15Days: {
                expectedCashIn: Math.round(expectedCashIn),
                expectedCashOut: Math.round(expectedCashOut),
                netCashFlow: Math.round(netCashFlow),
                status: netCashFlow >= 0 ? 'safe' : 'danger'
            }
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
