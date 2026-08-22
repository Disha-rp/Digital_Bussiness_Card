/**
 * Design System Color Palette & Tokens
 * Curated HSL-derived palette with dark-first surfaces, vibrant accents, and translucent overlays.
 */

export const colors = {
  // Brand Primary & Accents
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primaryGlow: 'rgba(99, 102, 241, 0.25)',

  // Secondary & Accents
  secondary: '#06B6D4', // Cyan
  secondaryLight: '#22D3EE',
  secondaryDark: '#0891B2',
  secondaryGlow: 'rgba(6, 182, 212, 0.25)',

  accent: '#EC4899', // Pink
  accentLight: '#F472B6',
  accentDark: '#DB2777',

  // Status & Feedback Tokens
  success: '#10B981', // Emerald
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B', // Amber
  warningLight: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444', // Rose
  errorLight: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6', // Blue
  infoLight: 'rgba(59, 130, 246, 0.15)',

  // Dark Theme Surfaces
  background: '#090D16',
  backgroundElevated: '#0F172A',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  surfaceGlass: 'rgba(17, 24, 39, 0.85)',
  surfaceGlassLight: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderElevated: 'rgba(255, 255, 255, 0.15)',
  borderActive: 'rgba(99, 102, 241, 0.5)',
  borderGlow: 'rgba(99, 102, 241, 0.4)',

  // Light Mode Fallback Tokens
  lightBackground: '#F8FAFC',
  lightSurface: '#FFFFFF',
  lightBorder: 'rgba(0, 0, 0, 0.08)',

  // Neutral Typography
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#111827',

  // Curated Gradient Palettes
  gradients: {
    primary: ['#6366F1', '#8B5CF6', '#EC4899'] as [string, string, string],
    cyanIndigo: ['#06B6D4', '#3B82F6', '#6366F1'] as [string, string, string],
    sunset: ['#F59E0B', '#EC4899', '#8B5CF6'] as [string, string, string],
    modernDark: ['#0B0F19', '#111827', '#1E293B'] as [string, string, string],
    executiveNavy: ['#0A192F', '#0F2744', '#1E3A8A'] as [string, string, string],
    vibrantPink: ['#4C1D95', '#7C3AED', '#DB2777'] as [string, string, string],
    glassOverlay: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)'] as [string, string],
  },
};
