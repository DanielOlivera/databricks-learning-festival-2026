# Crea el acceso directo del Study Lab en el escritorio.
# Ejecutar una sola vez, o de nuevo si mueves el repositorio de carpeta.
#   powershell -ExecutionPolicy Bypass -File crear-acceso-directo.ps1

$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbs = Join-Path $raiz "app\launch.vbs"
$ico = Join-Path $raiz "app\icons\app.ico"
$destino = Join-Path ([Environment]::GetFolderPath("Desktop")) "Databricks Study Lab.lnk"

if (-not (Test-Path $vbs)) { throw "No se encontro $vbs" }

$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($destino)
$lnk.TargetPath = "wscript.exe"
$lnk.Arguments = "`"$vbs`""
$lnk.WorkingDirectory = Join-Path $raiz "app"
$lnk.IconLocation = $ico
$lnk.Description = "Databricks Study Lab: repaso espaciado, gotchas, cheatsheets y simulacros"
$lnk.Save()

Write-Host "Acceso directo creado en: $destino"
