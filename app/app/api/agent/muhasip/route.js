import { NextResponse } from "next/server";
import { analyzeFinancialRisk } from "../../../../lib/agents/muhasip";

export async function POST(req) {
    try {
        const body = await req.json();
        const { fasonFiyat, gunlukUretimAdedi, personelToplamMaliyet, digerGiderler } = body;

        if (!fasonFiyat || !gunlukUretimAdedi || !personelToplamMaliyet) {
            return NextResponse.json(
                { success: false, error: "Eksik parametre (fasonFiyat, gunlukUretimAdedi, personelToplamMaliyet zorunludur)." },
                { status: 400 }
            );
        }

        const result = await analyzeFinancialRisk({
            fasonFiyat: Number(fasonFiyat),
            gunlukUretimAdedi: Number(gunlukUretimAdedi),
            personelToplamMaliyet: Number(personelToplamMaliyet),
            digerGiderler: digerGiderler ? Number(digerGiderler) : 0,
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                ciro: result.ciro,
                netKar: result.netKar,
                karMarji: result.karMarji,
                mesaj: result.ajan_cevabi
            });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
