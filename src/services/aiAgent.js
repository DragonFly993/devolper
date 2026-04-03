import { AI_TOOLS } from './aiToolDefinitions';
import { executeAiTool } from './aiToolExecutor';
import { getChatProxyUrl, getChatProxySecret } from '../config/env';

/** 阿里云 DashScope OpenAI 兼容接口（与 Python OpenAI SDK `base_url` + `/chat/completions` 一致） */
export const DASHSCOPE_COMPAT_CHAT_URL =
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export const DEFAULT_AI_MODEL = 'qwen-plus';

function systemPrompt() {
  const today = new Date().toISOString().split('T')[0];
  return `你是 小魔龙AI智能体自我管理 App 的智能助手。
当前日期：${today}。
原则：回答简洁、可执行，使用中文；不要编造未查询到的数据。`;
}

/**
 * @param {object} p
 * @param {string} [p.apiKey] 直连 DashScope 时必填；配置 EXPO_PUBLIC_CHAT_PROXY_URL 时可省略
 * @param {string} [p.model]
 * @param {Array} p.history - 不含 system：user / assistant / tool 的完整链
 * @param {string} p.userText
 * @returns {Promise<{ messages: Array, assistantText: string }>}
 */
export async function sendChatMessage({ apiKey, model = DEFAULT_AI_MODEL, history, userText }) {
  const proxyUrl = getChatProxyUrl();
  const useProxy = Boolean(proxyUrl && String(proxyUrl).trim());
  const key = String(apiKey || '').trim();
  if (!useProxy && !key) throw new Error('NO_API_KEY');

  const chatUrl = useProxy ? String(proxyUrl).trim() : DASHSCOPE_COMPAT_CHAT_URL;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (!useProxy) {
    headers.Authorization = `Bearer ${key}`;
  } else {
    const secret = getChatProxySecret();
    if (secret) {
      headers['x-app-secret'] = secret;
    }
  }

  let convo = [...history, { role: 'user', content: userText }];
  const maxRounds = 8;
  let round = 0;

  while (round < maxRounds) {
    round += 1;
    const lastMessages = [{ role: 'system', content: systemPrompt() }, ...convo];

    const res = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: lastMessages,
        tools: AI_TOOLS,
        tool_choice: 'auto',
        temperature: 0.6,
        max_tokens: 2048,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errObj = json?.error;
      const errMsg =
        (typeof errObj === 'string' ? errObj : errObj?.message) ||
        json?.message ||
        res.statusText ||
        '请求失败';
      throw new Error(`API_${res.status}: ${errMsg}`);
    }

    const choice = json.choices && json.choices[0];
    const msg = choice && choice.message;
    if (!msg) throw new Error('EMPTY_RESPONSE');

    const toolCalls = msg.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      convo.push({
        role: 'assistant',
        content: msg.content || null,
        tool_calls: toolCalls,
      });
      for (const call of toolCalls) {
        const fn = call.function;
        const name = fn && fn.name;
        const args = fn && fn.arguments;
        let result;
        try {
          result = await executeAiTool(name, args);
        } catch (e) {
          result = { ok: false, error: e && e.message ? String(e.message) : String(e) };
        }
        convo.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    const assistantText = msg.content != null ? String(msg.content).trim() : '';
    const text = assistantText || '好的。';
    convo.push({ role: 'assistant', content: text });
    return { messages: convo, assistantText: text };
  }

  throw new Error('TOOL_LOOP_LIMIT');
}
