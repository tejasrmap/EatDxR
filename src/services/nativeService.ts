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
    const { supabase } = await import('../supabase');
    const { data: profile } = await supabase.from('profiles').select('id, stats').eq('id', userId).maybeSingle();
    const stats = profile?.stats || {};
    stats.fcm_token = token;
    await supabase.from('profiles').update({ stats }).eq('id', userId);
    console.log('[FCM Push] Synced device token to profile stats for user:', userId);
  } catch (err) {
    console.warn('[FCM Push] Error syncing device token to profile stats:', err);
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

    // 2. Attach listeners FIRST before calling register (ensures no race conditions)
    await PushNotifications.removeAllListeners();

    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('[FCM] Push registration success, token:', token.value);
      try {
        localStorage.setItem('madeater_fcm_token', token.value);

        // Sync to Supabase profile
        const { supabase } = await import('../supabase');
        const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        const effectiveUid = userId || authData?.user?.id || localStorage.getItem('madeater_user_id');
        if (effectiveUid) {
          await syncDeviceToken(effectiveUid, token.value);
        }

        // Send a welcoming push notification to verify lock-screen reception on first launch
        const welcomeSent = localStorage.getItem('madeater_welcome_push_sent');
        if (!welcomeSent) {
          localStorage.setItem('madeater_welcome_push_sent', 'true');
          const { sendFcmV1Push } = await import('./fcmV1Service');
          await sendFcmV1Push({
            token: token.value,
            title: 'EatDxR Food Critic 🍔',
            body: 'Push notifications are live! Lock your screen to see alerts.',
            data: { type: 'welcome_notification' }
          }).catch(() => {});
        }
      } catch (e) {
        console.warn('[FCM] Registration post-processing error:', e);
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.warn('[FCM] Error on push registration:', error);
    });

    // 3. Handle in-app push notification reception (haptic + event + visible banner)
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('[FCM] Push notification received:', notification);
      triggerHaptic(ImpactStyle.Heavy);
      try {
        const { toast } = await import('sonner');
        toast.info(notification.title || 'New Notification', {
          description: notification.body,
          duration: 5000
        });
      } catch {}
      window.dispatchEvent(new CustomEvent('madeater_push_received', { detail: notification }));
    });

    // 4. Handle notification click from lock screen / notification drawer
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('[FCM] Push action performed:', action.actionId, action.notification.data);
      const data = action.notification.data || {};
      const partnerId = data.senderId || data.partnerId;
      const partnerName = data.senderName || 'Food Critic';
      if (partnerId) {
        window.dispatchEvent(new CustomEvent('madeater_open_chat', {
          detail: { critic: { uid: partnerId, displayName: partnerName } }
        }));
      }
    });

    // 5. Check and request push notification permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive !== 'granted') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      // 6. Register with Google FCM via native Android
      await PushNotifications.register();
    } else {
      console.warn('User denied push notification permission');
      return null;
    }

    // 7. If we already have a saved token, sync it immediately
    const savedToken = localStorage.getItem('madeater_fcm_token');
    if (savedToken && userId) {
      syncDeviceToken(userId, savedToken).catch(() => {});
    }

    return savedToken;
  } catch (err) {
    console.warn('Push notification setup warning:', err);
    return null;
  }
}

/**
 * Read current FCM device token from local storage
 */
export function getSavedFcmToken(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('madeater_fcm_token') || '';
  }
  return '';
}

/**
 * Check if Android push notification permission is granted
 */
export async function hasPushPermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const perm = await PushNotifications.checkPermissions();
    return perm.receive === 'granted';
  } catch {
    return false;
  }
}

/**
 * Prompt user for native push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive === 'granted') {
      await PushNotifications.register();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Send an immediate test notification to this phone using FCM v1
 */
export async function sendSelfTestPush(userName?: string): Promise<{ success: boolean; message: string }> {
  try {
    let token = getSavedFcmToken();
    if (!token) {
      if (isNative) {
        await requestPushPermission();
        await new Promise(r => setTimeout(r, 1000));
        token = getSavedFcmToken();
      }
    }

    if (!token) {
      return { 
        success: false, 
        message: isNative 
          ? 'Device registering with Google FCM... Please tap again in 2 seconds.' 
          : 'Testing on Android mobile: Install APK on your phone to receive native lock-screen push.' 
      };
    }

    const { sendFcmV1Push } = await import('./fcmV1Service');
    const res = await sendFcmV1Push({
      token,
      title: 'EatDxR Food Critic 🍔',
      body: `@${userName || 'critic'}, your WhatsApp-style push notifications are active!`,
      data: { type: 'test_notification', timestamp: String(Date.now()) }
    });

    if (res.success) {
      return { success: true, message: 'Push sent! Lock your phone or check notification shade.' };
    }
    return { success: false, message: res.error || 'Failed to send notification' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error triggering push notification' };
  }
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

  // Register push notifications and sync device token to Supabase
  setupPushNotifications(userId).catch(() => {});
}
