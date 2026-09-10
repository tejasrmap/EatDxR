Add-Type -AssemblyName System.Drawing

function Draw-Madeater-Icon([int]$size, [string]$destPath, [bool]$isRound = $false, [bool]$isForegroundOnly = $false) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::Transparent)

    $scale = $size / 512.0

    if (-not $isForegroundOnly) {
        # Background: dark obsidian
        $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#08080a"))
        if ($isRound) {
            $g.FillEllipse($bgBrush, 0, 0, $size, $size)
        } else {
            $rad = [float](110.0 * $scale)
            $bgPath = New-Object System.Drawing.Drawing2D.GraphicsPath
            $bgPath.AddArc(0, 0, $rad * 2, $rad * 2, 180, 90)
            $bgPath.AddArc($size - ($rad * 2), 0, $rad * 2, $rad * 2, 270, 90)
            $bgPath.AddArc($size - ($rad * 2), $size - ($rad * 2), $rad * 2, $rad * 2, 0, 90)
            $bgPath.AddArc(0, $size - ($rad * 2), $rad * 2, $rad * 2, 90, 90)
            $bgPath.CloseFigure()
            $g.FillPath($bgBrush, $bgPath)
        }
    }

    # Emblem bounds
    $cx = [float]($size / 2.0)
    $cy = [float]($size / 2.0)

    # Gradient flame emblem
    $emblemW = [float](260.0 * $scale)
    $emblemH = [float](260.0 * $scale)
    $emblemRect = New-Object System.Drawing.RectangleF(($cx - ($emblemW / 2.0)), ($cy - ($emblemH / 2.0) + (10.0 * $scale)), $emblemW, $emblemH)
    
    $flameBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $emblemRect,
        [System.Drawing.ColorTranslator]::FromHtml("#ff7a00"),
        [System.Drawing.ColorTranslator]::FromHtml("#ef4444"),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )

    # Draw Iconic "M" with curves
    $mPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    
    $left = [float]($cx - (120.0 * $scale))
    $right = [float]($cx + (120.0 * $scale))
    $top = [float]($cy - (90.0 * $scale))
    $bottom = [float]($cy + (120.0 * $scale))
    $colW = [float](36.0 * $scale)
    $centerDip = [float]($cy + (20.0 * $scale))
    $innerTop = [float]($cy - (30.0 * $scale))

    # Points for custom M
    $pts = @(
        (New-Object System.Drawing.PointF($left, $bottom)),
        (New-Object System.Drawing.PointF($left, $top)),
        (New-Object System.Drawing.PointF(($left + $colW), $top)),
        (New-Object System.Drawing.PointF($cx, $centerDip)),
        (New-Object System.Drawing.PointF(($right - $colW), $top)),
        (New-Object System.Drawing.PointF($right, $top)),
        (New-Object System.Drawing.PointF($right, $bottom)),
        (New-Object System.Drawing.PointF(($right - $colW), $bottom)),
        (New-Object System.Drawing.PointF(($right - $colW), $innerTop)),
        (New-Object System.Drawing.PointF($cx, ($centerDip + (50.0 * $scale)))),
        (New-Object System.Drawing.PointF(($left + $colW), $innerTop)),
        (New-Object System.Drawing.PointF(($left + $colW), $bottom))
    )
    $mPath.AddPolygon($pts)
    $g.FillPath($flameBrush, $mPath)

    # Sparkle / Crown Star above the M
    $starX = $cx
    $starY = [float]($top - (25.0 * $scale))
    $starSize = [float](22.0 * $scale)
    $starBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#fbbf24"))
    $g.FillEllipse($starBrush, ($starX - ($starSize / 2.0)), ($starY - ($starSize / 2.0)), $starSize, $starSize)

    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sparkleSize = [float](12.0 * $scale)
    $g.FillEllipse($whiteBrush, ($starX - ($sparkleSize / 2.0)), ($starY - ($sparkleSize / 2.0)), $sparkleSize, $sparkleSize)

    $destDir = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated Icon: $destPath (${size}x${size})"
}

# 1. Launcher Mipmaps
$densities = @(
    @{ name="mdpi"; size=48; fgSize=108 },
    @{ name="hdpi"; size=72; fgSize=162 },
    @{ name="xhdpi"; size=96; fgSize=216 },
    @{ name="xxhdpi"; size=144; fgSize=324 },
    @{ name="xxxhdpi"; size=192; fgSize=432 }
)

foreach ($d in $densities) {
    $dir = "android\app\src\main\res\mipmap-$($d.name)"
    Draw-Madeater-Icon $d.size "$dir\ic_launcher.png" $false $false
    Draw-Madeater-Icon $d.size "$dir\ic_launcher_round.png" $true $false
    Draw-Madeater-Icon $d.fgSize "$dir\ic_launcher_foreground.png" $false $true
}

# 2. Splash Icon for Android 12+ SplashScreen API
Draw-Madeater-Icon 432 "android\app\src\main\res\drawable\splash_icon.png" $false $true
Draw-Madeater-Icon 432 "android\app\src\main\res\drawable-port-xxxhdpi\splash_icon.png" $false $true
Draw-Madeater-Icon 432 "android\app\src\main\res\drawable-port-xxhdpi\splash_icon.png" $false $true
Draw-Madeater-Icon 432 "android\app\src\main\res\drawable-port-xhdpi\splash_icon.png" $false $true
Draw-Madeater-Icon 432 "android\app\src\main\res\drawable-port-hdpi\splash_icon.png" $false $true
Draw-Madeater-Icon 432 "android\app\src\main\res\drawable-port-mdpi\splash_icon.png" $false $true

Write-Output "All icons generated successfully."
