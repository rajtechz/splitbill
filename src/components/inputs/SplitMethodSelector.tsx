import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { SplitMethod } from '../../types';

interface SplitMethodSelectorProps {
  selectedMethod: SplitMethod;
  onSelect: (method: SplitMethod) => void;
}

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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 3,
    marginVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

