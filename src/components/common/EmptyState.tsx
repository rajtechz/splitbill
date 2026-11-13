import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Icon, IconName } from './Icon';
import { Button } from '../buttons/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: IconName;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  iconName = 'receipt',
  actionTitle,
  onAction,
  style,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.primaryLight,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Icon name={iconName} size={36} color={colors.primary} />
      </View>
      <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>
        {title}
      </Text>
      <Text
        style={[
          typography.bodyMedium,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.xs,
            maxWidth: 280,
          },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          style={{ marginTop: spacing.lg }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

