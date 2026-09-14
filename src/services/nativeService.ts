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
 * Save device FCM token to user's profile in Supabase
 */
export async function syncDeviceToken(userId: string, tokenVal?: string): Promise<void> {
  if (!userId) return;
  const token = tokenVal || (typeof localStorage !== 'undefined' ? localStorage.getItem('madeater_fcm_token') : null);
  if (!token) return;

  try {
    const { supabase } = await import('./supabaseService');
    await supabase.from('profiles').update({ fcm_token: token }).eq('id', userId);
    console.log('[Push] Synced FCM token to profile for user:', userId);
  } catch (err) {
    console.warn('[Push] Error syncing FCM token to profile:', err);
  }
}

/**
 * Initialize Push Notifications on mobile device
 */
export async function setupPushNotifications(userId?: string): Promise<string | null> {
  if (!isNative) return null;

  try {
    // 1. Create WhatsApp-style High Importance Android Notification Channel (heads-up / lock screen)
    try {
      await PushNotifications.createChannel({
        id: 'madeater_messages',
        name: 'Direct Messages',
        description: 'Instant food critic and direct messages',
        importance: 5, // Heads-up notification on Android
        visibility: 1, // Visible on lock screen
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#F97316'
      });
    } catch (chanErr) {
      console.warn('Could not create notification channel:', chanErr);
    }

    // 2. Check and request push notification permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('User denied push notification permission');
      return null;
    }

    // 3. Register with Apple / Google APNs & FCM
    await PushNotifications.register();

    // 4. Listen for device token registration
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      try {
        localStorage.setItem('madeater_fcm_token', token.value);
        if (userId) {
          await syncDeviceToken(userId, token.value);
        }
      } catch {}
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.warn('Error on push registration:', error);
    });

    // 5. Handle in-app push notification reception
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      window.dispatchEvent(new CustomEvent('madeater_push_received', { detail: notification }));
    });

    // 6. Handle notification click from lock screen / notification drawer
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push action performed:', action.actionId, action.notification.data);
      const data = action.notification.data || {};
      const partnerId = data.senderId || data.partnerId;
      const partnerName = data.senderName || 'Food Critic';
      if (partnerId) {
        window.dispatchEvent(new CustomEvent('madeater_open_chat', {
          detail: { critic: { uid: partnerId, displayName: partnerName } }
        }));
      }
    });
  } catch (err) {
    console.warn('Push notification setup warning:', err);
  }

  return null;
}

/**
 * Configure native Android status bar, splash screen, and push notifications
 */
export async function initializeNativeApp(userId?: string): Promise<void> {
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
  setupPushNotifications(userId).catch(() => {});
}
