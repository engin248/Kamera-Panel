import { NextResponse } from "next/server";
import { analyzeOperationalTempo } from "../../../../lib/agents/kamera";

export async function POST(req) {
    try {
        const body = await req.json();
        const { gunlukUretimHedefi, gecerliUretimAdedi, calisanPersonelSayisi, calisilanSaat, aktifModel } = body;

        const result = await analyzeOperationalTempo({
            gunlukUretimHedefi: Number(gunlukUretimHedefi),
            gecerliUretimAdedi: Number(gecerliUretimAdedi),
            calisanPersonelSayisi: Number(calisanPersonelSayisi),
            calisilanSaat: Number(calisilanSaat || 1), // 0 division hatasını önle
            aktifModel: aktifModel || "Bilinmeyen Model",
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                uretimHizi: result.uretimHizi,
                tempoAcigi: result.tempoAcigi,
                mesaj: result.ajan_cevabi
            });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
