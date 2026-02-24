import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — Modele ait tüm işlemleri getir
export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const operations = db.prepare(
            'SELECT * FROM operations WHERE model_id = ? ORDER BY order_number'
        ).all(id);
        return NextResponse.json(operations);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni işlem ekle
export async function POST(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const {
            order_number, name, description, difficulty,
            machine_type, thread_material, needle_type,
            tension_setting, speed_setting,
            quality_notes, quality_tolerance, error_examples,
            standard_time_min, standard_time_max, unit_price,
            dependency, written_instructions,
            how_to_do, stitch_per_cm, video_path, audio_path,
            correct_photo_path, incorrect_photo_path, optical_appearance,
            required_skill_level, operation_category
        } = body;

        if (!name || !order_number) {
            return NextResponse.json({ error: 'İşlem adı ve sıra numarası zorunlu' }, { status: 400 });
        }

        const result = db.prepare(`
      INSERT INTO operations (
        model_id, order_number, name, description, difficulty,
        machine_type, thread_material, needle_type, tension_setting, speed_setting,
        quality_notes, quality_tolerance, error_examples,
        standard_time_min, standard_time_max, unit_price,
        dependency, written_instructions,
        how_to_do, stitch_per_cm, video_path, audio_path,
        correct_photo_path, incorrect_photo_path, optical_appearance,
        required_skill_level, operation_category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id, order_number, name, description || '',
            difficulty || 5, machine_type || '', thread_material || '',
            needle_type || '', tension_setting || '', speed_setting || '',
            quality_notes || '', quality_tolerance || '', error_examples || '',
            standard_time_min || null, standard_time_max || null, unit_price || 0,
            dependency || '', written_instructions || '',
            how_to_do || '', stitch_per_cm || '',
            video_path || null, audio_path || null,
            correct_photo_path || null, incorrect_photo_path || null,
            optical_appearance || '',
            required_skill_level || '3_sinif', operation_category || 'dikim'
        );

        const operation = db.prepare('SELECT * FROM operations WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json(operation, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — İşlem güncelle (medya dosyaları ekleme dahil)
export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const opId = body.operation_id;

        if (!opId) {
            return NextResponse.json({ error: 'operation_id zorunlu' }, { status: 400 });
        }

        // Sadece gelen alanları güncelle
        const updates = [];
        const values = [];
        const fields = [
            'name', 'description', 'difficulty', 'machine_type', 'thread_material',
            'needle_type', 'tension_setting', 'speed_setting', 'quality_notes',
            'quality_tolerance', 'error_examples', 'standard_time_min', 'standard_time_max',
            'unit_price', 'dependency', 'written_instructions', 'how_to_do',
            'stitch_per_cm', 'video_path', 'audio_path', 'order_number',
            'correct_photo_path', 'incorrect_photo_path', 'optical_appearance',
            'required_skill_level', 'operation_category'
        ];

        for (const field of fields) {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(body[field]);
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'Güncellenecek alan bulunamadı' }, { status: 400 });
        }

        values.push(opId, id);
        db.prepare(`UPDATE operations SET ${updates.join(', ')} WHERE id = ? AND model_id = ?`).run(...values);

        const operation = db.prepare('SELECT * FROM operations WHERE id = ?').get(opId);
        return NextResponse.json(operation);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

