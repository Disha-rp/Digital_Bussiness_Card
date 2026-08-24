/**
 * Digital Business Card Presentation Template Models
 */

export type CardTemplateId =
  | 'professional'
  | 'modern'
  | 'minimal'
  | 'modern_minimal'
  | 'corporate_executive'
  | 'vibrant_glass'
  | 'minimal_mono'
  | 'creative_designer';

export interface CardTemplateStyle {
  gradientColors: [string, string, ...string[]];
  textColor: string;
  subtextColor: string;
  accentColor: string;
  cardBackground: string;
  borderColor: string;
  badgeBackground: string;
  chipBackground: string;
  isDark: boolean;
}

export interface CardTemplate {
  id: CardTemplateId;
  name: string;
  description: string;
  style: CardTemplateStyle;
  // Optional QRTRAC QR Code visual template mapping
  qrtracTemplateId?: string;
  tags: string[];
}
