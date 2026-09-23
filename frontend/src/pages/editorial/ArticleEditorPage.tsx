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
      published_at: targetStatus === 'SCHEDULED' ? scheduledDate : targetStatus === 'PUBLISHED' ? new Date().toISOString() : undefined,
      featured_media_uuid: featuredMediaUuid,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      seo: {
        meta_title: metaTitle || title,
        meta_description: metaDescription || excerpt,
        canonical_url: canonicalUrl || null,
        og_title: ogTitle || title,
        og_description: ogDescription || excerpt,
        og_image_media_uuid: featuredMediaUuid,
      },
    };

    try {
      if (isEditing && articleUuid) {
        const res = await editorialService.updateArticle(articleUuid, payload);
        if (res.success) {
          setStatus(targetStatus);
          setMessage({ type: 'success', text: 'Artículo actualizado exitosamente en el sistema editorial.' });
        } else {
          setMessage({ type: 'error', text: res.error?.message || 'Error al actualizar el artículo.' });
        }
      } else {
        const res = await editorialService.createArticle(payload);
        if (res.success && res.data?.article) {
          setMessage({ type: 'success', text: 'Artículo creado y registrado exitosamente.' });
          const createdUuid = res.data.article.article_uuid;
          setTimeout(() => {
            navigate(`/admin/articles/edit/${createdUuid}`);
          }, 800);
        } else {
          setMessage({ type: 'error', text: res.error?.message || 'Error al crear el artículo.' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Fallo de conexión con el servicio editorial.' });
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-200 gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/articles"
            className="p-2 border border-stone-300 rounded hover:bg-stone-50 text-stone-600 transition-colors"
            title="Volver a la lista de artículos"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-serif font-bold text-stone-900">
              {isEditing ? 'Editar Noticia' : 'Redactar Nueva Noticia'}
            </h1>
            <p className="text-xs text-stone-500">
              {isEditing ? `UUID: ${articleUuid} &bull; Estado: ${status}` : 'Borrador para Contacto con la Noticia'}
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-sm"
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
              className="px-3 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 transition-colors"
            >
              Guardar Borrador
            </button>
          )}

          {/* Main Save / Publish Action */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(status)}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Guardando...' : status === 'PUBLISHED' ? 'Actualizar Noticia' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 border flex items-center gap-2.5 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Editorial Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Headlines Card */}
          <div className="bg-white p-6 border border-stone-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Titular Principal de la Noticia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="Escriba un titular periodístico claro, contundente y verificable..."
                className="w-full text-xl sm:text-2xl font-serif font-bold text-stone-900 border-b border-stone-300 focus:outline-none focus:border-stone-900 pb-2 placeholder-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Subtítulo / Bajada Informativa
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Aporte datos contextuales esenciales que complementen el titular..."
                className="w-full text-sm text-stone-700 border-b border-stone-200 focus:outline-none focus:border-stone-800 pb-1.5 placeholder-stone-400 font-serif italic"
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
                className="w-full text-xs font-mono text-stone-600 border border-stone-200 px-2.5 py-1.5 bg-stone-50 focus:outline-none focus:bg-white focus:border-stone-800"
              />
            </div>
          </div>

          {/* Featured Image Card */}
          <div className="bg-white p-6 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-stone-500" />
                <span>Fotografía de Portada (Featured Image)</span>
              </h2>
              {featuredMedia && (
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="text-[11px] text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar foto</span>
                </button>
              )}
            </div>

            {featuredMedia ? (
              <div className="space-y-3">
                <div className="aspect-[16/9] w-full bg-stone-100 border border-stone-200 overflow-hidden relative group">
                  <OptimizedImage
                    src={featuredMedia.url}
                    alt={featuredMedia.alt_text || title}
                    aspectRatio="16/9"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-3 py-1.5 bg-white text-stone-900 text-xs font-semibold rounded shadow"
                    >
                      Cambiar Fotografía
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-500 text-[11px] font-medium mb-1">
                      Pie de Foto (Epígrafe de la Noticia)
                    </label>
                    <input
                      type="text"
                      value={featuredMedia.caption || ''}
                      onChange={(e) =>
                        setFeaturedMedia({ ...featuredMedia, caption: e.target.value })
                      }
                      placeholder="Leyenda descriptiva para la publicación..."
                      className="w-full border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 text-[11px] font-medium mb-1">
                      Créditos / Fuente Fotográfica
                    </label>
                    <input
                      type="text"
                      value={featuredMedia.credit || ''}
                      onChange={(e) =>
                        setFeaturedMedia({ ...featuredMedia, credit: e.target.value })
                      }
                      placeholder="Ej: Archivo Prensa / Juan Pérez"
                      className="w-full border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-300 p-8 text-center flex flex-col items-center justify-center gap-3 bg-stone-50 hover:bg-stone-100/50 transition-colors">
                <ImageIcon className="w-8 h-8 text-stone-400" />
                <div>
                  <p className="text-xs font-semibold text-stone-700">
                    No hay imagen de portada asignada a esta noticia
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Seleccione una fotografía periodística para la cabecera y redes sociales
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Seleccionar de la Biblioteca Multimedia
                </button>
              </div>
            )}
          </div>

          {/* Lead / Entradilla */}
          <div className="bg-white p-6 border border-stone-200 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Entradilla Editorial (Lead / Primer Párrafo)
            </label>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Síntesis que responde a las preguntas fundamentales del hecho noticioso (qué, quién, cuándo, dónde y por qué)..."
              className="w-full text-sm text-stone-800 border border-stone-300 p-3 focus:outline-none focus:border-stone-900 leading-relaxed font-sans"
            />
          </div>

          {/* Body Content with Toolbar */}
          <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Cuerpo del Artículo
              </span>
              <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {wordCount} palabras &bull; ~{readingTimeMinutes} min de lectura
              </span>
            </div>

            {/* Editorial Formatting Toolbar */}
            <EditorialToolbar textareaRef={textareaRef} onContentChange={setContent} />

            <div className="p-4 sm:p-6">
              <textarea
                ref={textareaRef}
                rows={16}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Desarrollo completo de la cobertura periodística. Utilice la barra superior para agregar títulos de sección, citas textuales, viñetas y enlaces..."
                className="w-full text-base font-sans leading-relaxed text-stone-900 border border-stone-300 p-4 focus:outline-none focus:border-stone-900"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                <span>Soporta sintaxis Markdown para párrafos y estructura periodística.</span>
                <span>{content.length} caracteres</span>
              </div>
            </div>
          </div>

          {/* SEO Accordion & Google SERP Simulator */}
          <div className="bg-white border border-stone-200 shadow-sm">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-50"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-stone-500" />
                <span>Optimización para Buscadores (SEO) y Redes Sociales</span>
              </div>
              <span className="text-stone-400">{showSeo ? '▲' : '▼'}</span>
            </button>

            {showSeo && (
              <div className="p-6 border-t border-stone-200 space-y-6 text-xs">
                {/* Google SERP Snippet Preview */}
                <div className="bg-stone-50 border border-stone-200 p-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Simulación de Resultado en Google (SERP Preview)
                  </span>
                  <div className="pt-1">
                    <p className="text-xs text-stone-600 font-mono truncate">
                      https://contactoconlanoticia.com/noticias/{slug || 'titular-noticia'}
                    </p>
                    <h4 className="text-sm font-medium text-blue-800 hover:underline cursor-pointer truncate">
                      {metaTitle || title || 'Titular de la Noticia | Contacto con la Noticia'}
                    </h4>
                    <p className="text-xs text-stone-600 line-clamp-2 mt-0.5 leading-snug">
                      {metaDescription || excerpt || 'Descripción del artículo periodístico tal y como aparecerá indexado en los resultados de motores de búsqueda...'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-stone-600 font-medium mb-1">
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
                      className="w-full border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-stone-600 font-medium mb-1">
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
                      className="w-full border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-medium mb-1">URL Canónica (Opcional)</label>
                    <input
                      type="url"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="https://contactoconlanoticia.com/noticias/..."
                      className="w-full border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
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
          <div className="bg-white p-6 border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2">
              Flujo de Publicación
            </h3>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Estado Actual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="w-full text-xs font-medium border border-stone-300 bg-white p-2.5 text-stone-900 focus:outline-none focus:border-stone-900"
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
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Fecha y Hora Programada
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-800"
                />
              </div>
            )}

            {/* Quick Workflow Action Buttons */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave('PUBLISHED')}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 px-4 shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{status === 'PUBLISHED' ? 'Guardar Cambios Publicados' : 'Publicar Inmediatamente'}</span>
              </button>

              {status !== 'PENDING_REVIEW' && status !== 'PUBLISHED' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('PENDING_REVIEW')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2.5 px-4 shadow-sm transition-colors flex items-center justify-center gap-1.5"
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
                  className="w-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium py-2 px-4 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>Programar Publicación</span>
                </button>
              )}
            </div>
          </div>

          {/* Taxonomy & Credits Card */}
          <div className="bg-white p-6 border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2">
              Taxonomía y Créditos
            </h3>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Sección Editorial <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={categoryUuid}
                onChange={(e) => setCategoryUuid(e.target.value)}
                className="w-full text-xs border border-stone-300 bg-white p-2.5 text-stone-900 focus:outline-none focus:border-stone-900"
              >
                {categories.map((c) => (
                  <option key={c.category_uuid} value={c.category_uuid}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Periodista / Autor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={authorUuid}
                onChange={(e) => setAuthorUuid(e.target.value)}
                className="w-full text-xs border border-stone-300 bg-white p-2.5 text-stone-900 focus:outline-none focus:border-stone-900"
              >
                {authors.map((a) => (
                  <option key={a.author_uuid} value={a.author_uuid}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Etiquetas Temáticas (Tags)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Vialidad, Producción, Comunidades (separar por comas)"
                className="w-full text-xs border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Escriba las etiquetas separadas por comas.
              </span>
            </div>
          </div>
        </div>
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
