import { NextResponse } from 'next/server';

// Otonom Ajanları İçeri Aktar
import { analyzeModelRisk } from '@/lib/agents/tekniker';
// import { kameraAnaliz } from '@/lib/agents/kamera';
// import { finansAnaliz } from '@/lib/agents/muhasip';
// import { piyasaAnaliz } from '@/lib/agents/kasif';

export async function POST(request) {
    try {
        const { message, history = [], bot = 'gemini', contextData = {} } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Mesaj boş olamaz' }, { status: 400 });
        }

        let reply = "";
        let botName = "Sistem";
        let botEmoji = "🤖";

        // Gelen bot parametresine (veya aktif sekmeye) göre Otonom Ajanı tetikler.
        // Gelecekte her sekme kendi özel bot parametresini gönderecek ('tekniker', 'kamera' vb.)

        if (bot === 'deepseek' || bot === 'tekniker' || message.toLowerCase().includes('model')) {
            // TEKNİKER AJANI (Modeller, Kalite Kontrol)
            botName = 'Tekniker';
            botEmoji = '🛠️';

            // Eğer arayüz kumaş cinsi gönderdiyse RAG hafızaya bakar, 
            // şimdilik test amaçlı message'ı kumasCinsi olarak kabul test edelim.
            const kumasTipi = contextData?.kumasCinsi || message;

            const result = await analyzeModelRisk(kumasTipi, 15, "Genel Model");
            reply = result.ajan_cevabi || "Tekniker şu an üretim dosyasını okuyamıyor.";

        } else if (bot === 'gpt' || bot === 'muhasip' || message.toLowerCase().includes('maliyet')) {
            // MUHASİP AJANI (Maliyet, Finans)
            botName = 'Muhasip';
            botEmoji = '📊';
            reply = "Muhasip Ajan devrede: Mevcut kâr marjınız %15 seviyesindedir."; // Geçici Fallback

        } else if (bot === 'gemini' || bot === 'kamera') {
            // KAMERA AJANI (Ana Akış, Personel, Üretim)
            botName = 'Kamera (Operasyon Şefi)';
            botEmoji = '🔩';
            reply = "Kamera devrede: Üretim bandında şu an her şey stabil."; // Geçici Fallback

        } else if (bot === 'perplexity' || bot === 'kasif') {
            // KAŞİF AJANI (Araştırma, Trend)
            botName = 'Kaşif';
            botEmoji = '🔍';
            reply = "Kaşif Ajan devrede: Piyasada şu an bu modele talep yüksek."; // Geçici Fallback

        } else {
            // Beklenmeyen veya genel istekler Kameraya düşsün
            botName = 'Kamera';
            botEmoji = '🔩';
            reply = "Otonom zeka: Anlayamadım, detay verir misiniz?";
        }

        return NextResponse.json({
            reply,
            source: 'langchain-agent',
            bot,
            botName,
            botEmoji
        });

    } catch (error) {
        console.error('Otonom Ajan Hatası:', error);
        return NextResponse.json({
            reply: '⚠️ Sistem zekası bağlanamadı (Oflayn koruma aktif).',
            error: error.message
        }, { status: 500 });
    }
}
