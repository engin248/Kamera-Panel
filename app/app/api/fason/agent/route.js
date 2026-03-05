import { NextResponse } from 'next/server';
import { evaluateSubcontractor, reportSubcontractorLoss } from '@/lib/agents/fason';

export async function POST(req) {
    try {
        const body = await req.json();
        const { action } = body;

        // Eylem: Raporlama (Gelen Malı Teslim Alma - Fire Kaydı)
        if (action === 'report') {
            const { fasoncuAd, modelAd, gidenAdet, gelenAdet, fireAdet, kumasCinsi, kaliteNotu } = body;

            if (!fasoncuAd || !modelAd || typeof gidenAdet !== 'number' || typeof gelenAdet !== 'number' || typeof fireAdet !== 'number') {
                return NextResponse.json({ success: false, error: 'Tüm raporlama alanları zorunludur.' }, { status: 400 });
            }

            const agentResponse = await reportSubcontractorLoss(fasoncuAd, modelAd, gidenAdet, gelenAdet, fireAdet, kumasCinsi, kaliteNotu);
            if (!agentResponse.success) return NextResponse.json({ success: false, error: agentResponse.error }, { status: 500 });

            return NextResponse.json({
                success: true,
                ajan_cevabi: agentResponse.ajan_cevabi
            });
        }

        // Varsayılan Eylem: Risk Analizi (Göndermeden Önce Değerlendirme)
        const { islemTipi, kumasCinsi, secilenFasoncu } = body;

        if (!islemTipi || !kumasCinsi) {
            return NextResponse.json(
                { success: false, error: 'İşlem tipi ve kumaş cinsi zorunludur.' },
                { status: 400 }
            );
        }

        const agentResponse = await evaluateSubcontractor(islemTipi, kumasCinsi, secilenFasoncu);

        if (!agentResponse.success) {
            return NextResponse.json({ success: false, error: agentResponse.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            hafiza_kullanildi: agentResponse.hafiza_kullanildi,
            ajan_cevabi: agentResponse.ajan_cevabi
        });

    } catch (error) {
        console.error('Fason Ajan API Hatası:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası oluştu.' }, { status: 500 });
    }
}
