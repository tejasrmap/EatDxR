import os
import subprocess
from PIL import Image

ASSETS_DIR = r"E:\EatDxR\google-play-assets"
DIR_7INCH = os.path.join(ASSETS_DIR, "tablet-7inch")
DIR_10INCH = os.path.join(ASSETS_DIR, "tablet-10inch")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

os.makedirs(DIR_7INCH, exist_ok=True)
os.makedirs(DIR_10INCH, exist_ok=True)

tablet_screens = [
    {
        "id": "1",
        "name_7": "screenshot-7inch-1-feed.png",
        "name_10": "screenshot-10inch-1-feed.png",
        "badge": "★ TABLET OPTIMIZED • LETTERBOXD FOR FOOD",
        "badge_color": "#f97316",
        "title": "A Cinematic Culinary Stage<br><span style='color:#f97316'>On Your Tablet.</span>",
        "subtitle": "Immerse in verified reviews, 100-point critic scores, and rich tasting notes on the big screen.",
        "dish_name": "Authentic Mutton Dum Biryani",
        "restaurant": "Bawarchi Restaurant • RTC X Roads, Hyderabad",
        "score": "98/100",
        "critic": "Chef Rahul • Verified Critic",
        "quote": "Slow-infused long-grain basmati with rich aromatic saffron, caramelized onions, and melt-in-mouth tender meat.",
        "trail_title": "Indiranagar Midnight Dessert Crawl",
        "trail_meta": "3 Legendary Stops • 2.2 km • ~2.5 hrs"
    },
    {
        "id": "2",
        "name_7": "screenshot-7inch-2-radar.png",
        "name_10": "screenshot-10inch-2-radar.png",
        "badge": "📍 REAL-TIME GEOSPATIAL MAP",
        "badge_color": "#22d3ee",
        "title": "Interactive Food Radar<br><span style='color:#22d3ee'>With Live GPS Pinpointing.</span>",
        "subtitle": "Discover verified culinary spots across Hyderabad, Bangalore, Mumbai, Delhi, Tokyo, and New York.",
        "dish_name": "Milano Artisanal Gelato",
        "restaurant": "100ft Road, Indiranagar, Bangalore",
        "score": "★ 4.9",
        "critic": "Live GPS • 1.4 km Away",
        "quote": "Direct turn-by-turn navigation via Google Maps & Apple Maps with signature must-order culinary picks.",
        "trail_title": "Old Town Heritage Biryani Trail",
        "trail_meta": "4 Heritage Stops • 3.5 km • Frazer Town"
    },
    {
        "id": "3",
        "name_7": "screenshot-7inch-3-trails.png",
        "name_10": "screenshot-10inch-3-trails.png",
        "badge": "🧭 MULTI-STOP CRAWLS",
        "badge_color": "#fbbf24",
        "title": "Curated Food Crawls<br><span style='color:#fbbf24'>Designed by Top Critics.</span>",
        "subtitle": "Walk, dine, and discover must-order dishes at every stop with interactive route tracking.",
        "dish_name": "Midnight Dessert Crawl",
        "restaurant": "Indiranagar 100ft Road Epicenter",
        "score": "Top Pick",
        "critic": "Chef Rahul • Master Curator",
        "quote": "An indulgent midnight trail through artisanal ice creams, warm molten cookies, and Basque cheesecakes.",
        "trail_title": "Bandra Late Night Street Bites",
        "trail_meta": "3 Stops • 1.8 km • Mumbai Heritage"
    },
    {
        "id": "4",
        "name_7": "screenshot-7inch-4-cravings.png",
        "name_10": "screenshot-10inch-4-cravings.png",
        "badge": "🔥 AI TASTE MATCHER",
        "badge_color": "#ec4899",
        "title": "Smart Taste Matcher<br><span style='color:#ec4899'>Satisfy Any Craving.</span>",
        "subtitle": "Immersive short-form dish reels and AI flavor matching tailored to your exact mood.",
        "dish_name": "Dark Chocolate Gelato & DBC",
        "restaurant": "Corner House • Classic Desserts",
        "score": "99% Match",
        "critic": "AI Taste Engine • Verified",
        "quote": "Double hot fudge sauce layered over classic Swiss chocolate ice cream and toasted walnuts.",
        "trail_title": "SRMAP Campus Culinary Hub",
        "trail_meta": "Authentic Andhra Spiced Biryani & Shakes"
    }
]

def build_tablet_html(sc, width, height):
    is_10inch = (width > 1400)
    scale = 1.33 if is_10inch else 1.0
    
    pad_top = int(80 * scale)
    badge_fs = int(18 * scale)
    title_fs = int(54 * scale)
    sub_fs = int(22 * scale)
    device_w = int(width * 0.88)
    device_h = int(height - pad_top - (220 * scale))
    
    return f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{
    width: {width}px;
    height: {height}px;
    overflow: hidden;
    background: #050507;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }}
  .canvas {{
    position: relative;
    width: {width}px;
    height: {height}px;
    background: radial-gradient(circle at 50% 15%, #181519 0%, #08080a 60%, #000000 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: {pad_top}px 40px 0 40px;
    overflow: hidden;
  }}
  .orb {{
    position: absolute;
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    width: {int(900 * scale)}px;
    height: {int(900 * scale)}px;
    border-radius: 50%;
    background: radial-gradient(circle, {sc['badge_color']}26 0%, transparent 68%);
    filter: blur(90px);
    pointer-events: none;
  }}
  .badge {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: {int(8*scale)}px {int(20*scale)}px;
    border-radius: 999px;
    background: {sc['badge_color']}18;
    border: 1.5px solid {sc['badge_color']}45;
    color: {sc['badge_color']};
    font-size: {badge_fs}px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: {int(16*scale)}px;
  }}
  .title {{
    font-size: {title_fs}px;
    font-weight: 950;
    color: #ffffff;
    text-align: center;
    line-height: 1.15;
    letter-spacing: -0.03em;
    margin-bottom: {int(14*scale)}px;
  }}
  .subtitle {{
    font-size: {sub_fs}px;
    color: #a1a1aa;
    text-align: center;
    max-width: {int(900*scale)}px;
    line-height: 1.4;
    margin-bottom: {int(40*scale)}px;
  }}
  
  .tablet-mockup {{
    position: relative;
    width: {device_w}px;
    height: {device_h}px;
    background: #0c0a0e;
    border: {int(16*scale)}px solid #27272a;
    border-radius: {int(48*scale)}px {int(48*scale)}px 0 0;
    border-bottom: none;
    box-shadow: 0 -20px 80px rgba(0,0,0,0.95), 0 0 0 2px rgba(255,255,255,0.08);
    overflow: hidden;
    padding: {int(24*scale)}px;
    display: flex;
    flex-direction: column;
    gap: {int(18*scale)}px;
  }}
  .tab-bar {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: {int(14*scale)}px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    color: #ffffff;
  }}
  .tab-logo {{
    font-size: {int(28*scale)}px;
    font-weight: 950;
    letter-spacing: -0.03em;
  }}
  .tab-logo span {{ color: #f97316; }}
  .tab-actions {{
    display: flex;
    align-items: center;
    gap: {int(12*scale)}px;
  }}
  .pill-tag {{
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    padding: {int(6*scale)}px {int(16*scale)}px;
    border-radius: 999px;
    font-size: {int(14*scale)}px;
    font-weight: 700;
    color: #e4e4e7;
  }}

  .tablet-grid {{
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: {int(18*scale)}px;
    height: 100%;
  }}
  .card {{
    background: rgba(24, 24, 28, 0.88);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: {int(28*scale)}px;
    padding: {int(22*scale)}px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .card-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: {int(12*scale)}px;
  }}
  .author-box {{
    display: flex;
    align-items: center;
    gap: {int(10*scale)}px;
  }}
  .avatar {{
    width: {int(46*scale)}px;
    height: {int(46*scale)}px;
    border-radius: {int(14*scale)}px;
    background: linear-gradient(135deg, #f97316, #ef4444);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: {int(18*scale)}px;
    font-weight: 900;
  }}
  .author-info h4 {{
    color: #ffffff;
    font-size: {int(17*scale)}px;
    font-weight: 900;
  }}
  .author-info p {{
    color: #f97316;
    font-size: {int(12*scale)}px;
    font-weight: 800;
    text-transform: uppercase;
  }}
  .score-badge {{
    padding: {int(6*scale)}px {int(14*scale)}px;
    border-radius: {int(12*scale)}px;
    background: rgba(251, 191, 36, 0.15);
    border: 1.5px solid rgba(251, 191, 36, 0.4);
    color: #fbbf24;
    font-size: {int(16*scale)}px;
    font-weight: 950;
  }}
  .dish-title {{
    font-size: {int(22*scale)}px;
    font-weight: 900;
    color: #ffffff;
    margin-bottom: {int(6*scale)}px;
  }}
  .dish-sub {{
    font-size: {int(14*scale)}px;
    color: #a1a1aa;
    margin-bottom: {int(14*scale)}px;
  }}
  .quote-box {{
    font-size: {int(14*scale)}px;
    color: #d4d4d8;
    line-height: 1.45;
    background: rgba(255, 255, 255, 0.04);
    padding: {int(12*scale)}px {int(16*scale)}px;
    border-left: {int(4*scale)}px solid #f97316;
    border-radius: 0 {int(12*scale)}px {int(12*scale)}px 0;
    font-style: italic;
    margin-bottom: {int(14*scale)}px;
  }}
  .chips-row {{
    display: flex;
    flex-wrap: wrap;
    gap: {int(8*scale)}px;
  }}
  .chip {{
    padding: {int(6*scale)}px {int(12*scale)}px;
    border-radius: {int(10*scale)}px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #e4e4e7;
    font-size: {int(12*scale)}px;
    font-weight: 700;
  }}
</style>
</head>
<body>
  <div class="canvas">
    <div class="orb"></div>
    <div class="badge">{sc['badge']}</div>
    <div class="title">{sc['title']}</div>
    <div class="subtitle">{sc['subtitle']}</div>

    <div class="tablet-mockup">
      <div class="tab-bar">
        <div class="tab-logo">MADEATER<span>.</span></div>
        <div class="tab-actions">
          <div class="pill-tag">📍 Hyderabad, Bangalore, Mumbai</div>
          <div class="pill-tag" style="background: rgba(249,115,22,0.15); color: #fb923c; border-color: rgba(249,115,22,0.4);">
            ★ Verified Critics
          </div>
        </div>
      </div>

      <div class="tablet-grid">
        <div class="card">
          <div>
            <div class="card-header">
              <div class="author-box">
                <div class="avatar">M</div>
                <div class="author-info">
                  <h4>{sc['critic']}</h4>
                  <p>Gastronomic Curator</p>
                </div>
              </div>
              <div class="score-badge">{sc['score']}</div>
            </div>

            <div class="dish-title">{sc['dish_name']}</div>
            <div class="dish-sub">{sc['restaurant']}</div>

            <div class="quote-box">"{sc['quote']}"</div>
          </div>

          <div class="chips-row">
            <div class="chip">🍗 Signature Highlight</div>
            <div class="chip">🥘 100-Pt Verified</div>
            <div class="chip">✨ Top Critic Pick</div>
          </div>
        </div>

        <div class="card" style="border-color: rgba(249,115,22,0.25);">
          <div>
            <div style="font-size: {int(12*scale)}px; font-weight: 900; color: #f97316; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">
              CURATED ITINERARY
            </div>
            <div style="font-size: {int(20*scale)}px; font-weight: 900; color: #ffffff; margin-bottom: 6px;">
              {sc['trail_title']}
            </div>
            <div style="font-size: {int(13*scale)}px; color: #a1a1aa; margin-bottom: 16px;">
              {sc['trail_meta']}
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: {int(16*scale)}px; padding: {int(14*scale)}px; margin-bottom: 14px;">
              <div style="font-size: {int(13*scale)}px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">📍 Real-World Food Radar</div>
              <div style="font-size: {int(12*scale)}px; color: #71717a;">Interactive live map with turn-by-turn routing across top stages.</div>
            </div>
          </div>

          <div style="padding: {int(12*scale)}px; background: #f97316; color: #000000; font-weight: 950; font-size: {int(14*scale)}px; border-radius: {int(14*scale)}px; text-align: center; text-transform: uppercase;">
            Explore On Tablet
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
'''

print("Rendering 7-inch tablet screenshots (1200x1920)...")
for sc in tablet_screens:
    html = build_tablet_html(sc, 1200, 1920)
    temp_html = os.path.join(DIR_7INCH, f"temp_{sc['id']}.html")
    raw_png = os.path.join(DIR_7INCH, f"raw_{sc['id']}.png")
    final_png = os.path.join(DIR_7INCH, sc['name_7'])

    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html)

    cmd = [
        EDGE_PATH,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1200,1920",
        f"--screenshot={raw_png}",
        f"file:///{temp_html.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd, check=True)

    im = Image.open(raw_png)
    im = im.crop((0, 0, 1200, 1920))
    im.save(final_png, "PNG", optimize=True)
    print(f"Saved 7-inch: {final_png} ({im.size[0]}x{im.size[1]}, {os.path.getsize(final_png)} bytes)")

    if os.path.exists(temp_html): os.remove(temp_html)
    if os.path.exists(raw_png): os.remove(raw_png)

print("Rendering 10-inch tablet screenshots (1600x2560)...")
for sc in tablet_screens:
    html = build_tablet_html(sc, 1600, 2560)
    temp_html = os.path.join(DIR_10INCH, f"temp_{sc['id']}.html")
    raw_png = os.path.join(DIR_10INCH, f"raw_{sc['id']}.png")
    final_png = os.path.join(DIR_10INCH, sc['name_10'])

    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html)

    cmd = [
        EDGE_PATH,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1600,2560",
        f"--screenshot={raw_png}",
        f"file:///{temp_html.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd, check=True)

    im = Image.open(raw_png)
    im = im.crop((0, 0, 1600, 2560))
    im.save(final_png, "PNG", optimize=True)
    print(f"Saved 10-inch: {final_png} ({im.size[0]}x{im.size[1]}, {os.path.getsize(final_png)} bytes)")

    if os.path.exists(temp_html): os.remove(temp_html)
    if os.path.exists(raw_png): os.remove(raw_png)

print("All 7-inch and 10-inch tablet screenshots rendered successfully!")
