import React, { useEffect, useState } from 'react';
import { Clock3, FileText, RotateCcw, UserRound, X } from 'lucide-react';
import type { ArticleVersionSnapshot } from '../../types/version';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ArticleVersionSnapshot[];
  currentContent: string;
  currentTitle: string;
  onRestoreVersion: (version: ArticleVersionSnapshot) => void;
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentContent,
  currentTitle,
  onRestoreVersion,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedVersionId((current) =>
        versions.some((version) => version.version_id === current)
          ? current
          : versions[0]?.version_id ?? null,
      );
    }
  }, [isOpen, versions]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedVersion = versions.find(
    (version) => version.version_id === selectedVersionId,
  );
  const currentWordCount = currentContent.trim()
    ? currentContent.trim().split(/\s+/).length
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-history-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-800">
              Control editorial
            </p>
            <h2 id="version-history-title" className="mt-1 font-serif text-xl font-black text-stone-950 sm:text-2xl">
              Historial de versiones
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Revisa una copia anterior antes de restaurarla en el editor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            aria-label="Cerrar historial de versiones"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {versions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
              <Clock3 className="h-7 w-7" />
            </span>
            <h3 className="font-serif text-lg font-bold text-stone-900">Aún no hay versiones guardadas</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500">
              Las revisiones disponibles aparecerán aquí para que puedas comparar y recuperar el trabajo editorial.
            </p>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 md:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="max-h-52 overflow-y-auto border-b border-stone-200 bg-stone-50 p-3 md:max-h-none md:border-b-0 md:border-r md:p-4">
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {versions.length} {versions.length === 1 ? 'versión' : 'versiones'}
              </p>
              <div className="space-y-1">
                {versions.map((version) => {
                  const isSelected = version.version_id === selectedVersionId;
                  return (
                    <button
                      key={version.version_id}
                      type="button"
                      onClick={() => setSelectedVersionId(version.version_id)}
                      aria-pressed={isSelected}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-rose-200 bg-white shadow-sm ring-1 ring-rose-100'
                          : 'border-transparent hover:border-stone-200 hover:bg-white'
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                          {version.title || 'Sin titular'}
                        </span>
                        {version.is_autosave && (
                          <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold uppercase text-sky-700">
                            Auto
                          </span>
                        )}
                      </span>
                      <span className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                        <Clock3 className="h-3 w-3" />
                        {formatTimestamp(version.timestamp)}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-500">
                        <UserRound className="h-3 w-3" />
                        {version.author_name || 'Redacción'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="flex min-h-0 flex-col">
              {selectedVersion ? (
                <>
                  <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-600">
                        {formatTimestamp(selectedVersion.timestamp)}
                      </span>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-600">
                        {selectedVersion.word_count} palabras
                      </span>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-600">
                        {selectedVersion.status.replaceAll('_', ' ')}
                      </span>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <article className="min-w-0">
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800">
                          <FileText className="h-4 w-4" />
                          Versión seleccionada
                        </h3>
                        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                          <h4 className="font-serif text-lg font-bold leading-snug text-stone-950">
                            {selectedVersion.title || 'Sin titular'}
                          </h4>
                          {selectedVersion.subtitle && (
                            <p className="mt-2 text-sm font-medium text-stone-600">{selectedVersion.subtitle}</p>
                          )}
                          <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-stone-700">
                            {selectedVersion.content || 'Esta versión no contiene texto.'}
                          </div>
                        </div>
                      </article>

                      <article className="min-w-0">
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                          <FileText className="h-4 w-4" />
                          Contenido actual del editor
                        </h3>
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
                          <h4 className="font-serif text-lg font-bold leading-snug text-stone-950">
                            {currentTitle || 'Sin titular'}
                          </h4>
                          <p className="mt-2 text-xs text-stone-500">
                            {currentWordCount} {currentWordCount === 1 ? 'palabra' : 'palabras'}
                          </p>
                          <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-stone-700">
                            {currentContent || 'El editor aún no tiene contenido.'}
                          </div>
                        </div>
                      </article>
                    </div>
                    {selectedVersion.summary_note && (
                      <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        <strong>Nota editorial:</strong> {selectedVersion.summary_note}
                      </p>
                    )}
                  </div>
                  <footer className="flex flex-col-reverse gap-2 border-t border-stone-200 bg-stone-50 px-5 py-4 sm:flex-row sm:justify-between sm:px-7">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRestoreVersion(selectedVersion);
                        onClose();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restaurar en el editor
                    </button>
                  </footer>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-sm text-stone-500">
                  Selecciona una versión para revisar su contenido.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};