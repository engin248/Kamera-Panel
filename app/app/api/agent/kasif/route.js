import { NextResponse } from "next/server";
import { analyzeMarketTrend } from "../../../../lib/agents/kasif";

export async function POST(req) {
    try {
        const body = await req.json();
        const { urunTipi, kumasCinsi, hedefKitle, sezon } = body;

        const result = await analyzeMarketTrend({
            urunTipi: urunTipi || "Belirtilmedi",
            kumasCinsi: kumasCinsi || "Belirtilmedi",
            hedefKitle: hedefKitle || "Genel Müşteri Kitlesi",
            sezon: sezon || "Sonraki Sezon",
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                mesaj: result.ajan_cevabi
            });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
