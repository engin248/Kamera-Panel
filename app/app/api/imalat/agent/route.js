import { NextResponse } from "next/server";
import { analyzeModelRisk } from "../../../../lib/agents/tekniker";

export async function POST(req) {
    try {
        const body = await req.json();
        const { kumasCinsi, hedeflenenFasonKari, modelTipi } = body;

        if (!kumasCinsi || !modelTipi) {
            return NextResponse.json(
                { success: false, error: "Eksik parametre (kumasCinsi, modelTipi zorunlu)." },
                { status: 400 }
            );
        }

        // Tekniker Ajanına (LangChain'e) bağlanan modül
        const result = await analyzeModelRisk(kumasCinsi, hedeflenenFasonKari || 15, modelTipi);

        if (result.success) {
            return NextResponse.json({
                success: true,
                hafizaKullanildi: result.hafiza_kullanildi,
                mesaj: result.ajan_cevabi
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }
    } catch (err) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
