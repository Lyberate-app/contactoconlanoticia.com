/**
 * LYBERATE — WORDPRESS HISTORIC CONNECTOR
 *
 * Resilient decoupled integration service for querying the external legacy
 * WordPress archive without mass migration.
 *
 * Directives:
 * - Read-only external archive query.
 * - Circuit breaker with 5000ms timeout via AbortController.
 * - 2-tier caching (in-memory Map + localStorage 1h TTL).
 * - Never breaks the main portal if WordPress is down (graceful degradation).
 * - Explicit status: READY_FOR_BACKEND / ONLINE / DEGRADED.
 */

import type {
  WordPressHistoricArticle,
  WordPressHistoricQuery,
  WordPressConnectorStatus,
  WordPressHistoricResponse,
  WordPressConnectorState,
} from '../types/wordpress';

const WP_API_ENDPOINT =
  import.meta.env.VITE_WP_LEGACY_ENDPOINT ||
  'https://archivo.contactoconlanoticia.com/wp-json/wp/v2';
const TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 3600000; // 1 hour
const MAX_FAILURES_BEFORE_OPEN = 3;
const CIRCUIT_RESET_MS = 60000; // 1 minute cooldown

// Curated Guárico Historical Hemeroteca Fallback
const FALLBACK_HISTORICAL_ARTICLES: WordPressHistoricArticle[] = [
  {
    id: 10401,
    slug: 'inauguran-sistema-de-riego-rio-guarico-recuento-historico',
    title: 'Hemeroteca: Sistema de Riego Río Guárico y su impacto agroproductivo en Calabozo',
    excerpt: 'Archivo histórico 2018: Crónica sobre el desarrollo hidráulico y la producción arrocera en los llanos centrales venezolanos.',
    content: '<p>Reportaje histórico especial sobre los canales de distribución de agua y la cosecha cerealera en el municipio Francisco de Miranda.</p>',
    date: '2018-05-14T10:30:00Z',
    author_name: 'Redacción Histórica',
    categories: ['Regionales', 'Economía', 'Hemeroteca'],
    tags: ['Calabozo', 'Riego', 'Agricultura', 'Guárico'],
    featured_image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=500&fit=crop&q=80',
    canonical_url: 'https://archivo.contactoconlanoticia.com/2018/05/14/inauguran-sistema-de-riego-rio-guarico-recuento-historico/',
    is_external_archive: true,
    archive_source: 'wordpress_legacy',
  },
  {
    id: 10402,
    slug: 'san-juan-de-los-morros-patrimonio-aguas-termales-hemeroteca',
    title: 'Crónica de Archivo: Los Baños Termales y el símbolo natural de San Juan de los Morros',
    excerpt: 'Archivo histórico 2019: Reseña de interés turístico sobre los morros cretácicos y las fuentes mineromedicinales.',
    content: '<p>Documentación patrimonial de la capital guariqueña y la afluencia de visitantes a las piscinas termales.</p>',
    date: '2019-11-20T14:15:00Z',
    author_name: 'Alexis Valderrama',
    categories: ['Turismo', 'Comunidades', 'Hemeroteca'],
    tags: ['San Juan de los Morros', 'Termales', 'Turismo'],
    featured_image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=500&fit=crop&q=80',
    canonical_url: 'https://archivo.contactoconlanoticia.com/2019/11/20/san-juan-de-los-morros-patrimonio-aguas-termales-hemeroteca/',
    is_external_archive: true,
    archive_source: 'wordpress_legacy',
  },
  {
    id: 10403,
    slug: 'tradiciones-del-llano-cantos-de-ordeo-declarados-patrimonio',
    title: 'Archivo Cultural: Los cantos de arreo y ordeño en las sabanas del Guárico profundo',
    excerpt: 'Archivo histórico 2020: Análisis etnográfico sobre la memoria oral y las faenas campesinas en los hatos de El Sombrero y Valle de la Pascua.',
    content: '<p>Investigación antropológica y cultural sobre las expresiones inmateriales del hombre llanero.</p>',
    date: '2020-03-08T09:00:00Z',
    author_name: 'María Alejandra Morales',
    categories: ['Cultura', 'Regionales', 'Hemeroteca'],
    tags: ['Folklore', 'Valle de la Pascua', 'El Sombrero'],
    featured_image_url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&h=500&fit=crop&q=80',
    canonical_url: 'https://archivo.contactoconlanoticia.com/2020/03/08/tradiciones-del-llano-cantos-de-ordeo-declarados-patrimonio/',
    is_external_archive: true,
    archive_source: 'wordpress_legacy',
  },
];

// In-memory cache
const memoryCache = new Map<string, { timestamp: number; data: WordPressHistoricResponse }>();

class WordPressConnector {
  private failures = 0;
  private circuitOpen = false;
  private lastFailureTime = 0;

  public getState(): WordPressConnectorState {
    const isCoolingDown =
      this.circuitOpen && Date.now() - this.lastFailureTime < CIRCUIT_RESET_MS;
    const status: WordPressConnectorStatus = this.circuitOpen
      ? isCoolingDown
        ? 'DEGRADED'
        : 'READY_FOR_BACKEND'
      : 'ONLINE';

    return {
      status,
      lastChecked: new Date().toISOString(),
      consecutiveFailures: this.failures,
      circuitBreakerOpen: this.circuitOpen,
      endpointUrl: WP_API_ENDPOINT,
      timeoutMs: TIMEOUT_MS,
    };
  }

  public async checkHealth(): Promise<WordPressConnectorStatus> {
    const state = this.getState();
    return state.status;
  }

  public async queryArchive(
    query: WordPressHistoricQuery & { category?: string } = {}
  ): Promise<WordPressHistoricResponse> {
    return this.searchHistoricArticles(query);
  }

  public async searchHistoricArticles(
    query: WordPressHistoricQuery = {}
  ): Promise<WordPressHistoricResponse> {
    const cacheKey = JSON.stringify(query);

    // 1. Check in-memory cache
    const memEntry = memoryCache.get(cacheKey);
    if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL_MS) {
      return { ...memEntry.data, fromCache: true };
    }

    // 2. Check localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`wp_cache_${cacheKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            memoryCache.set(cacheKey, parsed);
            return { ...parsed.data, fromCache: true };
          }
        }
      } catch {
        // Fallthrough
      }
    }

    // 3. Check Circuit Breaker
    if (this.circuitOpen) {
      if (Date.now() - this.lastFailureTime > CIRCUIT_RESET_MS) {
        // Attempt Half-Open retry
        this.circuitOpen = false;
      } else {
        // Fast-fail to fallback hemeroteca
        return this.getFallbackResponse(query, 'DEGRADED');
      }
    }

    // 4. Remote Fetch with strict 5000ms AbortController timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const params = new URLSearchParams();
      if (query.search) params.set('search', query.search);
      if (query.page) params.set('page', String(query.page));
      if (query.per_page) params.set('per_page', String(query.per_page));
      params.set('_embed', 'true');

      const url = `${WP_API_ENDPOINT}/posts?${params.toString()}`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`WordPress API returned HTTP ${response.status}`);
      }

      const rawPosts = await response.json();
      const totalHeader = response.headers.get('X-WP-Total');
      const totalPagesHeader = response.headers.get('X-WP-TotalPages');

      const articles: WordPressHistoricArticle[] = Array.isArray(rawPosts)
        ? rawPosts.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            title: p.title?.rendered || 'Sin titular',
            excerpt: (p.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim(),
            content: p.content?.rendered,
            date: p.date,
            modified: p.modified,
            author_name: p._embedded?.author?.[0]?.name || 'Redacción Histórica',
            categories: (p._embedded?.['wp:term']?.[0] || []).map((t: any) => t.name),
            tags: (p._embedded?.['wp:term']?.[1] || []).map((t: any) => t.name),
            featured_image_url:
              p._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
            canonical_url: p.link || `https://archivo.contactoconlanoticia.com/${p.slug}`,
            is_external_archive: true,
            archive_source: 'wordpress_legacy',
          }))
        : [];

      const result: WordPressHistoricResponse = {
        articles,
        total: totalHeader ? parseInt(totalHeader, 10) : articles.length,
        totalPages: totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1,
        page: query.page || 1,
        sourceStatus: 'ONLINE',
        status: 'ONLINE',
        fromCache: false,
      };

      // Reset circuit breaker on success
      this.failures = 0;
      this.circuitOpen = false;

      // Cache result
      this.writeCache(cacheKey, result);

      return result;
    } catch (err) {
      clearTimeout(timer);
      this.recordFailure();
      return this.getFallbackResponse(query, 'DEGRADED');
    }
  }

  private recordFailure() {
    this.failures += 1;
    this.lastFailureTime = Date.now();
    if (this.failures >= MAX_FAILURES_BEFORE_OPEN) {
      this.circuitOpen = true;
    }
  }

  private writeCache(key: string, data: WordPressHistoricResponse) {
    const entry = { timestamp: Date.now(), data };
    memoryCache.set(key, entry);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`wp_cache_${key}`, JSON.stringify(entry));
      } catch {
        // quota exceeded fallback
      }
    }
  }

  private getFallbackResponse(
    query: WordPressHistoricQuery,
    status: WordPressConnectorStatus
  ): WordPressHistoricResponse {
    let list = [...FALLBACK_HISTORICAL_ARTICLES];
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return {
      articles: list,
      total: list.length,
      totalPages: 1,
      page: query.page || 1,
      sourceStatus: status,
      status,
      fromCache: true,
    };
  }
}

export const wordpressConnector = new WordPressConnector();
