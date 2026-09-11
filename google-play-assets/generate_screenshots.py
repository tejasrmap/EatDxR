import os
import subprocess
from PIL import Image

ASSETS_DIR = r"E:\EatDxR\google-play-assets"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

os.makedirs(ASSETS_DIR, exist_ok=True)

screenshots = [
    {
        "id": "1",
        "name": "screenshot-1-culinary-feed.png",
        "badge": "★ LETTERBOXD FOR FOOD",
        "badge_color": "#f97316",
        "title": "Rate Every Meal.<br><span style='color:#f97316'>Trust Top Critics.</span>",
        "subtitle": "Discover verified restaurants, 100-point scores, and authentic gastronomic ratings.",
        "card_type": "feed"
    },
    {
        "id": "2",
        "name": "screenshot-2-food-radar.png",
        "badge": "📍 REAL-TIME GEOSPATIAL RADAR",
        "badge_color": "#22d3ee",
        "title": "Explore Nearby Spots<br><span style='color:#22d3ee'>With Live GPS Radar.</span>",
        "subtitle": "Turn-by-turn navigation, real-world distance, and verified culinary stages.",
        "card_type": "radar"
    },
    {
        "id": "3",
        "name": "screenshot-3-curated-trails.png",
        "badge": "🧭 MULTI-STOP CRAWLS",
        "badge_color": "#fbbf24",
        "title": "Curated Itineraries<br><span style='color:#fbbf24'>For Passionate Eaters.</span>",
        "subtitle": "Midnight dessert crawls, heritage biryani trails, and chef-curated walking routes.",
        "card_type": "trails"
    },
    {
        "id": "4",
        "name": "screenshot-4-craving-reels.png",
        "badge": "🔥 AI TASTE MATCHER",
        "badge_color": "#ec4899",
        "title": "Satisfy Any Craving<br><span style='color:#ec4899'>In 60 Seconds.</span>",
        "subtitle": "Immersive dish reels, culinary videos, and instant craving recommendations.",
        "card_type": "cravings"
    }
]

def generate_html(sc):
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    background: #050507;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  }}
  .canvas {{
    position: relative;
    width: 1080px;
    height: 1920px;
    background: radial-gradient(circle at 50% 20%, #171518 0%, #070709 65%, #000000 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 110px 70px 0 70px;
    overflow: hidden;
  }}
  
  /* Ambient glowing orbs */
  .orb-top {{
    position: absolute;
    top: -120px;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 800px;
    border-radius: 50%;
    background: radial-gradient(circle, {sc['badge_color']}2a 0%, transparent 68%);
    filter: blur(80px);
    pointer-events: none;
  }}
  
  /* Header section */
  .badge {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border-radius: 999px;
    background: {sc['badge_color']}18;
    border: 1.5px solid {sc['badge_color']}45;
    color: {sc['badge_color']};
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }}
  .title {{
    font-size: 72px;
    font-weight: 950;
    color: #ffffff;
    text-align: center;
    line-height: 1.15;
    letter-spacing: -0.03em;
    margin-bottom: 20px;
  }}
  .subtitle {{
    font-size: 27px;
    color: #a1a1aa;
    text-align: center;
    max-width: 820px;
    line-height: 1.4;
    margin-bottom: 70px;
  }}

  /* Phone Frame Device Container */
  .device-mockup {{
    position: relative;
    width: 820px;
    height: 1350px;
    background: #09090b;
    border: 12px solid #27272a;
    border-radius: 64px 64px 0 0;
    border-bottom: none;
    box-shadow: 0 -20px 80px rgba(0,0,0,0.9), 0 0 0 2px rgba(255,255,255,0.08);
    overflow: hidden;
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }}
  
  /* Top Notch & Status */
  .status-bar {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px 20px 20px;
    color: #ffffff;
    font-size: 20px;
    font-weight: 700;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }}
  .app-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
  }}
  .logo {{
    font-size: 32px;
    font-weight: 950;
    letter-spacing: -0.03em;
    color: #ffffff;
  }}
  .logo span {{ color: #f97316; }}
  
  /* Content inside mock */
  .mock-content {{
    display: flex;
    flex-direction: column;
    gap: 24px;
  }}
  .card {{
    background: rgba(24, 24, 27, 0.85);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 32px;
    padding: 28px;
    box-shadow: 0 16px 36px rgba(0,0,0,0.6);
  }}
  .card-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }}
  .critic-box {{
    display: flex;
    align-items: center;
    gap: 14px;
  }}
  .critic-avatar {{
    width: 56px;
    height: 56px;
    border-radius: 18px;
    background: linear-gradient(135deg, #f97316, #ef4444);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 22px;
    font-weight: 900;
  }}
  .critic-name {{
    font-size: 22px;
    font-weight: 900;
    color: #ffffff;
  }}
  .critic-level {{
    font-size: 15px;
    color: #f97316;
    font-weight: 800;
    text-transform: uppercase;
  }}
  .score-dial {{
    padding: 8px 18px;
    border-radius: 16px;
    background: rgba(251, 191, 36, 0.15);
    border: 1.5px solid rgba(251, 191, 36, 0.4);
    color: #fbbf24;
    font-size: 22px;
    font-weight: 950;
  }}
  .item-title {{
    font-size: 28px;
    font-weight: 900;
    color: #ffffff;
    margin-bottom: 8px;
  }}
  .item-sub {{
    font-size: 18px;
    color: #a1a1aa;
    margin-bottom: 18px;
  }}
  .chips-row {{
    display: flex;
    gap: 10px;
    margin-top: 14px;
  }}
  .chip {{
    padding: 8px 16px;
    border-radius: 12px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #e4e4e7;
    font-size: 16px;
    font-weight: 700;
  }}
</style>
</head>
<body>
  <div class="canvas">
    <div class="orb-top"></div>
    
    <div class="badge">{sc['badge']}</div>
    <div class="title">{sc['title']}</div>
    <div class="subtitle">{sc['subtitle']}</div>
    
    <div class="device-mockup">
      <div class="status-bar">
        <span>19:47</span>
        <span>5G • 100%</span>
      </div>
      <div class="app-header">
        <div class="logo">MADEATER<span>.</span></div>
        <div style="font-size: 18px; color: #fb923c; font-weight: 800; background: rgba(249,115,22,0.12); padding: 6px 14px; border-radius: 999px;">📍 HYDERABAD</div>
      </div>
      
      <div class="mock-content">
        <div class="card">
          <div class="card-header">
            <div class="critic-box">
              <div class="critic-avatar">M</div>
              <div>
                <div class="critic-name">Chef Rahul &bull; Verified Critic</div>
                <div class="critic-level">Top 1% Gastronomic Curator</div>
              </div>
            </div>
            <div class="score-dial">★ 98/100</div>
          </div>
          
          <div class="item-title">Mutton Dum Biryani</div>
          <div class="item-sub">Bawarchi Restaurant &bull; RTC X Roads, Hyderabad</div>
          
          <div style="font-size: 18px; color: #d4d4d8; font-style: italic; line-height: 1.45; background: rgba(255,255,255,0.04); padding: 14px 18px; border-left: 4px solid #f97316; border-radius: 0 14px 14px 0;">
            "Long grain basmati slow-infused with saffron & melt-in-mouth tender meat. An iconic benchmark."
          </div>
          
          <div class="chips-row">
            <div class="chip">🍗 Chicken Dum Biryani</div>
            <div class="chip">🥘 Mirchi Ka Salan</div>
            <div class="chip">🍢 Tangdi Kebab</div>
          </div>
        </div>

        <div class="card" style="border-color: rgba(249,115,22,0.25); background: rgba(24,24,27,0.95);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 14px; font-weight: 900; color: #f97316; text-transform: uppercase; letter-spacing: 0.1em;">FEATURED ITINERARY</div>
              <div style="font-size: 24px; font-weight: 900; color: #fff; margin-top: 4px;">Indiranagar Midnight Dessert Crawl</div>
              <div style="font-size: 16px; color: #a1a1aa; margin-top: 4px;">3 Stops &bull; 2.2 km &bull; ~2.5 hrs &bull; ₹600 - ₹900</div>
            </div>
            <div style="padding: 12px 20px; background: #f97316; color: #000; font-weight: 950; font-size: 16px; border-radius: 16px;">
              VIEW TRAIL
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

for sc in screenshots:
    html_content = generate_html(sc)
    temp_html = os.path.join(ASSETS_DIR, f"temp_{sc['id']}.html")
    raw_png = os.path.join(ASSETS_DIR, f"raw_{sc['id']}.png")
    final_png = os.path.join(ASSETS_DIR, sc['name'])
    
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    cmd = [
        EDGE_PATH,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1080,1920",
        f"--screenshot={raw_png}",
        f"file:///{temp_html.replace(os.sep, '/')}"
    ]
    print(f"Capturing {sc['name']}...")
    subprocess.run(cmd, check=True)
    
    im = Image.open(raw_png)
    im = im.crop((0, 0, 1080, 1920))
    im.save(final_png, "PNG", optimize=True)
    print(f"Saved: {final_png} ({im.size[0]}x{im.size[1]}, {os.path.getsize(final_png)} bytes)")
    
    if os.path.exists(temp_html):
        os.remove(temp_html)
    if os.path.exists(raw_png):
        os.remove(raw_png)

print("All 4 Google Play screenshots generated successfully!")
