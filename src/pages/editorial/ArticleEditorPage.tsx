import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { editorialService, Category, Author, ArticleStatus } from '../../services/editorial';
import { authService, AuthUser } from '../../services/auth';
import { FeaturedMedia } from '../../types/article';
import { MediaItem } from '../../types/media';
import { ArticleVersionSnapshot } from '../../types/version';
import { MediaPickerModal } from '../../components/media/MediaPickerModal';
import { EditorialToolbar } from '../../components/editorial/EditorialToolbar';
import { VisualArticleEditor } from '../../components/editorial/VisualArticleEditor';
import { StoryTemplatePicker, StoryTemplate } from '../../components/editorial/StoryTemplatePicker';
import { EditorialWritingAssistant } from '../../components/editorial/EditorialWritingAssistant';
import { ArticleLivePreviewModal } from '../../components/editorial/ArticleLivePreviewModal';
import { AutosaveIndicator, AutosaveStatus } from '../../components/editorial/AutosaveIndicator';
import { VersionHistoryModal } from '../../components/editorial/VersionHistoryModal';
import { PrePublishChecklistModal } from '../../components/editorial/PrePublishChecklistModal';
import { SeoAssistant } from '../../components/editorial/SeoAssistant';
import { GalleryManagerModal } from '../../components/editorial/GalleryManagerModal';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import { renderArticleMarkdown, renderInlineContent } from '../../utils/markdownRenderer';
import { mediaService } from '../../services/mediaApi';
import { notify } from '../../utils/notice';
import {
  ArrowLeft,
  Eye,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
  Clock,
  Send,
  Calendar,
  Check,
  UploadCloud,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export const ArticleEditorPage: React.FC = () => {
  const { uuid, id } = useParams<{ uuid?: string; id?: string }>();
  const navigate = useNavigate();
  const articleUuid = uuid || id || null;
  const isEditing = Boolean(articleUuid);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const visualInsertRef = useRef<((markdown: string) => void) | null>(null);

  // User and Taxonomy State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
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
  const [editorialNote, setEditorialNote] = useState<string | null>(null);

  // Featured Media State
  const [featuredMedia, setFeaturedMedia] = useState<FeaturedMedia | null>(null);
  const [featuredMediaUuid, setFeaturedMediaUuid] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // SEO State
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  // Autosave and Versions State
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [versions, setVersions] = useState<ArticleVersionSnapshot[]>([]);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [recoveredDraftAvailable, setRecoveredDraftAvailable] = useState(false);

  // Pre-publish Checklist State
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  // Gallery Manager Modal State
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // UI State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isInlineMediaPickerOpen, setIsInlineMediaPickerOpen] = useState(false);
  const [editorViewMode, setEditorViewMode] = useState<'write' | 'split' | 'source' | 'preview'>('split');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Timer reference for autosave debounce
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Current User & Taxonomies
  useEffect(() => {
    authService.getMe().then((res) => {
      if (res.success && res.data?.user) {
        setCurrentUser(res.data.user);
      }
    }).catch(() => {});

    editorialService.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !categoryUuid) setCategoryUuid(cats[0].category_uuid);
    }).catch(() => {});

    editorialService.getAuthors().then((auths) => {
      setAuthors(auths);
      if (auths.length > 0 && !authorUuid) setAuthorUuid(auths[0].author_uuid);
    }).catch(() => {});
  }, []);

  // 2. Load Article and Version History if editing
  useEffect(() => {
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
        }

        // Check if a more recent local draft exists
        const draftKey = `lyberate_draft_${articleUuid}`;
        const storedDraft = localStorage.getItem(draftKey);
        if (storedDraft) {
          try {
            const parsed = JSON.parse(storedDraft);
            if (new Date(parsed.savedAt).getTime() > new Date(art.updated_at || art.created_at).getTime()) {
              setRecoveredDraftAvailable(true);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }).catch(() => {});

      // Load Version Snapshots
      editorialService.getArticleVersions(articleUuid).then((v) => {
        setVersions(v);
      }).catch(() => {});
    }
  }, [articleUuid, isEditing]);

  // 3. Autosave Execution Routine
  const performAutosave = useCallback(async () => {
    if (!title.trim() && !content.trim()) return;

    setAutosaveStatus('saving');
    try {
      const draftKey = `lyberate_draft_${articleUuid || 'new'}`;
      const draftPayload = {
        title,
        subtitle,
        slug,
        categoryUuid,
        authorUuid,
        excerpt,
        content,
        status,
        featuredMedia,
        featuredMediaUuid,
        tagsInput,
        metaTitle,
        metaDescription,
        canonicalUrl,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(draftKey, JSON.stringify(draftPayload));

      // Also create an in-memory version snapshot if editing
      if (articleUuid) {
        const snapshot: ArticleVersionSnapshot = {
          version_id: `ver_${Date.now()}`,
          article_uuid: articleUuid,
          timestamp: new Date().toISOString(),
          author_uuid: authorUuid || currentUser?.user_uuid || 'usr_carlos_1',
          author_name: currentUser?.name || 'Carlos Mendoza',
          title,
          subtitle,
          slug,
          excerpt,
          content,
          word_count: content.trim() ? content.trim().split(/\s+/).length : 0,
          status,
          summary_note: 'Guardado automático de borrador',
          is_autosave: true,
        };
        await editorialService.saveArticleVersion(snapshot);
        const updatedVersions = await editorialService.getArticleVersions(articleUuid);
        setVersions(updatedVersions);
      }

      setAutosaveStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setAutosaveStatus('error');
    }
  }, [
    title,
    subtitle,
    slug,
    categoryUuid,
    authorUuid,
    excerpt,
    content,
    status,
    featuredMedia,
    featuredMediaUuid,
    tagsInput,
    metaTitle,
    metaDescription,
    canonicalUrl,
    articleUuid,
    currentUser,
  ]);

  // Trigger autosave timer when content changes
  const handleContentChangeWithAutosave = (newContent: string) => {
    setContent(newContent);
    setAutosaveStatus('unsaved');

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      performAutosave();
    }, 15000); // 15s debounce
  };

  const handleApplyStoryTemplate = (template: StoryTemplate) => {
    if (
      content.trim() &&
      !window.confirm(`¿Reemplazar el cuerpo actual por la plantilla "${template.name}"? Esta acción no se puede deshacer.`)
    ) {
      return;
    }
    handleContentChangeWithAutosave(template.content);
    setEditorViewMode('write');
  };

  // Restore recovered local draft
  const handleRecoverDraft = () => {
    const draftKey = `lyberate_draft_${articleUuid || 'new'}`;
    const stored = localStorage.getItem(draftKey);
    if (!stored) return;

    try {
      const d = JSON.parse(stored);
      if (d.title) setTitle(d.title);
      if (d.subtitle) setSubtitle(d.subtitle);
      if (d.slug) setSlug(d.slug);
      if (d.content) setContent(d.content);
      if (d.excerpt) setExcerpt(d.excerpt);
      if (d.featuredMedia) setFeaturedMedia(d.featuredMedia);
      if (d.featuredMediaUuid) setFeaturedMediaUuid(d.featuredMediaUuid);
      if (d.tagsInput) setTagsInput(d.tagsInput);
      if (d.metaTitle) setMetaTitle(d.metaTitle);
      if (d.metaDescription) setMetaDescription(d.metaDescription);
      setAutosaveStatus('recovered');
      setRecoveredDraftAvailable(false);
      setMessage({ type: 'success', text: 'Borrador local recuperado con éxito.' });
    } catch {
      notify('Error al leer el borrador recuperado.', 'error', 'Borrador no disponible');
    }
  };

  // Restore a historical version snapshot
  const handleRestoreVersion = (ver: ArticleVersionSnapshot) => {
    setTitle(ver.title);
    if (ver.subtitle !== undefined) setSubtitle(ver.subtitle || '');
    setSlug(ver.slug || '');
    setContent(ver.content);
    if (ver.excerpt !== undefined) setExcerpt(ver.excerpt || '');
    setStatus(ver.status);
    setMessage({
      type: 'success',
      text: `Versión del ${new Date(ver.timestamp).toLocaleString()} restaurada en el editor.`,
    });
    setAutosaveStatus('unsaved');
  };

  const uploadInlineImage = async (file: File, caption: string) => {
    const result = await mediaService.uploadMedia({
      file,
      title: caption,
      alt_text: caption,
      caption,
      credit: 'Contacto con la Noticia',
    });
    if (!result.success || !result.data?.media) {
      throw new Error(result.error?.message || 'No se pudo guardar la imagen en la biblioteca.');
    }
    return result.data.media;
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        setCompressingImage(true);
        try {
          const caption = prompt('Pie de foto informativo para la imagen pegada:', 'Fotografía de la cobertura periodística') || 'Fotografía editorial';
          const media = await uploadInlineImage(file, caption);
          const imageMarkdown = `\n\n![${media.alt_text || caption}](${media.url})\n*${caption}*\n\n`;

          const textarea = textareaRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const updated = content.substring(0, start) + imageMarkdown + content.substring(end);
            handleContentChangeWithAutosave(updated);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
            }, 20);
          } else if (visualInsertRef.current) {
            visualInsertRef.current(imageMarkdown);
          } else {
            handleContentChangeWithAutosave(content + imageMarkdown);
          }
        } catch (err) {
          console.error('Error al procesar imagen pegada:', err);
          setMessage({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo insertar la imagen.' });
        } finally {
          setCompressingImage(false);
        }
        break;
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      const file = files[0];
      setCompressingImage(true);
      try {
        const caption = prompt('Pie de foto opcional:', file.name.replace(/\.[^/.]+$/, '')) || 'Fotografía periodística';
        const media = await uploadInlineImage(file, caption);
        const imageMarkdown = `\n\n![${media.alt_text || caption}](${media.url})\n*${caption}*\n\n`;
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          handleContentChangeWithAutosave(content.slice(0, start) + imageMarkdown + content.slice(end));
        } else if (visualInsertRef.current) {
          visualInsertRef.current(imageMarkdown);
        } else {
          handleContentChangeWithAutosave(content + imageMarkdown);
        }
      } catch (err) {
        console.error('Error al procesar imagen arrastrada:', err);
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo insertar la imagen.' });
      } finally {
        setCompressingImage(false);
      }
    }
  };

  const handleInlineMediaSelected = (media: MediaItem) => {
    const caption = media.caption || media.title || 'Fotografía editorial';
    const imageMarkdown = `\n\n![${caption}](${media.url})\n*${caption}${media.credit ? ` • Foto: ${media.credit}` : ''}*\n\n`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      handleContentChangeWithAutosave(content.slice(0, start) + imageMarkdown + content.slice(end));
      window.setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
      }, 0);
    } else if (visualInsertRef.current) {
      visualInsertRef.current(imageMarkdown);
    } else {
      handleContentChangeWithAutosave(content + imageMarkdown);
    }
    setIsInlineMediaPickerOpen(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setAutosaveStatus('unsaved');
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
    setAutosaveStatus('unsaved');
  };

  const handleRemoveMedia = () => {
    setFeaturedMedia(null);
    setFeaturedMediaUuid(null);
    setAutosaveStatus('unsaved');
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
        og_title: metaTitle || title || null,
        og_description: metaDescription || excerpt || null,
      },
    };

    try {
      if (isEditing && articleUuid) {
        await editorialService.updateArticle(articleUuid, payload);
        setStatus(targetStatus);

        // Save manual version snapshot
        const snapshot: ArticleVersionSnapshot = {
          version_id: `ver_${Date.now()}`,
          article_uuid: articleUuid,
          timestamp: new Date().toISOString(),
          author_uuid: authorUuid || currentUser?.user_uuid || 'usr_carlos_1',
          author_name: currentUser?.name || 'Carlos Mendoza',
          title,
          subtitle,
          slug,
          excerpt,
          content,
          word_count: content.trim() ? content.trim().split(/\s+/).length : 0,
          status: targetStatus,
          summary_note: targetStatus === 'PUBLISHED' ? 'Publicación oficial' : 'Guardado manual',
          is_autosave: false,
        };
        await editorialService.saveArticleVersion(snapshot);
        const updatedVersions = await editorialService.getArticleVersions(articleUuid);
        setVersions(updatedVersions);

        setAutosaveStatus('saved');
        setLastSavedAt(new Date());
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
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar la noticia. Verifique los campos requeridos.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Return to journalist for corrections
  const handleReturnForCorrection = async (note: string) => {
    if (!articleUuid) return;
    try {
      await editorialService.returnArticleForCorrection(articleUuid, note);
      setStatus('DRAFT');
      setEditorialNote(note);
      setMessage({
        type: 'success',
        text: 'Artículo devuelto al periodista para corrección con la nota editorial.',
      });
    } catch (err) {
      notify('Error al devolver el artículo.', 'error', 'No se pudo completar');
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const currentCategory = categories.find((c) => c.category_uuid === categoryUuid);
  const currentAuthor = authors.find((a) => a.author_uuid === authorUuid);
  const isJournalist = currentUser?.roles?.includes('JOURNALIST') && !currentUser?.roles?.includes('EDITOR') && !currentUser?.roles?.includes('SUPER_ADMIN');

  return (
    <div className="space-y-6 pb-24 sm:pb-8 max-w-6xl mx-auto font-sans">
      {/* Top Header Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/articles"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            title="Volver a la lista de artículos"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Estado: {status}
              </span>
              <AutosaveIndicator
                status={autosaveStatus}
                lastSavedAt={lastSavedAt}
                onOpenVersions={() => setIsVersionsModalOpen(true)}
                versionsCount={versions.length}
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-stone-950">
              {isEditing ? 'Editar Noticia' : 'Redactar Nueva Noticia'}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
            >
              Guardar Borrador
            </button>
          )}

          {/* Main Action: Pre-publish Checklist trigger or direct save */}
          {isJournalist ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => setIsChecklistModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Revisar y Enviar a Edición</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => setIsChecklistModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{status === 'PUBLISHED' ? 'Actualizar Noticia' : 'Publicar Noticia'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Recovered Draft Banner */}
      {recoveredDraftAvailable && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-700 flex-shrink-0" />
            <span>
              <strong>Borrador local detectado:</strong> Hay cambios no sincronizados más recientes guardados en este navegador.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRecoveredDraftAvailable(false)}
              className="text-stone-500 hover:underline px-2 py-1"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleRecoverDraft}
              className="bg-blue-800 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-blue-900"
            >
              Recuperar Trabajo
            </button>
          </div>
        </div>
      )}

      {/* Editorial Note (If returned for correction) */}
      {editorialNote && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 flex items-start gap-3 text-xs text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Observación Editorial:</strong> {editorialNote}
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
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
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Titular Principal de la Noticia <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="Escriba un titular periodístico claro, contundente y verificable..."
                className="w-full text-xl sm:text-2xl font-serif font-bold text-stone-900 border-b border-stone-300 focus:outline-none focus:border-rose-900 pb-2 placeholder-stone-400 bg-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Subtítulo / Bajada Informativa
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  setAutosaveStatus('unsaved');
                }}
                placeholder="Aporte datos contextuales esenciales que complementen el titular..."
                className="w-full text-sm text-stone-800 border-b border-stone-300 focus:outline-none focus:border-rose-900 pb-2 placeholder-stone-400 font-serif italic bg-transparent transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-500 mb-1">
                Ruta / Slug Permanente: /{slug}
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setAutosaveStatus('unsaved');
                }}
                className="w-full text-xs font-mono text-stone-700 border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:bg-white focus:border-stone-800 transition"
              />
            </div>
          </div>

          {/* Featured Image Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-stone-600" />
                <span>Fotografía de Portada (Featured Image)</span>
              </h2>
              {featuredMedia && (
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="text-[11px] text-red-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar foto</span>
                </button>
              )}
            </div>

            {featuredMedia ? (
              <div className="space-y-4">
                <div className="aspect-[16/9] w-full bg-stone-100 rounded-xl overflow-hidden relative group">
                  <OptimizedImage
                    src={featuredMedia.url}
                    alt={featuredMedia.alt_text || title}
                    aspectRatio="16/9"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-4 py-2 bg-white text-stone-900 text-xs font-bold rounded-lg shadow-md cursor-pointer"
                    >
                      Cambiar Fotografía
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                      Pie de Foto (Epígrafe)
                    </label>
                    <input
                      type="text"
                      value={featuredMedia.caption || ''}
                      onChange={(e) =>
                        setFeaturedMedia({ ...featuredMedia, caption: e.target.value })
                      }
                      placeholder="Leyenda descriptiva..."
                      className="w-full border border-stone-300 rounded-lg p-2 text-stone-800 bg-white focus:outline-none focus:border-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                      Créditos / Fuente Fotográfica
                    </label>
                    <input
                      type="text"
                      value={featuredMedia.credit || ''}
                      onChange={(e) =>
                        setFeaturedMedia({ ...featuredMedia, credit: e.target.value })
                      }
                      placeholder="Ej: Archivo Prensa / Fotógrafo"
                      className="w-full border border-stone-300 rounded-lg p-2 text-stone-800 bg-white focus:outline-none focus:border-stone-800"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-stone-50">
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">
                    No hay imagen de portada asignada
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Seleccione una fotografía para la portada, cabecera y visualización social
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  Seleccionar de la Biblioteca Multimedia
                </button>
              </div>
            )}
          </div>

          {/* Lead / Entradilla */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Entradilla Editorial (Lead / Primer Párrafo)
            </label>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value);
                setAutosaveStatus('unsaved');
              }}
              placeholder="Síntesis que responde a las preguntas fundamentales del hecho noticioso (qué, quién, cuándo, dónde y por qué)..."
              className="w-full text-sm text-stone-800 border border-stone-300 rounded-lg p-3 focus:outline-none focus:border-stone-800 leading-relaxed font-sans"
            />
          </div>

          {/* Body Content with Toolbar and Live Visual Preview */}
          <StoryTemplatePicker onSelect={handleApplyStoryTemplate} />

          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-3 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Cuerpo del Artículo
                </span>

                {/* View Mode Selector Tabs */}
                <div className="flex items-center bg-stone-200 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setEditorViewMode('write')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${
                      editorViewMode === 'write'
                        ? 'bg-white text-stone-950 shadow-xs'
                        : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    Redactar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorViewMode('split')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${
                      editorViewMode === 'split'
                        ? 'bg-white text-stone-950 shadow-xs'
                        : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    En vivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorViewMode('source')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${
                      editorViewMode === 'source'
                        ? 'bg-white text-stone-950 shadow-xs'
                        : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorViewMode('preview')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${
                      editorViewMode === 'preview'
                        ? 'bg-white text-stone-950 shadow-xs'
                        : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    Vista Final
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {compressingImage && (
                  <span className="text-[11px] text-rose-800 font-bold flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Comprimiendo imagen pegada...
                  </span>
                )}
                <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {wordCount} palabras &bull; ~{readingTimeMinutes} min de lectura
                </span>
              </div>
            </div>

            {editorViewMode === 'source' && (
              <EditorialToolbar
                textareaRef={textareaRef}
                onContentChange={handleContentChangeWithAutosave}
                onOpenMediaPicker={() => setIsInlineMediaPickerOpen(true)}
                onOpenGalleryModal={() => setIsGalleryModalOpen(true)}
              />
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              className={`p-4 sm:p-6 bg-white relative transition ${
                isDraggingOver ? 'ring-2 ring-rose-500 bg-rose-50/50' : ''
              }`}
            >
              {isDraggingOver && (
                <div className="absolute inset-0 z-30 bg-rose-900/10 border-2 border-dashed border-rose-600 rounded-xl flex flex-col items-center justify-center pointer-events-none">
                  <UploadCloud className="w-10 h-10 text-rose-700 animate-bounce" />
                  <p className="font-bold text-xs text-rose-950 mt-1">Suelte la imagen aquí</p>
                  <p className="text-[10px] text-rose-800">Se optimizará a máx 1200px</p>
                </div>
              )}

              {/* WRITE MODE */}
              {editorViewMode === 'write' && (
                <div>
                  <VisualArticleEditor
                    value={content}
                    onChange={handleContentChangeWithAutosave}
                    onOpenMediaPicker={() => setIsInlineMediaPickerOpen(true)}
                    onOpenGalleryModal={() => setIsGalleryModalOpen(true)}
                    onPaste={handlePaste}
                    insertContentRef={visualInsertRef}
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                    <span>Selecciona el texto y toca un botón para darle formato.</span>
                    <span>{content.length} caracteres</span>
                  </div>
                </div>
              )}

              {/* SPLIT VIEW MODE */}
              {editorViewMode === 'split' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                      Escribe tu noticia
                    </span>
                    <VisualArticleEditor
                      value={content}
                      onChange={handleContentChangeWithAutosave}
                      onOpenMediaPicker={() => setIsInlineMediaPickerOpen(true)}
                      onOpenGalleryModal={() => setIsGalleryModalOpen(true)}
                      onPaste={handlePaste}
                      insertContentRef={visualInsertRef}
                    />
                  </div>
                  <div className="border border-stone-200 rounded-xl p-4 bg-white overflow-y-auto max-h-[500px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-2">
                      Así se verá publicada · se actualiza al escribir
                    </span>
                    <div className="prose prose-stone max-w-none text-stone-900 font-sans leading-relaxed text-sm space-y-3">
                      {content
                        ? renderArticleMarkdown(content, { enableDropCap: false })
                        : <p className="text-stone-400 italic">La noticia formateada aparecerá aquí mientras escribes.</p>}
                    </div>
                  </div>
                </div>
              )}

              {editorViewMode === 'source' && (
                <div>
                  <textarea
                    ref={textareaRef}
                    rows={18}
                    required
                    value={content}
                    onChange={(e) => handleContentChangeWithAutosave(e.target.value)}
                    onPaste={handlePaste}
                    aria-label="Editar el texto fuente Markdown"
                    placeholder="Escribe o pega aquí el texto de la noticia."
                    className="w-full min-h-[400px] text-base font-sans leading-relaxed text-stone-900 border border-stone-300 rounded-xl p-4 focus:outline-none focus:border-stone-800 bg-stone-50/40"
                  />
                  <p className="mt-2 text-[11px] text-stone-500">
                    Modo avanzado: aquí puedes editar directamente el formato guardado del artículo.
                  </p>
                </div>
              )}

              {/* PREVIEW ONLY MODE */}
              {editorViewMode === 'preview' && (
                <div className="border border-stone-200 rounded-xl p-6 bg-white">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-950 leading-tight">
                      {renderInlineContent(title || 'Titular de la Noticia')}
                    </h1>
                    {subtitle && (
                      <p className="text-sm sm:text-base font-medium text-stone-600">
                        {renderInlineContent(subtitle)}
                      </p>
                    )}
                    {featuredMedia?.url && (
                      <figure className="rounded-xl overflow-hidden border border-stone-200">
                        <img src={featuredMedia.url} alt={featuredMedia.alt_text || title} className="w-full h-auto object-cover" />
                        {featuredMedia.caption && (
                          <figcaption className="p-2.5 text-xs text-stone-500 font-sans italic text-center bg-stone-50">
                            {featuredMedia.caption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                    {excerpt && (
                      <p className="text-sm font-semibold text-stone-800 leading-relaxed border-l-2 border-stone-300 pl-3 italic">
                        {renderInlineContent(excerpt)}
                      </p>
                    )}
                    <hr className="border-stone-200 my-4" />
                    <div className="space-y-4 font-sans text-sm sm:text-base leading-relaxed text-stone-800">
                      {renderArticleMarkdown(content, { enableDropCap: true })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <EditorialWritingAssistant
            title={title}
            excerpt={excerpt}
            content={content}
            onTitleChange={(value) => {
              setTitle(value);
              if (!isEditing || !slug) {
                setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
              }
              setAutosaveStatus('unsaved');
            }}
            onContentChange={handleContentChangeWithAutosave}
          />

          {/* SEO Assistant and Social Preview Module */}
          <SeoAssistant
            title={title}
            slug={slug}
            excerpt={excerpt}
            content={content}
            featuredImageUrl={featuredMedia?.url}
            featuredImageAlt={featuredMedia?.alt_text}
            authorName={currentAuthor?.name}
            publishedAt={status === 'PUBLISHED' ? new Date().toISOString() : scheduledDate}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            canonicalUrl={canonicalUrl}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
            onCanonicalUrlChange={setCanonicalUrl}
          />
        </div>

        {/* Right Column: Taxonomy, Credits & Publishing Details */}
        <div className="space-y-6">
          {/* Workflow Status Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-2">
              Flujo de Publicación
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Estado Actual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="w-full text-xs font-semibold border border-stone-300 rounded-lg bg-stone-50 p-2.5 text-stone-900 focus:outline-none focus:border-stone-800"
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
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                  Fecha y Hora Programada
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2 text-stone-900 bg-white focus:outline-none focus:border-stone-800"
                />
              </div>
            )}

            {/* Quick Workflow Buttons */}
            <div className="pt-2 border-t border-stone-200 space-y-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsChecklistModalOpen(true)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isJournalist
                    ? 'Enviar a Revisión Editorial'
                    : status === 'PUBLISHED'
                    ? 'Guardar Cambios Publicados'
                    : 'Revisar y Publicar'}
                </span>
              </button>

              {status !== 'SCHEDULED' && status !== 'PUBLISHED' && !isJournalist && (
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
                  className="w-full border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>Programar Publicación</span>
                </button>
              )}
            </div>
          </div>

          {/* Taxonomy & Credits Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-2">
              Taxonomía y Créditos
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Sección Editorial <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={categoryUuid}
                onChange={(e) => setCategoryUuid(e.target.value)}
                className="w-full text-xs font-semibold border border-stone-300 rounded-lg bg-stone-50 p-2.5 text-stone-900 focus:outline-none focus:border-stone-800"
              >
                {categories.map((c) => (
                  <option key={c.category_uuid} value={c.category_uuid}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Periodista / Autor <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={authorUuid}
                onChange={(e) => setAuthorUuid(e.target.value)}
                className="w-full text-xs font-semibold border border-stone-300 rounded-lg bg-stone-50 p-2.5 text-stone-900 focus:outline-none focus:border-stone-800"
              >
                {authors.map((a) => (
                  <option key={a.author_uuid} value={a.author_uuid}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Etiquetas Temáticas (Tags)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Vialidad, Producción, Comunidades..."
                className="w-full text-xs border border-stone-300 rounded-lg p-2.5 text-stone-800 bg-white focus:outline-none focus:border-stone-800"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Escriba las etiquetas separadas por comas.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Dock on Mobile */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 z-40 bg-stone-900 text-white p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-xl border border-stone-800">
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="flex-1 py-2 px-3 rounded-lg bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Vista Previa</span>
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => setIsChecklistModalOpen(true)}
          className="flex-1 py-2 px-3 rounded-lg bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{saving ? 'Guardando...' : status === 'PUBLISHED' ? 'Actualizar' : 'Publicar'}</span>
        </button>
      </div>

      {/* Media Picker Modal for Featured Image */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelected}
        selectedMediaUuid={featuredMediaUuid}
      />

      {/* Inline Body Media Picker Modal */}
      <MediaPickerModal
        isOpen={isInlineMediaPickerOpen}
        onClose={() => setIsInlineMediaPickerOpen(false)}
        onSelect={handleInlineMediaSelected}
        title="Insertar Fotografía en el Cuerpo del Artículo"
      />

      {/* Gallery Manager Modal */}
      <GalleryManagerModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onInsertGallery={handleContentChangeWithAutosave}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isVersionsModalOpen}
        onClose={() => setIsVersionsModalOpen(false)}
        versions={versions}
        currentContent={content}
        currentTitle={title}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Pre-publication Checklist Modal */}
      <PrePublishChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        data={{
          title,
          content,
          excerpt,
          categoryUuid,
          authorUuid,
          slug,
          hasFeaturedMedia: Boolean(featuredMedia),
          featuredMediaAlt: featuredMedia?.alt_text || undefined,
          featuredMediaCredit: featuredMedia?.credit || undefined,
          metaDescription,
        }}
        currentStatus={status}
        userRole={currentUser?.roles?.[0] || 'EDITOR'}
        onConfirmPublish={() => handleSave('PUBLISHED')}
        onConfirmSubmitReview={() => handleSave('PENDING_REVIEW')}
        onConfirmSchedule={() => {
          setStatus('SCHEDULED');
          handleSave('SCHEDULED');
        }}
        onReturnForCorrection={handleReturnForCorrection}
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
