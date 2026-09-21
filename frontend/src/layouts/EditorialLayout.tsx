import React, { useEffect, useState } from 'react';
import { Newspaper, FileText, PlusCircle, LogOut, Shield, Megaphone, Inbox } from 'lucide-react';
import { authService, AuthUser } from '../services/auth';

interface EditorialLayoutProps {
  children: React.ReactNode;
  activeTab?: 'articles' | 'new' | 'ads' | 'submissions';
}

export const EditorialLayout: React.FC<EditorialLayoutProps> = ({ children, activeTab = 'articles' }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    authService.getMe().then((res) => {
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        window.location.href = '/login';
      }
    }).catch(() => {
      window.location.href = '/login';
    });
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
      {/* Top Editorial Bar */}
      <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/admin/articles" className="flex items-center gap-2 text-white font-serif font-bold text-lg tracking-tight">
              <Newspaper className="w-5 h-5 text-stone-300" />
              <span>Lyberate CMS</span>
            </a>
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-stone-400 border-l border-stone-700 pl-4">
              Contacto con la Noticia
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {user && (
              <div className="flex items-center gap-2 mr-2 bg-stone-800 px-2.5 py-1 rounded">
                <Shield className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-medium text-stone-200">{user.name}</span>
                <span className="text-[10px] bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded font-mono uppercase">
                  {user.roles[0] || 'STAFF'}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-stone-400 hover:text-white px-2 py-1 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="bg-stone-950 px-4 sm:px-6 lg:px-8 border-t border-stone-800">
          <div className="max-w-7xl mx-auto flex items-center gap-4 text-xs font-medium">
            <a
              href="/admin/articles"
              className={`py-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'articles'
                  ? 'border-white text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Artículos y Noticias</span>
            </a>
            <a
              href="/admin/articles/new"
              className={`py-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'new'
                  ? 'border-white text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Redactar Noticia</span>
            </a>
            <a
              href="/admin/ads"
              className={`py-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'ads'
                  ? 'border-white text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Publicidad / Campañas</span>
            </a>
            <a
              href="/admin/submissions"
              className={`py-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'submissions'
                  ? 'border-white text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Buzón Ciudadano</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 text-xs text-stone-500 text-center">
        Lyberate CMS &bull; Contacto con la Noticia &bull; Redacción y Edición Periodística
      </footer>
    </div>
  );
};

