/**
 * Create Card Screen (Phase 6)
 * Complete Digital Business Card Creation Form.
 * Integrates:
 * - Template theme from TemplateSelection
 * - Profile photo capture and library selection via ImageService
 * - Contact fields (Full Name, First/Last Name, Title, Company, Email, Mobile, Website, Bio)
 * - Dynamic Social Links Manager (LinkedIn, Instagram, Facebook, X/Twitter, GitHub, YouTube, WhatsApp)
 * - Real-time inline validation
 * - Draft preservation in CardContext
 * - Live QRTRAC VCARD creation via qrService.createCard
 * - On success, immediately routes to Preview with retained QRTRAC ID
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigationProp, RouteProps } from '../types/navigation';
import { useCards } from '../store';
import { qrService } from '../services/qr.service';
import { ImageService } from '../services/image.service';
import { CardEditorDraft } from '../models/card';
import { CardTemplateId } from '../models/template';
import { SocialLink, SocialPlatform, SOCIAL_PLATFORMS } from '../models/social';
import { CARD_TEMPLATES } from '../theme/templates';
import { colors, theme } from '../theme';
import { Avatar } from '../components/Avatar';

interface FormErrors {
  name?: string;
  email?: string;
  phoneMobile?: string;
  website?: string;
  socialUrls?: Record<string, string>;
}

export const CreateCardScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'CreateCard'>>();
  const { editorDraft, updateEditorDraft, clearEditorDraft, addCard } = useCards();

  // Template selected from previous screen or preserved draft
  const initialTemplate: CardTemplateId =
    (route.params?.templateId as CardTemplateId) ||
    editorDraft?.template ||
    'modern_minimal';

  const [template, setTemplate] = useState<CardTemplateId>(initialTemplate);
  const [firstName, setFirstName] = useState(editorDraft?.firstName || '');
  const [lastName, setLastName] = useState(editorDraft?.lastName || '');
  const [name, setName] = useState(editorDraft?.name || '');
  const [designation, setDesignation] = useState(editorDraft?.designation || '');
  const [company, setCompany] = useState(editorDraft?.company || '');
  const [email, setEmail] = useState(editorDraft?.email || '');
  const [phoneMobile, setPhoneMobile] = useState(editorDraft?.phoneMobile || '');
  const [phoneWork, setPhoneWork] = useState(editorDraft?.phoneWork || '');
  const [website, setWebsite] = useState(editorDraft?.website || '');
  const [bio, setBio] = useState(editorDraft?.bio || '');
  const [displayId, setDisplayId] = useState(editorDraft?.displayId || '');
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(editorDraft?.profilePhoto);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(editorDraft?.socialLinks || []);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Sync draft in CardContext so navigating back preserves form values
  useEffect(() => {
    updateEditorDraft({
      name: name.trim() || [firstName, lastName].filter(Boolean).join(' '),
      firstName,
      lastName,
      designation,
      company,
      email,
      phoneMobile,
      phoneWork,
      website,
      bio,
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      notes: '',
      profilePhoto,
      template,
      displayId,
      socialLinks,
      tags: [],
    });
  }, [
    name,
    firstName,
    lastName,
    designation,
    company,
    email,
    phoneMobile,
    phoneWork,
    website,
    bio,
    profilePhoto,
    template,
    displayId,
    socialLinks,
    updateEditorDraft,
  ]);

  // Update full name whenever firstName/lastName change if name wasn't custom typed
  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    const combined = [val, lastName].filter(Boolean).join(' ');
    setName(combined);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleLastNameChange = (val: string) => {
    setLastName(val);
    const combined = [firstName, val].filter(Boolean).join(' ');
    setName(combined);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  // Direct Image Picker Handler for Web & Native
  const handlePickFromLibraryDirect = async () => {
    const res = await ImageService.pickFromLibrary();
    if (res.success && res.uri) {
      setProfilePhoto(res.uri);
    }
  };

  // Image Selection Handler (Action Sheet on Native, Direct Picker on Web)
  const handleChoosePhoto = () => {
    if (Platform.OS === 'web') {
      handlePickFromLibraryDirect();
      return;
    }

    Alert.alert(
      'Profile Photo',
      'Select a photo for your digital business card',
      [
        {
          text: 'Choose from Library',
          onPress: async () => {
            const res = await ImageService.pickFromLibrary();
            if (res.success && res.uri) {
              setProfilePhoto(res.uri);
            }
          },
        },
        {
          text: 'Take Photo',
          onPress: async () => {
            const res = await ImageService.takePhoto();
            if (res.success && res.uri) {
              setProfilePhoto(res.uri);
            }
          },
        },
        profilePhoto
          ? {
              text: 'Remove Photo',
              style: 'destructive',
              onPress: () => setProfilePhoto(undefined),
            }
          : undefined,
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any[]
    );
  };

  // Social Links Management
  const handleAddSocialLink = (platform: SocialPlatform) => {
    const existing = socialLinks.find((s) => s.platform === platform);
    if (existing) {
      Alert.alert('Link Already Added', `You have already added a ${platform} link.`);
      return;
    }
    const newLink: SocialLink = {
      id: `social_${platform}_${Date.now()}`,
      platform,
      url: '',
    };
    setSocialLinks((prev) => [...prev, newLink]);
  };

  const handleUpdateSocialLink = (id: string, url: string) => {
    setSocialLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, url } : item))
    );
    if (errors.socialUrls?.[id]) {
      setErrors((prev) => {
        const next = { ...prev.socialUrls };
        delete next[id];
        return { ...prev, socialUrls: next };
      });
    }
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks((prev) => prev.filter((item) => item.id !== id));
  };

  // Validation Logic
  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    const socialUrlErrors: Record<string, string> = {};

    const trimmedName = name.trim() || [firstName, lastName].filter(Boolean).join(' ');
    if (!trimmedName || trimmedName.length < 2) {
      nextErrors.name = 'Full name or First name is required (min 2 characters).';
    } else if (trimmedName.length > 100) {
      nextErrors.name = 'Name cannot exceed 100 characters.';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        nextErrors.email = 'Please enter a valid email address (e.g. name@domain.com).';
      }
    }

    if (phoneMobile.trim()) {
      const phoneClean = phoneMobile.replace(/[\s\-()+]/g, '');
      if (phoneClean.length < 7 || phoneClean.length > 18) {
        nextErrors.phoneMobile = 'Please enter a valid phone number (7-18 digits).';
      }
    }

    if (website.trim()) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
      if (!urlRegex.test(website.trim())) {
        nextErrors.website = 'Please enter a valid website URL (e.g. https://domain.com).';
      }
    }

    socialLinks.forEach((link) => {
      if (link.url.trim() && link.url.trim().length > 200) {
        socialUrlErrors[link.id] = 'URL exceeds maximum length of 200 characters.';
      }
    });

    if (Object.keys(socialUrlErrors).length > 0) {
      nextErrors.socialUrls = socialUrlErrors;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Submit & Create Card via QRTRAC API
  const handleSaveCard = async () => {
    if (isSubmitting) return;

    setServerError(null);
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const displayName = name.trim() || [firstName, lastName].filter(Boolean).join(' ').trim();

    // Format website with protocol if missing
    let formattedWebsite = website.trim();
    if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
      formattedWebsite = `https://${formattedWebsite}`;
    }

    const draftPayload: CardEditorDraft = {
      name: displayName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      designation: designation.trim(),
      company: company.trim(),
      email: email.trim(),
      phoneMobile: phoneMobile.trim(),
      phoneWork: phoneWork.trim(),
      website: formattedWebsite,
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      bio: bio.trim(),
      notes: '',
      profilePhoto,
      template,
      displayId: displayId.trim(),
      socialLinks: socialLinks.filter((s) => s.url.trim().length > 0),
      tags: [],
    };

    try {
      const res = await qrService.createCard(draftPayload);

      if (res.success && res.data) {
        const createdCard = res.data;

        // 1. Add to context so MyCards and Preview resolve immediately
        addCard(createdCard);

        // 2. Clear draft
        clearEditorDraft();

        // 3. Navigate directly to Preview screen with retained server ID
        navigation.navigate('Preview', {
          cardId: createdCard.id,
          cardTitle: createdCard.name,
          templateId: createdCard.template,
        });
      } else {
        setServerError(
          res.message || 'Failed to create digital card in QRTRAC. Please try again.'
        );
      }
    } catch (err: any) {
      setServerError(
        err?.message || 'A network error occurred while connecting to QRTRAC.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const templateConfig = CARD_TEMPLATES[template] || CARD_TEMPLATES.modern_minimal;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          testID="create-card-back-btn"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Information</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Template Indicator */}
        <TouchableOpacity
          style={[styles.templateBanner, { borderColor: templateConfig.style.accentColor }]}
          onPress={() =>
            navigation.navigate('TemplateSelection', {
              cardTitle: name || 'New Card',
              mode: 'create',
            })
          }
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.templateBannerLabel}>Selected Template</Text>
            <Text style={[styles.templateBannerValue, { color: templateConfig.style.accentColor }]}>
              {templateConfig.name}
            </Text>
          </View>
          <Text style={styles.templateChangeText}>Change</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primaryLight} />
        </TouchableOpacity>

        {/* Server Error Banner */}
        {serverError && (
          <View style={styles.serverErrorBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.serverErrorText}>{serverError}</Text>
          </View>
        )}

        {/* Photo Upload Section */}
        <View style={styles.photoSection}>
          <Avatar
            uri={profilePhoto}
            name={name || 'New Card'}
            size="xl"
            borderColor={templateConfig.style.accentColor}
            style={styles.avatarPreview}
          />
          <View style={styles.photoButtonRow}>
            <TouchableOpacity
              style={styles.photoActionBtn}
              onPress={handleChoosePhoto}
              activeOpacity={0.8}
              testID="photo-picker-btn"
            >
              <Ionicons
                name={profilePhoto ? 'camera-reverse-outline' : 'camera-outline'}
                size={18}
                color={colors.primaryLight}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.photoActionText}>
                {profilePhoto ? 'Change Photo' : 'Upload Profile Photo'}
              </Text>
            </TouchableOpacity>
            {profilePhoto ? (
              <TouchableOpacity
                style={styles.photoRemoveBtn}
                onPress={() => setProfilePhoto(undefined)}
                activeOpacity={0.8}
                testID="photo-remove-btn"
              >
                <Ionicons name="trash-outline" size={15} color={colors.error} style={{ marginRight: 4 }} />
                <Text style={styles.photoRemoveText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Form Fields Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionHeading}>Contact Details</Text>

          {/* First Name & Last Name */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>
                First Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={firstName}
                onChangeText={handleFirstNameChange}
                placeholder="First name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                testID="input-first-name"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={handleLastNameChange}
                placeholder="Last name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                testID="input-last-name"
              />
            </View>
          </View>

          {/* Display Name (Card Title) */}
          <Text style={styles.inputLabel}>
            Card Title / Display Name <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="e.g. Jane Doe • Senior Architect"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            testID="input-card-name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* Job Title / Role */}
          <Text style={styles.inputLabel}>Job Title / Designation</Text>
          <TextInput
            style={styles.input}
            value={designation}
            onChangeText={setDesignation}
            placeholder="e.g. Lead Solutions Engineer"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            testID="input-designation"
          />

          {/* Company / Organization */}
          <Text style={styles.inputLabel}>Company / Organization</Text>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="e.g. Acme Innovations"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            testID="input-company"
          />

          {/* Email Address */}
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="e.g. jane.doe@company.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="input-email"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Mobile Phone */}
          <Text style={styles.inputLabel}>Mobile Phone</Text>
          <TextInput
            style={[styles.input, errors.phoneMobile && styles.inputError]}
            value={phoneMobile}
            onChangeText={(val) => {
              setPhoneMobile(val);
              if (errors.phoneMobile) setErrors((prev) => ({ ...prev, phoneMobile: undefined }));
            }}
            placeholder="e.g. +1 555-0199"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            testID="input-phone"
          />
          {errors.phoneMobile && <Text style={styles.errorText}>{errors.phoneMobile}</Text>}

          {/* Work / Office Phone */}
          <Text style={styles.inputLabel}>Work Phone / Landline</Text>
          <TextInput
            style={styles.input}
            value={phoneWork}
            onChangeText={setPhoneWork}
            placeholder="e.g. +1 555-0100 ext 4"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            testID="input-work-phone"
          />

          {/* Website / Portfolio */}
          <Text style={styles.inputLabel}>Website / Portfolio</Text>
          <TextInput
            style={[styles.input, errors.website && styles.inputError]}
            value={website}
            onChangeText={(val) => {
              setWebsite(val);
              if (errors.website) setErrors((prev) => ({ ...prev, website: undefined }));
            }}
            placeholder="e.g. https://janedoe.me"
            placeholderTextColor={colors.textMuted}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            testID="input-website"
          />
          {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}

          {/* Bio / About */}
          <Text style={styles.inputLabel}>Professional Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Brief introduction or executive bio..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            testID="input-bio"
          />

          {/* Custom Short Link / Display ID */}
          <Text style={styles.inputLabel}>Custom Link Slug (Optional)</Text>
          <View style={styles.slugInputContainer}>
            <Text style={styles.slugPrefix}>https://qrtrac.link/</Text>
            <TextInput
              style={styles.slugInput}
              value={displayId}
              onChangeText={setDisplayId}
              placeholder="my-card-slug"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              testID="input-display-id"
            />
          </View>
        </View>

        {/* Social Links Section */}
        <View style={styles.formCard}>
          <Text style={styles.sectionHeading}>Social & Online Profiles</Text>
          <Text style={styles.sectionSubtitle}>
            Add links to your social profiles and professional platforms.
          </Text>

          {/* Active Social Links */}
          {socialLinks.map((link) => {
            const platformConfig =
              SOCIAL_PLATFORMS.find((p) => p.platform === link.platform) || SOCIAL_PLATFORMS[0];
            const hasError = errors.socialUrls?.[link.id];

            return (
              <View key={link.id} style={styles.socialLinkBox}>
                <View style={styles.socialTopRow}>
                  <View style={styles.socialBadge}>
                    <Ionicons name={platformConfig.iconName as any} size={16} color={platformConfig.color} />
                    <Text style={styles.socialPlatformName}>{platformConfig.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveSocialLink(link.id)}
                    style={styles.socialRemoveBtn}
                    testID={`remove-social-${link.platform}`}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.socialInput, hasError && styles.inputError]}
                  value={link.url}
                  onChangeText={(url) => handleUpdateSocialLink(link.id, url)}
                  placeholder={platformConfig.placeholder}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {hasError && <Text style={styles.errorText}>{hasError}</Text>}
              </View>
            );
          })}

          {/* Add Social Link Buttons */}
          <Text style={styles.addSocialLabel}>+ Add Platform Link:</Text>
          <View style={styles.platformButtonGrid}>
            {SOCIAL_PLATFORMS.map((platform) => {
              const isAdded = socialLinks.some((s) => s.platform === platform.platform);
              return (
                <TouchableOpacity
                  key={platform.platform}
                  style={[
                    styles.platformChip,
                    isAdded && styles.platformChipDisabled,
                  ]}
                  onPress={() => handleAddSocialLink(platform.platform)}
                  disabled={isAdded}
                  activeOpacity={0.7}
                  testID={`add-platform-${platform.platform}`}
                >
                  <Ionicons
                    name={platform.iconName as any}
                    size={14}
                    color={isAdded ? colors.textMuted : platform.color}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.platformChipText,
                      isAdded && { color: colors.textMuted },
                    ]}
                  >
                    {platform.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSaveCard}
          disabled={isSubmitting}
          activeOpacity={0.8}
          testID="save-card-btn"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Create & Save Card</Text>
            </>
          )}
        </TouchableOpacity>
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  templateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  templateBannerLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  templateBannerValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  templateChangeText: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: '600',
    marginRight: 2,
  },
  serverErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  serverErrorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    lineHeight: 18,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarPreview: {
    marginBottom: theme.spacing.sm,
  },
  photoButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  photoActionText: {
    fontSize: 13,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  photoRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  photoRemoveText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 16,
  },
  nameRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: theme.spacing.sm,
  },
  requiredStar: {
    color: colors.error,
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
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  errorText: {
    fontSize: 11,
    color: colors.error,
    marginTop: 3,
    marginBottom: 2,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  slugInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  slugPrefix: {
    fontSize: 13,
    color: colors.textMuted,
  },
  slugInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 10,
    fontSize: 13,
  },
  socialLinkBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  socialTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  socialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialPlatformName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  socialRemoveBtn: {
    padding: 4,
  },
  socialInput: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
  },
  addSocialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  platformButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
  },
  platformChipDisabled: {
    opacity: 0.4,
  },
  platformChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
