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

const LoadingFallback: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
    <div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-widest font-semibold animate-pulse">
      <div className="w-2 h-2 rounded-full bg-red-700"></div>
      <span>Cargando edición digital...</span>
    </div>
  </div>
);

export const router = createBrowserRouter([
  // Public Portal Routes
  {
    path: '/',
    element: <PublicLayout />,
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
        path: 'media',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MediaLibraryPage />
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
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
]);
