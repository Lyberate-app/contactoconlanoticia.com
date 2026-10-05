import React, { useState } from 'react';
import { CloudSun, TrendingUp, ChevronDown } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface CityWeather {
  city: string;
  state: string;
  temp: string;
  condition: string;
  humidity: string;
}

const REGIONAL_WEATHER: CityWeather[] = [
  { city: 'San Juan de los Morros', state: 'Guárico', temp: '32°C', condition: 'Parcialmente soleado', humidity: '64%' },
  { city: 'Calabozo', state: 'Guárico', temp: '34°C', condition: 'Cálido y despejado', humidity: '58%' },
  { city: 'Valle de la Pascua', state: 'Guárico', temp: '33°C', condition: 'Soleado con brisa', humidity: '55%' },
  { city: 'Altagracia de Orituco', state: 'Guárico', temp: '30°C', condition: 'Nubosidad parcial', humidity: '70%' },
  { city: 'Zaraza', state: 'Guárico', temp: '33°C', condition: 'Despejado', humidity: '59%' },
];

export const EconomicWeatherBar: React.FC = () => {
  const { settings } = useSettings();
  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const currentWeather = REGIONAL_WEATHER[selectedCityIndex];
  const rates = settings.features.economicRates || {
    bcvRate: '36.85 Bs/$',
    parallelRate: '42.10 Bs/$',
    euroRate: '40.20 Bs/€',
  };

  const showEconomic = settings.features.showEconomicIndicators !== false;
  const showWeather = settings.features.showWeatherWidget !== false;

  if (!showEconomic && !showWeather) return null;

  return (
    <div
      className="border-b border-stone-200/80 bg-stone-50/90 text-stone-700 py-1 px-4 sm:px-6 lg:px-8 text-[11px] font-sans transition-colors"
      style={{
        backgroundColor: settings.colors.topBarBg !== '#ffffff' ? settings.colors.topBarBg : undefined,
        color: settings.colors.topBarText !== '#57534e' ? settings.colors.topBarText : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* Left: Financial & Currency Rates */}
        {showEconomic && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <span className="font-bold text-[10px] uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Indicadores:</span>
            </span>

            {/* Dólar BCV */}
            <div className="inline-flex items-center gap-1 bg-white/80 border border-stone-200/70 px-2 py-0.5 rounded-md shadow-2xs">
              <span className="font-semibold text-stone-600 text-[10px]">BCV:</span>
              <span className="font-bold text-stone-900">{rates.bcvRate}</span>
              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">+0.2%</span>
            </div>

            {/* Dólar Paralelo */}
            <div className="inline-flex items-center gap-1 bg-white/80 border border-stone-200/70 px-2 py-0.5 rounded-md shadow-2xs">
              <span className="font-semibold text-stone-600 text-[10px]">Paralelo:</span>
              <span className="font-bold text-stone-900">{rates.parallelRate}</span>
            </div>

            {/* Euro Oficial */}
            <div className="hidden sm:inline-flex items-center gap-1 bg-white/80 border border-stone-200/70 px-2 py-0.5 rounded-md shadow-2xs">
              <span className="font-semibold text-stone-600 text-[10px]">Euro:</span>
              <span className="font-bold text-stone-900">{rates.euroRate}</span>
            </div>

            {/* Petróleo / Brent */}
            <div className="hidden md:inline-flex items-center gap-1 bg-white/80 border border-stone-200/70 px-2 py-0.5 rounded-md shadow-2xs">
              <span className="font-semibold text-stone-600 text-[10px]">Brent:</span>
              <span className="font-bold text-stone-900">$74.50</span>
            </div>
          </div>
        )}

        {/* Right: Weather Widget */}
        {showWeather && (
          <div className="relative shrink-0 flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md hover:bg-stone-200/50 transition-colors text-stone-700 font-medium cursor-pointer"
              title="Cambiar municipio para el pronóstico del clima"
            >
              <CloudSun className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold text-stone-900">{currentWeather.temp}</span>
              <span className="hidden sm:inline text-stone-500">·</span>
              <span className="hidden sm:inline text-stone-700">{currentWeather.city}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {/* City selector dropdown */}
            {cityDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setCityDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-stone-200 rounded-xl shadow-xl z-40 p-1.5 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                    Estaciones Meteorológicas de Guárico
                  </div>
                  {REGIONAL_WEATHER.map((w, idx) => (
                    <button
                      key={w.city}
                      type="button"
                      onClick={() => {
                        setSelectedCityIndex(idx);
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        selectedCityIndex === idx
                          ? 'bg-rose-50 text-rose-900 font-semibold'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-[11px]">{w.city}</div>
                        <div className="text-[10px] text-stone-400">{w.condition} · Hum. {w.humidity}</div>
                      </div>
                      <span className="font-bold text-stone-900 text-xs">{w.temp}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

