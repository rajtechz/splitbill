import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon } from '../../../components/common/Icon';
import { BalanceCard } from '../../../components/cards/BalanceCard';
import { GroupCard } from '../../../components/cards/GroupCard';
import { ExpenseCard } from '../../../components/cards/ExpenseCard';
import { EmptyState } from '../../../components/common/EmptyState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing } = useTheme();

  const {
    groups,
    expenses,
    balanceSummary,
    isSyncing,
    refreshAll,
    notifications,
  } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const recentExpenses = expenses.slice(0, 5);
  const recentGroups = groups.slice(0, 3);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, spacing.md),
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Avatar
            name={currentUser?.name || 'User'}
            url={currentUser?.avatarUrl}
            size={40}
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
              {currentUser?.name || 'Friend'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Search')}
            style={[styles.headerIconBtn, { backgroundColor: colors.surfaceVariant }]}
          >
            <Icon name="search" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
            style={[
              styles.headerIconBtn,
              { backgroundColor: colors.surfaceVariant, marginLeft: 8 },
            ]}
          >
            <Icon name="bell" size={20} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

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
        {/* Balance Overview Card */}
        <BalanceCard
          totalBalance={balanceSummary.totalBalance}
          youOwe={balanceSummary.youOwe}
          youAreOwed={balanceSummary.youAreOwed}
          currency={balanceSummary.currency}
          style={{ marginBottom: spacing.lg }}
        />

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddExpense', {})}
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Icon name="plus" size={18} color="#FFFFFF" />
            <Text style={[typography.buttonMedium, { color: '#FFFFFF', marginLeft: 6 }]}>
              Add Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RecordSettlement', {})}
            style={[styles.actionBtn, { backgroundColor: colors.primaryLight, marginLeft: 10 }]}
          >
            <Icon name="wallet" size={18} color={colors.primary} />
            <Text style={[typography.buttonMedium, { color: colors.primary, marginLeft: 6 }]}>
              Settle Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Analytics')}
            style={[styles.iconActionBtn, { backgroundColor: colors.surfaceVariant, marginLeft: 10 }]}
          >
            <Icon name="pie-chart" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Groups Section */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>Your Groups</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'GroupsTab' })}
          >
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              SEE ALL ({groups.length})
            </Text>
          </TouchableOpacity>
        </View>

        {recentGroups.length > 0 ? (
          recentGroups.map(grp => (
            <GroupCard
              key={grp.id}
              group={grp}
              onPress={() => navigation.navigate('GroupDetails', { groupId: grp.id })}
            />
          ))
        ) : (
          <EmptyState
            title="No groups yet"
            description="Create a group for trips, flatmates, or events to track expenses effortlessly."
            iconName="groups"
            actionTitle="Create Group"
            onAction={() => navigation.navigate('CreateGroup')}
          />
        )}

        {/* Recent Activity / Expenses */}
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>Recent Activity</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'ActivityTab' })}
          >
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              VIEW FEED
            </Text>
          </TouchableOpacity>
        </View>

        {recentExpenses.length > 0 ? (
          recentExpenses.map(exp => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              onPress={() => navigation.navigate('ExpenseDetails', { expenseId: exp.id })}
            />
          ))
        ) : (
          <EmptyState
            title="No recent expenses"
            description="Whenever you or your friends add an expense, it will show up here."
            iconName="receipt"
          />
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddExpense', {})}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + 20,
          },
        ]}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
        <Text style={[typography.buttonMedium, { color: '#FFFFFF', marginLeft: 8 }]}>
          Add expense
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: '#176B50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
});
