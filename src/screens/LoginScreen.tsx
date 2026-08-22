/**
 * Login & Organization Authentication Screen
 * Truthful to QRTRAC Phase 0 Architecture: Authenticates via Organization API Credentials
 * (Team ID, Client ID, Client Secret) rather than unsupported email/password auth.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store';
import { colors, theme } from '../theme';
import { Button, Input, Card } from '../components';
import { getEnvCredentials } from '../constants';
import { QrTracCredentials } from '../types/qrtrac';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials, status, error, clearAuthError } = useAuth();

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [teamId, setTeamId] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.qrtrac.com/api');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const isAuthenticating = status === 'authenticating';

  // Check if development environment credentials are available
  const [hasDevCredentials, setHasDevCredentials] = useState(false);

  useEffect(() => {
    const devCreds = getEnvCredentials();
    if (devCreds) {
      setHasDevCredentials(true);
    }
  }, []);

  const handlePreFillDevCredentials = () => {
    const devCreds = getEnvCredentials();
    if (devCreds) {
      setClientId(devCreds.clientId);
      setClientSecret(devCreds.clientSecret);
      setTeamId(devCreds.teamId);
      if (devCreds.baseUrl) setBaseUrl(devCreds.baseUrl);
      clearAuthError();
      setValidationErrors({});
    }
  };

  const validateInputs = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!clientId.trim()) {
      errors.clientId = 'Client ID is required';
    }
    if (!clientSecret.trim()) {
      errors.clientSecret = 'Client Secret is required';
    }
    if (!teamId.trim()) {
      errors.teamId = 'Team ID is required';
    }
    if (!baseUrl.trim()) {
      errors.baseUrl = 'Base URL is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConnect = async () => {
    clearAuthError();
    if (!validateInputs()) return;

    const credentials: QrTracCredentials = {
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      teamId: teamId.trim(),
      baseUrl: baseUrl.trim() || 'https://api.qrtrac.com/api',
    };

    await loginWithCredentials(credentials);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="qr-code" size={36} color={colors.primaryLight} />
            </View>
            <Text style={styles.appTitle}>Digital Business Card</Text>
            <View style={styles.badgeContainer}>
              <Ionicons name="shield-checkmark" size={13} color={colors.primaryLight} style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>QRTRAC Organization Gateway</Text>
            </View>
          </View>

          {/* Architecture Callout */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={colors.primaryLight} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              QRTRAC utilizes Organization API credentials to manage team cards, generated QR assets, and contact syncing.
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={colors.error} style={styles.infoIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Credentials Form */}
          <Card style={styles.card} variant="elevated">
            <Text style={styles.formTitle}>Organization Credentials</Text>
            <Text style={styles.formSubtitle}>
              Enter your QRTRAC API credentials to authenticate and access your digital cards.
            </Text>

            {/* Client ID */}
            <Input
              label="Client ID"
              placeholder="e.g. cli_a1b2c3d4..."
              value={clientId}
              onChangeText={(text) => {
                setClientId(text);
                if (validationErrors.clientId) {
                  setValidationErrors((prev) => ({ ...prev, clientId: '' }));
                }
              }}
              leftIcon={<Ionicons name="key-outline" size={18} color={colors.textSecondary} />}
              errorText={validationErrors.clientId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Client Secret */}
            <Input
              label="Client Secret"
              placeholder="e.g. sec_x9y8z7..."
              value={clientSecret}
              onChangeText={(text) => {
                setClientSecret(text);
                if (validationErrors.clientSecret) {
                  setValidationErrors((prev) => ({ ...prev, clientSecret: '' }));
                }
              }}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
              isPassword={true}
              errorText={validationErrors.clientSecret}
              helperText="Encrypted securely on device Keychain / Keystore"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Team ID */}
            <Input
              label="Team ID"
              placeholder="e.g. team_44S2..."
              value={teamId}
              onChangeText={(text) => {
                setTeamId(text);
                if (validationErrors.teamId) {
                  setValidationErrors((prev) => ({ ...prev, teamId: '' }));
                }
              }}
              leftIcon={<Ionicons name="people-outline" size={18} color={colors.textSecondary} />}
              errorText={validationErrors.teamId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Advanced Settings Toggle */}
            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.advancedToggleText}>
                {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
              </Text>
              <Ionicons
                name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {showAdvanced && (
              <View style={styles.advancedSection}>
                <Input
                  label="API Base URL"
                  placeholder="https://api.qrtrac.com/api"
                  value={baseUrl}
                  onChangeText={(text) => {
                    setBaseUrl(text);
                    if (validationErrors.baseUrl) {
                      setValidationErrors((prev) => ({ ...prev, baseUrl: '' }));
                    }
                  }}
                  leftIcon={<Ionicons name="globe-outline" size={18} color={colors.textSecondary} />}
                  errorText={validationErrors.baseUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Sign In / Connect Button */}
            <Button
              title={isAuthenticating ? 'Validating Credentials...' : 'Connect & Sign In'}
              onPress={handleConnect}
              variant="primary"
              size="lg"
              loading={isAuthenticating}
              disabled={isAuthenticating}
              leftIcon={<Ionicons name="lock-closed" size={18} color="#FFFFFF" />}
              style={styles.connectButton}
            />

            {/* Development Quick-Fill Helper */}
            {hasDevCredentials && (
              <TouchableOpacity
                style={styles.devButton}
                onPress={handlePreFillDevCredentials}
                activeOpacity={0.8}
                disabled={isAuthenticating}
              >
                <Ionicons name="flash-outline" size={16} color={colors.secondary} style={{ marginRight: 6 }} />
                <Text style={styles.devButtonText}>Pre-fill Detected Environment Credentials</Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* Footer Guide */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Need API credentials? Obtain them from your QRTRAC web dashboard under{' '}
              <Text style={styles.footerLink}>Settings → API Keys</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    lineHeight: 18,
    fontWeight: '500',
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  advancedToggleText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  advancedSection: {
    marginTop: theme.spacing.xs,
  },
  connectButton: {
    marginTop: theme.spacing.md,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  devButtonText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primaryLight,
    fontWeight: '600',
  },
});
