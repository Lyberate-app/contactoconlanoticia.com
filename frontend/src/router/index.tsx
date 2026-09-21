import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';

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
const ArticlesListPage = React.lazy(() => import('../pages/editorial/ArticlesListPage').then(m => ({ default: m.ArticlesListPage })));
const ArticleEditorPage = React.lazy(() => import('../pages/editorial/ArticleEditorPage').then(m => ({ default: m.ArticleEditorPage })));
const AdCampaignsPage = React.lazy(() => import('../pages/editorial/AdCampaignsPage').then(m => ({ default: m.AdCampaignsPage })));
const SubmissionsModerationPage = React.lazy(() => import('../pages/editorial/SubmissionsModerationPage').then(m => ({ default: m.SubmissionsModerationPage })));

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
        path: 'categoria/:slug',
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
        path: 'buscar',
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
  // Editorial CMS Routes
  {
    path: '/admin',
    element: <Navigate to="/admin/articles" replace />,
  },
  {
    path: '/admin/articles',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ArticlesListPage />
      </Suspense>
    ),
  },
  {
    path: '/admin/articles/new',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ArticleEditorPage />
      </Suspense>
    ),
  },
  {
    path: '/admin/articles/edit/:uuid',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ArticleEditorPage />
      </Suspense>
    ),
  },
  {
    path: '/admin/ads',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdCampaignsPage />
      </Suspense>
    ),
  },
  {
    path: '/admin/submissions',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <SubmissionsModerationPage />
      </Suspense>
    ),
  },
]);
