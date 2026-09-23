/**
 * LYBERATE — PROTECTED ROUTE GUARD
 *
 * Ensures administrative routes under /admin/* require an active session.
 * Unauthenticated users are redirected to /login preserving the requested path.
 */

import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService, AuthUser } from '../../services/auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    authService
      .getMe()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-2.5 text-stone-600 text-xs font-semibold uppercase tracking-widest animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-red-700"></div>
          <span>Verificando credenciales de acceso...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet context={{ user }} />;
};

