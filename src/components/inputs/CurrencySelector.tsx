import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../../types';

interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onSelect: (currency: CurrencyCode) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onSelect,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {Object.values(SUPPORTED_CURRENCIES).map(curr => {
        const isSelected = curr.code === selectedCurrency;
        return (
          <TouchableOpacity
            key={curr.code}
            onPress={() => onSelect(curr.code)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                borderRadius: borderRadius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs + 2,
                marginRight: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: isSelected ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: '700',
                },
              ]}
            >
              {curr.symbol} {curr.code}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    marginVertical: 6,
  },
  pill: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
});

