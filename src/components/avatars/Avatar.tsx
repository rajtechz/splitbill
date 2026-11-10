import React from 'react';
import { View, Text, Image, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../theme';

interface AvatarProps {
  name: string;
  url?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({ name, url, size = 40, style }) => {
  const { colors, typography } = useTheme();

  const getInitials = (str: string) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const getBackgroundColor = (str: string) => {
    const palette = ['#176B50', '#2BB07C', '#2D82B7', '#7B2CBF', '#D97706', '#E11D48'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const fontSize = Math.max(11, Math.round(size * 0.38));

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.surfaceVariant,
          },
          style as StyleProp<ImageStyle>,
        ]}
      />
    );
  }

  const bgColor = getBackgroundColor(name);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.caption,
          {
            color: '#FFFFFF',
            fontSize,
            fontWeight: '700',
          },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
};
