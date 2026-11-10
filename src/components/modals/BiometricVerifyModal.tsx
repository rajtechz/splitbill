import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../common/Icon';

interface BiometricVerifyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BiometricVerifyModal: React.FC<BiometricVerifyModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors, typography, borderRadius, shadows, isDark } = useTheme();

  const [status, setStatus] = useState<'scanning' | 'success'>('scanning');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let pulseLoop: Animated.CompositeAnimation;
    let ringLoop: Animated.CompositeAnimation;

    if (visible) {
      setStatus('scanning');
      pulseAnim.setValue(1);
      ringScale.setValue(1);
      ringOpacity.setValue(0.7);

      // Continuous scanner breathing pulse animation
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Radiating ring animation
      ringLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.5,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      ringLoop.start();

      // Automatically simulate successful verification after 900ms
      timer = setTimeout(() => {
        setStatus('success');
        Vibration.vibrate(50);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
      }, 900);
    }

    return () => {
      clearTimeout(timer);
      pulseLoop?.stop();
      ringLoop?.stop();
    };
  }, [visible, onSuccess, onClose, pulseAnim, ringScale, ringOpacity]);

  const handleManualVerify = () => {
    if (status === 'success') return;
    setStatus('success');
    Vibration.vibrate(50);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 400);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#14201D' : '#FFFFFF',
              borderColor: isDark ? '#1F332E' : '#E2E8F0',
              borderRadius: borderRadius.xxl,
              ...shadows.elevated,
            },
          ]}
        >
          {/* Header Tag */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.securityBadge,
                {
                  backgroundColor: status === 'success' ? '#DCFCE7' : isDark ? '#1A3329' : '#ECFDF5',
                  borderColor: status === 'success' ? '#16A34A' : colors.primary,
                },
              ]}
            >
              <Icon
                name={status === 'success' ? 'check' : 'lock'}
                size={12}
                color={status === 'success' ? '#16A34A' : colors.primary}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: status === 'success' ? '#16A34A' : colors.primary,
                    fontWeight: '700',
                    marginLeft: 5,
                  },
                ]}
              >
                {status === 'success' ? 'BIOMETRIC MATCHED' : 'BIOMETRIC SECURITY'}
              </Text>
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center', marginTop: 12 }]}>
            {status === 'success' ? 'Identity Verified' : 'Touch ID / Fingerprint'}
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 12 },
            ]}
          >
            {status === 'success'
              ? 'Welcome back to SplitMate'
              : 'Scan your fingerprint to quickly and securely unlock'}
          </Text>

          {/* Animated Fingerprint Sensor Scanner */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleManualVerify}
            style={styles.sensorContainer}
          >
            {/* Outer radiating pulse ring */}
            {status === 'scanning' && (
              <Animated.View
                style={[
                  styles.scannerRing,
                  {
                    borderColor: colors.primary,
                    transform: [{ scale: ringScale }],
                    opacity: ringOpacity,
                  },
                ]}
              />
            )}

            {/* Glowing biometric circle */}
            <Animated.View
              style={[
                styles.sensorCircle,
                {
                  backgroundColor: status === 'success' ? '#10B981' : isDark ? '#162F26' : '#E8F5E9',
                  borderColor: status === 'success' ? '#059669' : colors.primary,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Icon
                name={status === 'success' ? 'check' : 'fingerprint'}
                size={44}
                color={status === 'success' ? '#FFFFFF' : colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Status Label */}
          <Text
            style={[
              typography.caption,
              {
                color: status === 'success' ? '#10B981' : colors.textSecondary,
                fontWeight: '600',
                marginTop: 18,
                textAlign: 'center',
              },
            ]}
          >
            {status === 'success' ? '✓ Verified Successfully' : 'Touch sensor or tap icon to verify'}
          </Text>

          {/* Cancel & Use PIN fallback */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
          >
            <Text style={[typography.buttonMedium, { color: colors.textSecondary }]}>
              Cancel / Use 4-Digit PIN
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  sensorContainer: {
    marginTop: 26,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scannerRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
  },
  sensorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelBtn: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
});
