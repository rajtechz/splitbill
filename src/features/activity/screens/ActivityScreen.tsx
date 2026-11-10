import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon, IconName } from '../../../components/common/Icon';
import { EmptyState } from '../../../components/common/EmptyState';
import { Activity, ActivityType } from '../../../types';
import { formatMoney } from '../../../utils/money';
import { format } from 'date-fns';

export const ActivityScreen: React.FC = () => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { activities, refreshAll } = useAppStore();

  const [filter, setFilter] = useState<'all' | 'expenses' | 'settlements' | 'groups'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setTimeout(() => setRefreshing(false), 350);
    }
  };

  const filteredActivities = activities.filter(act => {
    if (filter === 'expenses') return act.type.startsWith('expense_');
    if (filter === 'settlements') return act.type === 'payment_recorded' || act.type === 'settlement_completed';
    if (filter === 'groups') return act.type === 'group_created' || act.type === 'member_added';
    return true;
  });

  const getActivityIcon = (type: ActivityType): { icon: IconName; color: string; bg: string } => {
    switch (type) {
      case 'expense_created':
        return { icon: 'receipt', color: colors.primary, bg: colors.primaryLight };
      case 'expense_updated':
        return { icon: 'edit', color: colors.warning, bg: colors.warningLight };
      case 'expense_deleted':
        return { icon: 'trash', color: colors.danger, bg: colors.dangerLight };
      case 'payment_recorded':
      case 'settlement_completed':
        return { icon: 'check', color: colors.success, bg: colors.successLight };
      case 'group_created':
      case 'member_added':
        return { icon: 'groups', color: colors.info, bg: colors.infoLight };
      default:
        return { icon: 'wallet', color: colors.primary, bg: colors.primaryLight };
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Activity Feed" subtitle="All recent updates across your groups & friends" />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'expenses', 'settlements', 'groups'] as const).map(tab => {
          const isSelected = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.7}
              onPress={() => setFilter(tab)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                    textTransform: 'capitalize',
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
        {filteredActivities.length > 0 ? (
          filteredActivities.map(item => {
            const iconConfig = getActivityIcon(item.type);
            let timeStr = '';
            try {
              timeStr = format(new Date(item.timestamp), 'MMM d, h:mm a');
            } catch {
              timeStr = item.timestamp;
            }

            return (
              <View
                key={item.id}
                style={[
                  styles.activityCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                  <Icon name={iconConfig.icon} size={18} color={iconConfig.color} />
                </View>

                <View style={styles.activityBody}>
                  <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]}>
                    {item.description}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                    {timeStr}
                    {item.groupName ? ` • ${item.groupName}` : ''}
                  </Text>
                </View>

                {item.amount && item.currency ? (
                  <Text style={[typography.amountSmall, { color: colors.textPrimary, marginLeft: 8 }]}>
                    {formatMoney(item.amount, item.currency)}
                  </Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <EmptyState
            title="No activity yet"
            description="Recent group changes, expenses, and settlements will be logged here."
            iconName="activity"
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  content: {
    padding: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: {
    flex: 1,
    marginLeft: 12,
  },
});

