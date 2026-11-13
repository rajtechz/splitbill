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
import { PhotoPickerModal } from '../../../components/modals/PhotoPickerModal';
import { PinSetupModal } from '../../../components/modals/PinSetupModal';
import { notificationService } from '../../../services/native/notificationService';
import { useSecurityStore } from '../../../store/useSecurityStore';
import { config } from '../../../app/config';
import { SUPPORTED_CURRENCIES } from '../../../types';
import { repository } from '../../../services/api/repository';
// [FUTURE UPDATE: SplitMate Digital Wallet]
// import { useWalletStore } from '../../../store/useWalletStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius, shadows, setMode, isDark } = useTheme();
  const { currentUser, logout, isPro, toggleProDev, updateUser } = useAuthStore();
  const { isPinEnabled, disablePin, isBiometricsEnabled, toggleBiometrics } = useSecurityStore();
  // [FUTURE UPDATE: SplitMate Digital Wallet]
  // const walletBalance = useWalletStore(state => state.balance);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  React.useEffect(() => {
    notificationService.isEnabled().then(setPushEnabled);
  }, []);

  const handleTogglePush = async (val: boolean) => {
    if (val) {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setPushEnabled(true);
      } else {
        setPushEnabled(false);
      }
    } else {
      setPushEnabled(false);
      await notificationService.savePreference(false);
    }
  };

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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                console.log('📷 [PROFILE] Avatar pressed -> opening PhotoPickerModal');
                setShowPhotoModal(true);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.avatarTouchable}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
            >
              <View style={isPro ? styles.goldAvatarRing : undefined}>
                <Avatar
                  name={currentUser?.name || 'User'}
                  url={currentUser?.avatarUrl}
                  size={68}
                />
              </View>
              <View
                pointerEvents="none"
                style={[
                  styles.cameraBadge,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.surface,
                  },
                ]}
              >
                <Icon name="camera" size={13} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  {currentUser?.name || 'Alex Johnson'}
                </Text>
                {isPro ? (
                  <View style={styles.proNamePill}>
                    <Icon name="crown" size={10} color="#122E24" />
                    <Text style={styles.proNamePillText}>VIP GOLD PRO</Text>
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
          {/* [FUTURE UPDATE: SplitMate Digital Wallet Row]
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Wallet')}
            style={styles.settingRow}
          >
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(212, 175, 55, 0.2)' }]}>
              <Icon name="wallet" size={18} color="#D4AF37" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary, fontWeight: '700' }]}>
                SplitMate Digital Wallet
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Top-up money, transfer to bank & 1-tap bill splits
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[typography.titleMedium, { color: isDark ? '#34D399' : '#15803D', fontWeight: '800' }]}>
                ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <Icon name="chevron-right" size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          */}

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
              onValueChange={handleTogglePush}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Currency selection row */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.warningLight }]}>
              <Icon name="money" size={18} color={colors.warning} />
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

          {/* 4-Digit mPIN Protection */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#E0F2FE' }]}>
              <Icon name="lock" size={18} color="#0284C7" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                App Lock (4-Digit mPIN)
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Require 4-digit security PIN to unlock app
              </Text>
            </View>
            <Switch
              value={isPinEnabled}
              onValueChange={val => {
                if (val) {
                  setShowPinModal(true);
                } else {
                  disablePin();
                }
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Fingerprint / Biometric Unlock */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#DCFCE7' }]}>
              <Icon name="fingerprint" size={18} color="#15803D" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Fingerprint / Biometric Unlock
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Open app with fingerprint or 4-digit mPIN
              </Text>
            </View>
            <Switch
              value={isBiometricsEnabled}
              onValueChange={val => toggleBiometrics(val)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {isPinEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowPinModal(true)}
                style={styles.settingRow}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <Icon name="edit" size={16} color={colors.textPrimary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                    Change 4-Digit mPIN
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    Update your security PIN (Default: 1234)
                  </Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}

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

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* App Permissions (Location, Camera, Contacts, Notifications) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Permissions', { isSettingsMode: true })}
            style={styles.settingRow}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#EDE9FE' }]}>
              <Icon name="shield" size={18} color="#7C3AED" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Device Permissions
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Location, Camera, Contacts, Notifications
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textSecondary} />
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

      {/* Photo Picker Modal */}
      <PhotoPickerModal
        visible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onSelectPhoto={async uri => {
          updateUser({ avatarUrl: uri });
          try {
            await repository.uploadAvatar(uri);
          } catch {}
        }}
      />

      {/* Pin Setup & Change Modal */}
      <PinSetupModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
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
  avatarTouchable: {
    width: 68,
    height: 68,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  proNamePillText: {
    color: '#122E24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  goldAvatarRing: {
    borderWidth: 2.5,
    borderColor: '#D4AF37',
    borderRadius: 38,
    padding: 2,
  },
});
