import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addHealthData, getHealthData } from '../utils/database';

const HealthManagementScreen = () => {
  const [healthData, setHealthData] = useState({
    steps: 8500,
    calories: 1800,
    sleep: 7.5,
    water: 2500,
  });

  const [selectedTab, setSelectedTab] = useState('daily');

  const healthActivities = [
    { id: 1, name: '晨跑', duration: '30分钟', calories: 250, time: '07:30' },
    { id: 2, name: '瑜伽', duration: '45分钟', calories: 150, time: '18:00' },
    { id: 3, name: '游泳', duration: '60分钟', calories: 400, time: '12:00' },
  ];

  const 饮食记录 = [
    { id: 1, meal: '早餐', items: ['牛奶', '鸡蛋', '面包'], calories: 350, time: '08:00' },
    { id: 2, meal: '午餐', items: ['米饭', '鸡肉', '蔬菜'], calories: 650, time: '12:30' },
    { id: 3, meal: '晚餐', items: ['面条', '鱼肉', '豆腐'], calories: 500, time: '19:00' },
  ];

  // 加载健康数据
  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const stepsData = await getHealthData('steps', today);
      const caloriesData = await getHealthData('calories', today);
      const sleepData = await getHealthData('sleep', today);
      const waterData = await getHealthData('water', today);
      
      // 如果有数据，更新状态
      if (stepsData.length > 0) {
        setHealthData(prev => ({ ...prev, steps: stepsData[0].value }));
      }
      if (caloriesData.length > 0) {
        setHealthData(prev => ({ ...prev, calories: caloriesData[0].value }));
      }
      if (sleepData.length > 0) {
        setHealthData(prev => ({ ...prev, sleep: sleepData[0].value }));
      }
      if (waterData.length > 0) {
        setHealthData(prev => ({ ...prev, water: waterData[0].value }));
      }
    } catch (error) {
      console.error('Error loading health data:', error);
      Alert.alert('错误', '加载健康数据失败');
    }
  };

  const saveHealthData = async (type, value) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await addHealthData({ type, value, date: today });
    } catch (error) {
      console.error('Error saving health data:', error);
      Alert.alert('错误', '保存健康数据失败');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 健康数据概览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>健康概览</Text>
        <View style={styles.healthStats}>
          <View style={styles.healthCard}>
            <Ionicons name="walk" size={32} color="#4CAF50" />
            <Text style={styles.healthValue}>{healthData.steps}</Text>
            <Text style={styles.healthLabel}>步数</Text>
          </View>
          <View style={styles.healthCard}>
            <Ionicons name="flame" size={32} color="#ff9800" />
            <Text style={styles.healthValue}>{healthData.calories}</Text>
            <Text style={styles.healthLabel}>卡路里</Text>
          </View>
          <View style={styles.healthCard}>
            <Ionicons name="moon" size={32} color="#2196F3" />
            <Text style={styles.healthValue}>{healthData.sleep}h</Text>
            <Text style={styles.healthLabel}>睡眠</Text>
          </View>
          <View style={styles.healthCard}>
            <Ionicons name="water" size={32} color="#03a9f4" />
            <Text style={styles.healthValue}>{healthData.water}ml</Text>
            <Text style={styles.healthLabel}>饮水</Text>
          </View>
        </View>
      </View>

      {/* 活动记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>活动记录</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'daily' && styles.tabActive]}
            onPress={() => setSelectedTab('daily')}
          >
            <Text style={[styles.tabText, selectedTab === 'daily' && styles.tabTextActive]}>每日</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'weekly' && styles.tabActive]}
            onPress={() => setSelectedTab('weekly')}
          >
            <Text style={[styles.tabText, selectedTab === 'weekly' && styles.tabTextActive]}>每周</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'monthly' && styles.tabActive]}
            onPress={() => setSelectedTab('monthly')}
          >
            <Text style={[styles.tabText, selectedTab === 'monthly' && styles.tabTextActive]}>每月</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activitiesContainer}>
          {healthActivities.map(activity => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityLeft}>
                <View style={styles.activityIcon}>
                  <Ionicons name="fitness" size={24} color="#4CAF50" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
              <View style={styles.activityRight}>
                <Text style={styles.activityDuration}>{activity.duration}</Text>
                <Text style={styles.activityCalories}>{activity.calories} 卡路里</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 饮食记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>饮食记录</Text>
        <View style={styles.dietContainer}>
          {饮食记录.map(record => (
            <View key={record.id} style={styles.dietItem}>
              <View style={styles.dietLeft}>
                <View style={styles.dietIcon}>
                  <Ionicons name="restaurant" size={24} color="#ff9800" />
                </View>
                <View style={styles.dietInfo}>
                  <Text style={styles.dietMeal}>{record.meal}</Text>
                  <Text style={styles.dietItems}>{record.items.join('、')}</Text>
                </View>
              </View>
              <View style={styles.dietRight}>
                <Text style={styles.dietCalories}>{record.calories} 卡路里</Text>
                <Text style={styles.dietTime}>{record.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 睡眠记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>睡眠记录</Text>
        <View style={styles.sleepContainer}>
          <View style={styles.sleepCard}>
            <Text style={styles.sleepText}>入睡时间</Text>
            <Text style={styles.sleepTime}>23:30</Text>
          </View>
          <View style={styles.sleepCard}>
            <Text style={styles.sleepText}>起床时间</Text>
            <Text style={styles.sleepTime}>07:00</Text>
          </View>
          <View style={styles.sleepCard}>
            <Text style={styles.sleepText}>睡眠质量</Text>
            <Text style={styles.sleepQuality}>良好</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  healthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  healthValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  healthLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
  },
  activitiesContainer: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activityCalories: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 4,
  },
  dietContainer: {
    gap: 12,
  },
  dietItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dietLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dietIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dietInfo: {
    flex: 1,
  },
  dietMeal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dietItems: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dietRight: {
    alignItems: 'flex-end',
  },
  dietCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9800',
  },
  dietTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sleepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sleepCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  sleepText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sleepTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  sleepQuality: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default HealthManagementScreen;