import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Belirli modeli getir
export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const model = db.prepare('SELECT * FROM models WHERE id = ?').get(id);
        if (!model) {
            return NextResponse.json({ error: 'Model bulunamadı' }, { status: 404 });
        }
        const operations = db.prepare(
            'SELECT * FROM operations WHERE model_id = ? ORDER BY order_number'
        ).all(id);
        return NextResponse.json({ ...model, operations });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Model güncelle + Audit Trail kaydı
export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        // 1. Önce mevcut kaydı al (eski değerler için)
        const oldModel = db.prepare('SELECT * FROM models WHERE id = ?').get(id);
        if (!oldModel) {
            return NextResponse.json({ error: 'Model bulunamadı' }, { status: 404 });
        }

        const {
            name, code, order_no, modelist, customer, description,
            fabric_type, sizes, size_range, total_order, total_order_text, completed_count,
            fason_price, fason_price_text, model_difficulty, measurement_table,
            delivery_date, work_start_date, post_sewing, status,
            garni, color_count, color_details, size_count, size_distribution, asorti,
            total_operations, piece_count, piece_count_details,
            op_kesim_count, op_kesim_details, op_dikim_count, op_dikim_details,
            op_utu_paket_count, op_utu_paket_details, op_nakis_count, op_nakis_details,
            op_yikama_count, op_yikama_details,
            has_lining, lining_pieces, has_interlining, interlining_parts, interlining_count,
            difficult_points, critical_points, customer_requests,
            changed_by
        } = body;

        // 2. Güncellemeyi yap
        db.prepare(`
      UPDATE models SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        order_no = COALESCE(?, order_no),
        modelist = COALESCE(?, modelist),
        customer = COALESCE(?, customer),
        description = COALESCE(?, description),
        fabric_type = COALESCE(?, fabric_type),
        sizes = COALESCE(?, sizes),
        size_range = COALESCE(?, size_range),
        total_order = COALESCE(?, total_order),
        total_order_text = COALESCE(?, total_order_text),
        completed_count = COALESCE(?, completed_count),
        fason_price = COALESCE(?, fason_price),
        fason_price_text = COALESCE(?, fason_price_text),
        model_difficulty = COALESCE(?, model_difficulty),
        measurement_table = COALESCE(?, measurement_table),
        delivery_date = COALESCE(?, delivery_date),
        work_start_date = COALESCE(?, work_start_date),
        post_sewing = COALESCE(?, post_sewing),
        status = COALESCE(?, status),
        garni = COALESCE(?, garni),
        color_count = COALESCE(?, color_count),
        color_details = COALESCE(?, color_details),
        size_count = COALESCE(?, size_count),
        size_distribution = COALESCE(?, size_distribution),
        asorti = COALESCE(?, asorti),
        total_operations = COALESCE(?, total_operations),
        piece_count = COALESCE(?, piece_count),
        piece_count_details = COALESCE(?, piece_count_details),
        op_kesim_count = COALESCE(?, op_kesim_count),
        op_kesim_details = COALESCE(?, op_kesim_details),
        op_dikim_count = COALESCE(?, op_dikim_count),
        op_dikim_details = COALESCE(?, op_dikim_details),
        op_utu_paket_count = COALESCE(?, op_utu_paket_count),
        op_utu_paket_details = COALESCE(?, op_utu_paket_details),
        op_nakis_count = COALESCE(?, op_nakis_count),
        op_nakis_details = COALESCE(?, op_nakis_details),
        op_yikama_count = COALESCE(?, op_yikama_count),
        op_yikama_details = COALESCE(?, op_yikama_details),
        has_lining = COALESCE(?, has_lining),
        lining_pieces = COALESCE(?, lining_pieces),
        has_interlining = COALESCE(?, has_interlining),
        interlining_parts = COALESCE(?, interlining_parts),
        interlining_count = COALESCE(?, interlining_count),
        difficult_points = COALESCE(?, difficult_points),
        critical_points = COALESCE(?, critical_points),
        customer_requests = COALESCE(?, customer_requests),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
            name, code, order_no, modelist, customer, description,
            fabric_type, sizes, size_range, total_order, total_order_text, completed_count,
            fason_price, fason_price_text, model_difficulty, measurement_table,
            delivery_date, work_start_date, post_sewing, status,
            garni, color_count, color_details, size_count, size_distribution, asorti,
            total_operations, piece_count, piece_count_details,
            op_kesim_count, op_kesim_details, op_dikim_count, op_dikim_details,
            op_utu_paket_count, op_utu_paket_details, op_nakis_count, op_nakis_details,
            op_yikama_count, op_yikama_details,
            has_lining, lining_pieces, has_interlining, interlining_parts, interlining_count,
            difficult_points, critical_points, customer_requests,
            id
        );

        // 3. Değişen alanları audit_trail'e kaydet (SİLİNEMEZ)
        const auditInsert = db.prepare(
            'INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)'
        );

        const fieldLabels = {
            name: 'Model Adı', code: 'Model Kodu', order_no: 'Sipariş No',
            modelist: 'Modelist', customer: 'Müşteri', description: 'Açıklama',
            fabric_type: 'Kumaş Tipi', sizes: 'Bedenler', size_range: 'Beden Aralığı',
            total_order: 'Sipariş Adeti', total_order_text: 'Sipariş Açıklaması',
            completed_count: 'Tamamlanan',
            fason_price: 'Fason Fiyatı', fason_price_text: 'Fason Fiyat Açıklaması',
            model_difficulty: 'Zorluk',
            measurement_table: 'Ölçü Tablosu',
            delivery_date: 'Sevk Tarihi', work_start_date: 'İşe Başlama',
            post_sewing: 'Dikimden Sonra', status: 'Durum',
            garni: 'Garni', color_count: 'Renk Sayısı', color_details: 'Renk Detayları',
            size_count: 'Beden Sayısı', size_distribution: 'Beden Dağılımı',
            asorti: 'Asorti', total_operations: 'Toplam Operasyon',
            piece_count: 'Parça Sayısı', piece_count_details: 'Parça Detayları',
            op_kesim_count: 'Kesim Op. Adedi', op_kesim_details: 'Kesim Op. Detayı',
            op_dikim_count: 'Dikim Op. Adedi', op_dikim_details: 'Dikim Op. Detayı',
            op_utu_paket_count: 'Ütü-Paket Op. Adedi', op_utu_paket_details: 'Ütü-Paket Op. Detayı',
            op_nakis_count: 'Nakış Op. Adedi', op_nakis_details: 'Nakış Op. Detayı',
            op_yikama_count: 'Yıkama Op. Adedi', op_yikama_details: 'Yıkama Op. Detayı',
            has_lining: 'Astar', lining_pieces: 'Astar Parça',
            has_interlining: 'Tela', interlining_parts: 'Tela Parçaları', interlining_count: 'Tela Parça Sayısı',
            difficult_points: 'Zor Noktalar', critical_points: 'Kritik Noktalar',
            customer_requests: 'Müşteri Talepleri'
        };

        // Her değişen alanı kaydet
        const fieldsToCheck = Object.keys(fieldLabels);
        const auditTransaction = db.transaction(() => {
            for (const field of fieldsToCheck) {
                const newVal = body[field];
                if (newVal !== undefined && newVal !== null) {
                    const oldVal = String(oldModel[field] || '');
                    const newValStr = String(newVal);
                    if (oldVal !== newValStr) {
                        auditInsert.run(
                            'models',
                            String(id),
                            fieldLabels[field] || field,
                            oldVal,
                            newValStr,
                            changed_by || 'admin'
                        );
                    }
                }
            }
        });
        auditTransaction();

        const model = db.prepare('SELECT * FROM models WHERE id = ?').get(id);
        return NextResponse.json(model);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Model sil (audit trail'e silme kaydı ekle)
export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;

        // Silmeden önce modeli kaydet
        const model = db.prepare('SELECT * FROM models WHERE id = ?').get(id);
        if (model) {
            db.prepare(
                'INSERT INTO audit_trail (table_name, record_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).run('models', String(id), 'SİLME İŞLEMİ', JSON.stringify(model), 'SİLİNDİ', 'admin');
        }

        db.prepare('DELETE FROM models WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
