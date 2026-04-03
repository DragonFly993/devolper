import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, radius, shadow, type } from '../theme/tokens';
import {
  getTasks,
  getHabits,
  getTimeRecords,
  getTransactions,
} from '../utils/database';

const shortcuts = [
  { name: 'AI 助手', icon: 'flash-outline', tab: 'AI助手', color: '#7C4DFF' },
  { name: '时间管理', icon: 'time-outline', tab: '时间管理', color: '#16A34A' },
  { name: '任务追踪', icon: 'checkmark-circle-outline', tab: '任务追踪', color: '#2563EB' },
  { name: '健康管理', icon: 'heart-outline', tab: '健康管理', color: '#E11D48' },
  { name: '财务规划', icon: 'cash-outline', tab: '财务规划', color: '#EA580C' },
  { name: '习惯养成', icon: 'flower-outline', tab: '习惯养成', color: '#9333EA' },
];

function formatTodayZh() {
  try {
    return new Date().toLocaleDateString('zh-CN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    todoPending: 0,
    todayFocusMin: 0,
    habitCount: 0,
    monthExpense: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const dateLine = useMemo(() => formatTodayZh(), []);

  const loadStats = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const [tasks, habits, timeRecs, txs] = await Promise.all([
        getTasks(),
        getHabits(),
        getTimeRecords(today),
        getTransactions(),
      ]);
      const todoPending = tasks.filter((t) => !t.completed).length;
      const focusSec = timeRecs.reduce((s, r) => s + r.duration, 0);
      const ym = today.slice(0, 7);
      const monthExpense = txs
        .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(ym))
        .reduce((s, t) => s + t.amount, 0);
      setStats({
        todoPending,
        todayFocusMin: Math.round(focusSec / 60),
        habitCount: habits.length,
        monthExpense,
      });
    } catch (e) {
      console.error('Home stats', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const openAccount = () => {
    navigation.navigate('Account');
  };

  const goTab = (tabName) => {
    navigation.navigate(tabName);
  };

  const statItems = [
    {
      key: 'todo',
      label: '待办未完成',
      value: String(stats.todoPending),
      icon: 'list-outline',
      accent: '#16A34A',
    },
    {
      key: 'focus',
      label: '今日专注',
      value: `${stats.todayFocusMin}`,
      unit: '分钟',
      icon: 'timer-outline',
      accent: '#2563EB',
    },
    {
      key: 'habit',
      label: '习惯数量',
      value: String(stats.habitCount),
      icon: 'flower-outline',
      accent: '#9333EA',
    },
    {
      key: 'expense',
      label: '本月支出',
      value: `¥${stats.monthExpense.toFixed(0)}`,
      icon: 'wallet-outline',
      accent: '#EA580C',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <LinearGradient colors={colors.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <TouchableOpacity
              style={styles.profileRow}
              onPress={openAccount}
              activeOpacity={0.85}
              hitSlop={{ top: 4, bottom: 4 }}
            >
              {user?.avatarUri ? (
                <Image source={{ uri: user.avatarUri }} style={styles.heroAvatar} />
              ) : (
                <View style={styles.heroAvatarPlaceholder}>
                  <Ionicons name="person" size={28} color="rgba(255,255,255,0.95)" />
                </View>
              )}
              <View style={styles.profileText}>
                <Text style={styles.greet}>你好，{user?.nickname || '用户'}</Text>
                <Text style={styles.email} numberOfLines={1}>
                  {user?.email}
                </Text>
                <View style={styles.accountPill}>
                  <Text style={styles.accountPillText}>账户与设置</Text>
                  <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.85)" />
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsBtn} onPress={openAccount} hitSlop={12}>
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroDesc}>专注当下，把目标拆成可执行的小步</Text>
          {dateLine ? <Text style={styles.heroDate}>{dateLine}</Text> : null}
        </LinearGradient>
      </SafeAreaView>

      <View style={[styles.section, shadow.card]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>今日概览</Text>
            <Text style={styles.sectionSubtitle}>本地数据实时汇总</Text>
          </View>
        </View>
        <View style={styles.statGrid}>
          {statItems.map((item) => (
            <View key={item.key} style={styles.statBox}>
              <View style={styles.statBoxTop}>
                <View style={[styles.statIconWrap, { backgroundColor: `${item.accent}14` }]}>
                  <Ionicons name={item.icon} size={18} color={item.accent} />
                </View>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
              <Text style={[styles.statNum, { color: item.accent }]}>
                {item.value}
                {item.unit ? <Text style={styles.statUnit}> {item.unit}</Text> : null}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, shadow.card]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>快捷入口</Text>
            <Text style={styles.sectionSubtitle}>点击进入对应模块</Text>
          </View>
        </View>
        <View style={styles.shortcuts}>
          {shortcuts.map((item, index) => (
            <TouchableOpacity
              key={item.tab}
              style={[styles.shortcutItem, index === shortcuts.length - 1 && styles.shortcutItemLast]}
              onPress={() => goTab(item.tab)}
              activeOpacity={0.7}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.shortcutText}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.footerNote}>数据保存在本机，换设备需重新注册账号</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  safeTop: {
    backgroundColor: colors.primaryDark,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 22,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  heroAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroAvatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    marginLeft: 14,
    flex: 1,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  accountPillText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.92)',
    marginRight: 2,
  },
  settingsBtn: {
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  greet: {
    fontSize: 21,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 4,
  },
  heroDesc: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  heroDate: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...type.section,
  },
  sectionSubtitle: {
    ...type.sectionSub,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '47%',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  shortcuts: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  shortcutItemLast: {
    borderBottomWidth: 0,
  },
  shortcutIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shortcutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  footerNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 28,
    lineHeight: 18,
  },
});
