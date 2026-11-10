import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Button } from '../../../components/buttons/Button';
import { AmountInput } from '../../../components/inputs/AmountInput';
import { ExpenseCategory, CurrencyCode } from '../../../types';
import { Icon, IconName } from '../../../components/common/Icon';
import { calculateEqualSplit } from '../calculations/splitEngine';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditExpenseRouteProp = RouteProp<RootStackParamList, 'EditExpense'>;

const CATEGORIES: { key: ExpenseCategory; label: string; icon: IconName }[] = [
  { key: 'Food', label: 'Food', icon: 'food' },
  { key: 'Groceries', label: 'Groceries', icon: 'food' },
  { key: 'Transport', label: 'Transport', icon: 'travel' },
  { key: 'Travel', label: 'Travel', icon: 'travel' },
  { key: 'Rent', label: 'Rent', icon: 'home-cat' },
  { key: 'Utilities', label: 'Utilities', icon: 'utilities' },
  { key: 'Shopping', label: 'Shopping', icon: 'shopping' },
  { key: 'Entertainment', label: 'Fun', icon: 'entertainment' },
  { key: 'Medical', label: 'Medical', icon: 'medical' },
  { key: 'Other', label: 'Other', icon: 'receipt' },
];

export const EditExpenseScreen: React.FC = () => {
  const route = useRoute<EditExpenseRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const { expenseId } = route.params;
  const { expenses, updateExpense } = useAppStore();
  const expense = expenses.find(e => e.id === expenseId);

  const [title, setTitle] = useState(expense?.title || '');
  const [amountStr, setAmountStr] = useState(expense ? expense.totalAmount.toString() : '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'Food');
  const [notes, setNotes] = useState(expense?.notes || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter an expense title');
      return;
    }
    const parsed = parseFloat(amountStr) || 0;
    if (parsed <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }

    if (!expense) return;

    setSaving(true);
    setErrorMsg(null);

    // Recalculate participants shares with equal distribution on new amount
    const participantIds = expense.participants.map(p => p.userId);
    const splitResult = calculateEqualSplit(parsed, participantIds, expense.currency);

    const updatedParticipants = expense.participants.map(p => {
      const shareAmount = splitResult.shares[p.userId] || 0;
      // If single payer paid whole amount previously, update their paidAmount too
      const paidAmount = p.paidAmount > 0 ? parsed : 0;
      return {
        ...p,
        paidAmount,
        shareAmount,
        netBalance: paidAmount - shareAmount,
      };
    });

    await updateExpense(expenseId, {
      title: title.trim(),
      totalAmount: parsed,
      category,
      notes: notes.trim() || undefined,
      participants: updatedParticipants,
    });

    setSaving(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Edit Expense" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          DESCRIPTION / TITLE *
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={[
            styles.input,
            typography.bodyLarge,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
            },
          ]}
        />

        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 6 },
          ]}
        >
          TOTAL AMOUNT *
        </Text>
        <AmountInput
          value={amountStr}
          onChangeText={setAmountStr}
          currency={expense?.currency || 'INR'}
        />

        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 8 },
          ]}
        >
          CATEGORY
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map(cat => {
            const isSelected = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.7}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Icon
                  name={cat.icon}
                  size={16}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? colors.primary : colors.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                      marginLeft: 6,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 6 },
          ]}
        >
          NOTES
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[
            styles.notesInput,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
            },
          ]}
        />

        {errorMsg && (
          <Text style={[typography.caption, { color: colors.danger, marginTop: 12 }]}>
            {errorMsg}
          </Text>
        )}

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.xl, marginBottom: 40 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  notesInput: {
    height: 60,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
});

