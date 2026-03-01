import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import OpenAI from 'openai';

// ====================================================
// /api/model-vision — GPT-4o ile Teknik Dosya Okuma
// POST: Fotoğraf base64 gönder → Model bilgisi döner
// ====================================================

export async function POST(request) {
    try {
        const body = await request.json();
        const { image_base64, image_url } = body;

        if (!image_base64 && !image_url) {
            return NextResponse.json({ error: 'Fotoğraf gerekli' }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const imageContent = image_base64
            ? { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
            : { type: 'image_url', image_url: { url: image_url } };

        const prompt = `Bu bir tekstil üretim teknik föy dosyasının fotoğrafıdır. 
Lütfen bu görselden aşağıdaki bilgileri çıkar ve JSON formatında ver:

{
  "model_adi": "modelin adı veya kodu",
  "bedenler": ["S", "M", "L", "XL"],
  "renkler": ["Siyah", "Beyaz"],
  "toplam_adet": 0,
  "parca_sayisi": 0,
  "parca_listesi": ["Ön beden", "Arka beden", "Sol kol"],
  "islemler": [
    {"sira": 1, "islem_adi": "Yaka çatımı", "makine": "Overlok", "zorluk": 3},
    {"sira": 2, "islem_adi": "Omuz dikişi", "makine": "Düz makina", "zorluk": 2}
  ],
  "aksesuarlar": ["Düğme", "Fermuar", "Etiket"],
  "kumas_tipi": "örneğin Pamuk, Polyester",
  "ozel_notlar": "varsa özel noktalar"
}

Eğer bir alanı görselde bulamazsan boş bırak veya 0 yaz.
Sadece JSON döndür, başka açıklama yazma.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    imageContent
                ]
            }],
            max_tokens: 1500,
            temperature: 0.2
        });

        const content = response.choices[0]?.message?.content || '';

        // JSON parse et
        let parsed = {};
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        } catch {
            parsed = { raw: content };
        }

        return NextResponse.json({
            success: true,
            data: parsed,
            raw: content
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
