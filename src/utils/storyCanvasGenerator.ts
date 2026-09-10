// High-definition 1080x1920 (9:16) Canvas Story Generator for Madeater
import { Review, FoodTrail } from '../types';

export type StoryTheme = 'cinematic' | 'editorial' | 'neon';

// Helper to safely load an image with anonymous CORS and fallback
async function loadImageSafe(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Try with wsrv.nl proxy as backup
      const proxyImg = new Image();
      proxyImg.crossOrigin = 'anonymous';
      proxyImg.onload = () => resolve(proxyImg);
      proxyImg.onerror = () => resolve(null);
      proxyImg.src = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png`;
    };
    img.src = url;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generate a pristine 1080x1920 Story Card blob for a Review
 */
export async function generateReviewStoryBlob(
  review: Review,
  theme: StoryTheme = 'cinematic'
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dishImage = review.dishes?.find((d) => d.image)?.image;
  const heroUrl = dishImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';
  const avatarUrl = review.userPhoto;

  const [heroImg, avatarImg] = await Promise.all([
    loadImageSafe(heroUrl),
    loadImageSafe(avatarUrl),
  ]);

  // 1. Background Fill
  if (theme === 'cinematic') {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#0a0a0d');
    bgGrad.addColorStop(0.5, '#141419');
    bgGrad.addColorStop(1, '#050508');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glowing atmospheric ambient orbs
    const glow1 = ctx.createRadialGradient(200, 300, 10, 200, 300, 500);
    glow1.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
    glow1.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 1080, 1920);

    const glow2 = ctx.createRadialGradient(880, 1500, 10, 880, 1500, 550);
    glow2.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
    glow2.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, 1080, 1920);
  } else if (theme === 'editorial') {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#120d0a');
    bgGrad.addColorStop(0.5, '#1c1511');
    bgGrad.addColorStop(1, '#0a0705');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Gold decorative border
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 1000, 1840);
  } else {
    // Neon theme
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#180a22');
    bgGrad.addColorStop(0.5, '#0e0b16');
    bgGrad.addColorStop(1, '#05020a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    const glow = ctx.createRadialGradient(540, 960, 50, 540, 960, 700);
    glow.addColorStop(0, 'rgba(236, 72, 153, 0.22)');
    glow.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1920);
  }

  // 2. Header Bar (Critic Pass Badge & City)
  ctx.save();
  // Critic Pass Pill
  roundRect(ctx, 80, 100, 260, 64, 32);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('★ CRITIC PASS', 110, 142);

  // City Pill
  const cityText = (review.city || 'Verified Spot').toUpperCase();
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const cityWidth = ctx.measureText(cityText).width + 60;
  roundRect(ctx, 1000 - cityWidth, 100, cityWidth, 64, 32);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(`📍 ${cityText}`, 1000 - cityWidth + 28, 142);
  ctx.restore();

  // 3. Hero Dish Image Frame (920px width x 820px height)
  const heroX = 80;
  const heroY = 200;
  const heroW = 920;
  const heroH = 800;
  const heroRadius = 40;

  ctx.save();
  roundRect(ctx, heroX, heroY, heroW, heroH, heroRadius);
  ctx.clip();

  if (heroImg) {
    // Cover-fit image
    const imgRatio = heroImg.width / heroImg.height;
    const frameRatio = heroW / heroH;
    let sx = 0, sy = 0, sWidth = heroImg.width, sHeight = heroImg.height;

    if (imgRatio > frameRatio) {
      sWidth = heroImg.height * frameRatio;
      sx = (heroImg.width - sWidth) / 2;
    } else {
      sHeight = heroImg.width / frameRatio;
      sy = (heroImg.height - sHeight) / 2;
    }
    ctx.drawImage(heroImg, sx, sy, sWidth, sHeight, heroX, heroY, heroW, heroH);
  } else {
    const dishBg = ctx.createLinearGradient(heroX, heroY, heroX + heroW, heroY + heroH);
    dishBg.addColorStop(0, '#f97316');
    dishBg.addColorStop(1, '#ef4444');
    ctx.fillStyle = dishBg;
    ctx.fillRect(heroX, heroY, heroW, heroH);
  }

  // Dark bottom overlay inside image for readability
  const grad = ctx.createLinearGradient(0, heroY + heroH * 0.4, 0, heroY + heroH);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = grad;
  ctx.fillRect(heroX, heroY, heroW, heroH);

  ctx.restore();

  // Hero Border & Shadow
  ctx.save();
  roundRect(ctx, heroX, heroY, heroW, heroH, heroRadius);
  ctx.strokeStyle = theme === 'editorial' ? 'rgba(217, 119, 6, 0.6)' : 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // 4. Rating Pill Overlay (Bottom-Right of Image)
  const score = review.rating <= 5 ? (review.rating * 2).toFixed(1) : review.rating.toFixed(1);
  const pillW = 210;
  const pillH = 80;
  const pillX = heroX + heroW - pillW - 30;
  const pillY = heroY + heroH - pillH - 30;

  ctx.save();
  roundRect(ctx, pillX, pillY, pillW, pillH, 26);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`★ ${score}`, pillX + 24, pillY + 54);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('/10', pillX + 148, pillY + 54);
  ctx.restore();

  // 5. Must-Order Ribbon (if applicable)
  const isMustOrder = review.dishes?.some((d) => d.isMustOrder);
  if (isMustOrder) {
    ctx.save();
    roundRect(ctx, heroX + 30, heroY + 30, 230, 60, 20);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('🔥 MUST-ORDER', heroX + 48, heroY + 68);
    ctx.restore();
  }

  // 6. Restaurant Name & Dish Details
  const textCenterY = 1080;
  ctx.save();
  ctx.textAlign = 'center';

  // Restaurant Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const restName = review.restaurantName || 'Signature Spot';
  ctx.fillText(restName.toUpperCase(), 540, textCenterY);

  // Dish Name
  const dishName = review.dishes?.[0]?.name || review.attachedDish || '';
  if (dishName) {
    ctx.fillStyle = '#f97316';
    ctx.font = 'italic bold 36px Georgia, serif';
    ctx.fillText(`"${dishName}"`, 540, textCenterY + 56);
  }

  // 7. Critic Quote Box
  if (review.content) {
    const quoteBoxY = textCenterY + 110;
    const quoteBoxW = 920;
    const quoteBoxH = 240;
    const quoteBoxX = 80;

    roundRect(ctx, quoteBoxX, quoteBoxY, quoteBoxW, quoteBoxH, 28);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Quotation icon
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillText('“', 540, quoteBoxY + 50);

    // Multi-line wrap
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'italic 28px Georgia, serif';
    wrapText(ctx, `"${review.content}"`, 540, quoteBoxY + 95, 840, 42, 3);
  }
  ctx.restore();

  // 8. Footer (Critic Avatar, Verified Badge, Madeater Branding)
  const footerY = 1720;
  ctx.save();

  // Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, footerY - 50);
  ctx.lineTo(1000, footerY - 50);
  ctx.stroke();

  // Critic Avatar Circle
  const avatarRadius = 44;
  const avatarCenterX = 80 + avatarRadius;
  const avatarCenterY = footerY + 20;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImg) {
    ctx.drawImage(
      avatarImg,
      avatarCenterX - avatarRadius,
      avatarCenterY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );
  } else {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(
      avatarCenterX - avatarRadius,
      avatarCenterY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );
  }
  ctx.restore();

  // Avatar Border
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Critic Name & Date
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(review.userName || 'Madeater Critic', avatarCenterX + 60, avatarCenterY - 6);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Verified Food Critic', avatarCenterX + 60, avatarCenterY + 28);

  // Right Side: MADEATER Logo
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f97316';
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('MADEATER.', 1000, avatarCenterY - 4);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DISH VERIFIED • 9:16', 1000, avatarCenterY + 26);

  ctx.restore();

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.98);
  });
}

/**
 * Generate a pristine 1080x1920 Story Card blob for a Food Trail
 */
export async function generateTrailStoryBlob(
  trail: FoodTrail,
  theme: StoryTheme = 'cinematic'
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const coverImg = await loadImageSafe(trail.coverImage);

  // 1. Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
  bgGrad.addColorStop(0, '#0c0a09');
  bgGrad.addColorStop(0.5, '#18120e');
  bgGrad.addColorStop(1, '#080504');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Ambient Orange Glow
  const glow = ctx.createRadialGradient(540, 600, 50, 540, 600, 600);
  glow.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
  glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Header
  roundRect(ctx, 80, 90, 320, 64, 32);
  ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🗺️ CURATED TRAIL', 110, 132);

  // City Tag
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`📍 ${trail.city.toUpperCase()}`, 1000, 132);
  ctx.textAlign = 'left';

  // 3. Hero Cover Image
  const heroX = 80;
  const heroY = 180;
  const heroW = 920;
  const heroH = 640;

  ctx.save();
  roundRect(ctx, heroX, heroY, heroW, heroH, 36);
  ctx.clip();
  if (coverImg) {
    ctx.drawImage(coverImg, 0, 0, coverImg.width, coverImg.height, heroX, heroY, heroW, heroH);
  } else {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(heroX, heroY, heroW, heroH);
  }
  const imgOverlay = ctx.createLinearGradient(0, heroY + 300, 0, heroY + heroH);
  imgOverlay.addColorStop(0, 'rgba(0,0,0,0)');
  imgOverlay.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = imgOverlay;
  ctx.fillRect(heroX, heroY, heroW, heroH);
  ctx.restore();

  // Trail Title & Stats
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(trail.title, 80, 890);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`⏱️ ${trail.estimatedTime}  •  💰 ${trail.estimatedCost}  •  🍴 ${trail.stops.length} Stops`, 80, 935);

  // 4. Trail Stops List (Up to 4 stops)
  let currentY = 990;
  trail.stops.slice(0, 4).forEach((stop, index) => {
    roundRect(ctx, 80, currentY, 920, 140, 24);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Number Badge
    roundRect(ctx, 105, currentY + 30, 44, 44, 22);
    ctx.fillStyle = '#f97316';
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${index + 1}`, 127, currentY + 61);
    ctx.textAlign = 'left';

    // Stop Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(stop.restaurantName, 175, currentY + 58);

    // Stop Dish Note
    ctx.fillStyle = '#f97316';
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText(`Must Try: "${stop.signatureDish}"`, 175, currentY + 102);

    currentY += 160;
  });

  // 5. Footer Branding
  const footerY = 1760;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, footerY - 40);
  ctx.lineTo(1000, footerY - 40);
  ctx.stroke();

  ctx.fillStyle = '#f97316';
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('MADEATER.', 80, footerY + 20);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Food Trails & Itinerary Guide', 80, footerY + 55);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Share & Crawl 🍔', 1000, footerY + 30);
  ctx.textAlign = 'left';

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.98);
  });
}

// Text wrapping helper
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 3
) {
  const words = text.split(' ');
  let line = '';
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      linesCount++;
      if (linesCount === maxLines) {
        ctx.fillText(line.trim() + '...', x, y);
        return;
      }
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
}
