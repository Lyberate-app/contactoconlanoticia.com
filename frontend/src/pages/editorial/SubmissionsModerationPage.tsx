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
} from 'lucide-react';
import { EditorialLayout } from '../../layouts/EditorialLayout';
import {
  getAdminSubmissions,
  rejectAdminSubmission,
  convertAdminSubmission,
  CitizenSubmission,
  SubmissionStatus,
} from '../../services/submissionApi';

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
      alert('¡Reporte convertido con éxito en borrador de artículo!');
      // Navigate directly to the article editor so the journalist can polish and publish
      if (result.article?.article_uuid) {
        navigate(`/admin/articles/edit/${result.article.article_uuid}`);
      } else {
        loadSubmissions();
      }
    } catch (err: any) {
      alert(err.message || 'Error al convertir reporte.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            Pendiente de Revisión
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
            Aprobado
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300">
            Rechazado
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            Convertido en Noticia
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return new Intl.DateTimeFormat('es-VE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <EditorialLayout activeTab="submissions">
      <div className="space-y-6">
        {/* Intro Banner */}
        <div className="bg-stone-100 border border-stone-300 p-4 rounded text-xs text-stone-700 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif font-bold text-stone-900 text-sm uppercase tracking-wide">
              Mesa de Moderación y Verificación Comunitaria
            </h2>
            <p className="leading-relaxed">
              Reportes enviados por lectores y corresponsales comunitarios. Todo envío entra como <strong>Pendiente de Revisión</strong>. Al presionar <strong>Convertir a Artículo</strong>, se genera un borrador editorial asignado al periodista asignado para su edición final.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-300 font-mono text-[11px] text-stone-600 rounded">
            <Inbox className="w-3.5 h-3.5 text-stone-500" />
            <span>Fase 12 · Buzón</span>
          </span>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border border-stone-200 p-4 rounded flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por título, remitente o sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-stone-50 border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <label className="text-stone-500 font-medium">Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-800"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING_REVIEW">Pendientes de Revisión</option>
              <option value="APPROVED">Aprobados</option>
              <option value="CONVERTED">Convertidos en Artículo</option>
              <option value="REJECTED">Rechazados</option>
            </select>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white border border-stone-200 rounded overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-stone-500 animate-pulse font-mono">
              Cargando reportes ciudadanos...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-red-700 bg-red-50">
              {error}
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center space-y-2 text-stone-500">
              <Inbox className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="font-serif text-sm">No se encontraron reportes ciudadanos.</p>
              <p className="text-xs text-stone-400">Los envíos realizados desde el formulario público aparecerán aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-100 border-b border-stone-200 uppercase font-mono text-[10px] text-stone-600">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Remitente / Ubicación</th>
                    <th className="py-3 px-4">Título del Reporte</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {submissions.map((sub) => (
                    <tr key={sub.submission_uuid} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{sub.submitter_name}</div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-red-700 shrink-0" />
                          <span className="truncate max-w-xs">{sub.location}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-serif font-bold text-stone-950 text-sm line-clamp-1">
                          {sub.title}
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {sub.description}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded text-xs font-semibold inline-flex items-center gap-1"
                          title="Inspeccionar reporte"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>

                        {sub.status === 'CONVERTED' && sub.converted_article_uuid ? (
                          <button
                            onClick={() => navigate(`/admin/articles/edit/${sub.converted_article_uuid}`)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ver Artículo</span>
                          </button>
                        ) : sub.status !== 'REJECTED' ? (
                          <>
                            <button
                              onClick={() => handleConvert(sub)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold inline-flex items-center gap-1"
                              title="Convertir a borrador para el periodista"
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
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-semibold inline-flex items-center gap-1"
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
            <div className="p-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
              <span>Página {page} de {totalPages}</span>
              <div className="space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 border border-stone-300 rounded disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 border border-stone-300 rounded disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-300 max-w-2xl w-full p-6 shadow-2xl relative my-8 rounded">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-xl font-bold"
            >
              &times;
            </button>

            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(selectedSubmission.status)}
              <span className="text-xs text-stone-400 font-mono">
                {formatDate(selectedSubmission.created_at)}
              </span>
            </div>

            <h3 className="font-serif text-xl font-bold text-stone-950 leading-tight mb-2">
              {selectedSubmission.title}
            </h3>

            <div className="bg-stone-50 border border-stone-200 p-3 rounded text-xs space-y-1 mb-4 text-stone-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900">Remitente:</span>
                <span>{selectedSubmission.submitter_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-700" />
                <span>{selectedSubmission.location}</span>
              </div>
              <div className="flex items-center gap-4 pt-1 border-t border-stone-200">
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

            <div className="space-y-3 text-xs text-stone-800">
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 block mb-1 font-mono">
                  Descripción del Hecho:
                </span>
                <p className="whitespace-pre-line bg-stone-50/50 p-3 border border-stone-200 rounded leading-relaxed">
                  {selectedSubmission.description}
                </p>
              </div>

              {selectedSubmission.message && (
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 block mb-1 font-mono">
                    Mensaje Privado para la Redacción:
                  </span>
                  <p className="whitespace-pre-line bg-amber-50/50 p-3 border border-amber-200 text-amber-900 rounded italic">
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
                    className="inline-flex items-center gap-1 text-red-700 hover:underline font-semibold"
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
                        className="block border border-stone-200 rounded overflow-hidden group relative"
                      >
                        <img
                          src={`/uploads/${att.path}`}
                          alt={att.name}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-stone-900/80 text-white text-[9px] truncate px-1 py-0.5">
                          {att.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.status === 'REJECTED' && selectedSubmission.rejection_reason && (
                <div className="bg-red-50 border border-red-200 p-3 rounded text-red-900 text-xs space-y-1">
                  <span className="font-bold block">Motivo de Rechazo:</span>
                  <p>{selectedSubmission.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 border border-stone-300 rounded text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
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
                    className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 transition"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleConvert(selectedSubmission)}
                    className="px-4 py-2 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition inline-flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 max-w-md w-full p-6 shadow-2xl rounded space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Rechazar Reporte Ciudadano</span>
            </h3>
            <p className="text-xs text-stone-600">
              Indique la razón por la cual este reporte no será incorporado a la cobertura periodística (ej. información duplicada, datos no contrastables, publicidad encubierta, etc.).
            </p>

            <textarea
              rows={3}
              placeholder="Indique el motivo del rechazo..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-stone-300 rounded p-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectingUuid(null)}
                className="px-3 py-1.5 border border-stone-300 rounded font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-1.5 bg-red-700 text-white rounded font-semibold hover:bg-red-800 disabled:opacity-50"
              >
                {actionLoading ? 'Guardando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </EditorialLayout>
  );
};
