import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  FileText,
  Clock,
  Eye,
  Award,
  Mail,
  ExternalLink,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { editorialService } from '../../services/editorial';
import type { JournalistProfile } from '../../types/user';

export const JournalistProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<JournalistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await editorialService.getJournalistProfiles();
      setProfiles(data);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.bio && p.bio.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatReadingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
              Equipo Periodístico & Redacción
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">
              Mesa de Redacción
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Métricas editoriales éticas y no competitivas, perfiles de corresponsales y producción de noticias.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchProfiles}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition cursor-pointer"
            title="Actualizar lista de periodistas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Users className="w-4 h-4" />
            <span>Gestionar Cuentas y Accesos</span>
          </Link>
        </div>
      </div>

      {/* Control Bar: Search and Role Filter */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por redactor, correo o especialidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-900/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">Filtrar rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos los roles</option>
            <option value="EDITOR">Editores</option>
            <option value="JOURNALIST">Periodistas / Redactores</option>
            <option value="SUPER_ADMIN">Dirección General</option>
          </select>
        </div>
      </div>

      {/* Grid of Journalist Profile Cards */}
      {loading ? (
        <div className="text-center py-16 text-stone-400 text-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-800" />
          <p>Cargando perfiles del equipo periodístico...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 text-stone-400">
          <Users className="w-10 h-10 mx-auto mb-2 text-stone-300" />
          <p className="text-sm font-semibold">No se encontraron periodistas registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((p) => {
            const initials = p.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={p.author_uuid}
                className="bg-white rounded-3xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between space-y-5"
              >
                {/* Header: Avatar, Name, Role */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p.name}
                          className="w-13 h-13 rounded-2xl object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-900 to-stone-800 text-white flex items-center justify-center font-serif font-black text-base shadow-xs">
                          {initials}
                        </div>
                      )}
                      <div>
                        <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                          {p.name}
                        </h3>
                        <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          {p.role}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/autor/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                      title="Ver hemeroteca pública"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Bio */}
                  {p.bio && (
                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                      {p.bio}
                    </p>
                  )}

                  {/* Email & Joined info */}
                  <div className="space-y-1 text-xs text-stone-500 pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>Ingreso: {new Date(p.joined_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Editorial Metrics (Ethical & Non-Competitive) */}
                <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/70 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-rose-900" />
                      <span>Rendimiento Editorial</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {(p.metrics.effective_read_ratio * 100).toFixed(0)}% retención
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-stone-200/80">
                      <span className="block font-serif font-black text-sm text-stone-900">
                        {p.metrics.published_count}
                      </span>
                      <span className="text-[10px] text-stone-500">Publicadas</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-stone-200/80">
                      <span className="block font-serif font-black text-sm text-amber-700">
                        {p.metrics.pending_count}
                      </span>
                      <span className="text-[10px] text-stone-500">En revisión</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-stone-200/80">
                      <span className="block font-serif font-black text-sm text-stone-600">
                        {p.metrics.drafts_count}
                      </span>
                      <span className="text-[10px] text-stone-500">Borradores</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-stone-400" />
                      {p.metrics.total_views.toLocaleString()} lectores
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {formatReadingTime(p.metrics.avg_reading_time_seconds)} lectura prom.
                    </span>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-1">
                  <Link
                    to={`/admin/articles?author_uuid=${p.author_uuid}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl text-xs font-bold transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver artículos de este redactor</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JournalistProfilesPage;
