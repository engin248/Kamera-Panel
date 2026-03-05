import { NextResponse } from 'next/server';
import { evaluateSalesRequest } from '@/lib/agents/satis-sefi';

export async function POST(req) {
    try {
        const body = await req.json();
        const { musteriAdi, musteriSkoru, urunAdi, adet, teklifEdilenFiyat, maliyetFiyati, odemeTipi, kargoFirmasi } = body;

        // Gerekli alanların kontrolü
        if (!musteriAdi || !urunAdi || !adet || !teklifEdilenFiyat || !maliyetFiyati) {
            return NextResponse.json(
                { success: false, error: 'Tüm alanlar (Müşteri, Ürün, Adet, Teklif, Maliyet) zorunludur.' },
                { status: 400 }
            );
        }

        // LangChain ajanına gönder
        const agentResponse = await evaluateSalesRequest(
            musteriAdi,
            musteriSkoru,
            urunAdi,
            Number(adet),
            Number(teklifEdilenFiyat),
            Number(maliyetFiyati),
            odemeTipi,
            kargoFirmasi
        );

        if (!agentResponse.success) {
            return NextResponse.json({ success: false, error: agentResponse.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            hafiza_kullanildi: agentResponse.hafiza_kullanildi,
            ajan_cevabi: agentResponse.ajan_cevabi
        });

    } catch (error) {
        console.error('Satış Şefi API Hatası:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası oluştu.' }, { status: 500 });
    }
}
