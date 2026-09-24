/**
 * Web Push & PWA API Client
 */

import { apiClient } from './apiClient';
import { isMockMode } from '../config/env';
import { mockStorage } from '../mocks/mockStorage';
import type { PushTopic, PushConfig, SubscribePushPayload } from '../types/push';

export type { PushTopic, PushConfig, SubscribePushPayload };

/**
 * Utility function to convert a Base64URL string to a Uint8Array
 * required by navigator.serviceWorker.pushManager.subscribe().
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Fetch public push configuration.
 */
export async function getPushConfig(): Promise<PushConfig> {
  if (isMockMode()) {
    return mockStorage.getPushConfig();
  }
  const res = await apiClient.get<PushConfig>('/public/push/config');
  return res.data;
}

/**
 * Register push subscription in backend.
 */
export async function subscribeToPush(payload: SubscribePushPayload): Promise<unknown> {
  if (isMockMode()) {
    mockStorage.subscribePush(payload);
    return { success: true, message: 'Suscripción Web Push registrada localmente.' };
  }
  const res = await apiClient.post('/public/push/subscribe', payload);
  return res.data;
}

/**
 * Unsubscribe push endpoint in backend.
 */
export async function unsubscribeFromPush(endpoint: string): Promise<unknown> {
  if (isMockMode()) {
    mockStorage.unsubscribePush(endpoint);
    return { success: true, message: 'Suscripción revocada localmente.' };
  }
  const res = await apiClient.post('/public/push/unsubscribe', { endpoint });
  return res.data;
}

/**
 * Update topic preferences for existing push subscription.
 */
export async function updatePushPreferences(endpoint: string, topics: string[]): Promise<unknown> {
  if (isMockMode()) {
    mockStorage.updatePushPreferences(endpoint, topics);
    return { success: true, message: 'Preferencias actualizadas localmente.' };
  }
  const res = await apiClient.put('/public/push/preferences', { endpoint, topics });
  return res.data;
}
