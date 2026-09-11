import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';

export const isNative = Capacitor.isNativePlatform();

/**
 * Trigger subtle haptic feedback for mobile interactions
 */
export async function triggerHaptic(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.impact({ style });
  } catch (err) {
    // Haptics not available on this device
  }
}

/**
 * Capture or pick a photo using native camera with web fallback
 */
export async function capturePhoto(): Promise<string | null> {
  if (isNative) {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Prompts: Camera or Photos
      });
      return photo.dataUrl || null;
    } catch (err) {
      console.warn("Native camera cancelled or failed:", err);
      return null;
    }
  }
  return null;
}

/**
 * Get high accuracy device location
 */
export async function getNativeLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (isNative) {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } else if ("geolocation" in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }
  } catch (err) {
    console.warn("Location fetch error:", err);
  }
  return null;
}

/**
 * Initialize Push Notifications on mobile device
 */
export async function setupPushNotifications(userId?: string): Promise<string | null> {
  if (!isNative) return null;

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('User denied push notification permission');
      return null;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.warn('Error on push registration:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed:', notification.actionId);
    });
  } catch (err) {
    console.warn('Push notification setup warning:', err);
  }

  return null;
}

/**
 * Configure native Android status bar, splash screen, and push notifications
 */
export async function initializeNativeApp(): Promise<void> {
  if (!isNative) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#050505' });
  } catch (e) {
    console.warn("StatusBar setup warning:", e);
  }

  try {
    await SplashScreen.hide();
  } catch (e) {
    console.warn("SplashScreen hide warning:", e);
  }

  // Register push notifications
  setupPushNotifications().catch(() => {});
}
