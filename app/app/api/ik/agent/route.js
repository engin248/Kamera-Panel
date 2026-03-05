import { NextResponse } from 'next/server';
import { evaluatePersonnelPerformance } from '@/lib/agents/ik-adalet';

export async function POST(req) {
    try {
        const body = await req.json();
        const { personelAdi, operasyonAdi, hedeflenenAdet, uretilenAdet, hataliAdet, kumasCinsi } = body;

        if (!personelAdi || !operasyonAdi || typeof hedeflenenAdet !== 'number' || typeof uretilenAdet !== 'number' || typeof hataliAdet !== 'number' || !kumasCinsi) {
            return NextResponse.json(
                { success: false, error: 'Tüm alanlar (personelAdi, operasyonAdi, hedeflenenAdet, uretilenAdet, hataliAdet, kumasCinsi) eksiksiz ve doğru formatta gönderilmelidir.' },
                { status: 400 }
            );
        }

        const agentResponse = await evaluatePersonnelPerformance(personelAdi, operasyonAdi, hedeflenenAdet, uretilenAdet, hataliAdet, kumasCinsi);

        if (!agentResponse.success) {
            return NextResponse.json({ success: false, error: agentResponse.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            hafiza_kullanildi: agentResponse.hafiza_kullanildi,
            performans_metrikleri: agentResponse.performans_metrikleri,
            ajan_cevabi: agentResponse.ajan_cevabi
        });

    } catch (error) {
        console.error('İK Ajan API Hatası:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası oluştu.' }, { status: 500 });
    }
}
