/**
 * Unified Design System Tokens & Exports
 */

import { colors } from './colors';
import { spacing } from './spacing';
import { borderRadius } from './borderRadius';
import { shadows } from './shadows';
import { typography } from './typography';
import { buttonVariants, buttonSizes, inputVariants } from './variants';
import { CARD_TEMPLATES, CARD_TEMPLATE_LIST } from './templates';

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  buttonVariants,
  buttonSizes,
  inputVariants,
  templates: CARD_TEMPLATES,
  templateList: CARD_TEMPLATE_LIST,
};

export * from './colors';
export * from './spacing';
export * from './borderRadius';
export * from './shadows';
export * from './typography';
export * from './variants';
export * from './templates';
