import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { addReminder, deleteReminder, getReminders, updateReminder } from '../utils/database';
import { requestNotificationPermission, registerNotificationToken } from '../services/notificationService';
import { rescheduleAllReminders, testReminderNow } from '../services/reminderScheduler';

const emptyForm = {
  title: '',
  body: '',
  remindAt: new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16),
  repeatType: 'none',
};

export default function ReminderCenterScreen() {
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const rows = await getReminders();
    setReminders(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const create = async () => {
    if (!form.title.trim()) {
      Alert.alert('提示', '请填写提醒标题');
      return;
    }
    setSaving(true);
    try {
      await requestNotificationPermission();
      await registerNotificationToken();
      await addReminder({
        title: form.title.trim(),
        body: form.body.trim(),
        remindAt: new Date(form.remindAt).toISOString(),
        repeatType: form.repeatType,
        sourceModule: 'reminder-center',
      });
      await rescheduleAllReminders();
      setForm(emptyForm);
      await load();
    } catch (e) {
      Alert.alert('错误', e?.message || '创建提醒失败');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item) => {
    await updateReminder({ ...item, enabled: !item.enabled });
    await rescheduleAllReminders();
    await load();
  };

  const remove = async (id) => {
    await deleteReminder(id);
    await rescheduleAllReminders();
    await load();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={styles.card}>
        <Text style={styles.title}>新增提醒</Text>
        <TextInput style={styles.input} placeholder="提醒标题" value={form.title} onChangeText={(t) => setForm((s) => ({ ...s, title: t }))} />
        <TextInput style={styles.input} placeholder="提醒内容（可选）" value={form.body} onChangeText={(t) => setForm((s) => ({ ...s, body: t }))} />
        <TextInput
          style={styles.input}
          placeholder="提醒时间"
          value={form.remindAt}
          onChangeText={(t) => setForm((s) => ({ ...s, remindAt: t }))}
        />
        <View style={styles.row}>
          {['none', 'daily', 'weekly'].map((r) => (
            <TouchableOpacity key={r} style={[styles.chip, form.repeatType === r && styles.chipOn]} onPress={() => setForm((s) => ({ ...s, repeatType: r }))}>
              <Text style={[styles.chipText, form.repeatType === r && styles.chipTextOn]}>{r === 'none' ? '单次' : r === 'daily' ? '每日' : '每周'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.btn, saving && { opacity: 0.6 }]} onPress={create} disabled={saving}>
          <Text style={styles.btnText}>{saving ? '保存中…' : '保存提醒'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>提醒列表</Text>
        {reminders.length === 0 ? <Text style={styles.empty}>暂无提醒</Text> : null}
        {reminders.map((r) => (
          <View key={r.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{r.title}</Text>
              <Text style={styles.itemSub}>{new Date(r.remindAt).toLocaleString('zh-CN')} · {r.repeatType}</Text>
            </View>
            <TouchableOpacity onPress={() => testReminderNow(r)} style={styles.iconBtn}>
              <Ionicons name="paper-plane-outline" size={18} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggle(r)} style={styles.iconBtn}>
              <Ionicons name={r.enabled ? 'pause-circle-outline' : 'play-circle-outline'} size={20} color="#16A34A" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => remove(r.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  chipText: { color: '#4b5563' },
  chipTextOn: { color: '#166534', fontWeight: '600' },
  btn: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#9ca3af' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemTitle: { color: '#111827', fontWeight: '600' },
  itemSub: { color: '#6b7280', fontSize: 12, marginTop: 3 },
  iconBtn: { padding: 6 },
});
