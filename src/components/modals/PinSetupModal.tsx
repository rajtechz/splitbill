import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../common/Icon';
import { useSecurityStore } from '../../store/useSecurityStore';

interface PinSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (newPin: string) => void;
  isForgotMode?: boolean;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  visible,
  onClose,
  onSuccess,
  isForgotMode = false,
}) => {
  const { colors, typography, spacing, borderRadius, shadows, isDark } = useTheme();
  const { setPin } = useSecurityStore();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activePin = step === 'create' ? firstPin : confirmPin;

  const handleKeyPress = (digit: string) => {
    if (activePin.length >= 4) return;
    const next = activePin + digit;

    if (step === 'create') {
      setFirstPin(next);
      if (next.length === 4) {
        setTimeout(() => {
          setStep('confirm');
          setError(null);
        }, 150);
      }
    } else {
      setConfirmPin(next);
      if (next.length === 4) {
        if (next === firstPin) {
          setTimeout(async () => {
            await setPin(next);
            Alert.alert(
              isForgotMode ? 'mPIN Reset Successfully' : 'mPIN Set Successfully',
              `Your new 4-digit mPIN has been saved and updated on your account.`
            );
            handleReset();
            onSuccess?.(next);
            onClose();
          }, 150);
        } else {
          setError('mPINs do not match. Please try again.');
          setTimeout(() => {
            setConfirmPin('');
          }, 400);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'create') {
      setFirstPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
    setError(null);
  };

  const handleReset = () => {
    setStep('create');
    setFirstPin('');
    setConfirmPin('');
    setError(null);
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              ...shadows.elevated,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.headerRow}>
              <View>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  {step === 'create'
                    ? isForgotMode
                      ? 'Reset / Update 4-Digit mPIN'
                      : 'Set New 4-Digit mPIN'
                    : 'Confirm Your 4-Digit mPIN'}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {step === 'create'
                    ? 'Enter 4 digits for your security PIN'
                    : 'Re-enter the same 4 digits to confirm'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { handleReset(); onClose(); }}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map(i => {
              const filled = activePin.length > i;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      borderColor: error ? colors.danger : filled ? colors.primary : colors.border,
                      backgroundColor: error
                        ? colors.danger
                        : filled
                        ? colors.primary
                        : 'transparent',
                    },
                  ]}
                />
              );
            })}
          </View>

          {error && (
            <Text style={[typography.caption, { color: colors.danger, textAlign: 'center', marginBottom: 12 }]}>
              {error}
            </Text>
          )}

          {/* Keypad */}
          <View style={styles.keypadGrid}>
            {digits.map(d => (
              <TouchableOpacity
                key={d}
                activeOpacity={0.65}
                onPress={() => handleKeyPress(d)}
                style={[
                  styles.keypadButton,
                  { backgroundColor: isDark ? '#1C2926' : '#F1F5F4', borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[typography.h2, { color: colors.textPrimary, fontWeight: '700' }]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ width: 72 }} />

            <TouchableOpacity
              activeOpacity={0.65}
              onPress={() => handleKeyPress('0')}
              style={[
                styles.keypadButton,
                { backgroundColor: isDark ? '#1C2926' : '#F1F5F4', borderColor: colors.borderSubtle },
              ]}
            >
              <Text style={[typography.h2, { color: colors.textPrimary, fontWeight: '700' }]}>
                0
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.65}
              onPress={handleBackspace}
              style={[styles.keypadButton, { backgroundColor: 'transparent', borderWidth: 0 }]}
            >
              <Icon name="backspace" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypadGrid: {
    width: 260,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

