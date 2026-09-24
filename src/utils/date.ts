/**
 * LYBERATE — DATE & TIME FORMATTING UTILITIES
 *
 * Centralized formatting functions respecting editorial standards for Contacto con la Noticia.
 * Locale: es-VE
 */

export type DateFormatStyle = 'short' | 'full' | 'withTime';

/**
 * Format a date string (ISO or SQL format 'YYYY-MM-DD HH:MM:SS')
 * into localized editorial Spanish (Venezuela).
 *
 * @param dateStr Date string to format
 * @param style 'short' (default: 15 may 2026), 'full' (viernes, 15 de mayo de 2026, 14:30), or 'withTime' (15 may 2026, 14:30)
 */
export function formatDate(dateStr?: string | null, style: DateFormatStyle = 'short'): string {
  if (!dateStr) return '';

  try {
    // Normalise SQL date 'YYYY-MM-DD HH:MM:SS' to ISO 'YYYY-MM-DDTHH:MM:SS'
    const normalized = dateStr.includes(' ') && !dateStr.includes('T')
      ? dateStr.replace(' ', 'T')
      : dateStr;

    const date = new Date(normalized);

    if (isNaN(date.getTime())) {
      return dateStr;
    }

    if (style === 'full') {
      return new Intl.DateTimeFormat('es-VE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }

    if (style === 'withTime') {
      return new Intl.DateTimeFormat('es-VE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }

    // Default 'short'
    return new Intl.DateTimeFormat('es-VE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Format current date for the newspaper masthead / utility bar.
 * Example: "Miércoles, 23 de septiembre de 2026"
 */
export function formatMastheadDate(date: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

