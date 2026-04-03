import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'self_management_session_user_id';

let webCachedId = null;

export async function saveSessionUserId(userId) {
  const s = String(userId);
  if (Platform.OS === 'web') {
    webCachedId = s;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SESSION_KEY, s);
      }
    } catch (e) {
      console.warn('session storage failed', e);
    }
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, s);
}

export async function getSessionUserId() {
  if (Platform.OS === 'web') {
    if (webCachedId != null) {
      const n = parseInt(webCachedId, 10);
      return Number.isFinite(n) ? n : null;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        const v = localStorage.getItem(SESSION_KEY);
        if (v != null) {
          webCachedId = v;
          const n = parseInt(v, 10);
          return Number.isFinite(n) ? n : null;
        }
      }
    } catch (e) {
      console.warn('session read failed', e);
    }
    return null;
  }
  const v = await SecureStore.getItemAsync(SESSION_KEY);
  if (v == null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export async function clearSession() {
  if (Platform.OS === 'web') {
    webCachedId = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.warn('session clear failed', e);
    }
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
