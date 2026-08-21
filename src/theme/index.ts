/**
 * Application Theme & Design Tokens
 */

export const colors = {
  // Brand
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primaryGlow: 'rgba(99, 102, 241, 0.25)',

  secondary: '#06B6D4', // Cyan
  secondaryLight: '#22D3EE',

  accent: '#EC4899',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Surfaces
  background: '#090D16',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  surfaceGlass: 'rgba(17, 24, 39, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(99, 102, 241, 0.5)',

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};
