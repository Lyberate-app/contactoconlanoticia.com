import React, { useMemo } from 'react';
import { Check, Lightbulb, SpellCheck, WandSparkles } from 'lucide-react';

interface EditorialWritingAssistantProps {
  title: string;
  excerpt: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

export const EditorialWritingAssistant: React.FC<EditorialWritingAssistantProps> = ({
  title,
  excerpt,
  content,
  onTitleChange,
  onContentChange,
}) => {
  const duplicateWord = useMemo(() => {
    const match = content.match(/\b([\p{L}]{2,})(\s+)\1\b/iu);
    return match ? { full: match[0], word: match[1] } : null;
  }, [content]);

  const titleSuggestion = useMemo(() => {
    const cleaned = title.replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
    if (cleaned && cleaned !== title) {
      return { value: cleaned, label: 'Titular normalizado:' };
    }
    if (cleaned.length > 90) {
      const shortened = cleaned.slice(0, 87);
      const wordBoundary = shortened.lastIndexOf(' ');
      return {
        value: `${shortened.slice(0, wordBoundary > 55 ? wordBoundary : 87).trim()}…`,
        label: 'Propuesta más breve:',
      };
    }
    if (!title.trim() && excerpt.trim()) {
      return {
        value: excerpt.trim().split(/(?<=[.!?])\s+/)[0].replace(/[.!?]+$/, '').slice(0, 90),
        label: 'Propuesta inicial desde la entradilla:',
      };
    }
    if (excerpt.trim()) {
      const alternative = excerpt.trim().split(/(?<=[.!?])\s+/)[0].replace(/[.!?]+$/, '');
      if (alternative && alternative !== title && alternative.length <= 90) {
        return { value: alternative, label: 'Titular alternativo desde la entradilla:' };
      }
    }
    return '';
  }, [excerpt, title]);

  const longSentence = useMemo(
    () => content.split(/(?<=[.!?])\s+/).find((sentence) => sentence.trim().split(/\s+/).length > 35),
    [content]
  );

  const applyDuplicateFix = () => {
    if (!duplicateWord) return;
    const escaped = duplicateWord.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const updated = content.replace(new RegExp(`\\b${escaped}(\\s+)${escaped}\\b`, 'i'), duplicateWord.word);
    onContentChange(updated);
  };

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 sm:p-5" aria-labelledby="writing-assistant-title">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
          <WandSparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="writing-assistant-title" className="text-sm font-bold text-stone-900">
            Asistente de redacción
          </h2>
          <p className="mt-1 text-[11px] text-stone-600">
            Revisión local del texto; no lo envía a servicios externos. Tú decides qué cambiar.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {duplicateWord ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white bg-white/80 p-3">
            <p className="flex items-center gap-2 text-xs text-stone-800">
              <SpellCheck className="h-4 w-4 shrink-0 text-sky-700" />
              Parece que “{duplicateWord.word}” está repetida por error.
            </p>
            <button
              type="button"
              onClick={applyDuplicateFix}
              className="inline-flex items-center gap-1 rounded-lg bg-sky-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-sky-900"
            >
              <Check className="h-3 w-3" />
              Corregir
            </button>
          </div>
        ) : content.trim() ? (
          <p className="flex items-center gap-2 rounded-xl border border-white bg-white/80 p-3 text-xs text-stone-700">
            <Check className="h-4 w-4 shrink-0 text-emerald-700" />
            No se detectaron palabras duplicadas consecutivas.
          </p>
        ) : (
          <p className="rounded-xl border border-white bg-white/80 p-3 text-xs text-stone-600">
            Al escribir, aparecerán aquí sugerencias puntuales de ortografía y claridad.
          </p>
        )}

        {titleSuggestion && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white bg-white/80 p-3">
            <p className="flex items-center gap-2 text-xs text-stone-800">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-600" />
              {titleSuggestion.label}
              <strong className="font-semibold">{titleSuggestion.value}</strong>
            </p>
            <button
              type="button"
              onClick={() => onTitleChange(titleSuggestion.value)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-[11px] font-bold text-stone-800 hover:bg-stone-100"
            >
              Usar propuesta
            </button>
          </div>
        )}

        {longSentence && (
          <p className="flex items-start gap-2 rounded-xl border border-white bg-white/80 p-3 text-xs text-stone-700">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            Una oración supera las 35 palabras. Considera dividirla para facilitar la lectura.
          </p>
        )}

        {excerpt.trim() && excerpt.trim().length > 220 && (
          <p className="flex items-start gap-2 rounded-xl border border-white bg-white/80 p-3 text-xs text-stone-700">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            La entradilla tiene más de 220 caracteres; podrías acortarla para que el punto principal se entienda rápido.
          </p>
        )}
      </div>
    </section>
  );
};
