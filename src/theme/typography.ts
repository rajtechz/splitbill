import { TextStyle, Platform } from 'react-native';

/**
 * Modern Geometric & Fintech Font Stack
 * - iOS: 'Avenir Next' (Apple's clean geometric neo-grotesque font, perfect for fintech / expense sharing)
 * - Android: 'sans-serif' / 'sans-serif-medium' (Clean Material typeface with balanced optical kerning)
 */
export const fontFamilies = {
  regular: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  numeric: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif-medium',
    default: 'System',
  }),
};

export const typography = {
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.6,
  },
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  titleMedium: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  bodyLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  bodyMedium: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.2,
  },
  buttonLarge: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.2,
  },
  buttonMedium: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },
  amountLarge: {
    fontFamily: fontFamilies.numeric,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.8,
  },
  amountMedium: {
    fontFamily: fontFamilies.numeric,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.4,
  },
  amountSmall: {
    fontFamily: fontFamilies.numeric,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
};

