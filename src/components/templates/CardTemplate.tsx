/**
 * Unified Card Presentation Template Selector
 * Dispatches presentation rendering to the selected template component
 * (ProfessionalCard, ModernCard, MinimalCard) while passing the exact same BusinessCard model.
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import { BusinessCard } from '../../models/card';
import { CardTemplateId } from '../../models/template';
import { ProfessionalCard } from './ProfessionalCard';
import { ModernCard } from './ModernCard';
import { MinimalCard } from './MinimalCard';

export interface CardPresentationProps {
  card: BusinessCard;
  showQr?: boolean;
  onActionPress?: (action: 'call' | 'email' | 'website' | 'social', target?: string) => void;
  style?: ViewStyle;
}

export interface CardTemplateProps extends CardPresentationProps {
  template?: CardTemplateId;
}

export const CardTemplate: React.FC<CardTemplateProps> = ({
  card,
  template,
  showQr = true,
  onActionPress,
  style,
}) => {
  const activeTemplate = template || card.template;

  switch (activeTemplate) {
    case 'professional':
    case 'corporate_executive':
      return (
        <ProfessionalCard
          card={card}
          showQr={showQr}
          onActionPress={onActionPress}
          style={style}
        />
      );

    case 'minimal':
    case 'minimal_mono':
      return (
        <MinimalCard
          card={card}
          showQr={showQr}
          onActionPress={onActionPress}
          style={style}
        />
      );

    case 'modern':
    case 'modern_minimal':
    case 'vibrant_glass':
    case 'creative_designer':
    default:
      return (
        <ModernCard
          card={card}
          showQr={showQr}
          onActionPress={onActionPress}
          style={style}
        />
      );
  }
};
