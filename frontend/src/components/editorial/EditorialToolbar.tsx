import React from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Minus,
} from 'lucide-react';

interface EditorialToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentChange: (newContent: string) => void;
}

export const EditorialToolbar: React.FC<EditorialToolbarProps> = ({
  textareaRef,
  onContentChange,
}) => {
  const insertSyntax = (
    prefix: string,
    suffix: string = '',
    defaultText: string = ''
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const selectedText = currentVal.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const updated =
      currentVal.substring(0, start) +
      replacement +
      currentVal.substring(end);

    onContentChange(updated);

    // Reposition cursor after DOM update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  const handleBold = () => insertSyntax('**', '**', 'texto en negrita');
  const handleItalic = () => insertSyntax('*', '*', 'texto en cursiva');
  const handleH2 = () => insertSyntax('\n\n## ', '\n', 'Subtítulo de sección');
  const handleH3 = () => insertSyntax('\n\n### ', '\n', 'Subsección informativa');
  const handleQuote = () =>
    insertSyntax('\n\n> "', '" — Declaración de la fuente\n', 'Cita textual relevante');
  const handleList = () =>
    insertSyntax('\n- ', '\n- Elemento adicional', 'Primer elemento');
  const handleNumbered = () =>
    insertSyntax('\n1. ', '\n2. Segundo punto', 'Primer aspecto');
  const handleLink = () => {
    const url = prompt('Ingrese la URL del enlace (https://...):', 'https://');
    if (url) {
      insertSyntax('[', `](${url})`, 'texto del enlace');
    }
  };
  const handleDivider = () => insertSyntax('\n\n---\n\n', '', '');

  const btnClass =
    'p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors flex items-center justify-center';

  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-stone-100 border border-stone-300 border-b-0 text-xs">
      <button
        type="button"
        onClick={handleBold}
        className={btnClass}
        title="Negrita (**texto**)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={handleItalic}
        className={btnClass}
        title="Cursiva (*texto*)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <span className="w-px h-4 bg-stone-300 mx-1" />

      <button
        type="button"
        onClick={handleH2}
        className={btnClass}
        title="Subtítulo Principal H2"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={handleH3}
        className={btnClass}
        title="Subtítulo Secundario H3"
      >
        <Heading3 className="w-3.5 h-3.5" />
      </button>

      <span className="w-px h-4 bg-stone-300 mx-1" />

      <button
        type="button"
        onClick={handleQuote}
        className={btnClass}
        title="Cita Periodística (> cita)"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={handleList}
        className={btnClass}
        title="Lista con Viñetas (- item)"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={handleNumbered}
        className={btnClass}
        title="Lista Numerada (1. item)"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <span className="w-px h-4 bg-stone-300 mx-1" />

      <button
        type="button"
        onClick={handleLink}
        className={btnClass}
        title="Insertar Enlace ([texto](url))"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={handleDivider}
        className={btnClass}
        title="Separador de Sección (---)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

