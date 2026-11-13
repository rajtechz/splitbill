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

  const handleOpenBrowserCheckout = async (upiApp?: string) => {
    try {
      const upiParam = upiApp ? `&upi_app=${encodeURIComponent(upiApp)}` : '';
      const checkoutUrl = `${config.apiBaseUrl}/subscriptions/razorpay/checkout?orderId=${order.orderId}&amount=${order.amount}&keyId=${order.keyId}&name=${encodeURIComponent(order.name)}&description=${encodeURIComponent(order.description)}&email=${encodeURIComponent(order.prefill?.email || '')}&phone=${encodeURIComponent(order.prefill?.contact || '')}&userName=${encodeURIComponent(order.prefill?.name || '')}${upiParam}`;

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
              backgroundColor: isDark ? '#0D1F18' : colors.surface,
              borderColor: isDark ? 'rgba(43, 176, 124, 0.25)' : colors.border,
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
                <View style={styles.brandTitleRow}>
                  <Text style={styles.rzpTitle}>Razorpay</Text>
                  <View style={styles.sandboxPill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.sandboxText}>SANDBOX</Text>
                  </View>
                </View>
                <Text style={styles.rzpSubtitle}>Official Payment Gateway • Test Mode</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Plan & Amount Summary Card */}
          <View
            style={[
              styles.summaryBox,
              {
                backgroundColor: isDark ? 'rgba(23, 107, 80, 0.16)' : 'rgba(23, 107, 80, 0.08)',
                borderColor: isDark ? 'rgba(43, 176, 124, 0.35)' : 'rgba(23, 107, 80, 0.2)',
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.planHeaderRow}>
                <Icon name="crown" size={14} color="#D4AF37" />
                <Text style={[typography.caption, { color: '#D4AF37', fontWeight: '800', letterSpacing: 0.5 }]}>
                  PRO MEMBERSHIP
                </Text>
              </View>
              <Text style={[typography.titleMedium, { color: colors.textPrimary, marginTop: 4, fontWeight: '700' }]}>
                {order.name}
              </Text>
              <View style={styles.orderIdBadge}>
                <Text style={[typography.caption, { color: colors.textMuted, fontSize: 11 }]}>
                  Order: {order.orderId.substring(0, 16)}...
                </Text>
              </View>
            </View>

            <View style={styles.amountWrap}>
              <Text style={[typography.h2, { color: isDark ? '#3DD598' : '#176B50', fontWeight: '800' }]}>
                {displayAmount}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
                {order.plan === 'annual' ? '/ year' : '/ month'}
              </Text>
            </View>
          </View>

          {/* Supported Channels Pill Grid with Vector Icons */}
          <View style={styles.channelsContainer}>
            <Text style={[typography.caption, styles.channelsLabel, { color: colors.textMuted }]}>
              ACCEPTED TEST CHANNELS
            </Text>
            <View style={styles.chipsGrid}>
              <View style={[styles.chip, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#F0F9FF', borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD' }]}>
                <Icon name="smartphone" size={13} color="#38BDF8" />
                <Text style={[styles.chipText, { color: isDark ? '#7DD3FC' : '#0369A1' }]}>UPI (GPay/PhonePe)</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.1)' : '#F0FDF4', borderColor: isDark ? 'rgba(52, 211, 153, 0.25)' : '#BBF7D0' }]}>
                <Icon name="credit-card" size={13} color="#34D399" />
                <Text style={[styles.chipText, { color: isDark ? '#6EE7B7' : '#15803D' }]}>Cards</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : '#FFFBEB', borderColor: isDark ? 'rgba(251, 191, 36, 0.25)' : '#FDE68A' }]}>
                <Icon name="bank" size={13} color="#FBBF24" />
                <Text style={[styles.chipText, { color: isDark ? '#FCD34D' : '#B45309' }]}>NetBanking</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: isDark ? 'rgba(167, 139, 250, 0.1)' : '#F5F3FF', borderColor: isDark ? 'rgba(167, 139, 250, 0.25)' : '#DDD6FE' }]}>
                <Icon name="wallet" size={13} color="#A78BFA" />
                <Text style={[styles.chipText, { color: isDark ? '#C4B5FD' : '#6D28D9' }]}>Wallets</Text>
              </View>
            </View>
          </View>

          {/* Direct UPI Apps Selector */}
          <View style={styles.upiAppsContainer}>
            <Text style={[typography.caption, styles.channelsLabel, { color: colors.textMuted }]}>
              PAY DIRECTLY VIA UPI APPS
            </Text>
            <View style={styles.upiAppsRow}>
              {/* PhonePe */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOpenBrowserCheckout('phonepe')}
                style={[
                  styles.upiAppBtn,
                  {
                    backgroundColor: isDark ? 'rgba(95, 37, 159, 0.22)' : '#F5F3FF',
                    borderColor: isDark ? 'rgba(147, 51, 234, 0.45)' : '#DDD6FE',
                  },
                ]}
              >
                <View style={[styles.upiAppBadge, { backgroundColor: '#5F259F' }]}>
                  <Text style={styles.upiAppBadgeText}>P</Text>
                </View>
                <Text style={[styles.upiAppName, { color: colors.textPrimary }]}>PhonePe</Text>
              </TouchableOpacity>

              {/* Google Pay */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOpenBrowserCheckout('google_pay')}
                style={[
                  styles.upiAppBtn,
                  {
                    backgroundColor: isDark ? 'rgba(26, 115, 232, 0.2)' : '#EFF6FF',
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.45)' : '#BFDBFE',
                  },
                ]}
              >
                <View style={[styles.upiAppBadge, { backgroundColor: '#1A73E8' }]}>
                  <Text style={styles.upiAppBadgeText}>G</Text>
                </View>
                <Text style={[styles.upiAppName, { color: colors.textPrimary }]}>GPay</Text>
              </TouchableOpacity>

              {/* Paytm */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOpenBrowserCheckout('paytm')}
                style={[
                  styles.upiAppBtn,
                  {
                    backgroundColor: isDark ? 'rgba(0, 186, 242, 0.2)' : '#F0FDFA',
                    borderColor: isDark ? 'rgba(20, 184, 166, 0.45)' : '#99F6E4',
                  },
                ]}
              >
                <View style={[styles.upiAppBadge, { backgroundColor: '#00BAF2' }]}>
                  <Text style={styles.upiAppBadgeText}>₹</Text>
                </View>
                <Text style={[styles.upiAppName, { color: colors.textPrimary }]}>Paytm</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* 1. Instant Sandbox Test Simulator */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSimulateSandboxPayment}
              disabled={processing}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: '#176B50',
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContentRow}>
                  <View style={styles.btnIconCircle}>
                    <Icon name="zap" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.btnTextWrap}>
                    <Text style={styles.primaryBtnText}>
                      Instant Test Payment (Sandbox)
                    </Text>
                    <Text style={styles.primaryBtnSub}>
                      Simulate 100% successful approval in 1 tap
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* 2. Official Browser Checkout Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleOpenBrowserCheckout()}
              disabled={processing}
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: '#0C2340',
                  borderColor: '#1E40AF',
                  borderRadius: borderRadius.md,
                  marginTop: 10,
                },
              ]}
            >
              <View style={styles.btnContentRow}>
                <View style={[styles.btnIconCircle, { backgroundColor: 'rgba(51, 149, 255, 0.2)' }]}>
                  <Icon name="external-link" size={15} color="#3395FF" />
                </View>
                <View style={styles.btnTextWrap}>
                  <Text style={styles.secondaryBtnText}>
                    Pay {displayAmount} via Razorpay Checkout
                  </Text>
                  <Text style={styles.secondaryBtnSub}>
                    Opens official webview checkout
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Cancel Link */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
              disabled={processing}
              activeOpacity={0.7}
            >
              <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '600' }]}>
                Cancel and return to app
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Footer */}
          <View style={[styles.securityFooter, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Icon name="shield-check" size={15} color="#10B981" />
            <Text style={[styles.securityText, { color: colors.textMuted }]}>
              Secured by 256-Bit SSL Encryption • Razorpay Certified
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
    paddingHorizontal: 16,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 32, 420),
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 24,
  },
  rzpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rzpLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rzpBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: 'rgba(51, 149, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#3395FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  rzpBadgeText: {
    color: '#3395FF',
    fontSize: 22,
    fontWeight: '900',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rzpTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3395FF',
    letterSpacing: -0.3,
  },
  sandboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  sandboxText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rzpSubtitle: {
    fontSize: 11,
    color: '#8A9BA8',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryBox: {
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderIdBadge: {
    marginTop: 4,
  },
  amountWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  channelsContainer: {
    marginBottom: 14,
  },
  channelsLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  upiAppsContainer: {
    marginBottom: 16,
  },
  upiAppsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  upiAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  upiAppBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiAppBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  upiAppName: {
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    width: '100%',
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  btnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  btnTextWrap: {
    flex: 1,
  },
  primaryBtn: {
    paddingVertical: 12,
    justifyContent: 'center',
    shadowColor: '#176B50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtnSub: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  secondaryBtn: {
    paddingVertical: 12,
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtnSub: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
    padding: 6,
  },
  securityFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

