import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Database,
  Search,
  ChevronRight,
} from 'lucide-react';

interface ImprovementItem {
  id: number;
  title: string;
  category: 'Redacción' | 'SEO & Marketing' | 'Auditoría & Roles' | 'Móvil & PWA' | 'Arquitectura';
  description: string;
  status: 'IMPLEMENTADO' | 'LISTO_BACKEND';
  route?: string;
  features: string[];
}

const IMPROVEMENTS_DATA: ImprovementItem[] = [
  {
    id: 1,
    title: 'SEO Avanzado & Asistente Editorial',
    category: 'SEO & Marketing',
    description: 'Diagnóstico en tiempo real de titulares, legibilidad, canonicals, Open Graph, Twitter Cards y marcado NewsArticle JSON-LD.',
    status: 'IMPLEMENTADO',
    route: '/admin/articles/new',
    features: ['Evaluador semántico', 'Preview SERP Google & Redes', 'NewsArticle Schema', 'Sitemap News'],
  },
  {
    id: 2,
    title: 'Redactor Editorial Profesional',
    category: 'Redacción',
    description: 'Editor con barra de herramientas adaptable para escritorio y móvil, inserción de citas, separadores y bloques.',
    status: 'IMPLEMENTADO',
    route: '/admin/articles/new',
    features: ['Toolbar táctil móvil', 'Formato enriquecido', 'Bloques dinámicos', 'Embeds multimedia'],
  },
  {
    id: 3,
    title: 'Autoguardado & Control de Versiones',
    category: 'Redacción',
    description: 'Guardado automático continuo contra pérdida de datos, recuperación de borradores y modal de diff entre versiones.',
    status: 'IMPLEMENTADO',
    route: '/admin/articles/new',
    features: ['Autosave a 15s', 'Historial con diff visual', 'Recuperación de crash', 'Atribución de autor'],
  },
  {
    id: 4,
    title: 'Workflow Editorial de 6 Estados',
    category: 'Redacción',
    description: 'Flujo periodístico completo: Borrador, Pendiente de Revisión, Programado, Publicado, Archivado y Papelera.',
    status: 'IMPLEMENTADO',
    route: '/admin/articles',
    features: ['Transiciones con permisos', 'Aprobación de editores', 'Devolución con notas', 'Restauración'],
  },
  {
    id: 5,
    title: 'Checklist Pre-Publicación',
    category: 'Redacción',
    description: 'Auditoría de calidad que valida titular, cuerpo mínimo, categoría, créditos fotográficos y descripción antes de publicar.',
    status: 'IMPLEMENTADO',
    route: '/admin/articles/new',
    features: ['Errores bloqueantes', 'Advertencias recomendadas', 'Conteo de palabras', 'Validación de slug'],
  },
  {
    id: 6,
    title: 'Compresión & Optimización de Imágenes',
    category: 'Arquitectura',
    description: 'Pipeline de subida con redimensión automática a 1200px max, conversión a WebP/AVIF y cálculo de ahorro porcentual.',
    status: 'IMPLEMENTADO',
    route: '/admin/media',
    features: ['Redimensionamiento 1200px', 'WebP progresivo', 'Metadata ALT y crédito', 'Drag & drop'],
  },
  {
    id: 7,
    title: 'Galerías Fotográficas & Multi-Imagen',
    category: 'Redacción',
    description: 'Gestor modal de reportajes gráficos con reordenamiento, pies de foto individuales, créditos y layout responsivo.',
    status: 'IMPLEMENTADO',
    route: '/admin/articles/new',
    features: ['Múltiples imágenes', 'Reordenamiento fluido', 'Créditos por foto', 'Inserción en cuerpo'],
  },
  {
    id: 8,
    title: 'Control de Acceso & Roles Granulares',
    category: 'Auditoría & Roles',
    description: 'Matriz estricta de 13 permisos jerárquicos entre Super Admin, Editor, Periodista y Gestor de Publicidad.',
    status: 'IMPLEMENTADO',
    route: '/admin/users',
    features: ['Matriz de permisos', 'Protección de rutas', 'Validación server-side', 'Gestión de perfiles'],
  },
  {
    id: 9,
    title: 'Perfiles de Periodistas & Métricas Éticas',
    category: 'Auditoría & Roles',
    description: 'Visualización no competitiva de la producción de la sala de redacción, tiempo promedio de lectura y retención.',
    status: 'IMPLEMENTADO',
    route: '/admin/journalists',
    features: ['Métricas éticas', 'Tasa de retención', 'Hemeroteca por autor', 'Biografías editoriales'],
  },
  {
    id: 10,
    title: 'Calendario Editorial & Planificación',
    category: 'Redacción',
    description: 'Parrilla mensual y agenda de publicaciones programadas, noticias en revisión y fechas de pautas publicitarias.',
    status: 'IMPLEMENTADO',
    route: '/admin/calendar',
    features: ['Vista mensual y agenda', 'Filtro por tipo de evento', 'Navegación temporal', 'Acceso directo al editor'],
  },
  {
    id: 11,
    title: 'Registro de Auditoría & Trazabilidad',
    category: 'Auditoría & Roles',
    description: 'Bitácora inmutable de cada acción en el CMS (publicaciones, ediciones, logins, cambios de configuración) con exportación CSV.',
    status: 'IMPLEMENTADO',
    route: '/admin/audit',
    features: ['Registro de IP y usuario', 'Filtro por módulo', 'Exportación CSV', 'Historial forense'],
  },
  {
    id: 12,
    title: 'Centro de Notificaciones en Vivo',
    category: 'Redacción',
    description: 'Menú desplegable de alertas con estado leído/no leído para avisos de revisión, aprobaciones y notas ciudadanas.',
    status: 'IMPLEMENTADO',
    route: '/admin',
    features: ['Marcado en tiempo real', 'Enlaces directos a notas', 'Severidad visual', 'Contador dinámico'],
  },
  {
    id: 13,
    title: 'Conector Desacoplado WordPress Histórico',
    category: 'Arquitectura',
    description: 'Integración de solo lectura contra la API REST de WordPress para consultar archivo histórico sin migración masiva.',
    status: 'LISTO_BACKEND',
    route: '/admin/integrations',
    features: ['Zero migración destructiva', 'Cache y fallback seguro', 'Búsqueda unificada', 'Mocks de contratos'],
  },
  {
    id: 14,
    title: 'Buzón Ciudadano & Moderación',
    category: 'Redacción',
    description: 'Mesa de recepción de notas comunitarias con workflow de aprobación y conversión directa a borrador de redacción.',
    status: 'IMPLEMENTADO',
    route: '/admin/submissions',
    features: ['Filtro de verificación', 'Conversión a noticia', 'Adjuntos y contacto', 'Estados de moderación'],
  },
  {
    id: 15,
    title: 'Motor de Pautas Publicitarias',
    category: 'SEO & Marketing',
    description: 'Gestión de banners, patrocinios, métricas de impresiones y clics (CTR) con fechas de vigencia y anunciantes.',
    status: 'IMPLEMENTADO',
    route: '/admin/ads',
    features: ['Slots responsivos', 'Cálculo de CTR', 'Vigencia automática', 'Múltiples formatos'],
  },
  {
    id: 16,
    title: 'Experiencia Móvil iOS 27 Glass',
    category: 'Móvil & PWA',
    description: 'Dock inferior con 5 botones accesibles, botón central de noticias al minuto (Rayo ⚡) y drawers táctiles fluidos.',
    status: 'IMPLEMENTADO',
    route: '/',
    features: ['Dock inferior de 5 botones', 'Drawer Rayo al Minuto', 'Fondos iOS 27 Glass', 'Navegación táctil nativa'],
  },
  {
    id: 17,
    title: 'Marketing Hub & Smart Push',
    category: 'SEO & Marketing',
    description: 'Envío de notificaciones push segmentadas a lectores, boletines informativos y métricas de alcance en tiempo real.',
    status: 'IMPLEMENTADO',
    route: '/admin/marketing',
    features: ['Web Push API', 'Segmentación por intereses', 'Campañas programadas', 'Tasa de apertura'],
  },
  {
    id: 18,
    title: 'PWA Completa con Modo Offline',
    category: 'Móvil & PWA',
    description: 'Service Worker registrado, manifiesto web, caché de noticias para lectura en zonas de baja conectividad.',
    status: 'IMPLEMENTADO',
    route: '/',
    features: ['Lectura offline', 'Instalación en pantalla de inicio', 'Actualización en segundo plano', 'Caché adaptativo'],
  },
  {
    id: 19,
    title: 'Configuración Multi-Tenant & Marca',
    category: 'Arquitectura',
    description: 'Personalización de paleta cromática, tipografías, logotipos, enlaces institucionales y metadatos del sitio.',
    status: 'IMPLEMENTADO',
    route: '/admin/settings',
    features: ['Paleta editable', 'Subida de logotipos', 'Parámetros editoriales', 'Persistencia reactiva'],
  },
  {
    id: 20,
    title: 'Modo Mock Robusto para Espera de Backend',
    category: 'Arquitectura',
    description: 'Capa mock en localStorage que preserva todas las entidades y operaciones de desarrollo sin bloquear la interfaz.',
    status: 'IMPLEMENTADO',
    route: '/admin',
    features: ['Persistencia local', 'Contratos idénticos a PHP', 'Fallback transparente', 'Cero fallas 404'],
  },
];

export const ImprovementsShowcasePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const categories = ['ALL', 'Redacción', 'SEO & Marketing', 'Auditoría & Roles', 'Móvil & PWA', 'Arquitectura'];

  const filteredItems = IMPROVEMENTS_DATA.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.features.some((f) => f.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-rose-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lyberate CMS — Contacto con la Noticia v2.0.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            Showcase de Mejoras Editoriales
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
            Auditoría y estado de cumplimiento de los 20 pilares arquitectónicos implementados para la sala de redacción profesional.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>19 Mejoras 100% Funcionales</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-300 font-bold">
              <Database className="w-4 h-4" />
              <span>1 Módulo Conector WP (Backend Ready)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {cat === 'ALL' ? 'Todos los Pilares (20)' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por pilar o característica..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-900/20"
          />
        </div>
      </div>

      {/* Grid of Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-stone-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-stone-400">
                  PILAR #{String(item.id).padStart(2, '0')}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    item.status === 'IMPLEMENTADO'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}
                >
                  {item.status === 'IMPLEMENTADO' ? 'En Vivo' : 'Backend Ready'}
                </span>
              </div>

              <h3 className="font-serif font-black text-base text-stone-900 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-stone-500 font-semibold mb-3">
                Categoría: {item.category}
              </p>

              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                {item.description}
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100">
                {item.features.map((feat) => (
                  <span
                    key={feat}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700"
                  >
                    • {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Link */}
            {item.route && (
              <div className="pt-2">
                <Link
                  to={item.route}
                  className="inline-flex items-center justify-between w-full p-2.5 rounded-xl bg-stone-50 hover:bg-rose-50 border border-stone-200/80 hover:border-rose-200 text-stone-800 hover:text-rose-900 text-xs font-bold transition group"
                >
                  <span>Probar funcionalidad</span>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-rose-900 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImprovementsShowcasePage;
