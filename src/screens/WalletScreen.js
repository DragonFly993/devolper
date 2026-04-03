import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { startMockPayment } from '../services/mockPaymentService';
import { getWalletOverview } from '../services/walletService';

export default function WalletScreen() {
  const [amount, setAmount] = useState('10');
  const [overview, setOverview] = useState({ account: { balance: 0, frozen: 0 }, ledger: [], orders: [] });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const data = await getWalletOverview();
    setOverview(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const runPayment = async (direction, channel) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('提示', '请输入有效金额');
      return;
    }
    setLoading(true);
    try {
      const res = await startMockPayment({ amount: n, direction, channel, note: `${channel} 模拟${direction}` });
      if (!res.ok) {
        Alert.alert('支付结果', `订单 ${res.orderNo} 模拟失败`);
      } else {
        Alert.alert('支付结果', `订单 ${res.orderNo} 模拟成功`);
      }
      await load();
    } catch (e) {
      Alert.alert('错误', e?.message || '支付失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 26 }}>
      <View style={styles.card}>
        <Text style={styles.title}>账户余额</Text>
        <Text style={styles.balance}>¥ {Number(overview.account.balance || 0).toFixed(2)}</Text>
        <Text style={styles.sub}>冻结金额：¥ {Number(overview.account.frozen || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>模拟支付</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="金额（元）" />
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.topupBtn, loading && styles.disabled]} disabled={loading} onPress={() => runPayment('topup', 'alipay')}>
            <Text style={styles.btnText}>支付宝模拟充值</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.topupBtn, loading && styles.disabled]} disabled={loading} onPress={() => runPayment('topup', 'wechat')}>
            <Text style={styles.btnText}>微信模拟充值</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.payBtn, loading && styles.disabled]} disabled={loading} onPress={() => runPayment('pay', 'alipay')}>
            <Text style={styles.btnText}>支付宝模拟消费</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.payBtn, loading && styles.disabled]} disabled={loading} onPress={() => runPayment('pay', 'wechat')}>
            <Text style={styles.btnText}>微信模拟消费</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>最近流水</Text>
        {overview.ledger.slice(0, 12).map((l) => (
          <View key={String(l.id)} style={styles.item}>
            <Text style={styles.itemLeft}>{l.type} {l.order_no ? `#${l.order_no}` : ''}</Text>
            <Text style={[styles.itemAmount, { color: Number(l.amount) >= 0 ? '#16a34a' : '#dc2626' }]}>
              {Number(l.amount) >= 0 ? '+' : ''}{Number(l.amount).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  balance: { fontSize: 34, fontWeight: '700', color: '#16a34a' },
  sub: { color: '#6b7280', marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  topupBtn: { backgroundColor: '#16a34a' },
  payBtn: { backgroundColor: '#2563eb' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  disabled: { opacity: 0.6 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemLeft: { color: '#374151', fontSize: 12, flex: 1, marginRight: 10 },
  itemAmount: { fontWeight: '700' },
});
