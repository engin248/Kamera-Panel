import { NextResponse } from 'next/server';
import { approveLogistics } from '@/lib/agents/lojistik-sefi';

export async function POST(req) {
    try {
        const body = await req.json();
        const { recete, depoStogu, modelMiktari } = body;

        if (!recete || !depoStogu || !modelMiktari) {
            return NextResponse.json(
                { success: false, error: 'Reçete, depo stoğu ve model miktarı bilgileri zorunludur.' },
                { status: 400 }
            );
        }

        const agentResponse = await approveLogistics(recete, depoStogu, modelMiktari);

        if (!agentResponse.success) {
            return NextResponse.json({ success: false, error: agentResponse.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            is_approved: agentResponse.is_approved,
            ajan_cevabi: agentResponse.ajan_cevabi
        });

    } catch (error) {
        console.error('Lojistik Ajan API Hatası:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası oluştu.' }, { status: 500 });
    }
}
