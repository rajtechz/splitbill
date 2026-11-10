import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { formatMoney } from '../../utils/money';
import { CurrencyCode } from '../../types';

interface BarDataPoint {
  label: string;
  amount: number;
}

interface MiniBarChartProps {
  data: BarDataPoint[];
  currency?: CurrencyCode;
  height?: number;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  currency = 'INR',
  height = 160,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.barsRow}>
        {data.map((item, idx) => {
          const ratio = item.amount / maxAmount;
          const barHeight = Math.max(8, Math.round(ratio * (height - 50)));
          const isHighest = item.amount === maxAmount && item.amount > 0;

          return (
            <View key={idx} style={styles.col}>
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textSecondary,
                    fontSize: 9,
                    marginBottom: 4,
                  },
                ]}
                numberOfLines={1}
              >
                {item.amount > 0 ? (item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount) : ''}
              </Text>

              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isHighest ? colors.primary : colors.secondaryLight,
                    borderRadius: borderRadius.xs,
                  },
                ]}
              />

              <Text
                style={[
                  typography.caption,
                  {
                    color: isHighest ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isHighest ? '700' : '500',
                    marginTop: 6,
                  },
                ]}
              >
                {item.label}
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
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    flex: 1,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  bar: {
    width: '75%',
    maxWidth: 28,
  },
});

