import React, { useEffect, useState } from 'react';
import { EditorialLayout } from '../../layouts/EditorialLayout';
import { editorialService, Category, Author } from '../../services/editorial';
import { Save, ArrowLeft, Eye, Edit3, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ArticleEditorPage: React.FC = () => {
  // Determine if editing from URL
  const pathParts = window.location.pathname.split('/');
  const isEditing = pathParts.includes('edit');
  const articleUuid = isEditing ? pathParts[pathParts.length - 1] : null;

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
  const [status, setStatus] = useState<'DRAFT' | 'PENDING_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [scheduledDate, setScheduledDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // SEO State
  const [showSeo, setShowSeo] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');

  // UI State
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
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
        setStatus(art.status as any);
        if (art.status === 'SCHEDULED' && art.published_at) {
          setScheduledDate(new Date(art.published_at).toISOString().slice(0, 16));
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

  const handleSave = async (overrideStatus?: typeof status) => {
    setMessage(null);
    setSaving(true);

    const targetStatus = overrideStatus || status;

    const payload = {
      title,
      subtitle,
      slug,
      category_uuid: categoryUuid,
      author_uuid: authorUuid,
      excerpt,
      content,
      status: targetStatus,
      published_at: targetStatus === 'SCHEDULED' ? scheduledDate : undefined,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      seo: {
        meta_title: metaTitle || title,
        meta_description: metaDescription || excerpt,
        canonical_url: canonicalUrl,
        og_title: ogTitle || title,
        og_description: ogDescription || excerpt,
      },
    };

    try {
      if (isEditing && articleUuid) {
        const res = await editorialService.updateArticle(articleUuid, payload);
        if (res.success) {
          setMessage({ type: 'success', text: 'Artículo actualizado exitosamente.' });
        } else {
          setMessage({ type: 'error', text: res.error?.message || 'Error al actualizar.' });
        }
      } else {
        const res = await editorialService.createArticle(payload);
        if (res.success) {
          setMessage({ type: 'success', text: 'Artículo redactado y guardado exitosamente.' });
          setTimeout(() => {
            window.location.href = `/admin/articles/edit/${res.data.article.article_uuid}`;
          }, 800);
        } else {
          setMessage({ type: 'error', text: res.error?.message || 'Error al crear el artículo.' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Fallo de conexión con el servidor editorial.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorialLayout activeTab={isEditing ? 'articles' : 'new'}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <a
            href="/admin/articles"
            className="p-2 border border-stone-300 rounded hover:bg-stone-50 text-stone-600 transition-colors"
            title="Volver a la mesa de redacción"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="text-xl font-serif font-bold text-stone-900">
              {isEditing ? 'Editar Noticia' : 'Redactar Nueva Noticia'}
            </h1>
            <p className="text-xs text-stone-500">
              {isEditing ? `ID: ${articleUuid}` : 'Nuevo borrador para Contacto con la Noticia'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(status)}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Guardando...' : status === 'PUBLISHED' ? 'Actualizar Noticia' : 'Guardar y Aplicar'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 p-4 border flex items-center gap-2 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Headline */}
          <div className="bg-white p-6 border border-stone-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Titular Principal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="Escriba un titular claro, directo e informativo..."
                className="w-full text-xl sm:text-2xl font-serif font-bold text-stone-900 border-b border-stone-300 focus:outline-none focus:border-stone-900 pb-2 placeholder-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Subtítulo / Bajada de Noticia
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Añada contexto complementario que refuerce el titular..."
                className="w-full text-sm text-stone-700 border-b border-stone-200 focus:outline-none focus:border-stone-800 pb-1.5 placeholder-stone-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">
                Slug Permanente: /{slug}
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full text-xs font-mono text-stone-600 border border-stone-200 px-2 py-1 bg-stone-50 focus:outline-none"
              />
            </div>
          </div>

          {/* Excerpt / Entradilla */}
          <div className="bg-white p-6 border border-stone-200 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Entradilla Editorial (Lead / Excerpt)
            </label>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Resumen del primer párrafo que responderá al qué, quién, cuándo y dónde..."
              className="w-full text-sm text-stone-800 border border-stone-300 p-3 focus:outline-none focus:border-stone-800"
            />
          </div>

          {/* Body Content & Preview Tab */}
          <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-stone-200 bg-stone-50 px-4">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`py-3 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'editor'
                    ? 'border-stone-900 text-stone-900 bg-white'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Cuerpo de Noticia</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`py-3 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'preview'
                    ? 'border-stone-900 text-stone-900 bg-white'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa Periodística</span>
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'editor' ? (
                <textarea
                  rows={14}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Redacte aquí el desarrollo completo de la noticia (soporta párrafos y formato de texto)..."
                  className="w-full text-sm font-sans leading-relaxed text-stone-900 border border-stone-300 p-4 focus:outline-none focus:border-stone-900"
                />
              ) : (
                <div className="prose prose-stone max-w-none min-h-[300px] p-4 bg-stone-50 border border-stone-200">
                  <h1 className="font-serif text-2xl font-bold text-stone-900">{title || 'Sin titular'}</h1>
                  {subtitle && <p className="text-sm font-medium text-stone-600 italic">{subtitle}</p>}
                  {excerpt && <p className="text-sm font-semibold text-stone-800 border-l-2 border-stone-400 pl-3 my-4">{excerpt}</p>}
                  <div className="whitespace-pre-wrap text-sm text-stone-800 leading-relaxed">
                    {content || 'Sin contenido aún...'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEO Accordion */}
          <div className="bg-white border border-stone-200 shadow-sm">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-50"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-stone-500" />
                <span>Metadatos SEO & Open Graph</span>
              </div>
              <span className="text-stone-400">{showSeo ? '▲' : '▼'}</span>
            </button>

            {showSeo && (
              <div className="p-6 border-t border-stone-200 space-y-4 text-xs">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Título SEO (meta_title)</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={title || 'Título optimizado para buscadores'}
                    className="w-full border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Descripción SEO (meta_description)</label>
                  <textarea
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder={excerpt || 'Descripción para resultados de búsqueda de Google'}
                    className="w-full border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">URL Canónica</label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://contactoconlanoticia.com/noticias/..."
                    className="w-full border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Taxonomy & Publishing Controls */}
        <div className="space-y-6">
          {/* Publication Box */}
          <div className="bg-white p-6 border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2">
              Estado Editorial
            </h3>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Estado de la Noticia
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
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
                  Fecha y Hora de Publicación
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

            <div className="pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave()}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold py-3 px-4 shadow-sm transition-colors"
              >
                {saving ? 'Guardando...' : status === 'PUBLISHED' ? 'Publicar Noticia' : 'Guardar Estado'}
              </button>
            </div>
          </div>

          {/* Taxonomy Box */}
          <div className="bg-white p-6 border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2">
              Taxonomía y Créditos
            </h3>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Categoría Editorial <span className="text-red-500">*</span>
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
                Autor de la Cobertura <span className="text-red-500">*</span>
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
                Etiquetas (Tags)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Economía, Elecciones, Regional (separar por comas)"
                className="w-full text-xs border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Escriba las etiquetas separadas por comas.
              </span>
            </div>
          </div>
        </div>
      </div>
    </EditorialLayout>
  );
};

