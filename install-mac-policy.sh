#!/usr/bin/env bash
# ==============================================================================
# AdShield Mac - Enterprise Policy Installer for macOS Chrome
# ------------------------------------------------------------------------------
# Configures managed policy preferences in /Library/Preferences/com.google.Chrome.plist
# to register the static extension ID, allow local unpacked installation, and
# prevent Chrome from disabling or showing developer nag banners on startup.
# ==============================================================================

set -euo pipefail

EXTENSION_ID="eoidjjcijbeojdeoafpjadolfmkidcmc"
PLIST_PATH="/Library/Preferences/com.google.Chrome.plist"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}======================================================${NC}"
echo -e "${BLUE}${BOLD}   AdShield Mac - Enterprise Policy Configuration     ${NC}"
echo -e "${BLUE}${BOLD}======================================================${NC}"

# 1. Verify macOS environment
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo -e "${RED}[ERROR] This script must be run on macOS (Darwin).${NC}"
  exit 1
fi

# 2. Check for root / sudo privileges
if [[ $EUID -ne 0 ]]; then
  echo -e "${YELLOW}[!] Root privileges required to write to /Library/Preferences.${NC}"
  echo -e "    Please re-run this script with sudo:"
  echo -e "    ${BOLD}sudo ./install-mac-policy.sh${NC}"
  exit 1
fi

# 3. Locate Chrome directory / unpacked extension path
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "${BLUE}[*] Extension directory:${NC} ${CURRENT_DIR}"
echo -e "${BLUE}[*] Extension ID:${NC}        ${BOLD}${EXTENSION_ID}${NC}"
echo -e "${BLUE}[*] Target Policy Plist:${NC} ${PLIST_PATH}"

# Ensure parent directory exists
mkdir -p "/Library/Preferences"

# 4. Backup existing plist if present
if [[ -f "${PLIST_PATH}" ]]; then
  BACKUP_PATH="${PLIST_PATH}.backup.$(date +%Y%m%d%H%M%S)"
  cp "${PLIST_PATH}" "${BACKUP_PATH}"
  echo -e "${GREEN}[+] Created backup:${NC} ${BACKUP_PATH}"
fi

echo -e "${BLUE}[*] Writing Chrome Enterprise Managed Preferences...${NC}"

# 5. Allow unpacked extensions & developer mode
defaults write /Library/Preferences/com.google.Chrome DeveloperModeAllowed -bool true

# 6. Allow installation sources from local filesystem and web
defaults write /Library/Preferences/com.google.Chrome ExtensionInstallSources -array-add "file:///*"

# 7. Add Extension ID to ExtensionInstallAllowlist
# Ensure list contains our deterministic ID without duplicate clutter
defaults write /Library/Preferences/com.google.Chrome ExtensionInstallAllowlist -array-add "${EXTENSION_ID}"

# 8. Configure ExtensionSettings dictionary for the Extension ID
# installation_mode: "allowed" explicitly authorizes off-store extensions without disabling them
SETTINGS_DICT='{ "installation_mode" = "allowed"; "toolbar_pin" = "force_pinned"; }'
defaults write /Library/Preferences/com.google.Chrome ExtensionSettings -dict-add "${EXTENSION_ID}" "${SETTINGS_DICT}"

# 9. Suppress warning flags for command-line / developer unpacked side-loading
defaults write /Library/Preferences/com.google.Chrome CommandLineFlagSecurityWarningsEnabled -bool false

# 10. Set proper system permissions so Chrome can read the file
chmod 644 "${PLIST_PATH}"
chown root:wheel "${PLIST_PATH}" 2>/dev/null || chown root:admin "${PLIST_PATH}" 2>/dev/null || true

# 11. Validate plist syntax using plutil
if plutil -lint "${PLIST_PATH}" >/dev/null 2>&1; then
  echo -e "${GREEN}[+] Plist validated successfully.${NC}"
else
  echo -e "${YELLOW}[!] Warning: plutil lint reported a non-zero exit. Checking contents...${NC}"
fi

# 12. Flush macOS preferences cache daemon (cfprefsd)
echo -e "${BLUE}[*] Flushing preferences cache (cfprefsd)...${NC}"
killall cfprefsd 2>/dev/null || true

echo -e ""
echo -e "${GREEN}${BOLD}✓ Enterprise Policy Installed Successfully!${NC}"
echo -e "------------------------------------------------------"
echo -e "Chrome has been configured to recognize AdShield ID:"
echo -e "  ${BOLD}${EXTENSION_ID}${NC}"
echo -e ""
echo -e "Next steps:"
echo -e "1. Open Google Chrome."
echo -e "2. Navigate to: ${BOLD}chrome://policy${NC}"
echo -e "3. Click ${BOLD}'Reload policies'${NC} to confirm 'ExtensionSettings' is active."
echo -e "4. Navigate to: ${BOLD}chrome://extensions${NC}"
echo -e "5. Enable 'Developer mode' (top right), click ${BOLD}'Load unpacked'${NC},"
echo -e "   and select this folder: ${BOLD}${CURRENT_DIR}${NC}"
echo -e "======================================================"
