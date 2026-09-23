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
    <div className="max-w-3xl mx-auto py-8">
      <SeoHead
        title="Envíanos tu Noticia | Contacto con la Noticia"
        description="Participa en la cobertura informativa de los Llanos venezolanos. Envía denuncias, sucesos y reportes comunitarios a nuestra redacción."
        canonicalUrl={`${SITE_URL}/enviar-noticia`}
        type="website"
      />

      {/* Header */}
      <div className="border-b-2 border-stone-900 pb-4 mb-8">
        <div className="flex items-center gap-2 text-red-700 text-xs font-bold uppercase tracking-wider mb-1">
          <MapPin className="w-4 h-4" />
          <span>Mesa de Participación y Reporte Ciudadano</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-950 uppercase tracking-tight">
          Envíanos tu Noticia
        </h1>
        <p className="mt-2 text-sm text-stone-600 font-serif leading-relaxed">
          ¿Ocurrió un acontecimiento relevante en tu comunidad, municipio o parroquia? Comparte la información, fotos o denuncias con la redacción de <strong>Contacto con la Noticia</strong>.
        </p>
      </div>

      {/* Important Editorial Notice */}
      <div className="bg-stone-100 border-l-4 border-stone-800 p-4 mb-8 text-xs text-stone-700 space-y-1.5 rounded-r">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-stone-900">
          <ShieldCheck className="w-4 h-4 text-red-700" />
          <span>Aviso de Verificación Periodística</span>
        </div>
        <p className="leading-relaxed">
          Todo reporte ciudadano es recibido de forma confidencial por nuestra mesa de redacción. Para garantizar la veracidad y el rigor informativo, <strong>ningún reporte se publica automáticamente</strong>: un periodista verifica los hechos antes de su redacción y eventual publicación en el diario.
        </p>
      </div>

      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 p-8 text-center rounded space-y-4 my-8">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            ¡Reporte Enviado Satisfactoriamente!
          </h2>
          <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            Hemos recibido su información. Nuestro equipo periodístico revisará los datos aportados y, de ser necesario, se pondrá en contacto para contrastar detalles.
          </p>
          <div className="pt-4 flex justify-center gap-4">
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
              className="px-4 py-2 border border-stone-300 text-xs font-semibold uppercase text-stone-800 hover:bg-stone-100 transition"
            >
              Enviar otro reporte
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition"
            >
              Volver a la portada
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6 rounded shadow-xs">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 text-xs rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Submitter Info */}
          <div>
            <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-1 mb-4">
              1. Datos del Remitente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">
                  Nombre y Apellido <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej. Juan Pérez"
                  required
                  className="w-full border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
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
                  className="w-full border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
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
                  className="w-full border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>
              <p className="text-[11px] text-stone-400 sm:col-span-2 italic">
                * Indique al menos un número telefónico o correo para que la redacción pueda confirmar la noticia. Sus datos se mantendrán bajo reserva periodística.
              </p>
            </div>
          </div>

          {/* Section 2: News Information */}
          <div>
            <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-1 mb-4">
              2. Detalles del Acontecimiento o Denuncia
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Ubicación del suceso <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Ej. San Juan de los Morros, Sector La Morera / Municipio Roscio"
                  required
                  className="w-full border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Título breve de la información <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ej. Avería de tubería principal interrumpe servicio de agua en La Morera"
                  required
                  className="w-full border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Descripción completa de los hechos <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Explique detalladamente qué ocurrió, cuándo, quiénes están involucrados y cuál es la situación actual..."
                  required
                  className="w-full border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photos and Media */}
          <div>
            <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-1 mb-4">
              3. Fotografías y Material Audiovisual
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Adjuntar fotografías (Hasta 5 imágenes)
                </label>
                <div className="border-2 border-dashed border-stone-300 rounded p-4 text-center hover:border-stone-500 transition-colors">
                  <Camera className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
                  />
                  <p className="text-[11px] text-stone-400 mt-2">
                    Formatos permitidos: JPG, PNG, WebP. Máximo 5MB por archivo.
                  </p>
                </div>
                {files.length > 0 && (
                  <div className="mt-2 text-[11px] text-stone-600 font-medium">
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
                  className="w-full border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Mensaje adicional o notas privadas para la redacción
                </label>
                <textarea
                  name="message"
                  rows={2}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Información que considere importante reservar o precisar al periodista..."
                  className="w-full border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
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
              className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Enviando reporte...' : 'Remitir a la Redacción'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

