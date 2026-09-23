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
    <main className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-3">
          <Newspaper className="w-8 h-8 text-stone-800" />
          <span className="font-serif font-bold text-2xl tracking-tight text-stone-900">
            Lyberate
          </span>
        </div>
        <h2 className="mt-4 text-center text-xl font-medium tracking-tight text-stone-700 font-serif">
          Contacto con la Noticia
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500 uppercase tracking-wider">
          Acceso Editorial y Administrativo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border border-stone-200 shadow-sm sm:px-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="redaccion@contactoconlanoticia.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 focus:outline-none focus:border-stone-800 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 focus:outline-none focus:border-stone-800 text-stone-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium py-3 px-4 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verificando...' : 'Iniciar Sesión'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handle2faSubmit} className="space-y-5">
              <div className="p-3 bg-stone-50 border border-stone-200 text-xs text-stone-600 mb-4">
                Ingrese el código de 6 dígitos de su aplicación de autenticación (Google Authenticator, Authy) o un código de recuperación.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Código de Autenticación / Recuperación
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456 o ABCD-EFGH-IJKL"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-mono border border-stone-300 focus:outline-none focus:border-stone-800 text-stone-900 tracking-wider"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium py-3 px-4 transition-colors disabled:opacity-50 cursor-pointer"
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

          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <Link
              to="/"
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
            >
              &larr; Volver al portal de noticias
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};
