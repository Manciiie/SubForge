# Test de lancement sur un vrai Windows, sans installer ni toucher à la version installée.
# Lancé par Claude via le shell du PC (jamais à faire à la main) sur le dossier dist/win-unpacked copié :
#   powershell -NoProfile -ExecutionPolicy Bypass -File verifier-windows.ps1 -Exe "C:\...\win-unpacked\SubForge.exe"
# Profil jetable (--user-data-dir) : paramètres, secrets et journaux réels intacts,
# et pas de conflit avec une instance déjà ouverte.

param(
  [Parameter(Mandatory = $true)][string]$Exe,
  [int]$DelaiSecondes = 90
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Exe)) { Write-Output "ECHEC : exécutable introuvable ($Exe)"; exit 2 }

$profil = Join-Path $env:TEMP ("forge-test-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $profil | Out-Null
$env:FORGE_TEST_LANCEMENT = '1'

$debut = Get-Date
$p = Start-Process -FilePath $Exe -ArgumentList "--user-data-dir=`"$profil`"" -PassThru
if (-not $p.WaitForExit($DelaiSecondes * 1000)) {
  Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
  $code = 'délai dépassé'
} else {
  $code = $p.ExitCode
}
$duree = [math]::Round(((Get-Date) - $debut).TotalSeconds, 1)

$journal = Join-Path $profil 'logs\app.log'
$extrait = if (Test-Path $journal) { (Get-Content $journal -Tail 40) -join "`n" } else { '(aucun journal écrit)' }

$os = (Get-CimInstance Win32_OperatingSystem)
Write-Output "Système : $($os.Caption) $($os.Version)"
if ($code -eq 0) {
  Write-Output "OK : fenêtre créée et interface prête en $duree s (code 0)."
  $resultat = 0
} else {
  Write-Output "ECHEC : code $code après $duree s."
  Write-Output "--- Journal ---"
  Write-Output $extrait
  $resultat = 1
}

Remove-Item -LiteralPath $profil -Recurse -Force -ErrorAction SilentlyContinue
exit $resultat
