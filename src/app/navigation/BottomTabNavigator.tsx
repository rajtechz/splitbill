import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { useTheme } from '../../theme';
import { Icon, IconName } from '../../components/common/Icon';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { GroupsScreen } from '../../features/groups/screens/GroupsScreen';
import { ActivityScreen } from '../../features/activity/screens/ActivityScreen';
import { BalancesScreen } from '../../features/balances/screens/BalancesScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#176B50',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName: IconName = 'home';
          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'GroupsTab') iconName = 'groups';
          else if (route.name === 'ActivityTab') iconName = 'activity';
          else if (route.name === 'BalancesTab') iconName = 'balances';
          else if (route.name === 'ProfileTab') iconName = 'profile';

          return (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Icon name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="GroupsTab" component={GroupsScreen} options={{ tabBarLabel: 'Groups' }} />
      <Tab.Screen name="ActivityTab" component={ActivityScreen} options={{ tabBarLabel: 'Activity' }} />
      <Tab.Screen name="BalancesTab" component={BalancesScreen} options={{ tabBarLabel: 'Balances' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  activeIconWrap: {
    transform: [{ scale: 1.05 }],
  },
});
