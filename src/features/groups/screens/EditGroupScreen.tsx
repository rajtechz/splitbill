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
import { CurrencySelector } from '../../../components/inputs/CurrencySelector';
import { GroupCategory, CurrencyCode } from '../../../types';
import { Icon, IconName } from '../../../components/common/Icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditGroupRouteProp = RouteProp<RootStackParamList, 'EditGroup'>;

const GROUP_CATEGORIES: { key: GroupCategory; label: string; icon: IconName }[] = [
  { key: 'Trip', label: 'Trip', icon: 'travel' },
  { key: 'Home', label: 'Home', icon: 'home-cat' },
  { key: 'Couple', label: 'Couple', icon: 'profile' },
  { key: 'Family', label: 'Family', icon: 'groups' },
  { key: 'Friends', label: 'Friends', icon: 'users' },
  { key: 'Office', label: 'Office', icon: 'shield' },
  { key: 'Other', label: 'Other', icon: 'wallet' },
];

export const EditGroupScreen: React.FC = () => {
  const route = useRoute<EditGroupRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const { groupId } = route.params;
  const { groups, updateGroup } = useAppStore();
  const group = groups.find(g => g.id === groupId);

  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [category, setCategory] = useState<GroupCategory>(group?.category || 'Trip');
  const [currency, setCurrency] = useState<CurrencyCode>(group?.currency || 'INR');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await updateGroup(groupId, {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      currency,
    });
    setSaving(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Edit Group" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          GROUP NAME *
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
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
          DESCRIPTION
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          style={[
            styles.textArea,
            typography.bodyMedium,
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
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 8 },
          ]}
        >
          CATEGORY
        </Text>
        <View style={styles.categoryGrid}>
          {GROUP_CATEGORIES.map(cat => {
            const isSelected = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.7}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Icon
                  name={cat.icon}
                  size={20}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? colors.primary : colors.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                      marginTop: 4,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 6 },
          ]}
        >
          DEFAULT CURRENCY
        </Text>
        <CurrencySelector selectedCurrency={currency} onSelect={setCurrency} />

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.xl, marginBottom: 30 }}
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
  textArea: {
    height: 72,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
});

