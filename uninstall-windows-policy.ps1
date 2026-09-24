# ==============================================================================
# AdShield - Enterprise Policy Uninstaller for Windows Chrome
# ------------------------------------------------------------------------------
# Cleanly removes AdShield managed policies from HKLM:\SOFTWARE\Policies\Google\Chrome
# ==============================================================================

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[!] Administrator privileges required." -ForegroundColor Yellow
    Write-Host "    Please run PowerShell as Administrator and re-run this script."
    exit 1
}

$ExtensionId = "eoidjjcijbeojdeoafpjadolfmkidcmc"
$PolicyRoot = "HKLM:\SOFTWARE\Policies\Google\Chrome"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  AdShield - Enterprise Policy Uninstaller (Windows)  " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Remove from ExtensionSettings
$SettingsKey = "$PolicyRoot\ExtensionSettings"
if (Test-Path $SettingsKey) {
    if ((Get-ItemProperty -Path $SettingsKey -Name $ExtensionId -ErrorAction SilentlyContinue)) {
        Remove-ItemProperty -Path $SettingsKey -Name $ExtensionId -Force
        Write-Host "[+] Removed $ExtensionId from ExtensionSettings." -ForegroundColor Green
    }
}

# Remove from Allowlist
$AllowlistKey = "$PolicyRoot\ExtensionInstallAllowlist"
if (Test-Path $AllowlistKey) {
    $props = Get-ItemProperty -Path $AllowlistKey
    foreach ($prop in $props.PSObject.Properties) {
        if ($prop.Value -eq $ExtensionId) {
            Remove-ItemProperty -Path $AllowlistKey -Name $prop.Name -Force
            Write-Host "[+] Removed $ExtensionId from ExtensionInstallAllowlist." -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "✓ Windows Enterprise Policies Cleaned Successfully!" -ForegroundColor Green
Write-Host "You may now remove the unpacked extension from chrome://extensions."
Write-Host "======================================================"
