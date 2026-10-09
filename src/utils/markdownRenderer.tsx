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

  const tokenRegex =
    /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*\*[\s\S]+?\*\*\*|___[\s\S]+?___|\*\*[\s\S]+?\*\*|__[\s\S]+?__|<strong>[\s\S]*?<\/strong>|<b>[\s\S]*?<\/b>|<u>[\s\S]*?<\/u>|==[\s\S]+?==|~~[\s\S]+?~~|\*[\s\S]+?\*|_[\s\S]+?_|<em>[\s\S]*?<\/em>|<i>[\s\S]*?<\/i>|`[^`]+`)/gi;
  const rendered: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(tokenRegex)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      rendered.push(renderPlainInlineText(text.slice(lastIndex, index), rendered.length));
    }

    const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/i);
    if (linkMatch) {
      rendered.push(
        <a
          key={rendered.length}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-rose-700 dark:text-rose-400 font-semibold underline underline-offset-2 hover:text-rose-900 transition-colors"
        >
          {renderInlineContent(linkMatch[1])}
        </a>
      );
    } else if (/^(?:\*\*\*|___)[\s\S]+(?:\*\*\*|___)$/.test(token)) {
      rendered.push(
        <strong key={rendered.length} className="font-bold text-stone-950 dark:text-white">
          <em className="italic">{renderInlineContent(token.slice(3, -3))}</em>
        </strong>
      );
    } else if (/^(?:\*\*|__)[\s\S]+(?:\*\*|__)$/.test(token)) {
      rendered.push(
        <strong key={rendered.length} className="font-bold text-stone-950 dark:text-white">
          {renderInlineContent(token.slice(2, -2))}
        </strong>
      );
    } else if (/^<(?:strong|b)>[\s\S]*<\/(?:strong|b)>$/i.test(token)) {
      const inner = token.replace(/^<(?:strong|b)>/i, '').replace(/<\/(?:strong|b)>$/i, '');
      rendered.push(
        <strong key={rendered.length} className="font-bold text-stone-950 dark:text-white">
          {renderInlineContent(inner)}
        </strong>
      );
    } else if (/^<u>[\s\S]*<\/u>$/i.test(token)) {
      rendered.push(<u key={rendered.length}>{renderInlineContent(token.slice(3, -4))}</u>);
    } else if (token.startsWith('==') && token.endsWith('==')) {
      rendered.push(
        <mark key={rendered.length} className="rounded-sm bg-amber-200 px-0.5 text-inherit dark:bg-amber-400/40">
          {renderInlineContent(token.slice(2, -2))}
        </mark>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      rendered.push(
        <del key={rendered.length} className="line-through text-stone-400">
          {renderInlineContent(token.slice(2, -2))}
        </del>
      );
    } else if (/^<(?:em|i)>[\s\S]*<\/(?:em|i)>$/i.test(token)) {
      const inner = token.replace(/^<(?:em|i)>/i, '').replace(/<\/(?:em|i)>$/i, '');
      rendered.push(
        <em key={rendered.length} className="italic text-stone-800 dark:text-stone-200">
          {renderInlineContent(inner)}
        </em>
      );
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      rendered.push(
        <em key={rendered.length} className="italic text-stone-800 dark:text-stone-200">
          {renderInlineContent(token.slice(1, -1))}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      rendered.push(
        <code key={rendered.length} className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono text-xs text-rose-800 dark:text-rose-300">
          {token.slice(1, -1)}
        </code>
      );
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    rendered.push(renderPlainInlineText(text.slice(lastIndex), rendered.length));
  }

  return rendered;
}

function renderPlainInlineText(text: string, key: number): React.ReactNode {
  const visibleText = text
    .replace(/<\/(?:u|strong|b|em|i)>/gi, '')
    .replace(/(?:~~|==|__|\*\*)$/g, '');
  if (!visibleText.includes('\n')) return visibleText;
  return (
    <React.Fragment key={`text-${key}`}>
      {visibleText.split('\n').map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </React.Fragment>
  );
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

    // HTML Block (Editorial Galleries, custom figure cards, embeds, tables)
    if (/^<(?:div|figure|iframe|table|section)\b/i.test(block)) {
      rendered.push(
        <div
          key={`html-block-${index}`}
          className="my-6 not-prose overflow-hidden"
          dangerouslySetInnerHTML={{ __html: block }}
        />
      );
      continue;
    }

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
