/**
 * LYBERATE — WHITE-LABEL & SYSTEM BRANDING SETTINGS TYPES
 *
 * Comprehensive contracts for multi-tenant and white-label customization:
 * PWA, logos, color tokens, typography, social channels, and portal layout.
 */

export interface BrandIdentitySettings {
  siteName: string;
  shortName: string;
  tagline: string;
  historicSubtitle: string;
  editionName: string;
  centralLocation: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  copyrightText: string;
  showLyberateBadge: boolean;
}

export interface BrandLogoSettings {
  headerLogoUrl: string; // If empty, renders styled newspaper masthead text
  headerLogoHeight: number; // in pixels (e.g. 48)
  headerLogoDarkUrl?: string; // Inverted logo for dark backgrounds
  footerLogoUrl?: string;
  faviconUrl: string;
  ogFallbackImageUrl: string;
  editorialWatermarkUrl?: string;
}

export interface ThemeColorsSettings {
  primary: string; // Main brand color (buttons, masthead accents, active links)
  primaryHover: string;
  accent: string; // Breaking news badge, highlights, callouts
  topBarBg: string; // Utility bar background
  topBarText: string;
  navBg: string; // Main navigation bar background
  navText: string;
  pageBg: string; // Portal body background
  mastheadBg: string; // Masthead container background
  mastheadText: string; // Masthead main title color
  cardBg: string; // News card background
}

export interface TypographySettings {
  headingFont: string; // Headline font (e.g. "Merriweather", "Lora", "Playfair Display", "Cinzel", "PT Serif", "Georgia")
  bodyFont: string; // Interface and paragraph font (e.g. "Inter", "Plus Jakarta Sans", "Roboto", "Montserrat", "Open Sans")
  headingWeight: '600' | '700' | '800' | '900';
  scale: 'compact' | 'normal' | 'spacious';
}

export interface PwaShortcut {
  name: string;
  shortName: string;
  description: string;
  url: string;
  icon?: string;
}

export interface PwaSettings {
  appName: string; // Name on mobile install prompt
  shortName: string; // Label under home screen icon (max 12 chars)
  description: string;
  themeColor: string; // Mobile browser address bar & status bar
  backgroundColor: string; // Splash screen background
  startUrl: string;
  display: 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser';
  orientation: 'portrait-primary' | 'any' | 'landscape';
  icon192Url: string;
  icon512Url: string;
  iconMaskableUrl: string;
  iconSvgUrl: string;
  shortcuts?: PwaShortcut[];
}

export interface SocialLinksSettings {
  twitterSite: string; // e.g. "@contactonoticia"
  twitterUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  whatsappChannelUrl: string;
  telegramChannelUrl: string;
  youtubeUrl: string;
}

export interface PortalFeaturesSettings {
  showBreakingNewsTicker: boolean;
  showWeatherWidget: boolean;
  showCitizenSubmissionButton: boolean;
  showSocialShareButtons: boolean;
  mastheadLayout: 'classic_double_rule' | 'modern_centered' | 'clean_compact';
}

export interface WhiteLabelConfig {
  id: string;
  tenantName: string;
  version: string;
  updatedAt: string;
  identity: BrandIdentitySettings;
  logos: BrandLogoSettings;
  colors: ThemeColorsSettings;
  typography: TypographySettings;
  pwa: PwaSettings;
  social: SocialLinksSettings;
  features: PortalFeaturesSettings;
}

export type WhiteLabelPresetId =
  | 'contacto_default'
  | 'classic_navy'
  | 'modern_crimson'
  | 'forest_emerald'
  | 'warm_amber';

export interface WhiteLabelPreset {
  id: WhiteLabelPresetId;
  name: string;
  description: string;
  config: Partial<WhiteLabelConfig>;
}

