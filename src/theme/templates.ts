/**
 * Digital Business Card Themes Specification
 */

import { CardTemplate, CardTemplateId } from '../models/template';

export const CARD_TEMPLATES: Record<CardTemplateId, CardTemplate> = {
  modern_minimal: {
    id: 'modern_minimal',
    name: 'Modern Minimalist',
    description: 'Sleek dark obsidian with electric cyan accents and razor-sharp typography.',
    style: {
      gradientColors: ['#0B0F19', '#111827', '#1E293B'],
      textColor: '#F8FAFC',
      subtextColor: '#94A3B8',
      accentColor: '#38BDF8',
      cardBackground: '#0F172A',
      borderColor: 'rgba(56, 189, 248, 0.25)',
      badgeBackground: 'rgba(56, 189, 248, 0.15)',
      chipBackground: 'rgba(255, 255, 255, 0.05)',
      isDark: true,
    },
    tags: ['tech', 'minimal', 'modern'],
  },
  corporate_executive: {
    id: 'corporate_executive',
    name: 'Corporate Executive',
    description: 'Royal navy and brushed champagne gold for a prestigious executive presence.',
    style: {
      gradientColors: ['#0A192F', '#0F2744', '#1E3A8A'],
      textColor: '#FDFEFE',
      subtextColor: '#CBD5E1',
      accentColor: '#F59E0B',
      cardBackground: '#0A192F',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      badgeBackground: 'rgba(245, 158, 11, 0.18)',
      chipBackground: 'rgba(245, 158, 11, 0.08)',
      isDark: true,
    },
    tags: ['corporate', 'finance', 'executive'],
  },
  vibrant_glass: {
    id: 'vibrant_glass',
    name: 'Vibrant Glassmorphism',
    description: 'Translucent frosted glass with dynamic sunset/purple gradient mesh.',
    style: {
      gradientColors: ['#4C1D95', '#7C3AED', '#DB2777'],
      textColor: '#FFFFFF',
      subtextColor: '#FCE7F3',
      accentColor: '#F472B6',
      cardBackground: 'rgba(255, 255, 255, 0.12)',
      borderColor: 'rgba(255, 255, 255, 0.25)',
      badgeBackground: 'rgba(255, 255, 255, 0.22)',
      chipBackground: 'rgba(255, 255, 255, 0.15)',
      isDark: true,
    },
    tags: ['creative', 'design', 'gradient'],
  },
};

export const CARD_TEMPLATE_LIST: CardTemplate[] = Object.values(CARD_TEMPLATES);
