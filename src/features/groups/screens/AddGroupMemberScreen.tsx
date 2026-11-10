import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { repository } from '../../../services/api/repository';
import { AppHeader } from '../../../components/common/AppHeader';
import { Button } from '../../../components/buttons/Button';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon } from '../../../components/common/Icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AddMemberRouteProp = RouteProp<RootStackParamList, 'AddGroupMember'>;

export const AddGroupMemberScreen: React.FC = () => {
  const route = useRoute<AddMemberRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const { groupId } = route.params;
  const { groups, friends, refreshAll } = useAppStore();
  const group = groups.find(g => g.id === groupId);

  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const existingMemberIds = group?.members.map(m => m.userId) || [];
  const availableFriends = friends.filter(f => !existingMemberIds.includes(f.userId));

  const handleAddExistingFriend = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend || !group) return;

    setLoading(true);
    await repository.addMemberToGroup(groupId, {
      userId: friend.userId,
      name: friend.name,
      email: friend.email,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    await refreshAll();
    setLoading(false);
    navigation.goBack();
  };

  const handleAddCustomUser = async () => {
    if (!customName.trim() || !customEmail.trim()) {
      Alert.alert('Required Fields', 'Please enter a name and email.');
      return;
    }

    setLoading(true);
    await repository.addMemberToGroup(groupId, {
      userId: `usr_${Date.now()}`,
      name: customName.trim(),
      email: customEmail.trim(),
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    await refreshAll();
    setLoading(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Add Group Member" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick add from existing friends */}
        {availableFriends.length > 0 && (
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
              ADD FROM YOUR FRIENDS
            </Text>
            {availableFriends.map(f => (
              <TouchableOpacity
                key={f.id}
                activeOpacity={0.7}
                onPress={() => handleAddExistingFriend(f.id)}
                style={[
                  styles.friendItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Avatar name={f.name} size={38} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                    {f.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {f.email}
                  </Text>
                </View>
                <View style={[styles.addIcon, { backgroundColor: colors.primaryLight }]}>
                  <Icon name="plus" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Or add by name & email */}
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
          OR ADD A NEW PERSON
        </Text>

        <TextInput
          value={customName}
          onChangeText={setCustomName}
          placeholder="Person's Full Name"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
              marginBottom: 12,
            },
          ]}
        />

        <TextInput
          value={customEmail}
          onChangeText={setCustomEmail}
          placeholder="Email address"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[
            styles.input,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
              marginBottom: 20,
            },
          ]}
        />

        <Button
          title="Add to Group"
          onPress={handleAddCustomUser}
          loading={loading}
          disabled={!customName.trim() || !customEmail.trim()}
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
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
});

