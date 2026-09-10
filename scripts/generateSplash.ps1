Add-Type -AssemblyName System.Drawing

function Generate-Splash([int]$w, [int]$h, [string]$destPath) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # 1. Background #050505
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#050505"))
    $g.FillRectangle($bgBrush, 0, 0, $w, $h)

    # 2. Centered Logo Icon
    $scale = [Math]::Min($w, $h) / 480.0
    if ($scale -lt 0.4) { $scale = 0.4 }
    if ($scale -gt 2.5) { $scale = 2.5 }

    $cx = [float]($w / 2.0)
    $cy = [float](($h / 2.0) - (20.0 * $scale))

    # Rounded Squircle Icon Base
    $iconSize = [float](100.0 * $scale)
    $iconRect = New-Object System.Drawing.RectangleF(($cx - ($iconSize / 2.0)), ($cy - $iconSize - (10.0 * $scale)), $iconSize, $iconSize)
    $iconBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $iconRect,
        [System.Drawing.ColorTranslator]::FromHtml("#ff7a00"),
        [System.Drawing.ColorTranslator]::FromHtml("#ef4444"),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )

    # Draw rounded emblem
    $rad = [float](24.0 * $scale)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($iconRect.X, $iconRect.Y, $rad * 2, $rad * 2, 180, 90)
    $path.AddArc($iconRect.Right - ($rad * 2), $iconRect.Y, $rad * 2, $rad * 2, 270, 90)
    $path.AddArc($iconRect.Right - ($rad * 2), $iconRect.Bottom - ($rad * 2), $rad * 2, $rad * 2, 0, 90)
    $path.AddArc($iconRect.X, $iconRect.Bottom - ($rad * 2), $rad * 2, $rad * 2, 90, 90)
    $path.CloseFigure()
    $g.FillPath($iconBrush, $path)

    # White Stylized Fork / Emblem
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $forkW = [float](6.0 * $scale)
    $forkH = [float](34.0 * $scale)
    $forkY = [float]($iconRect.Y + (30.0 * $scale))
    $g.FillRectangle($whiteBrush, ($cx - ($forkW / 2.0) - (14.0 * $scale)), $forkY, $forkW, $forkH)
    $g.FillRectangle($whiteBrush, ($cx - ($forkW / 2.0)), ($forkY - (4.0 * $scale)), $forkW, ($forkH + (4.0 * $scale)))
    $g.FillRectangle($whiteBrush, ($cx - ($forkW / 2.0) + (14.0 * $scale)), $forkY, $forkW, $forkH)

    # 3. Typography: MADEATER.
    $fontSize = [float](32.0 * $scale)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    
    $madSize = $g.MeasureString("MAD", $font)
    $eaterSize = $g.MeasureString("EATER", $font)
    $totalTextW = $madSize.Width + $eaterSize.Width - (8.0 * $scale)
    $textX = [float]($cx - ($totalTextW / 2.0))
    $textY = [float]($cy + (18.0 * $scale))

    $whiteTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#FFFFFF"))
    $orangeTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#F97316"))

    $g.DrawString("MAD", $font, $whiteTextBrush, $textX, $textY)
    $g.DrawString("EATER", $font, $orangeTextBrush, ($textX + $madSize.Width - (8.0 * $scale)), $textY)

    # Dot
    $dotSize = [float](6.0 * $scale)
    $g.FillEllipse($orangeTextBrush, ($textX + $totalTextW - (2.0 * $scale)), ($textY + $madSize.Height - (14.0 * $scale)), $dotSize, $dotSize)

    # 4. Bottom "from MADEATER" like Instagram
    $fromFont = New-Object System.Drawing.Font("Arial", [float](10.0 * $scale), [System.Drawing.FontStyle]::Regular)
    $brandFont = New-Object System.Drawing.Font("Arial", [float](12.0 * $scale), [System.Drawing.FontStyle]::Bold)
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#71717A"))
    
    $fromSize = $g.MeasureString("from", $fromFont)
    $madeaterSubSize = $g.MeasureString("MADEATER", $brandFont)
    
    $bottomY = [float]($h - (70.0 * $scale))
    $g.DrawString("from", $fromFont, $subBrush, [float]($cx - ($fromSize.Width / 2.0)), $bottomY)
    $g.DrawString("MADEATER", $brandFont, $orangeTextBrush, [float]($cx - ($madeaterSubSize.Width / 2.0)), [float]($bottomY + (16.0 * $scale)))

    $destDir = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated $destPath (${w}x${h})"
}

# Generate for all Android drawable targets
Generate-Splash 480 800 "android\app\src\main\res\drawable\splash.png"
Generate-Splash 800 480 "android\app\src\main\res\drawable-land-mdpi\splash.png"
Generate-Splash 480 800 "android\app\src\main\res\drawable-port-mdpi\splash.png"

Generate-Splash 1280 720 "android\app\src\main\res\drawable-land-hdpi\splash.png"
Generate-Splash 720 1280 "android\app\src\main\res\drawable-port-hdpi\splash.png"

Generate-Splash 1600 960 "android\app\src\main\res\drawable-land-xhdpi\splash.png"
Generate-Splash 960 1600 "android\app\src\main\res\drawable-port-xhdpi\splash.png"

Generate-Splash 1920 1080 "android\app\src\main\res\drawable-land-xxhdpi\splash.png"
Generate-Splash 1080 1920 "android\app\src\main\res\drawable-port-xxhdpi\splash.png"

Generate-Splash 2560 1440 "android\app\src\main\res\drawable-land-xxxhdpi\splash.png"
Generate-Splash 1440 2560 "android\app\src\main\res\drawable-port-xxxhdpi\splash.png"
