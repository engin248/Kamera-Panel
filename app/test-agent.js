const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ES Module support for direct execution can be tricky in CommonJS scripts 
// if 'type' is not 'module' in package.json. Let's use dynamic import.
async function testAgent() {
    try {
        console.log('Tekniker Ajan Yukleniyor...');
        // Next.js uses aliases like @/lib/agents/tekniker. 
        // We will import it by relative path.
        const modulePath = 'file://' + path.resolve(__dirname, 'lib/agents/tekniker.js').replace(/\\/g, '/');
        const { analyzeModelRisk } = await import(modulePath);

        console.log('Sorgu gönderiliyor: Pamuklu Şardonlu Üç İplik...');
        const result = await analyzeModelRisk('Pamuklu Şardonlu Üç İplik', 15, 'Eşofman Altı');

        console.log('--- AJAN YANITI ---');
        console.log(result.ajan_cevabi);
        console.log('-------------------');
        console.log('Hafıza kullanıldı mı?:', result.hafiza_kullanildi);
    } catch (err) {
        console.error('Test hatasi:', err);
    }
}

testAgent();
