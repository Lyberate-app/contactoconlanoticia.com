import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, RotateCcw } from 'lucide-react';

import { stripMarkdown } from '../../utils/markdownRenderer';

interface AudioNewsPlayerProps {
  title: string;
  content: string;
  excerpt?: string;
}

export const AudioNewsPlayer: React.FC<AudioNewsPlayerProps> = ({ title, content, excerpt }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [rate, setRate] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean raw markdown characters from speech text
  const cleanSpeechText = (text: string) => {
    return stripMarkdown(text);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Look for natural Spanish voices
      const spanishVoice = voices.find(
        (v) => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Sabina') || v.name.includes('Jorge') || v.lang === 'es-VE' || v.lang === 'es-ES' || v.lang === 'es-MX')
      ) || voices.find((v) => v.lang.startsWith('es'));

      if (spanishVoice) {
        setSelectedVoice(spanishVoice);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayToggle = () => {
    if (!isSupported) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    // Start fresh speech
    window.speechSynthesis.cancel();

    const fullNarration = `${title}. ${excerpt ? excerpt + '. ' : ''}${cleanSpeechText(content)}`;
    const utterance = new SpeechSynthesisUtterance(fullNarration);
    utteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = 'es-ES';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleRestart = () => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setTimeout(() => {
      handlePlayToggle();
    }, 100);
  };

  const handleSpeedCycle = () => {
    const rates = [0.8, 1.0, 1.25, 1.5];
    const nextIdx = (rates.indexOf(rate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setRate(nextRate);

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setTimeout(() => {
        handlePlayToggle();
      }, 100);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="my-6 rounded-2xl border border-stone-200/80 bg-gradient-to-r from-stone-50 via-rose-50/20 to-white p-3.5 sm:p-4 shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left info badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-stone-900 tracking-tight">
                Escuchar esta noticia
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                Audiolector IA
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Locución sintetizada en español para escuchar en movimiento
            </p>
          </div>
        </div>

        {/* Right audio controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Animated equalizer waves when playing */}
          {isPlaying && (
            <div className="flex items-center gap-0.5 h-4 px-2" title="Reproduciendo">
              <span className="w-0.5 h-3 bg-rose-600 rounded-full animate-pulse" />
              <span className="w-0.5 h-4 bg-rose-800 rounded-full animate-bounce" />
              <span className="w-0.5 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="w-0.5 h-3.5 bg-rose-700 rounded-full animate-bounce" />
            </div>
          )}

          {/* Speed button */}
          <button
            type="button"
            onClick={handleSpeedCycle}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="Velocidad de reproducción"
          >
            {rate}x
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleRestart}
            className="p-2 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="Reiniciar locución desde el inicio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause main button */}
          <button
            type="button"
            onClick={handlePlayToggle}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-900 hover:bg-rose-950'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reproducir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
