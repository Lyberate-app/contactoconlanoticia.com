import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Send, Eye, ArrowLeft, Clock, Loader2, AlertCircle, Image as ImageIcon, Trash2 } from 'lucide-react'
import { postsApi, categoriesApi, tagsApi, usersApi, getApiError } from '@/lib/api'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'
import { slugify } from '@/lib/utils'
import type { Category, Tag, User, Media } from '@portal/shared-types'

// ── Schema de validación ──────────────────────────────────
const postSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(500),
  subtitle: z.string().max(500).optional(),
  slug: z.string().max(500).optional(),
  excerpt: z.string().max(1000).optional(),
  content: z.string().min(1, 'El contenido no puede estar vacío'),
  content_format: z.literal('tiptap_json'),
  author_id: z.number({ required_error: 'Selecciona un autor' }),
  category_id: z.number().optional().nullable(),
  cover_media_id: z.number().optional().nullable(),
  tag_ids: z.array(z.number()).optional(),
  seo_title: z.string().max(255).optional(),
  seo_description: z.string().max(500).optional(),
  schema_type: z.enum(['Article', 'NewsArticle', 'BlogPosting']).default('NewsArticle'),
  is_featured: z.boolean().default(false),
  is_breaking: z.boolean().default(false),
})

type PostFormData = z.infer<typeof postSchema>

// ── Panel con secciones plegables ─────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-card">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────
export function PostEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Cargar datos del formulario en paralelo
  const { data: existingPost, isLoading: loadingPost } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsApi.get(parseInt(id!, 10)),
    enabled: isEditing,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
    staleTime: 5 * 60 * 1000,
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.list,
    staleTime: 5 * 60 * 1000,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    staleTime: 5 * 60 * 1000,
  })

  // Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content_format: 'tiptap_json',
      schema_type: 'NewsArticle',
      is_featured: false,
      is_breaking: false,
      tag_ids: [],
    },
  })

  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)

  // Rellenar form al editar
  useEffect(() => {
    if (existingPost) {
      const coverUrl =
        (existingPost.cover as { conversions?: { card?: { url: string } }; url?: string } | null)?.conversions?.card?.url ||
        (existingPost.cover as { url?: string } | null)?.url ||
        null
      setCoverPreviewUrl(coverUrl)

      reset({
        title: existingPost.title,
        subtitle: existingPost.subtitle ?? undefined,
        slug: existingPost.slug,
        excerpt: existingPost.excerpt ?? undefined,
        content: existingPost.content,
        content_format: 'tiptap_json',
        author_id: (existingPost.author as { id: number }).id,
        category_id: (existingPost.category as { id: number } | null)?.id ?? null,
        cover_media_id: (existingPost.cover as { id: number } | null)?.id ?? null,
        tag_ids: existingPost.tags.map((t) => (t as { id: number }).id),
        seo_title: existingPost.seo_title ?? undefined,
        seo_description: existingPost.seo_description ?? undefined,
        schema_type: existingPost.schema_type ?? 'NewsArticle',
        is_featured: existingPost.is_featured,
        is_breaking: existingPost.is_breaking,
      })
    }
  }, [existingPost, reset])

  // Auto-generar slug desde título
  const title = watch('title')
  useEffect(() => {
    if (!isEditing && title) {
      setValue('slug', slugify(title), { shouldDirty: false })
    }
  }, [title, isEditing, setValue])

  // Mutaciones
  const saveMutation = useMutation({
    mutationFn: (data: PostFormData) =>
      isEditing
        ? postsApi.update(parseInt(id!, 10), data)
        : postsApi.create(data),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      if (!isEditing) navigate(`/noticias/${post.uuid}/editar`)
    },
  })

  const publishMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const post = isEditing
        ? await postsApi.update(parseInt(id!, 10), data)
        : await postsApi.create(data)
      return postsApi.publish((post as { id: number }).id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      navigate('/noticias')
    },
  })

  const error = saveMutation.error || publishMutation.error

  if (isEditing && loadingPost) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">

      {/* ── Barra superior ───────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              {isEditing ? 'Editar noticia' : 'Nueva noticia'}
            </h1>
            {isDirty && (
              <p className="text-xs text-yellow-600">Cambios sin guardar</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Vista previa */}
          {isEditing && existingPost?.slug && (
            <a
              href={`${import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000'}/${existingPost.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary py-1.5 text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              Vista previa
            </a>
          )}

          {/* Guardar borrador */}
          <button
            type="button"
            onClick={handleSubmit((data) => saveMutation.mutate(data))}
            disabled={saveMutation.isPending}
            className="btn-secondary py-1.5 text-xs"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Guardar borrador
          </button>

          {/* Publicar */}
          <button
            type="button"
            onClick={handleSubmit((data) => publishMutation.mutate(data))}
            disabled={publishMutation.isPending}
            className="btn-primary py-1.5 text-xs"
          >
            {publishMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Publicar
          </button>
        </div>
      </div>

      {/* ── Error global ─────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {getApiError(error)}
        </div>
      )}

      {/* ── Layout: editor + sidebar ──────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 p-6 max-w-7xl">

          {/* ── Columna principal — Contenido ─────────── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Título y subtítulo */}
            <div className="admin-card space-y-4">
              <div>
                <label className="admin-label">Título *</label>
                <input
                  {...register('title')}
                  placeholder="Escribe el título de la noticia..."
                  className={`admin-input text-lg font-semibold ${errors.title ? 'admin-input-error' : ''}`}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="admin-label">Subtítulo</label>
                <input
                  {...register('subtitle')}
                  placeholder="Subtítulo o bajada (opcional)"
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Slug (URL)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 whitespace-nowrap">/</span>
                  <input
                    {...register('slug')}
                    placeholder="url-de-la-noticia"
                    className="admin-input font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Editor de contenido */}
            <div>
              <label className="admin-label mb-2">Contenido *</label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <TiptapEditor
                    content={field.value}
                    onChange={field.onChange}
                    placeholder="Escribe el cuerpo de la noticia..."
                  />
                )}
              />
              {errors.content && (
                <p className="text-xs text-red-600 mt-1">{errors.content.message}</p>
              )}
            </div>

            {/* Extracto */}
            <div className="admin-card">
              <label className="admin-label">Extracto / Resumen</label>
              <textarea
                {...register('excerpt')}
                rows={3}
                placeholder="Resumen corto de la noticia (se usa en listados y redes sociales)..."
                className="admin-input resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Máximo 1000 caracteres</p>
            </div>

          </div>

          {/* ── Sidebar — Metadatos ────────────────────── */}
          <div className="space-y-5">

            {/* Publicación */}
            <Section title="Publicación">
              <div className="space-y-3">
                <div>
                  <label className="admin-label">Autor *</label>
                  <select
                    {...register('author_id', { valueAsNumber: true })}
                    className={`admin-input ${errors.author_id ? 'admin-input-error' : ''}`}
                  >
                    <option value="">Seleccionar autor...</option>
                    {users.map((u: User) => (
                      <option key={(u as { id: number }).id} value={(u as { id: number }).id}>
                        {u.display_name}
                      </option>
                    ))}
                  </select>
                  {errors.author_id && (
                    <p className="text-xs text-red-600 mt-1">{errors.author_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="admin-label">Categoría</label>
                  <select
                    {...register('category_id', { setValueAs: (v) => v ? Number(v) : null })}
                    className="admin-input"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c: Category) => (
                      <option key={(c as { id: number }).id} value={(c as { id: number }).id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_featured')} className="rounded" />
                    <span className="text-sm text-gray-700">⭐ Noticia destacada</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_breaking')} className="rounded" />
                    <span className="text-sm text-gray-700">🔴 Última hora</span>
                  </label>
                </div>
              </div>
            </Section>

            {/* Imagen destacada / Portada */}
            <Section title="Imagen destacada">
              {coverPreviewUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={coverPreviewUrl}
                      alt="Portada de la noticia"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCoverPickerOpen(true)}
                      className="btn-secondary py-1.5 px-3 text-xs flex-1"
                    >
                      Cambiar imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('cover_media_id', null, { shouldDirty: true })
                        setCoverPreviewUrl(null)
                      }}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs"
                      title="Quitar imagen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setCoverPickerOpen(true)}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-brand-500 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand-600 transition-colors bg-gray-50/50"
                  >
                    <ImageIcon className="w-8 h-8 stroke-1" />
                    <span className="text-xs font-medium">Asignar imagen de portada</span>
                  </button>
                </div>
              )}
            </Section>

            {/* Etiquetas */}
            <Section title="Etiquetas">
              <Controller
                name="tag_ids"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: Tag) => {
                      const tagId = (tag as { id: number }).id
                      const isSelected = field.value?.includes(tagId)
                      return (
                        <button
                          key={tagId}
                          type="button"
                          onClick={() => {
                            const current = field.value ?? []
                            field.onChange(
                              isSelected
                                ? current.filter((id) => id !== tagId)
                                : [...current, tagId]
                            )
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                    {tags.length === 0 && (
                      <p className="text-xs text-gray-400">No hay etiquetas creadas</p>
                    )}
                  </div>
                )}
              />
            </Section>

            {/* SEO */}
            <Section title="SEO">
              <div className="space-y-3">
                <div>
                  <label className="admin-label">
                    Título SEO
                    <span className="ml-1 text-xs text-gray-400">
                      ({(watch('seo_title') ?? '').length}/60)
                    </span>
                  </label>
                  <input
                    {...register('seo_title')}
                    placeholder="Dejar vacío para usar el título"
                    className="admin-input text-sm"
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="admin-label">
                    Descripción SEO
                    <span className="ml-1 text-xs text-gray-400">
                      ({(watch('seo_description') ?? '').length}/160)
                    </span>
                  </label>
                  <textarea
                    {...register('seo_description')}
                    rows={3}
                    placeholder="Dejar vacío para usar el extracto"
                    className="admin-input text-sm resize-none"
                    maxLength={160}
                  />
                </div>
                <div>
                  <label className="admin-label">Tipo de Schema</label>
                  <select {...register('schema_type')} className="admin-input text-sm">
                    <option value="NewsArticle">NewsArticle (noticias)</option>
                    <option value="Article">Article (artículo general)</option>
                    <option value="BlogPosting">BlogPosting (blog)</option>
                  </select>
                </div>
              </div>
            </Section>

          </div>
        </div>
      </div>

      {/* Modal para seleccionar portada */}
      <MediaPickerModal
        isOpen={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={(media) => {
          setValue('cover_media_id', media.id, { shouldDirty: true })
          const preview =
            media.conversions?.card?.url ||
            media.conversions?.medium?.url ||
            media.url
          setCoverPreviewUrl(preview)
        }}
        title="Seleccionar imagen de portada"
      />
    </div>
  )
}

