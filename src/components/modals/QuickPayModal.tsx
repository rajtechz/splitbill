import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from '../common/Icon';
import { Avatar } from '../avatars/Avatar';
import { formatMoney } from '../../utils/money';
import { initiateUpiTransfer } from '../../utils/upi';
import { PersonDebtDetail } from '../../features/balances/calculations/debtEngine';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

interface QuickPayModalProps {
  visible: boolean;
  person: PersonDebtDetail | null;
  onClose: () => void;
  onNavigateToDetailed?: (person: PersonDebtDetail) => void;
}

export const QuickPayModal: React.FC<QuickPayModalProps> = ({
  visible,
  person,
  onClose,
  onNavigateToDetailed,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const currentUser = useAuthStore(state => state.currentUser);
  const { recordSettlement } = useAppStore();

  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    if (person) {
      setUpiId(person.upiId || `${person.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`);
      setPaymentDone(false);
    }
  }, [person]);

  if (!person) return null;

  const handleLaunchUpi = async () => {
    const cleanUpi = upiId.trim();
    if (!cleanUpi || !cleanUpi.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI address (e.g. name@okaxis or 9876543210@upi).');
      return;
    }

    const opened = await initiateUpiTransfer({
      payeeUpiId: cleanUpi,
      payeeName: person.name,
      amount: person.amount,
      note: `SplitMate settlement for ${person.name}`,
    });

    if (opened) {
      // Suggest clearing after returning from UPI
      Alert.alert(
        'Payment Initiated',
        `Did your transfer of ${formatMoney(person.amount, person.currency)} to ${person.name} succeed?`,
        [
          { text: 'Not Yet', style: 'cancel' },
          {
            text: 'Yes, Mark Settled',
            style: 'default',
            onPress: () => handleMarkSettled('UPI'),
          },
        ]
      );
    }
  };

  const handleMarkSettled = async (method: 'UPI' | 'Cash' = 'UPI') => {
    setSubmitting(true);
    try {
      await recordSettlement({
        payerId: currentUser?.id || 'usr_me',
        payerName: currentUser?.name || 'You',
        receiverId: person.userId,
        receiverName: person.name,
        amount: person.amount,
        currency: person.currency,
        paymentMethod: method,
        status: 'CONFIRMED',
        upiId: method === 'UPI' ? upiId.trim() : undefined,
        notes: `Quick settlement with ${person.name}`,
        date: new Date().toISOString(),
      });

      setPaymentDone(true);
      Alert.alert(
        'Payment Cleared 🎉',
        `Successfully settled ${formatMoney(person.amount, person.currency)} with ${person.name}. Your ledger is updated!`,
        [
          {
            text: 'Done',
            onPress: () => {
              onClose();
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not record settlement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareDetails = async () => {
    try {
      await Share.share({
        message: `Settling ${formatMoney(person.amount, person.currency)} with ${person.name} on SplitMate. UPI: ${upiId}`,
      });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: borderRadius.xxl,
              borderTopRightRadius: borderRadius.xxl,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
            },
          ]}
        >
          {/* Header Bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={[styles.headerRow, { borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Pay & Settle Debt</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Direct payment with instant ledger clearance
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Recipient & Amount Card */}
          <View
            style={[
              styles.amountCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.lg,
                borderColor: colors.borderSubtle,
                ...shadows.soft,
              },
            ]}
          >
            <View style={styles.recipientRow}>
              <Avatar name={person.name} url={person.avatarUrl} size={48} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                  {person.name}
                </Text>
                {person.groupName ? (
                  <View style={styles.groupBadge}>
                    <Icon name="groups" size={13} color={colors.textSecondary} />
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textSecondary, marginLeft: 4, fontWeight: '600' },
                      ]}
                    >
                      {person.groupName}
                    </Text>
                  </View>
                ) : (
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    Shared Expenses
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.amountRow}>
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
                YOU ARE PAYING
              </Text>
              <Text style={[typography.amountLarge, { color: colors.danger }]}>
                {formatMoney(person.amount, person.currency)}
              </Text>
            </View>
          </View>

          {/* UPI Address Input */}
          <View style={{ marginBottom: spacing.md }}>
            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, fontWeight: '700', marginBottom: 6 },
              ]}
            >
              RECEIVER’S UPI ADDRESS / VPA
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Icon name="wallet" size={18} color={colors.primary} />
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                placeholder="name@okaxis or 9876543210@upi"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  typography.bodyMedium,
                  styles.upiInput,
                  { color: colors.textPrimary },
                ]}
              />
              <TouchableOpacity onPress={handleShareDetails} style={{ padding: 4 }}>
                <Icon name="share" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Direct UPI Payment Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLaunchUpi}
            style={[
              styles.primaryUpiBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <Icon name="arrow-up-right" size={18} color="#FFFFFF" />
            <Text style={[typography.buttonMedium, { color: '#FFFFFF', marginLeft: 8 }]}>
              Pay {formatMoney(person.amount, person.currency)} via UPI App
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              typography.caption,
              { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
            ]}
          >
            Supports Google Pay, PhonePe, Paytm, BHIM, CRED & Bank Apps
          </Text>

          {/* Mark as Paid (Instant Ledger Clearance) */}
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={submitting}
            onPress={() => handleMarkSettled('UPI')}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.sm,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Icon name="check" size={18} color={colors.success} />
                <Text style={[typography.buttonMedium, { color: colors.textPrimary, marginLeft: 8 }]}>
                  Mark as Paid & Clear Balance
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* More options (Cash / Full Form) */}
          <View style={styles.footerOptions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleMarkSettled('Cash')}
              style={{ paddingVertical: 8, paddingHorizontal: 12 }}
            >
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>
                Paid in Cash
              </Text>
            </TouchableOpacity>

            <Text style={{ color: colors.textMuted }}>•</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                if (onNavigateToDetailed) {
                  onNavigateToDetailed(person);
                }
              }}
              style={{ paddingVertical: 8, paddingHorizontal: 12 }}
            >
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                Custom Amount / More Options →
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
  },
  upiInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    paddingVertical: 0,
  },
  primaryUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1,
  },
  footerOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
