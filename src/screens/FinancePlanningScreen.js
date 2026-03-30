import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTransactions, addTransaction as addTransactionToDB } from '../utils/database';

const FinancePlanningScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState({
    total: 5000,
    spent: 3600,
    remaining: 1400,
  });

  const [selectedTab, setSelectedTab] = useState('expense');
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    amount: '',
    type: 'expense',
  });

  // 加载交易
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const transactionsFromDB = await getTransactions();
      setTransactions(transactionsFromDB);
      // 更新预算
      updateBudget(transactionsFromDB);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('错误', '加载交易失败');
    }
  };

  const updateBudget = (transactions) => {
    const spent = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const remaining = budget.total - spent;
    setBudget({ ...budget, spent, remaining });
  };

  const addTransactionHandler = async () => {
    if (newTransaction.title && newTransaction.amount) {
      const newTransactionObj = {
        title: newTransaction.title,
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type,
        date: new Date().toISOString().split('T')[0],
      };
      
      try {
        await addTransactionToDB(newTransactionObj);
        await loadTransactions();
        setNewTransaction({ title: '', amount: '', type: 'expense' });
      } catch (error) {
        console.error('Error adding transaction:', error);
        Alert.alert('错误', '添加交易失败');
      }
    }
  };

  const getTransactionColor = (type) => {
    return type === 'income' ? '#4CAF50' : '#f44336';
  };

  return (
    <ScrollView style={styles.container}>
      {/* 预算概览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>预算概览</Text>
        <View style={styles.budgetCard}>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>总预算</Text>
            <Text style={styles.budgetValue}>¥{budget.total}</Text>
          </View>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>已使用</Text>
            <Text style={[styles.budgetValue, { color: '#f44336' }]}>¥{budget.spent}</Text>
          </View>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>剩余</Text>
            <Text style={[styles.budgetValue, { color: '#4CAF50' }]}>¥{budget.remaining}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(budget.spent / budget.total) * 100}%`,
                backgroundColor: (budget.spent / budget.total) > 0.8 ? '#f44336' : '#ff9800'
              }
            ]} 
          />
        </View>
      </View>

      {/* 添加交易 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>添加交易</Text>
        <View style={styles.addTransactionContainer}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'expense' && styles.tabActive]}
              onPress={() => {
                setSelectedTab('expense');
                setNewTransaction({ ...newTransaction, type: 'expense' });
              }}
            >
              <Text style={[styles.tabText, selectedTab === 'expense' && styles.tabTextActive]}>支出</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'income' && styles.tabActive]}
              onPress={() => {
                setSelectedTab('income');
                setNewTransaction({ ...newTransaction, type: 'income' });
              }}
            >
              <Text style={[styles.tabText, selectedTab === 'income' && styles.tabTextActive]}>收入</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="交易名称"
            value={newTransaction.title}
            onChangeText={(text) => setNewTransaction({ ...newTransaction, title: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="金额"
            value={newTransaction.amount}
            onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
            keyboardType="numeric"
          />
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: getTransactionColor(newTransaction.type) }]}
            onPress={addTransactionHandler}
          >
            <Text style={styles.addButtonText}>添加</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 交易记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>交易记录</Text>
        <View style={styles.transactionsContainer}>
          {transactions.map(transaction => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon, 
                  { backgroundColor: transaction.type === 'income' ? '#e8f5e8' : '#ffebee' }
                ]}>
                  <Ionicons 
                    name={transaction.type === 'income' ? 'arrow-down' : 'arrow-up'} 
                    size={24} 
                    color={getTransactionColor(transaction.type)} 
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>{transaction.title}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount, 
                { color: getTransactionColor(transaction.type) }
              ]}>
                {transaction.type === 'income' ? '+' : '-'}{transaction.amount}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 支出分类 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>支出分类</Text>
        <View style={styles.categoriesContainer}>
          <View style={styles.categoryCard}>
            <View style={[styles.categoryIcon, { backgroundColor: '#ffebee' }]}>
              <Ionicons name="home" size={24} color="#f44336" />
            </View>
            <Text style={styles.categoryName}>住房</Text>
            <Text style={styles.categoryAmount}>¥2500</Text>
          </View>
          <View style={styles.categoryCard}>
            <View style={[styles.categoryIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="restaurant" size={24} color="#ff9800" />
            </View>
            <Text style={styles.categoryName}>餐饮</Text>
            <Text style={styles.categoryAmount}>¥800</Text>
          </View>
          <View style={styles.categoryCard}>
            <View style={[styles.categoryIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="car" size={24} color="#2196F3" />
            </View>
            <Text style={styles.categoryName}>交通</Text>
            <Text style={styles.categoryAmount}>¥300</Text>
          </View>
          <View style={styles.categoryCard}>
            <View style={[styles.categoryIcon, { backgroundColor: '#f3e5f5' }]}>
              <Ionicons name="shopping" size={24} color="#9c27b0" />
            </View>
            <Text style={styles.categoryName}>购物</Text>
            <Text style={styles.categoryAmount}>¥500</Text>
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
  budgetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  addTransactionContainer: {
    gap: 12,
  },
  tabContainer: {
    flexDirection: 'row',
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
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
  transactionsContainer: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default FinancePlanningScreen;