import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Icon, IconName } from '../../../components/common/Icon';
import { EmptyState } from '../../../components/common/EmptyState';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);

  const currentUserName = (currentUser?.name || '').toLowerCase().trim();
  const currentUserId = currentUser?.id || '';

  // Filter only notifications intended for the current user
  const userNotifications = useMemo(() => {
    const seen = new Set<string>();

    return notifications.filter(item => {
      // 1. If recipientId is specified, it MUST match the current user
      if (item.recipientId && currentUserId && item.recipientId !== currentUserId) {
        return false;
      }

      const text = ((item.message || item.body || '') + ' ' + (item.title || '')).toLowerCase();

      // 2. Never show self-targeted notifications: "KD paid you..." to KD
      if (currentUserName && text.includes(`${currentUserName} paid you`)) {
        return false;
      }

      // 3. Never show "KD added [Expense]. Your share is..." to KD
      if (currentUserName && text.includes(`${currentUserName} added`) && text.includes('your share is')) {
        return false;
      }

      // 4. Deduplicate identical messages sent within the same minute
      const dedupeKey = `${item.title}_${item.message || item.body}_${item.timestamp.slice(0, 16)}`;
      if (seen.has(dedupeKey)) {
        return false;
      }
      seen.add(dedupeKey);

      return true;
    });
  }, [notifications, currentUserName, currentUserId]);

  const getNotifIcon = (type: string): { icon: IconName; color: string; bg: string } => {
    switch (type) {
      case 'expense':
      case 'expense_added':
      case 'expense_updated':
        return { icon: 'receipt', color: colors.primary, bg: colors.primaryLight };
      case 'settlement':
      case 'payment_received':
        return { icon: 'check', color: colors.success, bg: colors.successLight };
      case 'invite':
      case 'group_invite':
      case 'friend_invite':
        return { icon: 'groups', color: colors.primary, bg: colors.primaryLight };
      default:
        return { icon: 'bell', color: colors.warning, bg: colors.warningLight };
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Notifications"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          userNotifications.some(n => !n.read)
            ? {
                icon: 'check',
                onPress: markAllNotificationsRead,
              }
            : undefined
        }
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 60 }]}>
        {userNotifications.length > 0 ? (
          userNotifications.map(item => {
            const iconConfig = getNotifIcon(item.type);
            let timeStr = '';
            try {
              timeStr = format(new Date(item.timestamp), 'MMM d, h:mm a');
            } catch {
              timeStr = item.timestamp;
            }

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => markNotificationRead(item.id)}
                style={[
                  styles.card,
                  {
                    backgroundColor: item.read ? colors.surface : colors.primaryLight,
                    borderColor: item.read ? colors.borderSubtle : colors.primaryLight,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                  <Icon name={iconConfig.icon} size={18} color={iconConfig.color} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]}>
                    {item.message || item.body}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                    {timeStr}
                  </Text>
                </View>

                {!item.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })
        ) : (
          <EmptyState
            title="All caught up!"
            description="You will see notifications here when friends add expenses or settle debts with you."
            iconName="bell"
          />
        )}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});

