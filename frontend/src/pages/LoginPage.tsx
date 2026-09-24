import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Newspaper, Lock, Mail, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin/articles';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState('');
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    authService.getMe().then((res) => {
      if (!isMounted) return;
      if (res.success && res.data?.user) {
        navigate(from, { replace: true });
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [from, navigate]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login(email, password);

      if (!res.success) {
        setError(res.error?.message || 'Error de autenticación.');
        setLoading(false);
        return;
      }

      if (res.data?.requires_2fa && res.data.ticket) {
        setTicket(res.data.ticket);
        setStep('2fa');
      } else if (res.data?.user) {
        navigate(from, { replace: true });
      }
    } catch {
      setError('No se pudo conectar con el servidor de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.verify2fa(ticket, code);

      if (!res.success) {
        setError(res.error?.message || 'Código de verificación incorrecto.');
        setLoading(false);
        return;
      }

      if (res.data?.user) {
        navigate(from, { replace: true });
      }
    } catch {
      setError('Error al procesar el código de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen ambient-glow-mesh flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl glass-card mx-auto flex items-center justify-center shadow-lg mb-3">
          <Newspaper className="w-7 h-7 text-rose-800" />
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-stone-900 font-serif">
          Contacto con la Noticia
        </h2>
        <p className="mt-1 text-center text-xs text-rose-700 font-semibold uppercase tracking-wider">
          Mesa Editorial & Administración
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel p-6 sm:p-8 rounded-[32px] shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50/90 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="redaccion@contactoconlanoticia.com"
                    className="w-full glass-pill pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full glass-pill pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-900 to-rose-700 hover:from-rose-950 hover:to-rose-800 text-white text-xs font-semibold py-3 px-4 rounded-full transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
              >
                {loading ? 'Verificando...' : 'Iniciar Sesión'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handle2faSubmit} className="space-y-4">
              <div className="p-3 glass-card rounded-2xl text-xs text-stone-600 mb-3">
                Ingrese el código de 6 dígitos de su aplicación de autenticación (Google Authenticator) o un código de recuperación.
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Código de Autenticación
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full glass-pill pl-10 pr-3.5 py-2.5 text-xs font-mono text-stone-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-900 to-rose-700 hover:from-rose-950 hover:to-rose-800 text-white text-xs font-semibold py-3 px-4 rounded-full transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
              >
                {loading ? 'Validando 2FA...' : 'Verificar y Continuar'}
              </button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="w-full text-xs text-stone-500 hover:text-stone-800 text-center block pt-2 cursor-pointer"
              >
                &larr; Volver al paso anterior
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-stone-200/60 text-center">
            <Link
              to="/"
              className="text-xs text-stone-500 hover:text-rose-700 transition-colors inline-flex items-center gap-1"
            >
              &larr; <span>Volver al portal de noticias</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};
