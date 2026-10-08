import React from 'react';
import { ClipboardList, FileText, MessageSquareQuote } from 'lucide-react';

export interface StoryTemplate {
  id: 'interview' | 'incident' | 'press-release';
  name: string;
  description: string;
  content: string;
  icon: React.FC<{ className?: string }>;
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'interview',
    name: 'Entrevista',
    description: 'Presentación, preguntas y citas verificadas.',
    icon: MessageSquareQuote,
    content: '## Presentación\n[¿Quién es la persona entrevistada y por qué es relevante?]\n\n## Contexto\n[Explica el tema y su importancia para la comunidad.]\n\n## Preguntas y respuestas\n**Pregunta:** [Escribe la pregunta.]\n\n**Respuesta:** [Incluye la respuesta respetando las palabras de la fuente.]\n\n## Cierre\n[Resume el punto principal y añade información de seguimiento.]',
  },
  {
    id: 'incident',
    name: 'Suceso',
    description: 'Ordena qué pasó, dónde, cuándo y qué sigue.',
    icon: ClipboardList,
    content: '## ¿Qué ocurrió?\n[Describe los hechos confirmados, sin especular.]\n\n## ¿Cuándo y dónde?\n[Indica fecha, hora y lugar con precisión.]\n\n## Personas e instituciones involucradas\n[Incluye únicamente datos confirmados y pertinentes.]\n\n## Respuesta oficial\n[Resume lo informado por las autoridades o fuentes identificadas.]\n\n## Qué sigue\n[Explica las próximas acciones o cómo puede actualizarse la información.]',
  },
  {
    id: 'press-release',
    name: 'Comunicado',
    description: 'Resume el anuncio y atribuye sus declaraciones.',
    icon: FileText,
    content: '## El anuncio\n[Resume en una frase qué se anunció y quién lo hizo.]\n\n## Detalles principales\n[Incluye fechas, lugares, cifras y a quién afecta.]\n\n## Declaración\n> “[Añade una cita textual verificada.]” — [Nombre y cargo]\n\n## Contexto para la audiencia\n[Explica antecedentes y qué significa el anuncio para la comunidad.]',
  },
];

interface StoryTemplatePickerProps {
  onSelect: (template: StoryTemplate) => void;
}

export const StoryTemplatePicker: React.FC<StoryTemplatePickerProps> = ({ onSelect }) => (
  <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 sm:p-5">
    <div className="mb-3">
      <h2 className="text-sm font-bold text-stone-900">Empieza con una plantilla</h2>
      <p className="mt-1 text-xs text-stone-600">
        Te guía con preguntas; puedes editar o borrar cada sección. No se publica automáticamente.
      </p>
    </div>
    <div className="grid gap-2 sm:grid-cols-3">
      {STORY_TEMPLATES.map((template) => {
        const Icon = template.icon;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white p-3 text-left transition hover:border-rose-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-rose-700"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-rose-800" />
            <span>
              <span className="block text-xs font-bold text-stone-900">{template.name}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-stone-500">{template.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  </section>
);
