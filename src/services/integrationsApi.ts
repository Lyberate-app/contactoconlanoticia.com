import { isMockMode } from '../config/env';
import { apiClient } from './apiClient';

export type PublicationProvider = 'facebook' | 'instagram' | 'telegram' | 'x';

export interface PublicationIntegration {
  provider: PublicationProvider;
  connected: boolean;
  account_name: string | null;
  auto_publish: boolean;
  last_published_at: string | null;
}

const PROVIDERS: PublicationProvider[] = ['facebook', 'instagram', 'telegram', 'x'];
const STORAGE_KEY = 'lyberate_publication_integrations';

function mockIntegrations(): PublicationIntegration[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as PublicationIntegration[];
  } catch {
    // Return disconnected accounts when local storage is unavailable.
  }
  return PROVIDERS.map((provider) => ({
    provider,
    connected: false,
    account_name: null,
    auto_publish: false,
    last_published_at: null,
  }));
}

export const integrationsApi = {
  async listPublicationIntegrations(): Promise<PublicationIntegration[]> {
    if (isMockMode()) return mockIntegrations();
    const response = await apiClient.get<{ items: PublicationIntegration[] }>('/admin/integrations/publications');
    return response.data?.items || [];
  },

  async setAutoPublish(provider: PublicationProvider, enabled: boolean): Promise<void> {
    if (isMockMode()) {
      const integrations = mockIntegrations().map((item) => item.provider === provider ? { ...item, auto_publish: enabled } : item);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
      return;
    }
    await apiClient.put(`/admin/integrations/publications/${provider}/settings`, { auto_publish: enabled });
  },

  async connect(provider: PublicationProvider): Promise<string> {
    if (isMockMode()) throw new Error('La conexión OAuth requiere el servicio backend y credenciales de la plataforma.');
    const response = await apiClient.post<{ authorization_url: string }>(`/admin/integrations/publications/${provider}/connect`);
    return response.data.authorization_url;
  },

  async disconnect(provider: PublicationProvider): Promise<void> {
    if (isMockMode()) {
      const integrations = mockIntegrations().map((item) => item.provider === provider
        ? { ...item, connected: false, account_name: null, auto_publish: false }
        : item);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
      return;
    }
    await apiClient.delete(`/admin/integrations/publications/${provider}`);
  },
};