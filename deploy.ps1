param(
    [string]$Branch = "",
    [switch]$SkipTests,
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' is not installed or not in PATH."
    }
}

function Get-PortListenerPid {
    param([int]$LocalPort)

    $line = netstat -ano | Select-String -Pattern "LISTENING\s+(\d+)$" | ForEach-Object {
        $raw = $_.Line.Trim()
        if ($raw -match "^\s*TCP\s+\S+:" + $LocalPort + "\s+\S+\s+LISTENING\s+(\d+)\s*$") {
            return [int]$Matches[1]
        }
    } | Select-Object -First 1

    return $line
}

Write-Host "==> Validating prerequisites..."
Require-Command git
Require-Command java

if (-not (Test-Path ".\mvnw.cmd")) {
    throw "mvnw.cmd was not found. Run this script from the project root."
}

if (-not (Test-Path ".\.git")) {
    throw ".git directory was not found. This script expects a git checkout."
}

$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if (-not $Branch) {
    $Branch = $currentBranch
}

Write-Host "==> Fetching latest changes..."
git fetch --all --prune

Write-Host "==> Pulling branch '$Branch'..."
git checkout $Branch
git pull origin $Branch

$mavenArgs = @("clean", "package")
if ($SkipTests) {
    $mavenArgs += "-DskipTests"
}

Write-Host "==> Building application..."
& .\mvnw.cmd @mavenArgs

$jar = Get-ChildItem ".\target\*.jar" |
    Where-Object { $_.Name -notlike "*sources*" -and $_.Name -notlike "*javadoc*" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $jar) {
    throw "No runnable JAR found in .\target after build."
}

if ($Port -lt 1 -or $Port -gt 65535) {
    throw "Invalid port '$Port'. Use a value between 1 and 65535."
}

$listenerPid = Get-PortListenerPid -LocalPort $Port
if ($listenerPid) {
    throw "Port $Port is already in use by PID $listenerPid. Use -Port with a free port (for example, -Port 8081)."
}

Write-Host "==> Starting application from $($jar.FullName)..."
$proc = Start-Process -FilePath "java" -ArgumentList @("-jar", $jar.FullName, "--server.port=$Port") -WorkingDirectory (Get-Location) -PassThru

Write-Host "==> Deploy completed. App is starting in background (PID: $($proc.Id), Port: $Port)."
