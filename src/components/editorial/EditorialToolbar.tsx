import React, { useState, useRef, useEffect } from 'react';
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
  Image as ImageIcon,
  ChevronDown,
  Type,
  Highlighter,
  Strikethrough,
} from 'lucide-react';
import { compressAndResizeImage } from '../../utils/imageCompressor';

interface EditorialToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentChange: (newContent: string) => void;
  onOpenMediaPicker?: () => void;
}

export const EditorialToolbar: React.FC<EditorialToolbarProps> = ({
  textareaRef,
  onContentChange,
  onOpenMediaPicker,
}) => {
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFormatMenuOpen(false);
      }
    };
    if (formatMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [formatMenuOpen]);

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
    setFormatMenuOpen(false);

    // Reposition cursor after DOM update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 15);
  };

  const handleBold = () => insertSyntax('**', '**', 'texto en negrita');
  const handleItalic = () => insertSyntax('*', '*', 'texto en cursiva');
  const handleStrikethrough = () => insertSyntax('~~', '~~', 'texto tachado');
  const handleHighlight = () => insertSyntax('==', '==', 'texto destacado');
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

  // Handle direct image insertion from local file
  const handleToolbarImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const res = await compressAndResizeImage(file, 1200, 0.82);
      const caption = prompt('Pie de foto opcional para la imagen:', file.name.replace(/\.[^/.]+$/, '')) || '';
      const imageMarkdown = `\n\n![${caption || 'Fotografía de la noticia'}](${res.dataUrl})\n*${caption || 'Foto: Redacción / Contacto con la Noticia'}*\n\n`;
      insertSyntax(imageMarkdown, '', '');
    } catch (err) {
      console.error('Error insertando imagen:', err);
      alert('No se pudo procesar la imagen seleccionada.');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const btnClass =
    'w-8 h-8 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center cursor-pointer';

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-white/80 dark:bg-stone-800/80 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-t-[22px] border-b-0 text-xs relative">
      {/* Hidden file input for fast toolbar image compression */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleToolbarImageUpload}
        className="hidden"
      />

      {/* 1. Botón Negrita Directo */}
      <button
        type="button"
        onClick={handleBold}
        className={btnClass}
        title="Negrita rápida (**texto**)"
      >
        <Bold className="w-4 h-4" />
      </button>

      {/* 2. SEGUNDO BOTÓN: Menú Desplegable con Formato Ergonómico Móvil */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setFormatMenuOpen(!formatMenuOpen)}
          className={`${btnClass} flex items-center gap-0.5 px-2 w-auto bg-stone-100 dark:bg-stone-700/60 font-semibold text-[11px]`}
          title="Menú de formato y negrita para selección en móvil"
        >
          <Type className="w-3.5 h-3.5" />
          <span>Formato</span>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>

        {formatMenuOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 dark:border-stone-800">
              Formato de selección móvil
            </div>

            <div className="space-y-0.5 mt-1">
              <button
                type="button"
                onClick={handleBold}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer"
              >
                <Bold className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                <span>Colocar en Negrita</span>
              </button>

              <button
                type="button"
                onClick={handleItalic}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs italic text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <Italic className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                <span>Colocar en Cursiva</span>
              </button>

              <button
                type="button"
                onClick={handleHighlight}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                <span>Resaltar Texto Seleccionado</span>
              </button>

              <button
                type="button"
                onClick={handleStrikethrough}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs line-through text-stone-600 dark:text-stone-400 cursor-pointer"
              >
                <Strikethrough className="w-3.5 h-3.5 text-stone-500" />
                <span>Texto Tachado</span>
              </button>

              <div className="my-1 border-t border-stone-100 dark:border-stone-800" />

              <button
                type="button"
                onClick={handleH2}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <Heading2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                <span>Subtítulo H2</span>
              </button>

              <button
                type="button"
                onClick={handleH3}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <Heading3 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                <span>Subsección H3</span>
              </button>

              <button
                type="button"
                onClick={handleQuote}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <Quote className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                <span>Cita Periodística</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleItalic}
        className={btnClass}
        title="Cursiva (*texto*)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-stone-300/80 dark:bg-stone-700 mx-1" />

      {/* Headings */}
      <button
        type="button"
        onClick={handleH2}
        className={btnClass}
        title="Subtítulo Principal H2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleH3}
        className={btnClass}
        title="Subtítulo Secundario H3"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-stone-300/80 dark:bg-stone-700 mx-1" />

      {/* Quotes & Lists */}
      <button
        type="button"
        onClick={handleQuote}
        className={btnClass}
        title="Cita Periodística (> cita)"
      >
        <Quote className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleList}
        className={btnClass}
        title="Lista con Viñetas (- item)"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleNumbered}
        className={btnClass}
        title="Lista Numerada (1. item)"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-stone-300/80 dark:bg-stone-700 mx-1" />

      {/* Link & Divider */}
      <button
        type="button"
        onClick={handleLink}
        className={btnClass}
        title="Insertar Enlace ([texto](url))"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleDivider}
        className={btnClass}
        title="Separador de Sección (---)"
      >
        <Minus className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-stone-300/80 dark:bg-stone-700 mx-1" />

      {/* 3. BOTÓN: INSERTAR IMAGEN EN EL CUERPO (CON COMPRESIÓN Y PREVIEW) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            if (onOpenMediaPicker) {
              onOpenMediaPicker();
            } else {
              fileInputRef.current?.click();
            }
          }}
          disabled={compressing}
          className={`${btnClass} px-2.5 w-auto bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold gap-1 text-[11px] hover:bg-rose-500/20`}
          title="Insertar fotografía en el texto (con compresión automática máx 1200px)"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{compressing ? 'Optimizando...' : 'Insertar Foto'}</span>
        </button>
      </div>
    </div>
  );
};
