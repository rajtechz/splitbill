import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { useAlert } from '../../../context/AlertContext';
import { AppHeader } from '../../../components/common/AppHeader';
import { Icon } from '../../../components/common/Icon';
import { subscriptionService, RazorpayOrderResponse } from '../../../services/api/subscriptionService';
import { RazorpayModal } from '../../../components/modals/RazorpayModal';

interface PlanOption {
  id: 'annual' | 'monthly';
  name: string;
  price: string;
  period: string;
  badge?: string;
  savings?: string;
}

const PLANS: PlanOption[] = [
  {
    id: 'annual',
    name: 'Annual Subscription',
    price: '₹1,499',
    period: '/ year (approx. ₹125/mo)',
    badge: 'SAVE 37%',
    savings: 'Includes 7-Day Free Trial',
  },
  {
    id: 'monthly',
    name: 'Monthly Subscription',
    price: '₹199',
    period: '/ month',
    savings: 'Flexible, cancel anytime',
  },
];

const COMPARISON_FEATURES = [
  { name: 'Expense creation', free: '4 / day', pro: 'Unlimited' },
  { name: 'AI Receipt Scanner (OCR)', free: '❌', pro: '✅ Unlimited' },
  { name: 'Cross-group debt simplifier', free: 'Basic', pro: '✅ Global Engine' },
  { name: 'Export to Excel, CSV & PDF', free: '❌', pro: '✅ Full Reports' },
  { name: 'Live foreign currency conversion', free: '❌', pro: '✅ Real-time FX' },
  { name: 'Expense search & filtering', free: 'Basic', pro: '✅ Deep History' },
  { name: 'Ad-free experience', free: '❌', pro: '✅ Zero Ads' },
  { name: 'VIP Gold Profile Badge', free: '❌', pro: '✅ Included' },
];

export const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, typography, borderRadius, shadows, isDark } = useTheme();
  const { isPro, currentUser, upgradeToPro, downgradeToFree } = useAuthStore();
  const { showAlert } = useAlert();

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [upgrading, setUpgrading] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrderResponse | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const handleSubscribe = async () => {
    setUpgrading(true);
    try {
      const order = await subscriptionService.createRazorpayOrder(selectedPlan);
      setRazorpayOrder(order);
      setPaymentModalVisible(true);
    } catch (error: any) {
      showAlert({
        title: 'Order Creation Failed',
        message:
          error?.response?.data?.message ||
          error.message ||
          'Failed to connect to Razorpay. Please check your network and try again.',
        variant: 'danger',
        confirmText: 'OK',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => {
    setPaymentModalVisible(false);
    setUpgrading(true);
    try {
      const verifyResult = await subscriptionService.verifyRazorpayPayment({
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId,
        signature: paymentData.signature,
        plan: selectedPlan,
      });

      await upgradeToPro(selectedPlan);

      showAlert({
        title: 'Welcome to SplitMate Pro!',
        message:
          verifyResult?.message ||
          'Your subscription is now active. All premium features including AI receipt scanning, CSV export, and smart debt simplification are unlocked!',
        variant: 'celebration',
        emoji: '🎉',
        confirmText: 'Great!',
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      showAlert({
        title: 'Payment Verification Error',
        message:
          error?.response?.data?.message ||
          error.message ||
          'Could not verify your payment signature with Razorpay.',
        variant: 'danger',
        confirmText: 'OK',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = () => {
    showAlert({
      title: 'Cancel Pro Subscription',
      message: 'Are you sure you want to revert to the Free tier? You will lose unlimited receipt OCR scanning and advanced exports.',
      variant: 'danger',
      confirmText: 'Cancel Plan',
      cancelText: 'Keep Pro',
      isDestructive: true,
      onConfirm: async () => {
        // 1. Instantly downgrade auth state optimistically
        await downgradeToFree();

        // 2. Notify backend in background (graceful catch)
        subscriptionService.cancelSubscription().catch(err => {
          console.warn('Backend subscription cancellation warning:', err);
        });

        // 3. Show instant confirmation alert
        showAlert({
          title: 'Subscription Cancelled',
          message: 'You have been successfully reverted to the Free tier.',
          variant: 'info',
          confirmText: 'OK',
        });
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="SplitMate Pro"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Crown Banner */}
        <View
          style={[
            styles.heroBanner,
            {
              backgroundColor: isPro ? '#0E3A2B' : '#122E24',
              borderRadius: borderRadius.xl,
              ...shadows.medium,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconBox}>
              <Icon name="crown" size={32} color="#D4AF37" />
            </View>
            <View style={styles.proPill}>
              <Text style={styles.proPillText}>
                {isPro ? 'PRO ACTIVE' : 'PREMIUM MEMBERSHIP'}
              </Text>
            </View>
          </View>

          <Text style={[typography.h1, styles.heroTitle]}>
            {isPro ? 'You are a Pro Member' : 'Supercharge Your SplitMate'}
          </Text>

          <Text style={[typography.bodyMedium, styles.heroSubtitle]}>
            {isPro
              ? `Subscribed as ${currentUser?.name}. Enjoy unlimited OCR receipt scans, smart debt simplification, and financial exports.`
              : 'Join thousands of users who save time, eliminate debt confusion, and track group spending effortlessly.'}
          </Text>

          {isPro && currentUser?.subscriptionExpiresAt ? (
            <View style={styles.activeExpiryRow}>
              <Icon name="check" size={14} color="#B8E7D3" />
              <Text style={styles.activeExpiryText}>
                Active until {new Date(currentUser.subscriptionExpiresAt).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Plan Selector (if not Pro) */}
        {!isPro ? (
          <View style={styles.section}>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
              CHOOSE YOUR PLAN
            </Text>

            <View style={styles.plansContainer}>
              {PLANS.map(plan => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: colors.surface,
                        borderRadius: borderRadius.lg,
                        borderColor: isSelected ? '#176B50' : colors.borderSubtle,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={styles.planCardHeader}>
                      <View style={styles.planRadio}>
                        {isSelected ? <View style={styles.planRadioInner} /> : null}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                          {plan.name}
                        </Text>
                        <Text style={[typography.caption, { color: colors.textSecondary }]}>
                          {plan.savings}
                        </Text>
                      </View>
                      {plan.badge ? (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsBadgeText}>{plan.badge}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.planPriceRow}>
                      <Text style={[typography.amountLarge, { color: colors.textPrimary }]}>
                        {plan.price}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
                        {plan.period}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subscribe Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubscribe}
              disabled={upgrading}
              style={[
                styles.subscribeBtn,
                {
                  backgroundColor: '#176B50',
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              {upgrading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.subscribeBtnText}>
                    {selectedPlan === 'annual' ? 'Start 7-Day Free Trial' : 'Upgrade to Pro Now'}
                  </Text>
                  <Text style={styles.subscribeBtnSub}>
                    {selectedPlan === 'annual'
                      ? '7 days free, then ₹1,499/year. Cancel anytime.'
                      : '₹199/month. Cancel anytime.'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCancelSubscription}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5',
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Icon name="close" size={16} color={colors.danger} />
              <Text style={[typography.buttonMedium, { color: colors.danger, fontWeight: '700' }]}>
                Cancel Pro Subscription
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feature Comparison Table */}
        <View style={styles.section}>
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
            FREE VS PRO COMPARISON
          </Text>

          <View
            style={[
              styles.comparisonCard,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.comparisonHeader}>
              <Text style={[typography.caption, { flex: 2, color: colors.textSecondary, fontWeight: '700' }]}>
                FEATURE
              </Text>
              <Text style={[typography.caption, { flex: 1, textAlign: 'center', color: colors.textSecondary }]}>
                FREE
              </Text>
              <Text style={[typography.caption, { flex: 1.4, textAlign: 'center', color: '#176B50', fontWeight: '800' }]}>
                PRO
              </Text>
            </View>

            {COMPARISON_FEATURES.map((item, idx) => (
              <View
                key={item.name}
                style={[
                  styles.comparisonRow,
                  {
                    borderTopColor: colors.divider,
                    backgroundColor: idx % 2 === 0 ? 'transparent' : colors.surfaceVariant,
                  },
                ]}
              >
                <Text style={[typography.caption, { flex: 2, color: colors.textPrimary, fontWeight: '600' }]}>
                  {item.name}
                </Text>
                <Text style={[typography.caption, { flex: 1, textAlign: 'center', color: colors.textSecondary }]}>
                  {item.free}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { flex: 1.4, textAlign: 'center', color: '#176B50', fontWeight: '700' },
                  ]}
                >
                  {item.pro}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Guarantee Banner */}
        <View style={[styles.guaranteeBox, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md }]}>
          <Icon name="shield" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
              100% Risk-Free Guarantee
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Cancel anytime in your App Store or Play Store settings. No questions asked.
            </Text>
          </View>
        </View>

        <Text style={[typography.caption, styles.disclaimer, { color: colors.textMuted }]}>
          Payment will be charged to your Apple App Store or Google Play account. Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current billing cycle.
        </Text>
      </ScrollView>

      {/* Razorpay Payment Modal */}
      <RazorpayModal
        visible={paymentModalVisible}
        order={razorpayOrder}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={handlePaymentSuccess}
        onError={(errMsg) => {
          showAlert({
            title: 'Payment Failed',
            message: errMsg,
            variant: 'danger',
            confirmText: 'OK',
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    padding: 24,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proPill: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proPillText: {
    color: '#122E24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    marginTop: 18,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#B8E7D3',
    marginTop: 8,
    lineHeight: 20,
  },
  activeExpiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  activeExpiryText: {
    color: '#B8E7D3',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    padding: 16,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#176B50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#176B50',
  },
  savingsBadge: {
    backgroundColor: '#E7F7F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingsBadgeText: {
    color: '#239B68',
    fontSize: 10,
    fontWeight: '800',
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    marginLeft: 34,
  },
  subscribeBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subscribeBtnSub: {
    color: '#B8E7D3',
    fontSize: 11,
    marginTop: 3,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
  },
  comparisonCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});

