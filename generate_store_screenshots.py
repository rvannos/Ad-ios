import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

os.makedirs('store_assets', exist_ok=True)

WIDTH = 1280
HEIGHT = 800

font_title = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 44)
font_sub = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 20)
font_feat_title = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 20)
font_feat_desc = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 15)
font_badge = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 14)

def create_base_canvas():
    canvas = Image.new('RGB', (WIDTH, HEIGHT), (13, 17, 23))
    draw = ImageDraw.Draw(canvas)
    
    # Subtle gradient across background
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(13 + (22 - 13) * ratio)
        g = int(17 + (27 - 17) * ratio)
        b = int(23 + (34 - 23) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
        
    return canvas

# ==============================================================================
# SCREENSHOT 1: Popup Feature Showcase (1280x800)
# ==============================================================================
def make_screenshot_1():
    canvas = create_base_canvas()
    
    # Ambient glow behind popup (coral/orange)
    glow = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([800, 150, 1250, 650], fill=(255, 69, 58, 28))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    canvas.paste(glow, (0, 0), glow)

    # 1. Left Column: Branding and Value Propositions
    draw = ImageDraw.Draw(canvas)
    
    # Logo
    logo = Image.open('assets/logo.png').convert('RGBA')
    logo_resized = logo.resize((68, 68), Image.Resampling.LANCZOS)
    canvas.paste(logo_resized, (90, 80), logo_resized)
    
    # Title & Subtitle
    draw.text((175, 82), "Ad-ios!", font=font_title, fill=(255, 255, 255))
    draw.text((177, 134), "Fast, Native Ad & Tracker Blocker", font=font_sub, fill=(160, 166, 178))
    
    # Thin divider
    draw.line([(90, 185), (660, 185)], fill=(48, 54, 61), width=1)
    
    # Feature List
    features = [
        ("⚡ 100% Native Performance", "Intercepts network requests instantly with Chrome DeclarativeNetRequest. 0ms latency."),
        ("🎛️ Modular Category Toggles", "Turn blocking on or off individually for ads, telemetry, images, or error loggers."),
        ("🛡️ Advanced Anti-Ad Defenses", "Neutralizes evasive popunders, in-page push notification spam, and video pre-rolls."),
        ("🔒 Zero Telemetry, 100% Local", "Zero external code, zero eval(), zero tracking. Everything runs strictly on your machine.")
    ]
    
    start_y = 220
    for title, desc in features:
        # Subtle card backing for features
        draw.rounded_rectangle([90, start_y, 670, start_y + 80], radius=10, fill=(22, 27, 34), outline=(48, 54, 61), width=1)
        draw.text((115, start_y + 16), title, font=font_feat_title, fill=(240, 246, 252))
        draw.text((115, start_y + 44), desc, font=font_feat_desc, fill=(139, 148, 158))
        start_y += 100

    # Pill Badges at bottom
    badges = ["Manifest V3 Ready", "macOS & Windows", "Open Source & Local"]
    bx = 90
    for b in badges:
        bw = int(font_badge.getlength(b)) + 24
        draw.rounded_rectangle([bx, start_y + 20, bx + bw, start_y + 54], radius=16, fill=(33, 38, 45), outline=(56, 139, 253), width=1)
        draw.text((bx + 12, start_y + 28), b, font=font_badge, fill=(88, 166, 255))
        bx += bw + 14

    # 2. Right Column: Popup Image with Shadow
    popup_src = Image.open(r'C:\Users\rvann\.gemini\antigravity\brain\9f3ab522-acc8-4451-a692-74a9eed0cdaf\.user_uploaded\media_1790363031415.png').convert('RGBA')
    
    # Scale popup to fit nicely within 800px height (height 720)
    target_h = 710
    target_w = int(popup_src.width * (target_h / popup_src.height))
    popup_scaled = popup_src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Floating shadow
    px = 780
    py = 45
    shadow = Image.new('RGBA', (target_w + 40, target_h + 40), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle([15, 15, target_w + 25, target_h + 25], radius=16, fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(15))
    canvas.paste(shadow, (px - 20, py - 10), shadow)
    
    # Paste popup
    canvas.paste(popup_scaled, (px, py), popup_scaled)
    
    # Subtle border around popup
    draw.rounded_rectangle([px, py, px + target_w, py + target_h], radius=12, outline=(60, 66, 75), width=1)

    # Save exactly 1280x800 24-bit RGB (no alpha)
    out_path = 'store_assets/screenshot_1_popup.png'
    canvas.save(out_path, 'PNG')
    print(f'[+] Created {out_path} ({canvas.size}, {canvas.mode})')

# ==============================================================================
# SCREENSHOT 2: 100/100 Benchmark & Protection Overview
# ==============================================================================
def make_screenshot_2():
    canvas = create_base_canvas()
    draw = ImageDraw.Draw(canvas)
    
    # Ambient green glow for 100/100 victory
    glow = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([300, 100, 980, 500], fill=(46, 160, 67, 32))
    glow = glow.filter(ImageFilter.GaussianBlur(100))
    canvas.paste(glow, (0, 0), glow)

    # Top Header
    title_text = "Verified 100% Blocking Score"
    tw = font_title.getlength(title_text)
    draw.text(((WIDTH - tw) / 2, 70), title_text, font=font_title, fill=(255, 255, 255))
    
    sub_text = "Flawless pass across all major advertising, telemetry, and tracking benchmarks."
    sw = font_sub.getlength(sub_text)
    draw.text(((WIDTH - sw) / 2, 130), sub_text, font=font_sub, fill=(160, 166, 178))

    # Paste 100/100 Badge
    badge_path = r'C:\Users\rvann\.gemini\antigravity\brain\9f3ab522-acc8-4451-a692-74a9eed0cdaf\.user_uploaded\media_1790262488063.png'
    badge_img = Image.open(badge_path).convert('RGBA')
    bw = 900
    bh = int(badge_img.height * (bw / badge_img.width))
    badge_resized = badge_img.resize((bw, bh), Image.Resampling.LANCZOS)
    
    bx = (WIDTH - bw) // 2
    by = 185
    
    # Shadow behind 100/100 badge
    b_shadow = Image.new('RGBA', (bw + 30, bh + 30), (0, 0, 0, 0))
    bs_draw = ImageDraw.Draw(b_shadow)
    bs_draw.rectangle([10, 10, bw + 15, bh + 15], fill=(0, 0, 0, 180))
    b_shadow = b_shadow.filter(ImageFilter.GaussianBlur(12))
    canvas.paste(b_shadow, (bx - 10, by - 5), b_shadow)
    
    canvas.paste(badge_resized, (bx, by), badge_resized)
    draw.rectangle([bx, by, bx + bw, by + bh], outline=(46, 160, 67), width=2)

    # 4 Category Result Cards
    grid = [
        ("Contextual Ads", "DoubleClick, Google AdSense, Yandex Direct, Criteo, Taboola, and Outbrain blocked at wire speed.", "100% Blocked"),
        ("Analytics & Telemetry", "Google Analytics (GA4), Hotjar, Yandex Metrica, Mixpanel, and Segment trackers suppressed.", "100% Blocked"),
        ("Evasive Ad Formats", "Pop-unders, in-page push notifications, and pre-roll video ad schedules defused natively.", "100% Defused"),
        ("Cosmetic Layout Engine", "High-specificity zero-layout CSS collapses ad slots to eliminate empty white box frames.", "Zero Layout Gaps")
    ]
    
    card_w = 520
    card_h = 170
    positions = [
        (100, 320),
        (660, 320),
        (100, 520),
        (660, 520)
    ]
    
    for (name, details, status), (cx, cy) in zip(grid, positions):
        draw.rounded_rectangle([cx, cy, cx + card_w, cy + card_h], radius=12, fill=(22, 27, 34), outline=(48, 54, 61), width=1)
        draw.text((cx + 25, cy + 22), name, font=font_feat_title, fill=(240, 246, 252))
        
        # Status badge inside card
        sbw = int(font_badge.getlength(status)) + 16
        draw.rounded_rectangle([cx + card_w - sbw - 25, cy + 22, cx + card_w - 25, cy + 48], radius=8, fill=(35, 134, 54), outline=(46, 160, 67))
        draw.text((cx + card_w - sbw - 17, cy + 27), status, font=font_badge, fill=(255, 255, 255))
        
        # Details text (word wrapped)
        words = details.split()
        lines = []
        cur_line = []
        for w in words:
            test_line = ' '.join(cur_line + [w])
            if font_feat_desc.getlength(test_line) < card_w - 50:
                cur_line.append(w)
            else:
                lines.append(' '.join(cur_line))
                cur_line = [w]
        if cur_line:
            lines.append(' '.join(cur_line))
            
        ly = cy + 68
        for l in lines:
            draw.text((cx + 25, ly), l, font=font_feat_desc, fill=(139, 148, 158))
            ly += 22

    # Save
    out_path = 'store_assets/screenshot_2_performance.png'
    canvas.save(out_path, 'PNG')
    print(f'[+] Created {out_path} ({canvas.size}, {canvas.mode})')

make_screenshot_1()
make_screenshot_2()
