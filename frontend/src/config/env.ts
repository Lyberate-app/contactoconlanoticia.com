/**
 * Application environment configuration
 */

export const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'mock';

export const isMockMode = (): boolean => DATA_MODE === 'mock';

