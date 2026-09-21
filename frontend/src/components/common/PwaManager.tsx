import React, { useEffect, useState } from 'react';
import {
  getPushConfig,
  subscribeToPush,
  unsubscribeFromPush,
  updatePushPreferences,
  urlBase64ToUint8Array,
  type PushConfig,
} from '../../services/pushApi';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaManager: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [pushConfig, setPushConfig] = useState<PushConfig | null>(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['breaking_news']);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Register Service Worker & Handle Network Status
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check existing push subscription
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) {
              setIsSubscribed(true);
            }
          });
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped or failed:', err);
        });
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. PWA Install Prompt Listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 3. Load Push Config
    getPushConfig()
      .then((cfg) => {
        setPushConfig(cfg);
      })
      .catch(() => {
        // Silently catch if push is disabled or backend is unavailable
      });

    // Expose open function to window for header / footer links
    (window as any).openPushPreferences = () => {
      setIsPushModalOpen(true);
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      delete (window as any).openPushPreferences;
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId]
    );
  };

  const handleSubscribe = async () => {
    if (!pushConfig || !pushConfig.public_key) {
      setStatusMessage({ type: 'error', text: 'El servicio de notificaciones no está disponible.' });
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatusMessage({ type: 'error', text: 'Tu navegador no soporta notificaciones Web Push.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatusMessage({ type: 'error', text: 'Permiso de notificaciones denegado en tu navegador.' });
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const appServerKey = urlBase64ToUint8Array(pushConfig.public_key);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey as BufferSource,
        });
      }

      const rawSub = subscription.toJSON();
      if (!rawSub.endpoint || !rawSub.keys?.p256dh || !rawSub.keys?.auth) {
        throw new Error('No se pudieron obtener las claves criptográficas de la suscripción.');
      }

      await subscribeToPush({
        endpoint: rawSub.endpoint,
        keys: {
          p256dh: rawSub.keys.p256dh,
          auth: rawSub.keys.auth,
        },
        topics: selectedTopics,
      });

      setIsSubscribed(true);
      setStatusMessage({ type: 'success', text: '¡Suscripción confirmada! Recibirás alertas periodísticas seleccionadas.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al activar notificaciones.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      setStatusMessage({ type: 'success', text: 'Has cancelado tus notificaciones. No recibirás más avisos.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al cancelar notificaciones.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await updatePushPreferences(subscription.endpoint, selectedTopics);
        setStatusMessage({ type: 'success', text: 'Preferencias actualizadas correctamente.' });
      } else {
        handleSubscribe();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al guardar preferencias.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Offline Floating Banner */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-stone-900 text-stone-100 p-4 border-l-4 border-amber-500 shadow-2xl flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.829-2.829m0 0l-2.829 2.829M3 3l18 18M9.879 9.879a3 3 0 004.242 4.242" />
          </svg>
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm text-stone-100">Modo Fuera de Línea</p>
            <p className="text-stone-300 mt-0.5">Estás navegando sin conexión a Internet. Las noticias leídas recientemente siguen disponibles.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-stone-800 hover:bg-stone-700 text-amber-300 px-2.5 py-1.5 font-mono border border-stone-700 transition"
          >
            Reconectar
          </button>
        </div>
      )}

      {/* 2. PWA Install Prompt Banner */}
      {showInstallBanner && installPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-80 z-40 bg-stone-900 text-stone-100 p-4 border-t-2 border-stone-700 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="Contacto" className="w-8 h-8 rounded border border-stone-700" />
            <div className="text-xs">
              <p className="font-bold">Instalar Aplicación</p>
              <p className="text-stone-400 text-[11px]">Accede a Contacto desde tu pantalla</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleInstallClick}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-2.5 py-1 transition"
            >
              Instalar
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-stone-400 hover:text-stone-200 p-1"
              aria-label="Cerrar"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* 3. Push Preferences Modal */}
      {isPushModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 max-w-md w-full p-6 shadow-2xl relative text-stone-900">
            <button
              onClick={() => {
                setIsPushModalOpen(false);
                setStatusMessage(null);
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-xl font-bold"
              aria-label="Cerrar modal"
            >
              &times;
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">Alertas Periodísticas</h3>
            </div>

            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Recibe notificaciones inmediatas en tu dispositivo sobre noticias relevantes. Solo enviamos información contrastada, sin spam y revocable en cualquier momento.
            </p>

            {statusMessage && (
              <div
                className={`p-3 text-xs mb-4 border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <div className="mb-5">
              <p className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
                Selecciona tus temas de interés:
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(pushConfig?.available_topics || [
                  { id: 'breaking_news', name: 'Última Hora y Alertas Urgentes' },
                  { id: 'regionales', name: 'Regionales (Guárico)' },
                  { id: 'sucesos', name: 'Sucesos' },
                  { id: 'comunidades', name: 'Comunidades' },
                  { id: 'municipales', name: 'Municipales' },
                  { id: 'turismo', name: 'Turismo' },
                  { id: 'internacionales', name: 'Internacionales' }
                ]).map((topic) => (
                  <label
                    key={topic.id}
                    className="flex items-center gap-2.5 p-2 bg-stone-50 hover:bg-stone-100 cursor-pointer border border-stone-200/60 text-xs transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.id)}
                      onChange={() => handleToggleTopic(topic.id)}
                      className="accent-stone-900 rounded"
                    />
                    <span className="text-stone-800 font-medium">{topic.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
              {isSubscribed ? (
                <>
                  <button
                    onClick={handleSavePreferences}
                    disabled={loading}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-2 text-xs transition disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Actualizar Preferencias'}
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    className="w-full bg-transparent hover:bg-red-50 text-red-600 border border-red-200 font-medium py-2 text-xs transition disabled:opacity-50"
                  >
                    {loading ? 'Cancelando...' : 'Cancelar Suscripción'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 text-xs transition shadow disabled:opacity-50"
                >
                  {loading ? 'Activando...' : 'Activar Notificaciones'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
