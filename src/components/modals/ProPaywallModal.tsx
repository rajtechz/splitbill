import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../common/Icon';
import { ProFeature } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

interface ProPaywallModalProps {
  visible: boolean;
  feature?: ProFeature;
  onClose: () => void;
  onNavigateToPlans?: () => void;
}

const FEATURE_HIGHLIGHTS: Record<
  ProFeature,
  { title: string; subtitle: string; icon: any }
> = {
  receipt_ocr: {
    title: 'Smart Receipt Scanner',
    subtitle: 'Scan physical receipts to automatically extract total, date, taxes, and items using AI OCR.',
    icon: 'receipt',
  },
  export_csv: {
    title: 'Export to Excel & PDF',
    subtitle: 'Download complete spending reports in CSV or PDF format for taxes and accounting.',
    icon: 'share',
  },
  smart_simplification: {
    title: 'Smart Debt Minimizer',
    subtitle: 'Simplify complex multi-group debts into the absolute minimum number of direct transactions.',
    icon: 'refresh',
  },
  currency_converter: {
    title: 'Live Foreign Exchange Converter',
    subtitle: 'Convert foreign currency expenses automatically using real-time global exchange rates.',
    icon: 'wallet',
  },
  unlimited_expenses: {
    title: 'Unlimited Daily Expenses',
    subtitle: 'Remove daily creation limits and track infinite personal and group expenses.',
    icon: 'plus',
  },
};

export const ProPaywallModal: React.FC<ProPaywallModalProps> = ({
  visible,
  feature = 'receipt_ocr',
  onClose,
  onNavigateToPlans,
}) => {
  const { colors, typography, borderRadius, shadows } = useTheme();
  const { upgradeToPro } = useAuthStore();

  const highlight = FEATURE_HIGHLIGHTS[feature] || FEATURE_HIGHLIGHTS.receipt_ocr;

  const handleInstantTrial = async () => {
    await upgradeToPro('annual');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              ...shadows.medium,
            },
          ]}
        >
          {/* Header Crown Icon */}
          <View style={styles.header}>
            <View style={styles.crownWrap}>
              <Icon name="crown" size={32} color="#D4AF37" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.content}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>SPLITMATE PRO FEATURE</Text>
            </View>

            <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center', marginTop: 10 }]}>
              {highlight.title}
            </Text>

            <Text
              style={[
                typography.bodyMedium,
                { color: colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 12 },
              ]}
            >
              {highlight.subtitle}
            </Text>

            {/* Feature Bullets */}
            <View style={[styles.bulletsBox, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg }]}>
              <View style={styles.bulletRow}>
                <Icon name="check" size={16} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.textPrimary, marginLeft: 10, flex: 1, fontWeight: '600' }]}>
                  AI Itemized Receipt OCR Scanner
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Icon name="check" size={16} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.textPrimary, marginLeft: 10, flex: 1, fontWeight: '600' }]}>
                  Global Multi-Group Debt Simplification
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Icon name="check" size={16} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.textPrimary, marginLeft: 10, flex: 1, fontWeight: '600' }]}>
                  Export Spending Reports to CSV & PDF
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Icon name="check" size={16} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.textPrimary, marginLeft: 10, flex: 1, fontWeight: '600' }]}>
                  Real-time Multi-Currency Conversion
                </Text>
              </View>
            </View>

            {/* CTA Buttons */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleInstantTrial}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: '#176B50',
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text style={styles.primaryBtnText}>Start 7-Day Free Trial</Text>
              <Text style={styles.primaryBtnSub}>Then ₹1,499/year (Save 37%)</Text>
            </TouchableOpacity>

            {onNavigateToPlans ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onNavigateToPlans();
                }}
                style={styles.plansLink}
              >
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                  View All Pro Plans & Features →
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  crownWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF9E6',
    borderWidth: 1.5,
    borderColor: '#E6C65C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 6,
  },
  content: {
    alignItems: 'center',
    marginTop: 14,
  },
  proBadge: {
    backgroundColor: '#FFF4D4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadgeText: {
    color: '#8F6B00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bulletsBox: {
    width: '100%',
    padding: 14,
    marginTop: 18,
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBtnSub: {
    color: '#B8E7D3',
    fontSize: 11,
    marginTop: 2,
  },
  plansLink: {
    marginTop: 14,
    paddingVertical: 4,
  },
});

