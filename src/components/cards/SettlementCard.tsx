import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Settlement } from '../../types';
import { formatMoney } from '../../utils/money';
import { Icon } from '../common/Icon';
import { format } from 'date-fns';

interface SettlementCardProps {
  settlement: Settlement;
  currentUserId?: string;
  onConfirm?: () => void;
  onReject?: () => void;
  style?: ViewStyle;
}

export const SettlementCard: React.FC<SettlementCardProps> = ({
  settlement,
  currentUserId = 'usr_me',
  onConfirm,
  onReject,
  style,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const isUserPayer = settlement.payerId === currentUserId;
  const isUserReceiver = settlement.receiverId === currentUserId;
  const status = settlement.status || 'CONFIRMED';
  const isPending = status === 'PENDING';
  const isRejected = status === 'REJECTED';

  let formattedDate = '';
  try {
    formattedDate = format(new Date(settlement.date), 'MMM d, yyyy');
  } catch {
    formattedDate = settlement.date;
  }

  const iconColor = isRejected ? colors.danger : isPending ? colors.warning : colors.success;
  const iconBg = isRejected ? colors.dangerLight : isPending ? colors.warningLight : colors.successLight;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: isPending ? colors.warning : colors.borderSubtle,
          ...shadows.soft,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Icon name={isRejected ? 'close' : isPending ? 'alert' : 'check'} size={20} color={iconColor} />
        </View>

        <View style={styles.details}>
          <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
            {isUserPayer
              ? `You paid ${settlement.receiverName}`
              : isUserReceiver
              ? `${settlement.payerName} paid you`
              : `${settlement.payerName} paid ${settlement.receiverName}`}
          </Text>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {formattedDate} • via {settlement.paymentMethod}
            {settlement.groupName ? ` • ${settlement.groupName}` : ''}
          </Text>

          {settlement.transactionReference ? (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              Ref: {settlement.transactionReference}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
          <Text style={[typography.amountMedium, { color: iconColor }]}>
            {formatMoney(settlement.amount, settlement.currency)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: iconBg, borderRadius: borderRadius.xs },
            ]}
          >
            <Text style={[typography.caption, { color: iconColor, fontSize: 10, fontWeight: '700' }]}>
              {status}
            </Text>
          </View>
        </View>
      </View>

      {/* Receiver verification action buttons */}
      {isPending && isUserReceiver && onConfirm && onReject && (
        <View style={[styles.actionRow, { borderTopColor: colors.divider }]}>
          <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>
            Did you receive this payment?
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onReject}
            style={[styles.smallBtn, { backgroundColor: colors.dangerLight, marginRight: 8 }]}
          >
            <Text style={[typography.caption, { color: colors.danger, fontWeight: '700' }]}>
              Decline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onConfirm}
            style={[styles.smallBtn, { backgroundColor: colors.successLight }]}
          >
            <Text style={[typography.caption, { color: colors.success, fontWeight: '700' }]}>
              ✓ Confirm Received
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
