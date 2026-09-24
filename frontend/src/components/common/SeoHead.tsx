import React, { useEffect } from 'react';
import { SITE_URL } from '../../config/env';
import { useSettings } from '../../context/SettingsContext';

export interface SeoProps {
  title: string;
  description?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article';
  imageUrl?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  authorName?: string;
  noIndex?: boolean;
  twitterSite?: string;
  twitterCreator?: string;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_IMAGE = '/placeholder-news.jpg';

export const SeoHead: React.FC<SeoProps> = ({
  title,
  description,
  canonicalUrl,
  type = 'website',
  imageUrl,
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt,
  publishedTime,
  modifiedTime,
  section,
  authorName,
  noIndex = false,
  twitterSite,
  twitterCreator,
  jsonLd,
}) => {
  const { settings } = useSettings();
  const siteName = settings.identity.siteName || 'Contacto con la Noticia';
  const effectiveDescription = description || settings.identity.tagline || 'Periódico digital independiente.';
  const effectiveTwitterSite = twitterSite || settings.social.twitterSite || '@contactonoticia';
  const effectiveFallbackImage = settings.logos.ogFallbackImageUrl || DEFAULT_IMAGE;

  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title.includes(siteName)
      ? title
      : `${title} | ${siteName}`;
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

    const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? `${SITE_URL}${window.location.pathname}` : SITE_URL);
    const finalImage = imageUrl
      ? (imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`)
      : `${SITE_URL}${effectiveFallbackImage}`;

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', effectiveDescription);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setCanonical(currentUrl);

    // 3. Open Graph Tags
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', siteName);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', effectiveDescription);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:image', finalImage);
    setMetaTag('property', 'og:image:width', String(imageWidth));
    setMetaTag('property', 'og:image:height', String(imageHeight));
    setMetaTag('property', 'og:image:alt', imageAlt || title);
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
    setMetaTag('name', 'twitter:site', effectiveTwitterSite);
    setMetaTag('name', 'twitter:creator', twitterCreator || effectiveTwitterSite);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', effectiveDescription);
    setMetaTag('name', 'twitter:image', finalImage);
    setMetaTag('name', 'twitter:image:alt', imageAlt || title);

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
  }, [
    title,
    siteName,
    effectiveDescription,
    effectiveTwitterSite,
    effectiveFallbackImage,
    canonicalUrl,
    type,
    imageUrl,
    imageWidth,
    imageHeight,
    imageAlt,
    publishedTime,
    modifiedTime,
    section,
    authorName,
    noIndex,
    twitterCreator,
    jsonLd,
  ]);

  return null;
};
