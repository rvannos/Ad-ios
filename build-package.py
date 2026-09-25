#!/usr/bin/env python3
"""
AdShield - Multi-Platform Packaging Tool
Builds packed .crx (signed CRX3) and clean .zip bundles into the dist/ directory.
Works on macOS, Windows, and Linux.
"""

import os
import sys
import shutil
import subprocess
import zipfile

def build():
    root = os.path.dirname(os.path.abspath(__file__))
    dist = os.path.join(root, 'dist')
    os.makedirs(dist, exist_ok=True)

    ext_items = ['manifest.json', 'rules', 'scripts', 'styles', 'popup', 'icons']

    print("==================================================")
    print("   Building AdShield Distribution Packages        ")
    print("==================================================")

    # 1. Build adios.zip (clean bundle for unpacked installation)
    zip_path = os.path.join(dist, 'adios.zip')
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for item in ext_items:
            item_path = os.path.join(root, item)
            if os.path.isdir(item_path):
                for dirpath, _, filenames in os.walk(item_path):
                    for fn in filenames:
                        fp = os.path.join(dirpath, fn)
                        rel = os.path.relpath(fp, root)
                        zf.write(fp, rel)
            elif os.path.isfile(item_path):
                zf.write(item_path, item)

    print(f"[+] Created ZIP bundle : {zip_path} ({os.path.getsize(zip_path)} bytes)")

    # 1b. Build adios-webstore.zip (optimized for Chrome Web Store, without 'key' field)
    import json
    cws_zip_path = os.path.join(dist, 'adios-webstore.zip')
    with open(os.path.join(root, 'manifest.json'), 'r', encoding='utf-8') as mf:
        cws_manifest = json.load(mf)
    cws_manifest.pop('key', None) # Chrome Web Store forbids 'key' field for new submissions
    cws_manifest_str = json.dumps(cws_manifest, indent=2)

    with zipfile.ZipFile(cws_zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('manifest.json', cws_manifest_str)
        for item in ['rules', 'scripts', 'styles', 'popup', 'icons']:
            item_path = os.path.join(root, item)
            if os.path.isdir(item_path):
                for dirpath, _, filenames in os.walk(item_path):
                    for fn in filenames:
                        fp = os.path.join(dirpath, fn)
                        rel = os.path.relpath(fp, root)
                        zf.write(fp, rel)
            elif os.path.isfile(item_path):
                zf.write(item_path, item)

    print(f"[+] Created WebStore ZIP : {cws_zip_path} ({os.path.getsize(cws_zip_path)} bytes)")

    # 2. Build adshield.crx using Chrome CLI
    stage_dir = os.path.join(dist, 'extension_stage')
    shutil.rmtree(stage_dir, ignore_errors=True)
    os.makedirs(stage_dir, exist_ok=True)

    for item in ext_items:
        src = os.path.join(root, item)
        dst = os.path.join(stage_dir, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)

    chrome_candidates = [
        # Windows
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe'),
        # macOS
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        os.path.expanduser('~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
        # Linux
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ]

    chrome_bin = None
    for c in chrome_candidates:
        if os.path.exists(c):
            chrome_bin = c
            break

    if not chrome_bin:
        for candidate in ['google-chrome', 'chrome', 'chromium']:
            found = shutil.which(candidate)
            if found:
                chrome_bin = found
                break

    if chrome_bin:
        priv_key = os.path.join(root, 'private_key.pem')
        if not os.path.exists(priv_key):
            print(f"[!] Warning: private_key.pem not found at {priv_key}. Skipping CRX packing.")
        else:
            print(f"[*] Packaging CRX using Chrome: {chrome_bin}")
            cmd = [chrome_bin, f'--pack-extension={stage_dir}', f'--pack-extension-key={priv_key}', '--no-message-box']
            try:
                subprocess.run(cmd, check=True)
                gen_crx = os.path.join(dist, 'extension_stage.crx')
                target_crx = os.path.join(dist, 'adios.crx')
                if os.path.exists(gen_crx):
                    if os.path.exists(target_crx):
                        os.remove(target_crx)
                    os.rename(gen_crx, target_crx)
                    print(f"[+] Created CRX package: {target_crx} ({os.path.getsize(target_crx)} bytes)")
            except Exception as e:
                print(f"[!] Note during CRX packaging: {e}")
    else:
        print("[!] Chrome binary not found in standard system paths. Skipped .crx generation.")

    # Cleanup staging directory
    shutil.rmtree(stage_dir, ignore_errors=True)
    print("==================================================")
    print("Build complete! Files are ready in the dist/ folder.")

if __name__ == '__main__':
    build()
