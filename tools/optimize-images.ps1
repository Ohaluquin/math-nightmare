param(
  [ValidateSet("current", "half-all")]
  [string]$Profile = "current",
  [string[]]$Paths,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$results = New-Object System.Collections.Generic.List[object]

$npcFolders = @(
  "assets/algebra/npcs",
  "assets/aritmetica/npcs",
  "assets/geometria/npcs"
)

$objectFolders = @(
  "assets/general/images/objects"
)

$spriteTargets = @{
  "assets/general/images/player/idle.webp" = 768
  "assets/general/images/player/walk.webp" = 768
  "assets/general/images/player/dead.webp" = 768
  "assets/algebra/minijuegos/minotauro/player_front.webp" = 256
  "assets/algebra/minijuegos/minotauro/player_back.webp" = 512
  "assets/algebra/minijuegos/minotauro/player_side.webp" = 512
  "assets/algebra/minijuegos/minotauro/minotauro_front.webp" = 256
  "assets/algebra/minijuegos/minotauro/minotauro_back.webp" = 768
  "assets/algebra/minijuegos/minotauro/minotauro_side.webp" = 768
  "assets/aritmetica/minijuegos/divisores/idle.webp" = 768
  "assets/aritmetica/minijuegos/divisores/walk.webp" = 768
  "assets/aritmetica/minijuegos/divisores/dead.webp" = 768
  "assets/aritmetica/minijuegos/divisores/hit.webp" = 192
  "assets/aritmetica/minijuegos/divisores/shot.webp" = 192
  "assets/aritmetica/minijuegos/signos/idle.webp" = 768
  "assets/aritmetica/minijuegos/signos/walk.webp" = 768
  "assets/aritmetica/minijuegos/signos/dead.webp" = 768
  "assets/aritmetica/minijuegos/jerarquia/walk_monster.webp" = 512
  "assets/aritmetica/minijuegos/restas/hunter.webp" = 256
  "assets/aritmetica/minijuegos/escalera/ahogado.webp" = 256
}

function Add-Result {
  param(
    [string]$Kind,
    [string]$Source,
    [int64]$SourceBytes,
    [int64]$DestBytes,
    [bool]$Scaled
  )

  $results.Add([PSCustomObject]@{
    Kind = $Kind
    Source = Get-RelativePath -FilePath $Source
    SourceBytes = $SourceBytes
    DestBytes = $DestBytes
    Scaled = $Scaled
  }) | Out-Null
}

function Get-ImageSize {
  param([string]$FilePath)
  $previousErrorAction = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $raw = & ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 $FilePath 2>$null
  } finally {
    $ErrorActionPreference = $previousErrorAction
  }
  if (-not $raw) {
    $fallback = Get-WebPCanvasSize -FilePath $FilePath
    if ($fallback) { return $fallback }
    throw "No se pudieron leer dimensiones de $FilePath"
  }
  $parts = $raw.Trim() -split "x"
  if ([int]$parts[0] -eq 0 -or [int]$parts[1] -eq 0) {
    $fallback = Get-WebPCanvasSize -FilePath $FilePath
    if ($fallback) { return $fallback }
  }
  return @{ Width = [int]$parts[0]; Height = [int]$parts[1] }
}

function Get-RelativePath {
  param([string]$FilePath)
  return $FilePath.Replace($root + "\", "").Replace("\", "/")
}

function Get-WebPChunks {
  param([byte[]]$Bytes)
  $chunks = New-Object System.Collections.Generic.List[object]
  if ($Bytes.Length -lt 20) { return $chunks }
  $riff = [Text.Encoding]::ASCII.GetString($Bytes, 0, 4)
  $webp = [Text.Encoding]::ASCII.GetString($Bytes, 8, 4)
  if ($riff -ne "RIFF" -or $webp -ne "WEBP") { return $chunks }

  $pos = 12
  while ($pos -le $Bytes.Length - 8) {
    $id = [Text.Encoding]::ASCII.GetString($Bytes, $pos, 4)
    $length = [BitConverter]::ToUInt32($Bytes, $pos + 4)
    $chunks.Add([PSCustomObject]@{
      Id = $id
      Offset = $pos
      Length = [int]$length
      DataOffset = $pos + 8
    }) | Out-Null
    $pos += 8 + [int]$length + ([int]$length % 2)
  }

  return $chunks
}

function Get-WebPCanvasSize {
  param([string]$FilePath)
  $bytes = [IO.File]::ReadAllBytes($FilePath)
  $vp8x = Get-WebPChunks -Bytes $bytes | Where-Object Id -eq "VP8X" | Select-Object -First 1
  if (-not $vp8x -or $vp8x.Length -lt 10) { return $null }

  $offset = $vp8x.DataOffset
  $width = 1 + ($bytes[$offset + 4] -bor ($bytes[$offset + 5] -shl 8) -bor ($bytes[$offset + 6] -shl 16))
  $height = 1 + ($bytes[$offset + 7] -bor ($bytes[$offset + 8] -shl 8) -bor ($bytes[$offset + 9] -shl 16))
  return @{ Width = [int]$width; Height = [int]$height }
}

function Get-SingleFrameAnimatedWebPInfo {
  param([string]$FilePath)
  $bytes = [IO.File]::ReadAllBytes($FilePath)
  $chunks = @(Get-WebPChunks -Bytes $bytes)
  $anmfChunks = @($chunks | Where-Object Id -eq "ANMF")
  if (-not ($chunks | Where-Object Id -eq "ANIM") -or $anmfChunks.Count -ne 1) { return $null }

  $canvas = Get-WebPCanvasSize -FilePath $FilePath
  if (-not $canvas) { return $null }

  $anmf = $anmfChunks[0]
  if ($anmf.Length -lt 24) { return $null }
  $header = $anmf.DataOffset
  $frameData = $header + 16
  $frameEnd = $anmf.DataOffset + $anmf.Length

  $nestedOffset = $frameData
  $imageChunk = $null
  while ($nestedOffset -le $frameEnd - 8) {
    $id = [Text.Encoding]::ASCII.GetString($bytes, $nestedOffset, 4)
    $length = [BitConverter]::ToUInt32($bytes, $nestedOffset + 4)
    if ($id -eq "VP8 " -or $id -eq "VP8L") {
      $imageChunk = [PSCustomObject]@{ Offset = $nestedOffset; Length = [int]$length }
      break
    }
    $nestedOffset += 8 + [int]$length + ([int]$length % 2)
  }
  if (-not $imageChunk) { return $null }

  return [PSCustomObject]@{
    Bytes = $bytes
    CanvasWidth = $canvas.Width
    CanvasHeight = $canvas.Height
    X = ($bytes[$header] -bor ($bytes[$header + 1] -shl 8) -bor ($bytes[$header + 2] -shl 16)) * 2
    Y = ($bytes[$header + 3] -bor ($bytes[$header + 4] -shl 8) -bor ($bytes[$header + 5] -shl 16)) * 2
    ImageChunkOffset = $imageChunk.Offset
    ImageChunkLength = 8 + $imageChunk.Length + ($imageChunk.Length % 2)
  }
}

function Test-SingleFrameAnimatedWebP {
  param([string]$FilePath)
  return [bool](Get-SingleFrameAnimatedWebPInfo -FilePath $FilePath)
}

function Convert-SingleFrameAnimatedWebP {
  param(
    [string]$Source,
    [string]$Destination
  )

  $info = Get-SingleFrameAnimatedWebPInfo -FilePath $Source
  if (-not $info) { return $false }

  $framePath = "$Source.frame.tmp.webp"
  $riffSize = 4 + $info.ImageChunkLength
  $frameBytes = New-Object byte[] (8 + $riffSize)
  [Text.Encoding]::ASCII.GetBytes("RIFF").CopyTo($frameBytes, 0)
  [BitConverter]::GetBytes([uint32]$riffSize).CopyTo($frameBytes, 4)
  [Text.Encoding]::ASCII.GetBytes("WEBP").CopyTo($frameBytes, 8)
  [Array]::Copy($info.Bytes, $info.ImageChunkOffset, $frameBytes, 12, $info.ImageChunkLength)
  [IO.File]::WriteAllBytes($framePath, $frameBytes)

  try {
    $canvas = "$($info.CanvasWidth)x$($info.CanvasHeight)"
    $filter = "[0:v]format=rgba,colorchannelmixer=aa=0[base];[1:v]format=rgba[fg];[base][fg]overlay=$($info.X):$($info.Y):format=auto"
    & ffmpeg -v error -y -f lavfi -i "nullsrc=s=$canvas" -i $framePath -filter_complex $filter -frames:v 1 -c:v libwebp -quality 88 -compression_level 6 $Destination *> $null
    if ($LASTEXITCODE -ne 0) {
      throw "Fallo convirtiendo WebP animado de un frame: $Source"
    }
  } finally {
    if (Test-Path $framePath) { Remove-Item -Force $framePath }
  }

  return $true
}

function Optimize-Image {
  param(
    [string]$Source,
    [string]$ScaleFilter,
    [int]$Quality,
    [switch]$Lossless,
    [string]$Kind
  )

  $item = Get-Item $Source
  $sourceLength = [int64]$item.Length
  $tmpDest = "$Source.tmp.webp"
  $inputSource = $Source
  $intermediateSource = $null

  if (Test-SingleFrameAnimatedWebP -FilePath $Source) {
    $intermediateSource = "$Source.static.tmp.webp"
    Convert-SingleFrameAnimatedWebP -Source $Source -Destination $intermediateSource | Out-Null
    $inputSource = $intermediateSource
  }

  $args = @("-v", "error", "-y", "-i", $inputSource)
  if ($ScaleFilter) {
    $args += @("-vf", $ScaleFilter)
  }
  if ($Lossless) {
    $args += @("-c:v", "libwebp", "-lossless", "1", "-compression_level", "6")
  } else {
    $args += @("-c:v", "libwebp", "-quality", [string]$Quality, "-compression_level", "6")
  }
  $args += $tmpDest

  try {
    & ffmpeg @args *> $null
    if ($LASTEXITCODE -ne 0) {
      throw "Fallo optimizando $Source"
    }
  } finally {
    if ($intermediateSource -and (Test-Path $intermediateSource)) {
      Remove-Item -Force $intermediateSource
    }
  }

  if ($DryRun) {
    $tmpItem = Get-Item $tmpDest
    $tmpLength = [int64]$tmpItem.Length
    Remove-Item -Force $tmpDest
    Add-Result -Kind $Kind -Source $Source -SourceBytes $sourceLength -DestBytes $tmpLength -Scaled ([bool]$ScaleFilter)
    return
  }

  Move-Item -Force -Path $tmpDest -Destination $Source
  $dest = Get-Item $Source

  Add-Result -Kind $Kind -Source $Source -SourceBytes $sourceLength -DestBytes ([int64]$dest.Length) -Scaled ([bool]$ScaleFilter)
}

function Optimize-TargetedImage {
  param([string]$Path)

  $resolved = Resolve-Path -LiteralPath $Path -ErrorAction Stop
  $fullPath = $resolved.Path
  $relativePath = Get-RelativePath -FilePath $fullPath
  $normalizedPath = $relativePath.Replace('\', '/')
  $size = Get-ImageSize -FilePath $fullPath

  if ($normalizedPath -like "assets/*/hojas/*") {
    $maxWidth = 1024
    $maxHeight = 1536
    $needsResize = $size.Width -gt $maxWidth -or $size.Height -gt $maxHeight
    $scaleFilter = $null

    if ($needsResize) {
      $widthRatio = $maxWidth / [double]$size.Width
      $heightRatio = $maxHeight / [double]$size.Height
      $ratio = [Math]::Min($widthRatio, $heightRatio)
      $targetWidth = [Math]::Max(2, [int]([Math]::Round(($size.Width * $ratio) / 2) * 2))
      $targetHeight = [Math]::Max(2, [int]([Math]::Round(($size.Height * $ratio) / 2) * 2))
      $scaleFilter = "scale=${targetWidth}:${targetHeight}:flags=lanczos"
    }

    Optimize-Image -Source $fullPath -ScaleFilter $scaleFilter -Quality 86 -Kind "sheet"
    return
  }

  throw "No hay una regla de optimización configurada para $relativePath"
}

if ($Paths -and $Paths.Count -gt 0) {
  foreach ($path in $Paths) {
    Optimize-TargetedImage -Path $path
  }
} elseif ($Profile -eq "half-all") {
  Get-ChildItem -Path (Join-Path $root "assets") -Recurse -File -Include *.webp, *.png, *.jpg, *.jpeg |
    Where-Object { $_.Name -notlike "*.tmp.webp" } |
    ForEach-Object {
    $size = Get-ImageSize -FilePath $_.FullName
    $targetWidth = [Math]::Max(1, [int][Math]::Floor($size.Width / 2))
    $targetHeight = [Math]::Max(1, [int][Math]::Floor($size.Height / 2))
    if ($targetWidth -lt $size.Width -or $targetHeight -lt $size.Height) {
      Optimize-Image -Source $_.FullName -ScaleFilter "scale=${targetWidth}:${targetHeight}:flags=lanczos" -Quality 90 -Kind "half-all"
    }
  }
} else {
  foreach ($relativeFolder in $npcFolders) {
    $folder = Join-Path $root $relativeFolder
    if (-not (Test-Path $folder)) { continue }
    Get-ChildItem -Path $folder -Filter *.webp -File | ForEach-Object {
      $size = Get-ImageSize -FilePath $_.FullName
      if ($size.Height -gt 512 -or (Test-SingleFrameAnimatedWebP -FilePath $_.FullName)) {
        $scale = if ($size.Height -gt 512) { "scale=-2:512:flags=lanczos" } else { $null }
        Optimize-Image -Source $_.FullName -ScaleFilter $scale -Quality 88 -Kind "npc"
      }
    }
  }

  foreach ($relativeFolder in $objectFolders) {
    $folder = Join-Path $root $relativeFolder
    if (-not (Test-Path $folder)) { continue }
    Get-ChildItem -Path $folder -Filter *.webp -File | ForEach-Object {
      $size = Get-ImageSize -FilePath $_.FullName
      $maxSide = [Math]::Max($size.Width, $size.Height)
      if ($maxSide -gt 256) {
        $scale = if ($size.Width -ge $size.Height) { "scale=256:-2:flags=lanczos" } else { "scale=-2:256:flags=lanczos" }
        Optimize-Image -Source $_.FullName -ScaleFilter $scale -Quality 92 -Kind "object"
      }
    }
  }

  foreach ($relativePath in $spriteTargets.Keys) {
    $path = Join-Path $root $relativePath.Replace('/', '\')
    if (-not (Test-Path $path)) { continue }
    $size = Get-ImageSize -FilePath $path
    $targetHeight = $spriteTargets[$relativePath]
    if ($size.Height -gt $targetHeight) {
      $scale = "scale=-2:${targetHeight}:flags=lanczos"
      Optimize-Image -Source $path -ScaleFilter $scale -Quality 92 -Kind "sprite"
    }
  }
}

$sourceBytes = ($results | Measure-Object SourceBytes -Sum).Sum
$destBytes = ($results | Measure-Object DestBytes -Sum).Sum
$savedBytes = $sourceBytes - $destBytes
$savedPercent = if ($sourceBytes) { [math]::Round(($savedBytes / $sourceBytes) * 100, 2) } else { 0 }

[PSCustomObject]@{
  Processed = $results.Count
  Scaled = @($results | Where-Object Scaled).Count
  SourceMB = [math]::Round($sourceBytes / 1MB, 2)
  WebPMB = [math]::Round($destBytes / 1MB, 2)
  SavedMB = [math]::Round($savedBytes / 1MB, 2)
  SavedPercent = $savedPercent
}


