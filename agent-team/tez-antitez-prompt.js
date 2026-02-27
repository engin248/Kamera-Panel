const fs = require('fs');
const envContent = fs.readFileSync('C:/Users/esisya/Desktop/Deneme/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => { const [k, ...v] = line.split('='); if (k && v.length) env[k.trim()] = v.join('=').trim(); });

const plan = fs.readFileSync('C:/Users/esisya/.gemini/antigravity/brain/e28a1775-2623-4bcc-a3f4-cb8bcf1d23bc/implementation_plan.md', 'utf8');

const prompt = `Sen tekstil fason \u00fcretim uzman\u0131s\u0131n ve yaz\u0131l\u0131m mimars\u0131n. A\u015fa\u011f\u0131daki \u00fcretim mod\u00fcl\u00fc plan\u0131n\u0131 TEZ-ANT\u0130TEZ y\u00f6ntemiyle analiz et.

\u015eunlar\u0131 yap:
1. FAZLALIK: Gereksiz, tekrarlayan veya kafa kar\u0131\u015ft\u0131racak alanlar var m\u0131?
2. EKS\u0130KL\u0130K: Fason tekstil at\u00f6lyesinde olmas\u0131 gereken ama planda olmayan \u015feyler neler?
3. YANLI\u015e: Yanl\u0131\u015f s\u0131ralama, yanl\u0131\u015f mant\u0131k, yanl\u0131\u015f alan tipi var m\u0131?
4. \u00c7EL\u0130\u015eK\u0130: Plan\u0131n kendi i\u00e7inde \u00e7eli\u015fen noktalar\u0131 var m\u0131?
5. \u0130\u015e AKI\u015eI: Bir parti geldi\u011finde ba\u015ftan sona s\u00fcre\u00e7 do\u011fru s\u0131ralanm\u0131\u015f m\u0131?
6. VER\u0130 B\u00dcT\u00dcNL\u00dc\u011e\u00dc: Tablolar aras\u0131 ili\u015fkiler do\u011fru mu, foreign key eksik var m\u0131?
7. PRAT\u0130KL\u0130K: Gece \u00e7al\u0131\u015fan bir at\u00f6lye sahibi bunu kullanabilir mi, \u00e7ok karma\u015f\u0131k m\u0131?

Her madde i\u00e7in SORUN varsa a\u00e7\u0131kla, yoksa "OK" yaz. T\u00fcrk\u00e7e yan\u0131tla.

PLAN:
${plan}`;

fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.OPENAI_API_KEY },
    body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096, temperature: 0.3
    })
}).then(r => r.json()).then(d => {
    if (d.choices && d.choices[0]) {
        fs.writeFileSync('C:/Users/esisya/Desktop/Deneme/Kamera-Panel/agent-team/tez-antitez.md', d.choices[0].message.content, 'utf8');
        console.log('OK: ' + d.choices[0].message.content.length + ' karakter');
    } else { console.log('HATA:', JSON.stringify(d).substring(0, 500)); }
}).catch(e => console.log('ERR:', e.message));
