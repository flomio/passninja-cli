#Requires -Version 5.1
<#
.SYNOPSIS
    Install the passninja CLI on Windows (PowerShell or cmd.exe).

.DESCRIPTION
    Downloads the architecture-appropriate passninja binary from the latest
    GitHub release (or a pinned version), verifies SHA256, installs to a
    user-writable directory, and adds that directory to the user PATH.

    Runs without admin. Re-running upgrades in place.

.PARAMETER Version
    Release tag to install (e.g. v1.2.3). Defaults to "latest". Also
    overridable via $env:PASSNINJA_VERSION.

.PARAMETER InstallDir
    Where the binary lands. Defaults to %LOCALAPPDATA%\Programs\passninja.
    Also overridable via $env:PASSNINJA_INSTALL_DIR.

.PARAMETER NoPath
    Skip adding InstallDir to the user PATH.

.EXAMPLE
    irm https://github.com/flomio/passninja-cli/releases/latest/download/install.ps1 | iex

.EXAMPLE
    $env:PASSNINJA_VERSION = 'v1.2.3'
    irm https://github.com/flomio/passninja-cli/releases/latest/download/install.ps1 | iex
#>
[CmdletBinding()]
param(
    [string]$Version    = $(if ($env:PASSNINJA_VERSION)    { $env:PASSNINJA_VERSION }    else { 'latest' }),
    [string]$InstallDir = $(if ($env:PASSNINJA_INSTALL_DIR){ $env:PASSNINJA_INSTALL_DIR }else { Join-Path $env:LOCALAPPDATA 'Programs\passninja' }),
    [switch]$NoPath
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'   # speeds up Invoke-WebRequest

$Repo    = 'flomio/passninja-cli'
$Binary  = 'passninja.exe'
$BaseUrl = "https://github.com/$Repo/releases"

function Write-Step([string]$msg) {
    Write-Host "==> " -ForegroundColor Cyan -NoNewline
    Write-Host $msg
}

function Write-Warn([string]$msg) {
    Write-Host "!!! " -ForegroundColor Yellow -NoNewline
    Write-Host $msg
}

function Write-Fail([string]$msg) {
    Write-Host "xxx " -ForegroundColor Red -NoNewline
    Write-Host $msg
    exit 1
}

# --- TLS 1.2 for legacy Windows PowerShell on older Windows -----------------
try {
    [Net.ServicePointManager]::SecurityProtocol =
        [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch {
    # PS 7+ on .NET 5+ uses system defaults; ignore.
}

# --- Architecture detection -------------------------------------------------
function Get-PassninjaArch {
    # Prefer the real OS arch over the process arch (avoid WoW64 confusion).
    try {
        $osArch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
        switch ($osArch) {
            'X64'   { return 'amd64' }
            'Arm64' { return 'arm64' }
            'X86'   { return '386'   }
        }
    } catch {
        # fall through to env-var-based detection
    }

    $procArch = $env:PROCESSOR_ARCHITECTURE
    $wow64    = $env:PROCESSOR_ARCHITEW6432   # set when a 32-bit shell runs on 64-bit Windows
    $effective = if ($wow64) { $wow64 } else { $procArch }

    switch -Regex ($effective) {
        '^AMD64$' { return 'amd64' }
        '^ARM64$' { return 'arm64' }
        '^x86$'   { return '386'   }
        default   { Write-Fail "Unsupported CPU architecture: $effective" }
    }
}

$arch = Get-PassninjaArch
Write-Step "Detected architecture: windows-$arch"

# --- Resolve download URLs --------------------------------------------------
if ($Version -eq 'latest') {
    $assetUrl = "$BaseUrl/latest/download/passninja-windows-$arch.exe"
    $sumsUrl  = "$BaseUrl/latest/download/SHA256SUMS"
} else {
    $assetUrl = "$BaseUrl/download/$Version/passninja-windows-$arch.exe"
    $sumsUrl  = "$BaseUrl/download/$Version/SHA256SUMS"
}

# --- Download into a temp dir, then move into place atomically --------------
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("passninja-install-" + [System.Guid]::NewGuid())
$null = New-Item -ItemType Directory -Path $tempDir -Force

try {
    $tempBin  = Join-Path $tempDir $Binary
    $tempSums = Join-Path $tempDir 'SHA256SUMS'

    Write-Step "Downloading $assetUrl"
    try {
        Invoke-WebRequest -Uri $assetUrl  -OutFile $tempBin  -UseBasicParsing
    } catch {
        Write-Fail "Download failed: $($_.Exception.Message)`n    URL: $assetUrl"
    }

    Write-Step "Downloading checksums"
    try {
        Invoke-WebRequest -Uri $sumsUrl -OutFile $tempSums -UseBasicParsing
    } catch {
        Write-Fail "Checksum download failed: $($_.Exception.Message)`n    URL: $sumsUrl"
    }

    # --- Verify SHA256 ------------------------------------------------------
    $expected = $null
    foreach ($line in (Get-Content $tempSums)) {
        # Format: "<sha>  passninja-windows-<arch>.exe"
        if ($line -match "^([0-9a-fA-F]{64})\s+passninja-windows-$arch\.exe\s*$") {
            $expected = $Matches[1].ToLowerInvariant()
            break
        }
    }
    if (-not $expected) {
        Write-Fail "No SHA256 entry for passninja-windows-$arch.exe in SHA256SUMS"
    }

    $actual = (Get-FileHash -Algorithm SHA256 -Path $tempBin).Hash.ToLowerInvariant()
    if ($actual -ne $expected) {
        Write-Fail "Checksum mismatch.`n    expected: $expected`n    actual:   $actual"
    }
    Write-Step "Verified SHA256 ($actual)"

    # --- Install ------------------------------------------------------------
    if (-not (Test-Path $InstallDir)) {
        $null = New-Item -ItemType Directory -Path $InstallDir -Force
    }
    $target = Join-Path $InstallDir $Binary

    # If the binary is currently running, Move-Item would EBUSY. Try to detect
    # and tell the user, rather than failing cryptically.
    if (Test-Path $target) {
        try {
            $fs = [System.IO.File]::Open($target, 'Open', 'ReadWrite', 'None')
            $fs.Close()
        } catch {
            Write-Fail "$target is in use by another process. Close any open passninja sessions and re-run."
        }
    }

    Move-Item -Force -Path $tempBin -Destination $target
    Write-Step "Installed $target"
} finally {
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $tempDir
}

# --- PATH management --------------------------------------------------------
if (-not $NoPath) {
    $userPath  = [Environment]::GetEnvironmentVariable('Path', 'User')
    $parts     = @($userPath -split ';' | Where-Object { $_ -ne '' })
    $already   = $parts | Where-Object { $_.TrimEnd('\') -ieq $InstallDir.TrimEnd('\') }

    if (-not $already) {
        $newPath = (($parts + $InstallDir) -join ';')
        [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
        # also patch current session so the next line works without a restart
        $env:Path = "$env:Path;$InstallDir"
        Write-Step "Added $InstallDir to user PATH (open a new shell to pick it up)"
    } else {
        Write-Step "$InstallDir already on user PATH"
    }
}

# --- Smoke test -------------------------------------------------------------
try {
    & (Join-Path $InstallDir $Binary) version
} catch {
    Write-Warn "Installed binary failed to run: $($_.Exception.Message)"
    exit 1
}

Write-Step 'Done. Run "passninja auth" to save your API credentials.'
