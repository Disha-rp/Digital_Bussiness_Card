/**
 * My Cards Dashboard Screen (Phase 5)
 * Displays the authenticated team's digital business cards retrieved from QRTRAC API.
 * Supports pagination, pull-to-refresh, debounced search, caching, and navigation actions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigationProp } from '../types/navigation';
import { useAuth, useCards } from '../store';
import { colors, theme } from '../theme';
import {
  BusinessCardItem,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../components';

export const MyCardsScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const { organization, logout } = useAuth();
  const {
    cards,
    loading,
    refreshing,
    loadingMore,
    pagination,
    error,
    refreshCards,
    loadMoreCards,
    searchCards,
    selectCard,
    clearError,
  } = useCards();

  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search requests
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCards(text);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchCards('');
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenCard = useCallback(
    (cardId: string) => {
      selectCard(cardId);
      const card = cards.find((c) => c.id === cardId);
      navigation.navigate('Preview', {
        cardId,
        cardTitle: card?.name,
        templateId: card?.template,
      });
    },
    [selectCard, cards, navigation]
  );

  const handlePreviewCard = useCallback(
    (cardId: string) => {
      selectCard(cardId);
      const card = cards.find((c) => c.id === cardId);
      navigation.navigate('Preview', {
        cardId,
        cardTitle: card?.name,
        templateId: card?.template,
      });
    },
    [selectCard, cards, navigation]
  );

  const handleEditCard = useCallback(
    (cardId: string) => {
      selectCard(cardId);
      const card = cards.find((c) => c.id === cardId);
      navigation.navigate('EditCard', {
        cardId,
        cardTitle: card?.name,
        templateId: card?.template,
      });
    },
    [selectCard, cards, navigation]
  );

  const handleShareCard = useCallback(
    (cardId: string) => {
      selectCard(cardId);
      const card = cards.find((c) => c.id === cardId);
      const publicUrl =
        card?.cloud?.publicUrl ||
        (card?.cloud?.displayId ? `https://qr.qrtrac.com/${card.cloud.displayId}` : undefined);
      navigation.navigate('Share', {
        cardId,
        cardTitle: card?.name,
        previewUrl: publicUrl,
      });
    },
    [selectCard, cards, navigation]
  );

  const handleCreateNewCard = useCallback(() => {
    selectCard(null);
    navigation.navigate('CreateCard');
  }, [selectCard, navigation]);

  const handleLogoutPress = () => {
    Alert.alert(
      'Disconnect Workspace',
      'Are you sure you want to sign out? Your credentials will be cleared from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: logout },
      ]
    );
  };

  // Render list footer (loading more or end of list)
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>Loading more cards...</Text>
        </View>
      );
    }

    if (cards.length > 0 && !pagination.hasNextPage) {
      return (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>
            Showing all {pagination.totalCount} {pagination.totalCount === 1 ? 'card' : 'cards'}
          </Text>
        </View>
      );
    }

    return <View style={{ height: theme.spacing.xl }} />;
  };

  // Render empty state or full error state
  const renderEmptyComponent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.emptyContainer}>
          <LoadingIndicator message="Loading your digital cards..." />
        </View>
      );
    }

    if (error && cards.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ErrorState
            title="Failed to Load Cards"
            message={error.message || 'Unable to retrieve cards from QRTRAC.'}
            onRetry={refreshCards}
            retryTitle="Retry Connection"
          />
        </View>
      );
    }

    if (searchQuery.trim().length > 0 && cards.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            iconName="search-outline"
            title="No Matching Cards"
            description={`We couldn't find any cards matching "${searchQuery}".`}
            actionTitle="Clear Search"
            onAction={handleClearSearch}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          iconName="card-outline"
          title="No digital cards yet"
          description="Create your first digital business card and start sharing your contact info with dynamic QR codes."
          actionTitle="Create Your First Card"
          onAction={handleCreateNewCard}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Cards</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {organization?.organizationName || 'QRTRAC Workspace'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.8}
            onPress={handleCreateNewCard}
            testID="create-card-header-btn"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.createBtnText}>New Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogoutPress}
            activeOpacity={0.7}
            testID="logout-header-btn"
          >
            <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, company, or title..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* In-line Error Banner (if error happens while cached cards exist) */}
      {error && cards.length > 0 && (
        <View style={styles.inlineErrorBanner}>
          <Ionicons name="alert-circle" size={18} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.inlineErrorText} numberOfLines={1}>
            {error.message || 'Sync failed.'}
          </Text>
          <TouchableOpacity onPress={refreshCards} style={styles.inlineRetryBtn}>
            <Text style={styles.inlineRetryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearError} style={styles.inlineDismissBtn}>
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Cards List */}
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BusinessCardItem
            card={item}
            onOpen={handleOpenCard}
            onPreview={handlePreviewCard}
            onEdit={handleEditCard}
            onShare={handleShareCard}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          cards.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshCards}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={loadMoreCards}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
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
  headerLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.md,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    padding: 7,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  inlineErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
  },
  inlineRetryBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginRight: 8,
  },
  inlineRetryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  inlineDismissBtn: {
    padding: 2,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  endOfListText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
