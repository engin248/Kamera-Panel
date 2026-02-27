/**
 * 🏛️ YÖNETİM VE DANIŞMA KURULU — OTOMATİK ANALİZ
 * 
 * Bu script personel formunu 3 AI'ya gönderir, analizlerini toplar.
 * Kullanım: node agent-team/kurul-analiz.js
 * 
 * AI Ekibi:
 *   🧠 Gemini  — Teknik kriter analizi
 *   📝 GPT     — İnsan odaklı analiz
 *   🌐 Perplexity — Dünya standartları
 * 
 * Maliyet: ~0.3 TL / toplantı
 */

const fs = require('fs');
const path = require('path');

// .env dosyasını oku
const envPath = path.resolve(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

// Talimat dosyalarını oku
const kurallar = fs.readFileSync(path.join(__dirname, 'KURALLAR.md'), 'utf8');
const ozet = fs.readFileSync(path.join(__dirname, 'PROJE_OZET.md'), 'utf8');

// page.js'den personel form bölümünü çıkar
const pageJs = fs.readFileSync(path.resolve(__dirname, '../app/app/page.js'), 'utf8');
const lines = pageJs.split('\n');
const formCode = lines.slice(2820, 3600).join('\n');

console.log('');
console.log('🏛️  YÖNETİM VE DANIŞMA KURULU TOPLANTISI');
console.log('═'.repeat(55));
console.log(`📋 Form kodu çıkarıldı: ${formCode.length} karakter`);
console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
console.log('═'.repeat(55));
console.log('');

// Maliyet takibi
const costs = { gemini: 0, gpt: 0, perplexity: 0 };

// === GEMİNİ ===
async function askGemini() {
    console.log('🧠 Gemini analiz başlıyor...');
    const talimat = fs.readFileSync(path.join(__dirname, 'TALIMAT_GEMINI.md'), 'utf8');
    const startTime = Date.now();

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${kurallar}\n\n${ozet}\n\n${talimat}\n\n--- PERSONEL FORMU KODU (page.js satır 2820-3600) ---\n\n${formCode}`
                }]
            }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.3 }
        })
    });

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.candidates && data.candidates[0]) {
        const text = data.candidates[0].content.parts[0].text;
        // Gemini 2.0 Flash: $0.10/1M input, $0.40/1M output
        const inputTokens = (kurallar.length + ozet.length + talimat.length + formCode.length) / 4;
        const outputTokens = text.length / 4;
        costs.gemini = (inputTokens * 0.10 + outputTokens * 0.40) / 1000000;
        console.log(`   ✅ Gemini tamamladı (${elapsed}s, ~$${costs.gemini.toFixed(4)})`);
        return text;
    }
    console.log(`   ❌ Gemini hata: ${JSON.stringify(data).substring(0, 200)}`);
    return 'HATA: ' + JSON.stringify(data);
}

// === GPT ===
async function askGPT() {
    console.log('📝 GPT analiz başlıyor...');
    const talimat = fs.readFileSync(path.join(__dirname, 'TALIMAT_GPT.md'), 'utf8');
    const startTime = Date.now();

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'system',
                content: `${kurallar}\n\n${ozet}\n\n${talimat}`
            }, {
                role: 'user',
                content: `Aşağıdaki personel formunu talimatına göre analiz et:\n\n${formCode}`
            }],
            max_tokens: 4096,
            temperature: 0.3
        })
    });

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.choices && data.choices[0]) {
        const text = data.choices[0].message.content;
        // GPT-4o-mini: $0.15/1M input, $0.60/1M output
        const usage = data.usage || {};
        costs.gpt = ((usage.prompt_tokens || 0) * 0.15 + (usage.completion_tokens || 0) * 0.60) / 1000000;
        console.log(`   ✅ GPT tamamladı (${elapsed}s, ~$${costs.gpt.toFixed(4)})`);
        return text;
    }
    console.log(`   ❌ GPT hata: ${JSON.stringify(data).substring(0, 200)}`);
    return 'HATA: ' + JSON.stringify(data);
}

// === PERPLEXİTY ===
async function askPerplexity() {
    console.log('🌐 Perplexity araştırma başlıyor...');
    const talimat = fs.readFileSync(path.join(__dirname, 'TALIMAT_PERPLEXITY.md'), 'utf8');
    const startTime = Date.now();

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
            model: 'sonar',
            messages: [{
                role: 'system',
                content: `${kurallar}\n\n${ozet}\n\n${talimat}`
            }, {
                role: 'user',
                content: `Aşağıdaki tekstil üretim atölyesi personel değerlendirme formunu dünya standartlarıyla karşılaştır:\n\n${formCode}`
            }],
            max_tokens: 4096,
            temperature: 0.3
        })
    });

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.choices && data.choices[0]) {
        const text = data.choices[0].message.content;
        // Perplexity Sonar: ~$0.20/1M input, $0.60/1M output
        const usage = data.usage || {};
        costs.perplexity = ((usage.prompt_tokens || 0) * 0.20 + (usage.completion_tokens || 0) * 0.60) / 1000000;
        console.log(`   ✅ Perplexity tamamladı (${elapsed}s, ~$${costs.perplexity.toFixed(4)})`);
        return text;
    }
    console.log(`   ❌ Perplexity hata: ${JSON.stringify(data).substring(0, 200)}`);
    return 'HATA: ' + JSON.stringify(data);
}

// === ANA FONKSİYON ===
async function main() {
    const startTime = Date.now();
    const results = {};

    // 3 AI'yı paralel çalıştır
    console.log('⚡ 3 AI aynı anda analiz yapıyor...');
    console.log('');

    const [geminiResult, gptResult, perplexityResult] = await Promise.allSettled([
        askGemini(),
        askGPT(),
        askPerplexity()
    ]);

    results.gemini = geminiResult.status === 'fulfilled' ? geminiResult.value : 'HATA: ' + geminiResult.reason;
    results.gpt = gptResult.status === 'fulfilled' ? gptResult.value : 'HATA: ' + gptResult.reason;
    results.perplexity = perplexityResult.status === 'fulfilled' ? perplexityResult.value : 'HATA: ' + perplexityResult.reason;

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalCost = costs.gemini + costs.gpt + costs.perplexity;

    // Raporu oluştur
    const tarih = new Date().toISOString().split('T')[0];
    const saat = new Date().toLocaleTimeString('tr-TR');

    const report = `# 🏛️ Yönetim ve Danışma Kurulu — Analiz Raporu

**Tarih:** ${tarih} — ${saat}
**Konu:** Personel Değerlendirme Kriterleri Analizi
**Süre:** ${totalTime} saniye
**Maliyet:** ~$${totalCost.toFixed(4)} (~${(totalCost * 36).toFixed(2)} TL)

---

## 🧠 GEMİNİ — Teknik Kriter Analizi

${results.gemini}

---

## 📝 GPT — İnsan Odaklı Analiz

${results.gpt}

---

## 🌐 PERPLEXİTY — Dünya Standartları Karşılaştırma

${results.perplexity}

---

## 💰 Maliyet Özeti

| AI | Maliyet ($) | Maliyet (TL) |
|----|:-----------:|:------------:|
| Gemini | $${costs.gemini.toFixed(4)} | ${(costs.gemini * 36).toFixed(2)} TL |
| GPT | $${costs.gpt.toFixed(4)} | ${(costs.gpt * 36).toFixed(2)} TL |
| Perplexity | $${costs.perplexity.toFixed(4)} | ${(costs.perplexity * 36).toFixed(2)} TL |
| **TOPLAM** | **$${totalCost.toFixed(4)}** | **${(totalCost * 36).toFixed(2)} TL** |

---

*Bu rapor otomatik olarak oluşturulmuştur.*
*Koordinatör onayına sunulmuştur.*
*Rapordaki öneriler bilgi niteliğindedir — karar Koordinatöre aittir.*
`;

    // Raporu kaydet
    const reportPath = path.join(__dirname, `kurul-rapor-${tarih}.md`);
    fs.writeFileSync(reportPath, report, 'utf8');

    // Maliyet logunu kaydet
    const costLogPath = path.join(__dirname, 'maliyet-log.json');
    let costLog = [];
    try { costLog = JSON.parse(fs.readFileSync(costLogPath, 'utf8')); } catch { }
    costLog.push({
        tarih: new Date().toISOString(),
        toplam_usd: totalCost,
        toplam_tl: totalCost * 36,
        detay: costs,
        sure_sn: parseFloat(totalTime)
    });
    fs.writeFileSync(costLogPath, JSON.stringify(costLog, null, 2), 'utf8');

    console.log('');
    console.log('═'.repeat(55));
    console.log('✅ KURUL TOPLANTISI TAMAMLANDI');
    console.log(`⏱️  Süre: ${totalTime} saniye`);
    console.log(`💰 Maliyet: ~$${totalCost.toFixed(4)} (~${(totalCost * 36).toFixed(2)} TL)`);
    console.log(`📄 Rapor: ${reportPath}`);
    console.log(`📊 Maliyet log: ${costLogPath}`);
    console.log('═'.repeat(55));
    console.log('');
    console.log('👉 Şimdi raporu okuyun ve Claude\'a (Antigravity) düzeltme talimatı verin.');
}

main().catch(err => {
    console.error('❌ HATA:', err.message);
});
