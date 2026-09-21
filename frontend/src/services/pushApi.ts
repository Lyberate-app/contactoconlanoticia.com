/**
 * Web Push & PWA API Client
 */

export interface PushTopic {
  id: string;
  name: string;
}

export interface PushConfig {
  enabled: boolean;
  public_key: string | null;
  available_topics: PushTopic[];
}

export interface SubscribePushPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  topics?: string[];
}

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
  const res = await fetch('/api/v1/public/push/config', {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error('Error al consultar configuración de notificaciones.');
  }

  const json = await res.json();
  return json.data;
}

/**
 * Register push subscription in backend.
 */
export async function subscribeToPush(payload: SubscribePushPayload): Promise<any> {
  const res = await fetch('/api/v1/public/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al registrar suscripción push.');
  }

  return json.data;
}

/**
 * Unsubscribe push endpoint in backend.
 */
export async function unsubscribeFromPush(endpoint: string): Promise<any> {
  const res = await fetch('/api/v1/public/push/unsubscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ endpoint })
  });

  const json = await res.json();
  return json.data;
}

/**
 * Update topic preferences for existing push subscription.
 */
export async function updatePushPreferences(endpoint: string, topics: string[]): Promise<any> {
  const res = await fetch('/api/v1/public/push/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ endpoint, topics })
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al actualizar preferencias de notificación.');
  }

  return json.data;
}
