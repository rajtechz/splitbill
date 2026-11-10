import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon } from '../../../components/common/Icon';
import { ConfirmationModal } from '../../../components/modals/ConfirmationModal';
import { BackendSettingsModal } from '../../../components/modals/BackendSettingsModal';
import { config } from '../../../app/config';
import { SUPPORTED_CURRENCIES } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius, shadows, setMode, isDark } = useTheme();
  const { currentUser, logout, isPro, toggleProDev } = useAuthStore();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBackendModal, setShowBackendModal] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const currentCurrency = currentUser?.defaultCurrency || 'INR';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Account & Settings" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderColor: colors.borderSubtle,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.profileRow}>
            <Avatar
              name={currentUser?.name || 'Alex Johnson'}
              url={currentUser?.avatarUrl}
              size={64}
            />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  {currentUser?.name || 'Alex Johnson'}
                </Text>
                {isPro ? (
                  <View style={styles.proNamePill}>
                    <Text style={styles.proNamePillText}>PRO</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {currentUser?.email || 'alex.johnson@example.com'}
              </Text>
              {currentUser?.phoneNumber ? (
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {currentUser.phoneNumber}
                </Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EditProfile')}
            style={[
              styles.editProfileBtn,
              { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md },
            ]}
          >
            <Icon name="edit" size={16} color={colors.textPrimary} />
            <Text style={[typography.buttonMedium, { color: colors.textPrimary, marginLeft: 8 }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* SplitMate Pro Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Subscription')}
          style={[
            styles.proBannerCard,
            {
              backgroundColor: isPro ? '#0E3A2B' : '#122E24',
              borderRadius: borderRadius.lg,
              marginTop: 14,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.proBannerIcon}>
            <Icon name="crown" size={24} color="#D4AF37" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[typography.titleMedium, { color: '#FFFFFF' }]}>
              {isPro ? 'SplitMate Pro Active' : 'Upgrade to SplitMate Pro'}
            </Text>
            <Text style={[typography.caption, { color: '#B8E7D3', marginTop: 2 }]}>
              {isPro ? 'Unlimited OCR Scans, CSV Export & Pro Debt Minimizer' : '7-Day Free Trial • Save 37% with Annual'}
            </Text>
          </View>
          <View style={[styles.proActionBadge, { backgroundColor: isPro ? '#239B68' : '#D4AF37' }]}>
            <Text style={[styles.proActionBadgeText, { color: isPro ? '#FFFFFF' : '#122E24' }]}>
              {isPro ? 'Active' : 'Upgrade'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Preferences Section */}
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 24, marginBottom: 8 }]}>
          PREFERENCES & APPEARANCE
        </Text>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderColor: colors.borderSubtle },
          ]}
        >
          {/* Dark Mode Row */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}>
              <Icon name="settings" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Dark Appearance
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={val => setMode(val ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Notifications Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.infoLight }]}>
              <Icon name="bell" size={18} color={colors.info} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Push Notifications
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Expense alerts and payment updates
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Currency selection row */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.warningLight }]}>
              <Icon name="wallet" size={18} color={colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Default Currency
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {SUPPORTED_CURRENCIES[currentCurrency].name} ({SUPPORTED_CURRENCIES[currentCurrency].symbol})
              </Text>
            </View>
            <View style={[styles.currencyBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '700' }]}>
                {currentCurrency}
              </Text>
            </View>
          </View>
        </View>

        {/* Security & Sync */}
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 24, marginBottom: 8 }]}>
          SECURITY & DATA
        </Text>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderColor: colors.borderSubtle },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}>
              <Icon name="shield" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Data Encryption & Security
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Local cache encrypted • Token refresh active
              </Text>
            </View>
            <View style={[styles.currencyBadge, { backgroundColor: colors.successLight }]}>
              <Text style={[typography.caption, { color: colors.success, fontWeight: '700' }]}>
                Active
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowBackendModal(true)}
            style={styles.settingRow}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}>
              <Icon name="settings" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Backend & Server API
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {config.useMockApi ? 'Mock Adapter Active' : `Live REST API: ${config.apiBaseUrl}`}
              </Text>
            </View>
            <View
              style={[
                styles.currencyBadge,
                { backgroundColor: config.useMockApi ? colors.warningLight : colors.successLight },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: config.useMockApi ? colors.warning : colors.success, fontWeight: '700' },
                ]}
              >
                {config.useMockApi ? 'Mock Mode' : 'Live Server'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Dev Pro Toggle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleProDev}
            style={styles.settingRow}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#FFF4D4' }]}>
              <Icon name="crown" size={18} color="#D4AF37" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Pro Membership (Dev Switch)
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {isPro ? 'Pro Active • Tap to test Free paywalls' : 'Free Tier • Tap to activate Pro instantly'}
              </Text>
            </View>
            <View
              style={[
                styles.currencyBadge,
                { backgroundColor: isPro ? '#239B68' : colors.surfaceVariant },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: isPro ? '#FFFFFF' : colors.textPrimary, fontWeight: '700' },
                ]}
              >
                {isPro ? 'Pro Active' : 'Free Mode'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowLogoutModal(true)}
          style={[
            styles.logoutBtn,
            {
              backgroundColor: colors.dangerLight,
              borderColor: colors.danger,
              borderRadius: borderRadius.md,
              marginTop: 24,
            },
          ]}
        >
          <Icon name="logout" size={18} color={colors.danger} />
          <Text style={[typography.buttonMedium, { color: colors.danger, marginLeft: 8 }]}>
            Log Out of SplitMate
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
          ]}
        >
          SplitMate v1.0.0 (Build 88) • Made for Seamless Expense Sharing
        </Text>
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmationModal
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out of your SplitMate account?"
        confirmText="Log Out"
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Backend & Server Integration Modal */}
      <BackendSettingsModal
        visible={showBackendModal}
        onClose={() => setShowBackendModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    borderWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  sectionCard: {
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  currencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
  },
  proBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  proBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proActionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  proActionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  proNamePill: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  proNamePillText: {
    color: '#122E24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
