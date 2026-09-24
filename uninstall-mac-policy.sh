#!/usr/bin/env bash
# ==============================================================================
# AdShield Mac - Enterprise Policy Uninstaller for macOS Chrome
# ------------------------------------------------------------------------------
# Cleanly removes AdShield managed policies from /Library/Preferences/com.google.Chrome.plist
# ==============================================================================

set -euo pipefail

EXTENSION_ID="eoidjjcijbeojdeoafpjadolfmkidcmc"
PLIST_PATH="/Library/Preferences/com.google.Chrome.plist"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}======================================================${NC}"
echo -e "${BLUE}${BOLD}   AdShield Mac - Enterprise Policy Uninstaller       ${NC}"
echo -e "${BLUE}${BOLD}======================================================${NC}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo -e "${RED}[ERROR] This script must be run on macOS (Darwin).${NC}"
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo -e "${YELLOW}[!] Root privileges required.${NC}"
  echo -e "    Please re-run this script with sudo:"
  echo -e "    ${BOLD}sudo ./uninstall-mac-policy.sh${NC}"
  exit 1
fi

if [[ ! -f "${PLIST_PATH}" ]]; then
  echo -e "${YELLOW}[*] No policy file found at ${PLIST_PATH}. Nothing to remove.${NC}"
  exit 0
fi

echo -e "${BLUE}[*] Removing AdShield (${EXTENSION_ID}) configuration...${NC}"

# Remove ExtensionSettings entry for this extension ID using plutil
if plutil -extract "ExtensionSettings.${EXTENSION_ID}" xml1 "${PLIST_PATH}" >/dev/null 2>&1; then
  plutil -remove "ExtensionSettings.${EXTENSION_ID}" "${PLIST_PATH}" || true
  echo -e "${GREEN}[+] Removed ${EXTENSION_ID} from ExtensionSettings.${NC}"
fi

# Clean up ExtensionInstallAllowlist using python or plutil
python3 -c "
import plistlib, os

plist_file = '${PLIST_PATH}'
try:
    with open(plist_file, 'rb') as f:
        data = plistlib.load(f)
    
    modified = False
    
    # Clean Allowlist
    if 'ExtensionInstallAllowlist' in data and isinstance(data['ExtensionInstallAllowlist'], list):
        orig_len = len(data['ExtensionInstallAllowlist'])
        data['ExtensionInstallAllowlist'] = [x for x in data['ExtensionInstallAllowlist'] if x != '${EXTENSION_ID}']
        if len(data['ExtensionInstallAllowlist']) != orig_len:
            modified = True
            if len(data['ExtensionInstallAllowlist']) == 0:
                del data['ExtensionInstallAllowlist']
    
    # Remove empty ExtensionSettings if empty
    if 'ExtensionSettings' in data and isinstance(data['ExtensionSettings'], dict):
        if '${EXTENSION_ID}' in data['ExtensionSettings']:
            del data['ExtensionSettings']['${EXTENSION_ID}']
            modified = True
        if len(data['ExtensionSettings']) == 0:
            del data['ExtensionSettings']
            modified = True

    if modified:
        with open(plist_file, 'wb') as f:
            plistlib.dump(data, f)
        print('[+] Successfully cleaned plist entries via plistlib.')
except Exception as e:
    print('[!] Note during plist cleanup:', e)
" 2>/dev/null || true

# Validate plist
if plutil -lint "${PLIST_PATH}" >/dev/null 2>&1; then
  echo -e "${GREEN}[+] Plist verified.${NC}"
fi

# Flush cfprefsd
killall cfprefsd 2>/dev/null || true

echo -e ""
echo -e "${GREEN}${BOLD}✓ Enterprise Policy Reverted Successfully!${NC}"
echo -e "------------------------------------------------------"
echo -e "You can now open ${BOLD}chrome://extensions${NC} and click ${BOLD}'Remove'${NC} on AdShield."
echo -e "======================================================"
