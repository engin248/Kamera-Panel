import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request) {
    try {
        const { message, history = [] } = await request.json();
        if (!message) return NextResponse.json({ error: 'Mesaj boş olamaz' }, { status: 400 });

        // DB'den güncel fabrika verisi çek
        const db = getDb();
        const today = new Date().toISOString().split('T')[0];

        // Aktif siparişler
        const orders = db.prepare(`
      SELECT o.*, m.name as model_name 
      FROM orders o LEFT JOIN models m ON o.model_id = m.id
      WHERE o.deleted_at IS NULL AND o.status NOT IN ('tamamlandi','iptal')
      ORDER BY o.delivery_date ASC LIMIT 10
    `).all();

        // Bugünkü üretim
        const uretim = db.prepare(`
      SELECT p.*, m.name as model_name, per.name as personel_name
      FROM production_logs p
      LEFT JOIN models m ON p.model_id = m.id
      LEFT JOIN personnel per ON p.personnel_id = per.id
      WHERE DATE(p.created_at) = ? AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC LIMIT 20
    `).all(today);

        // Aktif personel sayısı
        const personelSayisi = db.prepare(`SELECT COUNT(*) as cnt FROM personnel WHERE status = 'active' AND deleted_at IS NULL`).get();

        // Model sayısı
        const modelSayisi = db.prepare(`SELECT COUNT(*) as cnt FROM models WHERE deleted_at IS NULL`).get();

        // Toplam üretim bugün
        const bugunUretim = uretim.reduce((s, r) => s + (r.total_produced || 0), 0);
        const bugunHata = uretim.reduce((s, r) => s + (r.defective_count || 0), 0);

        // Geciken siparişler
        const geciken = db.prepare(`
      SELECT COUNT(*) as cnt FROM orders 
      WHERE deleted_at IS NULL AND status NOT IN ('tamamlandi','iptal')
      AND delivery_date < date('now')
    `).get();

        // Bu ayın maliyeti
        const ay = new Date().getMonth() + 1;
        const yil = new Date().getFullYear();
        const maliyet = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as toplam FROM business_expenses 
      WHERE year = ? AND month = ? AND deleted_at IS NULL
    `).get(yil, ay);

        const fabrikaOzet = `
=== FABRIKA VERİSİ (${new Date().toLocaleString('tr-TR')}) ===
- Aktif Personel: ${personelSayisi.cnt} kişi
- Aktif Model Sayısı: ${modelSayisi.cnt}
- Bugün Üretilen: ${bugunUretim} adet (${bugunHata} hatalı)
- Aktif Siparişler: ${orders.length} (${geciken.cnt} gecikmiş)
- Bu Ay Gider: ${parseFloat(maliyet.toplam).toFixed(0)} ₺

Aktif Siparişler:
${orders.slice(0, 5).map(o => `  • ${o.customer_name || 'Müşteri'}: ${o.model_name || 'Model'} — ${o.quantity} adet — Teslim: ${o.delivery_date || 'Belirtilmemiş'} [${o.status}]`).join('\n')}

Bugünkü Üretim Kayıtları:
${uretim.slice(0, 5).map(u => `  • ${u.personel_name || 'Personel'}: ${u.total_produced || 0} adet üretim (${u.defective_count || 0} hata)`).join('\n')}
`;

        const systemPrompt = `Sen "47 Sil Baştan 01" fason tekstil fabrikasının AI asistanısın. 
Adına "Kamera" deniyor.
Görevlerin: üretim takibi, sipariş yönetimi, personel analizi, maliyet hesaplama.
Her zaman Türkçe cevap ver. Kısa ve net ol. Emoji kullan. 
Fabrika verisine göre gerçek cevaplar ver.

${fabrikaOzet}

ÖNEMLİ: Verilen fabrika verisini kullanarak somut, gerçekçi cevaplar ver.
Eğer sorulan konuda veri yoksa "Şu an bu veriye erişemiyorum, panelden kontrol edin" de.`;

        // Gemini API isteği
        const geminiBody = {
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: '✅ Anladım. Fabrika verisi yüklendi. Size nasıl yardımcı olabilirim?' }] },
                ...history.slice(-6).map(h => ({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.content }]
                })),
                { role: 'user', parts: [{ text: message }] }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            }
        };

        const geminiRes = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody)
        });

        if (!geminiRes.ok) {
            // Gemini hata verirse basit kural tabanlı cevap ver
            const cevap = getKuralTabanliCevap(message, { orders, uretim, personelSayisi, modelSayisi, bugunUretim, geciken });
            return NextResponse.json({ reply: cevap, source: 'rule-based' });
        }

        const geminiData = await geminiRes.json();
        const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '❓ Cevap üretilemedi.';

        return NextResponse.json({ reply, source: 'gemini' });

    } catch (error) {
        console.error('Chatbot error:', error);
        return NextResponse.json({
            reply: '⚠️ Şu an bağlanamıyorum. Lütfen panelden kontrol edin.',
            error: error.message
        }, { status: 500 });
    }
}

function getKuralTabanliCevap(message, data) {
    const t = message.toLowerCase();
    const { orders, uretim, personelSayisi, modelSayisi, bugunUretim, geciken } = data;

    if (t.includes('üretim') || t.includes('bugün')) {
        return `📊 **Bugünkü Üretim**\n• Toplam üretilen: **${bugunUretim} adet**\n• Aktif personel: ${personelSayisi.cnt} kişi`;
    }
    if (t.includes('sipariş') || t.includes('order')) {
        return `📋 **Siparişler**\n• Aktif sipariş: **${orders.length}**\n• Gecikmiş: **${geciken.cnt}**`;
    }
    if (t.includes('personel') || t.includes('çalışan')) {
        return `👥 **Personel**\n• Aktif çalışan: **${personelSayisi.cnt} kişi**`;
    }
    if (t.includes('model')) {
        return `👗 **Modeller**\n• Toplam model: **${modelSayisi.cnt}**`;
    }
    return `🤖 Merhaba! Üretim, sipariş, personel veya maliyet hakkında sorularınızı yanıtlayabilirim.`;
}
