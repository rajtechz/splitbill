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
import { SUPPORTED_CURRENCIES } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius, shadows, setMode, isDark } = useTheme();
  const { currentUser, logout } = useAuthStore();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
              <Text style={[typography.h3, { color: colors.textPrimary }]}>
                {currentUser?.name || 'Alex Johnson'}
              </Text>
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

          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondaryLight }]}>
              <Icon name="refresh" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Offline Sync Engine
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Instant offline writes with idempotency keys
              </Text>
            </View>
            <View style={[styles.currencyBadge, { backgroundColor: colors.successLight }]}>
              <Text style={[typography.caption, { color: colors.success, fontWeight: '700' }]}>
                Online
              </Text>
            </View>
          </View>
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
});
