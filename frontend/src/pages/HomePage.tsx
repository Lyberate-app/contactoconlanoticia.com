import React from 'react';
import { Newspaper, CheckCircle2, Server, ShieldCheck, Database, Layers } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <header className="border-b border-stone-200 pb-8 mb-8">
        <div className="flex items-center justify-between gap-3 text-stone-600 mb-3">
          <div className="flex items-center gap-3">
            <Newspaper className="w-7 h-7 text-stone-800" />
            <span className="text-xs font-semibold tracking-wider uppercase text-stone-500">
              Plataforma Lyberate
            </span>
          </div>
          <a
            href="/login"
            className="text-xs font-medium text-stone-700 hover:text-stone-950 underline underline-offset-4"
          >
            Acceso Editorial &rarr;
          </a>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Contacto con la Noticia
        </h1>
        <p className="mt-2 text-base text-stone-600">
          Entorno técnico verificado — FASE 1: Project Scaffold.
        </p>
      </header>

      <section className="bg-white border border-stone-200 p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-2 text-emerald-800 font-medium text-sm mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Scaffold de Frontend y Backend Inicializado</span>
        </div>
        <p className="text-stone-700 leading-relaxed mb-6">
          Esta vista técnica valida que React 19, TypeScript, Vite, Tailwind CSS y Lucide React están configurados y funcionando según la especificación de <code className="bg-stone-100 px-1.5 py-0.5 rounded text-sm text-stone-800">MASTER.md</code>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-stone-100 bg-stone-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm mb-1">
              <Layers className="w-4 h-4 text-stone-700" />
              <span>Frontend Desacoplado</span>
            </div>
            <p className="text-xs text-stone-600 leading-normal">
              React 19 + TypeScript + Vite + Tailwind CSS. Compilación estática hacia <code className="font-mono text-stone-700">frontend/dist/</code>.
            </p>
          </div>

          <div className="border border-stone-100 bg-stone-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm mb-1">
              <Server className="w-4 h-4 text-stone-700" />
              <span>Backend Modular</span>
            </div>
            <p className="text-xs text-stone-600 leading-normal">
              PHP 8.x nativo modular con enrutamiento REST bajo <code className="font-mono text-stone-700">/api/v1/</code>.
            </p>
          </div>

          <div className="border border-stone-100 bg-stone-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm mb-1">
              <Database className="w-4 h-4 text-stone-700" />
              <span>Base de Datos</span>
            </div>
            <p className="text-xs text-stone-600 leading-normal">
              Conexión PDO MySQL preparada con sentencias preparadas obligatorias y soporte UUID.
            </p>
          </div>

          <div className="border border-stone-100 bg-stone-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm mb-1">
              <ShieldCheck className="w-4 h-4 text-stone-700" />
              <span>Seguridad & Multi-Tenancy</span>
            </div>
            <p className="text-xs text-stone-600 leading-normal">
              Aislamiento por servidor (Tenant → Site → Users). Sesiones HttpOnly sin tokens en localStorage.
            </p>
          </div>
        </div>
      </section>

      <footer className="text-xs text-stone-500 border-t border-stone-200 pt-4 flex flex-col sm:flex-row justify-between gap-2">
        <span>Lyberate &bull; Contacto con la Noticia &bull; Dominio objetivo: contactoconlanoticia.com</span>
        <span>Fase 1 — Project Scaffold</span>
      </footer>
    </main>
  );
};

