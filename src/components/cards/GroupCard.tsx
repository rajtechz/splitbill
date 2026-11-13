import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Group } from '../../types';
import { formatMoney } from '../../utils/money';
import { Icon, IconName } from '../common/Icon';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
  style?: ViewStyle;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onPress, style }) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const getCategoryIcon = (category: string): IconName => {
    switch (category) {
      case 'Trip':
        return 'travel';
      case 'Home':
        return 'home-cat';
      case 'Office':
        return 'groups';
      default:
        return 'sparkles';
    }
  };

  const isPositive = group.userBalance > 0;
  const isZero = Math.abs(group.userBalance) < 0.01;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md + 2,
          marginBottom: spacing.sm + 2,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          ...shadows.soft,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {/* Category Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Icon name={getCategoryIcon(group.category)} size={22} color={colors.primary} />
        </View>

        {/* Group Info */}
        <View style={styles.info}>
          <Text style={[typography.titleMedium, { color: colors.textPrimary }]} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {group.members.length} members • {group.category}
          </Text>
        </View>

        {/* Balance Status */}
        <View style={styles.balanceContainer}>
          <Text
            style={[
              typography.caption,
              {
                color: isZero ? colors.textMuted : isPositive ? colors.success : colors.danger,
                fontWeight: '600',
              },
            ]}
          >
            {isZero ? 'settled' : isPositive ? 'you are owed' : 'you owe'}
          </Text>
          {!isZero && (
            <Text
              style={[
                typography.amountSmall,
                {
                  color: isPositive ? colors.success : colors.danger,
                  marginTop: 2,
                },
              ]}
            >
              {formatMoney(Math.abs(group.userBalance), group.currency)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
});

