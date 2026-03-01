$body = @{
  model = "sonar"
  messages = @(
    @{
      role = "user"
      content = "Next.js 14 ve SQLite ile fason tekstil fabrikasi chatbotu yapiyoruz. Mevcut AI: Gemini 2.0 Flash ve GPT-4o-mini. 8 konuda net karar + gerekce: 1-Provider secimi, 2-DB context injection (fresh/cache/hybrid), 3-Turkce intent detection, 4-Session yonetimi, 5-Streaming vs single-call, 6-Rate limiting, 7-Fallback, 8-UI pozisyonu. Kisa net Turkce."
    }
  )
  max_tokens = 600
}

$bodyJson = $body | ConvertTo-Json -Depth 5 -Compress

try {
  $r = Invoke-RestMethod `
    -Uri "https://api.perplexity.ai/chat/completions" `
    -Method POST `
    -Headers @{
      "Content-Type" = "application/json"
      "Authorization" = "Bearer $env:PERPLEXITY_API_KEY"
    } `
    -Body $bodyJson `
    -TimeoutSec 25
  Write-Output "=== PERPLEXITY ANALIZI ==="
  Write-Output $r.choices[0].message.content
} catch {
  Write-Output "PERPLEXITY HATA: $($_.Exception.Message)"
}
