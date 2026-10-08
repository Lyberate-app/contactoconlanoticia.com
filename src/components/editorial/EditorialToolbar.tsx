import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
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
  Images,
  Video,
  Megaphone,
  Share2,
  Eraser,
  Sparkles,
} from 'lucide-react';
import { compressAndResizeImage } from '../../utils/imageCompressor';
import { notify } from '../../utils/notice';

interface EditorialToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentChange: (newContent: string) => void;
  onOpenMediaPicker?: () => void;
  onOpenGalleryModal?: () => void;
}

export const EditorialToolbar: React.FC<EditorialToolbarProps> = ({
  textareaRef,
  onContentChange,
  onOpenMediaPicker,
  onOpenGalleryModal,
}) => {
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [blocksMenuOpen, setBlocksMenuOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const blocksMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFormatMenuOpen(false);
      }
      if (blocksMenuRef.current && !blocksMenuRef.current.contains(e.target as Node)) {
        setBlocksMenuOpen(false);
      }
    };
    if (formatMenuOpen || blocksMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [formatMenuOpen, blocksMenuOpen]);

  const insertSyntax = (
    prefix: string,
    suffix: string = '',
    defaultText: string = ''
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = selectionRef.current?.start ?? textarea.selectionStart;
    const end = selectionRef.current?.end ?? textarea.selectionEnd;
    selectionRef.current = null;
    const currentVal = textarea.value;

    const selectedText = currentVal.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const updated =
      currentVal.substring(0, start) +
      replacement +
      currentVal.substring(end);

    onContentChange(updated);
    setFormatMenuOpen(false);
    setBlocksMenuOpen(false);

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
  const handleUnderline = () => insertSyntax('<u>', '</u>', 'texto subrayado');
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

  const handleClearFormat = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;

    const selected = textarea.value.substring(start, end);
    const cleaned = selected
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/<u>(.*?)<\/u>/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/==(.*?)==/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s+/gm, '');

    const updated =
      textarea.value.substring(0, start) +
      cleaned +
      textarea.value.substring(end);

    onContentChange(updated);
    setFormatMenuOpen(false);
  };

  // Embed Insertion
  const handleInsertEmbed = () => {
    const url = prompt('Pegue el enlace del video o recurso multimedia (YouTube, X, Vimeo):', 'https://www.youtube.com/watch?v=');
    if (url && url.trim()) {
      insertSyntax(`\n\n:::embed url="${url.trim()}" :::\n\n`, '', '');
    }
  };

  // In-article Ad slot
  const handleInsertAdSlot = () => {
    insertSyntax('\n\n:::ad slot="ARTICLE_MIDDLE" :::\n\n', '', '');
  };

  // In-article Related Story
  const handleInsertRelated = () => {
    const slug = prompt('Ingrese el slug o titular del artículo relacionado:', 'noticia-relevante');
    if (slug && slug.trim()) {
      insertSyntax(`\n\n:::related slug="${slug.trim()}" :::\n\n`, '', '');
    }
  };

  // Image upload handler
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
      notify('No se pudo procesar la imagen seleccionada.', 'error', 'Imagen no disponible');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const btnClass =
    'h-8 px-2 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-200 active:scale-95 transition flex items-center justify-center cursor-pointer border border-transparent';

  return (
    <div
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('button')) {
          const textarea = textareaRef.current;
          if (textarea) {
            selectionRef.current = {
              start: textarea.selectionStart,
              end: textarea.selectionEnd,
            };
          }
          event.preventDefault();
        }
      }}
      className="relative z-30 flex flex-wrap items-center gap-1 p-2 bg-stone-100 border border-stone-200 rounded-t-xl text-xs"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleToolbarImageUpload}
        className="hidden"
      />

      {/* 1. Negrita Directa */}
      <button
        type="button"
        onClick={handleBold}
        className={`${btnClass} w-8 px-0`}
        title="Negrita (**texto**)"
      >
        <Bold className="w-4 h-4" />
      </button>

      {/* 2. Cursiva Directa */}
      <button
        type="button"
        onClick={handleItalic}
        className={`${btnClass} w-8 px-0`}
        title="Cursiva (*texto*)"
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* 3. Subrayado Directo */}
      <button
        type="button"
        onClick={handleUnderline}
        className={`${btnClass} w-8 px-0`}
        title="Subrayado (<u>texto</u>)"
      >
        <Underline className="w-4 h-4" />
      </button>

      {/* 4. Menú de Formato Ergonómico para Móvil / Touch */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setFormatMenuOpen(!formatMenuOpen)}
          className={`${btnClass} bg-white border-stone-300 font-semibold text-[11px] flex items-center gap-1`}
          title="Menú de formato adicional y selección táctil"
        >
          <Type className="w-3.5 h-3.5" />
          <span>Formato</span>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>

        {formatMenuOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-white border border-stone-200 rounded-xl p-1.5 shadow-xl animate-in fade-in duration-100">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
              Opciones de Selección
            </div>

            <div className="space-y-0.5 mt-1 text-xs">
              <button
                type="button"
                onClick={handleBold}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left font-bold text-stone-900"
              >
                <Bold className="w-3.5 h-3.5 text-stone-600" />
                <span>Negrita</span>
              </button>
              <button
                type="button"
                onClick={handleItalic}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left italic text-stone-800"
              >
                <Italic className="w-3.5 h-3.5 text-stone-600" />
                <span>Cursiva</span>
              </button>
              <button
                type="button"
                onClick={handleUnderline}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left underline text-stone-800"
              >
                <Underline className="w-3.5 h-3.5 text-stone-600" />
                <span>Subrayado</span>
              </button>
              <button
                type="button"
                onClick={handleHighlight}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left text-amber-800"
              >
                <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                <span>Resaltar Texto</span>
              </button>
              <button
                type="button"
                onClick={handleStrikethrough}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left line-through text-stone-600"
              >
                <Strikethrough className="w-3.5 h-3.5 text-stone-500" />
                <span>Tachado</span>
              </button>
              <div className="my-1 border-t border-stone-100" />
              <button
                type="button"
                onClick={handleH2}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left font-semibold text-stone-800"
              >
                <Heading2 className="w-3.5 h-3.5 text-stone-600" />
                <span>Subtítulo H2</span>
              </button>
              <button
                type="button"
                onClick={handleH3}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left font-semibold text-stone-800"
              >
                <Heading3 className="w-3.5 h-3.5 text-stone-600" />
                <span>Subsección H3</span>
              </button>
              <button
                type="button"
                onClick={handleQuote}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left text-stone-800"
              >
                <Quote className="w-3.5 h-3.5 text-stone-600" />
                <span>Cita Periodística</span>
              </button>
              <div className="my-1 border-t border-stone-100" />
              <button
                type="button"
                onClick={handleClearFormat}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-left text-red-700"
              >
                <Eraser className="w-3.5 h-3.5 text-red-600" />
                <span>Limpiar Formato</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <span className="w-px h-4 bg-stone-300 mx-0.5" />

      {/* Headings */}
      <button
        type="button"
        onClick={handleH2}
        className={`${btnClass} w-8 px-0`}
        title="Subtítulo H2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleH3}
        className={`${btnClass} w-8 px-0`}
        title="Subsección H3"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      {/* Quotes & Lists */}
      <button
        type="button"
        onClick={handleQuote}
        className={`${btnClass} w-8 px-0`}
        title="Cita Periodística (> cita)"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleList}
        className={`${btnClass} w-8 px-0`}
        title="Lista de puntos"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleNumbered}
        className={`${btnClass} w-8 px-0`}
        title="Lista numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      {/* Link & Divider */}
      <button
        type="button"
        onClick={handleLink}
        className={`${btnClass} w-8 px-0`}
        title="Insertar enlace"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleDivider}
        className={`${btnClass} w-8 px-0`}
        title="Separador horizontal (---)"
      >
        <Minus className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-stone-300 mx-0.5" />

      {/* Image Insertion */}
      <button
        type="button"
        onClick={() => {
          if (onOpenMediaPicker) onOpenMediaPicker();
          else fileInputRef.current?.click();
        }}
        disabled={compressing}
        className={`${btnClass} bg-white border-stone-300 font-semibold gap-1 text-[11px] text-rose-900`}
        title="Insertar fotografía con compresión automática a 1200px"
      >
        <ImageIcon className="w-3.5 h-3.5 text-rose-800" />
        <span>{compressing ? 'Optimizando...' : 'Foto'}</span>
      </button>

      {/* Gallery Button */}
      {onOpenGalleryModal && (
        <button
          type="button"
          onClick={onOpenGalleryModal}
          className={`${btnClass} bg-white border-stone-300 font-semibold gap-1 text-[11px] text-stone-800`}
          title="Crear o insertar galería fotográfica ordenada"
        >
          <Images className="w-3.5 h-3.5 text-stone-700" />
          <span>Galería</span>
        </button>
      )}

      {/* Editorial Content Blocks Dropdown */}
      <div className="relative" ref={blocksMenuRef}>
        <button
          type="button"
          onClick={() => setBlocksMenuOpen(!blocksMenuOpen)}
          className={`${btnClass} bg-white border-stone-300 font-semibold gap-1 text-[11px] text-stone-800`}
          title="Insertar bloques editoriales (Embeds, Publicidad, Relacionadas)"
        >
          <Sparkles className="w-3.5 h-3.5 text-stone-600" />
          <span>Bloques</span>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>

        {blocksMenuOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 w-52 bg-white border border-stone-200 rounded-xl p-1.5 shadow-xl animate-in fade-in duration-100">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
              Bloques Especiales
            </div>
            <div className="space-y-0.5 mt-1 text-xs">
              <button
                type="button"
                onClick={handleInsertEmbed}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left text-stone-800"
              >
                <Video className="w-3.5 h-3.5 text-stone-600" />
                <span>Video / Embed</span>
              </button>
              <button
                type="button"
                onClick={handleInsertAdSlot}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left text-stone-800"
              >
                <Megaphone className="w-3.5 h-3.5 text-stone-600" />
                <span>Bloque Publicitario</span>
              </button>
              <button
                type="button"
                onClick={handleInsertRelated}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-left text-stone-800"
              >
                <Share2 className="w-3.5 h-3.5 text-stone-600" />
                <span>Noticia Relacionada</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
