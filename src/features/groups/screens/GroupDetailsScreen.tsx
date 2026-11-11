import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { ExpenseCard } from '../../../components/cards/ExpenseCard';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon } from '../../../components/common/Icon';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatMoney } from '../../../utils/money';
import { ConfirmationModal } from '../../../components/modals/ConfirmationModal';
import { calculateBalances, simplifyDebts, calculateUserBalance } from '../../balances/calculations/debtEngine';
import { isUserMatch } from '../../../utils/userMatch';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type GroupDetailsRouteProp = RouteProp<RootStackParamList, 'GroupDetails'>;

export const GroupDetailsScreen: React.FC = () => {
  const route = useRoute<GroupDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const { groupId } = route.params;
  const { groups, expenses, settlements, deleteGroup } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'members'>('expenses');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const group = groups.find(g => g.id === groupId);
  if (!group) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <AppHeader title="Group" showBack onBack={() => navigation.goBack()} />
        <EmptyState title="Group not found" description="This group may have been removed." />
      </View>
    );
  }

  const groupExpenses = expenses.filter(e => e.groupId === groupId);
  const groupSettlements = settlements.filter(s => s.groupId === groupId);

  const memberBalances = calculateBalances(groupExpenses, groupSettlements, group.currency, currentUser);
  const simplifiedDebts = simplifyDebts(groupExpenses, groupSettlements, group.currency, currentUser);
  const userSummary = calculateUserBalance(currentUser?.id || 'usr_me', groupExpenses, groupSettlements, group.currency, currentUser);
  const currentGroupBalance = userSummary.totalBalance;

  const handleDeleteGroup = async () => {
    setShowDeleteModal(false);
    await deleteGroup(groupId);
    navigation.goBack();
  };

  const isNetPositive = currentGroupBalance > 0;
  const isNetZero = Math.abs(currentGroupBalance) < 0.01;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title={group.name}
        subtitle={`${group.members.length} members • ${group.category}`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'edit',
          onPress: () => navigation.navigate('EditGroup', { groupId }),
        }}
        secondaryRightAction={{
          icon: 'trash',
          onPress: () => setShowDeleteModal(true),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Group Financial Summary Banner */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.borderSubtle,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={styles.bannerRow}>
            <View>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                TOTAL GROUP SPENDING
              </Text>
              <Text style={[typography.amountLarge, { color: colors.textPrimary, marginTop: 2 }]}>
                {formatMoney(group.totalSpending, group.currency)}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                YOUR BALANCE
              </Text>
              <Text
                style={[
                  typography.amountMedium,
                  {
                    color: isNetZero
                      ? colors.textSecondary
                      : isNetPositive
                      ? colors.success
                      : colors.danger,
                    marginTop: 4,
                  },
                ]}
              >
                {isNetZero
                  ? 'All settled up'
                  : `${isNetPositive ? '+' : '-'}${formatMoney(
                      Math.abs(currentGroupBalance),
                      group.currency
                    )}`}
              </Text>
            </View>
          </View>

          {/* Quick Action Buttons for Group */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AddExpense', { preselectedGroupId: group.id })}
              style={[styles.btn, { backgroundColor: colors.primary }]}
            >
              <Icon name="plus" size={16} color="#FFFFFF" />
              <Text style={[typography.buttonMedium, { color: '#FFFFFF', marginLeft: 6 }]}>
                Add Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('RecordSettlement', {
                  preselectedGroupId: group.id,
                  currency: group.currency,
                })
              }
              style={[styles.btn, { backgroundColor: colors.primaryLight, marginLeft: 8 }]}
            >
              <Icon name="wallet" size={16} color={colors.primary} />
              <Text style={[typography.buttonMedium, { color: colors.primary, marginLeft: 6 }]}>
                Settle Up
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AddGroupMember', { groupId: group.id })}
              style={[styles.iconBtn, { backgroundColor: colors.surfaceVariant, marginLeft: 8 }]}
            >
              <Icon name="user-plus" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle },
          ]}
        >
          {(['expenses', 'balances', 'members'] as const).map(tab => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabItem,
                  isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    typography.buttonMedium,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                      textTransform: 'capitalize',
                    },
                  ]}
                >
                  {tab === 'expenses'
                    ? `Expenses (${groupExpenses.length})`
                    : tab === 'balances'
                    ? 'Balances'
                    : `Members (${group.members.length})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'expenses' && (
            <>
              {groupExpenses.length > 0 ? (
                groupExpenses.map(exp => (
                  <ExpenseCard
                    key={exp.id}
                    expense={exp}
                    currentUserId={currentUser?.id}
                    currentUserName={currentUser?.name}
                    onPress={() => navigation.navigate('ExpenseDetails', { expenseId: exp.id })}
                  />
                ))
              ) : (
                <EmptyState
                  title="No expenses in this group"
                  description="Split receipts, meals, bookings, or rent with your group members."
                  iconName="receipt"
                  actionTitle="Add Group Expense"
                  onAction={() =>
                    navigation.navigate('AddExpense', { preselectedGroupId: group.id })
                  }
                />
              )}
            </>
          )}

          {activeTab === 'balances' && (
            <>
              {/* Member Net Balance Breakdown */}
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: 12 }]}>
                Member Net Positions
              </Text>
              {group.members.map(member => {
                const bal = memberBalances[member.userId]?.netAmount || 0;
                const isPositive = bal > 0;
                const isZero = Math.abs(bal) < 0.01;

                return (
                  <View
                    key={member.userId}
                    style={[
                      styles.memberBalanceCard,
                      {
                        backgroundColor: colors.surface,
                        borderRadius: borderRadius.md,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Avatar name={member.name} size={36} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                        {isUserMatch(member, currentUser) ? `${member.name} (You)` : member.name}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {isZero ? 'Settled' : isPositive ? 'Gets back' : 'Owes in group'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        typography.amountSmall,
                        {
                          color: isZero
                            ? colors.textMuted
                            : isPositive
                            ? colors.success
                            : colors.danger,
                        },
                      ]}
                    >
                      {formatMoney(Math.abs(bal), group.currency)}
                    </Text>
                  </View>
                );
              })}

              {/* Smart Debt Simplification Section */}
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Icon name="shield" size={18} color={colors.primary} />
                  <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: 8 }]}>
                    Smart Debt Simplification
                  </Text>
                </View>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginBottom: 12 },
                  ]}
                >
                  Minimizes transactions so everyone pays the fewest people possible.
                </Text>

                {simplifiedDebts.length > 0 ? (
                  simplifiedDebts.map((debt, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.debtRow,
                        {
                          backgroundColor: colors.surface,
                          borderRadius: borderRadius.md,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                          <Text style={{ fontWeight: '700' }}>{debt.fromUserName}</Text> pays{' '}
                          <Text style={{ fontWeight: '700' }}>{debt.toUserName}</Text>
                        </Text>
                      </View>
                      <Text style={[typography.amountSmall, { color: colors.primary, marginLeft: 8 }]}>
                        {formatMoney(debt.amount, debt.currency)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View
                    style={[
                      styles.allSettledBox,
                      { backgroundColor: colors.successLight, borderRadius: borderRadius.md },
                    ]}
                  >
                    <Icon name="check" size={20} color={colors.success} />
                    <Text style={[typography.caption, { color: colors.success, marginLeft: 8, fontWeight: '700' }]}>
                      All group members are completely settled up!
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {activeTab === 'members' && (
            <>
              {group.members.map(m => (
                <View
                  key={m.userId}
                  style={[
                    styles.memberRow,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: borderRadius.md,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Avatar name={m.name} size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                      {isUserMatch(m, currentUser) ? `${m.name} (You)` : m.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {m.email}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor:
                          m.role === 'admin' ? colors.primaryLight : colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: m.role === 'admin' ? colors.primary : colors.textSecondary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {m.role.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AddGroupMember', { groupId: group.id })}
                style={[
                  styles.addMemberBtn,
                  {
                    borderColor: colors.primary,
                    borderRadius: borderRadius.md,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Icon name="user-plus" size={18} color={colors.primary} />
                <Text style={[typography.buttonMedium, { color: colors.primary, marginLeft: 8 }]}>
                  Add Another Member
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Group"
        message={`Are you sure you want to delete "${group.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  banner: {
    borderBottomWidth: 1,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    padding: 16,
  },
  memberBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  allSettledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});

