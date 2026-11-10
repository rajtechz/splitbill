import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { MiniBarChart } from '../../../components/charts/BarChart';
import { CategoryBreakdown } from '../../../components/charts/CategoryPieChart';
import { formatMoney } from '../../../utils/money';
import { ExpenseCategory } from '../../../types';
import { Icon } from '../../../components/common/Icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#176B50',
  Groceries: '#2BB07C',
  Transport: '#2D82B7',
  Travel: '#4EA8DE',
  Rent: '#D97706',
  Utilities: '#F59E0B',
  Shopping: '#EC4899',
  Entertainment: '#8B5CF6',
  Medical: '#EF4444',
  Other: '#6B7280',
};

export const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { expenses, groups } = useAppStore();

  const [timeframe, setTimeframe] = useState<'monthly' | 'weekly'>('monthly');

  const totalSpending = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  }, [expenses]);

  const averageExpense = useMemo(() => {
    if (expenses.length === 0) return 0;
    return Math.round(totalSpending / expenses.length);
  }, [totalSpending, expenses]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      map[exp.category] = (map[exp.category] || 0) + exp.totalAmount;
    }

    return Object.entries(map)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        color: CATEGORY_COLORS[cat as ExpenseCategory] || colors.primary,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, colors]);

  const topCategory = categoryData[0]?.category || 'N/A';

  // Monthly or Weekly bar chart data
  const chartData = useMemo(() => {
    if (timeframe === 'monthly') {
      return [
        { label: 'Jul', amount: 8200 },
        { label: 'Aug', amount: 14500 },
        { label: 'Sep', amount: 11000 },
        { label: 'Oct', amount: 18400 },
        { label: 'Nov', amount: totalSpending },
      ];
    } else {
      return [
        { label: 'W1', amount: 3200 },
        { label: 'W2', amount: 4800 },
        { label: 'W3', amount: 2100 },
        { label: 'W4', amount: 5900 },
      ];
    }
  }, [timeframe, totalSpending]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Analytics & Trends" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
      >
        {/* Main Spending Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              borderColor: colors.borderSubtle,
              ...shadows.soft,
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            TOTAL EXPENSES LOGGED
          </Text>
          <Text style={[typography.amountLarge, { color: colors.textPrimary, marginVertical: 6 }]}>
            {formatMoney(totalSpending, 'INR')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Across {expenses.length} transactions in {groups.length} groups
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.metricsRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                AVERAGE EXPENSE
              </Text>
              <Text style={[typography.amountMedium, { color: colors.primary, marginTop: 4 }]}>
                {formatMoney(averageExpense, 'INR')}
              </Text>
            </View>

            <View style={{ flex: 1, paddingLeft: 12 }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                TOP CATEGORY
              </Text>
              <Text style={[typography.titleMedium, { color: colors.textPrimary, marginTop: 4 }]}>
                {topCategory}
              </Text>
            </View>
          </View>
        </View>

        {/* Timeframe Bar Chart */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderColor: colors.borderSubtle,
              marginTop: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>Spending Trends</Text>
            <View style={styles.timeframeTabs}>
              <TouchableOpacity
                onPress={() => setTimeframe('monthly')}
                style={[
                  styles.tabPill,
                  timeframe === 'monthly' && { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: timeframe === 'monthly' ? colors.primary : colors.textSecondary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTimeframe('weekly')}
                style={[
                  styles.tabPill,
                  timeframe === 'weekly' && { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: timeframe === 'weekly' ? colors.primary : colors.textSecondary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <MiniBarChart data={chartData} currency="INR" height={160} />
        </View>

        {/* Category Breakdown */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderColor: colors.borderSubtle,
              marginTop: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: 14 }]}>
            Category Breakdown
          </Text>
          <CategoryBreakdown data={categoryData} currency="INR" />
        </View>

        {/* Group Breakdown */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderColor: colors.borderSubtle,
              marginTop: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: 14 }]}>
            Spending by Group
          </Text>
          {groups.map(grp => (
            <View key={grp.id} style={styles.groupSpendRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                  {grp.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {grp.category} • {grp.members.length} members
                </Text>
              </View>
              <Text style={[typography.amountSmall, { color: colors.textPrimary }]}>
                {formatMoney(grp.totalSpending, grp.currency)}
              </Text>
            </View>
          ))}
        </View>
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
  summaryCard: {
    borderWidth: 1,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  metricsRow: {
    flexDirection: 'row',
  },
  chartCard: {
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeframeTabs: {
    flexDirection: 'row',
  },
  tabPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 4,
  },
  groupSpendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
});

