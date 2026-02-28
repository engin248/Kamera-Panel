/**
 * 🏛️ ÜRETİM PENCERESİ SON ANALİZ — Yönetim Kurulu
 * node agent-team/kurul-uretim-son.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const doc = fs.readFileSync(path.resolve(__dirname, '../URETIM-PENCERESI-SON-ANALIZ.md'), 'utf8');

console.log('🏛️  ÜRETİM PENCERESİ SON ANALİZ — Yönetim Kurulu');
console.log('═'.repeat(55));

const costs = { gpt: 0, perplexity: 0 };

const systemPrompt = `Sen bir tekstil üretim yönetim sistemleri uzmanısın.
Sana bir üretim takip yazılımının son analiz raporu verilecek.
Toplam 75+ özellik listelenmiş.

Şu başlıklar altında görüşünü bildir:

1. DÜNYA ORTALAMASIYLA KARŞILAŞTIRMA — Bu 75+ özellik tekstil MES (Manufacturing Execution System) dünya ortalamasına göre nerede? Yüzde olarak ver.
2. EKSİK/FAZLA ANALİZİ — Dünya standardıyla karşılaştırınca eksik olan özellikler neler? Gereksiz fazlalık var mı?
3. DOKÜMAN SONUNDAKİ 6 SORUYA CEVAPLAR — Her soruya net görüşünü belirt
4. GENEL PUAN — 100 üzerinden puan ver ve gerekçesini açıkla
5. SON ÖNERİLER — Üretim penceresini kapatmadan önce yapılması gereken son 3 şey (varsa)

Türkçe cevap ver, kısa ve öz ol.`;

async function askGPT() {
    console.log('📝 GPT analiz başlıyor...');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: doc }],
            max_tokens: 4096, temperature: 0.3
        })
    });
    const data = await res.json();
    if (data.choices?.[0]) {
        const usage = data.usage || {};
        costs.gpt = ((usage.prompt_tokens || 0) * 0.15 + (usage.completion_tokens || 0) * 0.60) / 1000000;
        console.log(`   ✅ GPT tamamladı (~$${costs.gpt.toFixed(4)})`);
        return data.choices[0].message.content;
    }
    return 'HATA: ' + JSON.stringify(data).substring(0, 200);
}

async function askPerplexity() {
    console.log('🌐 Perplexity araştırma başlıyor...');
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}` },
        body: JSON.stringify({
            model: 'sonar',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Dünya genelindeki tekstil MES sistemleriyle karşılaştır:\n\n${doc}` }],
            max_tokens: 4096, temperature: 0.3
        })
    });
    const data = await res.json();
    if (data.choices?.[0]) {
        const usage = data.usage || {};
        costs.perplexity = ((usage.prompt_tokens || 0) * 0.20 + (usage.completion_tokens || 0) * 0.60) / 1000000;
        console.log(`   ✅ Perplexity tamamladı (~$${costs.perplexity.toFixed(4)})`);
        return data.choices[0].message.content;
    }
    return 'HATA: ' + JSON.stringify(data).substring(0, 200);
}

async function main() {
    const [gpt, perplexity] = await Promise.allSettled([askGPT(), askPerplexity()]);
    const totalCost = costs.gpt + costs.perplexity;

    const report = `# 🏛️ Üretim Penceresi — Yönetim Kurulu Son Analiz Raporu

**Tarih:** ${new Date().toISOString().split('T')[0]}
**Maliyet:** ~$${totalCost.toFixed(4)}

---

## 📝 GPT — İş Süreci Analizi

${gpt.status === 'fulfilled' ? gpt.value : 'HATA: ' + gpt.reason}

---

## 🌐 PERPLEXİTY — Dünya Standartları Karşılaştırma

${perplexity.status === 'fulfilled' ? perplexity.value : 'HATA: ' + perplexity.reason}

---

*Bu rapor otomatik olarak oluşturulmuştur.*
`;

    const reportPath = path.join(__dirname, 'kurul-uretim-son-analiz.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`\n✅ Rapor: ${reportPath}`);
}

main().catch(err => console.error('❌', err.message));
