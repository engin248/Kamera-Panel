import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — Fire Kayıtları Listesi
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const model_id = searchParams.get('model_id');

        let query = supabaseAdmin
            .from('fire_kayitlari')
            .select('*, models(name, code)')
            .order('created_at', { ascending: false });

        if (model_id) query = query.eq('model_id', parseInt(model_id));

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Fire kaydı oluşturur, safha maliyeti hesaplar ve cost_entries'e yazar
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            model_id, kumas_tipi, fire_metre, kullanilan_metre,
            fire_yuzde, fire_nedeni, fire_safhasi, estimated_loss_amount, operator_id, tarih
        } = body;

        if (!model_id || fire_metre === undefined || estimated_loss_amount === undefined || estimated_loss_amount <= 0) {
            return NextResponse.json({ error: 'model_id, fire_metre ve ZARAR (₺) tutarı girilmesi zorunludur!' }, { status: 400 });
        }

        // ÖRNEK MALİYET ÇARPAN UYGULAMASI (Kaba Tahmin)
        // Eğer clientten kesinTL değeri geldiyse onu kullan.
        const finalLossAmount = parseFloat(estimated_loss_amount || 0);

        // 1. Fire Tablosuna Kayıt
        const { data: fireData, error: fireError } = await supabaseAdmin
            .from('fire_kayitlari')
            .insert({
                model_id: parseInt(model_id),
                kumas_tipi: kumas_tipi || '',
                fire_metre: parseFloat(fire_metre),
                kullanilan_metre: parseFloat(kullanilan_metre || 0),
                fire_yuzde: parseFloat(fire_yuzde || 0),
                fire_nedeni: fire_nedeni || '',
                wasted_at_phase: fire_safhasi || 'kesim',
                estimated_loss_amount: finalLossAmount,
                operator_id: operator_id ? parseInt(operator_id) : null,
                tarih: tarih || new Date().toISOString()
            })
            .select()
            .single();

        if (fireError) throw fireError;

        // 2. Maliyet Tablosuna Zarar (Zayiat) Olarak Yansıtma
        if (finalLossAmount > 0) {
            await supabaseAdmin.from('cost_entries').insert({
                model_id: parseInt(model_id),
                category: 'fire',
                description: `${fire_safhasi.toUpperCase()} Safhasında Çıkan Fire — Neden: ${fire_nedeni} (TL ZARAR)`,
                amount: finalLossAmount,
                unit: 'piece',
                quantity: 1,
                total: finalLossAmount,
            });
        }

        return NextResponse.json(fireData, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
