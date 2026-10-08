import React, { useLayoutEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Eraser,
  ImagePlus,
  Images,
} from 'lucide-react';
import { renderArticleMarkdown } from '../../utils/markdownRenderer';

interface VisualArticleEditorProps {
  value: string;
  onChange: (value: string) => void;
  onOpenMediaPicker?: () => void;
  onOpenGalleryModal?: () => void;
  onPaste?: (event: React.ClipboardEvent<HTMLElement>) => void;
  insertContentRef?: React.MutableRefObject<((markdown: string) => void) | null>;
}

const formatButtons = [
  { label: 'Negrita', icon: Bold, command: 'bold' },
  { label: 'Cursiva', icon: Italic, command: 'italic' },
  { label: 'Subrayado', icon: Underline, command: 'underline' },
  { label: 'Tachado', icon: Strikethrough, command: 'strikeThrough' },
  { label: 'Resaltar', icon: Highlighter, command: 'hiliteColor', value: '#fde68a' },
  { label: 'Subtítulo', icon: Heading2, command: 'formatBlock', value: 'h2' },
  { label: 'Sección', icon: Heading3, command: 'formatBlock', value: 'h3' },
  { label: 'Cita', icon: Quote, command: 'formatBlock', value: 'blockquote' },
  { label: 'Lista', icon: List, command: 'insertUnorderedList' },
  { label: 'Lista numerada', icon: ListOrdered, command: 'insertOrderedList' },
  { label: 'Quitar formato', icon: Eraser, command: 'removeFormat' },
];

function escapeMarkdown(value: string): string {
  return value.replace(/\\/g, '\\\\');
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeMarkdown(node.textContent || '');
  }
  if (!(node instanceof HTMLElement)) return '';

  const content = Array.from(node.childNodes).map(serializeInline).join('');
  switch (node.tagName) {
    case 'BR':
      return '\n';
    case 'B':
    case 'STRONG':
      return `**${content}**`;
    case 'I':
    case 'EM':
      return `*${content}*`;
    case 'U':
      return `<u>${content}</u>`;
    case 'S':
    case 'DEL':
    case 'STRIKE':
      return `~~${content}~~`;
    case 'CODE':
      return `\`${content}\``;
    case 'MARK':
      return `==${content}==`;
    case 'A': {
      const href = node.getAttribute('href') || '';
      return /^https?:\/\//i.test(href) ? `[${content}](${href})` : content;
    }
    case 'SPAN':
      return node.style.backgroundColor ? `==${content}==` : content;
    default:
      return content;
  }
}

function serializeImage(element: HTMLElement): string | null {
  const image = element.matches('img') ? element : element.querySelector('img');
  if (!image) return null;
  const src = image.getAttribute('src');
  if (!src || !/^(https?:\/\/|\/)/i.test(src)) return null;
  const alt = (image.getAttribute('alt') || '').replace(/\]/g, '\\]');
  const caption = element.querySelector('figcaption')?.textContent?.trim();
  return `![${alt}](${src})${caption ? `\n*${caption}*` : ''}`;
}

function serializeBlock(element: HTMLElement): string {
  const image = serializeImage(element);
  if (image) return image;

  switch (element.tagName) {
    case 'HR':
      return '---';
    case 'H1':
    case 'H2':
      return `## ${serializeInline(element).trim()}`;
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6':
      return `### ${serializeInline(element).trim()}`;
    case 'BLOCKQUOTE':
      return serializeInline(element)
        .split('\n')
        .map((line) => `> ${line.trim()}`)
        .join('\n');
    case 'UL':
    case 'OL':
      return Array.from(element.children)
        .filter((child) => child.tagName === 'LI')
        .map((child, index) => `${element.tagName === 'OL' ? `${index + 1}.` : '-'} ${serializeInline(child).trim()}`)
        .join('\n');
    case 'P':
    case 'DIV':
      return serializeInline(element).trim();
    default:
      return serializeInline(element).trim();
  }
}

function markdownToEditorHtml(markdown: string): string {
  if (!markdown) return '';
  const rendered = renderArticleMarkdown(markdown, { enableDropCap: false });
  return renderToStaticMarkup(<div>{rendered}</div>);
}

function editorHtmlToMarkdown(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(parsed.body.firstElementChild?.children || [])
    .map((element) => serializeBlock(element as HTMLElement))
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export const VisualArticleEditor: React.FC<VisualArticleEditorProps> = ({
  value,
  onChange,
  onOpenMediaPicker,
  onOpenGalleryModal,
  onPaste,
  insertContentRef,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedValue = useRef<string | null>(null);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value === lastEmittedValue.current) {
      lastEmittedValue.current = null;
      return;
    }
    editor.innerHTML = markdownToEditorHtml(value);
  }, [value]);

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const markdown = editorHtmlToMarkdown(event.currentTarget.innerHTML);
    lastEmittedValue.current = markdown;
    onChange(markdown);
  };

  const insertMarkdownAtCursor = (markdown: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const parsed = new DOMParser().parseFromString(markdownToEditorHtml(markdown.trim()), 'text/html');
    const renderedContent = parsed.body.firstElementChild;
    const range = window.getSelection()?.getRangeAt(0);
    if (!renderedContent || !range || !editor.contains(range.commonAncestorContainer)) {
      onChange(`${value.trimEnd()}\n\n${markdown.trim()}`);
      return;
    }
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    while (renderedContent.firstChild) fragment.appendChild(renderedContent.firstChild);
    const lastInsertedNode = fragment.lastChild;
    range.insertNode(fragment);
    if (lastInsertedNode) {
      range.setStartAfter(lastInsertedNode);
      range.collapse(true);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
    const updatedMarkdown = editorHtmlToMarkdown(editor.innerHTML);
    lastEmittedValue.current = updatedMarkdown;
    onChange(updatedMarkdown);
  };

  if (insertContentRef) {
    insertContentRef.current = insertMarkdownAtCursor;
  }

  const runCommand = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
    const markdown = editorHtmlToMarkdown(editor.innerHTML);
    lastEmittedValue.current = markdown;
    onChange(markdown);
  };

  return (
    <div className="rounded-xl border border-stone-300 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-50 p-2">
        <span className="px-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
          Formato visual
        </span>
        {formatButtons.map(({ label, icon: Icon, command, value: commandValue }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command, commandValue)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-700 transition hover:bg-stone-200 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-rose-700"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        {onOpenMediaPicker && (
          <button
            type="button"
            title="Insertar fotografía"
            aria-label="Insertar fotografía"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onOpenMediaPicker}
            className="flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-rose-900 transition hover:bg-rose-100"
          >
            <ImagePlus className="h-4 w-4" />
            Foto
          </button>
        )}
        {onOpenGalleryModal && (
          <button
            type="button"
            title="Insertar galería"
            aria-label="Insertar galería"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onOpenGalleryModal}
            className="flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-stone-800 transition hover:bg-stone-200"
          >
            <Images className="h-4 w-4" />
            Galería
          </button>
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Cuerpo de la noticia con formato visual"
        aria-multiline="true"
        data-placeholder="Escribe tu noticia aquí. Selecciona una frase y elige un formato."
        onInput={handleInput}
        onPaste={onPaste}
        className="visual-article-editor min-h-[400px] p-4 text-base leading-relaxed text-stone-900 outline-none sm:p-5 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-rose-700 [&_blockquote]:bg-rose-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_h2]:my-5 [&_h2]:border-b [&_h2]:border-stone-200 [&_h2]:pb-2 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-4 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
};
