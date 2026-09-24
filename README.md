# Ad-ios! (Manifest V3 Fast Ad & Tracker Blocker)

Ad-ios is a high-performance, native Manifest V3 ad, tracking, and telemetry blocker for Google Chrome on **macOS** and **Windows**.

Say goodbye to intrusive trackers, banners, and video overlays with zero performance penalty. Ad-ios runs natively via Chrome's **DeclarativeNetRequest (DNR)** engine, features non-blocking **cosmetic DOM cleanup**, and offers **modular category toggles** so you can decide what gets blocked and what stays.

---

## Extension Identity

| Property | Value |
| :--- | :--- |
| **Extension ID** | `eoidjjcijbeojdeoafpjadolfmkidcmc` |
| **Manifest Version** | `3` (Strict MV3 compliant) |
| **Public Key Algorithm** | RSA 2048-bit (PKCS#8 SubjectPublicKeyInfo DER) |
| **Engines** | Modular DeclarativeNetRequest + MutationObserver |
| **Pre-built Packages** | `dist/adios.crx` (Signed CRX3) & `dist/adios.zip` (Portable bundle) |

---


## Category Toggles (Customize What Gets Blocked)

Ad-ios includes independent category switches directly in the extension popup:

| Category | Default | What It Controls |
| :--- | :---: | :--- |
| 🛡️ **Ads & Popups** | **ON** | DoubleClick, Criteo, Taboola, Outbrain, popups, redirects, and ad exchanges. |
| 📊 **Analytics & Metrics** | **ON** | Google Analytics, Hotjar, Yandex Metrica, Mixpanel, Segment. |
| 🖼️ **Ad Images & Banners** | **OFF** | AdvMaker, banner GIFs, static promo images. *(Disabled by default so images are allowed!)* |
| 🔍 **Error Monitoring** | **ON** | Sentry, Bugsnag, New Relic error logging beacons. |

You can turn any category ON or OFF at any time simply by clicking the extension icon.

---

## Quick-Start: Install & Test in 2 Minutes

### 1. Load the Extension
1. Open **Google Chrome** and navigate to:
   ```text
   chrome://extensions
   ```
2. Turn **ON** **Developer mode** (top-right corner).
3. If you have an old disabled version of the extension listed, click **Remove**.
4. Click **Load unpacked** (top-left corner).
5. Select this project folder (`Adblock-Mac` or unzipped `adios.zip`).
6. You will see **Ad-ios!** active with ID:
   ```text
   eoidjjcijbeojdeoafpjadolfmkidcmc
   ```
7. Click the **Puzzle icon** in your Chrome toolbar and click the **Pin** icon next to Ad-ios!

---

## How to Test Ad-ios

### Test 1: Live AdBlock Tester
Visit [https://adblock-tester.com](https://adblock-tester.com).
- Run the test.
- Since **Ad Images & Banners** is set to allow images by default, standard images will pass.
- If you want to block banner images as well, open the Ad-ios popup and toggle **"Ad Images & Banners"** to **ON**, then refresh!

### Test 2: Network Inspection in DevTools
1. Press `F12` (Windows) or `Cmd + Option + I` (Mac) to open DevTools.
2. Switch to the **Network** tab.
3. Filter by `doubleclick` or `google-analytics` and reload any news or ad-heavy website.
4. Blocked requests appear in red with status **`(blocked:other)`**, intercepted before leaving your machine.

### Test 3: Popup Controls
1. Click the Ad-ios icon in your toolbar.
2. Try the master **Global Toggle** to pause/resume.
3. Test **"Whitelist This Site"** to bypass filtering on specific websites you want to support.
4. Try adding a custom domain in **Custom Domain Filter**.

---

## Phase 2 (Optional): Make Permanent

### macOS:
```bash
cd ~/Adblock-Mac
chmod +x install-mac-policy.sh uninstall-mac-policy.sh
sudo ./install-mac-policy.sh
```

### Windows:
Open PowerShell as **Administrator**:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd C:\Adblock-Mac
.\install-windows-policy.ps1
```

---

## How to Completely Uninstall

### On macOS:
```bash
sudo ./uninstall-mac-policy.sh
```
Then click **Remove** in `chrome://extensions`.

### On Windows:
Open PowerShell as **Administrator**:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\uninstall-windows-policy.ps1
```
Then click **Remove** in `chrome://extensions`.

---

## Rebuilding Packages for Git Releases

```bash
python build-package.py
```
Outputs:
- `dist/adios.zip` (clean zip bundle for users to download and load unpacked)
- `dist/adios.crx` (signed CRX3 package)
