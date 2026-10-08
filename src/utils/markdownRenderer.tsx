import React from 'react';
import { OptimizedImage } from '../components/common/OptimizedImage';

/**
 * Strips all markdown and HTML tags returning clean plain text
 * for use in meta descriptions, search indices, audio TTS, and social shares.
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '') // headings
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images -> alt text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> anchor text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1') // bold-italic ***
    .replace(/___([^_]+)___/g, '$1') // bold-italic ___
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold **
    .replace(/__([^_]+)__/g, '$1') // bold __
    .replace(/\*([^*]+)\*/g, '$1') // italic *
    .replace(/_([^_]+)_/g, '$1') // italic _
    .replace(/~~([^~]+)~~/g, '$1') // strikethrough ~~
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/<\/?[^>]+(>|$)/g, '') // HTML tags
    .replace(/^>\s*/gm, '') // blockquotes
    .replace(/^[-*+]\s+/gm, '') // unordered lists
    .replace(/^\d+\.\s+/gm, '') // ordered lists
    .replace(/\r?\n+/g, ' ') // collapse newlines to spaces
    .replace(/\s{2,}/g, ' ') // collapse multiple spaces
    .trim();
}

/**
 * Renders inline Markdown syntax (bold, italic, strikethrough, links, code, line breaks)
 * into safe, accessible React DOM nodes without raw syntax artifacts.
 */
export function renderInlineContent(text: string): React.ReactNode {
  if (!text) return null;

  // Regex matches:
  // 1. Markdown Links: [anchor](url)
  // 2. Bold+Italic: ***text*** or ___text___
  // 3. Bold text: **text** or __text__ or <strong>text</strong> or <b>text</b>
  // 4. Underline and highlighted text: <u>text</u> and ==text==
  // 5. Strikethrough: ~~text~~
  // 6. Italic text: *text* or _text_ or <em>text</em> or <i>text</i>
  // 7. Inline code: `code`
  const tokenRegex = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|<strong>[^<]+<\/strong>|<b>[^<]+<\/b>|<u>[^<]+<\/u>|==[^=\n]+==|~~[^~]+~~|\*[^*]+\*|_[^_]+_|<em>[^<]+<\/em>|<i>[^<]+<\/i>|`[^`]+`)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Links: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-rose-700 dark:text-rose-400 font-semibold underline underline-offset-2 hover:text-rose-900 transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // 2. Bold + Italic: ***text*** or ___text___
    if (
      (part.startsWith('***') && part.endsWith('***') && part.length >= 6) ||
      (part.startsWith('___') && part.endsWith('___') && part.length >= 6)
    ) {
      return (
        <strong key={index} className="font-bold text-stone-950 dark:text-white">
          <em className="italic">{part.slice(3, -3)}</em>
        </strong>
      );
    }

    // 3. Bold: **text** or __text__ or <strong>...</strong> or <b>...</b>
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={index} className="font-bold text-stone-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const strongMatch = part.match(/^<(?:strong|b)>([^<]+)<\/(?:strong|b)>$/i);
    if (strongMatch) {
      return (
        <strong key={index} className="font-bold text-stone-950 dark:text-white">
          {strongMatch[1]}
        </strong>
      );
    }

    const underlineMatch = part.match(/^<u>([^<]+)<\/u>$/i);
    if (underlineMatch) {
      return <u key={index}>{underlineMatch[1]}</u>;
    }

    if (part.startsWith('==') && part.endsWith('==') && part.length >= 5) {
      return (
        <mark key={index} className="rounded-sm bg-amber-200 px-0.5 text-inherit dark:bg-amber-400/40">
          {part.slice(2, -2)}
        </mark>
      );
    }

    // 5. Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={index} className="line-through text-stone-400">
          {part.slice(2, -2)}
        </del>
      );
    }

    // 5. Italic: *text* or _text_ or <em>...</em> or <i>...</i>
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-stone-800 dark:text-stone-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    const emMatch = part.match(/^<(?:em|i)>([^<]+)<\/(?:em|i)>$/i);
    if (emMatch) {
      return (
        <em key={index} className="italic text-stone-800 dark:text-stone-200">
          {emMatch[1]}
        </em>
      );
    }

    // 6. Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono text-xs text-rose-800 dark:text-rose-300">
          {part.slice(1, -1)}
        </code>
      );
    }

    // 7. Regular text: support internal \n as <br />
    if (part.includes('\n')) {
      const subLines = part.split('\n');
      return (
        <React.Fragment key={index}>
          {subLines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </React.Fragment>
      );
    }

    return part;
  });
}

export interface MarkdownRenderOptions {
  enableDropCap?: boolean;
  injectMiddleAd?: boolean;
  adComponent?: React.ReactNode;
  paragraphClassName?: string;
}

/**
 * Editorial Markdown parser that converts news copy into formatted HTML
 * with support for editorial typography, images, blockquotes, lists, headings, and horizontal rules.
 */
export function renderArticleMarkdown(
  content: string,
  options?: MarkdownRenderOptions
): React.ReactNode[] {
  if (!content) return [];

  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/(!\[[^\]]*\]\([^)]+\))\n(\*[^*\n]+\*)/g, '$1\n\n$2');

  const blocks = normalized
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const middleIndex = Math.max(1, Math.floor(blocks.length / 2));
  const rendered: React.ReactNode[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    // Image block: ![alt](url)
    const imageMatch = block.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)$/);
    if (imageMatch) {
      const captionMatch = blocks[index + 1]?.match(/^\*([^*]+)\*$/);
      rendered.push(
        <OptimizedImage
          key={`image-${index}`}
          src={imageMatch[2]}
          alt={imageMatch[1] || 'Fotografía de la noticia'}
          caption={captionMatch?.[1] || null}
          aspectRatio="16/9"
          className="w-full rounded-2xl shadow-xs my-6 overflow-hidden"
        />
      );
      if (captionMatch) {
        index += 1;
      }
      continue;
    }

    // Horizontal Rule: --- or *** or ___
    if (/^(?:---|---|\*\*\*|___)$/.test(block)) {
      rendered.push(
        <hr key={index} className="my-8 border-t border-stone-200 dark:border-stone-800" />
      );
      continue;
    }

    // Headings: #, ##, ###, ####, etc.
    const headingMatch = block.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingContent = headingMatch[2];
      if (level === 1 || level === 2) {
        rendered.push(
          <h2 key={index} className="font-serif font-black text-xl sm:text-2xl text-stone-950 dark:text-white mt-8 mb-4 border-b border-black/5 dark:border-white/5 pb-2">
            {renderInlineContent(headingContent)}
          </h2>
        );
      } else {
        rendered.push(
          <h3 key={index} className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-white mt-6 mb-3">
            {renderInlineContent(headingContent)}
          </h3>
        );
      }
      continue;
    }

    // Blockquote: > text
    if (block.startsWith('>')) {
      const quoteText = block.split('\n').map((l) => l.replace(/^>\s*/, '')).join(' ');
      rendered.push(
        <blockquote
          key={index}
          className="border-l-4 border-rose-700 bg-rose-50/50 dark:bg-rose-950/20 pl-4 pr-3 py-3 my-6 font-serif italic text-base sm:text-lg text-stone-800 dark:text-stone-200 rounded-r-2xl"
        >
          {renderInlineContent(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Unordered List: - item or * item
    if (block.split('\n').every((l) => /^[-*]\s+/.test(l.trim()))) {
      const items = block.split('\n').map((l) => l.trim().replace(/^[-*]\s+/, ''));
      rendered.push(
        <ul key={index} className="list-disc pl-5 space-y-1.5 my-5 text-stone-800 dark:text-stone-200 text-base leading-relaxed">
          {items.map((item, itemIdx) => (
            <li key={itemIdx}>{renderInlineContent(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List: 1. item
    if (block.split('\n').every((l) => /^\d+\.\s+/.test(l.trim()))) {
      const items = block.split('\n').map((l) => l.trim().replace(/^\d+\.\s+/, ''));
      rendered.push(
        <ol key={index} className="list-decimal pl-5 space-y-1.5 my-5 text-stone-800 dark:text-stone-200 text-base leading-relaxed">
          {items.map((item, itemIdx) => (
            <li key={itemIdx}>{renderInlineContent(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular Paragraph with Optional Drop Cap
    const isFirstParagraph = index === 0;
    const canHaveDropCap =
      options?.enableDropCap &&
      isFirstParagraph &&
      block.length > 0 &&
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(block);

    const pClass = options?.paragraphClassName || 'leading-relaxed mb-5';

    if (canHaveDropCap) {
      const firstChar = block.charAt(0);
      const restText = block.slice(1);
      rendered.push(
        <p key={index} className={pClass}>
          <span className="float-left pr-2.5 pt-1 text-4xl sm:text-5xl font-black font-serif leading-none text-rose-950 dark:text-rose-400 select-none">
            {firstChar}
          </span>
          {renderInlineContent(restText)}
        </p>
      );
    } else {
      rendered.push(
        <p key={index} className={pClass}>
          {renderInlineContent(block)}
        </p>
      );
    }

    // Optional Middle Ad Slot Injection
    if (options?.injectMiddleAd && options.adComponent && index === middleIndex && blocks.length > 2) {
      rendered.push(
        <div key={`ad-${index}`} className="my-6">
          {options.adComponent}
        </div>
      );
    }
  }

  return rendered;
}
