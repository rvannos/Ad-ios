# ==============================================================================
# AdShield - Enterprise Policy Installer for Windows Chrome
# ------------------------------------------------------------------------------
# Configures Chrome Managed Policies in HKLM:\SOFTWARE\Policies\Google\Chrome
# to register the deterministic extension ID, allow local unpacked loading,
# and suppress developer mode warnings.
# ==============================================================================

# Require Administrator privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[!] Administrator privileges required." -ForegroundColor Yellow
    Write-Host "    Please right-click PowerShell and select 'Run as Administrator', then execute:"
    Write-Host "    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\install-windows-policy.ps1" -ForegroundColor Cyan
    exit 1
}

$ExtensionId = "eoidjjcijbeojdeoafpjadolfmkidcmc"
$PolicyRoot = "HKLM:\SOFTWARE\Policies\Google\Chrome"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   AdShield - Enterprise Policy Installer (Windows)   " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "[*] Extension ID: $ExtensionId" -ForegroundColor White
Write-Host "[*] Policy Path:  $PolicyRoot" -ForegroundColor White

# Ensure root key exists
if (-not (Test-Path $PolicyRoot)) {
    New-Item -Path $PolicyRoot -Force | Out-Null
}

# 1. Developer Mode Allowed
Set-ItemProperty -Path $PolicyRoot -Name "DeveloperModeAllowed" -Value 1 -Type DWord -Force

# 2. Suppress command line security warnings
Set-ItemProperty -Path $PolicyRoot -Name "CommandLineFlagSecurityWarningsEnabled" -Value 0 -Type DWord -Force

# 3. Allow local file sources for extensions
$SourcesKey = "$PolicyRoot\ExtensionInstallSources"
if (-not (Test-Path $SourcesKey)) {
    New-Item -Path $SourcesKey -Force | Out-Null
}
Set-ItemProperty -Path $SourcesKey -Name "1" -Value "file:///*" -Type String -Force

# 4. ExtensionInstallAllowlist
$AllowlistKey = "$PolicyRoot\ExtensionInstallAllowlist"
if (-not (Test-Path $AllowlistKey)) {
    New-Item -Path $AllowlistKey -Force | Out-Null
}
Set-ItemProperty -Path $AllowlistKey -Name "1" -Value $ExtensionId -Type String -Force

# 5. ExtensionSettings JSON
$ExtensionSettingsKey = "$PolicyRoot\ExtensionSettings"
if (-not (Test-Path $ExtensionSettingsKey)) {
    New-Item -Path $ExtensionSettingsKey -Force | Out-Null
}
$SettingsJson = @{
    installation_mode = "allowed"
    toolbar_pin = "force_pinned"
} | ConvertTo-Json -Compress

Set-ItemProperty -Path $ExtensionSettingsKey -Name $ExtensionId -Value $SettingsJson -Type String -Force

Write-Host ""
Write-Host "✓ Enterprise Policy Installed Successfully!" -ForegroundColor Green
Write-Host "------------------------------------------------------"
Write-Host "1. Restart Google Chrome."
Write-Host "2. Navigate to chrome://policy to verify ExtensionSettings."
Write-Host "======================================================"
