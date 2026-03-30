import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 导入数据库工具
import { initDatabase } from './src/utils/database';

// 导入屏幕组件
import TimeManagementScreen from './src/screens/TimeManagementScreen';
import TaskTrackingScreen from './src/screens/TaskTrackingScreen';
import HealthManagementScreen from './src/screens/HealthManagementScreen';
import FinancePlanningScreen from './src/screens/FinancePlanningScreen';
import HabitFormationScreen from './src/screens/HabitFormationScreen';

const Tab = createBottomTabNavigator();

// 为每个标签页定义不同的渐变色
const tabColors = {
  '时间管理': ['#4CAF50', '#81C784'],
  '任务追踪': ['#2196F3', '#64B5F6'],
  '健康管理': ['#FF9800', '#FFB74D'],
  '财务规划': ['#9C27B0', '#BA68C8'],
  '习惯养成': ['#F44336', '#EF5350'],
};

export default function App() {
  // 初始化数据库
  useEffect(() => {
    initDatabase();
  }, []);

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
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
          tabBarStyle: {
            backgroundColor: '#333',
            borderTopWidth: 0,
            paddingBottom: 10,
            paddingTop: 10,
            height: 70,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: 'transparent',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerBackground: () => (
            <LinearGradient
              colors={tabColors[route.name]}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          ),
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            textShadowColor: 'rgba(0, 0, 0, 0.2)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          },
          headerTitleAlign: 'center',
        })}
      >
        <Tab.Screen 
          name="时间管理" 
          component={TimeManagementScreen}
          options={{
            tabBarStyle: {
              backgroundColor: '#4CAF50',
            },
          }}
        />
        <Tab.Screen 
          name="任务追踪" 
          component={TaskTrackingScreen}
          options={{
            tabBarStyle: {
              backgroundColor: '#2196F3',
            },
          }}
        />
        <Tab.Screen 
          name="健康管理" 
          component={HealthManagementScreen}
          options={{
            tabBarStyle: {
              backgroundColor: '#FF9800',
            },
          }}
        />
        <Tab.Screen 
          name="财务规划" 
          component={FinancePlanningScreen}
          options={{
            tabBarStyle: {
              backgroundColor: '#9C27B0',
            },
          }}
        />
        <Tab.Screen 
          name="习惯养成" 
          component={HabitFormationScreen}
          options={{
            tabBarStyle: {
              backgroundColor: '#F44336',
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}