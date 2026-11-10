import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { useSecurityStore } from '../../store/useSecurityStore';
import { BottomTabNavigator } from './BottomTabNavigator';
import { SplashScreen } from '../../features/auth/screens/SplashScreen';
import { PinLockScreen } from '../../features/auth/screens/PinLockScreen';

// Auth Screens
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../../features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '../../features/auth/screens/ForgotPasswordScreen';
import { OtpVerificationScreen } from '../../features/auth/screens/OtpVerificationScreen';

// Feature Screens
import { GroupDetailsScreen } from '../../features/groups/screens/GroupDetailsScreen';
import { CreateGroupScreen } from '../../features/groups/screens/CreateGroupScreen';
import { EditGroupScreen } from '../../features/groups/screens/EditGroupScreen';
import { AddGroupMemberScreen } from '../../features/groups/screens/AddGroupMemberScreen';

import { FriendDetailsScreen } from '../../features/friends/screens/FriendDetailsScreen';
import { AddFriendScreen } from '../../features/friends/screens/AddFriendScreen';

import { AddExpenseScreen } from '../../features/expenses/screens/AddExpenseScreen';
import { ExpenseDetailsScreen } from '../../features/expenses/screens/ExpenseDetailsScreen';
import { EditExpenseScreen } from '../../features/expenses/screens/EditExpenseScreen';

import { RecordSettlementScreen } from '../../features/settlements/screens/RecordSettlementScreen';

import { AnalyticsScreen } from '../../features/analytics/screens/AnalyticsScreen';
import { NotificationsScreen } from '../../features/notifications/screens/NotificationsScreen';
import { SearchScreen } from '../../features/home/screens/SearchScreen';
import { EditProfileScreen } from '../../features/profile/screens/EditProfileScreen';
import { SubscriptionScreen } from '../../features/profile/screens/SubscriptionScreen';
import { notificationService } from '../../services/native/notificationService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const { loadInitialData } = useAppStore();
  const { isPinEnabled, isLocked, initializeSecurity, lock } = useSecurityStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initializeAuth();
    loadInitialData();
    initializeSecurity();
    notificationService.requestPermission();

    const sub = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background') {
        lock();
      }
    });
    return () => sub.remove();
  }, [initializeAuth, loadInitialData, initializeSecurity, lock]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // If user is authenticated and mPIN is enabled, block with PIN screen
  if (isAuthenticated && isPinEnabled && isLocked) {
    return <PinLockScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {!isAuthenticated ? (
        // Auth Stack
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        </Stack.Group>
      ) : (
        // Authenticated App Stack
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

          {/* Groups */}
          <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
          <Stack.Screen name="EditGroup" component={EditGroupScreen} />
          <Stack.Screen name="AddGroupMember" component={AddGroupMemberScreen} />

          {/* Friends */}
          <Stack.Screen name="FriendDetails" component={FriendDetailsScreen} />
          <Stack.Screen name="AddFriend" component={AddFriendScreen} />

          {/* Expenses */}
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
          <Stack.Screen name="EditExpense" component={EditExpenseScreen} />

          {/* Settlements */}
          <Stack.Screen
            name="RecordSettlement"
            component={RecordSettlementScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />

          {/* Analytics, Notifications, Search, Profile */}
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

