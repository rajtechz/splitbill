import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { formatMoney } from '../../utils/money';
import { CurrencyCode } from '../../types';
import { Icon } from '../common/Icon';

interface BalanceCardProps {
  totalBalance: number;
  youOwe: number;
  youAreOwed: number;
  currency?: CurrencyCode;
  style?: ViewStyle;
  onPressOwe?: () => void;
  onPressOwed?: () => void;
  onPressTotal?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  youOwe,
  youAreOwed,
  currency = 'INR',
  style,
  onPressOwe,
  onPressOwed,
  onPressTotal,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const isNetPositive = totalBalance > 0;
  const isNetZero = totalBalance === 0;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          ...shadows.soft,
        },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={onPressTotal ? 0.7 : 1}
        disabled={!onPressTotal}
        onPress={onPressTotal}
      >
        <View style={styles.topRow}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>TOTAL NET BALANCE</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isNetZero
                  ? colors.surfaceVariant
                  : isNetPositive
                  ? colors.successLight
                  : colors.dangerLight,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: isNetZero
                    ? colors.textSecondary
                    : isNetPositive
                    ? colors.success
                    : colors.danger,
                  fontWeight: '600',
                },
              ]}
            >
              {isNetZero ? 'All settled' : isNetPositive ? 'You are owed' : 'You owe'}
            </Text>
          </View>
        </View>

        <Text
          style={[
            typography.amountLarge,
            {
              color: isNetZero ? colors.textPrimary : isNetPositive ? colors.success : colors.danger,
              marginVertical: spacing.xs,
            },
          ]}
        >
          {isNetZero ? formatMoney(0, currency) : formatMoney(totalBalance, currency, { showSign: true })}
        </Text>
      </TouchableOpacity>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.summaryRow}>
        {/* You owe */}
        <TouchableOpacity
          activeOpacity={onPressOwe ? 0.7 : 1}
          disabled={!onPressOwe}
          onPress={onPressOwe}
          style={[
            styles.col,
            onPressOwe && {
              backgroundColor: colors.surfaceVariant,
              padding: 8,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <View style={styles.labelWithIcon}>
            <View style={[styles.iconDot, { backgroundColor: colors.dangerLight }]}>
              <Icon name="arrow-up-right" size={14} color={colors.danger} />
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6, flex: 1 }]}>
              You owe
            </Text>
            {onPressOwe && <Icon name="chevron-right" size={14} color={colors.textSecondary} />}
          </View>
          <Text style={[typography.amountMedium, { color: colors.danger, marginTop: 4 }]}>
            {formatMoney(youOwe, currency)}
          </Text>
        </TouchableOpacity>

        <View style={[styles.verticalDivider, { backgroundColor: colors.divider }]} />

        {/* You are owed */}
        <TouchableOpacity
          activeOpacity={onPressOwed ? 0.7 : 1}
          disabled={!onPressOwed}
          onPress={onPressOwed}
          style={[
            styles.col,
            onPressOwed && {
              backgroundColor: colors.surfaceVariant,
              padding: 8,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <View style={styles.labelWithIcon}>
            <View style={[styles.iconDot, { backgroundColor: colors.successLight }]}>
              <Icon name="arrow-down-left" size={14} color={colors.success} />
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6, flex: 1 }]}>
              You are owed
            </Text>
            {onPressOwed && <Icon name="chevron-right" size={14} color={colors.textSecondary} />}
          </View>
          <Text style={[typography.amountMedium, { color: colors.success, marginTop: 4 }]}>
            {formatMoney(youAreOwed, currency)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 12,
  },
});

