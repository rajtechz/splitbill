import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Button } from '../buttons/Button';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  message = 'Something went wrong',
  onRetry,
}) => {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={styles.container}>
      <Icon name="alert" size={44} color={colors.danger} />
      <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>
        Oops!
      </Text>
      <Text
        style={[
          typography.bodyMedium,
          { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
        ]}
      >
        {message}
      </Text>
      {onRetry && <Button title="Retry" onPress={onRetry} variant="primary" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});

