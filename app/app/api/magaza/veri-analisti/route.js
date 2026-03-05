import { NextResponse } from 'next/server';
import { analyzeStoreInventory } from '@/lib/agents/veri-analisti';

export async function POST(req) {
    try {
        const body = await req.json();
        const { modelId, modelAdi, raftaKalanGunSuresi } = body;

        // Gerekli alanların kontrolü
        if (!modelId || !modelAdi || raftaKalanGunSuresi === undefined) {
            return NextResponse.json(
                { success: false, error: 'Model bilgileri ve rafta kalma süresi zorunludur.' },
                { status: 400 }
            );
        }

        // LangChain analist ajanına gönder
        const agentResponse = await analyzeStoreInventory(
            modelId,
            modelAdi,
            Number(raftaKalanGunSuresi)
        );

        if (!agentResponse.success) {
            return NextResponse.json({ success: false, error: agentResponse.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            tehlike_sinifi: agentResponse.tehlike_sinifi,
            ajan_cevabi: agentResponse.ajan_cevabi
        });

    } catch (error) {
        console.error('Veri Analisti API Hatası:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası oluştu.' }, { status: 500 });
    }
}
