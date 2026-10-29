param([Parameter(Mandatory=$true)][string]$SvgPath)
# Export the simple SVG primitives used by generate-architecture-diagrams.cjs.
Add-Type -AssemblyName System.Drawing
[xml]$diagram = Get-Content -Encoding utf8 -Raw -LiteralPath $SvgPath
$bitmap = New-Object System.Drawing.Bitmap ([int]$diagram.svg.width),([int]$diagram.svg.height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
try {
  foreach ($element in $diagram.DocumentElement.ChildNodes) {
    if ($element.LocalName -in @('title','desc')) { continue }
    $pen = $null
    $brush = $null
    if ($element.HasAttribute('stroke')) {
      $width = 1.0
      if ($element.HasAttribute('stroke-width')) { $width = [float]$element.GetAttribute('stroke-width') }
      $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($element.GetAttribute('stroke'))),$width
      if ($element.HasAttribute('stroke-dasharray')) { $pen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash }
    }
    if ($element.HasAttribute('fill') -and $element.GetAttribute('fill') -ne 'none') {
      $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($element.GetAttribute('fill')))
    }
    switch ($element.LocalName) {
      'rect' {
        $x=[float]$element.x; $y=[float]$element.y; $w=[float]$element.width; $h=[float]$element.height
        if ($brush) { $graphics.FillRectangle($brush,$x,$y,$w,$h) }
        if ($pen) { $graphics.DrawRectangle($pen,$x,$y,$w,$h) }
      }
      'line' { $graphics.DrawLine($pen,[float]$element.x1,[float]$element.y1,[float]$element.x2,[float]$element.y2) }
      'polyline' {
        [System.Drawing.PointF[]]$points = @($element.points -split ' ' | ForEach-Object {
          $pair = $_ -split ','
          New-Object System.Drawing.PointF ([float]$pair[0]),([float]$pair[1])
        })
        $graphics.DrawLines($pen,$points)
      }
      'polygon' {
        [System.Drawing.PointF[]]$points = @($element.points -split ' ' | ForEach-Object {
          $pair = $_ -split ','
          New-Object System.Drawing.PointF ([float]$pair[0]),([float]$pair[1])
        })
        if ($brush) { $graphics.FillPolygon($brush,$points) }
        if ($pen) { $graphics.DrawPolygon($pen,$points) }
      }
      'text' {
        $style = [System.Drawing.FontStyle]::Regular
        if ([int]$element.GetAttribute('font-weight') -ge 600) { $style = [System.Drawing.FontStyle]::Bold }
        $font = New-Object System.Drawing.Font 'Segoe UI',([float]$element.GetAttribute('font-size')),$style,([System.Drawing.GraphicsUnit]::Pixel)
        $ascent = $font.Size * $font.FontFamily.GetCellAscent($style) / $font.FontFamily.GetEmHeight($style)
        $graphics.DrawString($element.InnerText,$font,$brush,[float]$element.x,([float]$element.y - $ascent),[System.Drawing.StringFormat]::GenericTypographic)
        $font.Dispose()
      }
      default { throw "Unsupported SVG primitive: $($element.LocalName)" }
    }
    if ($pen) { $pen.Dispose() }
    if ($brush) { $brush.Dispose() }
  }
  $destination = [System.IO.Path]::ChangeExtension((Resolve-Path -LiteralPath $SvgPath).Path, '.png')
  $bitmap.Save($destination,[System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output $destination
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
