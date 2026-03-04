const fs = require('fs');
let code = fs.readFileSync('lib/jwt.js', 'utf8');
code = code.replace(/'([^'\\]|\\.)*'/g, 'STR');
code = code.replace(/"([^"\\]|\\.)*"/g, 'STR');
const op1 = (code.match(/\(/g) || []).length;
const cl1 = (code.match(/\)/g) || []).length;
const op2 = (code.match(/\{/g) || []).length;
const cl2 = (code.match(/\}/g) || []).length;
console.log('() acik/kapali/fark:', op1, '/', cl1, '/', op1 - cl1);
console.log('{} acik/kapali/fark:', op2, '/', cl2, '/', op2 - cl2);

// Satirlara gore tarama — fazla parantezin nerede oldugunu bul
const lines = fs.readFileSync('lib/jwt.js', 'utf8').split('\n');
let kumulatif = 0;
lines.forEach((line, i) => {
    const clean = line.replace(/'[^']*'/g, 'STR').replace(/"[^"]*"/g, 'STR');
    const acik = (clean.match(/\(/g) || []).length;
    const kapat = (clean.match(/\)/g) || []).length;
    kumulatif += (acik - kapat);
    if (kumulatif !== 0) console.log(`  Satir ${i + 1} [kumulatif=${kumulatif}]: ${line.trim().substring(0, 80)}`);
});
