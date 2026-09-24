import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  XCircle,
  FileText,
  Search,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Eye,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getAdminSubmissions,
  rejectAdminSubmission,
  convertAdminSubmission,
  CitizenSubmission,
  SubmissionStatus,
} from '../../services/submissionApi';
import { formatDate } from '../../utils/date';

export const SubmissionsModerationPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected for viewing
  const [selectedSubmission, setSelectedSubmission] = useState<CitizenSubmission | null>(null);

  // Rejection modal
  const [rejectingUuid, setRejectingUuid] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminSubmissions({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      setSubmissions(res.items);
      setTotalPages(res.pagination.total_pages);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los reportes ciudadanos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadSubmissions();
  };

  const handleRejectConfirm = async () => {
    if (!rejectingUuid || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const updated = await rejectAdminSubmission(rejectingUuid, rejectionReason.trim());
      setSubmissions((prev) =>
        prev.map((s) => (s.submission_uuid === updated.submission_uuid ? updated : s))
      );
      if (selectedSubmission?.submission_uuid === updated.submission_uuid) {
        setSelectedSubmission(updated);
      }
      setRejectingUuid(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message || 'Error al rechazar el reporte.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async (submission: CitizenSubmission) => {
    if (!window.confirm(`¿Desea convertir este reporte en un artículo borrador asignado a la redacción?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const result = await convertAdminSubmission(submission.submission_uuid);
      if (result?.article?.article_uuid) {
        navigate(`/admin/articles/edit/${result.article.article_uuid}`);
      } else {
        alert('Reporte ciudadano convertido en borrador con éxito.');
        loadSubmissions();
      }
    } catch (err: any) {
      alert(err.message || 'Error al convertir el reporte.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pendiente
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 backdrop-blur-md">
            Aprobado
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 backdrop-blur-md">
            Convertido en Noticia
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 backdrop-blur-md">
            Rechazado
          </span>
        );
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Banner Card */}
        <div className="glass-card rounded-[28px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/60 dark:border-white/10 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 mb-2">
              <Sparkles className="w-3 h-3 text-rose-600" />
              <span>Buzón Ciudadano &bull; Moderación Comunitaria</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
              Mesa de Verificación Comunitaria
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
              Reportes enviados por lectores y corresponsales comunitarios. Al presionar <strong>Convertir a Artículo</strong>, se genera automáticamente un borrador editorial para el equipo de redacción.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md border border-white/60 dark:border-white/10 font-mono text-xs text-stone-600 dark:text-stone-300 rounded-full shadow-xs">
            <Inbox className="w-4 h-4 text-rose-600" />
            <span>Fase 12 &bull; Buzón</span>
          </span>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Buscar por título, remitente o sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md rounded-full pl-9 pr-4 py-2.5 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </form>

          <div className="flex items-center gap-2 justify-end text-xs">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md px-4 py-2.5 rounded-full text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING_REVIEW">Pendientes de Revisión</option>
              <option value="APPROVED">Aprobados</option>
              <option value="CONVERTED">Convertidos en Noticia</option>
              <option value="REJECTED">Rechazados</option>
            </select>
          </div>
        </div>

        {/* Submissions Grouped Card Container */}
        <div className="glass-card rounded-[28px] overflow-hidden border border-white/60 dark:border-white/10 shadow-sm">
          {loading ? (
            <div className="p-16 text-center text-xs text-stone-500 font-mono animate-pulse">
              Cargando reportes ciudadanos en tiempo real...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-red-700 bg-red-500/10">
              {error}
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-16 text-center space-y-2 text-stone-500">
              <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="font-serif text-base font-bold text-stone-800 dark:text-stone-200">
                No se encontraron reportes ciudadanos
              </p>
              <p className="text-xs text-stone-400">
                Los envíos realizados desde el portal público aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                <thead className="bg-white/40 dark:bg-stone-900/40 border-b border-black/5 dark:border-white/5 uppercase font-bold text-[10px] text-stone-500 dark:text-stone-400">
                  <tr>
                    <th className="py-4 px-5">Fecha</th>
                    <th className="py-4 px-5">Remitente / Ubicación</th>
                    <th className="py-4 px-5">Título del Reporte</th>
                    <th className="py-4 px-5">Estado</th>
                    <th className="py-4 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {submissions.map((sub) => (
                    <tr key={sub.submission_uuid} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-5 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                        {formatDate(sub.created_at, 'withTime')}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-stone-900 dark:text-white">{sub.submitter_name}</div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                          <span className="truncate max-w-xs">{sub.location}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-serif font-black text-stone-950 dark:text-white text-sm line-clamp-1">
                          {sub.title}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                          {sub.description}
                        </p>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="px-3 py-1.5 bg-stone-100/70 dark:bg-stone-800/70 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                          title="Inspeccionar reporte"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>

                        {sub.status === 'CONVERTED' && sub.converted_article_uuid ? (
                          <button
                            onClick={() => navigate(`/admin/articles/edit/${sub.converted_article_uuid}`)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ver Artículo</span>
                          </button>
                        ) : sub.status !== 'REJECTED' ? (
                          <>
                            <button
                              onClick={() => handleConvert(sub)}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                              title="Convertir a borrador editorial"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-400" />
                              <span>Convertir</span>
                            </button>

                            <button
                              onClick={() => {
                                setRejectingUuid(sub.submission_uuid);
                                setRejectionReason('');
                              }}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold inline-flex items-center gap-1 active:scale-95 transition-all"
                              title="Rechazar reporte"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-black/[0.04] dark:divide-white/[0.06] flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 bg-white/30 dark:bg-stone-900/30">
              <span className="font-medium">Página {page} de {totalPages}</span>
              <div className="space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 border border-stone-200/80 bg-white/70 dark:bg-stone-800/70 rounded-full font-semibold disabled:opacity-40 hover:bg-white active:scale-95 transition-all"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 border border-stone-200/80 bg-white/70 dark:bg-stone-800/70 rounded-full font-semibold disabled:opacity-40 hover:bg-white active:scale-95 transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="glass-card rounded-[32px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-white/50 dark:border-white/10">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all absolute top-5 right-5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(selectedSubmission.status)}
              <span className="text-xs text-stone-400 font-mono">
                {formatDate(selectedSubmission.created_at, 'withTime')}
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-black text-stone-950 dark:text-white leading-tight mb-3">
              {selectedSubmission.title}
            </h3>

            <div className="glass-panel rounded-2xl p-4 text-xs space-y-2 mb-4 text-stone-700 dark:text-stone-300 border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 dark:text-white">Remitente:</span>
                <span>{selectedSubmission.submitter_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{selectedSubmission.location}</span>
              </div>
              <div className="flex items-center gap-4 pt-2 border-t border-black/5 dark:border-white/5">
                {selectedSubmission.contact_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{selectedSubmission.contact_phone}</span>
                  </span>
                )}
                {selectedSubmission.contact_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{selectedSubmission.contact_email}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 text-xs text-stone-800 dark:text-stone-200">
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 block mb-1 font-mono">
                  Descripción del Hecho:
                </span>
                <p className="whitespace-pre-line bg-white/50 dark:bg-stone-800/50 p-4 rounded-2xl border border-black/5 dark:border-white/5 leading-relaxed">
                  {selectedSubmission.description}
                </p>
              </div>

              {selectedSubmission.message && (
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 block mb-1 font-mono">
                    Mensaje Privado para la Redacción:
                  </span>
                  <p className="whitespace-pre-line bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20 text-amber-900 dark:text-amber-200 italic">
                    {selectedSubmission.message}
                  </p>
                </div>
              )}

              {selectedSubmission.video_url && (
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 block mb-1 font-mono">
                    Enlace de Video:
                  </span>
                  <a
                    href={selectedSubmission.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-rose-600 hover:underline font-semibold"
                  >
                    <span>{selectedSubmission.video_url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 block mb-1 font-mono">
                    Fotografías Adjuntas ({selectedSubmission.attachments.length}):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedSubmission.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={`/uploads/${att.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl overflow-hidden group relative border border-black/5 dark:border-white/5"
                      >
                        <img
                          src={`/uploads/${att.path}`}
                          alt={att.name}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-stone-900/80 text-white text-[9px] truncate px-2 py-0.5">
                          {att.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.status === 'REJECTED' && selectedSubmission.rejection_reason && (
                <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl text-red-800 dark:text-red-200 text-xs space-y-1">
                  <span className="font-bold block">Motivo de Rechazo:</span>
                  <p>{selectedSubmission.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 border border-stone-200/80 dark:border-stone-700 rounded-full text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 active:scale-95 transition-all"
              >
                Cerrar
              </button>

              {selectedSubmission.status !== 'CONVERTED' && selectedSubmission.status !== 'REJECTED' && (
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setRejectingUuid(selectedSubmission.submission_uuid);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 bg-red-500/10 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold hover:bg-red-500/20 active:scale-95 transition-all"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleConvert(selectedSubmission)}
                    className="px-5 py-2 bg-stone-900 text-white rounded-full text-xs font-bold hover:bg-stone-800 active:scale-95 transition-all inline-flex items-center gap-1.5 shadow-md"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Convertir a Noticia</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingUuid && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card rounded-[28px] max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-white/50 dark:border-white/10">
            <h3 className="font-serif text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Rechazar Reporte Ciudadano</span>
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Indique la razón por la cual este reporte no será incorporado a la cobertura periodística (ej. información duplicada, datos no contrastables, etc.).
            </p>

            <textarea
              rows={3}
              placeholder="Indique el motivo del rechazo..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-black/10 dark:border-white/10 rounded-2xl p-3 text-xs text-stone-900 dark:text-white bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectingUuid(null)}
                className="px-4 py-2 rounded-full border border-stone-300 dark:border-stone-700 font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-5 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 disabled:opacity-50 active:scale-95 transition-all shadow-md"
              >
                {actionLoading ? 'Guardando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
