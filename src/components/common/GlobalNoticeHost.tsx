import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { AppConfirmDetail, AppToastDetail, NoticeTone } from '../../utils/notice';

const toneStyles: Record<NoticeTone, { container: string; icon: string; title: string }> = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: 'bg-emerald-100 text-emerald-700',
    title: 'text-emerald-900',
  },
  error: {
    container: 'border-rose-200 bg-rose-50 text-rose-950',
    icon: 'bg-rose-100 text-rose-700',
    title: 'text-rose-900',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: 'bg-amber-100 text-amber-700',
    title: 'text-amber-900',
  },
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-950',
    icon: 'bg-sky-100 text-sky-700',
    title: 'text-sky-900',
  },
};

const getToneIcon = (tone: NoticeTone) => {
  switch (tone) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'error':
      return <AlertTriangle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

export const GlobalNoticeHost: React.FC = () => {
  const [toasts, setToasts] = useState<AppToastDetail[]>([]);
  const [confirmState, setConfirmState] = useState<AppConfirmDetail | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<AppToastDetail>).detail;
      if (!detail) return;

      setToasts((current) => [...current, detail]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== detail.id));
      }, detail.duration ?? 3200);
    };

    const handleConfirm = (event: Event) => {
      const detail = (event as CustomEvent<AppConfirmDetail>).detail;
      if (!detail) return;
      setConfirmState(detail);
    };

    window.addEventListener('app-toast', handleToast);
    window.addEventListener('app-confirm', handleConfirm);

    return () => {
      window.removeEventListener('app-toast', handleToast);
      window.removeEventListener('app-confirm', handleConfirm);
    };
  }, []);

  return (
    <>
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed right-4 top-4 z-[70] flex max-w-sm flex-col gap-2">
          {toasts.map((toast) => {
            const toneStyle = toneStyles[toast.tone];

            return (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-3.5 py-3 shadow-lg ${toneStyle.container}`}
                role="status"
                aria-live="polite"
              >
                <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${toneStyle.icon}`}>
                  {getToneIcon(toast.tone)}
                </div>
                <div className="min-w-0 flex-1">
                  {toast.title && <div className={`text-xs font-bold uppercase tracking-[0.12em] ${toneStyle.title}`}>{toast.title}</div>}
                  <div className="text-sm leading-5">{toast.message}</div>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-current/70 transition hover:text-current"
                  aria-label="Cerrar notificación"
                  onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {confirmState && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/55 p-4">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Confirmación</p>
                <h3 className="mt-1 text-lg font-bold text-stone-950">{confirmState.title}</h3>
              </div>
              <button
                type="button"
                className="rounded-full bg-stone-100 p-2 text-stone-500 transition hover:bg-stone-200"
                aria-label="Cerrar confirmación"
                onClick={() => {
                  confirmState.resolve(false);
                  setConfirmState(null);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-6 text-stone-600">{confirmState.message}</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                onClick={() => {
                  confirmState.resolve(false);
                  setConfirmState(null);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
                onClick={() => {
                  confirmState.resolve(true);
                  setConfirmState(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
