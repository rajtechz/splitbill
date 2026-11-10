import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { formatMoney } from '../../utils/money';
import { CurrencyCode } from '../../types';

interface CategoryShare {
  category: string;
  amount: number;
  color: string;
}

interface CategoryBreakdownProps {
  data: CategoryShare[];
  currency?: CurrencyCode;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  data,
  currency = 'INR',
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          No expense data to analyze
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Visual Multi-segment Progress Bar */}
      <View
        style={[
          styles.stackedBar,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        {data.map((item, idx) => {
          const flex = Math.max(0.01, item.amount / total);
          return (
            <View
              key={idx}
              style={{
                flex,
                backgroundColor: item.color,
                height: 12,
              }}
            />
          );
        })}
      </View>

      {/* Legend list */}
      <View style={styles.legendContainer}>
        {data.map((item, idx) => {
          const percent = Math.round((item.amount / total) * 100);
          return (
            <View key={idx} style={styles.legendRow}>
              <View style={styles.legendLeft}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginLeft: 8 }]}>
                  {item.category}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
                  ({percent}%)
                </Text>
              </View>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                {formatMoney(item.amount, currency)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  stackedBar: {
    height: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  legendContainer: {
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

