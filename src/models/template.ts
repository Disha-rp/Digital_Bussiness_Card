/**
 * Digital Business Card Presentation Template Models
 */

export type CardTemplateId = 'modern_minimal' | 'corporate_executive' | 'vibrant_glass';

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
