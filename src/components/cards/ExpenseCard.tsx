import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Expense, ExpenseCategory } from '../../types';
import { formatMoney } from '../../utils/money';
import { isUserMatch } from '../../utils/userMatch';
import { Icon, IconName } from '../common/Icon';
import { format } from 'date-fns';

interface ExpenseCardProps {
  expense: Expense;
  currentUserId?: string;
  currentUserName?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  currentUserId = 'usr_me',
  currentUserName,
  onPress,
  style,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const getCategoryIcon = (category: ExpenseCategory): IconName => {
    switch (category) {
      case 'Food':
      case 'Groceries':
        return 'food';
      case 'Transport':
      case 'Travel':
        return 'travel';
      case 'Rent':
        return 'home-cat';
      case 'Utilities':
        return 'utilities';
      case 'Shopping':
        return 'shopping';
      case 'Entertainment':
        return 'entertainment';
      case 'Medical':
        return 'medical';
      default:
        return 'receipt';
    }
  };

  const matchTarget = { id: currentUserId, userId: currentUserId, name: currentUserName };
  const userParticipant = expense.participants.find(p => isUserMatch(p, matchTarget));
  const paidByUser = userParticipant?.paidAmount || 0;
  const userShare = userParticipant?.shareAmount || 0;
  const userNet = paidByUser - userShare;

  const isPositive = userNet > 0;
  const isZero = !userParticipant || Math.abs(userNet) < 0.01;

  // Primary payer name
  const topPayer = [...expense.participants].sort((a, b) => b.paidAmount - a.paidAmount)[0];
  const payerText = isUserMatch(topPayer, matchTarget) ? 'You paid' : `${topPayer?.name || 'Someone'} paid`;

  let formattedDate = '';
  try {
    formattedDate = format(new Date(expense.date), 'MMM d');
  } catch {
    formattedDate = expense.date;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          ...shadows.soft,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {/* Date block */}
        <View style={[styles.dateBlock, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>
            {formattedDate}
          </Text>
        </View>

        {/* Category Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Icon name={getCategoryIcon(expense.category)} size={20} color={colors.primary} />
        </View>

        {/* Title & Payer */}
        <View style={styles.details}>
          <Text style={[typography.titleMedium, { color: colors.textPrimary }]} numberOfLines={1}>
            {expense.title}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
            {payerText} {formatMoney(expense.totalAmount, expense.currency)}
            {expense.groupName ? ` • ${expense.groupName}` : ''}
          </Text>
        </View>

        {/* Your balance outcome */}
        <View style={styles.balanceCol}>
          <Text
            style={[
              typography.caption,
              {
                color: isZero ? colors.textMuted : isPositive ? colors.success : colors.danger,
                fontWeight: '600',
              },
            ]}
          >
            {isZero ? 'not involved' : isPositive ? 'you lent' : 'you borrowed'}
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
              {formatMoney(Math.abs(userNet), expense.currency)}
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
  dateBlock: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  details: {
    flex: 1,
  },
  balanceCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
});

