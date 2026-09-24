import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { editorialService, Category, Author, ArticleStatus } from '../../services/editorial';
import { FeaturedMedia } from '../../types/article';
import { MediaItem } from '../../types/media';
import { MediaPickerModal } from '../../components/media/MediaPickerModal';
import { EditorialToolbar } from '../../components/editorial/EditorialToolbar';
import { ArticleLivePreviewModal } from '../../components/editorial/ArticleLivePreviewModal';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import {
  Save,
  ArrowLeft,
  Eye,
  Globe,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
  Clock,
  Send,
  Calendar,
  Check,
  Sparkles,
} from 'lucide-react';

export const ArticleEditorPage: React.FC = () => {
  const { uuid, id } = useParams<{ uuid?: string; id?: string }>();
  const navigate = useNavigate();
  const articleUuid = uuid || id || null;
  const isEditing = Boolean(articleUuid);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryUuid, setCategoryUuid] = useState('');
  const [authorUuid, setAuthorUuid] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('DRAFT');
  const [scheduledDate, setScheduledDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Featured Media State
  const [featuredMedia, setFeaturedMedia] = useState<FeaturedMedia | null>(null);
  const [featuredMediaUuid, setFeaturedMediaUuid] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // SEO State
  const [showSeo, setShowSeo] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');

  // UI State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load taxonomy
    editorialService.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !categoryUuid) setCategoryUuid(cats[0].category_uuid);
    }).catch(() => {});

    editorialService.getAuthors().then((auths) => {
      setAuthors(auths);
      if (auths.length > 0 && !authorUuid) setAuthorUuid(auths[0].author_uuid);
    }).catch(() => {});

    if (isEditing && articleUuid) {
      editorialService.getArticle(articleUuid).then((art) => {
        if (!art) return;
        setTitle(art.title);
        setSubtitle(art.subtitle || '');
        setSlug(art.slug);
        setCategoryUuid(art.category_uuid);
        setAuthorUuid(art.author_uuid);
        setExcerpt(art.excerpt || '');
        setContent(art.content);
        setStatus(art.status);
        if (art.status === 'SCHEDULED' && art.published_at) {
          setScheduledDate(new Date(art.published_at).toISOString().slice(0, 16));
        }
        if (art.featured_media) {
          setFeaturedMedia(art.featured_media);
          setFeaturedMediaUuid(art.featured_media_uuid || art.featured_media.media_uuid || null);
        }
        if (art.tags) {
          setTagsInput(art.tags.map((t) => t.name).join(', '));
        }
        if (art.seo) {
          setMetaTitle(art.seo.meta_title || '');
          setMetaDescription(art.seo.meta_description || '');
          setCanonicalUrl(art.seo.canonical_url || '');
          setOgTitle(art.seo.og_title || '');
          setOgDescription(art.seo.og_description || '');
        }
      }).catch(() => {});
    }
  }, [articleUuid, isEditing]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEditing || !slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleMediaSelected = (media: MediaItem) => {
    setFeaturedMediaUuid(media.media_uuid);
    setFeaturedMedia({
      media_uuid: media.media_uuid,
      url: media.url,
      alt_text: media.alt_text || media.title || title,
      caption: media.caption || null,
      credit: media.credit || 'Contacto con la Noticia',
      width: media.width,
      height: media.height,
    });
  };

  const handleRemoveMedia = () => {
    setFeaturedMedia(null);
    setFeaturedMediaUuid(null);
  };

  const handleSave = async (overrideStatus?: ArticleStatus) => {
    setMessage(null);
    setSaving(true);

    const targetStatus = overrideStatus || status;

    const payload = {
      title,
      subtitle: subtitle || null,
      slug,
      category_uuid: categoryUuid,
      author_uuid: authorUuid,
      excerpt: excerpt || null,
      content,
      status: targetStatus,
      published_at:
        targetStatus === 'SCHEDULED' && scheduledDate
          ? new Date(scheduledDate).toISOString()
          : targetStatus === 'PUBLISHED'
          ? new Date().toISOString()
          : null,
      featured_media_uuid: featuredMediaUuid,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      seo: {
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        canonical_url: canonicalUrl || null,
        og_title: ogTitle || metaTitle || title || null,
        og_description: ogDescription || metaDescription || excerpt || null,
      },
    };

    try {
      if (isEditing && articleUuid) {
        await editorialService.updateArticle(articleUuid, payload);
        setStatus(targetStatus);
        setMessage({ type: 'success', text: 'Artículo actualizado exitosamente en el sistema.' });
      } else {
        const res = await editorialService.createArticle(payload);
        if (res.success && res.data?.article) {
          setMessage({ type: 'success', text: 'Noticia creada y guardada con éxito.' });
          navigate(`/admin/articles/edit/${res.data.article.article_uuid}`, { replace: true });
        } else {
          setMessage({ type: 'error', text: res.error?.message || 'Error al guardar la noticia.' });
        }
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Error al guardar la noticia. Verifique los campos requeridos.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Content word metrics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const currentCategory = categories.find((c) => c.category_uuid === categoryUuid);
  const currentAuthor = authors.find((a) => a.author_uuid === authorUuid);

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      {/* Top Header Glass Card */}
      <div className="glass-card rounded-[28px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-white/60 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/articles"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-stone-100/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-all active:scale-90 shadow-xs"
            title="Volver a la lista de artículos"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 mb-1 border border-black/5 dark:border-white/5">
              <Sparkles className="w-3 h-3 text-rose-500" />
              <span>Editor Liquid Glass &bull; Estado: {status}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-stone-900 dark:text-white">
              {isEditing ? 'Editar Noticia' : 'Redactar Nueva Noticia'}
            </h1>
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          {/* Live Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-stone-200/80 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-white active:scale-95 transition-all shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            <span>Vista Previa</span>
          </button>

          {/* Quick Draft Save */}
          {status !== 'PUBLISHED' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('DRAFT')}
              className="px-4 py-2.5 rounded-full border border-stone-200/80 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-white active:scale-95 transition-all shadow-xs"
            >
              Guardar Borrador
            </button>
          )}

          {/* Main Save / Publish Action */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(status)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-lg shadow-black/10 active:scale-95 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Guardando...' : status === 'PUBLISHED' ? 'Actualizar Noticia' : 'Guardar Noticia'}</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-[20px] border flex items-center gap-2.5 text-xs font-medium backdrop-blur-md ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Editorial Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Headlines Card */}
          <div className="glass-card rounded-[28px] p-6 space-y-4 border border-white/60 dark:border-white/10 shadow-sm">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                Titular Principal de la Noticia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="Escriba un titular periodístico claro, contundente y verificable..."
                className="w-full text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white border-b border-black/10 dark:border-white/10 focus:outline-none focus:border-rose-600 pb-2 placeholder-stone-300 dark:placeholder-stone-600 bg-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                Subtítulo / Bajada Informativa
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Aporte datos contextuales esenciales que complementen el titular..."
                className="w-full text-sm text-stone-700 dark:text-stone-300 border-b border-black/10 dark:border-white/10 focus:outline-none focus:border-rose-600 pb-2 placeholder-stone-400 font-serif italic bg-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">
                Ruta / Slug Permanente: /{slug}
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full text-xs font-mono text-stone-600 dark:text-stone-300 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 bg-stone-50/50 dark:bg-stone-800/50 focus:outline-none focus:bg-white dark:focus:bg-stone-900 focus:border-stone-800 transition-colors"
              />
            </div>
          </div>

          {/* Featured Image Card */}
          <div className="glass-card rounded-[28px] p-6 space-y-4 border border-white/60 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-stone-500" />
                <span>Fotografía de Portada (Featured Image)</span>
              </h2>
              {featuredMedia && (
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar foto</span>
                </button>
              )}
            </div>

            {featuredMedia ? (
              <div className="space-y-4">
                <div className="aspect-[16/9] w-full bg-stone-100 dark:bg-stone-800 rounded-[22px] overflow-hidden relative group shadow-inner">
                  <OptimizedImage
                    src={featuredMedia.url}
                    alt={featuredMedia.alt_text || title}
                    aspectRatio="16/9"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-4 py-2 bg-white text-stone-900 text-xs font-bold rounded-full shadow-lg active:scale-95 transition-all"
                    >
                      Cambiar Fotografía
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-500 dark:text-stone-400 text-[11px] font-semibold mb-1">
                      Pie de Foto (Epígrafe)
                    </label>
                    <input
                      type="text"
                      value={featuredMedia.caption || ''}
                      onChange={(e) =>
                        setFeaturedMedia({ ...featuredMedia, caption: e.target.value })
                      }
                      placeholder="Leyenda descriptiva..."
                      className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/50 dark:bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 dark:text-stone-400 text-[11px] font-semibold mb-1">
                      Créditos / Fuente Fotográfica
                    </label>
                    <input
                      type="text"
                      value={featuredMedia.credit || ''}
                      onChange={(e) =>
                        setFeaturedMedia({ ...featuredMedia, credit: e.target.value })
                      }
                      placeholder="Ej: Archivo Prensa / Fotógrafo"
                      className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/50 dark:bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-stone-800"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-[22px] p-8 text-center flex flex-col items-center justify-center gap-3 bg-stone-50/40 dark:bg-stone-800/20 hover:bg-stone-100/40 transition-colors">
                <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    No hay imagen de portada asignada
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Seleccione una fotografía para la cabecera y visualización social
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm"
                >
                  Seleccionar de la Biblioteca Multimedia
                </button>
              </div>
            )}
          </div>

          {/* Lead / Entradilla */}
          <div className="glass-card rounded-[28px] p-6 border border-white/60 dark:border-white/10 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
              Entradilla Editorial (Lead / Primer Párrafo)
            </label>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Síntesis que responde a las preguntas fundamentales del hecho noticioso (qué, quién, cuándo, dónde y por qué)..."
              className="w-full text-sm text-stone-800 dark:text-stone-200 border border-black/10 dark:border-white/10 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-stone-800 leading-relaxed font-sans bg-white/50 dark:bg-stone-800/50"
            />
          </div>

          {/* Body Content with Toolbar */}
          <div className="glass-card rounded-[28px] border border-white/60 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-stone-800/40 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Cuerpo del Artículo
              </span>
              <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {wordCount} palabras &bull; ~{readingTimeMinutes} min de lectura
              </span>
            </div>

            {/* Editorial Formatting Toolbar */}
            <EditorialToolbar textareaRef={textareaRef} onContentChange={setContent} />

            <div className="p-4 sm:p-6 bg-white/30 dark:bg-stone-900/30">
              <textarea
                ref={textareaRef}
                rows={16}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Desarrollo completo de la cobertura periodística..."
                className="w-full text-base font-sans leading-relaxed text-stone-900 dark:text-stone-100 border border-black/10 dark:border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-stone-800 bg-white/70 dark:bg-stone-900/70"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                <span>Soporta formato Markdown estructurado</span>
                <span>{content.length} caracteres</span>
              </div>
            </div>
          </div>

          {/* SEO Accordion & Google SERP Simulator */}
          <div className="glass-card rounded-[28px] border border-white/60 dark:border-white/10 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="w-full p-5 text-left flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-stone-500" />
                <span>Optimización para Buscadores (SEO) y Redes Sociales</span>
              </div>
              <span className="text-stone-400 font-bold">{showSeo ? '▲' : '▼'}</span>
            </button>

            {showSeo && (
              <div className="p-6 border-t border-black/5 dark:border-white/5 space-y-6 text-xs">
                {/* Google SERP Snippet Preview in squircle card */}
                <div className="glass-panel rounded-2xl p-4 space-y-1 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Simulación de Resultado en Google (SERP Preview)
                  </span>
                  <div className="pt-1">
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-mono truncate">
                      https://contactoconlanoticia.com/noticias/{slug || 'titular-noticia'}
                    </p>
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
                      {metaTitle || title || 'Titular de la Noticia | Contacto con la Noticia'}
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-0.5 leading-snug">
                      {metaDescription || excerpt || 'Descripción del artículo periodístico tal y como aparecerá indexado en motores de búsqueda...'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400 font-semibold mb-1">
                      <span>Título SEO (meta_title)</span>
                      <span className={`${(metaTitle || title).length > 60 ? 'text-amber-600 font-bold' : 'text-stone-400'}`}>
                        {(metaTitle || title).length} / 60 caracteres
                      </span>
                    </div>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder={title || 'Título optimizado para motores de búsqueda'}
                      className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/50 dark:bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-stone-800"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400 font-semibold mb-1">
                      <span>Descripción SEO (meta_description)</span>
                      <span className={`${(metaDescription || excerpt).length > 160 ? 'text-amber-600 font-bold' : 'text-stone-400'}`}>
                        {(metaDescription || excerpt).length} / 160 caracteres
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder={excerpt || 'Resumen específico para motores de búsqueda y redes sociales'}
                      className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/50 dark:bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-stone-800"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">URL Canónica (Opcional)</label>
                    <input
                      type="url"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="https://contactoconlanoticia.com/noticias/..."
                      className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/50 dark:bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-stone-800"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workflow, Taxonomy & Publishing */}
        <div className="space-y-6">
          {/* Publication Workflow Card */}
          <div className="glass-card rounded-[28px] p-6 space-y-4 border border-white/60 dark:border-white/10 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 border-b border-black/5 dark:border-white/5 pb-2">
              Flujo de Publicación
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Estado Actual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="w-full text-xs font-semibold border border-black/10 dark:border-white/10 rounded-xl bg-white/70 dark:bg-stone-800/70 p-3 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-800"
              >
                <option value="DRAFT">Borrador (DRAFT)</option>
                <option value="PENDING_REVIEW">En Revisión (PENDING_REVIEW)</option>
                <option value="SCHEDULED">Programado (SCHEDULED)</option>
                <option value="PUBLISHED">Publicado (PUBLISHED)</option>
                <option value="ARCHIVED">Archivado (ARCHIVED)</option>
              </select>
            </div>

            {status === 'SCHEDULED' && (
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  Fecha y Hora Programada
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-900 dark:text-white bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>
            )}

            {/* Quick Workflow Action Buttons */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave('PUBLISHED')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{status === 'PUBLISHED' ? 'Guardar Cambios Publicados' : 'Publicar Inmediatamente'}</span>
              </button>

              {status !== 'PENDING_REVIEW' && status !== 'PUBLISHED' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('PENDING_REVIEW')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-3 px-4 rounded-full shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar a Revisión Editorial</span>
                </button>
              )}

              {status !== 'SCHEDULED' && status !== 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => {
                    setStatus('SCHEDULED');
                    if (!scheduledDate) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(9, 0, 0, 0);
                      setScheduledDate(tomorrow.toISOString().slice(0, 16));
                    }
                  }}
                  className="w-full border border-stone-200/80 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 text-xs font-semibold py-2.5 px-4 rounded-full hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>Programar Publicación</span>
                </button>
              )}
            </div>
          </div>

          {/* Taxonomy & Credits Card */}
          <div className="glass-card rounded-[28px] p-6 space-y-4 border border-white/60 dark:border-white/10 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 border-b border-black/5 dark:border-white/5 pb-2">
              Taxonomía y Créditos
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Sección Editorial <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={categoryUuid}
                onChange={(e) => setCategoryUuid(e.target.value)}
                className="w-full text-xs font-semibold border border-black/10 dark:border-white/10 rounded-xl bg-white/70 dark:bg-stone-800/70 p-3 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-800"
              >
                {categories.map((c) => (
                  <option key={c.category_uuid} value={c.category_uuid}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Periodista / Autor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={authorUuid}
                onChange={(e) => setAuthorUuid(e.target.value)}
                className="w-full text-xs font-semibold border border-black/10 dark:border-white/10 rounded-xl bg-white/70 dark:bg-stone-800/70 p-3 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-800"
              >
                {authors.map((a) => (
                  <option key={a.author_uuid} value={a.author_uuid}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Etiquetas Temáticas (Tags)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Vialidad, Producción, Comunidades..."
                className="w-full text-xs border border-black/10 dark:border-white/10 rounded-xl p-3 text-stone-800 dark:text-stone-200 bg-white/50 dark:bg-stone-800/50 focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Escriba las etiquetas separadas por comas.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Mobile Action Dock (iOS 27 Liquid Glass style) */}
      <div className="sm:hidden fixed bottom-5 left-4 right-4 z-40 glass-dock p-2.5 rounded-full flex items-center justify-between gap-2 shadow-2xl border border-white/50 dark:border-white/10">
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="flex-1 py-2 px-3 rounded-full bg-white/60 dark:bg-stone-800/60 text-stone-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Vista Previa</span>
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave(status)}
          className="flex-1 py-2 px-3 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-md"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Guardando...' : status === 'PUBLISHED' ? 'Actualizar' : 'Guardar'}</span>
        </button>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelected}
        selectedMediaUuid={featuredMediaUuid}
      />

      {/* Live Preview Modal */}
      <ArticleLivePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={{
          title,
          subtitle,
          excerpt,
          content,
          categoryName: currentCategory?.name || 'Regionales',
          authorName: currentAuthor?.name || 'Redacción Central',
          publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : scheduledDate || null,
          imageUrl: featuredMedia?.url,
          imageAlt: featuredMedia?.alt_text,
          imageCaption: featuredMedia?.caption,
          imageCredit: featuredMedia?.credit,
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        }}
      />
    </div>
  );
};
