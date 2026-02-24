import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const archived = searchParams.get('archived') === '1';
        const whereClause = archived ? 'WHERE o.deleted_at IS NOT NULL' : 'WHERE o.deleted_at IS NULL';
        const orders = db.prepare(`
      SELECT o.*, c.name as c_name, c.company as c_company, m.name as m_name, m.code as m_code
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN models m ON o.model_id = m.id
      ${whereClause}
      ORDER BY 
        CASE o.priority WHEN 'acil' THEN 1 WHEN 'yuksek' THEN 2 WHEN 'normal' THEN 3 WHEN 'dusuk' THEN 4 END,
        o.created_at DESC
    `).all();
        return NextResponse.json(orders);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();

        const count = db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt;
        const orderNo = body.order_no || `SIP-${String(count + 1).padStart(4, '0')}`;
        const totalPrice = (parseFloat(body.quantity) || 0) * (parseFloat(body.unit_price) || 0);

        const result = db.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, model_id, model_name, quantity, unit_price, total_price, delivery_date, priority, fabric_type, color, sizes, notes, status, product_image, model_description, size_distribution, color_details, accessories, lining_info, packaging, label_info, washing_instructions, sample_status, quality_criteria, stitch_details, delivery_method, special_requests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            orderNo,
            body.customer_id || null,
            body.customer_name || '',
            body.model_id || null,
            body.model_name || '',
            parseInt(body.quantity) || 0,
            parseFloat(body.unit_price) || 0,
            totalPrice,
            body.delivery_date || null,
            body.priority || 'normal',
            body.fabric_type || '',
            body.color || '',
            body.sizes || '',
            body.notes || '',
            body.status || 'siparis_alindi',
            body.product_image || '',
            body.model_description || '',
            body.size_distribution || '',
            body.color_details || '',
            body.accessories || '',
            body.lining_info || '',
            body.packaging || '',
            body.label_info || '',
            body.washing_instructions || '',
            body.sample_status || 'yok',
            body.quality_criteria || '',
            body.stitch_details || '',
            body.delivery_method || '',
            body.special_requests || ''
        );

        return NextResponse.json({ id: result.lastInsertRowid, order_no: orderNo });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
