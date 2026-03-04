import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// NOT: business_expenses tablosu Supabase'de mevcut
// isletme_giderleri → business_expenses (Supabase şemasındaki isim)
// Kolon eşleştirmesi: ay→month, yil→year, elektrik/su/kira... → category+amount kombinasyonu
// 
// Bu API'yi business_expenses tablosuyla uyumlu yapıyoruz.
// Supabase şema: category, description, amount, year, month, is_recurring
// ============================================================

// ============================================================
// GET — İşletme giderlerini ay/yıl bazında getir
// ============================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('yil') || searchParams.get('year')) || new Date().getFullYear();
        const month = searchParams.get('ay') || searchParams.get('month');

        let query = supabaseAdmin
            .from('business_expenses')
            .select('*')
            .is('deleted_at', null)
            .eq('year', year)
            .order('month', { ascending: false })
            .order('category', { ascending: true });

        if (month) {
            query = query.eq('month', parseInt(month));
        } else {
            query = query.limit(50);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Isletme-gider GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni işletme gideri ekle (upsert mantığı ile)
// Destekler: hem tekil kayıt hem de aylık toplam gönderimi
// ============================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { ay, yil, year, month, category, description, amount, is_recurring,
            // Eski API uyumlu alanlar:
            elektrik, su, kira, yakit, diger,
            toplam_calisma_saati, toplam_personel_maliyeti
        } = body;

        const finalYear = yil || year || new Date().getFullYear();
        const finalMonth = ay || month;

        if (!finalMonth || !finalYear) {
            return NextResponse.json({ error: 'Ay ve yıl gerekli' }, { status: 400 });
        }

        // Eski API: elektrik, su, kira vb. tek kayıtta gönderiliyorsa toplu insert
        if (elektrik !== undefined || su !== undefined || kira !== undefined) {
            const entries = [];
            if (elektrik) entries.push({ category: 'Elektrik', amount: parseFloat(elektrik) });
            if (su) entries.push({ category: 'Su', amount: parseFloat(su) });
            if (kira) entries.push({ category: 'Kira', amount: parseFloat(kira) });
            if (yakit) entries.push({ category: 'Yakıt', amount: parseFloat(yakit) });
            if (diger) entries.push({ category: 'Diğer', amount: parseFloat(diger) });
            if (toplam_personel_maliyeti) entries.push({ category: 'Personel Maliyeti', amount: parseFloat(toplam_personel_maliyeti) });

            // Her kategori için upsert (aynı ay-yıl-kategori varsa güncelle)
            const inserts = entries.map(e => ({
                category: e.category,
                description: '',
                amount: e.amount,
                year: parseInt(finalYear),
                month: parseInt(finalMonth),
                is_recurring: false,
            }));

            // Önce bu ay-yıl-kategori kombinasyonlarını sil, sonra yeniden ekle
            for (const e of inserts) {
                await supabaseAdmin
                    .from('business_expenses')
                    .delete()
                    .eq('category', e.category)
                    .eq('year', e.year)
                    .eq('month', e.month);
            }
            const { data, error } = await supabaseAdmin
                .from('business_expenses')
                .insert(inserts)
                .select();

            if (error) throw error;

            const saatlik = toplam_calisma_saati > 0
                ? inserts.reduce((s, e) => s + e.amount, 0) / toplam_calisma_saati
                : 0;

            return NextResponse.json({ success: true, saatlik_maliyet: saatlik.toFixed(2), data });
        }

        // Tekil kayıt
        if (!category || !amount) {
            return NextResponse.json({ error: 'Kategori ve tutar zorunlu' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('business_expenses')
            .insert({
                category,
                description: description || '',
                amount: parseFloat(amount),
                year: parseInt(finalYear),
                month: parseInt(finalMonth),
                is_recurring: is_recurring || false,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Isletme-gider POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// PUT — Gider güncelle
// ============================================================
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, category, description, amount, is_recurring } = body;

        if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });

        const updateData = {};
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (is_recurring !== undefined) updateData.is_recurring = is_recurring;

        const { data, error } = await supabaseAdmin
            .from('business_expenses')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Isletme-gider PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// DELETE — Soft delete
// ============================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });

        const { data: expense, error: fetchErr } = await supabaseAdmin
            .from('business_expenses')
            .select('id')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchErr || !expense) {
            return NextResponse.json({ error: 'Gider bulunamadı' }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from('business_expenses')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: 'Koordinatör',
            })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Gider silindi (geri alınabilir)' });
    } catch (error) {
        console.error('Isletme-gider DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
