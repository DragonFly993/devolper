import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addTimeRecord, getTimeRecords } from '../utils/database';

const TimeManagementScreen = () => {
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25分钟
  const [totalTime, setTotalTime] = useState(0);

  // 加载今日时间记录
  useEffect(() => {
    loadTimeRecords();
  }, []);

  const loadTimeRecords = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = await getTimeRecords(today);
      const total = records.reduce((sum, record) => sum + record.duration, 0);
      setTotalTime(total);
    } catch (error) {
      console.error('Error loading time records:', error);
      Alert.alert('错误', '加载时间记录失败');
    }
  };

  const toggleTimer = async () => {
    if (!timerRunning && timeLeft === 25 * 60) {
      // 开始新的番茄钟
      setTimerRunning(true);
    } else if (timerRunning) {
      // 暂停番茄钟
      setTimerRunning(false);
    } else {
      // 继续番茄钟
      setTimerRunning(true);
    }
  };

  const resetTimer = async () => {
    setTimerRunning(false);
    // 保存完成的番茄钟记录
    if (timeLeft < 25 * 60) {
      const duration = 25 * 60 - timeLeft;
      try {
        await addTimeRecord({
          activity: '番茄钟',
          duration: duration,
          date: new Date().toISOString().split('T')[0]
        });
        await loadTimeRecords();
      } catch (error) {
        console.error('Error saving time record:', error);
        Alert.alert('错误', '保存时间记录失败');
      }
    }
    setTimeLeft(25 * 60);
  };

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 定时器逻辑
  useEffect(() => {
    let interval;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // 番茄钟完成
      setTimerRunning(false);
      resetTimer();
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  return (
    <ScrollView style={styles.container}>
      {/* 番茄钟 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>番茄钟</Text>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <View style={styles.timerButtons}>
            <TouchableOpacity 
              style={[styles.timerButton, { backgroundColor: timerRunning ? '#f44336' : '#4CAF50' }]}
              onPress={toggleTimer}
            >
              <Ionicons name={timerRunning ? 'pause' : 'play'} size={24} color="white" />
              <Text style={styles.timerButtonText}>{timerRunning ? '暂停' : '开始'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.timerButton, { backgroundColor: '#ff9800' }]} onPress={resetTimer}>
              <Ionicons name="refresh" size={24} color="white" />
              <Text style={styles.timerButtonText}>重置</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 时间统计 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>时间统计</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="time" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>2.5h</Text>
            <Text style={styles.statLabel}>今日专注</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color="#2196F3" />
            <Text style={styles.statValue}>12h</Text>
            <Text style={styles.statLabel}>本周专注</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={32} color="#FFC107" />
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>完成率</Text>
          </View>
        </View>
      </View>

      {/* 日历 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>日历</Text>
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarText}>2026年3月</Text>
          <View style={styles.calendarGrid}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <Text key={index} style={styles.calendarDayHeader}>{day}</Text>
            ))}
            {Array.from({ length: 31 }, (_, index) => (
              <TouchableOpacity key={index} style={styles.calendarDay}>
                <Text style={styles.calendarDayText}>{index + 1}</Text>
              </TouchableOpacity>
            ))}
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
  timerContainer: {
    alignItems: 'center',
    padding: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  timerButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  calendarContainer: {
    alignItems: 'center',
  },
  calendarText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 8,
    fontWeight: '600',
    color: '#666',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
});

export default TimeManagementScreen;