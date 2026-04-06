/**
 * imageOptimization.ts
 * Utility to optimize images using wsrv.nl or other strategies.
 */

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
}

export const optimizeImage = (url: string | undefined, options: OptimizeOptions = {}) => {
  if (!url) return "";
  if (url.startsWith('data:')) return url; // Don't optimize base64 images

  const { width, height, quality = 80, fit = 'cover', blur } = options;

  // If it's an Unsplash URL, it might already have params, but we can override or use wsrv
  // Actually, wsrv.nl is very robust for all kinds of URLs
  const params = new URLSearchParams();
  params.set('url', url);
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('fit', fit);
  if (blur) params.set('blur', blur.toString());
  
  // Use WebP for better performance
  params.set('output', 'webp');
  params.set('we', '1'); // we=1 means "webp with alpha channel if needed"

  return `https://wsrv.nl/?${params.toString()}`;
};
