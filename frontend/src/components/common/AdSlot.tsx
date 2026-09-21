import React, { useEffect, useState, useRef } from 'react';
import { getActiveAds, recordAdImpression, PublicAd } from '../../services/adsApi';

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
}

export const AdSlot: React.FC<AdSlotProps> = ({ placement, className = '', fallbackLabel }) => {
  const [ad, setAd] = useState<PublicAd | null>(null);
  const [loaded, setLoaded] = useState(false);
  const impressionRecorded = useRef(false);

  useEffect(() => {
    let isMounted = true;

    getActiveAds(placement)
      .then((ads) => {
        if (!isMounted) return;
        if (ads && ads.length > 0) {
          // Select an active ad (if multiple, choose the first or random)
          const selected = ads[Math.floor(Math.random() * ads.length)];
          setAd(selected);

          // Record impression once
          if (!impressionRecorded.current) {
            recordAdImpression(selected.campaign_uuid);
            impressionRecorded.current = true;
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

  if (!loaded || !ad) {
    if (fallbackLabel) {
      return (
        <div className={`my-4 p-4 text-center border border-dashed border-stone-300 bg-stone-50/60 text-stone-400 text-xs font-mono rounded-sm ${className}`}>
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

  return (
    <aside
      className={`ad-slot-container ${getSlotContainerClasses()} ${className}`}
      aria-label="Espacio publicitario"
    >
      <div className="text-center mb-1">
        <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase">
          Publicidad
        </span>
      </div>

      <a
        href={`/api/v1/public/ads/${encodeURIComponent(ad.campaign_uuid)}/click`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block group overflow-hidden border border-stone-200 bg-stone-100 hover:border-stone-400 transition-colors shadow-xs"
        title={ad.company_name ? `Anuncio de ${ad.company_name}` : 'Publicidad'}
      >
        {ad.media_url ? (
          <img
            src={ad.media_url}
            alt={ad.media_alt || ad.campaign_name || 'Anuncio publicitario'}
            loading="lazy"
            className="w-full h-auto object-cover group-hover:opacity-95 transition-opacity"
          />
        ) : (
          <div className="p-6 text-center bg-stone-900 text-stone-100 hover:bg-stone-800 transition">
            <p className="font-serif text-lg font-bold">{ad.company_name}</p>
            <p className="text-xs text-stone-300 mt-1">{ad.campaign_name}</p>
            <span className="inline-block mt-3 text-xs bg-red-600 group-hover:bg-red-700 text-white px-3 py-1 font-semibold uppercase tracking-wider">
              Conocer más &rarr;
            </span>
          </div>
        )}
      </a>
    </aside>
  );
};

