import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  FileText,
  Megaphone,
  AlertCircle,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  CalendarCheck2,
} from 'lucide-react';
import { editorialService } from '../../services/editorial';
import type { CalendarItem, CalendarItemType, CalendarViewMode } from '../../types/calendar';

export const EditorialCalendarPage: React.FC = () => {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDayItems, setSelectedDayItems] = useState<{ dayStr: string; items: CalendarItem[] } | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await editorialService.getCalendarItems();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter items by type
  const filteredItems = items.filter((item) => {
    if (selectedType === 'ALL') return true;
    if (selectedType === 'ARTICLES') {
      return (
        item.type === 'SCHEDULED_ARTICLE' ||
        item.type === 'PENDING_REVIEW' ||
        item.type === 'PUBLISHED_ARTICLE'
      );
    }
    if (selectedType === 'ADS') {
      return item.type === 'AD_CAMPAIGN_START' || item.type === 'AD_CAMPAIGN_END';
    }
    return item.type === selectedType;
  });

  // Calendar calculations for monthly grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

  // Month label in Spanish
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Group items by date string (YYYY-MM-DD)
  const itemsByDate: Record<string, CalendarItem[]> = {};
  filteredItems.forEach((item) => {
    const dStr = item.date.slice(0, 10);
    if (!itemsByDate[dStr]) itemsByDate[dStr] = [];
    itemsByDate[dStr].push(item);
  });

  const getItemBadge = (type: CalendarItemType) => {
    switch (type) {
      case 'SCHEDULED_ARTICLE':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Clock,
          label: 'Programado',
        };
      case 'PENDING_REVIEW':
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: AlertCircle,
          label: 'En Revisión',
        };
      case 'PUBLISHED_ARTICLE':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: CheckCircle2,
          label: 'Publicado',
        };
      case 'AD_CAMPAIGN_START':
        return {
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: Megaphone,
          label: 'Inicio Pauta',
        };
      case 'AD_CAMPAIGN_END':
        return {
          bg: 'bg-stone-100 text-stone-800 border-stone-300',
          icon: Megaphone,
          label: 'Fin Pauta',
        };
      default:
        return {
          bg: 'bg-stone-100 text-stone-800 border-stone-300',
          icon: FileText,
          label: 'Evento',
        };
    }
  };

  const weekDayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
              Calendario Editorial & Pautas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">
              Lyberate Planificación
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Gestione la parrilla de publicaciones, coberturas programadas y campañas publicitarias activas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchItems}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition cursor-pointer"
            title="Actualizar calendario"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/admin/articles/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Noticia</span>
          </Link>
        </div>
      </div>

      {/* Control Bar: Month Navigator, Views, and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200 border-x border-stone-200 transition cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-serif font-black text-stone-900">
            {capitalizedMonth}
          </h2>
        </div>

        {/* View Mode & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs border border-stone-200 rounded-xl px-2.5 py-1.5 bg-stone-50">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los eventos</option>
              <option value="ARTICLES">Solo Artículos</option>
              <option value="SCHEDULED_ARTICLE">Programados</option>
              <option value="PENDING_REVIEW">En Revisión</option>
              <option value="ADS">Pautas Publicitarias</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden p-0.5 bg-stone-100 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Mes
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar View */}
      {viewMode === 'month' ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50/70 text-center text-xs font-bold text-stone-600 py-2.5">
            {weekDayHeaders.map((dayName) => (
              <div key={dayName}>{dayName}</div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stone-100">
            {/* Empty cells before month start */}
            {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[110px] bg-stone-50/40 p-2" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const dayEvents = itemsByDate[dateString] || [];
              const isToday =
                new Date().toDateString() === new Date(year, month, dayNum).toDateString();

              return (
                <div
                  key={dateString}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setSelectedDayItems({ dayStr: dateString, items: dayEvents });
                    }
                  }}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition ${
                    isToday ? 'bg-rose-50/30 ring-1 ring-rose-200' : 'bg-white hover:bg-stone-50/60'
                  } ${dayEvents.length > 0 ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-rose-900 text-white'
                          : 'text-stone-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-stone-400">
                        {dayEvents.length} {dayEvents.length === 1 ? 'ítem' : 'ítems'}
                      </span>
                    )}
                  </div>

                  {/* Event pills inside the day */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const badge = getItemBadge(ev.type);
                      return (
                        <div
                          key={ev.id}
                          className={`text-[10px] truncate rounded-md px-1.5 py-0.5 border font-medium ${badge.bg}`}
                          title={`${ev.title} (${badge.label})`}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-stone-500 font-bold px-1">
                        +{dayEvents.length - 3} más...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda / List View */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs divide-y divide-stone-100">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4 text-stone-400">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="text-sm font-semibold">No hay publicaciones ni pautas registradas.</p>
              <p className="text-xs text-stone-500 mt-1">
                Utilice el botón "Programar Noticia" para planificar coberturas.
              </p>
            </div>
          ) : (
            filteredItems
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((ev) => {
                const badge = getItemBadge(ev.type);
                const BadgeIcon = badge.icon;
                const d = new Date(ev.date);
                const formattedDate = d.toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={ev.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          {ev.category_name && (
                            <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                              {ev.category_name}
                            </span>
                          )}
                          <span className="text-xs text-stone-500 font-mono">
                            {formattedDate}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-stone-900 mt-1">
                          {ev.title}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {ev.author_name ? `Redactor: ${ev.author_name}` : ''}
                          {ev.advertiser_name ? `Anunciante: ${ev.advertiser_name}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {ev.article_uuid && (
                        <Link
                          to={`/admin/articles/edit/${ev.article_uuid}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver en Editor</span>
                        </Link>
                      )}
                      {ev.campaign_uuid && (
                        <Link
                          to="/admin/ads"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>Ver Campaña</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Day Events Detail Modal */}
      {selectedDayItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl p-6 overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <CalendarCheck2 className="w-5 h-5 text-rose-900" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Eventos del {selectedDayItems.dayStr}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayItems(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
              {selectedDayItems.items.map((ev) => {
                const badge = getItemBadge(ev.type);
                return (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs font-mono text-stone-500">
                        {new Date(ev.date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-stone-900">{ev.title}</h4>
                    <p className="text-xs text-stone-500">
                      {ev.author_name || ev.advertiser_name || ''}
                    </p>
                    {ev.article_uuid && (
                      <div className="pt-1">
                        <Link
                          to={`/admin/articles/edit/${ev.article_uuid}`}
                          className="text-xs font-bold text-rose-900 hover:underline"
                        >
                          Abrir en editor editorial &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorialCalendarPage;
