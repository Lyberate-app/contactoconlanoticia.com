import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { EditorialLayout } from '../layouts/EditorialLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Lazy loaded public pages
const HomePage = React.lazy(() => import('../pages/public/HomePage').then(m => ({ default: m.HomePage })));
const ArticlePage = React.lazy(() => import('../pages/public/ArticlePage').then(m => ({ default: m.ArticlePage })));
const CategoryPage = React.lazy(() => import('../pages/public/CategoryPage').then(m => ({ default: m.CategoryPage })));
const AuthorPage = React.lazy(() => import('../pages/public/AuthorPage').then(m => ({ default: m.AuthorPage })));
const SearchPage = React.lazy(() => import('../pages/public/SearchPage').then(m => ({ default: m.SearchPage })));
const NotFoundPage = React.lazy(() => import('../pages/public/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const SubmitNewsPage = React.lazy(() => import('../pages/public/SubmitNewsPage').then(m => ({ default: m.SubmitNewsPage })));

// Lazy loaded authentication and editorial CMS pages
const LoginPage = React.lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const EditorialDashboardPage = React.lazy(() => import('../pages/editorial/EditorialDashboardPage').then(m => ({ default: m.EditorialDashboardPage })));
const ArticlesListPage = React.lazy(() => import('../pages/editorial/ArticlesListPage').then(m => ({ default: m.ArticlesListPage })));
const ArticleEditorPage = React.lazy(() => import('../pages/editorial/ArticleEditorPage').then(m => ({ default: m.ArticleEditorPage })));
const MediaLibraryPage = React.lazy(() => import('../pages/editorial/MediaLibraryPage').then(m => ({ default: m.MediaLibraryPage })));
const AdCampaignsPage = React.lazy(() => import('../pages/editorial/AdCampaignsPage').then(m => ({ default: m.AdCampaignsPage })));
const SubmissionsModerationPage = React.lazy(() => import('../pages/editorial/SubmissionsModerationPage').then(m => ({ default: m.SubmissionsModerationPage })));
const SettingsPage = React.lazy(() => import('../pages/editorial/SettingsPage').then(m => ({ default: m.SettingsPage })));
const MarketingHubPage = React.lazy(() => import('../pages/editorial/MarketingHubPage').then(m => ({ default: m.MarketingHubPage })));
const UsersManagementPage = React.lazy(() => import('../pages/editorial/UsersManagementPage').then(m => ({ default: m.UsersManagementPage })));
const IntegrationsPage = React.lazy(() => import('../pages/editorial/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const AnalyticsPage = React.lazy(() => import('../pages/editorial/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));

// New editorial CMS feature pages
const EditorialCalendarPage = React.lazy(() => import('../pages/editorial/EditorialCalendarPage').then(m => ({ default: m.EditorialCalendarPage })));
const JournalistProfilesPage = React.lazy(() => import('../pages/editorial/JournalistProfilesPage').then(m => ({ default: m.JournalistProfilesPage })));
const AuditLogPage = React.lazy(() => import('../pages/editorial/AuditLogPage').then(m => ({ default: m.AuditLogPage })));
const ImprovementsShowcasePage = React.lazy(() => import('../pages/editorial/ImprovementsShowcasePage').then(m => ({ default: m.ImprovementsShowcasePage })));

const LoadingFallback: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
    <div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-widest font-semibold animate-pulse">
      <div className="w-2 h-2 rounded-full bg-rose-700"></div>
      <span>Cargando edición digital...</span>
    </div>
  </div>
);

const RouteErrorFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
    <div className="bg-white border border-stone-200 rounded-3xl p-8 max-w-md shadow-lg space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-900 mx-auto flex items-center justify-center font-bold text-lg">
        !
      </div>
      <h2 className="text-xl font-serif font-black text-stone-900">
        Edición Temporalmente Interrumpida
      </h2>
      <p className="text-xs text-stone-500 leading-relaxed font-sans">
        Ha ocurrido una eventualidad al cargar esta vista del portal. Puede retornar con seguridad a la portada principal.
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-900 text-white rounded-xl text-xs font-bold hover:bg-rose-800 transition shadow-xs"
      >
        Volver a la Portada
      </a>
    </div>
  </div>
);

export const router = createBrowserRouter([
  // Public Portal Routes
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      // Spanish & canonical English aliases
      {
        path: 'noticia/:slug',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArticlePage />
          </Suspense>
        ),
      },
      {
        path: 'noticias/:slug',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArticlePage />
          </Suspense>
        ),
      },
      {
        path: 'articulo/:slug',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArticlePage />
          </Suspense>
        ),
      },
      {
        path: 'article/:slug',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArticlePage />
          </Suspense>
        ),
      },
      {
        path: 'categoria/:slug',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CategoryPage />
          </Suspense>
        ),
      },
      {
        path: 'category/:slug',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CategoryPage />
          </Suspense>
        ),
      },
      {
        path: 'autor/:slug',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AuthorPage />
          </Suspense>
        ),
      },
      {
        path: 'author/:slug',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AuthorPage />
          </Suspense>
        ),
      },
      {
        path: 'buscar',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SearchPage />
          </Suspense>
        ),
      },
      {
        path: 'search',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SearchPage />
          </Suspense>
        ),
      },
      {
        path: 'enviar-noticia',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SubmitNewsPage />
          </Suspense>
        ),
      },
      {
        path: 'participacion/enviar',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SubmitNewsPage />
          </Suspense>
        ),
      },
      {
        path: 'participar',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SubmitNewsPage />
          </Suspense>
        ),
      },
      {
        path: 'submit-news',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SubmitNewsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },

  // Authentication
  {
    path: '/login',
    errorElement: <RouteErrorFallback />,
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },

  // Administrative / Editorial CMS Routes (Protected by AuthGuard)
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <EditorialLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <EditorialDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'articles',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArticlesListPage />
          </Suspense>
        ),
      },
      {
        path: 'articles/new',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArticleEditorPage />
          </Suspense>
        ),
      },
      {
        path: 'articles/edit/:uuid',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArticleEditorPage />
          </Suspense>
        ),
      },
      {
        path: 'articles/:id/edit',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArticleEditorPage />
          </Suspense>
        ),
      },
      {
        path: 'calendar',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <EditorialCalendarPage />
          </Suspense>
        ),
      },
      {
        path: 'media',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MediaLibraryPage />
          </Suspense>
        ),
      },
      {
        path: 'journalists',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <JournalistProfilesPage />
          </Suspense>
        ),
      },
      {
        path: 'ads',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdCampaignsPage />
          </Suspense>
        ),
      },
      {
        path: 'submissions',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SubmissionsModerationPage />
          </Suspense>
        ),
      },
      {
        path: 'marketing',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MarketingHubPage />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
      {
        path: 'integrations',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <IntegrationsPage />
          </Suspense>
        ),
      },
      {
        path: 'audit',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AuditLogPage />
          </Suspense>
        ),
      },
      {
        path: 'showcase',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ImprovementsShowcasePage />
          </Suspense>
        ),
      },
      {
        path: 'users',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UsersManagementPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);

