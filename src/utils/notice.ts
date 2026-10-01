export type NoticeTone = 'success' | 'error' | 'info' | 'warning';

export interface AppToastDetail {
  id: number;
  title?: string;
  message: string;
  tone: NoticeTone;
  duration?: number;
}

export interface AppConfirmDetail {
  id: number;
  title: string;
  message: string;
  resolve: (accepted: boolean) => void;
}

export const notify = (message: string, tone: NoticeTone = 'info', title?: string, duration = 3200) => {
  window.dispatchEvent(new CustomEvent('app-toast', {
    detail: {
      id: Date.now() + Math.random(),
      title,
      message,
      tone,
      duration,
    } satisfies AppToastDetail,
  }));
};

export const confirmAction = async (message: string, title = 'Confirmar acción'): Promise<boolean> => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('app-confirm', {
      detail: {
        id: Date.now() + Math.random(),
        title,
        message,
        resolve,
      } satisfies AppConfirmDetail,
    }));
  });
};
