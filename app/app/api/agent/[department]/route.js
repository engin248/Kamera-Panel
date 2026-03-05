import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Her bölüm için özel prompt ve yetkiler (tools)
const DEPARTMENT_CONFIGS = {
    'ik-asistan': {
        name: 'İK Asistanı',
        systemPrompt: (data) => `Sen "47 Sil Baştan 01" fason tekstil fabrikasının İNSAN KAYNAKLARI (İK) Asistanısın.
Adın: İK Asistanı.
Uzmanlığın: Personel ekleme, maaş düzenleme, devamsızlık ve verimlilik (FPY) takibi.
Fabrika Durumu: Toplam ${data.personelSayisi} aktif personel var.
Görevlerin: Kullanıcı yeni bir personel eklemek isterse 'add_personnel' fonksiyonunu kullan. Başka bir işlem istenirse sadece yetkilerin dahilinde bilgi ver. Kısa, net ve profesyonel ol.`,
        tools: [
            {
                functionDeclarations: [
                    {
                        name: "add_personnel",
                        description: "Tekstil fabrikasına yeni bir personel ekler. Kullanıcıdan alınan isim, rol ve maaş bilgisini veritabanına kaydeder.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING", description: "Personelin ad ve soyadı (Örn: Ahmet Yılmaz)" },
                                role: { type: "STRING", description: "Personelin rolü/görevi (Örn: operator, kalite_kontrol, usta, ortaci, utucu)" },
                                base_salary: { type: "NUMBER", description: "Personelin maaşı (Örn: 25000)" }
                            },
                            required: ["name", "role", "base_salary"]
                        }
                    }
                ]
            }
        ]
    },
    'kalite-asistan': {
        name: 'Kalite Asistanı',
        systemPrompt: (data) => `Sen Kalite Kontrol Asistanısın. Fabrikadaki hata (fire) oranlarını, kalite denetimlerini ve AQL seviyelerini kontrol edersin. Bugün ${data.bugunHata} adet hata kaydedildi. Net, çözüm odaklı ol.`,
        tools: []
    },
    'finans-asistan': {
        name: 'Finans Asistanı',
        systemPrompt: (data) => `Sen Finans ve Maliyet Asistanısın. İşletmenin gelir-gider dengesi, prim hesaplamaları ve başabaş noktası analizlerini yaparsın. Rakamlarla ve yüzdelerle profesyonel açıklamalar yap.`,
        tools: []
    },
    'siparis-asistan': {
        name: 'Sipariş Asistanı',
        systemPrompt: (data) => `Sen Sipariş ve Müşteri İlişkileri Asistanısın. Termin tarihleri, öncelikli siparişler ve üretimdeki sipariş durumlarını analiz edersin. Açık, net ve yönlendirici ol.`,
        tools: []
    }
};

export async function POST(request, context) {
    try {
        const { department } = await context.params;
        const { message, history = [] } = await request.json();

        if (!message) return NextResponse.json({ error: 'Mesaj boş' }, { status: 400 });

        const config = DEPARTMENT_CONFIGS[department] || {
            name: 'Genel Asistan',
            systemPrompt: () => 'Sen fabrikanın genel asistanısın.',
            tools: []
        };

        // Gerekli fabrika özet verilerini çek
        const { count: personelSayisi } = await supabaseAdmin.from('personnel').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const today = new Date().toISOString().split('T')[0];
        const { data: uretim } = await supabaseAdmin.from('production_logs')
            .select('defective_count')
            .gte('start_time', `${today}T00:00:00Z`).lte('start_time', `${today}T23:59:59Z`);
        const bugunHata = (uretim || []).reduce((s, r) => s + (r.defective_count || 0), 0);

        const systemText = config.systemPrompt({ personelSayisi, bugunHata });

        // Gemini API'sine ilk çağrı
        let response = await callGeminiWithTools(systemText, message, history, config.tools);

        // Eğer model bir araç devredeyse
        if (response.functionCall) {
            const funcCall = response.functionCall;
            if (funcCall.name === 'add_personnel') {
                const { name, role, base_salary } = funcCall.args;

                // Veritabanına ekleme işlemi
                let toolResultStr = "";
                const { data, error } = await supabaseAdmin.from('personnel').insert([{
                    name,
                    role,
                    base_salary,
                    status: 'active'
                }]).select();

                if (error) {
                    toolResultStr = `Hata oluştu: ${error.message}`;
                } else {
                    toolResultStr = `Personel başarıyla eklendi! ID: ${data[0].id}, İsim: ${data[0].name}`;

                    // Audit log ekle
                    await supabaseAdmin.from('audit_logs').insert([{
                        table_name: 'personnel',
                        record_id: data[0].id,
                        action: 'INSERT',
                        changed_by: 'ai_agent_ik',
                        new_data: data[0]
                    }]);
                }

                // Aractan dönen sonucu modele geri gönder
                const toolResponse = {
                    functionResponse: {
                        name: "add_personnel",
                        response: {
                            content: toolResultStr
                        }
                    }
                };

                response = await callGeminiWithToolResult(systemText, message, history, config.tools, funcCall, toolResponse);
            }
        }

        return NextResponse.json({
            reply: response.reply,
            source: 'gemini-1.5-flash-function-calling',
            botName: config.name
        });

    } catch (err) {
        console.error('Agent API Error:', err);
        return NextResponse.json({ error: err.message, reply: 'Sistemsel bir hata oluştu.' }, { status: 500 });
    }
}

// ==========================================
// YARDIMCI GEMINI FONKSİYONLARI
// ==========================================

async function callGeminiWithTools(systemPrompt, message, history, tools) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Sadece asistan/model mesajlarını alıyoruz
    const formattedHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
    })).slice(-8);

    const payload = {
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [
            ...formattedHistory,
            { role: "user", parts: [{ text: message }] }
        ],
        generationConfig: { temperature: 0.4 }
    };

    if (tools && tools.length > 0) {
        payload.tools = tools;
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Gemini API Hatası: ${res.status}`);

    const data = await res.json();
    const candidate = data.candidates[0].content;
    const part = candidate.parts[0];

    if (part.functionCall) {
        return { functionCall: part.functionCall };
    }

    return { reply: part.text || "Anlayamadım, tekrar eder misiniz?" };
}

async function callGeminiWithToolResult(systemPrompt, originalMsg, history, tools, originalFuncCall, toolResponse) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const formattedHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
    })).slice(-8);

    const payload = {
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [
            ...formattedHistory,
            { role: "user", parts: [{ text: originalMsg }] },
            { role: "model", parts: [{ functionCall: originalFuncCall }] },
            { role: "user", parts: [toolResponse] }
        ],
        tools: tools,
        generationConfig: { temperature: 0.4 }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Gemini API Hatası (Tool Result): ${res.status}`);

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content;
    return { reply: candidate?.parts?.[0]?.text || "İşlem yapıldı ancak dönüş anlaşılamadı." };
}
