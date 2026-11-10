import React from 'react';
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
import { AppHeader } from '../../../components/common/AppHeader';
import { Icon, IconName } from '../../../components/common/Icon';
import { EmptyState } from '../../../components/common/EmptyState';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { notifications, markNotificationRead } = useAppStore();

  const getNotifIcon = (type: string): { icon: IconName; color: string; bg: string } => {
    switch (type) {
      case 'expense':
        return { icon: 'receipt', color: colors.primary, bg: colors.primaryLight };
      case 'settlement':
        return { icon: 'check', color: colors.success, bg: colors.successLight };
      case 'invite':
        return { icon: 'groups', color: colors.info, bg: colors.infoLight };
      default:
        return { icon: 'bell', color: colors.warning, bg: colors.warningLight };
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Notifications" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 60 }]}>
        {notifications.length > 0 ? (
          notifications.map(item => {
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
                    {item.message}
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
            description="You will see notifications here when friends add expenses or settle debts."
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

