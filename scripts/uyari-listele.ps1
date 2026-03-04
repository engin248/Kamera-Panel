$appDir = "C:\Users\Admin\Desktop\Kamera-Panel\app"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  UYARI KAYNAKLARI -- SATIR BAZLI INCELEME" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$uyarilar = @(
    @{f = "app\api\admin\supabase-migrate\route.js"; l = 91; tip = "[GERCEK DEGISKEN]" },
    @{f = "app\api\chatbot\route.js"; l = 82; tip = "[Yorum Satiri   ]" },
    @{f = "app\api\models\[id]\operations\route.js"; l = 54; tip = "[Yorum Satiri   ]" },
    @{f = "app\components\pages\OrdersPage.jsx"; l = 392; tip = "[JSX Placeholder ]" },
    @{f = "app\components\pages\OrdersPage.jsx"; l = 406; tip = "[JSX Placeholder ]" },
    @{f = "app\operator\page.js"; l = 8; tip = "[Yorum Satiri   ]" },
    @{f = "app\page.js"; l = 788; tip = "[JSX Metin      ]" },
    @{f = "app\page.js"; l = 2617; tip = "[JSX Metin      ]" },
    @{f = "app\page.js"; l = 6281; tip = "[GERCEK DEGISKEN]" },
    @{f = "app\page.js"; l = 6282; tip = "[GERCEK DEGISKEN]" },
    @{f = "app\page.js"; l = 10169; tip = "[JSX Placeholder ]" },
    @{f = "app\page.js"; l = 10183; tip = "[JSX Placeholder ]" },
    @{f = "app\page.js"; l = 11270; tip = "[JSX Metin      ]" },
    @{f = "instrumentation.js"; l = 41; tip = "[Yorum Satiri   ]" }
)

$i = 1
foreach ($u in $uyarilar) {
    $fullPath = Join-Path $appDir $u.f
    $lines = Get-Content $fullPath -ErrorAction SilentlyContinue
    $lineContent = if ($lines -and $u.l -le $lines.Count) { $lines[$u.l - 1].Trim() } else { "??" }
    $renk = if ($u.tip -like "*GERCEK*") { "Red" } elseif ($u.tip -like "*Yorum*") { "Yellow" } else { "DarkYellow" }
    Write-Host ""
    Write-Host ("{0:D2}. {1}  {2}  satir:{3}" -f $i, $u.tip, $u.f, $u.l) -ForegroundColor $renk
    Write-Host ("    >> {0}" -f $lineContent.Substring(0, [Math]::Min($lineContent.Length, 120))) -ForegroundColor White
    $i++
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  OZET" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  [GERCEK DEGISKEN] 3 adet -- KESIN duzeltilmeli" -ForegroundColor Red
Write-Host "  [YORUM SATIRI]    4 adet -- Guvenli duzeltme"  -ForegroundColor Yellow
Write-Host "  [JSX PLACEHOLDER] 4 adet -- UI etkilenmez"     -ForegroundColor DarkYellow
Write-Host "  [JSX METIN]       3 adet -- Kullaniciya goster" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "  AYRICA:" -ForegroundColor White
Write-Host "  - node-cron paketi eksik (npm install node-cron gerekli)" -ForegroundColor Yellow
Write-Host "  - page.js 721KB buyuk (mimari konu, bu sohbette dokunmuyoruz)" -ForegroundColor Gray
Write-Host ""
