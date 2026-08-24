/**
 * Design System Color Palette & Tokens — Comprehensive Light Theme
 * Polished, high-contrast, modern light color system.
 */

export const colors = {
  // Brand Primary & Accents
  primary: '#2563EB', // Royal Blue
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryGlow: 'rgba(37, 99, 235, 0.15)',

  // Secondary & Accents
  secondary: '#0EA5E9', // Sky Cyan
  secondaryLight: '#38BDF8',
  secondaryDark: '#0284C7',
  secondaryGlow: 'rgba(14, 165, 233, 0.15)',

  accent: '#F59E0B', // Amber Gold
  accentLight: '#FBBF24',
  accentDark: '#D97706',

  // Status & Feedback Tokens
  success: '#16A34A', // Emerald
  successLight: 'rgba(22, 163, 74, 0.12)',
  warning: '#F59E0B', // Amber
  warningLight: 'rgba(245, 158, 11, 0.12)',
  error: '#EF4444', // Rose
  errorLight: 'rgba(239, 68, 68, 0.12)',
  info: '#2563EB', // Blue
  infoLight: 'rgba(37, 99, 235, 0.12)',

  // Light Theme Surfaces
  background: '#F8FAFC',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceGlass: 'rgba(255, 255, 255, 0.95)',
  surfaceGlassLight: 'rgba(241, 245, 249, 0.8)',
  border: '#E2E8F0',
  borderElevated: '#CBD5E1',
  borderActive: '#2563EB',
  borderGlow: 'rgba(37, 99, 235, 0.25)',

  // Neutral Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  // Light Sub-accents
  subtleAccent: '#DBEAFE',
  subtleGreen: '#DCFCE7',

  // Curated Gradient Palettes
  gradients: {
    primary: ['#2563EB', '#3B82F6', '#60A5FA'] as [string, string, string],
    cyanIndigo: ['#0EA5E9', '#2563EB', '#1D4ED8'] as [string, string, string],
    sunset: ['#F59E0B', '#EF4444', '#EC4899'] as [string, string, string],
    modernLight: ['#FFFFFF', '#F0F9FF', '#E0F2FE'] as [string, string, string],
    executiveLight: ['#FFFFFF', '#F8FAFC', '#F1F5F9'] as [string, string, string],
    minimalLight: ['#FFFFFF', '#FAFAFA', '#F4F4F5'] as [string, string, string],
    glassOverlay: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)'] as [string, string],
  },
};
