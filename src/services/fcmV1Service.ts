/**
 * Google Firebase Cloud Messaging (FCM) v1 Service
 * Authenticates using the Google Cloud Service Account and dispatches
 * WhatsApp-style High Importance push notifications directly to Android devices.
 */

import serviceAccount from '../config/serviceAccount';

interface FcmPushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// In-memory cache for the Google OAuth2 Bearer Access Token
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

function pemToBinary(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^\n]+-----/g, '').replace(/\s+/g, '');
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Generate or return cached Google OAuth2 Access Token for Firebase Cloud Messaging v1
 */
async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && now < tokenExpiresAt - 300) {
    return cachedAccessToken;
  }

  const subtle = (typeof window !== 'undefined' ? window.crypto?.subtle : null)
    || (typeof globalThis !== 'undefined' ? (globalThis as any).crypto?.subtle : null);

  if (!subtle) {
    throw new Error('Web Crypto subtle API not available on this platform.');
  }

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));

  const unsignedToken = `${header}.${payload}`;
  const binaryKey = pemToBinary(serviceAccount.private_key);

  const cryptoKey = await subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const enc = new TextEncoder();
  const signatureBuffer = await subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(unsignedToken));
  const signature = bufferToBase64Url(signatureBuffer);
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to obtain Google OAuth access token: ${errText}`);
  }

  const tokenData = await res.json();
  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = now + (tokenData.expires_in || 3600);
  return cachedAccessToken!;
}

/**
 * Dispatch an official FCM v1 push notification to an Android device token
 */
export async function sendFcmV1Push(payload: FcmPushPayload): Promise<{ success: boolean; result?: any; error?: string }> {
  if (!payload.token) {
    return { success: false, error: 'Recipient device token is missing' };
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const projectId = serviceAccount.project_id;
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const stringData: Record<string, string> = {};
    if (payload.data) {
      for (const [key, value] of Object.entries(payload.data)) {
        stringData[key] = String(value ?? '');
      }
    }

    const body = {
      message: {
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body
        },
        android: {
          priority: 'HIGH',
          notification: {
            channel_id: 'madeater_messages',
            sound: 'default',
            color: '#F97316',
            default_vibrate_timings: true,
            notification_priority: 'PRIORITY_MAX',
            visibility: 'PUBLIC'
          }
        },
        data: stringData
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
      console.warn('[FCM v1] Push delivery error:', result);
      return { success: false, error: result?.error?.message || 'FCM v1 delivery failed', result };
    }

    console.log('[FCM v1] Push delivered successfully:', result);
    return { success: true, result };
  } catch (err: any) {
    console.warn('[FCM v1] Exception sending push:', err);
    return { success: false, error: err?.message || 'Network error sending FCM push' };
  }
}
