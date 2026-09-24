import React, { useEffect, useState } from 'react';
import {
  getPushConfig,
  subscribeToPush,
  unsubscribeFromPush,
  updatePushPreferences,
  urlBase64ToUint8Array,
  type PushConfig,
} from '../../services/pushApi';
import { Bell, WifiOff, X, Check, AlertCircle } from 'lucide-react';

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
      .catch(() => {});

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
      setStatusMessage({ type: 'error', text: 'Tu dispositivo no soporta notificaciones Web Push.' });
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
        throw new Error('No se pudieron obtener las claves de la suscripción.');
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
      setStatusMessage({ type: 'success', text: '¡Suscripción confirmada! Recibirás alertas periodísticas.' });
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
      setStatusMessage({ type: 'success', text: 'Notificaciones canceladas correctamente.' });
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
        setStatusMessage({ type: 'success', text: 'Preferencias guardadas exitosamente.' });
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
      {/* 1. iOS Offline Floating Capsule */}
      {isOffline && (
        <div className="fixed top-16 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 glass-pill-dark text-stone-100 p-3.5 rounded-[24px] shadow-2xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </span>
            <div className="min-w-0 text-xs">
              <p className="font-bold text-white leading-tight">Modo Sin Conexión</p>
              <p className="text-stone-300 text-[11px] truncate">Noticias en caché disponibles</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-[11px] bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full font-medium transition active:scale-95 shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 2. iOS PWA Install Prompt Banner */}
      {showInstallBanner && installPrompt && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-88 z-40 glass-dock p-3.5 rounded-[24px] shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="Contacto" className="w-10 h-10 rounded-xl shadow-md" />
            <div className="text-xs">
              <p className="font-bold text-stone-900">Instalar Aplicación</p>
              <p className="text-stone-500 text-[11px]">Accede desde tu pantalla de inicio</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleInstallClick}
              className="text-xs bg-rose-900 hover:bg-rose-950 text-white font-semibold px-3 py-1.5 rounded-full transition shadow-sm active:scale-95"
            >
              Instalar
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-stone-400 hover:text-stone-600 p-1"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. iOS Push Preferences Modal (Glass Action Sheet) */}
      {isPushModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-md transition-opacity"
            onClick={() => {
              setIsPushModalOpen(false);
              setStatusMessage(null);
            }}
          ></div>

          <div className="relative glass-panel rounded-[32px] max-w-md w-full p-6 shadow-2xl text-stone-900 z-10 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsPushModalOpen(false);
                setStatusMessage(null);
              }}
              className="w-8 h-8 rounded-full glass-pill absolute top-4 right-4 flex items-center justify-center text-stone-400 hover:text-stone-700"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center shadow-inner">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Alertas Periodísticas</h3>
                <span className="text-[11px] text-stone-500">Notificaciones instantáneas verificadas</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Recibe avisos inmediatos en tu dispositivo móvil o navegador. Solo enviamos alertas de alto interés público, sin publicidad invasiva.
            </p>

            {statusMessage && (
              <div
                className={`p-3 rounded-2xl text-xs mb-4 flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50/90 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="mb-5">
              <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                Selecciona tus temas:
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
                    className="flex items-center gap-2.5 p-2.5 glass-card rounded-xl cursor-pointer text-xs transition hover:border-white/90"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.id)}
                      onChange={() => handleToggleTopic(topic.id)}
                      className="accent-rose-700 rounded w-4 h-4"
                    />
                    <span className="text-stone-800 font-medium">{topic.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-stone-200/60">
              {isSubscribed ? (
                <>
                  <button
                    onClick={handleSavePreferences}
                    disabled={loading}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2.5 rounded-full text-xs transition disabled:opacity-50 shadow-md active:scale-95"
                  >
                    {loading ? 'Guardando...' : 'Actualizar Preferencias'}
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    className="w-full glass-pill text-rose-700 font-semibold py-2 rounded-full text-xs transition disabled:opacity-50"
                  >
                    {loading ? 'Cancelando...' : 'Cancelar Suscripción'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-900 to-rose-700 text-white font-bold py-3 rounded-full text-xs transition shadow-lg shadow-rose-950/20 active:scale-95 disabled:opacity-50"
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
