import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { BalanceCard } from '../../../components/cards/BalanceCard';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon } from '../../../components/common/Icon';
import { SettlementCard } from '../../../components/cards/SettlementCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { ProPaywallModal } from '../../../components/modals/ProPaywallModal';
import { QuickPayModal } from '../../../components/modals/QuickPayModal';
import { formatMoney } from '../../../utils/money';
import { getPeopleDebts, PersonDebtDetail } from '../calculations/debtEngine';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BalancesRouteProp = RouteProp<MainTabParamList, 'BalancesTab'>;

export const BalancesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BalancesRouteProp>();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const {
    friends,
    groups,
    expenses,
    settlements,
    balanceSummary,
    simplifiedDebts,
    refreshAll,
    confirmSettlement,
    rejectSettlement,
  } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const isPro = useAuthStore(state => state.isPro);
  const [showProModal, setShowProModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Pay Modal State
  const [selectedPersonToPay, setSelectedPersonToPay] = useState<PersonDebtDetail | null>(null);
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);

  // Filter tabs: 'all' | 'owe' (kisko dena hai) | 'owed' (kisse lena hai)
  const [activeTab, setActiveTab] = useState<'all' | 'owe' | 'owed'>(route.params?.filter || 'all');

  useEffect(() => {
    if (route.params?.filter) {
      setActiveTab(route.params.filter);
    }
  }, [route.params?.filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setTimeout(() => setRefreshing(false), 350);
    }
  };

  // Comprehensive calculation of who you owe and who owes you across ALL expenses & settlements
  const { peopleYouOwe, peopleWhoOweYou } = useMemo(() => {
    return getPeopleDebts(
      expenses,
      settlements,
      friends,
      groups,
      balanceSummary.currency,
      currentUser
    );
  }, [expenses, settlements, friends, groups, balanceSummary.currency, currentUser]);

  const handleRemindPerson = async (name: string, amount: number) => {
    try {
      await Share.share({
        message: `Hi ${name}, gentle reminder regarding ₹${amount} on SplitMate. Whenever convenient, please settle up!`,
      });
    } catch {}
  };

  const handleOpenPay = (person: PersonDebtDetail) => {
    setSelectedPersonToPay(person);
    setShowQuickPayModal(true);
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
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
          style={{ marginBottom: spacing.md }}
          onPressOwe={() => setActiveTab('owe')}
          onPressOwed={() => setActiveTab('owed')}
          onPressTotal={() => setActiveTab('all')}
        />

        {/* Filter Segmented Control */}
        <View
          style={[
            styles.filterBar,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('all')}
            style={[
              styles.filterTab,
              activeTab === 'all' && [
                styles.filterTabActive,
                { backgroundColor: colors.surface, ...shadows.soft },
              ],
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                typography.caption,
                {
                  fontWeight: activeTab === 'all' ? '800' : '600',
                  color: activeTab === 'all' ? colors.textPrimary : colors.textSecondary,
                },
              ]}
            >
              All ({peopleWhoOweYou.length + peopleYouOwe.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('owed')}
            style={[
              styles.filterTab,
              activeTab === 'owed' && [
                styles.filterTabActive,
                { backgroundColor: colors.surface, ...shadows.soft },
              ],
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: colors.success,
                  marginRight: 5,
                }}
              />
              <Text
                numberOfLines={1}
                style={[
                  typography.caption,
                  {
                    fontWeight: activeTab === 'owed' ? '800' : '600',
                    color: activeTab === 'owed' ? colors.success : colors.textSecondary,
                  },
                ]}
              >
                You Are Owed ({peopleWhoOweYou.length})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('owe')}
            style={[
              styles.filterTab,
              activeTab === 'owe' && [
                styles.filterTabActive,
                { backgroundColor: colors.surface, ...shadows.soft },
              ],
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: colors.danger,
                  marginRight: 5,
                }}
              />
              <Text
                numberOfLines={1}
                style={[
                  typography.caption,
                  {
                    fontWeight: activeTab === 'owe' ? '800' : '600',
                    color: activeTab === 'owe' ? colors.danger : colors.textSecondary,
                  },
                ]}
              >
                You Owe ({peopleYouOwe.length})
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Smart Debt Simplification Card - Shown on 'all' or 'owe' */}
        {activeTab === 'all' && (
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
              <View style={[styles.iconWrap, { backgroundColor: isPro ? colors.primaryLight : '#FEF3C7' }]}>
                <Icon name={isPro ? 'shield' : 'crown'} size={18} color={isPro ? colors.primary : '#D97706'} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                    Smart Debt Minimizer
                  </Text>
                  <View
                    style={{
                      marginLeft: 8,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: isPro ? colors.primaryLight : '#FEF3C7',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: isPro ? colors.primary : '#B45309',
                        letterSpacing: 0.5,
                      }}
                    >
                      {isPro ? 'PRO ACTIVE' : 'PRO ONLY'}
                    </Text>
                  </View>
                </View>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Minimizes total payment transfers needed across all groups
                </Text>
              </View>
            </View>

            {isPro ? (
              simplifiedDebts.length > 0 ? (
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
              )
            ) : (
              <View
                style={{
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.textSecondary, textAlign: 'center', marginBottom: 12 },
                  ]}
                >
                  Upgrade to SplitMate Pro to automatically calculate the minimum number of transactions needed to settle all debts across your groups.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowProModal(true)}
                  style={{
                    backgroundColor: '#D97706',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: borderRadius.full,
                  }}
                >
                  <Icon name="crown" size={16} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13, marginLeft: 6 }}>
                    Unlock Debt Minimizer
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Section: People Who Owe You (Kisse lena hai) */}
        {(activeTab === 'all' || activeTab === 'owed') && (
          <View style={{ marginBottom: spacing.lg }}>
            <View style={[styles.sectionHeader, { alignItems: 'flex-start' }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  People Who Owe You
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {activeTab === 'owed' ? 'Kisse Lena Hai • ' : ''}
                  {peopleWhoOweYou.length} {peopleWhoOweYou.length === 1 ? 'person owes' : 'people owe'} you
                </Text>
              </View>
              {activeTab === 'owed' && (
                <View
                  style={{
                    backgroundColor: colors.successLight,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: borderRadius.md,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={[typography.titleMedium, { color: colors.success, fontWeight: '800' }]}>
                    +{formatMoney(balanceSummary.youAreOwed, balanceSummary.currency, { absolute: true })}
                  </Text>
                </View>
              )}
            </View>

            {peopleWhoOweYou.length > 0 ? (
              peopleWhoOweYou.map(person => (
                <TouchableOpacity
                  key={person.userId || person.name}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (person.friendId) {
                      navigation.navigate('FriendDetails', { friendId: person.friendId });
                    }
                  }}
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
                  <Avatar name={person.name} url={person.avatarUrl} size={44} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                      {person.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {person.groupName ? `${person.groupName} • ` : ''}
                      {person.email || person.phoneNumber || 'SplitMate Member'}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.success, fontWeight: '700', marginTop: 2 }]}>
                      Owes you {formatMoney(person.amount, person.currency, { absolute: true })}
                    </Text>
                  </View>

                  <View style={styles.actionPills}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleRemindPerson(person.name, person.amount)}
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
                          preselectedPayerId: person.userId,
                          preselectedReceiverId: currentUser?.id,
                          suggestedAmount: person.amount,
                          currency: person.currency,
                        })
                      }
                      style={[styles.smallBtn, { backgroundColor: colors.successLight, marginLeft: 6 }]}
                    >
                      <Text style={[typography.caption, { color: colors.success, fontWeight: '800' }]}>
                        Settle
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                title="Nobody owes you"
                description="You are all settled up with your group members and friends!"
                iconName="check"
              />
            )}
          </View>
        )}

        {/* Section: People You Owe (Kisko dena hai) */}
        {(activeTab === 'all' || activeTab === 'owe') && (
          <View style={{ marginBottom: spacing.lg }}>
            <View style={[styles.sectionHeader, { alignItems: 'flex-start' }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  People You Owe
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {activeTab === 'owe' ? 'Kisko Dena Hai • ' : ''}
                  You owe {peopleYouOwe.length} {peopleYouOwe.length === 1 ? 'person' : 'people'}
                </Text>
              </View>
              {activeTab === 'owe' && (
                <View
                  style={{
                    backgroundColor: colors.dangerLight,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: borderRadius.md,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={[typography.titleMedium, { color: colors.danger, fontWeight: '800' }]}>
                    -{formatMoney(balanceSummary.youOwe, balanceSummary.currency, { absolute: true })}
                  </Text>
                </View>
              )}
            </View>

            {peopleYouOwe.length > 0 ? (
              peopleYouOwe.map(person => (
                <TouchableOpacity
                  key={person.userId || person.name}
                  activeOpacity={0.7}
                  onPress={() => handleOpenPay(person)}
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
                  <Avatar name={person.name} url={person.avatarUrl} size={44} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                      {person.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {person.groupName ? `${person.groupName} • ` : ''}
                      {person.upiId || person.email || 'UPI Ready'}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.danger, fontWeight: '700', marginTop: 2 }]}>
                      You owe {formatMoney(person.amount, person.currency, { absolute: true })}
                    </Text>
                  </View>

                  <View style={styles.actionPills}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenPay(person)}
                      style={[
                        styles.smallBtn,
                        {
                          backgroundColor: colors.primary,
                          flexDirection: 'row',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Icon name="arrow-up-right" size={12} color="#FFFFFF" />
                      <Text
                        style={[
                          typography.caption,
                          { color: '#FFFFFF', fontWeight: '800', marginLeft: 4 },
                        ]}
                      >
                        Pay Now
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        navigation.navigate('RecordSettlement', {
                          preselectedPayerId: currentUser?.id,
                          preselectedReceiverId: person.userId,
                          suggestedAmount: person.amount,
                          currency: person.currency,
                        })
                      }
                      style={[styles.smallBtn, { backgroundColor: colors.surfaceVariant, marginLeft: 6 }]}
                    >
                      <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>
                        Settle
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                title="No debts to pay"
                description="You don't owe anyone money right now. All clear!"
                iconName="check"
              />
            )}
          </View>
        )}

        {/* Recent Settlements History - Shown on 'all' tab */}
        {activeTab === 'all' && (
          <>
            <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
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
          </>
        )}
      </ScrollView>

      <QuickPayModal
        visible={showQuickPayModal}
        person={selectedPersonToPay}
        onClose={() => {
          setShowQuickPayModal(false);
          setSelectedPersonToPay(null);
        }}
        onNavigateToDetailed={person => {
          navigation.navigate('RecordSettlement', {
            preselectedPayerId: currentUser?.id,
            preselectedReceiverId: person.userId,
            suggestedAmount: person.amount,
            currency: person.currency,
          });
        }}
      />

      <ProPaywallModal
        visible={showProModal}
        feature="smart_simplification"
        onClose={() => setShowProModal(false)}
        onNavigateToPlans={() => {
          setShowProModal(false);
          navigation.navigate('Subscription', { triggerFeature: 'smart_simplification' });
        }}
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
  filterBar: {
    flexDirection: 'row',
    padding: 4,
    alignItems: 'center',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
});

