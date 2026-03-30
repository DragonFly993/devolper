import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// 导入屏幕组件
import TimeManagementScreen from './src/screens/TimeManagementScreen';
import TaskTrackingScreen from './src/screens/TaskTrackingScreen';
import HealthManagementScreen from './src/screens/HealthManagementScreen';
import FinancePlanningScreen from './src/screens/FinancePlanningScreen';
import HabitFormationScreen from './src/screens/HabitFormationScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === '时间管理') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === '任务追踪') {
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
            } else if (route.name === '健康管理') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === '财务规划') {
              iconName = focused ? 'cash' : 'cash-outline';
            } else if (route.name === '习惯养成') {
              iconName = focused ? 'flower' : 'flower-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#f8f9fa',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#4CAF50',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        })}
      >
        <Tab.Screen name="时间管理" component={TimeManagementScreen} />
        <Tab.Screen name="任务追踪" component={TaskTrackingScreen} />
        <Tab.Screen name="健康管理" component={HealthManagementScreen} />
        <Tab.Screen name="财务规划" component={FinancePlanningScreen} />
        <Tab.Screen name="习惯养成" component={HabitFormationScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}