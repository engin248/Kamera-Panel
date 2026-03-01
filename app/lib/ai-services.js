/**
 * AI Servis Katmanı — Kamera-Panel
 * Tüm agent API'lerini tek noktadan yönetir.
 * 
 * Desteklenen Agentlar:
 *   - OpenAI  (GPT-4o + o1)       → ROBOT 1
 *   - DeepSeek (deepseek-chat)     → ROBOT 2
 *   - Gemini  (gemini-2.0-flash)   → ROBOT 3
 *   - Perplexity (sonar)           → Araştırmacı
 */

// ─── OPENAI (GPT-4o / o1) ────────────────────────────────────────────────────
export async function askGPT(prompt, { model = 'gpt-4o', systemPrompt = '' } = {}) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
        }),
    });
    if (!res.ok) throw new Error(`OpenAI hata: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
}

// o1 için (reasoning model — temperature parametresi desteklemez)
export async function askO1(prompt, { systemPrompt = '' } = {}) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'o1',
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: prompt },
            ],
        }),
    });
    if (!res.ok) throw new Error(`OpenAI o1 hata: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
}

// ─── DEEPSEEK (Kod Denetçi) ──────────────────────────────────────────────────
export async function askDeepSeek(prompt, { systemPrompt = '' } = {}) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: prompt },
            ],
            temperature: 0.1,
        }),
    });
    if (!res.ok) throw new Error(`DeepSeek hata: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
}

// ─── GEMINI (Analizci) ───────────────────────────────────────────────────────
export async function askGemini(prompt, { model = 'gemini-2.0-flash' } = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
        }),
    });
    if (!res.ok) throw new Error(`Gemini hata: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
}

// ─── PERPLEXITY (Araştırmacı) ────────────────────────────────────────────────
export async function askPerplexity(prompt, { systemPrompt = '' } = {}) {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'sonar',
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            return_citations: true,
        }),
    });
    if (!res.ok) throw new Error(`Perplexity hata: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const text = data.choices[0].message.content;
    const citations = data.citations || [];
    return { text, citations };
}

// ─── KURUL OYU (Tüm Agentlara Aynı Anda Sor) ────────────────────────────────
/**
 * Yönetim kuruluna aynı soru sorulur, hepsinin cevabı alınır.
 * @param {string} question - Sorulacak soru
 * @param {string} context  - Proje bağlamı / arka plan bilgisi
 */
export async function kurulOyu(question, context = '') {
    const prompt = context
        ? `Bağlam:\n${context}\n\nSoru:\n${question}`
        : question;

    const sistemPrompt = `Sen Kamera-Panel tekstil üretim yönetim sisteminin danışma kurul üyesisin.
Proje: Türkiye'deki fason tekstil atölyesi için Next.js + SQLite tabanlı iç düzen paneli.
Amacı: Çalışanları doğru tanımak, doğru iş vermek, adil ücret sistemi kurmak.
Her cevabı Türkçe ver. Net, kısa, pratik öneriler sun.`;

    const [gptSonuc, deepseekSonuc, geminiSonuc, perplexitySonuc] = await Promise.allSettled([
        askGPT(prompt, { systemPrompt: sistemPrompt }),
        askDeepSeek(prompt, { systemPrompt: sistemPrompt }),
        askGemini(prompt),
        askPerplexity(prompt, { systemPrompt: sistemPrompt }),
    ]);

    return {
        gpt: gptSonuc.status === 'fulfilled' ? gptSonuc.value : `HATA: ${gptSonuc.reason?.message}`,
        deepseek: deepseekSonuc.status === 'fulfilled' ? deepseekSonuc.value : `HATA: ${deepseekSonuc.reason?.message}`,
        gemini: geminiSonuc.status === 'fulfilled' ? geminiSonuc.value : `HATA: ${geminiSonuc.reason?.message}`,
        perplexity: perplexitySonuc.status === 'fulfilled' ? perplexitySonuc.value : `HATA: ${perplexitySonuc.reason?.message}`,
    };
}

// ─── API SAĞLIK KONTROLÜ ─────────────────────────────────────────────────────
export async function apiSaglikKontrol() {
    const testPrompt = 'Kamera-Panel projesine katıldın. "Hazırım" diye kısaca cevap ver.';
    const results = {};

    const checks = [
        { key: 'openai', fn: () => askGPT(testPrompt) },
        { key: 'deepseek', fn: () => askDeepSeek(testPrompt) },
        { key: 'gemini', fn: () => askGemini(testPrompt) },
        { key: 'perplexity', fn: () => askPerplexity(testPrompt).then(r => r.text) },
    ];

    await Promise.all(checks.map(async ({ key, fn }) => {
        try {
            const start = Date.now();
            const response = await fn();
            results[key] = {
                durum: '✅ Çalışıyor',
                yanit: response?.slice(0, 80) + '...',
                sureMs: Date.now() - start,
            };
        } catch (err) {
            results[key] = {
                durum: '❌ Hata',
                hata: err.message,
            };
        }
    }));

    return results;
}
