const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('app/page.js', 'utf8');
const lines = content.split('\n');

// Tum fonksiyonlari bul
const funcs = [];
for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^function ([A-Za-z][a-zA-Z0-9_]+)\s*\(/);
    if (m) funcs.push({ name: m[1], start: i + 1 });
}

// Satirlari hesapla
for (let i = 0; i < funcs.length - 1; i++) {
    funcs[i].end = funcs[i + 1].start - 1;
    funcs[i].lines = funcs[i].end - funcs[i].start + 1;
}
funcs[funcs.length - 1].end = lines.length;
funcs[funcs.length - 1].lines = lines.length - funcs[funcs.length - 1].start + 1;

// Buyukten kucuge sirala
const sorted = [...funcs].sort((a, b) => b.lines - a.lines);

console.log('\n=== FONKSIYON HARITASI (Buyukten Kucuge) ===');
sorted.forEach(f => {
    const kb = (f.lines * 60 / 1024).toFixed(0); // yaklasik KB
    console.log(`${String(f.lines).padStart(5)} satir | ${f.name.padEnd(35)} | Satir ${f.start}-${f.end}`);
});

console.log('\n=== COMPONENTS/PAGES MEVCUT ===');
const compDir = 'app/components/pages';
if (fs.existsSync(compDir)) {
    fs.readdirSync(compDir).forEach(f => {
        const stat = fs.statSync(path.join(compDir, f));
        console.log(`  ${f} (${(stat.size / 1024).toFixed(0)}KB)`);
    });
}

console.log('\n=== PAGE.JS EN UST IMPORTLARI ===');
lines.slice(0, 10).forEach((l, i) => {
    if (l.trim()) console.log(`  ${i + 1}: ${l.trim()}`);
});

console.log('\n=== TOPLAM DOSYA BOYUTU ===');
const stat = fs.statSync('app/page.js');
console.log(`  page.js: ${(stat.size / 1024).toFixed(0)}KB (${lines.length} satir)`);
