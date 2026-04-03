import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTransactions, addTransaction as addTransactionToDB, getSetting, setSetting } from '../utils/database';

const EXPENSE_CATEGORIES = [
  { key: '住房', icon: 'home', color: '#f44336', bg: '#ffebee' },
  { key: '餐饮', icon: 'restaurant', color: '#ff9800', bg: '#fff3e0' },
  { key: '交通', icon: 'car', color: '#2196F3', bg: '#e3f2fd' },
  { key: '购物', icon: 'shopping', color: '#9c27b0', bg: '#f3e5f5' },
  { key: '其他', icon: 'ellipsis-horizontal', color: '#757575', bg: '#f5f5f5' },
];

const FinancePlanningScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState({
    total: 5000,
    spent: 0,
    remaining: 5000,
  });
  const [selectedTab, setSelectedTab] = useState('expense');
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '餐饮',
  });
  const [budgetModal, setBudgetModal] = useState({ visible: false, draft: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const totalStr = await getSetting('budget_total', '5000');
      const total = parseFloat(String(totalStr));
      const safeTotal = Number.isFinite(total) && total > 0 ? total : 5000;
      const transactionsFromDB = await getTransactions();
      setTransactions(transactionsFromDB);
      const spent = transactionsFromDB.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      setBudget({ total: safeTotal, spent, remaining: safeTotal - spent });
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('错误', '加载交易失败');
    }
  };

  const addTransactionHandler = async () => {
    if (newTransaction.title && newTransaction.amount) {
      const newTransactionObj = {
        title: newTransaction.title,
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type,
        date: new Date().toISOString().split('T')[0],
        category: newTransaction.type === 'expense' ? newTransaction.category : '其他',
      };

      try {
        await addTransactionToDB(newTransactionObj);
        await loadAll();
        setNewTransaction({ title: '', amount: '', type: 'expense', category: '餐饮' });
        setSelectedTab('expense');
      } catch (error) {
        console.error('Error adding transaction:', error);
        Alert.alert('错误', '添加交易失败');
      }
    }
  };

  const saveBudget = async () => {
    const n = parseFloat(String(budgetModal.draft).trim());
    if (Number.isNaN(n) || n <= 0) {
      Alert.alert('提示', '请输入大于 0 的预算金额');
      return;
    }
    try {
      await setSetting('budget_total', String(n));
      setBudgetModal({ visible: false, draft: '' });
      await loadAll();
    } catch (e) {
      console.error(e);
      Alert.alert('错误', '保存预算失败');
    }
  };

  const getTransactionColor = (type) => {
    return type === 'income' ? '#4CAF50' : '#f44336';
  };

  const categoryTotals = () => {
    const map = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      map[c.key] = 0;
    });
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const c = t.category || '其他';
        map[c] = (map[c] || 0) + t.amount;
      });
    return map;
  };

  const totals = categoryTotals();
  const progressPct = budget.total > 0 ? Math.min(100, (budget.spent / budget.total) * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>预算概览</Text>
        <TouchableOpacity
          onPress={() => setBudgetModal({ visible: true, draft: String(budget.total) })}
          activeOpacity={0.7}
        >
          <Text style={styles.budgetEditHint}>点击「总预算」可修改月度预算（已持久化）</Text>
        </TouchableOpacity>
        <View style={styles.budgetCard}>
          <TouchableOpacity style={styles.budgetItem} onPress={() => setBudgetModal({ visible: true, draft: String(budget.total) })}>
            <Text style={styles.budgetLabel}>总预算</Text>
            <Text style={styles.budgetValue}>¥{budget.total.toFixed(0)}</Text>
          </TouchableOpacity>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>已使用</Text>
            <Text style={[styles.budgetValue, { color: '#f44336' }]}>¥{budget.spent.toFixed(0)}</Text>
          </View>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>剩余</Text>
            <Text style={[styles.budgetValue, { color: '#4CAF50' }]}>¥{budget.remaining.toFixed(0)}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPct}%`,
                backgroundColor: budget.spent / budget.total > 0.8 ? '#f44336' : '#ff9800',
              },
            ]}
          />
        </View>
      </View>

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
          {newTransaction.type === 'expense' && (
            <View style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>分类</Text>
              <View style={styles.categoryChips}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    style={[
                      styles.chip,
                      newTransaction.category === c.key && styles.chipActive,
                    ]}
                    onPress={() => setNewTransaction({ ...newTransaction, category: c.key })}
                  >
                    <Text style={[styles.chipText, newTransaction.category === c.key && styles.chipTextActive]}>
                      {c.key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>交易记录</Text>
        <View style={styles.transactionsContainer}>
          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.type === 'income' ? '#e8f5e8' : '#ffebee' },
                  ]}
                >
                  <Ionicons
                    name={transaction.type === 'income' ? 'arrow-down' : 'arrow-up'}
                    size={24}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>{transaction.title}</Text>
                  <Text style={styles.transactionDate}>
                    {transaction.date}
                    {transaction.type === 'expense' && transaction.category
                      ? ` · ${transaction.category}`
                      : ''}
                  </Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, { color: getTransactionColor(transaction.type) }]}>
                {transaction.type === 'income' ? '+' : '-'}
                {transaction.amount}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>支出分类（按当前记账汇总）</Text>
        <View style={styles.categoriesContainer}>
          {EXPENSE_CATEGORIES.map((c) => (
            <View key={c.key} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: c.bg }]}>
                <Ionicons name={c.icon} size={24} color={c.color} />
              </View>
              <Text style={styles.categoryName}>{c.key}</Text>
              <Text style={styles.categoryAmount}>¥{(totals[c.key] || 0).toFixed(0)}</Text>
            </View>
          ))}
        </View>
      </View>

      <Modal visible={budgetModal.visible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>月度总预算（元）</Text>
            <TextInput
              style={styles.modalInput}
              value={budgetModal.draft}
              onChangeText={(t) => setBudgetModal((m) => ({ ...m, draft: t }))}
              keyboardType="decimal-pad"
              placeholder="例如 5000"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setBudgetModal({ visible: false, draft: '' })}
              >
                <Text style={styles.modalBtnTextDark}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnOk]} onPress={saveBudget}>
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
  budgetEditHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
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
  categoryRow: {
    gap: 8,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  chipActive: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  chipTextActive: {
    color: 'white',
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

export default FinancePlanningScreen;
