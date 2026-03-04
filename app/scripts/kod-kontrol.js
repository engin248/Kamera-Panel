#!/usr/bin/env node
/**
 * KOD KONTROL SISTEMI — Kamera-Panel
 * Tum kodlamayi ilk satirdan son satira kontrol eder.
 * Hicbir ek bagimlilik gerektirmez.
 *
 * Kullanim:
 *   node scripts/kod-kontrol.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APP_DIR = path.resolve(__dirname, '..');
const RESULTS = { pass: 0, fail: 0, warn: 0, errors: [] };

// Renk kodlari
const C = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', cyan: '\x1b[36m', bold: '\x1b[1m',
    reset: '\x1b[0m', dim: '\x1b[2m'
};

function log(icon, msg) { console.log('  ' + icon + ' ' + msg); }
function pass(msg) { RESULTS.pass++; log('\u2705', C.green + msg + C.reset); }
function fail(msg, detail) { RESULTS.fail++; RESULTS.errors.push({ msg, detail }); log('\u274C', C.red + msg + C.reset); if (detail) log('  ', C.dim + detail + C.reset); }
function warn(msg) { RESULTS.warn++; log('\u26A0\uFE0F', C.yellow + msg + C.reset); }
function section(title) { console.log('\n' + C.bold + C.cyan + '=== ' + title + ' ===' + C.reset); }

// ===== KONTROL 1: Turkce degisken isimleri =====
function checkTurkishVars() {
    section('1/7 -- Turkce Degisken Kontrolu');

    const jsFiles = findFiles(APP_DIR, ['.js', '.jsx'], ['node_modules', '.next', '.git', 'scripts']);
    let totalFound = 0;

    for (const file of jsFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const rel = path.relative(APP_DIR, file);
            const lines = content.split('\n');

            for (let li = 0; li < lines.length; li++) {
                const line = lines[li];
                const trimmed = line.trim();
                // Yorum satirlarini atla
                if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
                // JSX metin ve string icindeki satirlari atla (degisken tanimlamasi olmayan satirlar)
                if (!/(const|let|var)\s+\w/.test(line)) continue;
                // CSS var() false positive'ini onle: var(-- seklinde baslayan satirlari atla
                if (/(const|let|var)\s*\(/.test(line) && !/(const|let|var)\s+\w/.test(line)) continue;
                // Turkce ozel karakterler iceren degisken isimleri — tanimlama = olmali
                const m = line.match(/(const|let|var)\s+([a-zA-Z0-9_]{1,}[\u011F\u00FC\u015F\u0131\u00F6\u00E7\u011E\u00DC\u015E\u0130\u00D6\u00C7][a-zA-Z0-9_]{1,})\s*[=,;(]/);
                if (m) {
                    warn(rel + ':' + (li + 1) + ' -- Turkce degisken: "' + m[2] + '"');
                    totalFound++;
                }
            }
        } catch (err) { /* skip */ }
    }

    if (totalFound === 0) pass('Turkce karakter degisken ismi yok');
    else pass(jsFiles.length + ' JS dosyasi taranacak, ' + totalFound + ' uyari bulundu');
}

// ===== KONTROL 2: Cift Tanimli Fonksiyonlar =====
function checkDuplicateFunctions() {
    section('2/7 -- Cift Tanimli Fonksiyon Kontrolu');

    const pageFile = path.join(APP_DIR, 'app', 'page.js');
    if (!fs.existsSync(pageFile)) { warn('page.js bulunamadi'); return; }

    const content = fs.readFileSync(pageFile, 'utf8');
    const funcPattern = /^function\s+(\w+)\s*\(/gm;
    const funcs = {};
    let match;

    while ((match = funcPattern.exec(content)) !== null) {
        const name = match[1];
        const line = content.substring(0, match.index).split('\n').length;
        if (!funcs[name]) funcs[name] = [];
        funcs[name].push(line);
    }

    let dupFound = false;
    for (const [name, lines] of Object.entries(funcs)) {
        if (lines.length > 1) {
            fail('"' + name + '" fonksiyonu ' + lines.length + ' kez tanimli', 'Satirlar: ' + lines.join(', '));
            dupFound = true;
        }
    }

    if (!dupFound) pass('Cift tanimli fonksiyon yok');
}

// ===== KONTROL 3: Import/Require Kontrolu =====
function checkImports() {
    section('3/7 -- Import/Require Kontrolu');

    const jsFiles = findFiles(APP_DIR, ['.js', '.jsx'], ['node_modules', '.next', '.git', 'scripts']);
    const badImports = [];

    for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const rel = path.relative(APP_DIR, file);

        if (content.includes('better-sqlite3')) {
            badImports.push(rel + ': better-sqlite3 importu var (kaldirilmali)');
        }
        if (content.includes("require('sqlite3')") || content.includes("from 'sqlite3'")) {
            badImports.push(rel + ': sqlite3 importu var');
        }
    }

    if (badImports.length > 0) {
        badImports.forEach(function (b) { fail(b); });
    } else {
        pass('Tum import/require kontrolleri temiz');
    }
}

// ===== KONTROL 4: API Route Dosyalari =====
function checkApiRoutes() {
    section('4/7 -- API Route Kontrolu');

    const apiDir = path.join(APP_DIR, 'app', 'api');
    if (!fs.existsSync(apiDir)) { warn('API dizini bulunamadi'); return; }

    const routeFiles = findFiles(apiDir, ['.js'], []);
    let valid = 0, invalid = 0;

    for (const file of routeFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const rel = path.relative(APP_DIR, file);

        const hasExport = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/g.test(content);
        if (!hasExport) {
            warn(rel + ': HTTP method export bulunamadi');
            invalid++;
        } else {
            valid++;
        }
    }

    pass(valid + ' API route dogrulandi' + (invalid > 0 ? ', ' + invalid + ' uyari' : ''));
}

// ===== KONTROL 5: Ortam Degiskenleri =====
function checkEnvVars() {
    section('5/7 -- Ortam Degiskenleri Kontrolu');

    const envFile = path.join(APP_DIR, '.env.local');
    if (!fs.existsSync(envFile)) { fail('.env.local dosyasi bulunamadi'); return; }

    const envContent = fs.readFileSync(envFile, 'utf8');
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'INTERNAL_API_KEY'
    ];

    for (const key of required) {
        if (envContent.includes(key + '=')) {
            pass(key + ' mevcut');
        } else {
            fail(key + ' eksik');
        }
    }
}

// ===== KONTROL 6: Dosya Sagligi =====
function checkFileHealth() {
    section('6/7 -- Dosya Sagligi Kontrolu');

    const jsFiles = findFiles(APP_DIR, ['.js', '.jsx', '.mjs'], ['node_modules', '.next', '.git', 'scripts']);
    let issues = 0;

    for (const file of jsFiles) {
        const rel = path.relative(APP_DIR, file);
        const stat = fs.statSync(file);
        const buf = fs.readFileSync(file);

        // BOM kontrolu
        if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
            warn(rel + ': UTF-8 BOM var');
            issues++;
        }

        // Dosya boyutu uyarisi (500KB uzeri)
        if (stat.size > 500 * 1024) {
            warn(rel + ': ' + (stat.size / 1024).toFixed(0) + 'KB -- cok buyuk dosya');
            issues++;
        }

        // Bos dosya kontrolu
        if (stat.size === 0) {
            warn(rel + ': Bos dosya');
            issues++;
        }
    }

    if (issues === 0) pass('Tum dosyalar saglikli');
}

// ===== KONTROL 7: Next.js Build =====
function checkBuild() {
    section('7/7 -- Next.js Build Kontrolu (EN ONEMLI)');

    try {
        log('\uD83D\uDD04', 'Build calistiriliyor...');
        execSync('npx next build', { cwd: APP_DIR, stdio: 'pipe', timeout: 120000 });
        pass('Build BASARILI (exit code: 0)');
    } catch (err) {
        var output = (err.stdout || '').toString() + (err.stderr || '').toString();

        var errorLines = output.match(/\.\/app\/.*?:\d+:\d+/g) || [];
        var errorMsgs = output.match(/the name `\w+` is defined multiple times/g) || [];
        var parseErrors = output.match(/Parsing ecmascript source code failed/g) || [];

        fail('Build BASARISIZ (exit code: ' + (err.status || '?') + ')');

        if (errorLines.length > 0) {
            errorLines.forEach(function (e) { log('  ', C.red + 'Hata konumu: ' + e + C.reset); });
        }
        if (errorMsgs.length > 0) {
            errorMsgs.forEach(function (e) { log('  ', C.red + e + C.reset); });
        }
        if (parseErrors.length > 0) {
            log('  ', C.red + parseErrors.length + ' adet parse hatasi' + C.reset);
        }
    }
}

// ===== YARDIMCI FONKSIYONLAR =====

function findFiles(dir, extensions, excludes) {
    var results = [];
    try {
        var items = fs.readdirSync(dir);
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (excludes.includes(item)) continue;
            var fullPath = path.join(dir, item);
            var stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                results = results.concat(findFiles(fullPath, extensions, excludes));
            } else if (extensions.some(function (ext) { return item.endsWith(ext); })) {
                results.push(fullPath);
            }
        }
    } catch (e) { }
    return results;
}

// ===== ANA CALISTIRMA =====

console.log('\n' + C.bold + C.blue + '======================================================' + C.reset);
console.log(C.bold + C.blue + '  KAMERA-PANEL KOD KONTROL SISTEMI' + C.reset);
console.log(C.bold + C.blue + '  Ilk satirdan son satira -- hicbir hata kacmaz' + C.reset);
console.log(C.bold + C.blue + '======================================================' + C.reset + '\n');

var startTime = Date.now();

// Tum kontrolleri sirayla calistir
checkTurkishVars();
checkDuplicateFunctions();
checkImports();
checkApiRoutes();
checkEnvVars();
checkFileHealth();
checkBuild();

// Sonuc raporu
var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log('\n' + C.bold + C.blue + '======================================================' + C.reset);
console.log(C.bold + '  SONUC RAPORU' + C.reset + ' (' + elapsed + 's)');
console.log(C.bold + C.blue + '======================================================' + C.reset);
console.log('  ' + C.green + 'Basarili: ' + RESULTS.pass + C.reset);
console.log('  ' + C.yellow + 'Uyari:    ' + RESULTS.warn + C.reset);
console.log('  ' + C.red + 'Hata:     ' + RESULTS.fail + C.reset);

if (RESULTS.fail === 0 && RESULTS.warn === 0) {
    console.log('\n  ' + C.bold + C.green + 'TUM KONTROLLER GECTI -- KOD TEMIZ!' + C.reset + '\n');
    process.exit(0);
} else if (RESULTS.fail === 0) {
    console.log('\n  ' + C.bold + C.green + 'BUILD BASARILI!' + C.reset + ' (uyarilar bilgi amacli)');
    console.log('  ' + C.dim + 'Uyarilari da duzeltmek isterseniz asagiya bakin.' + C.reset + '\n');
    process.exit(0);
} else {
    console.log('\n  ' + C.bold + C.red + RESULTS.fail + ' HATA TESPIT EDILDI -- DUZELTILMELI!' + C.reset);
    console.log('\n  ' + C.dim + 'Hata detaylari:' + C.reset);
    RESULTS.errors.forEach(function (e, i) {
        console.log('  ' + C.red + (i + 1) + '. ' + e.msg + C.reset);
        if (e.detail) console.log('     ' + C.dim + e.detail + C.reset);
    });
    console.log('');
    process.exit(1);
}
