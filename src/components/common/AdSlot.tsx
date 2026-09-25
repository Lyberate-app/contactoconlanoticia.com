import React, { useEffect, useState, useRef } from 'react';
import { getActiveAds, recordAdImpression, recordAdClick, PublicAd } from '../../services/adsApi';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type AdPlacement =
  | 'HEADER_BANNER'
  | 'TOP_NEWS'
  | 'SIDEBAR'
  | 'ARTICLE_TOP'
  | 'ARTICLE_MIDDLE'
  | 'ARTICLE_BOTTOM'
  | 'FOOTER';

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
  fallbackLabel?: string;
  autoPlayInterval?: number;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  placement,
  className = '',
  fallbackLabel,
  autoPlayInterval = 5000,
}) => {
  const [ads, setAds] = useState<PublicAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const recordedImpressions = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    getActiveAds(placement)
      .then((loadedAds) => {
        if (!isMounted) return;
        if (loadedAds && loadedAds.length > 0) {
          setAds(loadedAds);
          // Record impression for the first active ad
          const firstAd = loadedAds[0];
          if (!recordedImpressions.current.has(firstAd.campaign_uuid)) {
            recordAdImpression(firstAd.campaign_uuid).catch(() => {});
            recordedImpressions.current.add(firstAd.campaign_uuid);
          }
        }
        setLoaded(true);
      })
      .catch(() => {
        if (isMounted) setLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [placement]);

  // Automated Slider Interval when multiple ads exist
  useEffect(() => {
    if (ads.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % ads.length;
        const currentAd = ads[next];
        if (currentAd && !recordedImpressions.current.has(currentAd.campaign_uuid)) {
          recordAdImpression(currentAd.campaign_uuid).catch(() => {});
          recordedImpressions.current.add(currentAd.campaign_uuid);
        }
        return next;
      });
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [ads, isHovered, autoPlayInterval]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  if (!loaded || ads.length === 0) {
    if (fallbackLabel) {
      return (
        <div
          className={`my-4 p-4 text-center border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800/40 text-stone-400 text-xs font-mono rounded-xl ${className}`}
        >
          <span className="uppercase tracking-widest text-[10px]">Espacio Publicitario Disponible</span>
          <p className="text-[11px] mt-0.5">{fallbackLabel}</p>
        </div>
      );
    }
    return null;
  }

  // Dimension helpers by placement
  const getSlotContainerClasses = () => {
    switch (placement) {
      case 'HEADER_BANNER':
        return 'max-w-4xl mx-auto my-3';
      case 'TOP_NEWS':
        return 'w-full my-6';
      case 'SIDEBAR':
        return 'w-full my-4';
      case 'ARTICLE_TOP':
      case 'ARTICLE_MIDDLE':
      case 'ARTICLE_BOTTOM':
        return 'max-w-2xl mx-auto my-6';
      case 'FOOTER':
        return 'max-w-5xl mx-auto my-8';
      default:
        return 'w-full my-4';
    }
  };

  const currentAd = ads[currentIndex] || ads[0];

  return (
    <aside
      className={`ad-slot-container relative ${getSlotContainerClasses()} ${className}`}
      aria-label="Espacio publicitario"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[9px] font-mono tracking-widest text-stone-400 dark:text-stone-500 uppercase flex items-center gap-1">
          <span>Publicidad</span>
          {ads.length > 1 && (
            <span className="text-stone-300 dark:text-stone-600 font-sans">
              &bull; Anuncio {currentIndex + 1} de {ads.length}
            </span>
          )}
        </span>

        {ads.length > 1 && (
          <div className="flex items-center gap-1">
            {ads.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-4 bg-amber-500'
                    : 'bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
                }`}
                title={`Ir al anuncio ${idx + 1}`}
                aria-label={`Anuncio ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative group overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50 shadow-xs">
        <a
          href={currentAd.target_url || '#'}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => {
            recordAdClick(currentAd.campaign_uuid).catch(() => {});
          }}
          className="block transition-all duration-300"
          title={currentAd.company_name ? `Anuncio de ${currentAd.company_name}` : 'Publicidad'}
        >
          {currentAd.media_url ? (
            <div className="relative overflow-hidden">
              <img
                src={currentAd.media_url}
                alt={currentAd.media_alt || currentAd.campaign_name || 'Anuncio publicitario'}
                loading="lazy"
                className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          ) : (
            <div className="p-6 text-center bg-gradient-to-br from-stone-50 via-rose-50/30 to-amber-50/20 text-stone-900 border border-stone-200/60 transition">
              <p className="font-serif text-lg font-bold text-stone-900">{currentAd.company_name}</p>
              <p className="text-xs text-stone-600 mt-1">{currentAd.campaign_name}</p>
              <span className="inline-block mt-3 text-xs bg-rose-800 hover:bg-rose-900 text-white px-4 py-1.5 font-semibold uppercase tracking-wider rounded-full shadow-xs">
                Conocer más &rarr;
              </span>
            </div>
          )}
        </a>

        {/* Carousel Navigation Buttons (Visible when multiple ads exist) */}
        {ads.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer shadow-md"
              title="Anuncio anterior"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer shadow-md"
              title="Siguiente anuncio"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
};
