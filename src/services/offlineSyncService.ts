/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OfflineQueuedLog } from '../types';

const OFFLINE_QUEUE_KEY = 'madeater_offline_logs_queue';

class OfflineSyncService {
  private listeners: ((isOnline: boolean) => void)[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    callback(this.isOnline);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private handleOnline() {
    this.isOnline = true;
    this.notifyListeners();
    this.syncPendingLogs();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.isOnline));
  }

  public getQueue(): OfflineQueuedLog[] {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public enqueue(payload: any): OfflineQueuedLog {
    const queue = this.getQueue();
    const item: OfflineQueuedLog = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      payload,
      status: 'pending',
      retryCount: 0,
    };
    queue.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return item;
  }

  public remove(id: string) {
    const queue = this.getQueue().filter((item) => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  public async syncPendingLogs(onProgress?: (synced: number, total: number) => void): Promise<{ success: number; failed: number }> {
    if (!this.isOnline) return { success: 0, failed: 0 };
    const queue = this.getQueue();
    if (queue.length === 0) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      try {
        // Dynamic import to prevent circular dependencies
        const { doc, setDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const reviewRef = doc(collection(db, 'reviews'));
        const cleanRating = Math.min(10, Math.max(1, Number(item.payload.rating) || 5));

        await setDoc(reviewRef, {
          id: reviewRef.id,
          userId: item.payload.userId,
          userName: item.payload.userName || "Critic",
          userPhoto: item.payload.userPhoto || "",
          restaurantId: item.payload.restaurantId || `rest_${Date.now()}`,
          restaurantName: item.payload.restaurantName || "Local Spot",
          restaurantLocation: item.payload.restaurantLocation || "India",
          city: item.payload.city || "Nearby",
          dishes: Array.isArray(item.payload.dishes) && item.payload.dishes.length > 0
            ? item.payload.dishes
            : [{ name: "Culinary Selection", rating: Math.round(cleanRating / 2) }],
          rating: cleanRating,
          content: item.payload.content || "",
          type: item.payload.type || "review",
          createdAt: serverTimestamp(),
          likes: 0,
          isOfflineSynced: true,
          syncedAt: serverTimestamp(),
        });
        this.remove(item.id);
        success++;
      } catch (err) {
        console.error('Failed to sync offline item:', item.id, err);
        failed++;
        item.retryCount = (item.retryCount || 0) + 1;
      }
      if (onProgress) onProgress(i + 1, queue.length);
    }

    return { success, failed };
  }
}

export const offlineSyncService = new OfflineSyncService();
