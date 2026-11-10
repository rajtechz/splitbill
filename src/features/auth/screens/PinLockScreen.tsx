import React, { useState, useRef } from 'react';
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
import { BiometricVerifyModal } from '../../../components/modals/BiometricVerifyModal';
import { PinSetupModal } from '../../../components/modals/PinSetupModal';

interface PinLockScreenProps {
  onSuccess?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onSuccess }) => {
  const { colors, typography, isDark } = useTheme();
  const { unlock, unlockWithBiometrics, isBiometricsEnabled } = useSecurityStore();

  const [enteredPin, setEnteredPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleBiometricAuth = async () => {
    setShowBioModal(true);
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

          {/* Bottom Left: Fingerprint Button (Hidden when disabled in app settings) */}
          {isBiometricsEnabled ? (
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
              accessibilityRole="button"
              accessibilityLabel="Verify Fingerprint"
            >
              <Icon name="fingerprint" size={32} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.keypadPlaceholder} />
          )}

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

        {/* mPIN Management Helpers (Forgot, Reset/Update, Default) */}
        <View style={styles.helpersRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowResetPinModal(true)}
            style={styles.helperBtn}
          >
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              Forgot mPIN?
            </Text>
          </TouchableOpacity>

          <Text style={{ color: colors.border, marginHorizontal: 8 }}>|</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowResetPinModal(true)}
            style={styles.helperBtn}
          >
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              Reset / Update PIN
            </Text>
          </TouchableOpacity>

          <Text style={{ color: colors.border, marginHorizontal: 8 }}>|</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setEnteredPin('1234');
              setTimeout(() => {
                unlock('1234');
                onSuccess?.();
              }, 100);
            }}
            style={styles.helperBtn}
          >
            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
              Default (1234)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerHint}>
          <Icon name="lock" size={14} color={colors.textSecondary} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
            {isBiometricsEnabled
              ? 'Protected by Fingerprint & 4-Digit mPIN'
              : 'Protected by 4-Digit mPIN'}
          </Text>
        </View>
      </View>

      {/* Beautiful Custom Biometric Verification Modal */}
      <BiometricVerifyModal
        visible={showBioModal}
        onClose={() => setShowBioModal(false)}
        onSuccess={() => {
          unlockWithBiometrics();
          onSuccess?.();
        }}
      />

      {/* Forgot / Reset / Update mPIN Modal */}
      <PinSetupModal
        visible={showResetPinModal}
        isForgotMode={true}
        onClose={() => setShowResetPinModal(false)}
        onSuccess={newPin => {
          unlock(newPin);
          onSuccess?.();
        }}
      />
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
  keypadPlaceholder: {
    width: 76,
    height: 76,
  },
  helpersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  helperBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
});
