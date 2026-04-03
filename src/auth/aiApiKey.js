import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** 阿里云 DashScope（通义千问）API Key */
const KEY_DASHSCOPE = 'traebuild_dashscope_api_key';
/** 历史：曾存 OpenAI Key，读取时兼容迁移 */
const KEY_LEGACY_OPENAI = 'traebuild_openai_api_key';

async function secureGet(key) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        const v = localStorage.getItem(key);
        return v && String(v).trim() ? String(v).trim() : null;
      }
    } catch (e) {
      console.warn('ai key read failed', e);
    }
    return null;
  }
  const v = await SecureStore.getItemAsync(key);
  return v && String(v).trim() ? String(v).trim() : null;
}

async function secureSet(key, value) {
  const s = value != null ? String(value).trim() : '';
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        if (s) localStorage.setItem(key, s);
        else localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('ai key save failed', e);
    }
    return;
  }
  if (s) await SecureStore.setItemAsync(key, s);
  else await SecureStore.deleteItemAsync(key);
}

export async function saveOpenAiApiKey(value) {
  const s = value != null ? String(value).trim() : '';
  if (!s) {
    await secureSet(KEY_DASHSCOPE, null);
    await secureSet(KEY_LEGACY_OPENAI, null);
    return;
  }
  await secureSet(KEY_DASHSCOPE, s);
  await secureSet(KEY_LEGACY_OPENAI, null);
}

export async function getOpenAiApiKey() {
  const primary = await secureGet(KEY_DASHSCOPE);
  if (primary) return primary;
  const legacy = await secureGet(KEY_LEGACY_OPENAI);
  return legacy;
}
