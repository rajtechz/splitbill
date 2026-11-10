import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Friend } from '../../types';
import { formatMoney } from '../../utils/money';
import { Avatar } from '../avatars/Avatar';

interface FriendCardProps {
  friend: Friend;
  onPress: () => void;
  style?: ViewStyle;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, onPress, style }) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const isPositive = friend.netBalance > 0;
  const isZero = Math.abs(friend.netBalance) < 0.01;

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
        <Avatar name={friend.name} url={friend.avatarUrl} size={44} />

        <View style={styles.info}>
          <Text style={[typography.titleMedium, { color: colors.textPrimary }]} numberOfLines={1}>
            {friend.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
            {friend.email}
          </Text>
        </View>

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
            {isZero ? 'settled' : isPositive ? 'owes you' : 'you owe'}
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
              {formatMoney(Math.abs(friend.netBalance), friend.currency)}
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
  info: {
    flex: 1,
    marginLeft: 12,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
});

