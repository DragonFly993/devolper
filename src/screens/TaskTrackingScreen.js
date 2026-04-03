import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getTasks, addTask, updateTask, deleteTask as deleteTaskFromDB } from '../utils/database';

const TaskTrackingScreen = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');

  // 加载任务
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const tasksFromDB = await getTasks();
      setTasks(tasksFromDB);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('错误', '加载任务失败');
    }
  };

  const toggleTask = async (id) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    
    try {
      const taskToUpdate = updatedTasks.find(task => task.id === id);
      await updateTask(taskToUpdate);
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('错误', '更新任务失败');
      // 恢复原始状态
      loadTasks();
    }
  };

  const addTaskHandler = async () => {
    if (newTask.trim()) {
      const newTaskObj = {
        title: newTask,
        completed: false,
        priority: priority
      };
      
      try {
        await addTask(newTaskObj);
        await loadTasks();
        setNewTask('');
        setPriority('medium');
      } catch (error) {
        console.error('Error adding task:', error);
        Alert.alert('错误', '添加任务失败');
      }
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteTaskFromDB(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('错误', '删除任务失败');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4CAF50';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.reminderEntry} onPress={() => navigation.navigate('ReminderCenter')}>
        <Ionicons name="notifications-outline" size={18} color="#0EA5E9" />
        <Text style={styles.reminderEntryText}>任务提醒中心</Text>
      </TouchableOpacity>
      {/* 添加任务 */}
      <View style={styles.addTaskContainer}>
        <TextInput
          style={styles.input}
          placeholder="添加新任务"
          value={newTask}
          onChangeText={setNewTask}
        />
        <View style={styles.prioritySelector}>
          <TouchableOpacity 
            style={[styles.priorityButton, { backgroundColor: priority === 'high' ? '#f44336' : '#f0f0f0' }]}
            onPress={() => setPriority('high')}
          >
            <Text style={[styles.priorityText, { color: priority === 'high' ? 'white' : '#333' }]}>高</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.priorityButton, { backgroundColor: priority === 'medium' ? '#ff9800' : '#f0f0f0' }]}
            onPress={() => setPriority('medium')}
          >
            <Text style={[styles.priorityText, { color: priority === 'medium' ? 'white' : '#333' }]}>中</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.priorityButton, { backgroundColor: priority === 'low' ? '#4CAF50' : '#f0f0f0' }]}
            onPress={() => setPriority('low')}
          >
            <Text style={[styles.priorityText, { color: priority === 'low' ? 'white' : '#333' }]}>低</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addTaskHandler}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* 任务列表 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>待办事项</Text>
        {tasks.map(task => (
          <TouchableOpacity 
            key={task.id} 
            style={styles.taskItem}
            onPress={() => toggleTask(task.id)}
          >
            <View style={styles.taskLeft}>
              <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
                {task.completed && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                {task.title}
              </Text>
            </View>
            <View style={styles.taskRight}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
              <TouchableOpacity onPress={() => deleteTask(task.id)}>
                <Ionicons name="trash-outline" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 项目管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>项目管理</Text>
        <View style={styles.projectsContainer}>
          <View style={styles.projectCard}>
            <View style={[styles.projectColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.projectTitle}>移动应用开发</Text>
            <Text style={styles.projectProgress}>75% 完成</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%', backgroundColor: '#4CAF50' }]} />
            </View>
          </View>
          <View style={styles.projectCard}>
            <View style={[styles.projectColor, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.projectTitle}>网站改版</Text>
            <Text style={styles.projectProgress}>40% 完成</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '40%', backgroundColor: '#2196F3' }]} />
            </View>
          </View>
          <View style={styles.projectCard}>
            <View style={[styles.projectColor, { backgroundColor: '#FFC107' }]} />
            <Text style={styles.projectTitle}>市场调研</Text>
            <Text style={styles.projectProgress}>20% 完成</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '20%', backgroundColor: '#FFC107' }]} />
            </View>
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
  addTaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reminderEntry: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: -6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderEntryText: { color: '#0369a1', fontWeight: '600' },
  input: {
    flex: 1,
    fontSize: 16,
    marginRight: 12,
  },
  prioritySelector: {
    flexDirection: 'row',
    marginRight: 12,
  },
  priorityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  priorityText: {
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
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
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  taskTitle: {
    fontSize: 16,
    color: '#333',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  projectsContainer: {
    gap: 16,
  },
  projectCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    position: 'relative',
    paddingLeft: 24,
  },
  projectColor: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  projectProgress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default TaskTrackingScreen;