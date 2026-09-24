import React, { useState } from 'react';
import { Newspaper } from 'lucide-react';

export interface ImageVariant {
  variant_name: string;
  format: string;
  url: string;
  width: number;
}

export interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
  caption?: string | null;
  credit?: string | null;
  priority?: boolean;
  variants?: ImageVariant[];
  className?: string;
  sizes?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 1200,
  height = 675,
  aspectRatio = '16/9',
  caption,
  credit,
  priority = false,
  variants = [],
  className = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 1200px',
}) => {
  const [hasError, setHasError] = useState(false);

  // Aspect ratio styling for CLS prevention
  const aspectClass =
    aspectRatio === '16/9'
      ? 'aspect-[16/9]'
      : aspectRatio === '4/3'
      ? 'aspect-[4/3]'
      : aspectRatio === '1/1'
      ? 'aspect-square'
      : '';

  if (!src || hasError) {
    return (
      <figure className={`bg-stone-200/80 border border-stone-300 rounded-sm overflow-hidden flex flex-col items-center justify-center text-stone-500 ${aspectClass} ${className}`}>
        <div className="text-center p-4">
          <Newspaper className="w-10 h-10 mx-auto text-stone-400 mb-1.5" />
          <span className="text-[11px] font-serif italic text-stone-500 block">
            {alt || 'Fotografía de archivo · Contacto con la Noticia'}
          </span>
        </div>
        {(caption || credit) && (
          <figcaption className="text-[11px] text-stone-500 italic mt-1 px-3 text-center">
            {caption} {credit && <span className="text-stone-400">({credit})</span>}
          </figcaption>
        )}
      </figure>
    );
  }

  // Group variants by format for <source> elements
  const avifVariants = variants.filter(v => v.format === 'avif');
  const webpVariants = variants.filter(v => v.format === 'webp');

  const avifSrcSet = avifVariants.map(v => `${v.url} ${v.width}w`).join(', ');
  const webpSrcSet = webpVariants.map(v => `${v.url} ${v.width}w`).join(', ');

  const imageElement = (
    <picture className={`block overflow-hidden rounded-sm bg-stone-100 ${aspectClass}`}>
      {avifSrcSet && (
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
      )}
      {webpSrcSet && (
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${className}`}
      />
    </picture>
  );

  if (!caption && !credit) {
    return imageElement;
  }

  return (
    <figure className="space-y-1.5">
      {imageElement}
      <figcaption className="text-[11px] sm:text-xs font-serif italic text-stone-500 text-center leading-relaxed">
        {caption}
        {credit && (
          <span className="text-stone-400 not-italic ml-1">
            (Foto: {credit})
          </span>
        )}
      </figcaption>
    </figure>
  );
};

