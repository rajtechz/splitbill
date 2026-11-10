import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon, IconName } from './Icon';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: IconName;
    onPress: () => void;
  };
  secondaryRightAction?: {
    icon: IconName;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
  secondaryRightAction,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing } = useTheme();

  return (
    <View
      style={[
        {
          paddingTop: Math.max(insets.top, spacing.sm),
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <Icon name="chevron-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={[typography.h3, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightActionsContainer}>
          {secondaryRightAction && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={secondaryRightAction.onPress}
              style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
            >
              <Icon name={secondaryRightAction.icon} size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}

          {rightAction && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={rightAction.onPress}
              style={[styles.actionButton, { backgroundColor: colors.surfaceVariant, marginLeft: spacing.xs }]}
            >
              <Icon name={rightAction.icon} size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

