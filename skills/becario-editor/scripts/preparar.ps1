# becario-editor v1.0 · comprueba e instala las herramientas del editor en Windows.
# Uso:  powershell -NoProfile -ExecutionPolicy Bypass -File preparar.ps1 comprobar
#       powershell -NoProfile -ExecutionPolicy Bypass -File preparar.ps1 instalar [-Motor hyperframes|remotion] [-SinSkills]
# Todo va a %USERPROFILE%\.becario-editor. Con winget (viene con Windows 10 y 11) se instalan Node.js, FFmpeg y Python;
# si winget no está o falla, se usan versiones portables comprobadas con su sha256 (Node con SHASUMS256, uv con su .sha256).
param([string]$Orden = "comprobar", [string]$Motor = "", [switch]$SinSkills)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if ($env:BECARIO_EDITOR_HOME) { $Base = $env:BECARIO_EDITOR_HOME } else { $Base = Join-Path $env:USERPROFILE ".becario-editor" }
$Aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$Skill = Split-Path -Parent $Aqui
$HfVersion = "0.9.5"; $GsapVersion = "3.15.0"; $FwVersion = "1.2.1"
$env:npm_config_cache = Join-Path $Base "npm-cache"
$env:HYPERFRAMES_NO_TELEMETRY = "1"
$env:npm_config_update_notifier = "false"; $env:npm_config_fund = "false"; $env:npm_config_audit = "false"
New-Item -ItemType Directory -Force -Path $Base | Out-Null
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { $Arq = "arm64"; $UvArq = "aarch64" } else { $Arq = "x64"; $UvArq = "x86_64" }
$Winget = Get-Command winget.exe -ErrorAction SilentlyContinue

$script:Node = $null; $script:Npm = $null; $script:Ffmpeg = $null; $script:Ffprobe = $null
$script:PySis = $null; $script:ChromeFijo = $null

function Refrescar-Path {
    $m = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $u = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$m;$u;$env:Path"
}

function Bajar($url, $destino) {
    try { Invoke-WebRequest -Uri $url -OutFile $destino -UseBasicParsing -ErrorAction Stop; return $true } catch { return $false }
}

function Hash($ruta) { return (Get-FileHash -Algorithm SHA256 -Path $ruta).Hash.ToLower() }

function Instalar-Winget($id, $extra) {
    if (-not $Winget) { return $false }
    $argumentos = @("install", "-e", "--id", $id, "--silent", "--accept-source-agreements", "--accept-package-agreements", "--disable-interactivity") + $extra
    & winget.exe @argumentos *> $null
    Refrescar-Path
    return $true
}

# ------------------------------------------------------------ buscar lo que ya hay
function Version-Node($exe) {
    try { $v = & $exe -p "process.versions.node.split('.')[0]" 2>$null; return [int]$v } catch { return 0 }
}

function Buscar-Node {
    $cands = @((Join-Path $Base "node\node.exe"))
    $cands += @(Get-Command node.exe -All -ErrorAction SilentlyContinue | ForEach-Object { $_.Source })
    $cands += @("$env:ProgramFiles\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe")
    foreach ($c in $cands) {
        if ($c -and (Test-Path $c) -and ((Version-Node $c) -ge 22)) {
            $script:Node = $c
            $script:Npm = Join-Path (Split-Path $c) "npm.cmd"
            return $true
        }
    }
    $script:Node = $null; return $false
}

function Buscar-Ffmpeg {
    $dirs = @((Join-Path $Base "ffmpeg"))
    $dirs += @(Get-Command ffmpeg.exe -All -ErrorAction SilentlyContinue | ForEach-Object { Split-Path $_.Source })
    $dirs += @("$env:LOCALAPPDATA\Microsoft\WinGet\Links")
    $paquetes = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages"
    if (Test-Path $paquetes) {
        $dirs += @(Get-ChildItem -Path $paquetes -Filter ffmpeg.exe -Recurse -ErrorAction SilentlyContinue | ForEach-Object { $_.DirectoryName })
    }
    foreach ($d in $dirs) {
        $f = Join-Path $d "ffmpeg.exe"; $p = Join-Path $d "ffprobe.exe"
        if ((Test-Path $f) -and (Test-Path $p)) {
            & $f -version *> $null
            if ($LASTEXITCODE -eq 0) { $script:Ffmpeg = $f; $script:Ffprobe = $p; return $true }
        }
    }
    $script:Ffmpeg = $null; return $false
}

function Python-Valido($exe) {
    if (-not $exe -or $exe -like "*WindowsApps*") { return $false }
    & $exe -c "import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)" *> $null
    return ($LASTEXITCODE -eq 0)
}

function Buscar-Python {
    $cands = @()
    $py = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($py) {
        foreach ($v in @("3.12", "3.11", "3.13", "3.10")) {
            $r = & py.exe "-$v" -c "import sys; print(sys.executable)" 2>$null
            if ($LASTEXITCODE -eq 0 -and $r) { $cands += "$r".Trim() }
        }
    }
    foreach ($v in @("312", "311", "313", "310")) { $cands += "$env:LOCALAPPDATA\Programs\Python\Python$v\python.exe" }
    $cands += @(Get-Command python.exe -All -ErrorAction SilentlyContinue | ForEach-Object { $_.Source })
    foreach ($c in $cands) { if ((Test-Path $c) -and (Python-Valido $c)) { $script:PySis = $c; return $true } }
    $script:PySis = $null; return $false
}

function Venv-Ok {
    $p = Join-Path $Base "venv\Scripts\python.exe"
    if (-not (Test-Path $p)) { return $false }
    & $p -c "import faster_whisper" *> $null
    return ($LASTEXITCODE -eq 0)
}

function Buscar-Chrome {
    $cands = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
               "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
               "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe")
    foreach ($c in $cands) { if (Test-Path $c) { return $c } }
    return $null
}

function Motor-Actual {
    if ($Motor) { return $Motor }
    $r = Join-Path $Base "rutas.json"
    if ((Test-Path $r) -and ((Get-Content $r -Raw) -match '"motor":\s*"remotion"')) { return "remotion" }
    return "hyperframes"
}

function Motor-Ok {
    if ((Motor-Actual) -eq "remotion") { return (Test-Path (Join-Path $Base "remotion\node_modules\@remotion\cli\remotion-cli.js")) }
    return ((Test-Path (Join-Path $Base "hyperframes\node_modules\hyperframes\bin\hyperframes.mjs")) -and
            (Test-Path (Join-Path $Base "hyperframes\node_modules\gsap\dist\gsap.min.js")))
}

function Informe {
    Buscar-Node | Out-Null; Buscar-Ffmpeg | Out-Null; Buscar-Python | Out-Null
    $w = "no"; if ($Winget) { $w = "si" }
    Write-Host "Sistema: Windows $Arq · winget: $w · carpeta de herramientas: $Base"
    if ($script:Node) { Write-Host ("OK    Node.js " + (& $script:Node -v) + " ($($script:Node))") } else { Write-Host "FALTA Node.js 22 o posterior" }
    if ($script:Ffmpeg) { Write-Host "OK    FFmpeg ($($script:Ffmpeg))" } else { Write-Host "FALTA FFmpeg y FFprobe" }
    if (Venv-Ok) { Write-Host "OK    Whisper (faster-whisper en $Base\venv)" }
    elseif ($script:PySis) { Write-Host "FALTA Whisper (faster-whisper; se instala con $($script:PySis))" }
    else { Write-Host "FALTA Whisper (faster-whisper) y Python 3.10-3.13" }
    $m = Motor-Actual
    if (Motor-Ok) { Write-Host "OK    $m ($Base\$m)" } else { Write-Host "FALTA $m (motor de montaje)" }
    if (Test-Path (Join-Path $Base "modelos\whisper-small\model.bin")) { Write-Host "OK    modelo de voz Whisper small" }
    else { Write-Host "AVISO el modelo de voz (unos 240 MB) se descarga en la prueba" }
}

# ------------------------------------------------------------ instalar
function Instalar-Node {
    if (Buscar-Node) { return $true }
    if ($Winget) {
        Write-Host "· Instalando Node.js con winget (si Windows pide permiso, acepta)..."
        Instalar-Winget "OpenJS.NodeJS.LTS" @() | Out-Null
        if (Buscar-Node) { return $true }
    }
    Write-Host "· Descargando Node.js 22 portable (nodejs.org, comprobado con SHASUMS256)..."
    $tmp = Join-Path $env:TEMP ("node-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    if (-not (Bajar "https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt" "$tmp\SHASUMS256.txt")) { Write-Host "FALLO no se pudo descargar la lista de Node.js"; return $false }
    $linea = Get-Content "$tmp\SHASUMS256.txt" | Where-Object { $_ -match "node-v22\.[0-9.]+-win-$Arq\.zip$" } | Select-Object -First 1
    if (-not $linea) { Write-Host "FALLO no hay Node.js 22 para win-$Arq"; return $false }
    $suma, $fich = $linea -split "\s+"
    if (-not (Bajar "https://nodejs.org/dist/latest-v22.x/$fich" "$tmp\$fich")) { Write-Host "FALLO no se pudo descargar $fich"; return $false }
    if ((Hash "$tmp\$fich") -ne $suma.ToLower()) { Write-Host "FALLO Node.js no coincide con su sha256; descartado"; Remove-Item -Recurse -Force $tmp; return $false }
    Expand-Archive -Path "$tmp\$fich" -DestinationPath $tmp -Force
    $dentro = Get-ChildItem -Path $tmp -Directory | Where-Object { $_.Name -like "node-v22*" } | Select-Object -First 1
    $destino = Join-Path $Base "node"
    if (Test-Path $destino) { Remove-Item -Recurse -Force $destino }
    Move-Item -Path $dentro.FullName -Destination $destino
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    return (Buscar-Node)
}

function Instalar-Ffmpeg {
    if (Buscar-Ffmpeg) { return $true }
    if ($Winget) {
        Write-Host "· Instalando FFmpeg con winget (Gyan.FFmpeg, sin administrador)..."
        Instalar-Winget "Gyan.FFmpeg" @() | Out-Null
        if (Buscar-Ffmpeg) { return $true }
    }
    Write-Host "· Instalando FFmpeg y FFprobe desde npm (versión ligera)..."
    $pref = Join-Path $Base "ffmpeg-npm"; $dest = Join-Path $Base "ffmpeg"
    New-Item -ItemType Directory -Force -Path $pref, $dest | Out-Null
    & $script:Npm install -q --prefix $pref "@ffmpeg-installer/ffmpeg" "@ffprobe-installer/ffprobe" *> $null
    Push-Location $pref
    $f = & $script:Node -p "require('@ffmpeg-installer/ffmpeg').path" 2>$null
    $p = & $script:Node -p "require('@ffprobe-installer/ffprobe').path" 2>$null
    Pop-Location
    if (-not ($f -and (Test-Path $f) -and $p -and (Test-Path $p))) { Write-Host "FALLO npm no pudo instalar FFmpeg"; return $false }
    Copy-Item $f (Join-Path $dest "ffmpeg.exe") -Force; Copy-Item $p (Join-Path $dest "ffprobe.exe") -Force
    Remove-Item -Recurse -Force $pref -ErrorAction SilentlyContinue
    return (Buscar-Ffmpeg)
}

function Conseguir-Uv {
    $local = Join-Path $Base "uv\uv.exe"
    if (Test-Path $local) { return $local }
    $g = Get-Command uv.exe -ErrorAction SilentlyContinue
    if ($g) { return $g.Source }
    Write-Host "· Descargando uv (gestor de Python de Astral, comprobado con su sha256)..."
    $nombre = "uv-$UvArq-pc-windows-msvc.zip"
    $tmp = Join-Path $env:TEMP ("uv-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    $url = "https://github.com/astral-sh/uv/releases/latest/download/$nombre"
    if (-not ((Bajar $url "$tmp\$nombre") -and (Bajar "$url.sha256" "$tmp\uv.sha256"))) { return $null }
    $esperado = ((Get-Content "$tmp\uv.sha256" -Raw).Trim() -split "\s+")[0].ToLower()
    if ((Hash "$tmp\$nombre") -ne $esperado) { Write-Host "FALLO uv no coincide con su sha256; descartado"; return $null }
    New-Item -ItemType Directory -Force -Path (Join-Path $Base "uv") | Out-Null
    Expand-Archive -Path "$tmp\$nombre" -DestinationPath (Join-Path $Base "uv") -Force
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    if (Test-Path $local) { return $local }
    return $null
}

function Instalar-Whisper {
    if (Venv-Ok) { return $true }
    Buscar-Python | Out-Null
    if (-not $script:PySis -and $Winget) {
        Write-Host "· Instalando Python 3.12 con winget (solo para tu usuario)..."
        Instalar-Winget "Python.Python.3.12" @("--scope", "user") | Out-Null
        Buscar-Python | Out-Null
    }
    $venv = Join-Path $Base "venv"
    $vpy = Join-Path $venv "Scripts\python.exe"
    Write-Host "· Instalando Whisper (faster-whisper $FwVersion) en $venv..."
    if (Test-Path $venv) { Remove-Item -Recurse -Force $venv }
    if ($script:PySis) {
        & $script:PySis -m venv $venv *> $null
        if (Test-Path $vpy) { & $vpy -m pip install -q --disable-pip-version-check "faster-whisper==$FwVersion" *> $null }
        if (Venv-Ok) { return $true }
    }
    Write-Host "· El Python del sistema no sirve; uso uv con un Python 3.12 propio..."
    if (Test-Path $venv) { Remove-Item -Recurse -Force $venv }
    $uv = Conseguir-Uv
    if (-not $uv) { Write-Host "FALLO no se pudo descargar uv"; return $false }
    $env:UV_PYTHON_INSTALL_DIR = Join-Path $Base "uv\python"; $env:UV_CACHE_DIR = Join-Path $Base "uv\cache"
    & $uv venv -q --python 3.12 $venv *> $null
    & $uv pip install -q --python $vpy "faster-whisper==$FwVersion" *> $null
    Remove-Item -Recurse -Force (Join-Path $Base "uv\cache") -ErrorAction SilentlyContinue
    if (Venv-Ok) { return $true }
    Write-Host "FALLO no se pudo instalar faster-whisper"; return $false
}

function Instalar-Motor {
    $m = Motor-Actual
    $env:Path = (Split-Path $script:Node) + ";" + (Split-Path $script:Ffmpeg) + ";" + $env:Path
    if ($m -eq "remotion") {
        $dir = Join-Path $Base "remotion"
        if (-not (Motor-Ok)) {
            Write-Host "· Instalando Remotion 4.0.540..."
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            Copy-Item (Join-Path $Skill "plantilla\remotion-prueba\package.json") (Join-Path $dir "package.json") -Force
            Set-ItemProperty -Path (Join-Path $dir "package.json") -Name IsReadOnly -Value $false
            Push-Location $dir; & $script:Npm install -q *> $null; Pop-Location
            if (-not (Motor-Ok)) { Write-Host "FALLO npm no pudo instalar Remotion"; return $false }
        }
        Push-Location $dir; & $script:Node "node_modules\@remotion\cli\remotion-cli.js" browser ensure *> $null; $ok = ($LASTEXITCODE -eq 0); Pop-Location
    } else {
        $dir = Join-Path $Base "hyperframes"
        if (-not (Motor-Ok)) {
            Write-Host "· Instalando HyperFrames $HfVersion..."
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            & $script:Npm install -q --prefix $dir "hyperframes@$HfVersion" "gsap@$GsapVersion" *> $null
            if (-not (Motor-Ok)) { Write-Host "FALLO npm no pudo instalar HyperFrames"; return $false }
        }
        $hf = Join-Path $dir "node_modules\hyperframes\bin\hyperframes.mjs"
        & $script:Node $hf browser ensure *> $null; $ok = ($LASTEXITCODE -eq 0)
        if (-not $SinSkills) {
            Write-Host "· Instalando las skills de HyperFrames para Claude Code (en $env:USERPROFILE\.claude\skills)..."
            Push-Location $Base; & $script:Node $hf skills update *> $null; $sk = $LASTEXITCODE; Pop-Location
            if ($sk -ne 0) { Write-Host "AVISO no se pudieron instalar las skills de HyperFrames (el editor funciona igual)" }
        }
    }
    if (-not $ok) {
        $script:ChromeFijo = Buscar-Chrome
        if (-not $script:ChromeFijo) { Write-Host "AVISO el motor no pudo bajar su navegador; se reintentará al montar" }
    }
    return (Motor-Ok)
}

function Escribir-Rutas {
    $ruta = Join-Path $Base "rutas.json"
    $datos = [ordered]@{}
    if (Test-Path $ruta) {
        try { (Get-Content $ruta -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $datos[$_.Name] = $_.Value } } catch {}
    }
    $m = Motor-Actual
    $datos["motor"] = $m; $datos["node"] = $script:Node; $datos["npm"] = $script:Npm
    $datos["ffmpeg"] = $script:Ffmpeg; $datos["ffprobe"] = $script:Ffprobe
    $datos["python"] = (Join-Path $Base "venv\Scripts\python.exe"); $datos[$m] = (Join-Path $Base $m)
    if ($script:ChromeFijo) { $datos["chrome"] = $script:ChromeFijo }
    $json = $datos | ConvertTo-Json -Depth 3
    [IO.File]::WriteAllText($ruta, $json, (New-Object Text.UTF8Encoding $false))
}

switch ($Orden) {
    "comprobar" { Informe }
    "instalar" {
        if (-not (Instalar-Node)) { Write-Host "FALLO Node.js"; exit 1 }
        if (-not (Instalar-Ffmpeg)) { Write-Host "FALLO FFmpeg"; exit 1 }
        if (-not (Instalar-Whisper)) { Write-Host "FALLO Whisper"; exit 1 }
        if (-not (Instalar-Motor)) { Write-Host "FALLO motor $(Motor-Actual)"; exit 1 }
        Escribir-Rutas
        Remove-Item -Recurse -Force (Join-Path $Base "npm-cache") -ErrorAction SilentlyContinue
        Write-Host ""; Informe; Write-Host ""
        $vpy = Join-Path $Base "venv\Scripts\python.exe"
        Write-Host "LISTO. Python del editor: $vpy"
        Write-Host "Siguiente: & `"$vpy`" `"$Aqui\editor.py`" carpeta <RUTA>   y luego   ... editor.py prueba"
        Write-Host "Si Windows ha instalado algo nuevo, cierra y vuelve a abrir la app de Claude antes de editar."
    }
    default { Write-Host "Uso: preparar.ps1 comprobar | instalar [-Motor hyperframes|remotion] [-SinSkills]"; exit 2 }
}
