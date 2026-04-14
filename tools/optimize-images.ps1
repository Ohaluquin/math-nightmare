param(
  [ValidateSet("current", "half-all")]
  [string]$Profile = "current",
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
  $raw = & ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 $FilePath
  if (-not $raw) { throw "No se pudieron leer dimensiones de $FilePath" }
  $parts = $raw.Trim() -split "x"
  return @{ Width = [int]$parts[0]; Height = [int]$parts[1] }
}

function Get-RelativePath {
  param([string]$FilePath)
  return $FilePath.Replace($root + "\", "").Replace("\", "/")
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
  $args = @("-v", "error", "-y", "-i", $Source)
  if ($ScaleFilter) {
    $args += @("-vf", $ScaleFilter)
  }
  if ($Lossless) {
    $args += @("-c:v", "libwebp", "-lossless", "1", "-compression_level", "6")
  } else {
    $args += @("-c:v", "libwebp", "-quality", [string]$Quality, "-compression_level", "6")
  }
  $args += $tmpDest

  & ffmpeg @args *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Fallo optimizando $Source"
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

if ($Profile -eq "half-all") {
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
      if ($size.Height -gt 512) {
        Optimize-Image -Source $_.FullName -ScaleFilter "scale=-2:512:flags=lanczos" -Quality 88 -Kind "npc"
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


