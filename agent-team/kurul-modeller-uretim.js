/**
 * 🏛️ YÖNETİM VE DANIŞMA KURULU — MODELLER & ÜRETİM ANALİZİ
 * 
 * Bu script Modeller ve Üretim penceresi inceleme dokümanlarını 3 AI'ya gönderir.
 * Kullanım: node agent-team/kurul-modeller-uretim.js
 * 
 * AI Ekibi:
 *   🧠 Gemini  — Teknik kriter analizi
 *   📝 GPT     — Kullanıcı deneyimi ve iş süreci analizi
 *   🌐 Perplexity — Endüstri standartları karşılaştırma
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

// İnceleme dokümanlarını oku
const modellerDoc = fs.readFileSync(path.resolve(__dirname, '../MODELLER-PENCERESI-YONETIM-KURULU-INCELEME.md'), 'utf8');
const uretimDoc = fs.readFileSync(path.resolve(__dirname, '../URETIM-PENCERESI-YONETIM-KURULU-INCELEME.md'), 'utf8');

const fullDoc = `=== MODELLER PENCERESİ ===\n\n${modellerDoc}\n\n=== ÜRETİM PENCERESİ ===\n\n${uretimDoc}`;

console.log('');
console.log('🏛️  YÖNETİM VE DANIŞMA KURULU — MODELLER & ÜRETİM İNCELEME');
console.log('═'.repeat(60));
console.log(`📋 Doküman boyutu: ${fullDoc.length} karakter`);
console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
console.log('═'.repeat(60));
console.log('');

const costs = { gemini: 0, gpt: 0, perplexity: 0 };

const systemPrompt = `Sen bir tekstil üretim atölyesi yazılım projesi yönetim kurulu üyesisin.
Sana Modeller penceresi ve Üretim penceresi inceleme dokümanları verilecek.
Bu dokümanları analiz et ve şu başlıklar altında görüşünü bildir:

1. MEVCUT DURUMUN DEĞERLENDİRMESİ — Eksik, yanlış veya gereksiz gördüğün noktalar
2. EKLENMESİ GEREKEN ÖZELLİKLER — Kritik öncelikli, orta öncelikli, düşük öncelikli
3. GELİŞTİRME ÖNERİLERİ — Farklı bakış açınla öneriler
4. DOKÜMAN SONUNDAKİ SORULARA CEVAPLAR — Her soruya görüşünü belirt
5. EK GÖRÜŞLER — Dokümanın kapsamadığı ama önemli gördüğün noktalar

Türkçe cevap ver. Kısa ve öz ol, gereksiz uzatma.`;

// === GEMİNİ ===
async function askGemini() {
    console.log('🧠 Gemini analiz başlıyor...');
    const startTime = Date.now();

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\n${fullDoc}`
                }]
            }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.3 }
        })
    });

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.candidates && data.candidates[0]) {
        const text = data.candidates[0].content.parts[0].text;
        const inputTokens = (systemPrompt.length + fullDoc.length) / 4;
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
                content: systemPrompt
            }, {
                role: 'user',
                content: fullDoc
            }],
            max_tokens: 4096,
            temperature: 0.3
        })
    });

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.choices && data.choices[0]) {
        const text = data.choices[0].message.content;
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
                content: systemPrompt
            }, {
                role: 'user',
                content: `Aşağıdaki tekstil üretim atölyesi yazılım modüllerini dünya standartlarıyla karşılaştır:\n\n${fullDoc}`
            }],
            max_tokens: 4096,
            temperature: 0.3
        })
    });

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.choices && data.choices[0]) {
        const text = data.choices[0].message.content;
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

    console.log('⚡ 3 AI aynı anda analiz yapıyor...');
    console.log('');

    const [geminiResult, gptResult, perplexityResult] = await Promise.allSettled([
        askGemini(),
        askGPT(),
        askPerplexity()
    ]);

    const results = {
        gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : 'HATA: ' + geminiResult.reason,
        gpt: gptResult.status === 'fulfilled' ? gptResult.value : 'HATA: ' + gptResult.reason,
        perplexity: perplexityResult.status === 'fulfilled' ? perplexityResult.value : 'HATA: ' + perplexityResult.reason
    };

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalCost = costs.gemini + costs.gpt + costs.perplexity;

    const tarih = new Date().toISOString().split('T')[0];
    const saat = new Date().toLocaleTimeString('tr-TR');

    const report = `# 🏛️ Yönetim Kurulu — Modeller & Üretim Penceresi İnceleme Raporu

**Tarih:** ${tarih} — ${saat}
**Konu:** Modeller ve Üretim Penceresi Kapsamlı İnceleme
**Süre:** ${totalTime} saniye
**Maliyet:** ~$${totalCost.toFixed(4)} (~${(totalCost * 36).toFixed(2)} TL)

---

## 🧠 GEMİNİ — Teknik Kriter Analizi

${results.gemini}

---

## 📝 GPT — Kullanıcı Deneyimi ve İş Süreci Analizi

${results.gpt}

---

## 🌐 PERPLEXİTY — Endüstri Standartları Karşılaştırma

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
`;

    const reportPath = path.join(__dirname, `kurul-rapor-modeller-uretim-${tarih}.md`);
    fs.writeFileSync(reportPath, report, 'utf8');

    // Maliyet log
    const costLogPath = path.join(__dirname, 'maliyet-log.json');
    let costLog = [];
    try { costLog = JSON.parse(fs.readFileSync(costLogPath, 'utf8')); } catch { }
    costLog.push({
        tarih: new Date().toISOString(),
        konu: 'modeller-uretim-inceleme',
        toplam_usd: totalCost,
        toplam_tl: totalCost * 36,
        detay: costs,
        sure_sn: parseFloat(totalTime)
    });
    fs.writeFileSync(costLogPath, JSON.stringify(costLog, null, 2), 'utf8');

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ KURUL TOPLANTISI TAMAMLANDI');
    console.log(`⏱️  Süre: ${totalTime} saniye`);
    console.log(`💰 Maliyet: ~$${totalCost.toFixed(4)} (~${(totalCost * 36).toFixed(2)} TL)`);
    console.log(`📄 Rapor: ${reportPath}`);
    console.log('═'.repeat(60));
}

main().catch(err => {
    console.error('❌ HATA:', err.message);
});
