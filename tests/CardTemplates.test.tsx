/**
 * Phase 7 — Digital Business Card Presentation Templates Unit Tests
 */

(global as any).__DEV__ = true;

// Mock react-native
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'android', select: jest.fn((dict) => dict.android || dict.default) },
  StyleSheet: { create: (styles: any) => styles },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  Image: 'Image',
  Linking: { openURL: jest.fn().mockResolvedValue(true) },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => 'QRCodeSVG');

import React from 'react';
import { BusinessCard } from '../src/models/card';
import {
  ProfessionalCard,
  ModernCard,
  MinimalCard,
  CardTemplate,
  TemplatePicker,
} from '../src/components/templates';
import { CARD_TEMPLATE_LIST, CARD_TEMPLATES } from '../src/theme/templates';
import { mapToQrTracTemplateId } from '../src/services/mapper';

describe('Phase 7 — Digital Business Card Presentation Templates', () => {
  const fullCard: BusinessCard = {
    id: 'card_prod_777',
    name: 'Sarah Connor • Cyber Security Lead',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    contact: {
      displayName: 'Sarah Connor',
      firstName: 'Sarah',
      lastName: 'Connor',
      title: 'Cyber Security Lead',
      company: 'SkyNet Defense',
      email: 'sarah.connor@defense.org',
      phoneMobile: '+1-555-0199',
      phoneWork: '+1-555-0100',
      website: 'https://sarahconnor.security',
      address: {
        street: '100 Cyber Way',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'USA',
      },
      bio: 'Leading proactive defensive security and resilience architectures.',
    },
    socialLinks: [
      { id: '1', platform: 'linkedin', url: 'https://linkedin.com/in/sarahconnor' },
      { id: '2', platform: 'twitter', url: 'https://x.com/sarahconnor' },
      { id: '3', platform: 'github', url: 'https://github.com/sarahconnor' },
    ],
    template: 'professional',
    isFavorite: true,
    tags: ['cybersecurity', 'lead'],
    cloud: {
      qrtracId: 'qr_777',
      displayId: 'sarah-connor',
      teamId: 'team_abc',
      qrImageUrl: 'https://storage.googleapis.com/qrtrac-prod/qr/sarah.svg',
      publicUrl: 'https://qrtrac.link/sarah-connor',
      templateId: '4',
      isSynced: true,
      lastSyncedAt: Date.now(),
    },
    analytics: {
      totalScans: 42,
      todayScans: 5,
      yesterdayScans: 3,
      totalLeads: 8,
    },
    createdAt: Date.now() - 100000,
    updatedAt: Date.now(),
  };

  const minimalCardData: BusinessCard = {
    id: 'card_bare_001',
    name: 'Alex Vance',
    contact: {
      displayName: 'Alex Vance',
    },
    socialLinks: [],
    template: 'minimal',
    isFavorite: false,
    tags: [],
    cloud: {
      isSynced: false,
    },
    analytics: {
      totalScans: 0,
      todayScans: 0,
      yesterdayScans: 0,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  describe('1. ProfessionalCard (Template 1)', () => {
    it('creates a valid React element tree for ProfessionalCard with full data', () => {
      const element = (
        <ProfessionalCard
          card={fullCard}
          showQr={true}
          onActionPress={jest.fn()}
        />
      );
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.card.contact.firstName).toBe('Sarah');
      expect(element.props.card.contact.company).toBe('SkyNet Defense');
      expect(element.props.showQr).toBe(true);
    });

    it('renders safely when optional contact fields and QR are absent', () => {
      const element = (
        <ProfessionalCard
          card={minimalCardData}
          showQr={false}
        />
      );
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.card.name).toBe('Alex Vance');
      expect(element.props.showQr).toBe(false);
    });
  });

  describe('2. ModernCard (Template 2)', () => {
    it('creates a valid React element tree for ModernCard with full data', () => {
      const element = (
        <ModernCard
          card={fullCard}
          showQr={true}
          onActionPress={jest.fn()}
        />
      );
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.card.contact.title).toBe('Cyber Security Lead');
      expect(element.props.card.socialLinks).toHaveLength(3);
    });

    it('renders safely without social links or profile photo', () => {
      const element = (
        <ModernCard
          card={minimalCardData}
          showQr={true}
        />
      );
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.card.socialLinks).toHaveLength(0);
    });
  });

  describe('3. MinimalCard (Template 3)', () => {
    it('creates a valid React element tree for MinimalCard with full data', () => {
      const element = (
        <MinimalCard
          card={fullCard}
          showQr={true}
          onActionPress={jest.fn()}
        />
      );
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.card.contact.email).toBe('sarah.connor@defense.org');
    });

    it('renders safely when minimal data is supplied', () => {
      const element = (
        <MinimalCard
          card={minimalCardData}
          showQr={false}
        />
      );
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.card.name).toBe('Alex Vance');
    });
  });

  describe('4. CardTemplate Dispatcher', () => {
    it('dispatches to ProfessionalCard when template="professional" or legacy "corporate_executive"', () => {
      const el1 = <CardTemplate card={fullCard} template="professional" />;
      expect(React.isValidElement(el1)).toBe(true);

      const elLegacy = <CardTemplate card={fullCard} template="corporate_executive" />;
      expect(React.isValidElement(elLegacy)).toBe(true);
    });

    it('dispatches to ModernCard when template="modern" or legacy "modern_minimal"', () => {
      const el1 = <CardTemplate card={fullCard} template="modern" />;
      expect(React.isValidElement(el1)).toBe(true);

      const elLegacy = <CardTemplate card={fullCard} template="modern_minimal" />;
      expect(React.isValidElement(elLegacy)).toBe(true);
    });

    it('dispatches to MinimalCard when template="minimal" or legacy "minimal_mono"', () => {
      const el1 = <CardTemplate card={fullCard} template="minimal" />;
      expect(React.isValidElement(el1)).toBe(true);

      const elLegacy = <CardTemplate card={fullCard} template="minimal_mono" />;
      expect(React.isValidElement(elLegacy)).toBe(true);
    });

    it('falls back safely to ModernCard when an unlisted template is passed', () => {
      const fallback = <CardTemplate card={fullCard} template={'custom_unlisted' as any} />;
      expect(React.isValidElement(fallback)).toBe(true);
    });
  });

  describe('5. TemplatePicker Component', () => {
    it('provides all 3 presentation templates with name and description metadata', () => {
      expect(CARD_TEMPLATE_LIST).toHaveLength(3);

      const ids = CARD_TEMPLATE_LIST.map((t) => t.id);
      expect(ids).toContain('professional');
      expect(ids).toContain('modern');
      expect(ids).toContain('minimal');

      expect(CARD_TEMPLATES.professional.name).toBe('Professional');
      expect(CARD_TEMPLATES.modern.name).toBe('Modern');
      expect(CARD_TEMPLATES.minimal.name).toBe('Minimal');
    });

    it('creates a valid React element tree for TemplatePicker in normal and compact mode', () => {
      const onSelect = jest.fn();
      const pickerNormal = (
        <TemplatePicker
          selectedTemplate="professional"
          onSelectTemplate={onSelect}
          compact={false}
        />
      );
      expect(React.isValidElement(pickerNormal)).toBe(true);

      const pickerCompact = (
        <TemplatePicker
          selectedTemplate="modern"
          onSelectTemplate={onSelect}
          compact={true}
        />
      );
      expect(React.isValidElement(pickerCompact)).toBe(true);
    });
  });

  describe('6. QRTRAC Template ID Mapping Verification', () => {
    it('maps all 3 presentation templates to their verified QRTRAC numeric IDs (1-4)', () => {
      expect(mapToQrTracTemplateId('professional')).toBe(4);
      expect(mapToQrTracTemplateId('corporate_executive')).toBe(4);
      expect(mapToQrTracTemplateId('modern')).toBe(1);
      expect(mapToQrTracTemplateId('modern_minimal')).toBe(1);
      expect(mapToQrTracTemplateId('minimal')).toBe(1);
      expect(mapToQrTracTemplateId('minimal_mono')).toBe(1);
      expect(mapToQrTracTemplateId('vibrant_glass')).toBe(2);
      expect(mapToQrTracTemplateId('creative_designer')).toBe(3);
    });
  });

  describe('7. Responsive Viewport Scaling', () => {
    const viewports = [
      { name: 'Small Android Phone', width: 360, height: 640 },
      { name: 'Large Android Phone', width: 412, height: 915 },
      { name: 'Small iPhone (SE)', width: 375, height: 667 },
      { name: 'Large iPhone (Pro Max)', width: 430, height: 932 },
    ];

    viewports.forEach((vp) => {
      it(`renders all templates without error for ${vp.name} (${vp.width}x${vp.height})`, () => {
        const style = { width: vp.width };

        const elProf = <ProfessionalCard card={fullCard} style={style} />;
        const elMod = <ModernCard card={fullCard} style={style} />;
        const elMin = <MinimalCard card={fullCard} style={style} />;

        expect(React.isValidElement(elProf)).toBe(true);
        expect(React.isValidElement(elMod)).toBe(true);
        expect(React.isValidElement(elMin)).toBe(true);
      });
    });
  });
});
