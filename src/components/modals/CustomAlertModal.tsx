import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon, IconName } from '../common/Icon';

export type AlertVariant = 'celebration' | 'success' | 'info' | 'warning' | 'danger' | 'confirm';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  variant?: AlertVariant;
  icon?: IconName;
  emoji?: string;
  buttons?: AlertButton[];
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isDestructive?: boolean;
  dismissable?: boolean;
  onClose?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  title,
  message,
  variant = 'info',
  icon,
  emoji,
  buttons,
  confirmText = 'Great!',
  cancelText,
  onConfirm,
  onCancel,
  isDestructive = false,
  dismissable = true,
  onClose,
}) => {
  const { colors, typography, borderRadius, isDark } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  // Determine Icon & Accent Colors based on variant
  const getVariantConfig = () => {
    switch (variant) {
      case 'celebration':
        return {
          badgeBg: isDark ? 'rgba(43, 176, 124, 0.18)' : 'rgba(23, 107, 80, 0.12)',
          badgeBorder: isDark ? 'rgba(43, 176, 124, 0.35)' : 'rgba(23, 107, 80, 0.25)',
          iconColor: colors.primary,
          fallbackEmoji: '🎉',
          fallbackIcon: 'sparkles' as IconName,
        };
      case 'success':
        return {
          badgeBg: isDark ? 'rgba(61, 213, 152, 0.18)' : 'rgba(35, 155, 104, 0.12)',
          badgeBorder: isDark ? 'rgba(61, 213, 152, 0.35)' : 'rgba(35, 155, 104, 0.25)',
          iconColor: colors.success,
          fallbackEmoji: undefined,
          fallbackIcon: 'check' as IconName,
        };
      case 'warning':
        return {
          badgeBg: isDark ? 'rgba(245, 184, 83, 0.18)' : 'rgba(233, 162, 59, 0.14)',
          badgeBorder: isDark ? 'rgba(245, 184, 83, 0.35)' : 'rgba(233, 162, 59, 0.25)',
          iconColor: colors.warning,
          fallbackEmoji: undefined,
          fallbackIcon: 'alert' as IconName,
        };
      case 'danger':
        return {
          badgeBg: isDark ? 'rgba(239, 102, 102, 0.18)' : 'rgba(220, 85, 85, 0.12)',
          badgeBorder: isDark ? 'rgba(239, 102, 102, 0.35)' : 'rgba(220, 85, 85, 0.25)',
          iconColor: colors.danger,
          fallbackEmoji: undefined,
          fallbackIcon: 'alert' as IconName,
        };
      case 'confirm':
        return {
          badgeBg: isDark ? 'rgba(78, 168, 222, 0.18)' : 'rgba(45, 130, 183, 0.12)',
          badgeBorder: isDark ? 'rgba(78, 168, 222, 0.35)' : 'rgba(45, 130, 183, 0.25)',
          iconColor: isDestructive ? colors.danger : colors.info,
          fallbackEmoji: undefined,
          fallbackIcon: isDestructive ? ('trash' as IconName) : ('info' as IconName),
        };
      case 'info':
      default:
        return {
          badgeBg: isDark ? 'rgba(43, 176, 124, 0.14)' : 'rgba(23, 107, 80, 0.1)',
          badgeBorder: isDark ? 'rgba(43, 176, 124, 0.25)' : 'rgba(23, 107, 80, 0.18)',
          iconColor: colors.primary,
          fallbackEmoji: undefined,
          fallbackIcon: 'info' as IconName,
        };
    }
  };

  const config = getVariantConfig();
  const displayEmoji = emoji || (variant === 'celebration' && !icon ? '🎉' : undefined);
  const displayIcon = icon || (!displayEmoji ? config.fallbackIcon : undefined);

  // Normalize buttons
  let resolvedButtons: AlertButton[] = [];
  if (buttons && buttons.length > 0) {
    resolvedButtons = buttons;
  } else if (cancelText || onCancel) {
    resolvedButtons = [
      {
        text: cancelText || 'Cancel',
        style: 'cancel',
        onPress: onCancel || onClose,
      },
      {
        text: confirmText || 'Confirm',
        style: isDestructive ? 'destructive' : 'default',
        onPress: onConfirm || onClose,
      },
    ];
  } else {
    resolvedButtons = [
      {
        text: confirmText || 'Great!',
        style: isDestructive ? 'destructive' : 'default',
        onPress: onConfirm || onClose,
      },
    ];
  }

  const handleBackdropPress = () => {
    if (dismissable) {
      if (onClose) onClose();
      else if (onCancel) onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim, backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
                  borderRadius: borderRadius.xl,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Top Accent Glow / Badge */}
              <View
                style={[
                  styles.badgeContainer,
                  {
                    backgroundColor: config.badgeBg,
                    borderColor: config.badgeBorder,
                  },
                ]}
              >
                {displayEmoji ? (
                  <Text style={styles.badgeEmoji}>{displayEmoji}</Text>
                ) : displayIcon ? (
                  <Icon name={displayIcon} size={28} color={config.iconColor} />
                ) : null}
              </View>

              {/* Title */}
              <Text style={[typography.h3, styles.titleText, { color: colors.textPrimary }]}>
                {title}
              </Text>

              {/* Message */}
              {message ? (
                <Text style={[typography.bodyMedium, styles.messageText, { color: colors.textSecondary }]}>
                  {message}
                </Text>
              ) : null}

              {/* Action Buttons */}
              <View
                style={[
                  styles.buttonRow,
                  resolvedButtons.length > 2 && styles.buttonCol,
                ]}
              >
                {resolvedButtons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestruct = btn.style === 'destructive';

                  let bg = colors.primary;
                  let textColor = colors.textInverse;
                  let border = 'transparent';

                  if (isCancel) {
                    bg = isDark ? colors.surfaceVariant : colors.backgroundSecondary;
                    textColor = colors.textPrimary;
                    border = colors.border;
                  } else if (isDestruct) {
                    bg = colors.danger;
                    textColor = '#FFFFFF';
                  }

                  return (
                    <TouchableOpacity
                      key={`alert-btn-${idx}`}
                      activeOpacity={0.8}
                      onPress={() => {
                        const action = btn.onPress;
                        if (onClose) onClose();
                        if (action && action !== onClose) {
                          setTimeout(() => {
                            action();
                          }, 120);
                        }
                      }}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: bg,
                          borderColor: border,
                          borderRadius: borderRadius.md,
                        },
                        resolvedButtons.length === 2 && styles.actionButtonFlex,
                        resolvedButtons.length > 2 && { width: '100%', marginBottom: 8 },
                      ]}
                    >
                      <Text
                        style={[
                          typography.buttonLarge,
                          {
                            color: textColor,
                            fontWeight: isCancel ? '600' : '700',
                          },
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: Math.min(SCREEN_WIDTH - 48, 380),
    borderWidth: 1,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  badgeContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#176B50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  badgeEmoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  titleText: {
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
    fontWeight: '700',
  },
  messageText: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 12,
  },
  buttonCol: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    height: 48,
    minWidth: 120,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionButtonFlex: {
    flex: 1,
  },
});

