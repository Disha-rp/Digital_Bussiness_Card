/**
 * Edit Card Screen
 * Loads and edits the selected QRTRAC card's fields dynamically.
 * Resolves card via route.params.cardId and CardContext.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigationProp, RouteProps } from '../types/navigation';
import { useCards } from '../store';
import { qrService } from '../services/qr.service';
import { BusinessCard } from '../models/card';
import { colors, theme } from '../theme';
import { ErrorState, LoadingIndicator } from '../components';

export const EditCardScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'EditCard'>>();
  const { cards, selectedCard } = useCards();

  const cardId = route.params?.cardId;
  const [resolvedCard, setResolvedCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [website, setWebsite] = useState('');
  const [templateId, setTemplateId] = useState('modern_minimal');

  useEffect(() => {
    let isMounted = true;

    const resolveCard = async () => {
      setLoading(true);
      setError(null);

      let target: BusinessCard | null = null;

      if (cardId) {
        target = cards.find((c) => c.id === cardId) || null;
      }

      if (!target && selectedCard && (!cardId || selectedCard.id === cardId)) {
        target = selectedCard;
      }

      if (!target && cardId) {
        try {
          const res = await qrService.getCard(cardId);
          if (res.success && res.data) {
            target = res.data;
          }
        } catch {
          // handled below
        }
      }

      if (isMounted) {
        if (target) {
          setResolvedCard(target);
          const fullName =
            [target.contact.firstName, target.contact.lastName].filter(Boolean).join(' ') || target.name;
          setName(fullName);
          setRole(target.contact.title || '');
          setCompany(target.contact.company || '');
          setEmail(target.contact.email || '');
          setMobile(target.contact.phoneMobile || '');
          setWebsite(target.contact.website || '');
          setTemplateId(target.template || 'modern_minimal');
        } else {
          setError('Card could not be loaded.');
        }
        setLoading(false);
      }
    };

    resolveCard();

    return () => {
      isMounted = false;
    };
  }, [cardId, cards, selectedCard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Card</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <LoadingIndicator message="Loading card details..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !resolvedCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Card</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <ErrorState
            title="Card Not Found"
            message={error || 'Card could not be loaded.'}
            retryTitle="Return to My Cards"
            onRetry={() => navigation.navigate('MyCards')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} testID="edit-back-btn">
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Card Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Edit Digital Contact</Text>
        <Text style={styles.sectionSub}>Update information for {resolvedCard.name}</Text>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Jane Doe"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Job Title / Role</Text>
          <TextInput
            style={styles.input}
            value={role}
            onChangeText={setRole}
            placeholder="e.g. Product Lead"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Company</Text>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="e.g. Acme Corp"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="e.g. jane@acme.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Mobile Phone</Text>
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="e.g. +1 555-0199"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Website</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            placeholder="e.g. https://acme.com"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('Preview', {
                cardId: resolvedCard.id,
                cardTitle: name,
                templateId,
              })
            }
            testID="generate-preview-btn"
          >
            <Text style={styles.buttonText}>Generate Preview</Text>
            <Ionicons name="eye-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: theme.spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
