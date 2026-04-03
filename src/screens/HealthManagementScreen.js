import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { upsertHealthData, getHealthData } from '../utils/database';

const DEFAULTS = { steps: 0, calories: 0, sleep: 0, water: 0 };

const HealthManagementScreen = () => {
  const [healthData, setHealthData] = useState(DEFAULTS);
  const [selectedTab, setSelectedTab] = useState('daily');
  const [editModal, setEditModal] = useState({ visible: false, field: null, label: '', unit: '', draft: '' });

  const healthActivities = [
    { id: 1, name: '晨跑', duration: '30分钟', calories: 250, time: '07:30' },
    { id: 2, name: '瑜伽', duration: '45分钟', calories: 150, time: '18:00' },
    { id: 3, name: '游泳', duration: '60分钟', calories: 400, time: '12:00' },
  ];

  const dietRecords = [
    { id: 1, meal: '早餐', items: ['牛奶', '鸡蛋', '面包'], calories: 350, time: '08:00' },
    { id: 2, meal: '午餐', items: ['米饭', '鸡肉', '蔬菜'], calories: 650, time: '12:30' },
    { id: 3, meal: '晚餐', items: ['面条', '鱼肉', '豆腐'], calories: 500, time: '19:00' },
  ];

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

      setHealthData({
        steps: stepsData.length > 0 ? stepsData[0].value : DEFAULTS.steps,
        calories: caloriesData.length > 0 ? caloriesData[0].value : DEFAULTS.calories,
        sleep: sleepData.length > 0 ? sleepData[0].value : DEFAULTS.sleep,
        water: waterData.length > 0 ? waterData[0].value : DEFAULTS.water,
      });
    } catch (error) {
      console.error('Error loading health data:', error);
      Alert.alert('错误', '加载健康数据失败');
    }
  };

  const openEdit = (field, label, unit, current) => {
    setEditModal({
      visible: true,
      field,
      label,
      unit,
      draft: String(current),
    });
  };

  const saveEdit = async () => {
    const { field, draft } = editModal;
    if (!field) return;
    const num = parseFloat(draft.replace(/,/g, '.'));
    if (Number.isNaN(num) || num < 0) {
      Alert.alert('提示', '请输入有效数字');
      return;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      await upsertHealthData({ type: field, value: num, date: today });
      setHealthData((prev) => ({ ...prev, [field]: num }));
      setEditModal({ visible: false, field: null, label: '', unit: '', draft: '' });
    } catch (error) {
      console.error('Error saving health data:', error);
      Alert.alert('错误', '保存健康数据失败');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>健康概览</Text>
        <Text style={styles.hint}>点击卡片可录入或修改当日数据（会覆盖当日该指标）</Text>
        <View style={styles.healthStats}>
          <TouchableOpacity style={styles.healthCard} onPress={() => openEdit('steps', '步数', '', healthData.steps)}>
            <Ionicons name="walk" size={32} color="#4CAF50" />
            <Text style={styles.healthValue}>{healthData.steps}</Text>
            <Text style={styles.healthLabel}>步数</Text>
            <Text style={styles.tapHint}>点击编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.healthCard}
            onPress={() => openEdit('calories', '摄入卡路里', 'kcal', healthData.calories)}
          >
            <Ionicons name="flame" size={32} color="#ff9800" />
            <Text style={styles.healthValue}>{healthData.calories}</Text>
            <Text style={styles.healthLabel}>卡路里</Text>
            <Text style={styles.tapHint}>点击编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.healthCard}
            onPress={() => openEdit('sleep', '睡眠时长', '小时', healthData.sleep)}
          >
            <Ionicons name="moon" size={32} color="#2196F3" />
            <Text style={styles.healthValue}>{healthData.sleep}h</Text>
            <Text style={styles.healthLabel}>睡眠</Text>
            <Text style={styles.tapHint}>点击编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.healthCard}
            onPress={() => openEdit('water', '饮水量', 'ml', healthData.water)}
          >
            <Ionicons name="water" size={32} color="#03a9f4" />
            <Text style={styles.healthValue}>{healthData.water}ml</Text>
            <Text style={styles.healthLabel}>饮水</Text>
            <Text style={styles.tapHint}>点击编辑</Text>
          </TouchableOpacity>
        </View>
      </View>

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

        {selectedTab === 'daily' ? (
          <View style={styles.activitiesContainer}>
            {healthActivities.map((activity) => (
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
        ) : (
          <Text style={styles.placeholderText}>
            「每周 / 每月」视图将用于汇总运动与消耗，当前为占位说明；每日数据已在上方「健康概览」中按日保存。
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>饮食记录</Text>
        <View style={styles.dietContainer}>
          {dietRecords.map((record) => (
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

      <Modal visible={editModal.visible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              修改{editModal.label}
              {editModal.unit ? `（${editModal.unit}）` : ''}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editModal.draft}
              onChangeText={(t) => setEditModal((m) => ({ ...m, draft: t }))}
              keyboardType="decimal-pad"
              placeholder="输入数字"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setEditModal({ visible: false, field: null, label: '', unit: '', draft: '' })}
              >
                <Text style={styles.modalBtnTextDark}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnOk]} onPress={saveEdit}>
                <Text style={styles.modalBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: 8,
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  healthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  healthCard: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
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
  tapHint: {
    fontSize: 10,
    color: '#4CAF50',
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
  placeholderText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalBtnCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalBtnOk: {
    backgroundColor: '#4CAF50',
  },
  modalBtnText: {
    color: 'white',
    fontWeight: '600',
  },
  modalBtnTextDark: {
    color: '#333',
    fontWeight: '600',
  },
});

export default HealthManagementScreen;
