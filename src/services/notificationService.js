import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { saveNotificationToken } from '../utils/database';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerNotificationToken() {
  const granted = await requestNotificationPermission();
  if (!granted) return null;
  if (Platform.OS === 'web') {
    const token = `web-notification-${Date.now()}`;
    await saveNotificationToken({ platform: 'web', token });
    return token;
  }
  const tokenRes = await Notifications.getExpoPushTokenAsync();
  const token = tokenRes?.data || null;
  if (token) {
    await saveNotificationToken({ platform: Platform.OS, token });
  }
  return token;
}

export async function sendInstantNotification({ title, body }) {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission !== 'granted') return false;
    // 浏览器端本地通知
    // eslint-disable-next-line no-new
    new Notification(title || '提醒', { body: body || '' });
    return true;
  }
  await Notifications.scheduleNotificationAsync({
    content: { title: title || '提醒', body: body || '' },
    trigger: null,
  });
  return true;
}

export async function scheduleLocalNotification({ title, body, remindAt }) {
  const date = new Date(remindAt);
  if (!Number.isFinite(date.getTime())) throw new Error('INVALID_DATE');
  if (Platform.OS === 'web') return null;
  return Notifications.scheduleNotificationAsync({
    content: { title: title || '提醒', body: body || '' },
    trigger: date,
  });
}

export function subscribeForegroundNotifications(handler) {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationReceivedListener((event) => {
    if (typeof handler === 'function') handler(event);
  });
  return () => {
    sub.remove();
  };
}
