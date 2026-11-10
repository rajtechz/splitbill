import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { colors, typography, borderRadius, spacing } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    let bg = colors.primary;
    let border: string | undefined = undefined;

    if (variant === 'secondary') {
      bg = colors.primaryLight;
    } else if (variant === 'outline') {
      bg = 'transparent';
      border = colors.border;
    } else if (variant === 'danger') {
      bg = colors.danger;
    } else if (variant === 'ghost') {
      bg = 'transparent';
    }

    const paddingVertical = size === 'sm' ? spacing.xs + 2 : size === 'lg' ? spacing.md + 2 : spacing.sm + 2;
    const paddingHorizontal = size === 'sm' ? spacing.sm : size === 'lg' ? spacing.xl : spacing.md;

    return {
      backgroundColor: disabled ? (colors.borderSubtle) : bg,
      borderRadius: borderRadius.md,
      borderWidth: border ? 1 : 0,
      borderColor: border,
      paddingVertical,
      paddingHorizontal,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    if (variant === 'primary' || variant === 'danger') return '#FFFFFF';
    if (variant === 'secondary') return colors.primary;
    if (variant === 'outline' || variant === 'ghost') return colors.textPrimary;
    return colors.textPrimary;
  };

  const fontStyle = size === 'sm' ? typography.buttonMedium : typography.buttonLarge;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              fontStyle,
              { color: getTextColor(), marginLeft: icon ? spacing.xs : 0 },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
