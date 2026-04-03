import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getHabits,
  addHabit,
  updateHabit,
  deleteHabit as deleteHabitFromDB,
  recordHabitCheckIn,
  getHabitCalendarDatesInMonth,
} from '../utils/database';

const pad2 = (n) => String(n).padStart(2, '0');

const HabitFormationScreen = () => {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4CAF50');
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1);
  const [habitDoneDates, setHabitDoneDates] = useState([]);

  const todayStr = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabitCalendar = useCallback(async () => {
    try {
      const dates = await getHabitCalendarDatesInMonth(calendarYear, calendarMonth);
      setHabitDoneDates(dates);
    } catch (e) {
      console.error(e);
    }
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    loadHabitCalendar();
  }, [loadHabitCalendar]);

  const loadHabits = async () => {
    try {
      const habitsFromDB = await getHabits();
      setHabits(habitsFromDB);
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('错误', '加载习惯失败');
    }
  };

  const toggleHabit = async (id) => {
    const updatedHabits = habits.map((habit) => {
      if (habit.id === id) {
        const newCompleted = !habit.completed;
        const newStreak = newCompleted ? habit.streak + 1 : habit.streak;
        return { ...habit, completed: newCompleted, streak: newStreak };
      }
      return habit;
    });
    setHabits(updatedHabits);

    try {
      const habitToUpdate = updatedHabits.find((habit) => habit.id === id);
      const newCompleted = habitToUpdate.completed;
      await updateHabit(habitToUpdate);
      await recordHabitCheckIn(id, todayStr(), newCompleted);
      await loadHabitCalendar();
    } catch (error) {
      console.error('Error updating habit:', error);
      Alert.alert('错误', '更新习惯失败');
      loadHabits();
    }
  };

  const addHabitHandler = async () => {
    if (newHabit.trim()) {
      const newHabitObj = {
        name: newHabit,
        completed: false,
        streak: 0,
        color: selectedColor,
      };

      try {
        await addHabit(newHabitObj);
        await loadHabits();
        setNewHabit('');
      } catch (error) {
        console.error('Error adding habit:', error);
        Alert.alert('错误', '添加习惯失败');
      }
    }
  };

  const deleteHabit = async (id) => {
    try {
      await deleteHabitFromDB(id);
      setHabits(habits.filter((habit) => habit.id !== id));
      await loadHabitCalendar();
    } catch (error) {
      console.error('Error deleting habit:', error);
      Alert.alert('错误', '删除习惯失败');
    }
  };

  const colors = ['#4CAF50', '#2196F3', '#ff9800', '#f44336', '#9c27b0', '#03a9f4'];

  const doneSet = new Set(habitDoneDates);

  const shiftMonth = (delta) => {
    let m = calendarMonth + delta;
    let y = calendarYear;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
  const firstWeekday = new Date(calendarYear, calendarMonth - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ type: 'blank', key: `b${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarYear}-${pad2(calendarMonth)}-${pad2(d)}`;
    cells.push({ type: 'day', key: `d${d}`, day: d, dateStr });
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>添加新习惯</Text>
        <View style={styles.addHabitContainer}>
          <TextInput
            style={styles.input}
            placeholder="习惯名称"
            value={newHabit}
            onChangeText={setNewHabit}
          />
          <View style={styles.colorSelector}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorButtonSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && <Ionicons name="checkmark" size={16} color="white" />}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: selectedColor }]} onPress={addHabitHandler}>
            <Text style={styles.addButtonText}>添加</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>我的习惯</Text>
        <View style={styles.habitsContainer}>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitItem}>
              <View style={styles.habitLeft}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    { borderColor: habit.color },
                    habit.completed && { backgroundColor: habit.color },
                  ]}
                  onPress={() => toggleHabit(habit.id)}
                >
                  {habit.completed && <Ionicons name="checkmark" size={20} color="white" />}
                </TouchableOpacity>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <Text style={styles.habitStreak}>连续 {habit.streak} 天</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteHabit(habit.id)}>
                <Ionicons name="trash-outline" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>习惯统计</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={32} color="#ff9800" />
            <Text style={styles.statValue}>{habits.length}</Text>
            <Text style={styles.statLabel}>总习惯数</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>{habits.filter((h) => h.completed).length}</Text>
            <Text style={styles.statLabel}>今日完成</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={32} color="#9c27b0" />
            <Text style={styles.statValue}>{Math.max(...habits.map((h) => h.streak), 0)}</Text>
            <Text style={styles.statLabel}>最长连续</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>习惯日历</Text>
        <Text style={styles.calendarSub}>有打点表示当日至少完成一项习惯打卡</Text>
        <View style={styles.calendarHeaderRow}>
          <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.calendarText}>
            {calendarYear}年{calendarMonth}月
          </Text>
          <TouchableOpacity onPress={() => shiftMonth(1)} hitSlop={12}>
            <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarGrid}>
          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
            <Text key={index} style={styles.calendarDayHeader}>
              {day}
            </Text>
          ))}
          {cells.map((cell) =>
            cell.type === 'blank' ? (
              <View key={cell.key} style={styles.calendarDay} />
            ) : (
              <View key={cell.key} style={styles.calendarDay}>
                <Text
                  style={[
                    styles.calendarDayText,
                    doneSet.has(cell.dateStr) && styles.calendarDayTextCompleted,
                  ]}
                >
                  {cell.day}
                </Text>
                {doneSet.has(cell.dateStr) ? <View style={styles.calendarDayDot} /> : null}
              </View>
            )
          )}
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
  calendarSub: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addHabitContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  colorSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  habitsContainer: {
    gap: 12,
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  habitStreak: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  calendarText: {
    fontSize: 16,
    fontWeight: '600',
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
  calendarDayTextCompleted: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  calendarDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginTop: 4,
  },
});

export default HabitFormationScreen;
