# KAMERA-PANEL -- TAM SISTEM KONTROL SCRIPTI
# Kullanim: PowerShell -ExecutionPolicy Bypass -File scripts\sistem-kontrol.ps1

$BASE = "C:\Users\Admin\Desktop\Kamera-Panel"
$API = "http://localhost:3000"

function Test-API($path, $label) {
    try {
        $r = Invoke-WebRequest -Uri "$API$path" -UseBasicParsing -TimeoutSec 6 -ErrorAction Stop
        $cnt = $r.Content | python -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else 'OK')" 2>$null
        Write-Host ("  [OK] {0,-30} -> {1} kayit" -f $label, $cnt) -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host ("  [!!] {0,-30} -> YANIT YOK" -f $label) -ForegroundColor Red
        return $false
    }
}

function Section($title) {
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
}

# BASLIK
Write-Host ""
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "  KAMERA-PANEL SISTEM KONTROL RAPORU" -ForegroundColor Yellow
Write-Host ("  " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

# 1. SUNUCU
Section "1. SUNUCU DURUMU"
$port = netstat -an | Select-String ":3000.*LISTENING"
if ($port) {
    Write-Host "  [OK] Port 3000 - AKTIF (LISTENING)" -ForegroundColor Green
}
else {
    Write-Host "  [!!] Port 3000 - KAPALI! 'npm run dev' calistir" -ForegroundColor Red
}
$nodes = Get-Process -Name "node" -ErrorAction SilentlyContinue
Write-Host ("  [OK] Node process sayisi: {0}" -f $nodes.Count) -ForegroundColor Green
$mainNode = $nodes | Sort-Object WorkingSet -Descending | Select-Object -First 1
if ($mainNode) {
    $mb = [math]::Round($mainNode.WorkingSet / 1MB, 1)
    Write-Host ("  [OK] Ana process RAM: {0} MB  (PID: {1})" -f $mb, $mainNode.Id) -ForegroundColor Green
}

# 2. API ENDPOINTLERI
Section "2. API ENDPOINTLERI"
$apiOk = 0; $apiFail = 0
$apis = @(
    @{p = "/api/personnel"; l = "Personnel" },
    @{p = "/api/models"; l = "Models" },
    @{p = "/api/machines"; l = "Machines" },
    @{p = "/api/costs"; l = "Costs" },
    @{p = "/api/production"; l = "Production" },
    @{p = "/api/orders"; l = "Orders" },
    @{p = "/api/customers"; l = "Customers" },
    @{p = "/api/shipments"; l = "Shipments" },
    @{p = "/api/quality-checks"; l = "Quality Checks" },
    @{p = "/api/fason"; l = "Fason" },
    @{p = "/api/isletme-gider"; l = "Isletme Gider" },
    @{p = "/api/uretim-ozet"; l = "Uretim Ozet" },
    @{p = "/api/rapor/ay-ozet"; l = "Rapor Ay-Ozet" },
    @{p = "/api/rapor/personel-verimlilik"; l = "Personel Verimlilik" }
)
foreach ($a in $apis) {
    if (Test-API $a.p $a.l) { $apiOk++ } else { $apiFail++ }
}
Write-Host ""
$apiColor = if ($apiFail -eq 0) { "Green" } elseif ($apiFail -lt 3) { "Yellow" } else { "Red" }
Write-Host ("  Toplam: {0}/{1} basarili, {2} basarisiz" -f $apiOk, $apis.Count, $apiFail) -ForegroundColor $apiColor

# 3. VERITABANI & DOSYALAR
Section "3. VERITABANI ve DOSYALAR"
$dbFile = "$BASE\app\data\kamera-panel.db"
if (Test-Path $dbFile) {
    $sz = [math]::Round((Get-Item $dbFile).Length / 1KB, 1)
    Write-Host ("  [OK] SQLite DB: kamera-panel.db ({0} KB)" -f $sz) -ForegroundColor Green
}
else {
    Write-Host "  [??] SQLite DB bulunamadi" -ForegroundColor Yellow
}

$envFile = "$BASE\app\.env.local"
if (Test-Path $envFile) {
    Write-Host "  [OK] .env.local: mevcut" -ForegroundColor Green
    $envContent = Get-Content $envFile -Raw
    $keys = @("SUPABASE_URL", "SUPABASE_ANON", "OPENAI", "GEMINI", "DEEPSEEK", "JWT_SECRET", "INTERNAL_API_KEY")
    foreach ($k in $keys) {
        if ($envContent -match $k) {
            Write-Host ("  [OK] {0,-25} -> tanimli" -f $k) -ForegroundColor Green
        }
        else {
            Write-Host ("  [!!] {0,-25} -> EKSIK!" -f $k) -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host "  [!!] .env.local: BULUNAMADI!" -ForegroundColor Red
}

# 4. KRITIK DOSYALAR
Section "4. KRITIK DOSYALAR"
$kritik = @(
    "app\app\page.js",
    "app\lib\supabase.js",
    "app\lib\db.js",
    "app\lib\ai-services.js",
    "app\lib\auth.js",
    "app\middleware.js",
    "app\package.json"
)
foreach ($d in $kritik) {
    $full = "$BASE\$d"
    if (Test-Path $full) {
        $info = Get-Item $full
        $kb = [math]::Round($info.Length / 1KB, 0)
        if ($d -match "page.js") {
            $lines = (Get-Content $full).Count
            # BOM kontrol
            $bytes = [System.IO.File]::ReadAllBytes($full)
            $bom = ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
            $bomStr = if ($bom) { " [BOM=EVET - RISK!]" } else { " [BOM=YOK - OK]" }
            $bomColor = if ($bom) { "Red" } else { "Green" }
            Write-Host ("  [OK] {0,-30} {1} satir, {2} KB{3}" -f $d, $lines, $kb, $bomStr) -ForegroundColor $bomColor
        }
        else {
            Write-Host ("  [OK] {0,-30} {1} KB" -f $d, $kb) -ForegroundColor Green
        }
    }
    else {
        Write-Host ("  [!!] {0} - EKSIK!" -f $d) -ForegroundColor Red
    }
}

# 5. GIT DURUMU
Section "5. GIT DURUMU"
$branch = git -C $BASE branch --show-current 2>$null
Write-Host ("  [OK] Branch: {0}" -f $branch) -ForegroundColor Green
$dirty = git -C $BASE status --short 2>$null
if ($dirty) {
    Write-Host "  [??] Commit edilmemis degisiklikler:" -ForegroundColor Yellow
    $dirty | ForEach-Object { Write-Host ("    {0}" -f $_) -ForegroundColor Yellow }
}
else {
    Write-Host "  [OK] Working tree temiz - tum degisiklikler commit edildi" -ForegroundColor Green
}
Write-Host "  Son 5 commit:" -ForegroundColor White
git -C $BASE log --oneline -5 | ForEach-Object { Write-Host ("    {0}" -f $_) -ForegroundColor Gray }

# 6. PACKAGE.JSON KONTROLU
Section "6. PACKAGE.JSON & BAGIMLILIKLAR"
$pkgFile = "$BASE\app\package.json"
if (Test-Path $pkgFile) {
    $pkg = Get-Content $pkgFile -Raw | python -c "import sys,json; d=json.load(sys.stdin); deps=list(d.get('dependencies',{}).keys()); print(f'v{d[chr(118)+(chr(101)+chr(114)+chr(115)+chr(105)+chr(111)+chr(110))]} - {len(deps)} bagimlilik')" 2>$null
    Write-Host ("  [OK] package.json: {0}" -f $pkg) -ForegroundColor Green
    $nmPath = "$BASE\app\node_modules"
    if (Test-Path $nmPath) {
        Write-Host "  [OK] node_modules: mevcut" -ForegroundColor Green
    }
    else {
        Write-Host "  [!!] node_modules: YOK - 'npm install' calistir!" -ForegroundColor Red
    }
}

# OZET
Section "OZET RAPOR"
$sunucuStr = if ($port) { "AKTIF [OK]" } else { "KAPALI [!!]" }
$sunucuRenk = if ($port) { "Green" } else { "Red" }
$dirtyStr = if ($dirty) { "VAR - commit gerekli" } else { "YOK - temiz" }
$dirtyRenk = if ($dirty) { "Yellow" } else { "Green" }
Write-Host ("  Sunucu      : {0}" -f $sunucuStr  ) -ForegroundColor $sunucuRenk
Write-Host ("  API Basari  : {0}/{1}" -f $apiOk, $apis.Count) -ForegroundColor $apiColor
Write-Host ("  Git Branch  : {0}" -f $branch) -ForegroundColor White
Write-Host ("  Dirty Files : {0}" -f $dirtyStr) -ForegroundColor $dirtyRenk
Write-Host ""
Write-Host ("  Kontrol tamamlandi: {0}" -f (Get-Date -Format 'HH:mm:ss')) -ForegroundColor Cyan
Write-Host ""
