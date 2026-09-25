# Privacy Policy for Ad-ios!

**Effective Date:** September 25, 2026  
**Last Updated:** September 25, 2026

**Ad-ios!** is committed to protecting your privacy. This privacy policy explains our practices regarding user data.

---

### 1. Data Collection & Telemetry
**Ad-ios does not collect, log, store, or transmit any personal data, browsing history, or user information whatsoever.**

* **No Analytics:** We do not track what websites you visit, how long you stay, or what you click.
* **No Remote Telemetry:** The extension has zero remote telemetry or tracking beacons.
* **No Account Required:** You do not need to register an account, log in, or provide an email address to use Ad-ios.

---

### 2. How Ad-ios Works Locally
All content blocking and filtering occurs **100% locally on your device** using Google Chrome's native `declarativeNetRequest` engine:
* Network filtering rules and cosmetic element hiding are executed directly within your browser.
* User preferences (such as whitelisted websites or category toggles) are stored strictly on your local computer using Chrome's `storage.local` API and never leave your device.

---

### 3. Third Parties
We do not sell, rent, trade, or share user data with any third parties, advertisers, or data brokers.

---

### 4. Permissions Disclosures
* `declarativeNetRequest`: Used exclusively to block network requests to known advertisement, tracking, and telemetry servers before transmission.
* `storage`: Used solely to save your local extension settings (such as custom rules and category preferences) on your machine.
* `host_permissions (<all_urls>)`: Required to evaluate whether network requests and cosmetic banners match blocklist rules on pages you navigate to.

---

### 5. Changes to This Policy
If we make any updates to this privacy policy, changes will be posted to this repository.

---

### 6. Contact
If you have any questions about this privacy policy, you can open an issue on the official GitHub repository:  
[https://github.com/rvannos/Ad-ios](https://github.com/rvannos/Ad-ios)
