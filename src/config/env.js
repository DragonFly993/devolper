/**
 * 构建时由 Expo/Metro 注入（见 .env.example）。
 * 勿在仓库中提交真实密钥；生产环境优先使用本机「保存密钥」。
 */

/** 服务端代理地址（完整 URL），设置后对话走 Netlify Function，用户无需配置 DashScope Key */
export function getChatProxyUrl() {
  try {
    const v =
      typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_CHAT_PROXY_URL
        ? String(process.env.EXPO_PUBLIC_CHAT_PROXY_URL).trim()
        : '';
    return v || null;
  } catch {
    return null;
  }
}

/** 与 Netlify 环境变量 APP_SHARED_SECRET 对应，用于简单防刷（可选） */
export function getChatProxySecret() {
  try {
    const v =
      typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_CHAT_PROXY_SECRET
        ? String(process.env.EXPO_PUBLIC_CHAT_PROXY_SECRET).trim()
        : '';
    return v || null;
  } catch {
    return null;
  }
}

export function isChatProxyMode() {
  return getChatProxyUrl() != null;
}

export function getPublicDashScopeKeyFromEnv() {
  try {
    const env = typeof process !== 'undefined' && process.env ? process.env : {};
    const dash = env.EXPO_PUBLIC_DASHSCOPE_API_KEY ? String(env.EXPO_PUBLIC_DASHSCOPE_API_KEY).trim() : '';
    if (dash) return dash;
    const legacy = env.EXPO_PUBLIC_OPENAI_API_KEY ? String(env.EXPO_PUBLIC_OPENAI_API_KEY).trim() : '';
    return legacy || null;
  } catch {
    return null;
  }
}

/** @deprecated 使用 getPublicDashScopeKeyFromEnv */
export function getPublicOpenAiKeyFromEnv() {
  return getPublicDashScopeKeyFromEnv();
}
