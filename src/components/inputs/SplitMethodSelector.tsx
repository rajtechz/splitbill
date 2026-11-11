import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { SplitMethod } from '../../types';

interface SplitMethodSelectorProps {
  selectedMethod: SplitMethod;
  onSelect: (method: SplitMethod) => void;
}

const METHOD_DESCRIPTIONS: Record<SplitMethod, string> = {
  equally: 'Split equally among all selected people',
  exact: 'Enter the exact ₹ amount each person owes',
  percentage: 'Split by % (e.g. 50%, 25%, 25% — must total 100%)',
  shares: 'Split by ratio or days (e.g. 2 shares for couples/guests, or days stayed)',
  unequally: 'Enter the exact ₹ amount each person owes',
};

export const SplitMethodSelector: React.FC<SplitMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const methods: { key: SplitMethod; label: string }[] = [
    { key: 'equally', label: 'Equally' },
    { key: 'exact', label: 'Exact' },
    { key: 'percentage', label: 'Percentage' },
    { key: 'shares', label: 'Shares' },
  ];

  return (
    <View style={{ marginVertical: 8 }}>
      <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md }]}>
        {methods.map(m => {
          const isSelected = selectedMethod === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              activeOpacity={0.7}
              onPress={() => onSelect(m.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: isSelected ? colors.surface : 'transparent',
                  borderRadius: borderRadius.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isSelected ? colors.primary : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Explainer banner under tabs */}
      <View
        style={[
          styles.hintBox,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.sm,
          },
        ]}
      >
        <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11 }]}>
          💡 {METHOD_DESCRIPTIONS[selectedMethod] || 'Select how to split this expense'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
});

