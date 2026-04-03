import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';

import HomeScreen from './src/screens/HomeScreen';
import TimeManagementScreen from './src/screens/TimeManagementScreen';
import TaskTrackingScreen from './src/screens/TaskTrackingScreen';
import HealthManagementScreen from './src/screens/HealthManagementScreen';
import FinancePlanningScreen from './src/screens/FinancePlanningScreen';
import HabitFormationScreen from './src/screens/HabitFormationScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import AccountScreen from './src/screens/AccountScreen';
import AiAssistantScreen from './src/screens/AiAssistantScreen';
import ReminderCenterScreen from './src/screens/ReminderCenterScreen';
import WalletScreen from './src/screens/WalletScreen';
import { colors, shadow } from './src/theme/tokens';
import { registerNotificationToken, subscribeForegroundNotifications } from './src/services/notificationService';
import { rescheduleAllReminders } from './src/services/reminderScheduler';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerGreen = {
  backgroundColor: colors.primary,
  elevation: 0,
  shadowOpacity: 0,
};

const tabScreenOptions = ({ route }) => ({
  tabBarIcon: ({ focused, color, size }) => {
    const map = {
      首页: focused ? 'home' : 'home-outline',
      AI助手: focused ? 'flash' : 'flash-outline',
      时间管理: focused ? 'time' : 'time-outline',
      任务追踪: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
      健康管理: focused ? 'heart' : 'heart-outline',
      财务规划: focused ? 'cash' : 'cash-outline',
      习惯养成: focused ? 'flower' : 'flower-outline',
      钱包: focused ? 'wallet' : 'wallet-outline',
    };
    const iconName = map[route.name] || 'ellipse';
    return <Ionicons name={iconName} size={size} color={color} />;
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.tabInactive,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 6,
    paddingTop: 6,
    height: 58,
    ...shadow.tabBar,
  },
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerStyle: headerGreen,
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.2,
  },
});

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="首页" component={HomeScreen} options={{ headerShown: false, title: '首页' }} />
      <Tab.Screen name="AI助手" component={AiAssistantScreen} options={{ title: 'AI 助手' }} />
      <Tab.Screen name="时间管理" component={TimeManagementScreen} />
      <Tab.Screen name="任务追踪" component={TaskTrackingScreen} />
      <Tab.Screen name="健康管理" component={HealthManagementScreen} />
      <Tab.Screen name="财务规划" component={FinancePlanningScreen} />
      <Tab.Screen name="习惯养成" component={HabitFormationScreen} />
      <Tab.Screen name="钱包" component={WalletScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user == null ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              headerShown: true,
              headerTitle: '注册账号',
              headerStyle: headerGreen,
              headerTintColor: '#fff',
              headerShadowVisible: false,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Account"
            component={AccountScreen}
            options={{
              headerShown: true,
              title: '账户与设置',
              headerStyle: headerGreen,
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700', fontSize: 17 },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="ReminderCenter"
            component={ReminderCenterScreen}
            options={{
              headerShown: true,
              title: '提醒中心',
              headerStyle: headerGreen,
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700', fontSize: 17 },
              headerShadowVisible: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    registerNotificationToken().catch(() => {});
    rescheduleAllReminders().catch(() => {});
    const unsubscribe = subscribeForegroundNotifications(() => {});
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
