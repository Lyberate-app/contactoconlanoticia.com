import React, { useEffect } from 'react';

export interface SeoProps {
  title: string;
  description?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article';
  imageUrl?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  authorName?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_SITE_NAME = 'Contacto con la Noticia';
const DEFAULT_DESCRIPTION = 'Periódico digital independiente. Información veraz y oportuna de Venezuela y el mundo.';
const DEFAULT_IMAGE = '/placeholder-news.jpg';

export const SeoHead: React.FC<SeoProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  type = 'website',
  imageUrl,
  publishedTime,
  modifiedTime,
  section,
  authorName,
  noIndex = false,
  jsonLd,
}) => {
  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title.includes(DEFAULT_SITE_NAME)
      ? title
      : `${title} | ${DEFAULT_SITE_NAME}`;
    document.title = formattedTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attr: 'name' | 'property', key: string, content?: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!content) {
        if (element) element.remove();
        return;
      }
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper for canonical link
    const setCanonical = (href?: string) => {
      let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!href) {
        if (element) element.remove();
        return;
      }
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    const currentUrl = canonicalUrl || window.location.href;
    const finalImage = imageUrl
      ? (imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`)
      : `${window.location.origin}${DEFAULT_IMAGE}`;

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setCanonical(currentUrl);

    // 3. Open Graph Tags
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', DEFAULT_SITE_NAME);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:image', finalImage);
    setMetaTag('property', 'og:locale', 'es_VE');

    if (type === 'article') {
      if (publishedTime) setMetaTag('property', 'article:published_time', publishedTime);
      if (modifiedTime) setMetaTag('property', 'article:modified_time', modifiedTime);
      if (section) setMetaTag('property', 'article:section', section);
      if (authorName) setMetaTag('property', 'article:author', authorName);
    } else {
      setMetaTag('property', 'article:published_time', undefined);
      setMetaTag('property', 'article:modified_time', undefined);
      setMetaTag('property', 'article:section', undefined);
      setMetaTag('property', 'article:author', undefined);
    }

    // 4. Twitter / X Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', finalImage);

    // 5. JSON-LD Structured Data
    let scriptTag = document.getElementById('lyberate-structured-data') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'lyberate-structured-data';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd, null, 2);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    return () => {
      // Optional cleanup on unmount
    };
  }, [
    title,
    description,
    canonicalUrl,
    type,
    imageUrl,
    publishedTime,
    modifiedTime,
    section,
    authorName,
    noIndex,
    jsonLd,
  ]);

  return null;
};

