/**
 * 🏛️ YÖNETİM VE DANIŞMA KURULU — OTOMATİK ANALİZ
 * 
 * Bu script personel formunu 4 AI'ya gönderir, analizlerini toplar.
 * Kullanım: node agent-team/kurul-analiz.js
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

// page.js'den personel form bölümünü çıkar (satır 2800-3530 arası)
const pageJs = fs.readFileSync(path.resolve(__dirname, '../app/app/page.js'), 'utf8');
const lines = pageJs.split('\n');
const formCode = lines.slice(2799, 3530).join('\n');

console.log('📋 Form kodu çıkarıldı: ' + formCode.length + ' karakter');
console.log('');

// === GEMİNİ ===
async function askGemini() {
    console.log('🧠 Gemini analiz başlıyor...');
    const talimat = fs.readFileSync(path.join(__dirname, 'TALIMAT_GEMINI.md'), 'utf8');

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${kurallar}\n\n${ozet}\n\n${talimat}\n\n--- PERSONEL FORMU KODU (page.js satır 2800-3530) ---\n\n${formCode}`
                }]
            }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.3 }
        })
    });

    const data = await res.json();
    if (data.candidates && data.candidates[0]) {
        return data.candidates[0].content.parts[0].text;
    }
    return 'HATA: ' + JSON.stringify(data);
}

// === GPT ===
async function askGPT() {
    console.log('📝 GPT analiz başlıyor...');
    const talimat = fs.readFileSync(path.join(__dirname, 'TALIMAT_GPT.md'), 'utf8');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
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
    if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
    }
    return 'HATA: ' + JSON.stringify(data);
}

// === DEEPSEEK ===
async function askDeepSeek() {
    console.log('🔍 DeepSeek analiz başlıyor...');
    const talimat = fs.readFileSync(path.join(__dirname, 'TALIMAT_DEEPSEEK.md'), 'utf8');

    // DeepSeek API - OpenAI uyumlu format
    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.DEEPSEEK_API_KEY || ''}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{
                role: 'system',
                content: `${kurallar}\n\n${ozet}\n\n${talimat}`
            }, {
                role: 'user',
                content: `Aşağıdaki personel formunu talimatına göre analiz et:\n\n${formCode}`
            }],
            max_tokens: 4096,
            temperature: 0.2
        })
    });

    const data = await res.json();
    if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
    }
    return 'HATA (DeepSeek API anahtarı .env dosyasına eklenmeli): ' + JSON.stringify(data);
}

// === PERPLEXİTY ===
async function askPerplexity() {
    console.log('🌐 Perplexity araştırma başlıyor...');
    const talimat = fs.readFileSync(path.join(__dirname, 'TALIMAT_PERPLEXITY.md'), 'utf8');

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
    if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
    }
    return 'HATA: ' + JSON.stringify(data);
}

// === ANA FONKSİYON ===
async function main() {
    console.log('🏛️ YÖNETİM VE DANIŞMA KURULU TOPLANTISI BAŞLIYOR');
    console.log('='.repeat(60));
    console.log('');

    const results = {};

    // Paralel çalıştır — hepsini aynı anda gönder
    const [geminiResult, gptResult, deepseekResult, perplexityResult] = await Promise.allSettled([
        askGemini(),
        askGPT(),
        askDeepSeek(),
        askPerplexity()
    ]);

    results.gemini = geminiResult.status === 'fulfilled' ? geminiResult.value : 'HATA: ' + geminiResult.reason;
    results.gpt = gptResult.status === 'fulfilled' ? gptResult.value : 'HATA: ' + gptResult.reason;
    results.deepseek = deepseekResult.status === 'fulfilled' ? deepseekResult.value : 'HATA: ' + deepseekResult.reason;
    results.perplexity = perplexityResult.status === 'fulfilled' ? perplexityResult.value : 'HATA: ' + perplexityResult.reason;

    // Raporu oluştur
    const tarih = new Date().toISOString().split('T')[0];
    const saat = new Date().toLocaleTimeString('tr-TR');

    const report = `# 🏛️ Yönetim ve Danışma Kurulu — Personel Modülü Analiz Raporu

**Tarih:** ${tarih} — ${saat}
**Konu:** Personel Değerlendirme Kriterleri Analizi

---

## 🧠 GEMİNİ — Teknik Kriter Analizi

${results.gemini}

---

## 📝 GPT — İnsan Odaklı Analiz

${results.gpt}

---

## 🔍 DEEPSEEK — Kod Denetim Raporu

${results.deepseek}

---

## 🌐 PERPLEXİTY — Dünya Standartları Karşılaştırma

${results.perplexity}

---

*Bu rapor otomatik olarak oluşturulmuştur. Koordinatör onayına sunulmuştur.*
`;

    // Raporu kaydet
    const reportPath = path.join(__dirname, `kurul-rapor-${tarih}.md`);
    fs.writeFileSync(reportPath, report, 'utf8');

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ KURUL TOPLANTISI TAMAMLANDI');
    console.log('📄 Rapor kaydedildi: ' + reportPath);
    console.log('');
    console.log('Şimdi raporu okuyun ve Claude\'a (Antigravity) düzeltme talimatı verin.');
}

main().catch(err => {
    console.error('❌ HATA:', err.message);
});
