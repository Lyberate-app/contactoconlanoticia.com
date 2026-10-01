import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { editorialService } from '../../services/editorial';
import type { EditorialNotification } from '../../types/notification';

export const NotificationCenterDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<EditorialNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const loadNotifications = async () => {
    try {
      const list = await editorialService.getNotifications();
      setNotifications(list);
    } catch {
      // Ignore background fetch error
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await editorialService.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'warning':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center text-stone-600 focus:outline-none transition-colors cursor-pointer"
        aria-label="Notificaciones editoriales"
        title="Centro de Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-stone-900 uppercase tracking-wider font-mono">
                Notificaciones Editoriales
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                  filter === 'unread'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                {filter === 'unread' ? 'Ver todas' : 'Solo no leídas'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No hay notificaciones {filter === 'unread' ? 'pendientes' : 'recientes'}.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 text-xs transition-colors hover:bg-stone-50 flex items-start gap-2.5 ${
                    !item.read ? 'bg-rose-50/20' : ''
                  }`}
                >
                  {getSeverityIcon(item.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-stone-900 truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono shrink-0">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-stone-600 text-[11px] mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      {item.link_url || item.link ? (
                        <a
                          href={item.link_url || item.link}
                          className="inline-flex items-center gap-1 text-[10px] text-rose-700 hover:text-rose-900 font-semibold"
                        >
                          <span>Ver detalle</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span />
                      )}
                      {!item.read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          className="inline-flex items-center gap-1 text-[10px] text-stone-500 hover:text-stone-800"
                          title="Marcar como leída"
                        >
                          <Check className="w-3 h-3" />
                          <span>Marcar leída</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
