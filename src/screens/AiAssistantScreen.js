import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getOpenAiApiKey } from '../auth/aiApiKey';
import { getPublicDashScopeKeyFromEnv, isChatProxyMode } from '../config/env';
import { sendChatMessage, DEFAULT_AI_MODEL } from '../services/aiAgent';
import { colors } from '../theme/tokens';

function buildWelcomeText() {
  if (isChatProxyMode()) {
    return '你好，我是 小魔龙AI智能体自我管理 App 的智能助手。当前已启用服务端代理，可直接对话；我可以根据你的授权查询或记录任务、习惯、支出等本地数据。';
  }
  if (getPublicDashScopeKeyFromEnv()) {
    return '你好，我是 小魔龙AI智能体自我管理 App 的智能助手。当前已使用开发环境变量中的 DashScope 密钥，可直接对话；我可以根据你的授权查询或记录任务、习惯、支出等本地数据。';
  }
  return '你好，我是 小魔龙AI智能体自我管理 App 的智能助手。我可以根据你的授权查询或记录任务、习惯、支出等本地数据。';
}

export default function AiAssistantScreen() {
  const navigation = useNavigation();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_AI_MODEL);
  const [input, setInput] = useState('');
  const [rows, setRows] = useState([{ id: 'welcome', role: 'assistant', text: buildWelcomeText() }]);
  const [apiHistory, setApiHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const proxyMode = isChatProxyMode();

  useEffect(() => {
    if (proxyMode) return;
    (async () => {
      const k = await getOpenAiApiKey();
      if (k) {
        setApiKey(k);
        return;
      }
      const fromEnv = getPublicDashScopeKeyFromEnv();
      if (fromEnv) {
        setApiKey(fromEnv);
      }
    })();
  }, [proxyMode]);

  const clearChat = useCallback(() => {
    Alert.alert('清空对话', '确定清空当前对话记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: () => {
          setRows([{ id: 'welcome', role: 'assistant', text: buildWelcomeText() }]);
          setApiHistory([]);
        },
      },
    ]);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={clearChat} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, clearChat]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const k = apiKey.trim() || (getPublicDashScopeKeyFromEnv() || '');
    if (!proxyMode && !k) {
      Alert.alert('服务未配置', '当前服务端未配置 AI 代理，请联系管理员。');
      return;
    }

    const uid = String(Date.now());
    setRows((r) => [...r, { id: `u-${uid}`, role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const { messages, assistantText } = await sendChatMessage({
        apiKey: proxyMode ? '' : k,
        model: model.trim() || DEFAULT_AI_MODEL,
        history: apiHistory,
        userText: text,
      });
      setApiHistory(messages);
      setRows((r) => [...r, { id: `a-${Date.now()}`, role: 'assistant', text: assistantText }]);
    } catch (e) {
      const msg = e && e.message ? String(e.message) : '发送失败';
      if (msg === 'NO_API_KEY') {
        Alert.alert('错误', '未配置 API Key');
      } else if (msg === 'TOOL_LOOP_LIMIT') {
        Alert.alert('错误', '工具调用次数过多，请简化问题后重试');
      } else {
        Alert.alert('请求失败', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapAi]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAi]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {loading ? (
          <View style={styles.loadingBar}>
            <ActivityIndicator color={colors.primary} size="small" style={{ marginRight: 8 }} />
            <Text style={styles.loadingText}>思考中…</Text>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="输入消息，例如：我今天有多少待办？"
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={4000}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  headerBtn: { padding: 8, marginRight: 4 },
  keySection: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  keyLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  proxyBanner: {
    fontSize: 13,
    color: '#2E7D32',
    marginBottom: 10,
    lineHeight: 20,
  },
  modelInputFull: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#333',
  },
  keyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#333',
  },
  keyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  modelInput: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    fontSize: 13,
    color: '#333',
  },
  saveKeyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveKeyText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  keyHint: { fontSize: 11, color: '#999', marginTop: 6 },
  keyWarn: { fontSize: 11, color: '#E65100', marginTop: 6 },
  linkBtn: { marginTop: 8, alignSelf: 'flex-start', paddingVertical: 4 },
  linkBtnText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  listContent: { padding: 12, paddingBottom: 8 },
  bubbleWrap: { marginBottom: 10, flexDirection: 'row' },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  bubbleWrapAi: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '88%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  bubbleUser: { backgroundColor: colors.primary },
  bubbleAi: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8e8e8' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAi: { color: '#333' },
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  loadingText: { fontSize: 13, color: '#666' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  chatInput: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
