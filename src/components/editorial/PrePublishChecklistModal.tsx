import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Send,
  Calendar,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { ArticleStatus } from '../../types/article';

export interface PrePublishChecklistData {
  title: string;
  content: string;
  excerpt?: string;
  categoryUuid?: string;
  authorUuid?: string;
  slug: string;
  hasFeaturedMedia: boolean;
  featuredMediaAlt?: string;
  featuredMediaCredit?: string;
  metaDescription?: string;
}

export interface PrePublishChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrePublishChecklistData;
  currentStatus: ArticleStatus;
  userRole?: string;
  onConfirmPublish: () => void;
  onConfirmSubmitReview: () => void;
  onConfirmSchedule: () => void;
  onReturnForCorrection?: (note: string) => void;
}

interface CheckItem {
  id: string;
  label: string;
  type: 'error' | 'warning' | 'recommended';
  passed: boolean;
  message: string;
}

export const PrePublishChecklistModal: React.FC<PrePublishChecklistModalProps> = ({
  isOpen,
  onClose,
  data,
  currentStatus,
  userRole = 'EDITOR',
  onConfirmPublish,
  onConfirmSubmitReview,
  onConfirmSchedule,
  onReturnForCorrection,
}) => {
  const [returnNote, setReturnNote] = useState('');
  const [showReturnForm, setShowReturnForm] = useState(false);

  if (!isOpen) return null;

  // Run audit checks
  const wordCount = data.content.trim() ? data.content.trim().split(/\s+/).length : 0;
  const isTitleValid = data.title.trim().length >= 10;
  const isContentValid = wordCount >= 50;
  const isCategoryValid = Boolean(data.categoryUuid);
  const isAuthorValid = Boolean(data.authorUuid);
  const isSlugValid = Boolean(data.slug.trim()) && /^[a-z0-9-]+$/.test(data.slug);
  const hasFeaturedMedia = data.hasFeaturedMedia;
  const hasAlt = Boolean(data.featuredMediaAlt?.trim());
  const hasCredit = Boolean(data.featuredMediaCredit?.trim());
  const hasMetaDesc = Boolean(data.metaDescription?.trim() || data.excerpt?.trim());

  const checks: CheckItem[] = [
    {
      id: 'title',
      label: 'Titular informativo adecuado',
      type: 'error',
      passed: isTitleValid,
      message: isTitleValid
        ? 'Titular con longitud periodística adecuada'
        : 'El titular debe tener al menos 10 caracteres',
    },
    {
      id: 'content',
      label: 'Cuerpo de la noticia suficiente',
      type: 'error',
      passed: isContentValid,
      message: isContentValid
        ? `Contenido suficiente (${wordCount} palabras)`
        : `Se requieren al menos 50 palabras (actual: ${wordCount})`,
    },
    {
      id: 'category',
      label: 'Sección asignada',
      type: 'error',
      passed: isCategoryValid,
      message: isCategoryValid
        ? 'Categoría editorial asignada'
        : 'Debe seleccionar una sección para la noticia',
    },
    {
      id: 'author',
      label: 'Firma / Autor periodístico',
      type: 'error',
      passed: isAuthorValid,
      message: isAuthorValid ? 'Autor asignado' : 'Debe asignar un redactor responsable',
    },
    {
      id: 'slug',
      label: 'Enlace permanente (URL slug)',
      type: 'error',
      passed: isSlugValid,
      message: isSlugValid
        ? 'Slug estructurado correctamente'
        : 'El slug debe contener caracteres alfanuméricos válidos',
    },
    {
      id: 'media',
      label: 'Fotografía principal de portada',
      type: 'warning',
      passed: hasFeaturedMedia,
      message: hasFeaturedMedia
        ? 'Imagen de portada adjunta'
        : 'Se recomienda incluir imagen destacada para el portal',
    },
    {
      id: 'alt',
      label: 'Texto alternativo accesible (ALT)',
      type: 'warning',
      passed: hasAlt,
      message: hasAlt
        ? 'Texto ALT presente para accesibilidad y SEO'
        : 'Falta texto alternativo para lectores de pantalla',
    },
    {
      id: 'credit',
      label: 'Crédito fotográfico / Autoría visual',
      type: 'recommended',
      passed: hasCredit,
      message: hasCredit
        ? 'Créditos de imagen registrados'
        : 'Recomendado atribuir crédito al fotógrafo o agencia',
    },
    {
      id: 'meta_desc',
      label: 'Metadescripción / Bajada SEO',
      type: 'recommended',
      passed: hasMetaDesc,
      message: hasMetaDesc
        ? 'Bajada/Metadescripción configurada'
        : 'Recomendado para snippets en Google y redes sociales',
    },
  ];

  const criticalErrors = checks.filter((c) => c.type === 'error' && !c.passed);
  const warnings = checks.filter((c) => c.type === 'warning' && !c.passed);
  const isReady = criticalErrors.length === 0;

  const canPublishDirectly =
    userRole === 'SUPER_ADMIN' || userRole === 'SITE_ADMIN' || userRole === 'EDITOR';

  const handleReturn = () => {
    if (onReturnForCorrection && returnNote.trim()) {
      onReturnForCorrection(returnNote.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-serif">
                Checklist Pre-Publicación Editorial
              </h2>
              <p className="text-xs text-stone-500">
                Verificación de estándares informativos &bull; Estado actual:{' '}
                <span className="font-mono font-bold text-stone-700">{currentStatus}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Verdict Banner */}
        <div
          className={`p-4 border-b flex items-center gap-3 ${
            isReady
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}
        >
          {isReady ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <div className="text-sm font-bold uppercase tracking-wider font-mono">
              {isReady ? 'LISTO PARA PUBLICAR' : 'NECESITA CORRECCIONES'}
            </div>
            <div className="text-xs mt-0.5 opacity-90">
              {isReady
                ? warnings.length > 0
                  ? 'Cumple con los requisitos obligatorios (hay sugerencias recomendadas).'
                  : 'Todos los parámetros editoriales y técnicos están completos.'
                : `Existen ${criticalErrors.length} requisitos críticos pendientes que deben solventarse.`}
            </div>
          </div>
        </div>

        {/* Checks Checklist */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-stone-100">
          {checks.map((item) => (
            <div key={item.id} className="pt-2.5 first:pt-0 flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : item.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                ) : item.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <Info className="w-4 h-4 text-stone-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-900">{item.label}</span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                      item.type === 'error'
                        ? 'bg-rose-100 text-rose-800'
                        : item.type === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {item.type === 'error'
                      ? 'Obligatorio'
                      : item.type === 'warning'
                      ? 'Advertencia'
                      : 'Recomendado'}
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-0.5 ${
                    item.passed ? 'text-stone-500' : 'text-stone-700 font-medium'
                  }`}
                >
                  {item.message}
                </p>
              </div>
            </div>
          ))}

          {/* Return for correction form (Editors only) */}
          {showReturnForm && onReturnForCorrection && (
            <div className="pt-4 mt-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Nota Editorial de Corrección para el Redactor
              </label>
              <textarea
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                rows={3}
                placeholder="Indique los puntos específicos que el redactor debe enmendar o ampliar..."
                className="w-full text-xs p-3 rounded-xl border border-stone-300 bg-white focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReturnForm(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReturn}
                  disabled={!returnNote.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-900 hover:bg-rose-800 text-white rounded-lg disabled:opacity-50"
                >
                  Confirmar Devolución
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            {!showReturnForm && onReturnForCorrection && canPublishDirectly && (
              <button
                type="button"
                onClick={() => setShowReturnForm(true)}
                className="inline-flex items-center gap-1.5 text-xs text-rose-800 hover:text-rose-950 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Devolver a corrección con nota</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl"
            >
              Seguir Editando
            </button>

            {!canPublishDirectly ? (
              <button
                type="button"
                onClick={() => {
                  onConfirmSubmitReview();
                  onClose();
                }}
                disabled={!isReady}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar a Revisión</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmSchedule();
                    onClose();
                  }}
                  disabled={!isReady}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold rounded-xl disabled:opacity-40 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Programar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onConfirmPublish();
                    onClose();
                  }}
                  disabled={!isReady}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Publicar Ahora</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrePublishChecklistModal;
