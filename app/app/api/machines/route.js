import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// Geçerli kolon whitelist — Supabase'deki sütunlarla eşleşmeli
// ============================================================
const VALID_COLUMNS = new Set([
    'name', 'type', 'brand', 'model_name', 'serial_no',
    'sub_type', 'count', 'category', 'location',
    'purchase_date', 'last_maintenance', 'next_maintenance',
    'notes', 'status',
]);

function filterValidColumns(data) {
    const filtered = {};
    for (const [key, value] of Object.entries(data)) {
        if (VALID_COLUMNS.has(key)) {
            filtered[key] = value;
        }
    }
    return filtered;
}

// ============================================================
// GET — Tüm makineleri getir
// ============================================================
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('machines')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Machines GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST — Yeni makine ekle
// ============================================================
export async function POST(request) {
    try {
        const body = await request.json();

        if (!body.name || !body.type) {
            return NextResponse.json(
                { error: 'Makine adı ve tipi zorunlu' },
                { status: 400 }
            );
        }

        const insertData = filterValidColumns(body);

        // count integer olmalı
        if (insertData.count !== undefined) {
            insertData.count = parseInt(insertData.count) || 1;
        }

        // Boş string tarihleri null yap (PostgreSQL DATE tipi boş string kabul etmez)
        for (const dateField of ['purchase_date', 'last_maintenance', 'next_maintenance']) {
            if (insertData[dateField] === '') insertData[dateField] = null;
        }

        const { data, error } = await supabaseAdmin
            .from('machines')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Machines POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
