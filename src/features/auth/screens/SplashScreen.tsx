import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../../theme';
import { Icon } from '../../../components/common/Icon';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDurationMs = 1800,
}) => {
  const { colors, typography, isDark } = useTheme();

  // Animations
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const exitFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Subtle pulse loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Exit timer
    const timer = setTimeout(() => {
      Animated.timing(exitFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        pulseLoop.stop();
        if (onFinish) {
          onFinish();
        }
      });
    }, minDurationMs);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, [logoScale, logoOpacity, contentFade, pulseAnim, exitFade, minDurationMs, onFinish]);

  // Brand emerald gradient background
  const primaryBrandColor = '#176B50';
  const accentMintColor = '#239B68';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0F1816' : '#F8FAF9',
          opacity: exitFade,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Background Decorative Ambient Circles */}
      <View style={styles.ambientContainer} pointerEvents="none">
        <Svg height="100%" width="100%" viewBox="0 0 400 800">
          <Defs>
            <LinearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={primaryBrandColor} stopOpacity={isDark ? "0.2" : "0.08"} />
              <Stop offset="100%" stopColor={accentMintColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Circle cx="200" cy="360" r="180" fill="url(#glowGrad)" />
          <Circle cx="80" cy="180" r="120" fill="url(#glowGrad)" />
        </Svg>
      </View>

      {/* Center Brand Identity */}
      <View style={styles.centerContent}>
        {/* Animated Icon Emblem */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
              opacity: logoOpacity,
              shadowColor: primaryBrandColor,
            },
          ]}
        >
          <Image
            source={require('../../../../assets/icons/app_icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Animated App Name & Slogan */}
        <Animated.View style={[styles.textBlock, { opacity: contentFade }]}>
          <Text
            style={[
              typography.h1,
              styles.appName,
              { color: isDark ? '#FFFFFF' : '#182522' },
            ]}
          >
            SplitMate
          </Text>

          <Text
            style={[
              typography.bodyMedium,
              styles.tagline,
              { color: isDark ? '#A1B0AC' : '#5C6A66' },
            ]}
          >
            Share expenses, preserve friendships
          </Text>
        </Animated.View>
      </View>

      {/* Footer Branding */}
      <Animated.View style={[styles.footer, { opacity: contentFade }]}>
        <View style={styles.securityBadge}>
          <Icon name="shield" size={13} color={primaryBrandColor} />
          <Text style={[typography.caption, { color: primaryBrandColor, marginLeft: 6, fontWeight: '700' }]}>
            End-to-End Financial Ledger
          </Text>
        </View>

        <Text
          style={[
            typography.caption,
            { color: isDark ? '#6B7A76' : '#9AA7A3', marginTop: 10, letterSpacing: 0.5 },
          ]}
        >
          v1.0.0 • Production Ready
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  logoWrapper: {
    width: 104,
    height: 104,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  logoImage: {
    width: 104,
    height: 104,
    borderRadius: 24,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 24,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
    maxWidth: width * 0.75,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F5EF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
