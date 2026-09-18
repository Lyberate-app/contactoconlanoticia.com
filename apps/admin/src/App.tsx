import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PostListPage } from '@/pages/posts/PostListPage'
import { PostEditorPage } from '@/pages/posts/PostEditorPage'
import {
  MediaLibraryPage,
  CategoriesPage,
  TagsPage,
  UsersPage,
  RedirectsPage,
  SettingsPage,
  AnalyticsPage,
  AdsPage,
} from '@/pages/index'

export default function App() {
  return (
    <Routes>
      {/* Login — sin layout */}
      <Route path="/login" element={<LoginPage />} />

      {/* Área protegida */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="noticias" element={<PostListPage />} />
        <Route path="noticias/nueva" element={<PostEditorPage />} />
        <Route path="noticias/:id/editar" element={<PostEditorPage />} />
        <Route path="media" element={<MediaLibraryPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="etiquetas" element={<TagsPage />} />
        <Route path="usuarios" element={<UsersPage />} />
        <Route path="redirecciones" element={<RedirectsPage />} />
        <Route path="anuncios" element={<AdsPage />} />
        <Route path="analitica" element={<AnalyticsPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

// ── Guard de autenticación ─────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
