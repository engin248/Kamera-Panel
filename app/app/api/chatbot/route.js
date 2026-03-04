import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// 4 BOT SİSTEMİ — Her biri farklı uzmanlık alanı
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

// Bot tanımları — uzmanlık, karakter, model
const BOT_CONFIGS = {
    gemini: {
        name: 'Kamera',
        emoji: '🔩',
        uzmanlik: 'Operasyon Uzmanı',
        renk: '#2ecc71',
        aciklama: 'Anlık üretim, sipariş, personel',
        systemPrompt: (ozet) => `Sen "47 Sil Baştan 01" fason tekstil fabrikasının OPERASYONELasistanısın. Adın KAMERA.

UZMANLIĞIN: Anlık üretim takibi, günlük hedefler, sipariş durumu, personel performansı.
TARZIN: Net, hızlı, kesin sayılar ver. Emoji kullan. Gereksiz konuşma.
DİL: Türkçe. Kısa cevap (max 3-4 satır).

${ozet}

KURAL: Sadece elindeki verilerle konuş. Yoksa "Panelden kontrol edin" de.`
    },

    gpt: {
        name: 'Muhasip',
        emoji: '📊',
        uzmanlik: 'Muhasebe & Finans Uzmanı',
        renk: '#3498db',
        aciklama: 'Maliyet, karlılık, finansal analiz',
        systemPrompt: (ozet) => `Sen "47 Sil Baştan 01" fason tekstil fabrikasının MUHASEBE ve FİNANS uzmanısın. Adın MUHASİP.

UZMANLIĞIN: Maliyet analizi, karlılık hesabı, personel maaş-verimlilik oranı, işletme giderleri, sipariş başına kar/zarar.
TARZIN: Profesyonel, analitik düşün. Yüzde hesapları yap. Önerilerde bulun. Finansal risk varsa uyar.
DİL: Türkçe. Rakamları açıkla. Max 5-6 cümle.

${ozet}

YAKLAŞIM: Her soruyu finansal boyuttan değerlendir. "Bu modelde kar marjı kaç?", "Personel maliyeti üretimi karşılıyor mu?" gibi analizler yap.`
    },

    perplexity: {
        name: 'Kaşif',
        emoji: '🔍',
        uzmanlik: 'Araştırma & Piyasa Uzmanı',
        renk: '#9b59b6',
        aciklama: 'Piyasa, sektör, kumaş fiyatları',
        systemPrompt: (ozet) => `Sen "47 Sil Baştan 01" fason tekstil fabrikasının ARAŞTIRMA uzmanısın. Adın KAŞİF.

UZMANLIĞIN: Tekstil sektörü, kumaş/iplik piyasa fiyatları, rakip analizi, sektör trendleri, ihracat fırsatları, tedarikçi önerileri.
TARZIN: Meraklı, araştırmacı. Sektör bilgisini paylaş. Karşılaştırma yap. Kaynak belirt.
DİL: Türkçe. Bilgilendirici ama sıkmayan. Max 6-7 cümle.

FABRİKA BAĞLAMI:
${ozet}

NOT: Piyasa araştırmaları için güncel bilgi ver. Fabrika verisini sektör ortalamasıyla kıyasla.`
    },

    deepseek: {
        name: 'Tekniker',
        emoji: '🛠️',
        uzmanlik: 'Teknik & Model Uzmanı',
        renk: '#e67e22',
        aciklama: 'Model, BOM, dikim, kalite',
        systemPrompt: (ozet) => `Sen "47 Sil Baştan 01" fason tekstil fabrikasının TEKNİK uzmanısın. Adın TEKNİKER.

UZMANLIĞIN: Model teknik detayları, BOM (malzeme listesi), dikim operasyonları, makine seçimi, kalite kontrol standartları, üretim süreçleri, hata analizi.
TARZIN: Teknik, metodolojik. Adım adım açıkla. Üretim verimliliğine odaklan.
DİL: Türkçe. Teknik ama anlaşılır. Max 5-6 cümle.

FABRİKA VERİSİ:
${ozet}

YAKLAŞIM: "Bu modelde en çok hata nerede?", "Dikim sırası doğru mu?", "BOM'da eksik var mı?" gibi teknik analizler yap.`
    }
};

export async function POST(request) {
    try {
        const { message, history = [], bot = 'gemini' } = await request.json();
        if (!message) return NextResponse.json({ error: 'Mesaj boş olamaz' }, { status: 400 });

        // DB'den fabrika verisi çek — SUPABASE
        const today = new Date().toISOString().split('T')[0];
        const ay = new Date().getMonth() + 1;
        const yil = new Date().getFullYear();

        const [{ data: orders }, { data: uretim }, { data: personelData }, { data: modelData }, { data: maliyetData }] = await Promise.all([
            supabaseAdmin.from('orders').select('customer_name, model_id, quantity, delivery_date, status, models(name)')
                .is('deleted_at', null).not('status', 'in', '("tamamlandi","iptal")').order('delivery_date').limit(10),
            supabaseAdmin.from('production_logs').select('total_produced, defective_count, personnel_id, model_id, models(name), personnel(name)')
                .is('deleted_at', null).gte('start_time', `${today}T00:00:00Z`).lte('start_time', `${today}T23:59:59Z`).limit(20),
            supabaseAdmin.from('personnel').select('id, base_salary').eq('status', 'active').is('deleted_at', null),
            supabaseAdmin.from('models').select('name, fason_price, total_order').is('deleted_at', null).limit(5),
            supabaseAdmin.from('business_expenses').select('amount').eq('year', yil).eq('month', ay).is('deleted_at', null),
        ]);

        // Gecikmiş siparişler
        const { count: gecikenSayi } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true })
            .is('deleted_at', null).not('status', 'in', '("tamamlandi","iptal")').lt('delivery_date', today);

        const personelSayisi = (personelData || []).length;
        const modelSayisi = (modelData || []).length;
        const bugunUretim = (uretim || []).reduce((s, r) => s + (r.total_produced || 0), 0);
        const bugunHata = (uretim || []).reduce((s, r) => s + (r.defective_count || 0), 0);
        const toplamMaliyet = (maliyetData || []).reduce((s, r) => s + (r.amount || 0), 0);
        const toplamMaas = (personelData || []).reduce((s, p) => s + (p.base_salary || 0), 0);

        const fabrikaOzet = `
=== FABRİKA: 47 Sil Baştan 01 — ${new Date().toLocaleString('tr-TR')} ===
Aktif Personel: ${personelSayisi} | Toplam Model: ${modelSayisi}
Bugün Üretim: ${bugunUretim} adet | Hata: ${bugunHata} adet
Aktif Sipariş: ${(orders || []).length} | Gecikmiş: ${gecikenSayi || 0}
Bu Ay Gider: ${Math.round(toplamMaliyet)} ₺ | Personel Maaş: ${Math.round(toplamMaas)} ₺

Siparişler: ${(orders || []).slice(0, 4).map(o => `${o.customer_name || '?'}→${o.models?.name || '?'} ${o.quantity}adet [${o.delivery_date || '?'}]`).join(' | ')}
Modeller: ${(modelData || []).map(m => `${m.name}(${m.fason_price || '?'}₺/adet, ${m.total_order || 0}sipariş)`).join(' | ')}
Bugün Üretim: ${(uretim || []).slice(0, 4).map(u => `${u.personnel?.name || '?'}:${u.total_produced || 0}adet`).join(' | ')}
`;

        const config = BOT_CONFIGS[bot] || BOT_CONFIGS.gemini;
        const systemPrompt = config.systemPrompt(fabrikaOzet);

        // Hangi API'ye göndereceğimizi seç
        let reply, source;

        if (bot === 'gemini') {
            ({ reply, source } = await callGemini(systemPrompt, message, history));
        } else if (bot === 'gpt') {
            ({ reply, source } = await callGPT(systemPrompt, message, history));
        } else if (bot === 'perplexity') {
            ({ reply, source } = await callPerplexity(systemPrompt, message, history));
        } else if (bot === 'deepseek') {
            ({ reply, source } = await callDeepSeek(systemPrompt, message, history));
        } else {
            reply = getKuralTabanliCevap(message, { orders, personelSayisi, modelSayisi, bugunUretim, gecikenSayi });
            source = 'rule-based';
        }

        return NextResponse.json({ reply, source, bot, botName: config.name, botEmoji: config.emoji });

    } catch (error) {
        console.error('Chatbot error:', error);
        return NextResponse.json({ reply: '⚠️ Bağlantı hatası. Lütfen tekrar deneyin.', error: error.message }, { status: 500 });
    }
}

// ====== API ÇAĞRILARI ======

async function callGemini(systemPrompt, message, history, allowFallback = true) {
    const GEMINI_MODELS = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
    ];

    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: systemPrompt }] },
                        { role: 'model', parts: [{ text: '✅ Hazırım.' }] },
                        ...history.slice(-6).map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
                        { role: 'user', parts: [{ text: message }] }
                    ],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
                })
            });
            if (res.status === 429) {
                console.warn(`Gemini ${model} rate limited, trying next...`);
                continue; // sonraki modeli dene
            }
            if (!res.ok) throw new Error(`Gemini ${model} HTTP ${res.status}`);
            const data = await res.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) return { reply, source: `gemini-${model}` };
        } catch (e) {
            console.warn(`Gemini ${model} error:`, e.message);
        }
    }

    // Tüm Gemini modelleri başarısız → GPT fallback
    if (allowFallback && OPENAI_API_KEY) {
        console.log('Tüm Gemini modelleri 429, GPT fallback devreye giriyor...');
        return await callGPT(systemPrompt, message, history);
    }
    return { reply: '⚠️ Servis şu an yoğun, lütfen birkaç saniye sonra tekrar deneyin.', source: 'error' };
}

async function callGPT(systemPrompt, message, history) {
    try {
        const msgs = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: message }
        ];
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: msgs, max_tokens: 600, temperature: 0.7 })
        });
        if (!res.ok) throw new Error(`GPT HTTP ${res.status}`);
        const data = await res.json();
        return { reply: data.choices?.[0]?.message?.content || '❓ Cevap alınamadı.', source: 'gpt-4o-mini' };
    } catch (e) {
        return { reply: `❌ GPT bağlanamadı: ${e.message}`, source: 'error' };
    }
}

async function callPerplexity(systemPrompt, message, history) {
    const MODELS = ['sonar', 'sonar-pro'];
    for (const model of MODELS) {
        try {
            const msgs = [
                { role: 'system', content: systemPrompt },
                ...history.slice(-4).map(h => ({ role: h.role, content: h.content })),
                { role: 'user', content: message }
            ];
            const res = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PERPLEXITY_KEY}` },
                body: JSON.stringify({ model, messages: msgs, max_tokens: 600, temperature: 0.7 })
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                throw new Error(`Perplexity HTTP ${res.status}: ${errText.slice(0, 120)}`);
            }
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) return { reply, source: `perplexity-${model}` };
        } catch (e) {
            console.warn(`Perplexity model ${model} failed:`, e.message);
            if (model === MODELS[MODELS.length - 1]) {
                // son model de başarısız → Gemini'ye fallback
                console.log('Perplexity tamamen failed, falling back to Gemini...');
                return await callGemini(systemPrompt, message, history);
            }
        }
    }
    return { reply: '❌ Araştırma servisi geçici olarak kullanılamıyor.', source: 'error' };
}

async function callDeepSeek(systemPrompt, message, history) {
    try {
        const msgs = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: message }
        ];
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
            body: JSON.stringify({ model: 'deepseek-chat', messages: msgs, max_tokens: 600, temperature: 0.7 })
        });
        if (!res.ok) {
            const status = res.status;
            // 402 = bakiye yok, 401 = geçersiz key → Gemini'ye fallback
            if (status === 402 || status === 401 || status === 403) {
                console.log(`DeepSeek HTTP ${status} — Gemini fallback devreye giriyor...`);
                const fallback = await callGemini(systemPrompt, message, history);
                return { ...fallback, source: 'gemini-fallback-for-deepseek' };
            }
            throw new Error(`DeepSeek HTTP ${status}`);
        }
        const data = await res.json();
        return { reply: data.choices?.[0]?.message?.content || '❓ Cevap alınamadı.', source: 'deepseek' };
    } catch (e) {
        // Bağlantı hatası → Gemini fallback
        console.log('DeepSeek error, Gemini fallback:', e.message);
        return await callGemini(systemPrompt, message, history);
    }
}

function getKuralTabanliCevap(message, data) {
    const t = message.toLowerCase();
    const { orders, personelSayisi, modelSayisi, bugunUretim, geciken } = data;
    if (t.includes('üretim') || t.includes('bugün')) return `📊 Bugün **${bugunUretim} adet** üretildi. Aktif personel: ${personelSayisi.cnt} kişi.`;
    if (t.includes('sipariş')) return `📋 Aktif: **${(orders || []).length}** sipariş | Gecikmiş: **${gecikenSayi || 0}**`;
    if (t.includes('personel')) return `👥 Aktif çalışan: **${personelSayisi} kişi**`;
    if (t.includes('model')) return `👗 Toplam model: **${modelSayisi}**`;
    return `🤖 Üretim, sipariş, personel veya maliyet hakkında sorabilirsiniz.`;
}
