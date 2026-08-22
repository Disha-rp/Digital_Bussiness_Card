/**
 * React Navigation Type Definitions
 * Typed parameter lists for Auth and App stacks.
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  // Auth Stack
  Login: undefined;

  // Protected App Stack Flow
  MyCards: undefined;
  CreateCard: undefined;
  TemplateSelection: { cardTitle?: string; cardId?: string };
  EditCard: { cardTitle?: string; templateId?: string; cardId?: string };
  Preview: { cardTitle?: string; templateId?: string; cardId?: string };
  Share: { cardTitle?: string; previewUrl?: string; cardId?: string };
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type RouteProps<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;
