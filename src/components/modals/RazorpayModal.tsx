import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../common/Icon';
import { RazorpayOrderResponse } from '../../services/api/subscriptionService';
import { config } from '../../app/config';

interface RazorpayModalProps {
  visible: boolean;
  order: RazorpayOrderResponse | null;
  onClose: () => void;
  onSuccess: (paymentData: { paymentId: string; orderId: string; signature: string }) => void;
  onError: (errorMsg: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  visible,
  order,
  onClose,
  onSuccess,
  onError,
}) => {
  const { colors, typography, borderRadius, isDark } = useTheme();
  const [processing, setProcessing] = useState(false);

  if (!visible || !order) return null;

  const displayAmount = `₹${(order.amount / 100).toLocaleString('en-IN')}`;

  const handleOpenBrowserCheckout = async () => {
    try {
      const checkoutUrl = `${config.apiBaseUrl}/subscriptions/razorpay/checkout?orderId=${order.orderId}&amount=${order.amount}&keyId=${order.keyId}&name=${encodeURIComponent(order.name)}&description=${encodeURIComponent(order.description)}&email=${encodeURIComponent(order.prefill?.email || '')}&phone=${encodeURIComponent(order.prefill?.contact || '')}&userName=${encodeURIComponent(order.prefill?.name || '')}`;

      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
      } else {
        onError('Unable to open payment link on this device.');
      }
    } catch (e: any) {
      onError(e.message || 'Failed to launch checkout');
    }
  };

  const handleSimulateSandboxPayment = async () => {
    setProcessing(true);
    try {
      // Simulate Razorpay payment signature generation for Test Mode
      // In production, Razorpay checkout returns these 3 fields upon user entering OTP/UPI
      const testPaymentId = `pay_test_${Date.now()}`;
      
      // Call backend direct test verification endpoint or supply test signature
      // The backend validates the payment and activates Pro in MongoDB
      onSuccess({
        orderId: order.orderId,
        paymentId: testPaymentId,
        signature: 'simulated_test_signature_approved',
      });
    } catch (e: any) {
      onError(e.message || 'Test payment simulation failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          {/* Razorpay Brand Header */}
          <View style={styles.rzpHeader}>
            <View style={styles.rzpLogoRow}>
              <View style={styles.rzpBadge}>
                <Text style={styles.rzpBadgeText}>R</Text>
              </View>
              <View>
                <Text style={styles.rzpTitle}>Razorpay</Text>
                <Text style={styles.rzpSubtitle}>Official Payment Gateway (Test Mode)</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Plan & Amount Summary */}
          <View
            style={[
              styles.summaryBox,
              {
                backgroundColor: isDark ? colors.surfaceVariant : colors.backgroundSecondary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                SUBSCRIPTION
              </Text>
              <Text style={[typography.titleMedium, { color: colors.textPrimary, marginTop: 2 }]}>
                {order.name}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 2 }]}>
                Order ID: {order.orderId.substring(0, 18)}...
              </Text>
            </View>
            <View style={styles.amountWrap}>
              <Text style={[typography.h2, { color: colors.primary, fontWeight: '700' }]}>
                {displayAmount}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {order.plan === 'annual' ? '/ year' : '/ month'}
              </Text>
            </View>
          </View>

          {/* Payment Methods Info */}
          <View style={styles.paymentMethodsRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Supports: UPI (GPay, PhonePe, Paytm) • Cards • NetBanking • Wallets
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* 1. Official Browser Checkout Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenBrowserCheckout}
              disabled={processing}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: '#0C2340', // Razorpay Dark Blue
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                Pay {displayAmount} via Razorpay Checkout
              </Text>
            </TouchableOpacity>

            {/* 2. Instant Sandbox Test Simulator */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSimulateSandboxPayment}
              disabled={processing}
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  marginTop: 10,
                },
              ]}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.secondaryBtnText}>
                  ⚡ Complete Test Payment (Sandbox Instant)
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
              disabled={processing}
            >
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Cancel and return
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Footer */}
          <View style={styles.securityFooter}>
            <Icon name="shield" size={14} color={colors.primary} />
            <Text style={[styles.securityText, { color: colors.textMuted }]}>
              Secured with 256-bit encryption by Razorpay
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 40, 420),
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 20,
  },
  rzpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rzpLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rzpBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0C2340',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rzpBadgeText: {
    color: '#3395FF',
    fontSize: 20,
    fontWeight: '900',
  },
  rzpTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3395FF',
    letterSpacing: -0.3,
  },
  rzpSubtitle: {
    fontSize: 11,
    color: '#8A9BA8',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  summaryBox: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  paymentMethodsRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actions: {
    width: '100%',
  },
  primaryBtn: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0C2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 14,
    alignItems: 'center',
    padding: 4,
  },
  securityFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  securityText: {
    fontSize: 11,
  },
});

