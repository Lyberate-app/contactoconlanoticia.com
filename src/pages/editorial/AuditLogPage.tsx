import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { editorialService } from '../../services/editorial';
import type { AuditEntry, AuditFilterParams, AuditModule } from '../../types/audit';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, selectedModule]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: AuditFilterParams = {
        page,
        limit: 15,
        module: selectedModule !== 'all' ? (selectedModule as AuditModule) : undefined,
        search: searchQuery.trim() || undefined,
      };
      const res = await editorialService.getAuditLogs(params);
      setLogs(res.entries);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Fecha', 'Usuario', 'Email', 'Modulo', 'Accion', 'Descripcion', 'IP'];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.timestamp).toISOString(),
      `"${l.user_name}"`,
      l.user_email,
      l.module,
      l.action,
      `"${l.description.replace(/"/g, '""')}"`,
      l.ip_address || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `audit_log_contacto_con_la_noticia_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getModuleBadge = (mod: AuditModule) => {
    switch (mod) {
      case 'ARTICLES':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Artículos
          </span>
        );
      case 'MEDIA':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            Media
          </span>
        );
      case 'ADS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Publicidad
          </span>
        );
      case 'USERS':
      case 'SECURITY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Seguridad
          </span>
        );
      case 'INTEGRATIONS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Conectores
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            {mod}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-serif text-stone-900">
              Registro de Auditoría y Trazabilidad (Audit Log)
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Historial inmutable de acciones editoriales, cambios de estado, publicaciones, accesos y permisos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            className="p-2 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl transition-colors cursor-pointer"
            title="Recargar registros"
            aria-label="Recargar registros"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción, nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {[
            { id: 'all', label: 'Todos los Módulos' },
            { id: 'ARTICLES', label: 'Artículos' },
            { id: 'MEDIA', label: 'Media' },
            { id: 'ADS', label: 'Publicidad' },
            { id: 'USERS', label: 'Usuarios' },
            { id: 'SECURITY', label: 'Seguridad' },
            { id: 'INTEGRATIONS', label: 'Conectores' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSelectedModule(m.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedModule === m.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Descripción de la Actividad</th>
                <th className="py-3 px-4">Origen IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    Consultando pistas de auditoría...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No se encontraron registros de auditoría con los criterios especificados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-ES', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-stone-900">{log.user_name}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{log.user_email}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getModuleBadge(log.module)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] font-bold text-stone-700">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      <div className="line-clamp-2 max-w-md">{log.description}</div>
                      {log.entity_name && (
                        <div className="text-[10px] text-stone-400 truncate mt-0.5 font-mono">
                          Entidad: {log.entity_name}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-400 whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 bg-stone-50/50">
          <div>
            Mostrando {logs.length} de {total} registros totales
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-semibold px-2">
              Página {page} de {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
