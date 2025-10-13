# Generate PWA Icons from SVG placeholder
# Requires ImageMagick: https://imagemagick.org/

$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)
$iconDir = "public"
$baseColor = "#3B82F6"
$gradientEnd = "#14B8A6"

# Create SVG template
$svgTemplate = @"
<svg width="[SIZE]" height="[SIZE]" viewBox="0 0 [SIZE] [SIZE]" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="[SIZE]" height="[SIZE]" rx="[RADIUS]" fill="url(#gradient)"/>
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="[SIZE]" y2="[SIZE]">
      <stop offset="0%" stop-color="$baseColor"/>
      <stop offset="100%" stop-color="$gradientEnd"/>
    </linearGradient>
  </defs>
  <text x="50%" y="60%" font-family="Arial" font-size="[FONTSIZE]" font-weight="bold" fill="white" text-anchor="middle">S</text>
</svg>
"@

Write-Host "🎨 Generating PWA icons..." -ForegroundColor Cyan

foreach ($size in $sizes) {
    $radius = [math]::Round($size * 0.22)  # 22% radius for rounded corners
    $fontSize = [math]::Round($size * 0.45)  # 45% of size for font
    
    $svg = $svgTemplate -replace '\[SIZE\]', $size -replace '\[RADIUS\]', $radius -replace '\[FONTSIZE\]', $fontSize
    
    $tempSvgFile = "temp-icon-$size.svg"
    $outputFile = "$iconDir/icon-${size}x${size}.png"
    
    # Write SVG
    $svg | Out-File -FilePath $tempSvgFile -Encoding UTF8
    
    # Check if ImageMagick is available
    $magickPath = Get-Command magick -ErrorAction SilentlyContinue
    
    if ($magickPath) {
        # Convert with ImageMagick
        & magick convert -background none $tempSvgFile $outputFile
        Write-Host "  ✅ Generated $outputFile" -ForegroundColor Green
    } else {
        # Fallback: Copy placeholder
        Write-Host "  ⚠️  ImageMagick not found, using SVG placeholder for $outputFile" -ForegroundColor Yellow
        Copy-Item $tempSvgFile $outputFile
    }
    
    # Cleanup temp SVG
    Remove-Item $tempSvgFile -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✨ PWA icons generation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Note: If you don't have ImageMagick installed:" -ForegroundColor Cyan
Write-Host "   1. Install: winget install ImageMagick.ImageMagick" -ForegroundColor White
Write-Host "   2. Or download from: https://imagemagick.org/script/download.php" -ForegroundColor White
Write-Host "   3. Then re-run this script" -ForegroundColor White
