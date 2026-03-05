import { NextResponse } from 'next/server';
import { analyzePrototypeRisks } from '@/lib/agents/prototip-lab';

export async function POST(req) {
    try {
        const body = await req.json();
        const { kumasCinsi, yikamaTipi, modelTipi } = body;

        if (!kumasCinsi || !yikamaTipi || !modelTipi) {
            return NextResponse.json(
                { success: false, error: 'Kumaş cinsi, yıkama tipi ve model tipi zorunludur.' },
                { status: 400 }
            );
        }

        const agentResponse = await analyzePrototypeRisks(kumasCinsi, yikamaTipi, modelTipi);

        if (!agentResponse.success) {
            return NextResponse.json({ success: false, error: agentResponse.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            hafiza_kullanildi: agentResponse.hafiza_kullanildi,
            ajan_cevabi: agentResponse.ajan_cevabi
        });

    } catch (error) {
        console.error('Prototip Lab Ajan API Hatası:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası oluştu.' }, { status: 500 });
    }
}
