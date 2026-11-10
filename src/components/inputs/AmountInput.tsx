import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../../types';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  currency?: CurrencyCode;
  placeholder?: string;
  error?: string;
  style?: ViewStyle;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChangeText,
  currency = 'INR',
  placeholder = '0.00',
  error,
  style,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const curr = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;

  const handleChange = (text: string) => {
    // Only allow numbers and at most one decimal point
    const sanitized = text.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > curr.decimals) return;
    onChangeText(sanitized);
  };

  return (
    <View style={style}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.lg,
            borderColor: error ? colors.danger : colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <Text style={[typography.h1, { color: colors.textSecondary, marginRight: 8 }]}>
          {curr.symbol}
        </Text>
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          style={[
            styles.input,
            typography.h1,
            {
              color: colors.textPrimary,
            },
          ]}
          autoFocus={false}
        />
      </View>
      {error ? (
        <Text style={[typography.caption, { color: colors.danger, marginTop: 4, marginLeft: 4 }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
});

