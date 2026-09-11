import os
import subprocess
import time
from PIL import Image

ASSETS_DIR = r"E:\EatDxR\google-play-assets"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

os.makedirs(ASSETS_DIR, exist_ok=True)

# 1. HTML Template for 512x512 App Icon
icon_html = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 512px;
    height: 512px;
    overflow: hidden;
    background: #09090b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .icon-canvas {
    position: relative;
    width: 512px;
    height: 512px;
    background: radial-gradient(circle at 50% 45%, #1c1917 0%, #0c0a09 60%, #050506 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  /* Ambient glow behind emblem */
  .glow-core {
    position: absolute;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(249, 115, 22, 0.28) 0%, rgba(239, 68, 68, 0.12) 45%, transparent 70%);
    filter: blur(28px);
    pointer-events: none;
  }
  /* Subtle inner keyline */
  .keyline {
    position: absolute;
    inset: 16px;
    border-radius: 96px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }
  /* Center SVG Emblem */
  .emblem {
    position: relative;
    z-index: 10;
    width: 310px;
    height: 310px;
    filter: drop-shadow(0 14px 28px rgba(249, 115, 22, 0.42)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
  }
</style>
</head>
<body>
  <div class="icon-canvas">
    <div class="glow-core"></div>
    <div class="keyline"></div>
    <svg class="emblem" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flame" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff8a00" />
          <stop offset="45%" stop-color="#f97316" />
          <stop offset="100%" stop-color="#ea580c" />
        </linearGradient>
        <linearGradient id="sparkle" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
      </defs>
      
      <!-- Stylized Madeater "M" with fork tines crown -->
      <path d="M120 400 L120 168 C120 148 138 134 156 144 L244 196 C251 200 261 200 268 196 L356 144 C374 134 392 148 392 168 L392 400 C392 414 378 426 364 426 L350 426 C336 426 324 414 324 400 L324 232 L274 266 C263 273 249 273 238 266 L188 232 L188 400 C188 414 176 426 162 426 L148 426 C134 426 120 414 120 400 Z" fill="url(#flame)" />
      
      <!-- Culinary Crest Crown Dot & Star -->
      <circle cx="256" cy="116" r="32" fill="url(#sparkle)" />
      <path d="M256 72 L261 103 L292 108 L261 113 L256 144 L251 113 L220 108 L251 103 Z" fill="#ffffff" />
    </svg>
  </div>
</body>
</html>
"""

icon_html_path = os.path.join(ASSETS_DIR, "icon_temp.html")
with open(icon_html_path, "w", encoding="utf-8") as f:
    f.write(icon_html)

raw_icon_png = os.path.join(ASSETS_DIR, "icon_raw.png")
final_icon_png = os.path.join(ASSETS_DIR, "app-icon-512x512.png")

cmd = [
    EDGE_PATH,
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    f"--window-size=512,512",
    f"--screenshot={raw_icon_png}",
    f"file:///{icon_html_path.replace(os.sep, '/')}"
]
print("Capturing 512x512 icon with Edge...")
subprocess.run(cmd, check=True)

# Post-process with PIL to verify exact 512x512 dimensions & optimize
im = Image.open(raw_icon_png)
im = im.crop((0, 0, 512, 512))
im.save(final_icon_png, "PNG", optimize=True)
print(f"Saved App Icon: {final_icon_png} ({im.size[0]}x{im.size[1]}, {os.path.getsize(final_icon_png)} bytes)")

# 2. HTML Template for 1024x500 Feature Graphic
feature_html = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 1024px;
    height: 500px;
    overflow: hidden;
    background: #09090b;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  }
  .banner {
    position: relative;
    width: 1024px;
    height: 500px;
    background: #070709;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 48px 64px;
    overflow: hidden;
  }
  
  /* Gourmet warm culinary backdrop glow */
  .bg-glow-left {
    position: absolute;
    left: -80px;
    top: -60px;
    width: 520px;
    height: 520px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(249, 115, 22, 0.22) 0%, rgba(239, 68, 68, 0.08) 50%, transparent 70%);
    filter: blur(48px);
    pointer-events: none;
  }
  .bg-glow-right {
    position: absolute;
    right: -60px;
    bottom: -80px;
    width: 580px;
    height: 580px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(251, 146, 60, 0.18) 0%, rgba(180, 83, 9, 0.08) 60%, transparent 75%);
    filter: blur(52px);
    pointer-events: none;
  }

  /* Decorative subtle grid line */
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 36px 36px;
    opacity: 0.8;
    pointer-events: none;
  }

  /* Left Hero Content */
  .hero-content {
    position: relative;
    z-index: 10;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .pill-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(249, 115, 22, 0.12);
    border: 1px solid rgba(249, 115, 22, 0.35);
    color: #fb923c;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    width: fit-content;
  }
  .pill-badge .star-icon {
    color: #f59e0b;
    font-size: 13px;
  }
  .title-wrap {
    display: flex;
    align-items: baseline;
    gap: 2px;
  }
  .main-title {
    font-size: 58px;
    font-weight: 950;
    letter-spacing: -0.035em;
    color: #ffffff;
    line-height: 1;
    text-transform: uppercase;
  }
  .period-dot {
    color: #f97316;
    font-size: 64px;
    line-height: 0;
    font-weight: 950;
    margin-left: 2px;
  }
  .tagline {
    font-size: 20px;
    font-weight: 700;
    color: #e4e4e7;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }
  .description {
    font-size: 13px;
    color: #a1a1aa;
    line-height: 1.5;
    max-width: 440px;
  }
  .tags-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .tag-item {
    padding: 4px 11px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 11px;
    color: #d4d4d8;
    font-weight: 600;
  }

  /* Right Visual Cards Showcase */
  .visual-showcase {
    position: relative;
    z-index: 10;
    width: 380px;
    height: 380px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Main Featured Critic Card */
  .critic-card {
    position: absolute;
    width: 340px;
    background: rgba(18, 18, 22, 0.88);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(249, 115, 22, 0.15);
    transform: rotate(2deg);
  }
  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .author-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #f97316, #ef4444);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 900;
    font-size: 15px;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
  }
  .author-info h4 {
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
  }
  .author-info p {
    color: #f97316;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .score-badge {
    background: rgba(251, 191, 36, 0.12);
    border: 1px solid rgba(251, 191, 36, 0.35);
    color: #fbbf24;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .dish-title {
    font-size: 18px;
    font-weight: 900;
    color: #ffffff;
    margin-bottom: 6px;
  }
  .dish-place {
    font-size: 12px;
    color: #a1a1aa;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .review-quote {
    font-size: 12.5px;
    line-height: 1.45;
    color: #d4d4d8;
    background: rgba(255, 255, 255, 0.03);
    border-left: 3px solid #f97316;
    padding: 8px 12px;
    border-radius: 0 10px 10px 0;
    font-style: italic;
  }
  
  /* Secondary floating pill */
  .floating-trail-pill {
    position: absolute;
    bottom: -10px;
    left: -20px;
    background: rgba(24, 24, 28, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 999px;
    padding: 10px 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.6);
    transform: rotate(-3deg);
  }
  .trail-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #10b981;
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 900;
  }
  .trail-text h5 {
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
  }
  .trail-text p {
    color: #9ca3af;
    font-size: 10px;
  }
</style>
</head>
<body>
  <div class="banner">
    <div class="bg-glow-left"></div>
    <div class="bg-glow-right"></div>
    <div class="grid-pattern"></div>

    <!-- Left Side: Hero Brand & Taglines -->
    <div class="hero-content">
      <div class="pill-badge">
        <span class="star-icon">★</span> Letterboxd for Food
      </div>

      <div class="title-wrap">
        <span class="main-title">MADEATER</span>
        <span class="period-dot">.</span>
      </div>

      <div class="tagline">
        The Culinary Stage. Curate, Critique & Discover.
      </div>

      <div class="description">
        Rate unforgettable dishes, follow verified food critics, and unlock multi-stop culinary crawls curated across the world's most vibrant gastronomic hubs.
      </div>

      <div class="tags-row">
        <span class="tag-item">🍽️ 100-Point Critic Scores</span>
        <span class="tag-item">🧭 Curated Trails</span>
        <span class="tag-item">📍 Food Radar</span>
      </div>
    </div>

    <!-- Right Side: Beautiful App Preview Card -->
    <div class="visual-showcase">
      <div class="critic-card">
        <div class="card-top">
          <div class="author-meta">
            <div class="avatar">M</div>
            <div class="author-info">
              <h4>Chef Rahul</h4>
              <p>Madeater Top Critic</p>
            </div>
          </div>
          <div class="score-badge">
            <span>★</span> 98/100
          </div>
        </div>

        <div class="dish-title">Dark Chocolate Gelato</div>
        <div class="dish-place">Milano Ice Cream • Indiranagar, Bangalore</div>

        <div class="review-quote">
          "Uncompromised artisanal perfection. Freshly spun daily with intense Venezuelan cocoa."
        </div>
      </div>

      <div class="floating-trail-pill">
        <div class="trail-icon">🧭</div>
        <div class="trail-text">
          <h5>Midnight Dessert Crawl</h5>
          <p>3 Legendary Stops • 2.2 km</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

feature_html_path = os.path.join(ASSETS_DIR, "feature_temp.html")
with open(feature_html_path, "w", encoding="utf-8") as f:
    f.write(feature_html)

raw_feature_png = os.path.join(ASSETS_DIR, "feature_raw.png")
final_feature_png = os.path.join(ASSETS_DIR, "feature-graphic-1024x500.png")

cmd_feature = [
    EDGE_PATH,
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    f"--window-size=1024,500",
    f"--screenshot={raw_feature_png}",
    f"file:///{feature_html_path.replace(os.sep, '/')}"
]
print("Capturing 1024x500 feature graphic with Edge...")
subprocess.run(cmd_feature, check=True)

im_feat = Image.open(raw_feature_png)
im_feat = im_feat.crop((0, 0, 1024, 500))
im_feat.save(final_feature_png, "PNG", optimize=True)
print(f"Saved Feature Graphic: {final_feature_png} ({im_feat.size[0]}x{im_feat.size[1]}, {os.path.getsize(final_feature_png)} bytes)")

# Clean up temporary html and raw captures
for temp_file in [icon_html_path, raw_icon_png, feature_html_path, raw_feature_png]:
    if os.path.exists(temp_file):
        os.remove(temp_file)

print("All Google Play Store graphics generated successfully!")
