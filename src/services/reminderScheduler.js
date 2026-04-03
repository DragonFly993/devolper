import { Platform } from 'react-native';
import { getReminders } from '../utils/database';
import { scheduleLocalNotification, sendInstantNotification } from './notificationService';

const timerMap = new Map();

function nextTrigger(reminder) {
  const now = Date.now();
  const base = new Date(reminder.remindAt).getTime();
  if (!Number.isFinite(base)) return null;
  if (reminder.repeatType === 'daily') {
    let t = base;
    while (t <= now) t += 24 * 60 * 60 * 1000;
    return t;
  }
  if (reminder.repeatType === 'weekly') {
    let t = base;
    while (t <= now) t += 7 * 24 * 60 * 60 * 1000;
    return t;
  }
  return base > now ? base : null;
}

function clearReminderTimer(id) {
  const old = timerMap.get(id);
  if (old) clearTimeout(old);
  timerMap.delete(id);
}

function scheduleWebReminder(reminder) {
  clearReminderTimer(reminder.id);
  const triggerAt = nextTrigger(reminder);
  if (!triggerAt) return;
  const delay = Math.max(0, triggerAt - Date.now());
  const tid = setTimeout(async () => {
    await sendInstantNotification({ title: reminder.title, body: reminder.body || '' });
    if (reminder.repeatType === 'daily' || reminder.repeatType === 'weekly') {
      scheduleWebReminder(reminder);
    } else {
      timerMap.delete(reminder.id);
    }
  }, delay);
  timerMap.set(reminder.id, tid);
}

export async function rescheduleAllReminders() {
  const reminders = await getReminders();
  reminders.forEach((r) => clearReminderTimer(r.id));
  for (const reminder of reminders) {
    if (!reminder.enabled) continue;
    if (Platform.OS === 'web') {
      scheduleWebReminder(reminder);
    } else {
      const triggerAt = nextTrigger(reminder);
      if (!triggerAt) continue;
      await scheduleLocalNotification({
        title: reminder.title,
        body: reminder.body || '',
        remindAt: new Date(triggerAt).toISOString(),
      });
    }
  }
}

export async function testReminderNow(reminder) {
  await sendInstantNotification({
    title: `[测试] ${reminder.title || '提醒'}`,
    body: reminder.body || '这是一条测试提醒',
  });
}
