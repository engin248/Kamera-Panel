import { NextResponse } from 'next/server';
import { apiSaglikKontrol, kurulOyu } from '@/lib/ai-services';

/**
 * GET /api/ai-kurul/saglik
 * Tüm agent API'lerinin çalışıp çalışmadığını test eder.
 */
export async function GET() {
    try {
        const sonuclar = await apiSaglikKontrol();
        const hepsiCalisiyor = Object.values(sonuclar).every(s => s.durum?.startsWith('✅'));

        return NextResponse.json({
            genel: hepsiCalisiyor ? '✅ Tüm agentlar çalışıyor' : '⚠️ Bazı agentlarda sorun var',
            agentlar: sonuclar,
            zaman: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/ai-kurul/saglik
 * Yönetim kuruluna soru sor — hepsinden aynı anda cevap al.
 * Body: { soru: string, baglam?: string }
 */
export async function POST(request) {
    try {
        const { soru, baglam } = await request.json();

        if (!soru) {
            return NextResponse.json({ error: 'soru alanı zorunlu' }, { status: 400 });
        }

        const sonuclar = await kurulOyu(soru, baglam);

        return NextResponse.json({
            soru,
            cevaplar: {
                'Robot 1 (GPT)': sonuclar.gpt,
                'Robot 2 (DeepSeek)': sonuclar.deepseek,
                'Robot 3 (Gemini)': sonuclar.gemini,
                'Perplexity': sonuclar.perplexity?.text ?? sonuclar.perplexity,
                'Kaynaklar': sonuclar.perplexity?.citations ?? [],
            },
            zaman: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
