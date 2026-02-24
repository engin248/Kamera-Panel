import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Klasörleri oluştur
['videos', 'audios', 'photos', 'correct_photos', 'incorrect_photos'].forEach(sub => {
    const dir = path.join(UPLOADS_DIR, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Türkçe karakterleri güvenli dosya adına çevir
function safeName(str) {
    if (!str) return '';
    return str
        .replace(/ç/gi, 'c').replace(/ğ/gi, 'g').replace(/ı/gi, 'i')
        .replace(/ö/gi, 'o').replace(/ş/gi, 's').replace(/ü/gi, 'u')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 40);
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const fileType = formData.get('type') || 'videos'; // videos | audios | photos | correct_photos | incorrect_photos
        const modelId = formData.get('model_id') || 'unknown';
        const modelCode = formData.get('model_code') || '';
        const operationId = formData.get('operation_id') || 'new';
        const operationName = formData.get('operation_name') || '';
        const operationNo = formData.get('operation_no') || '';

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
        }

        // Dosya boyut kontrolü (max 500MB)
        const MAX_SIZE = 500 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'Dosya boyutu çok büyük (max 500MB)' }, { status: 400 });
        }

        const ext = path.extname(file.name).toLowerCase();
        const allowedVideo = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.3gp'];
        const allowedAudio = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm'];
        const allowedPhoto = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

        let allowed;
        if (fileType === 'videos') allowed = allowedVideo;
        else if (fileType === 'audios') allowed = allowedAudio;
        else allowed = allowedPhoto;

        if (!allowed.includes(ext)) {
            return NextResponse.json({ error: `Geçersiz dosya formatı. İzin verilen: ${allowed.join(', ')}` }, { status: 400 });
        }

        // Standart dosya isimlendirme: [ModelKodu]_[İşlemNo]_[İşlemAdı]_[Tarih].[ext]
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        let fileName;
        if (modelCode && operationNo) {
            const safeOpName = safeName(operationName);
            fileName = `${safeName(modelCode)}_${String(operationNo).padStart(2, '0')}_${safeOpName}_${dateStr}${ext}`;
        } else {
            fileName = `model${modelId}_op${operationId}_${Date.now()}${ext}`;
        }

        // Aynı isimde dosya varsa numara ekle
        const targetDir = path.join(UPLOADS_DIR, fileType);
        let finalName = fileName;
        let counter = 1;
        while (fs.existsSync(path.join(targetDir, finalName))) {
            const base = fileName.replace(ext, '');
            finalName = `${base}_${counter}${ext}`;
            counter++;
        }

        const filePath = path.join(targetDir, finalName);
        const bytes = await file.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(bytes));

        const publicUrl = `/uploads/${fileType}/${finalName}`;

        return NextResponse.json({
            success: true,
            filename: finalName,
            url: publicUrl,
            size: file.size,
            type: fileType,
            originalName: file.name
        }, { status: 201 });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Dosya silme
export async function DELETE(request) {
    try {
        const { url: fileUrl } = await request.json();
        if (!fileUrl) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });

        const relativePath = fileUrl.replace(/^\/uploads\//, '');
        if (relativePath.includes('..')) {
            return NextResponse.json({ error: 'Geçersiz yol' }, { status: 400 });
        }

        const fullPath = path.join(UPLOADS_DIR, relativePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
