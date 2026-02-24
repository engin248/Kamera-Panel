import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Tüm modelleri getir
export async function GET() {
    try {
        const db = getDb();
        const models = db.prepare(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM operations WHERE model_id = m.id) as operation_count
      FROM models m 
      ORDER BY m.created_at DESC
    `).all();
        return NextResponse.json(models);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni model ekle
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const {
            name, code, order_no, modelist, customer, description,
            fabric_type, sizes, size_range, total_order, total_order_text,
            fason_price, fason_price_text, model_difficulty,
            front_image, back_image, measurement_table,
            delivery_date, work_start_date, post_sewing,
            garni, color_count, color_details, size_count, size_distribution, asorti,
            total_operations, piece_count, piece_count_details,
            op_kesim_count, op_kesim_details, op_dikim_count, op_dikim_details,
            op_utu_paket_count, op_utu_paket_details, op_nakis_count, op_nakis_details,
            op_yikama_count, op_yikama_details,
            has_lining, lining_pieces, has_interlining, interlining_parts, interlining_count,
            difficult_points, critical_points, customer_requests
        } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Model adı ve kodu zorunlu' }, { status: 400 });
        }

        const result = db.prepare(`
      INSERT INTO models (
        name, code, order_no, modelist, customer, description,
        fabric_type, sizes, size_range, total_order, total_order_text, fason_price, fason_price_text, model_difficulty,
        front_image, back_image, measurement_table, delivery_date, work_start_date, post_sewing,
        garni, color_count, color_details, size_count, size_distribution, asorti,
        total_operations, piece_count, piece_count_details,
        op_kesim_count, op_kesim_details, op_dikim_count, op_dikim_details,
        op_utu_paket_count, op_utu_paket_details, op_nakis_count, op_nakis_details,
        op_yikama_count, op_yikama_details,
        has_lining, lining_pieces, has_interlining, interlining_parts, interlining_count,
        difficult_points, critical_points, customer_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            name, code, order_no || '', modelist || '', customer || '',
            description || '', fabric_type || '', sizes || '', size_range || '',
            total_order || 0, total_order_text || '', fason_price || 0, fason_price_text || '', model_difficulty || 5,
            front_image || '', back_image || '',
            measurement_table || '', delivery_date || '', work_start_date || '', post_sewing || '',
            garni || '', color_count || 0, color_details || '', size_count || 0, size_distribution || '', asorti || '',
            total_operations || 0, piece_count || 0, piece_count_details || '',
            op_kesim_count || 0, op_kesim_details || '', op_dikim_count || 0, op_dikim_details || '',
            op_utu_paket_count || 0, op_utu_paket_details || '', op_nakis_count || 0, op_nakis_details || '',
            op_yikama_count || 0, op_yikama_details || '',
            has_lining || 0, lining_pieces || 0, has_interlining || 0, interlining_parts || '', interlining_count || 0,
            difficult_points || '', critical_points || '', customer_requests || ''
        );

        const model = db.prepare('SELECT * FROM models WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(model, { status: 201 });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return NextResponse.json({ error: 'Bu model kodu zaten var' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
