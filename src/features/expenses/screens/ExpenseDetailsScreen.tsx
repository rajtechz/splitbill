import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon } from '../../../components/common/Icon';
import { EmptyState } from '../../../components/common/EmptyState';
import { ConfirmationModal } from '../../../components/modals/ConfirmationModal';
import { formatMoney } from '../../../utils/money';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ExpenseDetailsRouteProp = RouteProp<RootStackParamList, 'ExpenseDetails'>;

export const ExpenseDetailsScreen: React.FC = () => {
  const route = useRoute<ExpenseDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const { expenseId } = route.params;
  const { expenses, deleteExpense } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const expense = expenses.find(e => e.id === expenseId);
  if (!expense) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <AppHeader title="Expense" showBack onBack={() => navigation.goBack()} />
        <EmptyState title="Expense not found" description="This expense may have been deleted." />
      </View>
    );
  }

  const handleDelete = async () => {
    setShowDeleteModal(false);
    await deleteExpense(expense.id);
    navigation.goBack();
  };

  let formattedDate = '';
  try {
    formattedDate = format(new Date(expense.date), 'EEEE, MMMM d, yyyy');
  } catch {
    formattedDate = expense.date;
  }

  const userParticipant = expense.participants.find(p => p.userId === currentUser?.id);
  const userNet = (userParticipant?.paidAmount || 0) - (userParticipant?.shareAmount || 0);
  const isNetPositive = userNet > 0;
  const isNetZero = Math.abs(userNet) < 0.01;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Expense Details"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'edit',
          onPress: () => navigation.navigate('EditExpense', { expenseId: expense.id }),
        }}
        secondaryRightAction={{
          icon: 'trash',
          onPress: () => setShowDeleteModal(true),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
      >
        {/* Main Header Banner */}
        <View
          style={[
            styles.mainCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              borderColor: colors.borderSubtle,
              ...shadows.soft,
            },
          ]}
        >
          <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              {expense.category.toUpperCase()}
            </Text>
          </View>

          <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 12 }]}>
            {expense.title}
          </Text>

          <Text style={[typography.amountLarge, { color: colors.textPrimary, marginVertical: 8 }]}>
            {formatMoney(expense.totalAmount, expense.currency)}
          </Text>

          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Added on {formattedDate}
            {expense.groupName ? ` • ${expense.groupName}` : ''}
          </Text>

          {/* User Net Balance Impact Banner */}
          <View
            style={[
              styles.impactBanner,
              {
                backgroundColor: isNetZero
                  ? colors.surfaceVariant
                  : isNetPositive
                  ? colors.successLight
                  : colors.dangerLight,
                borderRadius: borderRadius.md,
                marginTop: spacing.lg,
              },
            ]}
          >
            <Icon
              name={isNetZero ? 'info' : isNetPositive ? 'arrow-down-left' : 'arrow-up-right'}
              size={20}
              color={isNetZero ? colors.textSecondary : isNetPositive ? colors.success : colors.danger}
            />
            <Text
              style={[
                typography.titleMedium,
                {
                  color: isNetZero ? colors.textSecondary : isNetPositive ? colors.success : colors.danger,
                  marginLeft: 10,
                  flex: 1,
                },
              ]}
            >
              {isNetZero
                ? 'You are not involved in this expense'
                : isNetPositive
                ? `You lent ${formatMoney(Math.abs(userNet), expense.currency)}`
                : `You borrowed ${formatMoney(Math.abs(userNet), expense.currency)}`}
            </Text>
          </View>
        </View>

        {/* Paid By Breakdown */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.xl, marginBottom: 8 },
          ]}
        >
          PAID BY
        </Text>
        {expense.participants
          .filter(p => p.paidAmount > 0)
          .map(p => (
            <View
              key={p.userId}
              style={[
                styles.participantRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Avatar name={p.name} url={p.avatarUrl} size={36} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                  {p.userId === currentUser?.id ? 'You' : p.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Paid in full or contribution
                </Text>
              </View>
              <Text style={[typography.amountSmall, { color: colors.textPrimary }]}>
                {formatMoney(p.paidAmount, expense.currency)}
              </Text>
            </View>
          ))}

        {/* Split Breakdown */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.xl, marginBottom: 8 },
          ]}
        >
          SPLIT BREAKDOWN ({expense.splitMethod.toUpperCase()})
        </Text>
        {expense.participants.map(p => {
          const pNet = p.paidAmount - p.shareAmount;
          const isPos = pNet > 0;
          const isZero = Math.abs(pNet) < 0.01;

          return (
            <View
              key={p.userId}
              style={[
                styles.participantRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Avatar name={p.name} url={p.avatarUrl} size={36} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                  {p.userId === currentUser?.id ? `${p.name} (You)` : p.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Share: {formatMoney(p.shareAmount, expense.currency)}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isZero ? colors.textMuted : isPos ? colors.success : colors.danger,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {isZero ? 'Settled' : isPos ? 'Gets back' : 'Owes'}
                </Text>
                {!isZero && (
                  <Text
                    style={[
                      typography.amountSmall,
                      { color: isPos ? colors.success : colors.danger, marginTop: 2 },
                    ]}
                  >
                    {formatMoney(Math.abs(pNet), expense.currency)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {/* Notes if available */}
        {expense.notes ? (
          <View
            style={[
              styles.notesBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                borderRadius: borderRadius.md,
                marginTop: spacing.xl,
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>
              NOTES
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
              {expense.notes}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Expense"
        message={`Are you sure you want to delete "${expense.title}"? Balances will be recalculated.`}
        confirmText="Delete"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
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
  mainCard: {
    borderWidth: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  impactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  notesBox: {
    padding: 14,
    borderWidth: 1,
  },
});

