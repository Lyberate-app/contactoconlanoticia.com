import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SeoAssistantProps {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  authorName?: string;
  publishedAt?: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  onMetaTitleChange: (val: string) => void;
  onMetaDescriptionChange: (val: string) => void;
  onCanonicalUrlChange: (val: string) => void;
}

export const SeoAssistant: React.FC<SeoAssistantProps> = ({
  title,
  slug,
  excerpt,
  content,
  featuredImageUrl,
  featuredImageAlt,
  authorName,
  publishedAt,
  metaTitle,
  metaDescription,
  canonicalUrl,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onCanonicalUrlChange,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'meta' | 'jsonld'>('preview');
  const [previewChannel, setPreviewChannel] = useState<'google' | 'twitter' | 'facebook'>('google');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const displayTitle = metaTitle.trim() || title || 'Titular de la Noticia en Contacto con la Noticia';
  const displayDesc =
    metaDescription.trim() ||
    excerpt ||
    (content.length > 150 ? content.slice(0, 150) + '...' : 'Resumen periodístico del hecho...');
  const siteUrl = 'https://contactoconlanoticia.com';
  const fullArticleUrl = canonicalUrl.trim() || `${siteUrl}/noticia/${slug || 'slug-de-la-noticia'}`;

  // SEO Score calculation based on realistic technical parameters
  let score = 0;
  const checks: { label: string; passed: boolean; tip: string }[] = [];

  // 1. Title length
  const titleLen = displayTitle.length;
  const isTitleGood = titleLen >= 30 && titleLen <= 65;
  checks.push({
    label: 'Longitud del título (30 - 65 car.)',
    passed: isTitleGood,
    tip: `Actual: ${titleLen} caracteres. Los títulos de 50-60 caracteres tienen el mejor CTR en Google.`,
  });
  if (isTitleGood) score += 20;

  // 2. Meta description length
  const descLen = displayDesc.length;
  const isDescGood = descLen >= 70 && descLen <= 160;
  checks.push({
    label: 'Metadescripción (70 - 160 car.)',
    passed: isDescGood,
    tip: `Actual: ${descLen} caracteres. Debe resumir la noticia con gancho informativo.`,
  });
  if (isDescGood) score += 20;

  // 3. Featured Image & ALT
  const hasImage = Boolean(featuredImageUrl);
  const hasAlt = Boolean(featuredImageAlt?.trim());
  checks.push({
    label: 'Imagen destacada con texto ALT accesible',
    passed: hasImage && hasAlt,
    tip: hasImage
      ? hasAlt
        ? 'Imagen y ALT optimizados.'
        : 'Agregue texto alternativo descriptivo a la fotografía.'
      : 'Se requiere imagen de portada para Google Discover y tarjetas sociales.',
  });
  if (hasImage && hasAlt) score += 20;
  else if (hasImage) score += 10;

  // 4. Keyword presence
  if (targetKeyword.trim()) {
    const kw = targetKeyword.toLowerCase().trim();
    const inTitle = displayTitle.toLowerCase().includes(kw);
    const inDesc = displayDesc.toLowerCase().includes(kw);
    const inContent = content.toLowerCase().includes(kw);
    const kwPassed = inTitle && (inDesc || inContent);
    checks.push({
      label: `Palabra clave ("${targetKeyword}") en titular y cuerpo`,
      passed: kwPassed,
      tip: kwPassed
        ? 'Palabra clave presente en zonas estratégicas.'
        : 'Incluya la palabra clave principal en el titular y el primer párrafo.',
    });
    if (kwPassed) score += 20;
  } else {
    checks.push({
      label: 'Palabra clave objetivo asignada',
      passed: false,
      tip: 'Defina la palabra clave principal de la noticia para analizar relevancia.',
    });
  }

  // 5. Slug structure
  const isSlugGood = Boolean(slug) && slug.length <= 80 && /^[a-z0-9-]+$/.test(slug);
  checks.push({
    label: 'URL amigable (Slug alfanumérico)',
    passed: isSlugGood,
    tip: isSlugGood ? 'Slug estructurado para SEO.' : 'Evite caracteres especiales en el enlace permanente.',
  });
  if (isSlugGood) score += 20;

  // NewsArticle JSON-LD Schema
  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullArticleUrl,
    },
    headline: displayTitle,
    description: displayDesc,
    image: featuredImageUrl ? [featuredImageUrl] : undefined,
    datePublished: publishedAt || new Date().toISOString(),
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: authorName || 'Redacción Contacto con la Noticia',
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'Contacto con la Noticia',
      url: 'https://contactoconlanoticia.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://contactoconlanoticia.com/logo.png',
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-stone-50/70 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-50 text-rose-800 rounded-xl">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-serif text-stone-900 uppercase tracking-wider">
              Asistente SEO & Vista Previa Social
            </h3>
            <p className="text-[11px] text-stone-500">
              Puntuación SEO técnica:{' '}
              <span className="font-bold text-stone-900 font-mono">{score}/100</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-stone-600">{score}%</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Target keyword input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <label className="text-xs font-semibold text-stone-700 whitespace-nowrap">
              Palabra Clave Objetivo (Foco SEO):
            </label>
            <input
              type="text"
              placeholder="Ej: Elecciones Guárico, San Juan de los Morros..."
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 bg-white w-full sm:max-w-xs focus:outline-none"
            />
          </div>

          {/* Tab buttons */}
          <div className="flex items-center border-b border-stone-200 gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-rose-900 text-rose-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Social Preview (Google / Redes)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meta')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'meta'
                  ? 'border-rose-900 text-rose-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Metadatos & Canónica
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jsonld')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'jsonld'
                  ? 'border-rose-900 text-rose-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              JSON-LD NewsArticle
            </button>
          </div>

          {/* Tab 1: Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewChannel('google')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    previewChannel === 'google'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Google SERP
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel('twitter')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    previewChannel === 'twitter'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Twitter / X Card
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel('facebook')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    previewChannel === 'facebook'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Facebook OpenGraph
                </button>
              </div>

              {previewChannel === 'google' && (
                <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs max-w-xl">
                  <div className="flex items-center gap-2 text-xs text-stone-600">
                    <span className="w-4 h-4 rounded-full bg-rose-900 text-white flex items-center justify-center text-[9px] font-bold">
                      C
                    </span>
                    <span className="truncate">contactoconlanoticia.com</span>
                    <span className="text-stone-400">&gt; noticia &gt; {slug || '...'}</span>
                  </div>
                  <h4 className="text-blue-800 hover:underline text-sm font-medium mt-1 cursor-pointer line-clamp-1">
                    {displayTitle}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                    {displayDesc}
                  </p>
                </div>
              )}

              {previewChannel === 'twitter' && (
                <div className="rounded-2xl border border-stone-200 overflow-hidden max-w-md bg-stone-900 text-white">
                  {featuredImageUrl ? (
                    <img
                      src={featuredImageUrl}
                      alt={featuredImageAlt || displayTitle}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-stone-800 flex items-center justify-center text-stone-500 text-xs">
                      Sin imagen destacada
                    </div>
                  )}
                  <div className="p-3">
                    <div className="text-[11px] text-stone-400 truncate">contactoconlanoticia.com</div>
                    <div className="text-xs font-bold mt-0.5 line-clamp-1">{displayTitle}</div>
                    <div className="text-[11px] text-stone-300 mt-1 line-clamp-2">{displayDesc}</div>
                  </div>
                </div>
              )}

              {previewChannel === 'facebook' && (
                <div className="rounded-xl border border-stone-200 overflow-hidden max-w-md bg-white">
                  {featuredImageUrl ? (
                    <img
                      src={featuredImageUrl}
                      alt={featuredImageAlt || displayTitle}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-stone-100 flex items-center justify-center text-stone-400 text-xs">
                      Sin imagen destacada
                    </div>
                  )}
                  <div className="p-3 bg-stone-50 border-t border-stone-100">
                    <div className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">
                      CONTACTOCONLANOTICIA.COM
                    </div>
                    <div className="text-xs font-bold text-stone-900 mt-0.5 line-clamp-1">
                      {displayTitle}
                    </div>
                    <div className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                      {displayDesc}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Meta Inputs */}
          {activeTab === 'meta' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-stone-700">Meta Title Personalizado</label>
                  <span
                    className={`font-mono text-[11px] ${
                      metaTitle.length > 65 ? 'text-rose-600' : 'text-stone-400'
                    }`}
                  >
                    {metaTitle.length} / 65 caracteres
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => onMetaTitleChange(e.target.value)}
                  placeholder="Si se deja vacío, se usa el titular del artículo"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-stone-700">Meta Description</label>
                  <span
                    className={`font-mono text-[11px] ${
                      metaDescription.length > 160 ? 'text-rose-600' : 'text-stone-400'
                    }`}
                  >
                    {metaDescription.length} / 160 caracteres
                  </span>
                </div>
                <textarea
                  value={metaDescription}
                  onChange={(e) => onMetaDescriptionChange(e.target.value)}
                  rows={3}
                  placeholder="Resumen para motores de búsqueda..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  URL Canónica (Canonical URL)
                </label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => onCanonicalUrlChange(e.target.value)}
                  placeholder="https://contactoconlanoticia.com/noticia/..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 font-mono"
                />
              </div>
            </div>
          )}

          {/* Tab 3: JSON-LD */}
          {activeTab === 'jsonld' && (
            <div className="space-y-2">
              <span className="text-xs text-stone-600 block">
                Esquema estructurado <strong>Schema.org/NewsArticle</strong> inyectado automáticamente
                en cabecera:
              </span>
              <pre className="p-3 bg-stone-900 text-stone-200 text-[11px] font-mono rounded-xl overflow-x-auto max-h-56">
                {JSON.stringify(newsArticleJsonLd, null, 2)}
              </pre>
            </div>
          )}

          {/* Diagnostic Checklist */}
          <div className="pt-4 border-t border-stone-200 space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-semibold block">
              Diagnóstico de Optimización
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {checks.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                    c.passed
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  {c.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-[11px]">{c.label}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">{c.tip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
