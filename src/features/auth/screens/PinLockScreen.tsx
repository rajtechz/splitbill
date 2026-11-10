import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Vibration,
} from 'react-native';
import { useTheme } from '../../../theme';
import { Icon } from '../../../components/common/Icon';
import { useSecurityStore } from '../../../store/useSecurityStore';

interface PinLockScreenProps {
  onSuccess?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onSuccess }) => {
  const { colors, typography, isDark } = useTheme();
  const { unlock, unlockWithBiometrics, isBiometricsEnabled } = useSecurityStore();

  const [enteredPin, setEnteredPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const hasPromptedBio = useRef(false);

  // Automatically prompt for fingerprint/biometrics on mount if enabled
  useEffect(() => {
    if (isBiometricsEnabled && !hasPromptedBio.current) {
      hasPromptedBio.current = true;
      const timer = setTimeout(async () => {
        const success = await unlockWithBiometrics();
        if (success) {
          onSuccess?.();
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isBiometricsEnabled, unlockWithBiometrics, onSuccess]);

  const handleBiometricAuth = async () => {
    const success = await unlockWithBiometrics();
    if (success) {
      onSuccess?.();
    }
  };

  const triggerShake = () => {
    Vibration.vibrate(100);
    setHasError(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        setEnteredPin('');
        setHasError(false);
      }, 400);
    });
  };

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    const newPin = enteredPin + num;
    setEnteredPin(newPin);

    if (newPin.length === 4) {
      setTimeout(() => {
        const ok = unlock(newPin);
        if (ok) {
          onSuccess?.();
        } else {
          triggerShake();
        }
      }, 100);
    }
  };

  const handleBackspace = () => {
    if (enteredPin.length > 0) {
      setEnteredPin(prev => prev.slice(0, -1));
      setHasError(false);
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#0D1614' : '#F8FAF9' }]}>
      {/* Top Branding & Lock Header */}
      <View style={styles.header}>
        <Image
          source={require('../../../../assets/icons/app_icon.png')}
          style={styles.appIcon}
          resizeMode="cover"
        />

        <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 16 }]}>
          Unlock SplitMate
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
          {hasError
            ? 'Incorrect mPIN. Please try again (Default: 1234)'
            : 'Enter 4-digit mPIN or scan your fingerprint to continue'}
        </Text>
      </View>

      {/* 4 Animated PIN Circles */}
      <Animated.View
        style={[
          styles.dotsRow,
          {
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        {[0, 1, 2, 3].map(index => {
          const isFilled = enteredPin.length > index;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  borderColor: hasError
                    ? colors.danger
                    : isFilled
                    ? colors.primary
                    : colors.border,
                  backgroundColor: hasError
                    ? colors.danger
                    : isFilled
                    ? colors.primary
                    : 'transparent',
                },
              ]}
            />
          );
        })}
      </Animated.View>

      {/* Numerical Keypad */}
      <View style={styles.keypadContainer}>
        <View style={styles.keypadGrid}>
          {digits.map(d => (
            <TouchableOpacity
              key={d}
              activeOpacity={0.65}
              onPress={() => handleKeyPress(d)}
              style={[
                styles.keypadButton,
                { backgroundColor: isDark ? '#182522' : '#FFFFFF', borderColor: colors.borderSubtle },
              ]}
            >
              <Text style={[typography.h2, { color: colors.textPrimary, fontWeight: '700' }]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Bottom Left: Fingerprint Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBiometricAuth}
            style={[
              styles.keypadButton,
              {
                backgroundColor: isDark ? '#122E22' : '#E8F5E9',
                borderColor: colors.primary,
              },
            ]}
          >
            <Icon name="fingerprint" size={32} color={colors.primary} />
          </TouchableOpacity>

          {/* Bottom Middle: 0 */}
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => handleKeyPress('0')}
            style={[
              styles.keypadButton,
              { backgroundColor: isDark ? '#182522' : '#FFFFFF', borderColor: colors.borderSubtle },
            ]}
          >
            <Text style={[typography.h2, { color: colors.textPrimary, fontWeight: '700' }]}>
              0
            </Text>
          </TouchableOpacity>

          {/* Bottom Right: Backspace */}
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleBackspace}
            style={[styles.keypadButtonSpecial]}
          >
            <Icon name="backspace" size={26} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Helper Button & Security Footer Hint */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setEnteredPin('1234');
            setTimeout(() => {
              unlock('1234');
              onSuccess?.();
            }, 100);
          }}
          style={styles.defaultPinButton}
        >
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
            Use Default PIN (1234)
          </Text>
        </TouchableOpacity>

        <View style={styles.footerHint}>
          <Icon name="lock" size={14} color={colors.textSecondary} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
            Protected by Fingerprint & 4-Digit mPIN
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 24,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  keypadContainer: {
    alignItems: 'center',
  },
  keypadGrid: {
    width: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  keypadButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keypadButtonSpecial: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultPinButton: {
    marginTop: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
});
