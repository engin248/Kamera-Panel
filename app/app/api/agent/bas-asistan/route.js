import { NextResponse } from "next/server";
import { basAsistanEmriYurut } from "../../../../lib/agents/bas-asistan";

export async function POST(req) {
    try {
        const body = await req.json();
        const { emirTipi, uretimVerisi, finansVerisi } = body;

        if (!emirTipi) {
            return NextResponse.json({ success: false, error: "Emir Tipi (emirTipi) zorunludur." }, { status: 400 });
        }

        // Baş Asistana emri ve verileri ilet (Örn: emirTipi: 'ÜRETİM_DURUM_RAPORU_İSTE')
        const result = await basAsistanEmriYurut(emirTipi, {
            uretim: uretimVerisi || {},
            finans: finansVerisi || {}
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                mesaj: result.asistanCevabi
            });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
