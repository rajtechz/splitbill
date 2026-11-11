import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
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
import { ExpenseCard } from '../../../components/cards/ExpenseCard';
import { SettlementCard } from '../../../components/cards/SettlementCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { ConfirmationModal } from '../../../components/modals/ConfirmationModal';
import { formatMoney } from '../../../utils/money';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FriendDetailsRouteProp = RouteProp<RootStackParamList, 'FriendDetails'>;

export const FriendDetailsScreen: React.FC = () => {
  const route = useRoute<FriendDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const { friendId } = route.params;
  const { friends, expenses, settlements, removeFriend, confirmSettlement, rejectSettlement } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);

  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements'>('expenses');
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const friend = friends.find(f => f.id === friendId);
  if (!friend) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <AppHeader title="Friend" showBack onBack={() => navigation.goBack()} />
        <EmptyState title="Friend not found" description="This contact may have been removed." />
      </View>
    );
  }

  // Filter shared expenses with this friend
  const sharedExpenses = expenses.filter(
    e =>
      e.participants.some(p => p.userId === currentUser?.id) &&
      e.participants.some(p => p.userId === friend.userId)
  );

  // Filter shared settlements with this friend
  const sharedSettlements = settlements.filter(
    s =>
      (s.payerId === currentUser?.id && s.receiverId === friend.userId) ||
      (s.payerId === friend.userId && s.receiverId === currentUser?.id)
  );

  const handleRemoveFriend = async () => {
    setShowRemoveModal(false);
    await removeFriend(friend.id);
    navigation.goBack();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Hey ${friend.name}, check out our shared expenses on SplitMate!`,
      });
    } catch {}
  };

  const isOwed = friend.netBalance > 0;
  const isZero = Math.abs(friend.netBalance) < 0.01;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title={friend.name}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'share',
          onPress: handleShare,
        }}
        secondaryRightAction={{
          icon: 'trash',
          onPress: () => setShowRemoveModal(true),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Profile and Net Balance Card */}
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
          <View style={styles.profileRow}>
            <Avatar name={friend.name} url={friend.avatarUrl} size={60} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{friend.name}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {friend.email}
              </Text>
              {friend.phoneNumber && (
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {friend.phoneNumber}
                </Text>
              )}
            </View>
          </View>

          {/* Balance status banner */}
          <View
            style={[
              styles.balanceStatusBox,
              {
                backgroundColor: isZero
                  ? colors.surfaceVariant
                  : isOwed
                  ? colors.successLight
                  : colors.dangerLight,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <View>
              <Text
                style={[
                  typography.caption,
                  {
                    color: isZero
                      ? colors.textSecondary
                      : isOwed
                      ? colors.success
                      : colors.danger,
                    fontWeight: '700',
                  },
                ]}
              >
                {isZero ? 'ALL SETTLED' : isOwed ? `${friend.name.toUpperCase()} OWES YOU` : `YOU OWE ${friend.name.toUpperCase()}`}
              </Text>
              <Text
                style={[
                  typography.amountLarge,
                  {
                    color: isZero
                      ? colors.textPrimary
                      : isOwed
                      ? colors.success
                      : colors.danger,
                    marginTop: 2,
                  },
                ]}
              >
                {isZero ? formatMoney(0, friend.currency) : formatMoney(Math.abs(friend.netBalance), friend.currency)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('AddExpense', { preselectedFriendId: friend.id })
              }
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
                  preselectedPayerId: isOwed ? friend.userId : currentUser?.id,
                  preselectedReceiverId: isOwed ? currentUser?.id : friend.userId,
                  suggestedAmount: Math.abs(friend.netBalance),
                  currency: friend.currency,
                })
              }
              style={[styles.btn, { backgroundColor: colors.primaryLight, marginLeft: 8 }]}
            >
              <Icon name="wallet" size={16} color={colors.primary} />
              <Text style={[typography.buttonMedium, { color: colors.primary, marginLeft: 6 }]}>
                Settle Up
              </Text>
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
          <TouchableOpacity
            onPress={() => setActiveTab('expenses')}
            style={[
              styles.tabItem,
              activeTab === 'expenses' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                typography.buttonMedium,
                { color: activeTab === 'expenses' ? colors.primary : colors.textSecondary },
              ]}
            >
              Expenses ({sharedExpenses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('settlements')}
            style={[
              styles.tabItem,
              activeTab === 'settlements' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                typography.buttonMedium,
                { color: activeTab === 'settlements' ? colors.primary : colors.textSecondary },
              ]}
            >
              Settlement History ({sharedSettlements.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'expenses' ? (
            sharedExpenses.length > 0 ? (
              sharedExpenses.map(exp => (
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
                title="No shared expenses"
                description={`You and ${friend.name} have not added any direct expenses together yet.`}
                iconName="receipt"
                actionTitle="Add Shared Expense"
                onAction={() =>
                  navigation.navigate('AddExpense', { preselectedFriendId: friend.id })
                }
              />
            )
          ) : sharedSettlements.length > 0 ? (
            sharedSettlements.map(settlement => (
              <SettlementCard
                key={settlement.id}
                settlement={settlement}
                currentUserId={currentUser?.id}
                onConfirm={() => confirmSettlement(settlement.id)}
                onReject={() => rejectSettlement(settlement.id)}
              />
            ))
          ) : (
            <EmptyState
              title="No settlements recorded"
              description="Record a cash, UPI or bank transfer payment when you or your friend settle up."
              iconName="wallet"
            />
          )}
        </View>
      </ScrollView>

      {/* Remove Confirmation Modal */}
      <ConfirmationModal
        visible={showRemoveModal}
        title="Remove Friend"
        message={`Are you sure you want to remove ${friend.name}?`}
        confirmText="Remove"
        isDestructive
        onConfirm={handleRemoveFriend}
        onCancel={() => setShowRemoveModal(false)}
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceStatusBox: {
    padding: 16,
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
});

