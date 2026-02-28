/**
 * 🏛️ ÜRETİM PENCERESİ — SON KAPSAMLI İNCELEME
 * Kod + analiz dokümanı birlikte gönderiliyor
 * node agent-team/kurul-uretim-final.js
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

// Üretim sayfası kodunu çıkar
const pageJs = fs.readFileSync(path.resolve(__dirname, '../app/app/page.js'), 'utf8');
const lines = pageJs.split('\n');
// ProductionPage fonksiyonunu bul
const startIdx = lines.findIndex(l => l.includes('function ProductionPage'));
const codeBlock = lines.slice(startIdx, startIdx + 700).join('\n');

// Son analiz dokümanını oku
const analiz = fs.readFileSync(path.resolve(__dirname, '../URETIM-PENCERESI-SON-ANALIZ.md'), 'utf8');

const fullContent = `=== ÜRETİM TAKİP SAYFASI KODU (ProductionPage) ===\n\n${codeBlock}\n\n=== SON ANALİZ DOKÜMANI ===\n\n${analiz}`;

console.log('🏛️  SON KAPSAMLI İNCELEME — Her Açıdan Kontrol');
console.log('═'.repeat(55));
console.log(`📋 Toplam: ${fullContent.length} karakter`);

const costs = { gpt: 0, perplexity: 0 };

const systemPrompt = `Sen bir tekstil üretim yazılımı denetçisisin. Sana üretim takip penceresinin KAYNAK KODU ve analiz dokümanı verilecek.

SON İNCELEME olarak her noktayı her açıdan kontrol et:

1. KOD KALİTESİ — Hata, güvenlik açığı, performans sorunu var mı?
2. İŞ AKIŞI DOĞRULUĞU — Form akışı mantıklı mı? Adımlar doğru sırada mı?
3. HESAPLAMA DOĞRULUĞU — FPY, OEE, Net Çalışma, Birim Süre, İşlem Değeri formülleri doğru mu?
4. KULLANICI DENEYİMİ — Eksik uyarı, kötü UX, karışık alan var mı?
5. VERİ GÜVENLİĞİ — Soft-delete var mı? Audit trail çalışıyor mu? SQL injection koruması var mı?
6. CRUD KONTROL — Her kayıtta düzenle/sil/geçmiş butonları var mı?
7. EKSİK KONTROL — Formda boş bırakılmaması gereken alan var mı, kontrol edilmiş mi?
8. HATA YÖNETİMİ — try/catch var mı? Hata mesajları kullanıcıya gösteriliyor mu?
9. PERFORMANS — Gereksiz render, bellek sızıntısı riski var mı?
10. SON KARAR — Bu pencere üretime (production) hazır mı? Evet/Hayır + gerekçe

Her maddeye ✅ (geçti) veya ❌ (sorun var) ver.
Türkçe cevap ver, kısa ve net ol.`;

async function askGPT() {
    console.log('📝 GPT kod inceleme başlıyor...');
    const startTime = Date.now();
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: fullContent }],
            max_tokens: 4096, temperature: 0.2
        })
    });
    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (data.choices?.[0]) {
        const usage = data.usage || {};
        costs.gpt = ((usage.prompt_tokens || 0) * 0.15 + (usage.completion_tokens || 0) * 0.60) / 1000000;
        console.log(`   ✅ GPT tamamladı (${elapsed}s, ~$${costs.gpt.toFixed(4)})`);
        return data.choices[0].message.content;
    }
    console.log(`   ❌ GPT hata: ${JSON.stringify(data).substring(0, 200)}`);
    return 'HATA: ' + JSON.stringify(data).substring(0, 500);
}

async function askPerplexity() {
    console.log('🌐 Perplexity güvenlik analizi başlıyor...');
    const startTime = Date.now();
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}` },
        body: JSON.stringify({
            model: 'sonar',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: fullContent }],
            max_tokens: 4096, temperature: 0.2
        })
    });
    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (data.choices?.[0]) {
        const usage = data.usage || {};
        costs.perplexity = ((usage.prompt_tokens || 0) * 0.20 + (usage.completion_tokens || 0) * 0.60) / 1000000;
        console.log(`   ✅ Perplexity tamamladı (${elapsed}s, ~$${costs.perplexity.toFixed(4)})`);
        return data.choices[0].message.content;
    }
    console.log(`   ❌ Perplexity hata: ${JSON.stringify(data).substring(0, 200)}`);
    return 'HATA: ' + JSON.stringify(data).substring(0, 500);
}

async function main() {
    console.log('⚡ 2 AI paralel inceleme yapıyor...\n');
    const [gpt, perplexity] = await Promise.allSettled([askGPT(), askPerplexity()]);
    const totalCost = costs.gpt + costs.perplexity;

    const report = `# 🏛️ Üretim Penceresi — SON KAPSAMLI İNCELEME RAPORU

**Tarih:** ${new Date().toISOString().split('T')[0]} — ${new Date().toLocaleTimeString('tr-TR')}
**Maliyet:** ~$${totalCost.toFixed(4)}
**İncelenen:** ProductionPage kaynak kodu + 75+ özellik analiz dokümanı

---

## 📝 GPT — Kod Kalitesi ve İş Akışı İncelemesi

${gpt.status === 'fulfilled' ? gpt.value : 'HATA: ' + gpt.reason}

---

## 🌐 PERPLEXİTY — Güvenlik ve Endüstri Standartları

${perplexity.status === 'fulfilled' ? perplexity.value : 'HATA: ' + perplexity.reason}

---

**Koordinatör Notu:** Bu rapor üretim penceresinin son incelemesidir. Onay/red kararı Koordinatöre aittir.
`;

    const reportPath = path.join(__dirname, 'kurul-uretim-FINAL.md');
    fs.writeFileSync(reportPath, report, 'utf8');

    console.log('\n' + '═'.repeat(55));
    console.log('✅ SON İNCELEME TAMAMLANDI');
    console.log(`💰 Maliyet: ~$${totalCost.toFixed(4)}`);
    console.log(`📄 Rapor: ${reportPath}`);
    console.log('═'.repeat(55));
}

main().catch(err => console.error('❌', err.message));
