import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Camera, ShieldCheck, MapPin, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { submitCitizenNews } from '../../services/submissionApi';
import { SeoHead } from '../../components/common/SeoHead';
import { SITE_URL } from '../../config/env';

export const SubmitNewsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    description: '',
    video_url: '',
    message: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 5);
      setFiles(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic frontend checks
    if (!formData.name.trim()) {
      setErrorMessage('Por favor ingrese su nombre y apellido.');
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      setErrorMessage('Debe indicar al menos un medio de contacto (teléfono o correo).');
      return;
    }

    if (!formData.location.trim()) {
      setErrorMessage('Por favor indique la ubicación del suceso.');
      return;
    }

    if (!formData.title.trim()) {
      setErrorMessage('Por favor indique un título descriptivo.');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setErrorMessage('La descripción del hecho debe tener al menos 10 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      if (formData.email.trim()) data.append('email', formData.email.trim());
      if (formData.phone.trim()) data.append('phone', formData.phone.trim());
      data.append('location', formData.location.trim());
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
      if (formData.video_url.trim()) data.append('video_url', formData.video_url.trim());
      if (formData.message.trim()) data.append('message', formData.message.trim());

      files.forEach((file) => {
        data.append('photos[]', file);
      });

      await submitCitizenNews(data);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error al enviar el reporte. Por favor intente más tarde.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <SeoHead
        title="Envíanos tu Noticia | Contacto con la Noticia"
        description="Participa en la cobertura informativa de los Llanos venezolanos. Envía denuncias, sucesos y reportes comunitarios a nuestra redacción."
        canonicalUrl={`${SITE_URL}/enviar-noticia`}
        type="website"
      />

      {/* Header (iOS 27 Glass) */}
      <div className="glass-card p-6 sm:p-8 rounded-[28px] shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
            Buzón de Participación y Reporte Ciudadano
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-950 uppercase tracking-tight">
          Envíanos tu Noticia
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-serif leading-relaxed">
          ¿Ocurrió un acontecimiento relevante en tu comunidad, municipio o parroquia? Comparte la información, fotos o denuncias directamente con la redacción de <strong>Contacto con la Noticia</strong>.
        </p>

        {/* Verification Notice */}
        <div className="glass-panel p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-stone-600 mt-3">
          <ShieldCheck className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            Todo reporte es confidencial. Para garantizar el rigor periodístico, <strong>ningún reporte se publica automáticamente</strong>: un redactor verifica los hechos antes de su redacción.
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="glass-card p-10 text-center rounded-[28px] space-y-4 my-6 shadow-xl max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            ¡Reporte Enviado Satisfactoriamente!
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Hemos recibido su información. Nuestro equipo periodístico revisará los datos aportados y, de ser necesario, se comunicará para contrastar detalles.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  location: '',
                  title: '',
                  description: '',
                  video_url: '',
                  message: '',
                });
                setFiles([]);
              }}
              className="glass-pill px-5 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
            >
              Enviar otro reporte
            </button>
            <Link
              to="/"
              className="bg-stone-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-rose-900 transition-colors shadow-md"
            >
              Volver a la portada
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-6 rounded-[28px] shadow-sm">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 text-xs rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Submitter Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 pb-1 border-b border-stone-200/60">
              1. Datos del Remitente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">
                  Nombre y Apellido <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej. Juan Pérez"
                  required
                  className="w-full glass-pill px-3.5 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Ej. 0414-1234567"
                  className="w-full glass-pill px-3.5 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ej. juan@correo.com"
                  className="w-full glass-pill px-3.5 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
              <p className="text-[11px] text-stone-400 sm:col-span-2 italic">
                * Indique al menos un medio de contacto para que el redactor pueda confirmar la noticia.
              </p>
            </div>
          </div>

          {/* Section 2: News Information */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 pb-1 border-b border-stone-200/60">
              2. Detalles del Acontecimiento o Denuncia
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Ubicación del suceso <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Ej. San Juan de los Morros, Sector La Morera / Municipio Roscio"
                  required
                  className="w-full glass-pill px-3.5 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Título breve de la información <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ej. Avería de tubería principal interrumpe servicio de agua en La Morera"
                  required
                  className="w-full glass-pill px-3.5 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Descripción completa de los hechos <span className="text-rose-600">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Explique detalladamente qué ocurrió, cuándo, quiénes están involucrados y cuál es la situación actual..."
                  required
                  className="w-full glass-card p-3 rounded-2xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photos and Media */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 pb-1 border-b border-stone-200/60">
              3. Fotografías y Material Audiovisual
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Adjuntar fotografías (Hasta 5 imágenes)
                </label>
                <div className="border-2 border-dashed border-stone-200/80 rounded-2xl p-5 text-center hover:border-rose-400 transition-colors glass-panel">
                  <Camera className="w-7 h-7 text-stone-400 mx-auto mb-2" />
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-rose-900 cursor-pointer"
                  />
                  <p className="text-[11px] text-stone-400 mt-2">
                    Formatos: JPG, PNG, WebP. Máximo 5MB por archivo.
                  </p>
                </div>
                {files.length > 0 && (
                  <div className="mt-2 text-[11px] text-rose-700 font-semibold">
                    {files.length} archivo(s) seleccionado(s): {files.map((f: File) => f.name).join(', ')}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Enlace a video (Opcional)
                </label>
                <input
                  type="url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/... o enlace de video"
                  className="w-full glass-pill px-3.5 py-2.5 text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Mensaje o notas privadas para la redacción
                </label>
                <textarea
                  name="message"
                  rows={2}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Información confidencial para el periodista..."
                  className="w-full glass-card p-3 rounded-2xl text-stone-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la portada</span>
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-900 to-rose-700 hover:from-rose-950 hover:to-rose-800 text-white px-7 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Enviando...' : 'Remitir a la Redacción'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
