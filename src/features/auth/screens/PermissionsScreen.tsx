import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';
import { Icon } from '../../../components/common/Icon';
import {
  permissionService,
  PERMISSION_CONFIG,
  PermissionType,
} from '../../../services/native/permissionService';

interface PermissionsScreenProps {
  onComplete: () => void;
  isSettingsMode?: boolean;
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({
  onComplete,
  isSettingsMode = false,
}) => {
  const { colors, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [statuses, setStatuses] = useState<Record<PermissionType, boolean>>({
    location: false,
    camera: false,
    contacts: false,
    notifications: false,
  });
  const [requestingType, setRequestingType] = useState<PermissionType | null>(null);
  const [isRequestingAll, setIsRequestingAll] = useState(false);

  useEffect(() => {
    checkAll();
  }, []);

  const checkAll = async () => {
    const s = await permissionService.getAllPermissionsStatus();
    setStatuses(s);
  };

  const handleRequestSingle = async (type: PermissionType) => {
    setRequestingType(type);
    try {
      const granted = await permissionService.requestPermission(type);
      setStatuses(prev => ({ ...prev, [type]: granted }));
    } catch (e) {
      console.warn('handleRequestSingle error', e);
      setStatuses(prev => ({ ...prev, [type]: true }));
    } finally {
      setRequestingType(null);
    }
  };

  const handlePrimaryPress = async () => {
    // If all are already granted, immediately advance with zero delay
    if (allGranted) {
      await permissionService.setPermissionsOnboardingCompleted(true);
      onComplete();
      return;
    }

    setIsRequestingAll(true);
    try {
      const results = await permissionService.requestAllPermissions();
      setStatuses(results);
    } catch (e) {
      console.warn('handlePrimaryPress error', e);
    } finally {
      setIsRequestingAll(false);
      await permissionService.setPermissionsOnboardingCompleted(true);
      onComplete();
    }
  };

  const handleSkipOrContinue = async () => {
    await permissionService.setPermissionsOnboardingCompleted(true);
    onComplete();
  };

  const permissionKeys: PermissionType[] = ['location', 'camera', 'contacts', 'notifications'];
  const allGranted = permissionKeys.every(k => statuses[k]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0D1614' : '#F8FAF9' }]}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top > 0 ? insets.top + 16 : 40,
            paddingBottom: 48,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* App Logo & Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../../assets/icons/app_icon.png')}
            style={styles.logo}
            resizeMode="cover"
          />
          <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 14, textAlign: 'center' }]}>
            {isSettingsMode ? 'App Permissions' : 'Welcome to SplitMate'}
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
            ]}
          >
            {isSettingsMode
              ? 'Manage device permissions for seamless expense tracking and contact splitting.'
              : 'To give you the smoothest bill splitting experience, please allow the following permissions:'}
          </Text>
        </View>

        {/* 4 Permission Cards */}
        <View style={styles.cardsContainer}>
          {permissionKeys.map(key => {
            const config = PERMISSION_CONFIG[key];
            const isGranted = statuses[key];
            const isLoading = requestingType === key;

            return (
              <View
                key={key}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#14211D' : '#FFFFFF',
                    borderColor: isGranted ? colors.primary : colors.borderSubtle,
                  },
                ]}
              >
                {/* Icon Column */}
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isGranted
                        ? (isDark ? '#122E22' : '#E8F5E9')
                        : (isDark ? '#1C2E29' : '#F0F5F2'),
                    },
                  ]}
                >
                  <Icon
                    name={config.icon as any}
                    size={22}
                    color={isGranted ? colors.primary : colors.textSecondary}
                  />
                </View>

                {/* Content Column */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text
                      numberOfLines={1}
                      style={[typography.titleMedium, { color: colors.textPrimary, fontWeight: '700', flex: 1 }]}
                    >
                      {config.title}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isGranted
                            ? (isDark ? '#0F382A' : '#D1F2DE')
                            : (isDark ? '#233832' : '#EAEFEA'),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: isGranted ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {config.badge}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
                    ]}
                  >
                    {config.subtitle}
                  </Text>
                </View>

                {/* Status / Action Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => !isGranted && handleRequestSingle(key)}
                  disabled={isGranted || isLoading || isRequestingAll}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isGranted
                        ? (isDark ? '#122E22' : '#E8F5E9')
                        : colors.primary,
                      borderColor: isGranted ? colors.primary : colors.primary,
                    },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : isGranted ? (
                    <View style={styles.grantedRow}>
                      <Icon name="check" size={13} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary, marginLeft: 4 }]}>
                        Allowed
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                      Allow
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Privacy Note */}
        <View
          style={[
            styles.privacyNote,
            { backgroundColor: isDark ? '#101B17' : '#F0F5F2', borderColor: colors.borderSubtle },
          ]}
        >
          <Icon name="lock" size={16} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 8, flex: 1, lineHeight: 16 }]}>
            Your privacy is our priority. Permissions are strictly used locally on your device and can be modified anytime in system Settings.
          </Text>
        </View>
      </ScrollView>

      {/* Responsive Bottom Actions */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: isDark ? '#0D1614' : '#F8FAF9',
            borderTopColor: colors.borderSubtle,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handlePrimaryPress}
          disabled={isRequestingAll}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          {isRequestingAll ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {allGranted ? 'Continue' : 'Grant All Permissions'}
            </Text>
          )}
        </TouchableOpacity>

        {!allGranted && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSkipOrContinue}
            style={styles.skipBtn}
          >
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, fontWeight: '600' }]}>
              {isSettingsMode ? 'Done' : 'Continue with Selected'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 74,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  grantedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
