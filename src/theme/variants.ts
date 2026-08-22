/**
 * Component Variants Tokens (Buttons, Inputs, Badges)
 */

import { ViewStyle, TextStyle } from 'react-native';
import { colors } from './colors';
import { borderRadius } from './borderRadius';
import { spacing } from './spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonVariantStyle {
  container: ViewStyle;
  text: TextStyle;
}

export const buttonVariants: Record<ButtonVariant, (disabled?: boolean) => ButtonVariantStyle> = {
  primary: (disabled) => ({
    container: {
      backgroundColor: disabled ? colors.surfaceElevated : colors.primary,
      borderWidth: 0,
      opacity: disabled ? 0.6 : 1,
    },
    text: {
      color: '#FFFFFF',
    },
  }),

  secondary: (disabled) => ({
    container: {
      backgroundColor: disabled ? colors.surfaceElevated : colors.secondary,
      borderWidth: 0,
      opacity: disabled ? 0.6 : 1,
    },
    text: {
      color: '#FFFFFF',
    },
  }),

  outline: (disabled) => ({
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: disabled ? colors.border : colors.primary,
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      color: disabled ? colors.textMuted : colors.primaryLight,
    },
  }),

  ghost: (disabled) => ({
    container: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      color: disabled ? colors.textMuted : colors.textPrimary,
    },
  }),

  danger: (disabled) => ({
    container: {
      backgroundColor: disabled ? colors.surfaceElevated : colors.error,
      borderWidth: 0,
      opacity: disabled ? 0.6 : 1,
    },
    text: {
      color: '#FFFFFF',
    },
  }),
};

export const buttonSizes: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
    },
  },
  md: {
    container: {
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
    },
    text: {
      fontSize: 14,
      fontWeight: '600',
    },
  },
  lg: {
    container: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
    },
    text: {
      fontSize: 16,
      fontWeight: '700',
    },
  },
};

export type InputVariant = 'default' | 'filled' | 'outline' | 'error' | 'focused';

export interface InputVariantStyle {
  container: ViewStyle;
  input: TextStyle;
}

export const inputVariants: Record<InputVariant, InputVariantStyle> = {
  default: {
    container: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      minHeight: 48,
    },
    input: {
      color: colors.textPrimary,
      fontSize: 14,
    },
  },
  filled: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: 'transparent',
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      minHeight: 48,
    },
    input: {
      color: colors.textPrimary,
      fontSize: 14,
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      minHeight: 48,
    },
    input: {
      color: colors.textPrimary,
      fontSize: 14,
    },
  },
  focused: {
    container: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      minHeight: 48,
    },
    input: {
      color: colors.textPrimary,
      fontSize: 14,
    },
  },
  error: {
    container: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1.5,
      borderColor: colors.error,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      minHeight: 48,
    },
    input: {
      color: colors.textPrimary,
      fontSize: 14,
    },
  },
};
