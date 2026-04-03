import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressChart, BarChart } from 'react-native-chart-kit';
import {
  addTimeRecord,
  getTimeRecords,
  getTimeRecordsBetween,
  getDailyFocusSecondsForMonth,
} from '../utils/database';
import { colors, radius, shadow } from '../theme/tokens';

const POMODORO_GOAL = 8;
const PRESETS = [
  { label: '15', minutes: 15 },
  { label: '25', minutes: 25 },
  { label: '45', minutes: 45 },
];

const formatDurationShort = (seconds) => {
  if (!seconds || seconds < 60) return `${Math.round(seconds || 0)}秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
  const h = seconds / 3600;
  return `${h.toFixed(1)}小时`;
};

const pad2 = (n) => String(n).padStart(2, '0');

const todayStr = () => new Date().toISOString().split('T')[0];

const screenW = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.bg,
  backgroundGradientFromOpacity: 1,
  backgroundGradientToOpacity: 1,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  propsForBackgroundLines: { stroke: colors.border },
};

function showAlert(title, message) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

const TimeManagementScreen = () => {
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const sessionSeconds = sessionMinutes * 60;

  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(0);
  const [weekSeconds, setWeekSeconds] = useState(0);
  const [todayPomodoroCount, setTodayPomodoroCount] = useState(0);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1);
  const [monthFocusMap, setMonthFocusMap] = useState({});
  const [weekChart, setWeekChart] = useState({ labels: [], datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] });
  const [refreshing, setRefreshing] = useState(false);
  const [statModal, setStatModal] = useState(null);
  const [dayModal, setDayModal] = useState(null);
  const savingZeroRef = useRef(false);

  const loadMonthFocus = useCallback(async () => {
    try {
      const map = await getDailyFocusSecondsForMonth(calendarYear, calendarMonth);
      setMonthFocusMap(map);
    } catch (e) {
      console.error(e);
    }
  }, [calendarYear, calendarMonth]);

  const loadTimeRecords = useCallback(async () => {
    try {
      const today = todayStr();
      const records = await getTimeRecords(today);
      const total = records.reduce((sum, record) => sum + record.duration, 0);
      setTotalTime(total);
      const pomos = records.filter((r) => r.activity === '番茄钟').length;
      setTodayPomodoroCount(pomos);

      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      const start = new Date(d);
      start.setDate(start.getDate() - 6);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      const weekRecs = await getTimeRecordsBetween(startStr, endStr);
      const weekSum = weekRecs.reduce((s, r) => s + r.duration, 0);
      setWeekSeconds(weekSum);

      const byDay = {};
      weekRecs.forEach((r) => {
        byDay[r.date] = (byDay[r.date] || 0) + r.duration;
      });
      const labels = [];
      const dataMinutes = [];
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - i);
        const ds = day.toISOString().split('T')[0];
        labels.push(weekDays[day.getDay()]);
        dataMinutes.push(Math.round((byDay[ds] || 0) / 60));
      }
      setWeekChart({ labels, datasets: [{ data: dataMinutes }] });
    } catch (error) {
      console.error('Error loading time records:', error);
      showAlert('错误', '加载时间记录失败');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTimeRecords();
      loadMonthFocus();
    }, [loadTimeRecords, loadMonthFocus])
  );

  useEffect(() => {
    loadMonthFocus();
  }, [loadMonthFocus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTimeRecords();
      await loadMonthFocus();
    } finally {
      setRefreshing(false);
    }
  }, [loadTimeRecords, loadMonthFocus]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (savingZeroRef.current) return;
    savingZeroRef.current = true;
    void (async () => {
      try {
        await addTimeRecord({
          activity: '番茄钟',
          duration: sessionSeconds,
          date: todayStr(),
        });
        await loadTimeRecords();
        await loadMonthFocus();
      } catch (error) {
        console.error('Error saving time record:', error);
        showAlert('错误', '保存时间记录失败');
      } finally {
        setTimeLeft(sessionSeconds);
        savingZeroRef.current = false;
      }
    })();
  }, [timeLeft, sessionSeconds, loadTimeRecords, loadMonthFocus]);

  const applyPreset = (minutes) => {
    if (timerRunning) return;
    setSessionMinutes(minutes);
    setTimeLeft(minutes * 60);
  };

  const toggleTimer = () => {
    if (!timerRunning && timeLeft === sessionSeconds) {
      setTimerRunning(true);
    } else if (timerRunning) {
      setTimerRunning(false);
    } else {
      setTimerRunning(true);
    }
  };

  const resetTimer = async () => {
    setTimerRunning(false);
    if (timeLeft === 0) {
      setTimeLeft(sessionSeconds);
      return;
    }
    const elapsed = sessionSeconds - timeLeft;
    if (elapsed > 0) {
      try {
        await addTimeRecord({
          activity: '番茄钟',
          duration: elapsed,
          date: todayStr(),
        });
        await loadTimeRecords();
        await loadMonthFocus();
      } catch (error) {
        console.error('Error saving time record:', error);
        showAlert('错误', '保存时间记录失败');
      }
    }
    setTimeLeft(sessionSeconds);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${pad2(mins)}:${pad2(secs)}`;
  };

  const completionPercent =
    POMODORO_GOAL > 0
      ? Math.min(100, Math.round((todayPomodoroCount / POMODORO_GOAL) * 100))
      : 0;

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
  const leadingBlanks = firstWeekday;
  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ type: 'blank', key: `b${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarYear}-${pad2(calendarMonth)}-${pad2(d)}`;
    cells.push({ type: 'day', key: `d${d}`, day: d, dateStr });
  }

  const progress = useMemo(() => {
    if (sessionSeconds <= 0) return 0;
    return Math.min(1, Math.max(0, (sessionSeconds - timeLeft) / sessionSeconds));
  }, [sessionSeconds, timeLeft]);

  const openDayDetail = async (dateStr) => {
    try {
      const records = await getTimeRecords(dateStr);
      const seconds = records.reduce((s, r) => s + r.duration, 0);
      const pomos = records.filter((r) => r.activity === '番茄钟').length;
      setDayModal({ dateStr, seconds, pomos, records });
    } catch (e) {
      console.error(e);
      showAlert('错误', '无法加载当日记录');
    }
  };

  const todayDateStr = todayStr();
  const chartWidth = Math.min(screenW - 40, 360);

  const webPressable = Platform.OS === 'web' ? { cursor: 'pointer' } : {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <Ionicons name="timer-outline" size={22} color={colors.primary} />
          <Text style={styles.heroTitle}>番茄钟</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{timerRunning ? '进行中' : '就绪'}</Text>
          </View>
        </View>

        <View style={[styles.ringWrap, { width: chartWidth, height: 160 }]}>
          <ProgressChart
            data={{
              labels: ['专注'],
              data: [progress],
            }}
            width={chartWidth}
            height={160}
            strokeWidth={14}
            radius={56}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
            }}
            hideLegend
          />
          <View style={styles.ringCenter} pointerEvents="none">
            <Text style={styles.ringTime}>{formatTime(timeLeft)}</Text>
            <Text style={styles.ringSub}>
              {timerRunning ? '剩余' : '单次'} · {sessionMinutes} 分钟
            </Text>
          </View>
        </View>

        <Text style={styles.presetLabel}>时长预设（分钟）</Text>
        <View style={styles.presetRow}>
          {PRESETS.map((p) => {
            const active = sessionMinutes === p.minutes;
            return (
              <TouchableOpacity
                key={p.minutes}
                style={[styles.presetChip, active && styles.presetChipActive, timerRunning && styles.presetDisabled]}
                onPress={() => applyPreset(p.minutes)}
                disabled={timerRunning}
                activeOpacity={0.75}
              >
                <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.timerButtons}>
          <TouchableOpacity
            style={[styles.timerBtn, styles.timerBtnPrimary, timerRunning && styles.timerBtnDanger]}
            onPress={toggleTimer}
            activeOpacity={0.85}
          >
            <Ionicons name={timerRunning ? 'pause' : 'play'} size={22} color="#fff" />
            <Text style={styles.timerBtnText}>{timerRunning ? '暂停' : '开始'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.timerBtn, styles.timerBtnSecondary]} onPress={resetTimer} activeOpacity={0.85}>
            <Ionicons name="refresh" size={22} color="#E65100" />
            <Text style={[styles.timerBtnText, styles.timerBtnTextOutline]}>重置</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionHeading}>时间统计</Text>
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statCard, webPressable]}
          onPress={() => setStatModal('today')}
          activeOpacity={0.8}
        >
          <View style={styles.statInner}>
            <Ionicons name="time-outline" size={28} color={colors.primary} />
            <Text style={styles.statValue}>{formatDurationShort(totalTime)}</Text>
            <Text style={styles.statLabel}>今日专注</Text>
            <Text style={styles.statTap}>点击查看</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, webPressable]}
          onPress={() => setStatModal('week')}
          activeOpacity={0.8}
        >
          <View style={styles.statInner}>
            <Ionicons name="calendar-outline" size={28} color="#2563EB" />
            <Text style={styles.statValue}>{formatDurationShort(weekSeconds)}</Text>
            <Text style={styles.statLabel}>近7日</Text>
            <Text style={styles.statTap}>点击查看</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, webPressable]}
          onPress={() => setStatModal('goal')}
          activeOpacity={0.8}
        >
          <View style={styles.statInner}>
            <Ionicons name="trophy-outline" size={28} color="#CA8A04" />
            <Text style={styles.statValue}>{completionPercent}%</Text>
            <Text style={styles.statLabel}>番茄完成率</Text>
            <Text style={styles.statTap}>点击查看</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>近7日专注（分钟）</Text>
        <BarChart
          data={weekChart}
          width={screenW - 48}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
        />
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeaderRow}>
          <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={12} style={webPressable}>
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {calendarYear}年{calendarMonth}月
          </Text>
          <TouchableOpacity onPress={() => shiftMonth(1)} hitSlop={12} style={webPressable}>
            <Ionicons name="chevron-forward" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.calendarHint}>点击日期查看当日专注明细</Text>
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
              <TouchableOpacity
                key={cell.key}
                style={[
                  styles.calendarDay,
                  cell.dateStr === todayDateStr && styles.calendarDayToday,
                  (monthFocusMap[cell.dateStr] || 0) > 0 && styles.calendarDayHot,
                ]}
                onPress={() => openDayDetail(cell.dateStr)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    cell.dateStr === todayDateStr && styles.calendarDayTextToday,
                    (monthFocusMap[cell.dateStr] || 0) > 0 && styles.calendarDayTextHot,
                  ]}
                >
                  {cell.day}
                </Text>
                {(monthFocusMap[cell.dateStr] || 0) > 0 ? <View style={styles.calendarDayDot} /> : null}
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <Modal visible={statModal != null} transparent animationType="fade" onRequestClose={() => setStatModal(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setStatModal(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {statModal === 'today' && '今日专注'}
              {statModal === 'week' && '近7日专注'}
              {statModal === 'goal' && '番茄完成率'}
            </Text>
            {statModal === 'today' && (
              <Text style={styles.modalBody}>
                今日累计专注 {formatDurationShort(totalTime)}。每次完成一轮番茄钟或中途重置并保存，都会计入统计。
              </Text>
            )}
            {statModal === 'week' && (
              <Text style={styles.modalBody}>
                最近 7 天（含今天）累计专注 {formatDurationShort(weekSeconds)}。柱状图展示每日分钟数，便于观察节奏。
              </Text>
            )}
            {statModal === 'goal' && (
              <Text style={styles.modalBody}>
                完成率 = 当日已完成番茄钟次数 ÷ 目标 {POMODORO_GOAL} 次。当前已完成 {todayPomodoroCount} 次，完成率{' '}
                {completionPercent}%。
              </Text>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setStatModal(null)}>
              <Text style={styles.modalCloseText}>知道了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={dayModal != null} transparent animationType="slide" onRequestClose={() => setDayModal(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDayModal(null)} />
          <View style={[styles.modalCard, styles.modalCardTall]}>
            {dayModal ? (
              <>
                <Text style={styles.modalTitle}>{dayModal.dateStr}</Text>
                <Text style={styles.modalMeta}>
                  总专注 {formatDurationShort(dayModal.seconds)} · 番茄记录 {dayModal.pomos} 次
                </Text>
                <ScrollView style={styles.dayList} nestedScrollEnabled>
                  {dayModal.records.length === 0 ? (
                    <Text style={styles.modalBody}>当日暂无记录</Text>
                  ) : (
                    dayModal.records.map((r, idx) => (
                      <View key={r.id != null ? String(r.id) : `${r.date}-${idx}`} style={styles.dayRow}>
                        <Text style={styles.dayActivity}>{r.activity}</Text>
                        <Text style={styles.dayDur}>{formatDurationShort(r.duration)}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>
                <TouchableOpacity style={styles.modalClose} onPress={() => setDayModal(null)}>
                  <Text style={styles.modalCloseText}>关闭</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 28,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radius.lg,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  heroTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  heroBadgeText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
  },
  ringWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTime: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary,
  },
  ringSub: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  presetLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  presetChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  presetDisabled: {
    opacity: 0.45,
  },
  presetChipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  presetChipTextActive: {
    color: colors.primaryDark,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  timerBtnPrimary: {
    backgroundColor: colors.primary,
  },
  timerBtnDanger: {
    backgroundColor: '#F44336',
  },
  timerBtnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  timerBtnTextOutline: {
    color: '#E65100',
  },
  sectionHeading: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  statInner: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 124,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statTap: {
    marginTop: 8,
    fontSize: 10,
    color: colors.primary,
  },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    marginLeft: 4,
  },
  chart: {
    marginVertical: 4,
    borderRadius: radius.md,
  },
  calendarCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  calendarHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 6,
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 11,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    maxWidth: '14.28%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  calendarDayHot: {
    backgroundColor: 'rgba(22, 163, 74, 0.06)',
  },
  calendarDayText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  calendarDayTextToday: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  calendarDayTextHot: {
    color: colors.primary,
    fontWeight: '600',
  },
  calendarDayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1,
    ...shadow.card,
  },
  modalCardTall: {
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  modalMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  modalClose: {
    marginTop: 18,
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
  },
  modalCloseText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 15,
  },
  dayList: {
    maxHeight: 220,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dayActivity: {
    color: colors.text,
    fontSize: 14,
  },
  dayDur: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TimeManagementScreen;
