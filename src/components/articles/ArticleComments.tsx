import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Send, CheckCircle2, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';
import { commentsService } from '../../services/commentsService';
import type { ArticleComment } from '../../types/comments';
import { formatDate } from '../../utils/date';

interface ArticleCommentsProps {
  articleUuid: string;
}

export const ArticleComments: React.FC<ArticleCommentsProps> = ({ articleUuid }) => {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Form state
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    commentsService.getComments(articleUuid)
      .then((data) => {
        if (isMounted) setComments(data);
      })
      .catch(() => {
        // quiet error
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [articleUuid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) {
      setErrorNotice('Por favor ingrese su nombre y el contenido del comentario.');
      return;
    }

    setSubmitting(true);
    setErrorNotice(null);

    try {
      const created = await commentsService.addComment({
        article_uuid: articleUuid,
        author_name: authorName.trim(),
        author_email: authorEmail.trim() || undefined,
        location: location.trim() || undefined,
        content: content.trim(),
      });

      setComments((prev) => [created, ...prev]);
      setContent('');
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 4000);
    } catch {
      setErrorNotice('No se pudo enviar el comentario. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentUuid: string) => {
    try {
      const res = await commentsService.likeComment(commentUuid);
      setComments((prev) =>
        prev.map((c) => (c.comment_uuid === commentUuid ? { ...c, likes_count: res.likes_count } : c))
      );
    } catch {
      // quiet fallback
    }
  };

  return (
    <section aria-label="Comentarios de la comunidad" className="my-10 font-sans">
      <div className="glass-card rounded-[28px] p-6 sm:p-8 border border-stone-200/80 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-stone-200/60 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-900 text-white flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-black text-stone-900 text-lg">
                Comentarios de los Lectores
              </h3>
              <p className="text-xs text-stone-500">
                Espacio de opinión y debate ciudadano respetuoso
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200/60 px-3 py-1 rounded-full">
            {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
          </span>
        </div>

        {/* Comment Input Form */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-3.5 bg-stone-50/80 p-4 sm:p-5 rounded-2xl border border-stone-200/60">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
            Deja tu opinión sobre este artículo
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Tu nombre o alias *"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-800 shadow-2xs"
            />
            <input
              type="email"
              placeholder="Correo electrónico (opcional)"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-800 shadow-2xs"
            />
            <input
              type="text"
              placeholder="Municipio o ciudad (ej. Calabozo)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-800 shadow-2xs"
            />
          </div>

          <textarea
            required
            rows={3}
            placeholder="Escribe tu comentario respetando las normas editoriales de la comunidad..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-800 shadow-2xs leading-relaxed"
          />

          {errorNotice && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Comentario publicado exitosamente! Gracias por participar.</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-stone-400">
              * Los comentarios son moderados para garantizar una convivencia cívica.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Publicando...' : 'Publicar Comentario'}</span>
            </button>
          </div>
        </form>

        {/* Comments Feed */}
        {loading ? (
          <div className="p-10 text-center text-xs text-stone-400 font-mono animate-pulse">
            Cargando comentarios de la comunidad...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-10 text-center text-stone-500 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
            <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-serif font-bold text-sm text-stone-800">Sé el primero en comentar</p>
            <p className="text-xs text-stone-400 mt-0.5">Comparte tu punto de vista con la comunidad de Guárico y el país.</p>
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-stone-100">
            {comments.map((comment) => (
              <div key={comment.comment_uuid} className="pt-4 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-stone-900">{comment.author_name}</span>
                        {comment.is_verified && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold rounded-full">
                            <ShieldCheck className="w-2.5 h-2.5 text-rose-600" />
                            Redactor Verificado
                          </span>
                        )}
                        {comment.location && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-400">
                            <MapPin className="w-2.5 h-2.5" />
                            {comment.location}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono block">
                        {formatDate(comment.created_at, 'withTime')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLike(comment.comment_uuid)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs active:scale-90"
                    title="Apoyar este comentario"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{comment.likes_count}</span>
                  </button>
                </div>

                <p className="mt-2.5 text-xs text-stone-700 leading-relaxed pl-10 font-sans">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
