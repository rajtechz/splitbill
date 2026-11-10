import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { BalanceCard } from '../../../components/cards/BalanceCard';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon } from '../../../components/common/Icon';
import { SettlementCard } from '../../../components/cards/SettlementCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatMoney } from '../../../utils/money';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BalancesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const {
    friends,
    settlements,
    balanceSummary,
    simplifiedDebts,
    isSyncing,
    refreshAll,
    confirmSettlement,
    rejectSettlement,
  } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);

  const friendsWhoOweYou = friends.filter(f => f.netBalance > 0);
  const friendsYouOwe = friends.filter(f => f.netBalance < 0);

  const handleRemindFriend = async (friendName: string, amount: number) => {
    try {
      await Share.share({
        message: `Hi ${friendName}, gentle reminder regarding ₹${amount} on SplitMate. Whenever convenient, please settle up!`,
      });
    } catch {}
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Balances & Debt"
        subtitle="Track & simplify balances"
        rightAction={{
          icon: 'wallet',
          onPress: () => navigation.navigate('RecordSettlement', {}),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={refreshAll}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Balance Card */}
        <BalanceCard
          totalBalance={balanceSummary.totalBalance}
          youOwe={balanceSummary.youOwe}
          youAreOwed={balanceSummary.youAreOwed}
          currency={balanceSummary.currency}
          style={{ marginBottom: spacing.lg }}
        />

        {/* Smart Debt Simplification Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.lg,
              padding: spacing.md + 2,
              borderColor: colors.borderSubtle,
              marginBottom: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
              <Icon name="shield" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Smart Debt Simplification
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Minimizes total payment transfers needed
              </Text>
            </View>
          </View>

          {simplifiedDebts.length > 0 ? (
            simplifiedDebts.map((debt, idx) => (
              <View
                key={idx}
                style={[
                  styles.debtItem,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: borderRadius.sm,
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
                styles.settledNote,
                { backgroundColor: colors.successLight, borderRadius: borderRadius.sm },
              ]}
            >
              <Icon name="check" size={18} color={colors.success} />
              <Text style={[typography.caption, { color: colors.success, marginLeft: 6, fontWeight: '700' }]}>
                All debts are fully settled!
              </Text>
            </View>
          )}
        </View>

        {/* Friends Who Owe You */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            Friends Who Owe You ({friendsWhoOweYou.length})
          </Text>
        </View>

        {friendsWhoOweYou.length > 0 ? (
          friendsWhoOweYou.map(friend => (
            <View
              key={friend.id}
              style={[
                styles.personBalanceCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  borderRadius: borderRadius.lg,
                  ...shadows.soft,
                },
              ]}
            >
              <Avatar name={friend.name} url={friend.avatarUrl} size={42} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                  {friend.name}
                </Text>
                <Text style={[typography.caption, { color: colors.success, fontWeight: '700', marginTop: 2 }]}>
                  Owes you {formatMoney(friend.netBalance, friend.currency)}
                </Text>
              </View>

              <View style={styles.actionPills}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleRemindFriend(friend.name, friend.netBalance)}
                  style={[styles.smallBtn, { backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '600' }]}>
                    Remind
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('RecordSettlement', {
                      preselectedPayerId: friend.userId,
                      preselectedReceiverId: currentUser?.id,
                      suggestedAmount: friend.netBalance,
                      currency: friend.currency,
                    })
                  }
                  style={[styles.smallBtn, { backgroundColor: colors.primaryLight, marginLeft: 6 }]}
                >
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                    Settle
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
            Nobody currently owes you money.
          </Text>
        )}

        {/* Friends You Owe */}
        <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            Friends You Owe ({friendsYouOwe.length})
          </Text>
        </View>

        {friendsYouOwe.length > 0 ? (
          friendsYouOwe.map(friend => (
            <View
              key={friend.id}
              style={[
                styles.personBalanceCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  borderRadius: borderRadius.lg,
                  ...shadows.soft,
                },
              ]}
            >
              <Avatar name={friend.name} url={friend.avatarUrl} size={42} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                  {friend.name}
                </Text>
                <Text style={[typography.caption, { color: colors.danger, fontWeight: '700', marginTop: 2 }]}>
                  You owe {formatMoney(Math.abs(friend.netBalance), friend.currency)}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('RecordSettlement', {
                    preselectedPayerId: currentUser?.id,
                    preselectedReceiverId: friend.userId,
                    suggestedAmount: Math.abs(friend.netBalance),
                    currency: friend.currency,
                  })
                }
                style={[styles.smallBtn, { backgroundColor: colors.dangerLight }]}
              >
                <Text style={[typography.caption, { color: colors.danger, fontWeight: '700' }]}>
                  Pay Now
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
            You don't owe anyone right now.
          </Text>
        )}

        {/* Recent Settlements History */}
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            Recent Settlement History
          </Text>
        </View>

        {settlements.length > 0 ? (
          settlements.map(s => (
            <SettlementCard
              key={s.id}
              settlement={s}
              currentUserId={currentUser?.id}
              onConfirm={() => confirmSettlement(s.id)}
              onReject={() => rejectSettlement(s.id)}
            />
          ))
        ) : (
          <EmptyState
            title="No payments recorded"
            description="Record payments between friends to clear balances."
            iconName="wallet"
          />
        )}
      </ScrollView>
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
  card: {
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 6,
  },
  settledNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  personBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  actionPills: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});

