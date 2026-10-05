import React from 'react';
import { X, Download, Printer, Newspaper } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { formatMastheadDate } from '../../utils/date';

interface PrintEditionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintEditionModal: React.FC<PrintEditionModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useSettings();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-stone-100 rounded-[28px] max-w-3xl w-full shadow-2xl relative my-auto border border-stone-300 overflow-hidden text-stone-900 font-serif">
        {/* Top Modal Controls (Screen Only) */}
        <div className="bg-stone-900 text-white px-5 py-3 flex items-center justify-between font-sans text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <Newspaper className="w-4 h-4 text-rose-400" />
            <span>Kiosco Digital &bull; Portada Impresa Diaria</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Newspaper Front Page Replica */}
        <div className="p-6 sm:p-10 bg-[#FAF7F2] text-stone-900 border-x border-stone-200 print:p-0 print:border-none">
          {/* Newspaper Header */}
          <div className="border-b-4 border-stone-900 pb-3 text-center">
            <div className="flex items-center justify-between text-[11px] font-sans uppercase font-bold text-stone-600 border-b border-stone-400 pb-1 mb-2">
              <span>San Juan de los Morros &bull; Estado Guárico</span>
              <span>Año XXXIV &bull; Edición N° 12.480</span>
              <span>{formatMastheadDate(new Date())}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-stone-950 font-serif my-1">
              {settings.identity.siteName || 'Contacto con la Noticia'}
            </h1>
            <p className="text-xs font-sans tracking-widest uppercase text-stone-600 font-semibold">
              {settings.identity.tagline || 'La verdad y el pulso informativo de los Llanos venezolanos'}
            </p>
          </div>

          <div className="border-b border-stone-400 py-1 flex items-center justify-between text-[10px] font-sans uppercase font-semibold text-stone-500 mb-4">
            <span>Depósito Legal: pp199201GU452</span>
            <span>Edición Matutina &bull; Distribución Nacional</span>
            <span>Precio Sugerido: Bs. 30,00</span>
          </div>

          {/* Main Headline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
            <div className="md:col-span-2 space-y-3">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-rose-800 border-b-2 border-rose-800 pb-0.5">
                Gran Noticia de Portada
              </span>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight text-stone-950">
                Guárico rompe récords de producción agrícola y lidera cosecha nacional de cereales
              </h2>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                Con más de 310 mil hectáreas sembradas entre Calabozo y Valle de la Pascua, los productores llaneros abastecen el 40% del consumo nacional de arroz y maíz. El sector agroindustrial reporta niveles históricos de rendimiento por hectárea gracias a la tecnificación del riego y alianzas gremiales.
              </p>

              {/* Photo box placeholder */}
              <div className="border border-stone-400 bg-stone-200/60 p-2 text-center my-3 rounded-lg">
                <div className="h-44 sm:h-56 bg-stone-300 rounded overflow-hidden flex items-center justify-center text-stone-500 text-xs font-sans font-semibold">
                  <img
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80"
                    alt="Sabanas y campos agrícolas de Guárico"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-sans text-stone-600 italic block mt-1">
                  Vastas plantaciones doradas en el sistema de riego del Río Guárico. Foto: Archivo Gráfico Contacto.
                </span>
              </div>
            </div>

            {/* Side Column Stories */}
            <div className="border-t md:border-t-0 md:border-l border-stone-300 md:pl-5 space-y-4 font-sans">
              <div className="border-b border-stone-300 pb-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Deportes Llaneros</span>
                <h3 className="font-serif font-bold text-sm text-stone-900 mt-1 leading-snug">
                  Llaneros de Guárico avanza a semifinales con triplete en el Domo Olímpico
                </h3>
                <p className="text-[11px] text-stone-600 mt-1 line-clamp-3">
                  Un desenlace de infarto ante más de 4.000 aficionados selló la clasificación histórica en San Juan.
                </p>
              </div>

              <div className="border-b border-stone-300 pb-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Cultura Regional</span>
                <h3 className="font-serif font-bold text-sm text-stone-900 mt-1 leading-snug">
                  47° Festival de la Panoja de Oro reúne a 60 copleros en Valle de la Pascua
                </h3>
                <p className="text-[11px] text-stone-600 mt-1 line-clamp-3">
                  El joropo y el contrapunteo tradicional vibran en la capital del municipio Leonardo Infante.
                </p>
              </div>

              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Educación & Futuro</span>
                <h3 className="font-serif font-bold text-sm text-stone-900 mt-1 leading-snug">
                  UNERG abre 800 cupos en Ciencias de la Salud y Agronomía
                </h3>
                <p className="text-[11px] text-stone-600 mt-1 line-clamp-3">
                  Nuevos laboratorios y residencias estudiantiles listas para el próximo semestre.
                </p>
              </div>
            </div>
          </div>

          {/* Barcode and Footer */}
          <div className="border-t-2 border-stone-900 pt-3 flex flex-wrap items-center justify-between text-stone-500 text-[10px] font-sans">
            <div>
              <span className="font-bold text-stone-800">www.contactoconlanoticia.com</span>
              <span className="mx-2">&bull;</span>
              <span>Todos los derechos reservados &copy; {new Date().getFullYear()}</span>
            </div>
            <div className="font-mono text-stone-400 tracking-widest text-[9px]">
              ||||| | |||| ||| ||||||| | ||||| 12480-VE
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="bg-stone-200/80 px-6 py-3 border-t border-stone-300 flex items-center justify-between font-sans text-xs">
          <span className="text-stone-600">
            ¿Deseas guardar una copia en alta calidad para archivo o impresión?
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Versión Imprimible</span>
          </button>
        </div>
      </div>
    </div>
  );
};
