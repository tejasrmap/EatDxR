/**
 * Safe Firebase Service Account Configuration Provider
 * Dynamically checks for local service account JSON via optional glob
 * or falls back to VITE_FIREBASE environment variables on CI build servers (Vercel/GitHub Actions).
 */

interface ServiceAccountConfig {
  project_id: string;
  client_email: string;
  private_key: string;
}

function loadServiceAccount(): ServiceAccountConfig {
  let jsonAccount: any = {};
  try {
    const globResults: Record<string, any> = import.meta.glob('./firebaseServiceAccount.json', { eager: true, import: 'default' });
    jsonAccount = globResults['./firebaseServiceAccount.json'] || {};
  } catch {
    jsonAccount = {};
  }

  const env: Record<string, any> = typeof import.meta !== 'undefined' ? ((import.meta as any).env || {}) : {};

  return {
    project_id: jsonAccount.project_id || env.VITE_FIREBASE_PROJECT_ID || 'madeater-app',
    client_email: jsonAccount.client_email || env.VITE_FIREBASE_CLIENT_EMAIL || '',
    private_key: jsonAccount.private_key || env.VITE_FIREBASE_PRIVATE_KEY || ''
  };
}

export const serviceAccount = loadServiceAccount();
export default serviceAccount;
