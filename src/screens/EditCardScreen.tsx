/**
 * Edit Card Screen (Phase 8)
 * Complete Digital Business Card Editor.
 * Features:
 * 1. Loads latest card data from QRTRAC API / local store
 * 2. Populates all editable fields (Name, Title, Company, Email, Mobile, Work, Website, Bio, Photo, Social Links, Template)
 * 3. Profile photo replacement and removal via ImageService
 * 4. Dynamic Social Links management (Add, Edit, Remove)
 * 5. Live In-Memory Preview via CardTemplate & TemplatePicker
 * 6. Unsaved changes detection with discard confirmation dialog
 * 7. Server-confirmed update via qrService.updateCard (PUT /qrs-api/{id} with numeric templateId)
 * 8. Zero POST calls during edit; prevents duplicate submissions
 * 9. Synchronizes CardContext store and refreshes My Cards
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigationProp, RouteProps } from '../types/navigation';
import { useCards } from '../store';
import { qrService } from '../services/qr.service';
import { ImageService } from '../services/image.service';
import { BusinessCard, CardEditorDraft } from '../models/card';
import { CardTemplateId } from '../models/template';
import { SocialLink, SocialPlatform, SOCIAL_PLATFORMS } from '../models/social';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { shadows } from '../theme/shadows';
import { Avatar } from '../components/Avatar';
import { CardTemplate, TemplatePicker } from '../components/templates';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ErrorState } from '../components/ErrorState';

interface FormErrors {
  name?: string;
  email?: string;
  phoneMobile?: string;
  website?: string;
  socialUrls?: Record<string, string>;
}

export const EditCardScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'EditCard'>>();
  const { cards, selectedCard, updateCardInStore, refreshCards } = useCards();

  const cardId = route.params?.cardId;

  // Server snapshot state
  const [originalCard, setOriginalCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneMobile, setPhoneMobile] = useState<string>('');
  const [phoneWork, setPhoneWork] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [displayId, setDisplayId] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [template, setTemplate] = useState<CardTemplateId>('modern');

  // UI state
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPlatformPicker, setShowPlatformPicker] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);

  // 1. Load card data from QRTRAC API / local store
  useEffect(() => {
    let isMounted = true;

    const loadCardData = async () => {
      setLoading(true);
      setLoadError(null);

      if (!cardId) {
        if (isMounted) {
          setLoadError('No card identifier provided.');
          setLoading(false);
        }
        return;
      }

      let fetchedCard: BusinessCard | null = null;

      // Try fetching latest data directly from server first
      try {
        const res = await qrService.getCard(cardId);
        if (res.success && res.data) {
          fetchedCard = res.data;
        }
      } catch {
        // Fallback to local memory if offline
      }

      // If server fetch failed, check local store
      if (!fetchedCard) {
        fetchedCard = cards.find((c) => c.id === cardId) || null;
      }

      if (!fetchedCard && selectedCard && selectedCard.id === cardId) {
        fetchedCard = selectedCard;
      }

      if (isMounted) {
        if (fetchedCard) {
          setOriginalCard(fetchedCard);

          // Populate form fields
          const fName = fetchedCard.contact.firstName || '';
          const lName = fetchedCard.contact.lastName || '';
          setFirstName(fName);
          setLastName(lName);
          setName(fetchedCard.name || [fName, lName].filter(Boolean).join(' '));
          setDesignation(fetchedCard.contact.title || '');
          setCompany(fetchedCard.contact.company || '');
          setEmail(fetchedCard.contact.email || '');
          setPhoneMobile(fetchedCard.contact.phoneMobile || '');
          setPhoneWork(fetchedCard.contact.phoneWork || '');
          setWebsite(fetchedCard.contact.website || '');
          setBio(fetchedCard.contact.bio || '');
          setDisplayId(fetchedCard.cloud?.displayId || '');
          setProfilePhoto(fetchedCard.profilePhoto);
          setSocialLinks(fetchedCard.socialLinks ? [...fetchedCard.socialLinks] : []);
          setTemplate(fetchedCard.template || 'modern');
        } else {
          setLoadError('Unable to load card details from server.');
        }
        setLoading(false);
      }
    };

    loadCardData();

    return () => {
      isMounted = false;
    };
  }, [cardId, cards, selectedCard]);

  // 2. Unsaved changes detection
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!originalCard) return false;

    const origFirstName = originalCard.contact.firstName || '';
    const origLastName = originalCard.contact.lastName || '';
    const origName = originalCard.name || '';
    const origDesignation = originalCard.contact.title || '';
    const origCompany = originalCard.contact.company || '';
    const origEmail = originalCard.contact.email || '';
    const origPhoneMobile = originalCard.contact.phoneMobile || '';
    const origPhoneWork = originalCard.contact.phoneWork || '';
    const origWebsite = originalCard.contact.website || '';
    const origBio = originalCard.contact.bio || '';
    const origProfilePhoto = originalCard.profilePhoto || undefined;
    const origTemplate = originalCard.template || 'modern';

    if (firstName.trim() !== origFirstName.trim()) return true;
    if (lastName.trim() !== origLastName.trim()) return true;
    if (name.trim() !== origName.trim()) return true;
    if (designation.trim() !== origDesignation.trim()) return true;
    if (company.trim() !== origCompany.trim()) return true;
    if (email.trim() !== origEmail.trim()) return true;
    if (phoneMobile.trim() !== origPhoneMobile.trim()) return true;
    if (phoneWork.trim() !== origPhoneWork.trim()) return true;
    if (website.trim() !== origWebsite.trim()) return true;
    if (bio.trim() !== origBio.trim()) return true;
    if (profilePhoto !== origProfilePhoto) return true;
    if (template !== origTemplate) return true;

    // Compare social links array
    const origSocials = originalCard.socialLinks || [];
    if (socialLinks.length !== origSocials.length) return true;
    for (let i = 0; i < socialLinks.length; i++) {
      if (
        socialLinks[i].platform !== origSocials[i]?.platform ||
        socialLinks[i].url.trim() !== origSocials[i]?.url.trim()
      ) {
        return true;
      }
    }

    return false;
  }, [
    originalCard,
    firstName,
    lastName,
    name,
    designation,
    company,
    email,
    phoneMobile,
    phoneWork,
    website,
    bio,
    profilePhoto,
    template,
    socialLinks,
  ]);

  // Handle back navigation safely
  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges()) {
      if (Platform.OS === 'web') {
        setShowDiscardModal(true);
      } else {
        Alert.alert(
          'Discard Changes?',
          'You have unsaved changes. Are you sure you want to discard them?',
          [
            { text: 'Continue Editing', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Save',
              onPress: () => handleSave(),
            },
          ]
        );
      }
    } else {
      navigation.goBack();
    }
  }, [hasUnsavedChanges, navigation]);

  // 3. Form Validation
  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    const computedName =
      name.trim() || [firstName, lastName].filter(Boolean).join(' ').trim();
    if (!computedName) {
      nextErrors.name = 'Please provide a card name or at least first/last name.';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (phoneMobile.trim()) {
      const cleanPhone = phoneMobile.replace(/[\s\-()+]/g, '');
      if (cleanPhone.length < 7 || cleanPhone.length > 18) {
        nextErrors.phoneMobile = 'Please enter a valid mobile phone number.';
      }
    }

    if (
      website.trim() &&
      !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(
        website.trim()
      )
    ) {
      nextErrors.website = 'Please enter a valid website URL.';
    }

    // Validate social links
    const socialErrors: Record<string, string> = {};
    socialLinks.forEach((link, idx) => {
      if (!link.url.trim()) {
        socialErrors[link.id || String(idx)] = 'URL is required.';
      }
    });
    if (Object.keys(socialErrors).length > 0) {
      nextErrors.socialUrls = socialErrors;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // 4. Photo Handlers
  const handlePickLibrary = async () => {
    const result = await ImageService.pickFromLibrary();
    if (result.success && result.uri) {
      setProfilePhoto(result.uri);
    }
  };

  const handleTakePhoto = async () => {
    const result = await ImageService.takePhoto();
    if (result.success && result.uri) {
      setProfilePhoto(result.uri);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(undefined);
  };

  // 5. Social Links Handlers
  const handleAddSocialLink = (platform: SocialPlatform) => {
    const newLink: SocialLink = {
      id: `social_${platform}_${Date.now()}`,
      platform,
      url: '',
    };
    setSocialLinks((prev) => [...prev, newLink]);
    setShowPlatformPicker(false);
  };

  const handleUpdateSocialUrl = (id: string, newUrl: string) => {
    setSocialLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, url: newUrl } : link))
    );
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks((prev) => prev.filter((link) => link.id !== id));
  };

  // 6. Constructed In-Memory Draft for Live Preview
  const previewCard: BusinessCard = useMemo(() => {
    const displayName =
      name.trim() ||
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      'Digital Business Card';

    return {
      id: originalCard?.id || cardId || 'draft_preview',
      name: displayName,
      profilePhoto,
      contact: {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        displayName,
        title: designation.trim() || undefined,
        company: company.trim() || undefined,
        email: email.trim() || undefined,
        phoneMobile: phoneMobile.trim() || undefined,
        phoneWork: phoneWork.trim() || undefined,
        website: website.trim() || undefined,
        bio: bio.trim() || undefined,
      },
      socialLinks,
      template,
      isFavorite: originalCard?.isFavorite || false,
      tags: originalCard?.tags || [],
      cloud: {
        qrtracId: originalCard?.cloud?.qrtracId || cardId,
        displayId: displayId || originalCard?.cloud?.displayId,
        teamId: originalCard?.cloud?.teamId,
        qrImageUrl: originalCard?.cloud?.qrImageUrl,
        publicUrl:
          originalCard?.cloud?.publicUrl ||
          (displayId ? `https://qrtrac.link/${displayId}` : undefined),
        templateId: originalCard?.cloud?.templateId,
        isSynced: true,
        lastSyncedAt: Date.now(),
      },
      analytics: originalCard?.analytics || {
        totalScans: 0,
        todayScans: 0,
        yesterdayScans: 0,
      },
      createdAt: originalCard?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  }, [
    originalCard,
    cardId,
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
    socialLinks,
    template,
    displayId,
  ]);

  // 7. Save Flow (PUT only)
  const handleSave = async () => {
    if (isSubmitting) return;

    if (!validateForm()) {
      setActiveTab('edit');
      return;
    }

    if (!cardId) {
      setServerError('Missing card identifier.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const displayName =
      name.trim() ||
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      'Business Card';

    const draftPayload: CardEditorDraft = {
      id: cardId,
      name: displayName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      designation: designation.trim(),
      company: company.trim(),
      email: email.trim(),
      phoneMobile: phoneMobile.trim(),
      phoneWork: phoneWork.trim(),
      website: website.trim(),
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
      socialLinks: socialLinks.filter((l) => Boolean(l.url.trim())),
      tags: originalCard?.tags || [],
    };

    try {
      const response = await qrService.updateCard(cardId, draftPayload);

      if (response.success && response.data) {
        // Update local context store
        updateCardInStore(response.data);
        refreshCards();
        setOriginalCard(response.data);
        setIsSubmitting(false);

        if (Platform.OS === 'web') {
          navigation.navigate('Preview', {
            cardId: response.data.id,
            cardTitle: response.data.name,
            templateId: response.data.template,
          });
        } else {
          Alert.alert('Card Updated', 'Your business card changes have been saved.', [
            {
              text: 'View Preview',
              onPress: () =>
                navigation.navigate('Preview', {
                  cardId: response.data.id,
                  cardTitle: response.data.name,
                  templateId: response.data.template,
                }),
            },
          ]);
        }
      } else {
        setIsSubmitting(false);
        const errMsg = response.message || 'Failed to save card changes on server.';
        setServerError(errMsg);
        if (Platform.OS !== 'web') {
          Alert.alert('Update Failed', errMsg);
        }
      }
    } catch {
      setIsSubmitting(false);
      const networkErr = 'A network error occurred while updating the card. Please retry.';
      setServerError(networkErr);
      if (Platform.OS !== 'web') {
        Alert.alert('Update Failed', networkErr);
      }
    }
  };

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

  if (loadError || !originalCard) {
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
            message={loadError || 'Card could not be loaded.'}
            retryTitle="Return to My Cards"
            onRetry={() => navigation.navigate('MyCards')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          testID="edit-back-btn"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Card</Text>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, isSubmitting && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSubmitting}
          testID="save-card-header-btn"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Editor / Live Preview Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'edit' && styles.tabButtonActive]}
          onPress={() => setActiveTab('edit')}
          activeOpacity={0.7}
          testID="tab-edit"
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={activeTab === 'edit' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'edit' && styles.tabButtonTextActive,
            ]}
          >
            Edit Fields
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'preview' && styles.tabButtonActive]}
          onPress={() => setActiveTab('preview')}
          activeOpacity={0.7}
          testID="tab-preview"
        >
          <Ionicons
            name="eye-outline"
            size={16}
            color={activeTab === 'preview' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'preview' && styles.tabButtonTextActive,
            ]}
          >
            Live Preview
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {serverError ? (
          <View style={styles.serverErrorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.serverErrorText}>{serverError}</Text>
          </View>
        ) : null}

        {activeTab === 'preview' ? (
          /* Live In-Memory Preview Tab */
          <View style={styles.previewSection}>
            <Text style={styles.sectionHeader}>Live Card Preview</Text>
            <Text style={styles.sectionSub}>
              Switch presentation styles or view real-time changes before saving.
            </Text>

            <TemplatePicker
              selectedTemplate={template}
              onSelectTemplate={(newTemplate) => setTemplate(newTemplate)}
              compact={false}
              style={styles.templatePicker}
            />

            <CardTemplate
              card={previewCard}
              template={template}
              showQr={true}
              style={styles.previewCardWrapper}
            />
          </View>
        ) : (
          /* Edit Form Tab */
          <View style={styles.formSection}>
            {/* Template Selector Section */}
            <Text style={styles.sectionHeader}>Presentation Theme</Text>
            <TemplatePicker
              selectedTemplate={template}
              onSelectTemplate={(newTemplate) => setTemplate(newTemplate)}
              compact={true}
              style={styles.templatePicker}
            />

            {/* Profile Photo Section */}
            <Text style={styles.sectionHeader}>Profile Photo</Text>
            <View style={styles.photoContainer}>
              <Avatar
                uri={profilePhoto}
                name={name || [firstName, lastName].filter(Boolean).join(' ')}
                size="lg"
              />
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={handlePickLibrary}
                  activeOpacity={0.7}
                  testID="edit-pick-photo-btn"
                >
                  <Ionicons name="images-outline" size={14} color={colors.primary} />
                  <Text style={styles.photoBtnText}>Library</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                  testID="edit-take-photo-btn"
                >
                  <Ionicons name="camera-outline" size={14} color={colors.primary} />
                  <Text style={styles.photoBtnText}>Camera</Text>
                </TouchableOpacity>

                {profilePhoto ? (
                  <TouchableOpacity
                    style={[styles.photoBtn, styles.photoBtnDanger]}
                    onPress={handleRemovePhoto}
                    activeOpacity={0.7}
                    testID="edit-remove-photo-btn"
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.error} />
                    <Text style={[styles.photoBtnText, { color: colors.error }]}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Identity Information Section */}
            <Text style={styles.sectionHeader}>Identity Details</Text>
            <View style={styles.cardBox}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="e.g. Sarah"
                    placeholderTextColor={colors.textMuted}
                    testID="input-first-name"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="e.g. Connor"
                    placeholderTextColor={colors.textMuted}
                    testID="input-last-name"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Card Display Name / Title</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Sarah Connor • Cyber Lead"
                placeholderTextColor={colors.textMuted}
                testID="input-card-name"
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

              <Text style={styles.inputLabel}>Job Title / Role</Text>
              <TextInput
                style={styles.input}
                value={designation}
                onChangeText={setDesignation}
                placeholder="e.g. Cyber Security Lead"
                placeholderTextColor={colors.textMuted}
                testID="input-designation"
              />

              <Text style={styles.inputLabel}>Company / Organization</Text>
              <TextInput
                style={styles.input}
                value={company}
                onChangeText={setCompany}
                placeholder="e.g. SkyNet Defense"
                placeholderTextColor={colors.textMuted}
                testID="input-company"
              />

              <Text style={styles.inputLabel}>Bio / Professional Summary</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Brief summary or company description..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                testID="input-bio"
              />
            </View>

            {/* Contact Information Section */}
            <Text style={styles.sectionHeader}>Contact Information</Text>
            <View style={styles.cardBox}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="e.g. sarah@defense.org"
                placeholderTextColor={colors.textMuted}
                testID="input-email"
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

              <Text style={styles.inputLabel}>Mobile Phone</Text>
              <TextInput
                style={[styles.input, errors.phoneMobile && styles.inputError]}
                value={phoneMobile}
                onChangeText={setPhoneMobile}
                keyboardType="phone-pad"
                placeholder="e.g. +1 555-0199"
                placeholderTextColor={colors.textMuted}
                testID="input-phone-mobile"
              />
              {errors.phoneMobile ? (
                <Text style={styles.errorText}>{errors.phoneMobile}</Text>
              ) : null}

              <Text style={styles.inputLabel}>Work Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                value={phoneWork}
                onChangeText={setPhoneWork}
                keyboardType="phone-pad"
                placeholder="e.g. +1 555-0100"
                placeholderTextColor={colors.textMuted}
                testID="input-phone-work"
              />

              <Text style={styles.inputLabel}>Website URL</Text>
              <TextInput
                style={[styles.input, errors.website && styles.inputError]}
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                autoCapitalize="none"
                placeholder="e.g. https://sarahconnor.security"
                placeholderTextColor={colors.textMuted}
                testID="input-website"
              />
              {errors.website ? <Text style={styles.errorText}>{errors.website}</Text> : null}
            </View>

            {/* Social Links Section */}
            <View style={styles.socialHeaderRow}>
              <Text style={styles.sectionHeader}>Social & Online Profiles</Text>
              <TouchableOpacity
                style={styles.addSocialBtn}
                onPress={() => setShowPlatformPicker(true)}
                activeOpacity={0.7}
                testID="add-social-link-btn"
              >
                <Ionicons name="add-circle" size={16} color={colors.primary} />
                <Text style={styles.addSocialBtnText}>Add Platform</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardBox}>
              {socialLinks.length === 0 ? (
                <Text style={styles.emptySocialText}>
                  No social profiles added. Tap "Add Platform" to connect LinkedIn, GitHub, X, etc.
                </Text>
              ) : (
                socialLinks.map((link) => {
                  const platformConfig = SOCIAL_PLATFORMS.find(
                    (p) => p.platform === link.platform
                  );
                  const iconName = platformConfig?.iconName || 'link-outline';
                  const label = platformConfig?.name || link.platform;

                  return (
                    <View key={link.id} style={styles.socialLinkRow}>
                      <View style={styles.socialPlatformTag}>
                        <Ionicons name={iconName as any} size={15} color={colors.primary} />
                        <Text style={styles.socialPlatformLabel}>{label}</Text>
                      </View>
                      <TextInput
                        style={[
                          styles.socialInput,
                          errors.socialUrls?.[link.id] && styles.inputError,
                        ]}
                        value={link.url}
                        onChangeText={(text) => handleUpdateSocialUrl(link.id, text)}
                        placeholder={`https://${link.platform}.com/...`}
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        testID={`input-social-${link.platform}`}
                      />
                      <TouchableOpacity
                        style={styles.removeSocialBtn}
                        onPress={() => handleRemoveSocialLink(link.id)}
                        testID={`remove-social-${link.platform}`}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>

            {/* Save Action Button */}
            <TouchableOpacity
              style={[styles.saveMainBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
              testID="save-card-bottom-btn"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveMainBtnText}>Save Changes</Text>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginLeft: 6 }}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Platform Picker Modal */}
      <Modal
        visible={showPlatformPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlatformPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Platform</Text>
              <TouchableOpacity
                onPress={() => setShowPlatformPicker(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {SOCIAL_PLATFORMS.map((platform) => (
                <TouchableOpacity
                  key={platform.platform}
                  style={styles.platformItem}
                  onPress={() => handleAddSocialLink(platform.platform)}
                  activeOpacity={0.7}
                  testID={`platform-option-${platform.platform}`}
                >
                  <Ionicons name={platform.iconName as any} size={20} color={colors.primary} />
                  <Text style={styles.platformItemText}>{platform.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Web Discard Modal */}
      <Modal
        visible={showDiscardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Discard Changes?</Text>
            <Text style={styles.modalSub}>
              You have unsaved changes. Are you sure you want to discard them?
            </Text>
            <View style={styles.discardModalActions}>
              <TouchableOpacity
                style={styles.discardBtnOutline}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={styles.discardBtnOutlineText}>Continue Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.discardBtnDanger}
                onPress={() => {
                  setShowDiscardModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.discardBtnDangerText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.discardBtnPrimary}
                onPress={() => {
                  setShowDiscardModal(false);
                  handleSave();
                }}
              >
                <Text style={styles.discardBtnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 8,
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  saveHeaderBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  serverErrorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
  formSection: {},
  previewSection: {},
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  templatePicker: {
    marginBottom: spacing.xs,
  },
  previewCardWrapper: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.md,
    ...shadows.sm,
  },
  photoActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  photoBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  photoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  col: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    fontSize: 14,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: colors.error,
    marginTop: 2,
  },
  socialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  addSocialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 4,
  },
  addSocialBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptySocialText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  socialLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  socialPlatformTag: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 95,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  socialPlatformLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  socialInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    fontSize: 13,
  },
  removeSocialBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FEF2F2',
  },
  saveMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    ...shadows.md,
  },
  saveMainBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  modalCloseBtn: {
    padding: 4,
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
    gap: 10,
  },
  platformItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  discardModalActions: {
    gap: 8,
  },
  discardBtnOutline: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
  },
  discardBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  discardBtnDanger: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  discardBtnDangerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
  discardBtnPrimary: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  discardBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
