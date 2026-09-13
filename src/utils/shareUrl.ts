import { triggerHaptic } from '../services/nativeService';

export const PRODUCTION_DOMAIN = 'https://www.madeater.in';

/**
 * Converts any local or relative path/URL to a canonical public production URL.
 * Automatically resolves 'localhost', '127.0.0.1', 'capacitor://', etc. to 'https://www.madeater.in'.
 */
export function getShareUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) {
    if (typeof window === 'undefined') return PRODUCTION_DOMAIN;
    pathOrUrl = window.location.pathname + window.location.search + window.location.hash;
  }

  // If already a full URL
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    if (pathOrUrl.includes('localhost') || pathOrUrl.includes('127.0.0.1') || pathOrUrl.includes('capacitor://')) {
      try {
        const parsed = new URL(pathOrUrl);
        return `${PRODUCTION_DOMAIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        return pathOrUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, PRODUCTION_DOMAIN);
      }
    }
    return pathOrUrl;
  }

  // Handle clean relative path
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${PRODUCTION_DOMAIN}${cleanPath}`;
}

/**
 * Opens Instagram Story camera directly across Android, iOS, and Web.
 * On Android, uses the official Intent URI so Android OS routes directly into Instagram story camera.
 * On iOS, uses the instagram-stories scheme.
 * On Desktop Web, opens Instagram.
 */
export function openInstagramStoryDirect(): void {
  try {
    triggerHaptic();
  } catch {
    // Ignore haptic errors
  }

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid) {
    // Android Intent URI targeting com.instagram.android with scheme instagram and story-camera
    const androidIntent = "intent://story-camera#Intent;package=com.instagram.android;scheme=instagram;end";
    
    // Create and click an invisible link
    const a = document.createElement("a");
    a.href = androidIntent;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Fallback: in case Intent didn't trigger, attempt direct custom scheme
    setTimeout(() => {
      try {
        window.location.href = "instagram://story-camera";
      } catch {
        // ignore
      }
    }, 400);
  } else if (isIOS) {
    // iOS Instagram Stories deep link
    window.location.href = "instagram-stories://share?source_application=com.madeater.app";
    setTimeout(() => {
      try {
        window.location.href = "instagram://story-camera";
      } catch {
        // ignore
      }
    }, 400);
  } else {
    // Desktop browser fallback
    window.open("https://www.instagram.com", "_blank", "noopener,noreferrer");
  }
}
