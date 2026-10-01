import React from 'react';
import { Check, Clock, RefreshCw, AlertTriangle, History } from 'lucide-react';

export type AutosaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | 'recovered';

export interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt?: Date | null;
  onOpenVersions?: () => void;
  versionsCount?: number;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSavedAt,
  onOpenVersions,
  versionsCount = 0,
}) => {
  const getStatusContent = () => {
    switch (status) {
      case 'recovered':
        return (
          <span className="inline-flex items-center gap-1 text-sky-700 text-xs font-mono">
            <Check className="w-3.5 h-3.5 text-sky-600" />
            <span>Borrador local recuperado</span>
          </span>
        );
      case 'saving':
        return (
          <span className="inline-flex items-center gap-1.5 text-stone-500 text-xs font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
            <span>Guardando borrador...</span>
          </span>
        );
      case 'saved':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-mono">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Guardado automáticamente
              {lastSavedAt && (
                <span className="text-stone-400 ml-1">
                  ({lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                </span>
              )}
            </span>
          </span>
        );
      case 'unsaved':
        return (
          <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Cambios pendientes</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Error al guardar</span>
          </span>
        );
    }
  };

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200">
      {getStatusContent()}

      {onOpenVersions && (
        <button
          type="button"
          onClick={onOpenVersions}
          className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 border-l border-stone-200 pl-2 cursor-pointer transition-colors"
          title="Ver historial de revisiones"
        >
          <History className="w-3 h-3 text-stone-500" />
          <span>Versiones ({versionsCount})</span>
        </button>
      )}
    </div>
  );
};
